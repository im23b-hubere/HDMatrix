from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import json
import PyPDF2
import docx
from typing import List, Dict, Any
import re
import uuid

app = Flask(__name__)
# Erweiterte CORS-Konfiguration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:3002"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True
    }
})

# Konfiguriere Logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Konfiguration
UPLOAD_FOLDER = 'uploads/cvs'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Stelle sicher, dass der Upload-Ordner existiert
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Datenbank-Konfiguration
DB_CONFIG = {
    'dbname': 'TalentBridgeDB',
    'user': 'postgres',
    'password': 'hello1234',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Datenbankverbindungsfehler: {str(e)}")
        raise

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/pdf/extract-text', methods=['POST', 'OPTIONS'])
def extract_text_from_upload():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        logger.info("PDF-Extraktionsanfrage empfangen")
        if 'file' not in request.files:
            logger.error("Keine Datei in der Anfrage")
            return jsonify({'error': 'Keine Datei hochgeladen'}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error("Leerer Dateiname")
            return jsonify({'error': 'Keine Datei ausgewählt'}), 400
        
        if not allowed_file(file.filename):
            logger.error(f"Nicht erlaubter Dateityp: {file.filename}")
            return jsonify({'error': 'Nicht unterstütztes Dateiformat'}), 400

        logger.info(f"Verarbeite Datei: {file.filename}")
        # Speichere die Datei temporär
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Extrahiere Text basierend auf Dateityp
        if filename.endswith('.pdf'):
            logger.info("Extrahiere Text aus PDF")
            text = extract_text_from_pdf(filepath)
        elif filename.endswith(('.doc', '.docx')):
            logger.info("Extrahiere Text aus DOCX")
            text = extract_text_from_docx(filepath)
        else:
            logger.error(f"Nicht unterstütztes Dateiformat: {filename}")
            return jsonify({'error': 'Nicht unterstütztes Dateiformat'}), 400

        # Lösche die temporäre Datei
        os.remove(filepath)
        logger.info("Textextraktion erfolgreich abgeschlossen")

        return jsonify({'text': text})

    except Exception as e:
        logger.error(f"Fehler bei der Textextraktion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/employees/search', methods=['GET'])
def search_employees():
    try:
        skills = request.args.get('skills', '').split(',')
        skills = [skill.strip() for skill in skills if skill.strip()]
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Erweiterte Suche mit allen relevanten Informationen
        query = """
        SELECT 
            m.*,
            array_agg(DISTINCT p.projektname) as projekte,
            array_agg(DISTINCT w.thema) as weiterbildungen,
            array_agg(DISTINCT b.kategorie) as bewertungskategorien,
            array_agg(DISTINCT b.punkte) as bewertungspunkte
        FROM Mitarbeiter m
        LEFT JOIN Projekterfahrungen p ON m.id = p.mitarbeiter_id
        LEFT JOIN Weiterbildungen w ON m.id = w.mitarbeiter_id
        LEFT JOIN Bewertungen b ON m.id = b.mitarbeiter_id
        WHERE EXISTS (
            SELECT 1 FROM unnest(m.skills) s
            WHERE s ILIKE ANY(%s)
        )
        GROUP BY m.id
        """
        
        cur.execute(query, (skills,))
        results = cur.fetchall()
        
        # Formatiere die Ergebnisse
        employees = []
        for row in results:
            employee = {
                'id': row['id'],
                'vorname': row['vorname'],
                'nachname': row['nachname'],
                'position': row['position'],
                'abteilung_id': row['abteilung_id'],
                'email': row['email'],
                'skills': row['skills'],
                'projekte': row['projekte'],
                'weiterbildungen': row['weiterbildungen'],
                'bewertungen': dict(zip(row['bewertungskategorien'], row['bewertungspunkte']))
            }
            employees.append(employee)
        
        cur.close()
        conn.close()
        
        return jsonify(employees)
        
    except Exception as e:
        logger.error(f"Fehler bei der Mitarbeitersuche: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/employees/<int:employee_id>', methods=['GET'])
def get_employee_details(employee_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Hole alle Details eines Mitarbeiters
        query = """
        SELECT 
            m.*,
            json_agg(DISTINCT jsonb_build_object(
                'id', p.id,
                'projektname', p.projektname,
                'rolle', p.rolle,
                'start_datum', p.start_datum,
                'end_datum', p.end_datum,
                'beschreibung', p.beschreibung,
                'technologien', p.verwendete_technologien
            )) as projekterfahrungen,
            json_agg(DISTINCT jsonb_build_object(
                'id', w.id,
                'thema', w.thema,
                'anbieter', w.anbieter,
                'datum', w.datum,
                'zertifikat', w.zertifikat,
                'beschreibung', w.beschreibung
            )) as weiterbildungen,
            json_agg(DISTINCT jsonb_build_object(
                'id', b.id,
                'kategorie', b.kategorie,
                'punkte', b.punkte,
                'kommentar', b.kommentar,
                'datum', b.datum
            )) as bewertungen
        FROM Mitarbeiter m
        LEFT JOIN Projekterfahrungen p ON m.id = p.mitarbeiter_id
        LEFT JOIN Weiterbildungen w ON m.id = w.mitarbeiter_id
        LEFT JOIN Bewertungen b ON m.id = b.mitarbeiter_id
        WHERE m.id = %s
        GROUP BY m.id
        """
        
        cur.execute(query, (employee_id,))
        result = cur.fetchone()
        
        if result:
            employee = {
                'id': result['id'],
                'vorname': result['vorname'],
                'nachname': result['nachname'],
                'position': result['position'],
                'abteilung_id': result['abteilung_id'],
                'email': result['email'],
                'skills': result['skills'],
                'projekterfahrungen': result['projekterfahrungen'],
                'weiterbildungen': result['weiterbildungen'],
                'bewertungen': result['bewertungen']
            }
        else:
            employee = None
        
        cur.close()
        conn.close()
        
        return jsonify(employee)
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Mitarbeiterdetails: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/skills', methods=['GET'])
def get_skills():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Hole alle einzigartigen Skills aus allen relevanten Tabellen
        query = """
        SELECT DISTINCT unnest(skills) as skill
        FROM Mitarbeiter
        UNION
        SELECT DISTINCT unnest(verwendete_technologien)
        FROM Projekterfahrungen
        WHERE verwendete_technologien IS NOT NULL
        ORDER BY skill
        """
        
        cur.execute(query)
        results = cur.fetchall()
        
        skills = [row['skill'] for row in results]
        
        cur.close()
        conn.close()
        
        return jsonify(skills)
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Skills: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/employees', methods=['POST'])
def create_employee():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        INSERT INTO Mitarbeiter (
            vorname, nachname, position, abteilung_id, email, skills,
            geburtsdatum, eintrittsdatum, ausbildungsgrad, sprachen, zertifikate
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """
        
        cur.execute(query, (
            data['vorname'], data['nachname'], data['position'],
            data['abteilung_id'], data['email'], data['skills'],
            data.get('geburtsdatum'), data.get('eintrittsdatum'),
            data.get('ausbildungsgrad'), data.get('sprachen'),
            data.get('zertifikate')
        ))
        
        employee_id = cur.fetchone()['id']
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'id': employee_id, 'message': 'Mitarbeiter erfolgreich erstellt'})
        
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Mitarbeiters: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/employees/<int:employee_id>/cv', methods=['POST'])
def upload_cv(employee_id):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Keine Datei hochgeladen'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Keine Datei ausgewählt'}), 400
            
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{employee_id}_{file.filename}")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute(
                "UPDATE Mitarbeiter SET cv_path = %s WHERE id = %s",
                (filepath, employee_id)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return jsonify({'message': 'CV erfolgreich hochgeladen'})
            
        return jsonify({'error': 'Nicht erlaubter Dateityp'}), 400
        
    except Exception as e:
        logger.error(f"Fehler beim CV-Upload: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/employees/<int:employee_id>/cv', methods=['GET'])
def get_cv(employee_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT cv_path FROM Mitarbeiter WHERE id = %s", (employee_id,))
        result = cur.fetchone()
        
        if not result or not result[0]:
            return jsonify({'error': 'CV nicht gefunden'}), 404
            
        return send_file(result[0])
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen des CVs: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/employees/search/advanced', methods=['GET'])
def advanced_search():
    try:
        params = request.args
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT DISTINCT m.*,
            array_agg(DISTINCT p.projektname) as projekte,
            array_agg(DISTINCT w.thema) as weiterbildungen,
            array_agg(DISTINCT b.kategorie) as bewertungskategorien,
            array_agg(DISTINCT b.punkte) as bewertungspunkte
        FROM Mitarbeiter m
        LEFT JOIN Projekterfahrungen p ON m.id = p.mitarbeiter_id
        LEFT JOIN Weiterbildungen w ON m.id = w.mitarbeiter_id
        LEFT JOIN Bewertungen b ON m.id = b.mitarbeiter_id
        WHERE 1=1
        """
        
        conditions = []
        values = []
        
        if params.get('skills'):
            skills = params.get('skills').split(',')
            conditions.append("EXISTS (SELECT 1 FROM unnest(m.skills) s WHERE s ILIKE ANY(%s))")
            values.append(skills)
            
        if params.get('abteilung_id'):
            conditions.append("m.abteilung_id = %s")
            values.append(params.get('abteilung_id'))
            
        if params.get('min_experience'):
            conditions.append("EXISTS (SELECT 1 FROM Projekterfahrungen p WHERE p.mitarbeiter_id = m.id AND p.start_datum <= NOW() - INTERVAL '%s years')")
            values.append(params.get('min_experience'))
            
        if params.get('project_type'):
            conditions.append("EXISTS (SELECT 1 FROM Projekterfahrungen p WHERE p.mitarbeiter_id = m.id AND p.projektname ILIKE %s)")
            values.append(f"%{params.get('project_type')}%")
            
        if conditions:
            query += " AND " + " AND ".join(conditions)
            
        query += " GROUP BY m.id"
        
        cur.execute(query, values)
        results = cur.fetchall()
        
        employees = []
        for row in results:
            employee = {
                'id': row['id'],
                'vorname': row['vorname'],
                'nachname': row['nachname'],
                'position': row['position'],
                'abteilung_id': row['abteilung_id'],
                'email': row['email'],
                'skills': row['skills'],
                'projekte': row['projekte'],
                'weiterbildungen': row['weiterbildungen'],
                'bewertungen': dict(zip(row['bewertungskategorien'], row['bewertungspunkte']))
            }
            employees.append(employee)
        
        cur.close()
        conn.close()
        
        return jsonify(employees)
        
    except Exception as e:
        logger.error(f"Fehler bei der erweiterten Suche: {str(e)}")
        return jsonify({'error': str(e)}), 500

def extract_text_from_pdf(filepath: str) -> str:
    try:
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
    except Exception as e:
        logger.error(f"Fehler beim PDF-Extrahieren: {str(e)}")
        return ""

def extract_text_from_docx(filepath: str) -> str:
    try:
        doc = docx.Document(filepath)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        logger.error(f"Fehler beim DOCX-Extrahieren: {str(e)}")
        return ""

def analyze_cv_text(text: str) -> Dict[str, Any]:
    # Persönliche Informationen extrahieren
    personal_info = {}
    
    # Name extrahieren (erste Zeile oder nach bestimmten Mustern suchen)
    name_patterns = [
        r'^([A-Za-zäöüÄÖÜß]+(?:\s[A-Za-zäöüÄÖÜß-]+)*)\s*$',  # Erste Zeile
        r'Name:\s*([A-Za-zäöüÄÖÜß]+(?:\s[A-Za-zäöüÄÖÜß-]+)*)',  # Nach "Name:"
        r'Vor-\s*und\s*Nachname:\s*([A-Za-zäöüÄÖÜß]+(?:\s[A-Za-zäöüÄÖÜß-]+)*)'  # Nach "Vor- und Nachname:"
    ]
    
    for pattern in name_patterns:
        name_match = re.search(pattern, text, re.MULTILINE)
        if name_match:
            full_name = name_match.group(1).strip()
            name_parts = full_name.split()
            if len(name_parts) > 1:
                personal_info['firstName'] = name_parts[0]
                personal_info['lastName'] = ' '.join(name_parts[1:])
            break

    # Email extrahieren
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        personal_info['email'] = email_match.group(0)

    # Telefonnummer extrahieren
    phone_patterns = [
        r'(?:Telefon|Tel|Mobil|Phone)[\s:]*([+\d\s\-()]+)',
        r'[+\d][\d\s\-()]{10,}',
    ]
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            phone = re.sub(r'\s+', ' ', phone_match.group(1) if 'group(1)' in str(phone_match) else phone_match.group(0))
            personal_info['phone'] = phone.strip()
            break

    # Titel/Position extrahieren
    title_patterns = [
        r'(?:Position|Titel|Beruf|Stelle):\s*([^\n]+)',
        r'^([A-Za-zäöüÄÖÜß\s\-]+(?:entwickler|ingenieur|architekt|berater|manager|consultant|analyst|specialist|expert|professional))\s*$'
    ]
    for pattern in title_patterns:
        title_match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
        if title_match:
            personal_info['title'] = title_match.group(1).strip()
            break

    # Zusammenfassung/Profil extrahieren
    summary_patterns = [
        r'(?:Profil|Zusammenfassung|Über mich|About|Summary):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)',
        r'(?:Beruflicher Werdegang|Berufserfahrung):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)'
    ]
    for pattern in summary_patterns:
        summary_match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
        if summary_match:
            personal_info['summary'] = summary_match.group(1).strip()
            break

    # Skills extrahieren
    skills = set()  # Verwende ein Set für eindeutige Skills
    
    # Technische Skills und Frameworks
    tech_skills = [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'C#', 'C++', 'Ruby', 'PHP', 'Swift',
        'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
        'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'Jenkins', 'CI/CD',
        'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
        'HTML', 'CSS', 'SASS', 'Bootstrap', 'Material-UI', 'Tailwind',
        'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence'
    ]
    
    # Suche nach Skills in verschiedenen Kontexten
    skill_sections = [
        r'(?:Kenntnisse|Skills|Fähigkeiten|Kompetenzen|Technologies|Technologien):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)',
        r'(?:Technical Skills|Technische Fähigkeiten):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)',
        r'(?:Programmiersprachen|Programming Languages):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)'
    ]
    
    # Extrahiere Skills aus spezifischen Abschnitten
    for pattern in skill_sections:
        section_match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
        if section_match:
            section_text = section_match.group(1)
            # Suche nach bekannten Skills im Abschnitt
            for skill in tech_skills:
                if re.search(rf'\b{re.escape(skill)}\b', section_text, re.IGNORECASE):
                    skills.add(skill)
    
    # Suche auch im gesamten Text nach Skills
    for skill in tech_skills:
        if re.search(rf'\b{re.escape(skill)}\b', text, re.IGNORECASE):
            skills.add(skill)

    # Berufserfahrung extrahieren
    experience = []
    experience_pattern = r'(\d{4})\s*-\s*(\d{4}|heute|present|aktuell|now|gegenwärtig|current)\s*(?::|,|\s)\s*([^.!?\n]+[.!?\n])'
    
    for match in re.finditer(experience_pattern, text, re.IGNORECASE):
        start_year = match.group(1)
        end_year = match.group(2)
        if end_year.lower() in ['heute', 'present', 'aktuell', 'now', 'gegenwärtig', 'current']:
            end_year = '2024'  # Aktuelles Jahr
        description = match.group(3).strip()
        
        # Versuche, die Position/Firma zu extrahieren
        position_company_match = re.match(r'([^@|]+)(?:@|bei|at|für|for)?\s*([^,]+)', description)
        if position_company_match:
            position = position_company_match.group(1).strip()
            company = position_company_match.group(2).strip()
            description = f"{position} bei {company}"
        
        experience.append({
            'start_year': start_year,
            'end_year': end_year,
            'description': description
        })

    # Ausbildung extrahieren
    education = []
    education_pattern = r'(\d{4})\s*-\s*(\d{4}|heute|present|aktuell)\s*(?::|,|\s)\s*([^.!?\n]+(?:Universität|Hochschule|Ausbildung|Bachelor|Master|Diplom|Studium|University|College|School)[^.!?\n]*[.!?\n])'
    
    for match in re.finditer(education_pattern, text, re.IGNORECASE):
        education.append({
            'start_year': match.group(1),
            'end_year': match.group(2) if match.group(2).lower() not in ['heute', 'present', 'aktuell'] else '2024',
            'degree': match.group(3).strip()
        })

    return {
        'personalInfo': personal_info,
        'skills': list(skills),
        'experience': experience,
        'education': education
    }

@app.route('/api/employees/<int:employee_id>/cv/analyze', methods=['POST'])
def analyze_cv(employee_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Hole CV-Pfad
        cur.execute("SELECT cv_path FROM Mitarbeiter WHERE id = %s", (employee_id,))
        result = cur.fetchone()
        
        if not result or not result[0]:
            return jsonify({'error': 'CV nicht gefunden'}), 404
            
        filepath = result[0]
        file_extension = filepath.split('.')[-1].lower()
        
        # Extrahiere Text basierend auf Dateityp
        if file_extension == 'pdf':
            text = extract_text_from_pdf(filepath)
        elif file_extension in ['doc', 'docx']:
            text = extract_text_from_docx(filepath)
        else:
            return jsonify({'error': 'Nicht unterstützter Dateityp'}), 400
        
        # Analysiere Text
        analysis = analyze_cv_text(text)
        
        # Aktualisiere Mitarbeiterinformationen
        cur.execute("""
            UPDATE Mitarbeiter 
            SET skills = %s,
                ausbildungsgrad = %s
            WHERE id = %s
        """, (
            analysis['skills'],
            analysis['education'][0]['degree'] if analysis['education'] else None,
            employee_id
        ))
        
        # Speichere Projekterfahrungen
        for exp in analysis['experience']:
            cur.execute("""
                INSERT INTO Projekterfahrungen (
                    mitarbeiter_id, start_datum, end_datum, beschreibung
                ) VALUES (%s, %s, %s, %s)
            """, (
                employee_id,
                f"{exp['start_year']}-01-01",
                f"{exp['end_year']}-12-31" if exp['end_year'] != 'heute' else None,
                exp['description']
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'CV erfolgreich analysiert',
            'analysis': analysis
        })
        
    except Exception as e:
        logger.error(f"Fehler bei der CV-Analyse: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects', methods=['POST'])
def create_project():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        INSERT INTO Projekterfahrungen (
            mitarbeiter_id, projektname, rolle, start_datum, end_datum,
            beschreibung, verwendete_technologien
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """
        
        cur.execute(query, (
            data['mitarbeiter_id'],
            data['projektname'],
            data['rolle'],
            data['start_datum'],
            data.get('end_datum'),
            data.get('beschreibung'),
            data.get('verwendete_technologien')
        ))
        
        project_id = cur.fetchone()['id']
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'id': project_id, 'message': 'Projekt erfolgreich erstellt'})
        
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Projekts: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/training', methods=['POST'])
def create_training():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        INSERT INTO Weiterbildungen (
            mitarbeiter_id, thema, anbieter, datum, zertifikat, beschreibung
        ) VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """
        
        cur.execute(query, (
            data['mitarbeiter_id'],
            data['thema'],
            data['anbieter'],
            data['datum'],
            data.get('zertifikat'),
            data.get('beschreibung')
        ))
        
        training_id = cur.fetchone()['id']
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'id': training_id, 'message': 'Weiterbildung erfolgreich erstellt'})
        
    except Exception as e:
        logger.error(f"Fehler beim Erstellen der Weiterbildung: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluations', methods=['POST'])
def create_evaluation():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        INSERT INTO Bewertungen (
            mitarbeiter_id, kategorie, punkte, kommentar, datum
        ) VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """
        
        cur.execute(query, (
            data['mitarbeiter_id'],
            data['kategorie'],
            data['punkte'],
            data.get('kommentar'),
            data.get('datum', datetime.now().date())
        ))
        
        evaluation_id = cur.fetchone()['id']
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'id': evaluation_id, 'message': 'Bewertung erfolgreich erstellt'})
        
    except Exception as e:
        logger.error(f"Fehler beim Erstellen der Bewertung: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/templates', methods=['GET'])
def get_templates():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT t.*, 
               json_agg(jsonb_build_object(
                   'id', tv.id,
                   'name', tv.name,
                   'description', tv.description,
                   'required', tv.required,
                   'default_value', tv.default_value
               )) as variables
        FROM templates t
        LEFT JOIN template_variables tv ON t.id = tv.template_id
        WHERE t.is_active = true
        GROUP BY t.id
        """
        
        cur.execute(query)
        templates = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify(templates)
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Templates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/templates', methods=['POST'])
def create_template():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Template erstellen
        template_query = """
        INSERT INTO templates (name, description, category, content, created_by)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """
        
        cur.execute(template_query, (
            data['name'],
            data.get('description'),
            data['category'],
            data['content'],
            data.get('created_by', 1)  # Temporär hardcoded
        ))
        
        template_id = cur.fetchone()[0]
        
        # Template-Variablen erstellen
        if 'variables' in data:
            for var in data['variables']:
                var_query = """
                INSERT INTO template_variables 
                (template_id, name, description, required, default_value)
                VALUES (%s, %s, %s, %s, %s)
                """
                cur.execute(var_query, (
                    template_id,
                    var['name'],
                    var.get('description'),
                    var.get('required', False),
                    var.get('default_value')
                ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'id': template_id, 'message': 'Template erfolgreich erstellt'})
        
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Templates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/templates/<int:template_id>/generate', methods=['POST'])
def generate_document(template_id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Template und Variablen abrufen
        template_query = """
        SELECT t.*, 
               json_agg(jsonb_build_object(
                   'name', tv.name,
                   'required', tv.required,
                   'default_value', tv.default_value
               )) as variables
        FROM templates t
        LEFT JOIN template_variables tv ON t.id = tv.template_id
        WHERE t.id = %s
        GROUP BY t.id
        """
        
        cur.execute(template_query, (template_id,))
        template = cur.fetchone()
        
        if not template:
            return jsonify({'error': 'Template nicht gefunden'}), 404
        
        # Variablen validieren
        for var in template['variables']:
            if var['required'] and var['name'] not in data.get('variables', {}):
                return jsonify({'error': f"Erforderliche Variable fehlt: {var['name']}"}), 400
        
        # Dokument generieren
        content = template['content']
        variables = data.get('variables', {})
        
        for var_name, var_value in variables.items():
            content = content.replace(f"{{{var_name}}}", str(var_value))
        
        # Dokument speichern
        doc_query = """
        INSERT INTO documents (template_id, content, created_by)
        VALUES (%s, %s, %s)
        RETURNING id
        """
        
        cur.execute(doc_query, (template_id, content, data.get('created_by', 1)))
        doc_id = cur.fetchone()['id']
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'id': doc_id,
            'message': 'Dokument erfolgreich generiert'
        })
        
    except Exception as e:
        logger.error(f"Fehler bei der Dokumentgenerierung: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/extract-cv', methods=['POST', 'OPTIONS'])
def extract_cv_with_ai():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Kein Text zum Verarbeiten gefunden'}), 400

        text = data['text']
        logger.info("Starte KI-basierte CV-Extraktion")
        
        # Extrahiere grundlegende Informationen aus dem Text
        # Suche nach typischen Mustern für persönliche Informationen
        name_match = re.search(r'^([A-Za-zäöüÄÖÜß]+(?:\s[A-Za-zäöüÄÖÜß]+)*)\s*$', text.split('\n')[0], re.MULTILINE)
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        phone_match = re.search(r'(?:\+49|0)[- ]?[0-9]{3,4}[- ]?[0-9]{5,8}', text)
        
        # Extrahiere Skills (einfache Wortliste als Beispiel)
        skills = []
        skill_keywords = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git', 
                         'HTML', 'CSS', 'Java', 'C++', 'Docker', 'AWS', 'Azure', 'MongoDB']
        for skill in skill_keywords:
            if skill.lower() in text.lower():
                skills.append(skill)

        # Extrahiere Erfahrung
        experience = []
        exp_matches = re.finditer(r'(\d{4})\s*-\s*(\d{4}|\bheute\b)[:|\s]+([^\n]+)', text, re.IGNORECASE)
        for match in exp_matches:
            experience.append({
                'start_year': match.group(1),
                'end_year': match.group(2),
                'description': match.group(3).strip()
            })

        # Extrahiere Ausbildung
        education = []
        edu_matches = re.finditer(r'(\d{4})\s*-\s*(\d{4})[:|\s]+([^\n]+(?:Universität|Hochschule|Ausbildung|Bachelor|Master|Diplom)[^\n]+)', text, re.IGNORECASE)
        for match in edu_matches:
            education.append({
                'start_year': match.group(1),
                'end_year': match.group(2),
                'degree': match.group(3).strip()
            })

        # Formatiere die Antwort
        cv_data = {
            'id': str(uuid.uuid4()),
            'personalInfo': {
                'firstName': name_match.group(1).split()[0] if name_match else '',
                'lastName': ' '.join(name_match.group(1).split()[1:]) if name_match and len(name_match.group(1).split()) > 1 else '',
                'email': email_match.group(0) if email_match else '',
                'phone': phone_match.group(0) if phone_match else '',
                'profilePicture': None,  # Wird später implementiert
                'title': '',  # Wird später implementiert
                'summary': ''  # Wird später implementiert
            },
            'skills': skills,
            'experience': experience,
            'education': education
        }
        
        logger.info("CV-Extraktion erfolgreich")
        return jsonify(cv_data)

    except Exception as e:
        logger.error(f"Fehler bei der KI-CV-Extraktion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/enhance-cv', methods=['POST', 'OPTIONS'])
def enhance_cv_with_ai():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data or 'cv' not in data:
            return jsonify({'error': 'Keine CV-Daten zum Verbessern gefunden'}), 400

        cv_data = data['cv']
        logger.info("Starte KI-basierte CV-Verbesserung")
        
        # Hier würde normalerweise die KI-Verbesserung stattfinden
        # Für jetzt geben wir einfach die Daten zurück
        enhanced_cv = cv_data
        
        logger.info("CV-Verbesserung erfolgreich")
        return jsonify(enhanced_cv)

    except Exception as e:
        logger.error(f"Fehler bei der KI-CV-Verbesserung: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 