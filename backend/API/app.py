from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pymysql
import os
import PyPDF2
import json
import openai
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Konfiguration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', 'dein-openai-api-key')  # Setze deinen API-Key

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

openai.api_key = OPENAI_API_KEY


def get_db_connection():
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='hello1234',
        database='TalentBridgeDB'
    )
    return connection


@app.route('/', methods=['GET'])
def home():
    return "Welcome to the TalentBridge API"


@app.route('/employees', methods=['GET'])
def get_employees():
    connection = get_db_connection()
    cursor = connection.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT * FROM mitarbeiter")
    employees = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(employees)


# Hilfsfunktion für PDF-Verarbeitung
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# API-Endpunkt für Mitarbeitersuche
@app.route('/api/search', methods=['GET'])
def search_employees():
    query = request.args.get('query', '')

    if not query:
        return jsonify([])

    connection = get_db_connection()
    cursor = connection.cursor(pymysql.cursors.DictCursor)

    # Suche nach Mitarbeitern basierend auf Namen, Fähigkeiten oder Abteilung
    sql = """
    SELECT m.mitarbeiter_id as id, 
           CONCAT(m.vorname, ' ', m.nachname) as name, 
           m.email, 
           m.faehigkeiten as skills, 
           a.name as department
    FROM mitarbeiter m
    LEFT JOIN abteilungen a ON m.abteilungs_id = a.abteilungs_id
    WHERE m.vorname LIKE %s 
    OR m.nachname LIKE %s 
    OR m.faehigkeiten LIKE %s 
    OR a.name LIKE %s
    """

    search_param = f'%{query}%'
    cursor.execute(sql, (search_param, search_param, search_param, search_param))
    employees = cursor.fetchall()

    # Konvertiere die Fähigkeiten von String zu Liste
    for emp in employees:
        if emp['skills']:
            emp['skills'] = [skill.strip() for skill in emp['skills'].split(',')]
        else:
            emp['skills'] = []

        # Füge Platzhalter für fehlende Felder hinzu
        emp['position'] = "Mitarbeiter"  # Standardwert, da nicht in deiner DB
        emp['phone'] = "N/A"  # Nicht in deiner DB
        emp['location'] = "N/A"  # Nicht in deiner DB
        emp['experience'] = 0  # Nicht in deiner DB
        emp['avatar'] = f"/placeholder.svg?height=100&width=100&text={emp['name'][0]}"

    cursor.close()
    connection.close()
    return jsonify(employees)


# API-Endpunkt für PDF-Upload
@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'Keine Datei hochgeladen'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Keine Datei ausgewählt'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # PDF-Text extrahieren
        text = extract_text_from_pdf(filepath)

        # Optional: Speichere die PDF in der Datenbank
        connection = get_db_connection()
        cursor = connection.cursor()

        try:
            with open(filepath, 'rb') as pdf_file:
                pdf_content = pdf_file.read()

            # Speichere in der pdf_data Tabelle
            sql = """
            INSERT INTO pdf_data (dateiname, speicherort, inhalt)
            VALUES (%s, %s, %s)
            """
            cursor.execute(sql, (filename, filepath, pdf_content))
            connection.commit()
            pdf_id = cursor.lastrowid

            cursor.close()
            connection.close()

            return jsonify({
                'success': True,
                'filename': filename,
                'pdf_id': pdf_id,
                'message': 'PDF erfolgreich hochgeladen und analysiert'
            })

        except Exception as e:
            cursor.close()
            connection.close()
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Ungültiges Dateiformat'}), 400


# PDF-Text extrahieren
def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
    return text


# API-Endpunkt für KI-Chat
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    history = data.get('history', [])
    filename = data.get('filename')

    if not message:
        return jsonify({'error': 'Keine Nachricht gesendet'}), 400

    # Wenn eine PDF-Datei angegeben ist, verwende den PDF-Kontext
    if filename:
        response = query_with_pdf_context(message, history, filename)
    else:
        # Sonst verwende die Datenbank für Mitarbeiterinformationen
        response = query_with_db_context(message, history)

    return jsonify({'response': response})


# PDF-Kontext für die Anfrage verwenden
def query_with_pdf_context(message, history, filename):
    # Finde die PDF in der Datenbank
    connection = get_db_connection()
    cursor = connection.cursor(pymysql.cursors.DictCursor)

    sql = "SELECT speicherort FROM pdf_data WHERE dateiname = %s"
    cursor.execute(sql, (filename,))
    result = cursor.fetchone()

    cursor.close()
    connection.close()

    if not result:
        return "Die angegebene PDF-Datei konnte nicht gefunden werden."

    # Extrahiere Text aus der PDF
    pdf_path = result['speicherort']
    pdf_text = extract_text_from_pdf(pdf_path)

    # Bereite den Prompt für OpenAI vor
    prompt = f"""
    Basierend auf der folgenden PDF-Datei und der Benutzeranfrage, gib eine hilfreiche Antwort:

    PDF-Inhalt:
    {pdf_text[:4000]}... (gekürzt)

    Benutzeranfrage: {message}

    Gib eine präzise und hilfreiche Antwort basierend auf den Informationen in der PDF.
    """

    # Sende Anfrage an OpenAI
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Du bist ein hilfreicher Assistent für ein Talentmanagementsystem."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API Fehler: {str(e)}")
        return "Es ist ein Fehler bei der Verarbeitung Ihrer Anfrage aufgetreten. Bitte versuchen Sie es später erneut."


# Datenbank-Kontext für die Anfrage verwenden
def query_with_db_context(message, history):
    # Hole relevante Daten aus der Datenbank
    connection = get_db_connection()
    cursor = connection.cursor(pymysql.cursors.DictCursor)

    # Extrahiere mögliche Suchbegriffe aus der Nachricht
    try:
        extraction_prompt = f"""
        Extrahiere relevante Suchbegriffe aus der folgenden Benutzeranfrage für eine Mitarbeiterdatenbank:

        Anfrage: {message}

        Gib nur die wichtigsten Suchbegriffe zurück, getrennt durch Kommas. Wenn keine spezifischen Begriffe erkennbar sind, gib 'allgemein' zurück.
        """

        extraction_response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Du bist ein Assistent, der Suchbegriffe extrahiert."},
                {"role": "user", "content": extraction_prompt}
            ]
        )

        search_terms = extraction_response.choices[0].message.content.strip()

        if search_terms.lower() == 'allgemein':
            # Hole allgemeine Informationen
            cursor.execute("SELECT COUNT(*) as count FROM mitarbeiter")
            employee_count = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM abteilungen")
            department_count = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM projekte")
            project_count = cursor.fetchone()['count']

            db_context = f"""
            Allgemeine Informationen:
            - Anzahl Mitarbeiter: {employee_count}
            - Anzahl Abteilungen: {department_count}
            - Anzahl Projekte: {project_count}
            """
        else:
            # Suche nach spezifischen Begriffen
            search_terms_list = [term.strip() for term in search_terms.split(',')]
            search_conditions = []
            search_params = []

            for term in search_terms_list:
                search_conditions.append(
                    "m.vorname LIKE %s OR m.nachname LIKE %s OR m.faehigkeiten LIKE %s OR a.name LIKE %s")
                search_params.extend([f'%{term}%', f'%{term}%', f'%{term}%', f'%{term}%'])

            sql = f"""
            SELECT m.mitarbeiter_id, 
                   CONCAT(m.vorname, ' ', m.nachname) as name, 
                   m.email, 
                   m.faehigkeiten, 
                   a.name as abteilung
            FROM mitarbeiter m
            LEFT JOIN abteilungen a ON m.abteilungs_id = a.abteilungs_id
            WHERE {" OR ".join(search_conditions)}
            LIMIT 5
            """

            cursor.execute(sql, search_params)
            employees = cursor.fetchall()

            if employees:
                db_context = "Gefundene Mitarbeiter:\n"
                for emp in employees:
                    db_context += f"""
                    - Name: {emp['name']}
                    - Email: {emp['email']}
                    - Abteilung: {emp['abteilung'] or 'Nicht zugewiesen'}
                    - Fähigkeiten: {emp['faehigkeiten'] or 'Keine angegeben'}

                    """
            else:
                db_context = "Es wurden keine Mitarbeiter gefunden, die den Suchkriterien entsprechen."

    except Exception as e:
        print(f"Fehler bei der Extraktion von Suchbegriffen: {str(e)}")
        db_context = "Es konnten keine relevanten Informationen aus der Datenbank abgerufen werden."

    cursor.close()
    connection.close()

    # Bereite den Prompt für OpenAI vor
    prompt = f"""
    Basierend auf der folgenden Benutzeranfrage und den Datenbankinformationen, gib eine hilfreiche Antwort:

    Benutzeranfrage: {message}

    Datenbankinformationen:
    {db_context}

    Gib eine präzise und hilfreiche Antwort basierend auf den verfügbaren Informationen.
    """

    # Sende Anfrage an OpenAI
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Du bist ein hilfreicher Assistent für ein Talentmanagementsystem."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API Fehler: {str(e)}")
        return "Es ist ein Fehler bei der Verarbeitung Ihrer Anfrage aufgetreten. Bitte versuchen Sie es später erneut."


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
