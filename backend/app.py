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
import requests
import time
from ollama_extraction import OllamaExtractor
from services.cv_extraction import CVExtractor
from dotenv import load_dotenv

# Lade Umgebungsvariablen
load_dotenv()

# Logging-Konfiguration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import Workflow Routes
try:
    from routes.workflow_routes import workflow_bp
    logger.info("Workflow-Modul erfolgreich importiert")
except ImportError as e:
    logger.warning(f"Workflow-Blueprint konnte nicht importiert werden: {str(e)}")
    workflow_bp = None

# Import CV Controller
try:
    from controllers.cv_controller import cv_bp
    logger.info("CV-Modul erfolgreich importiert")
except ImportError as e:
    logger.warning(f"CV-Blueprint konnte nicht importiert werden: {str(e)}")
    cv_bp = None

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Registriere Workflow Blueprint, wenn verfügbar
if workflow_bp:
    app.register_blueprint(workflow_bp)
    logger.info("Workflow-Modul erfolgreich registriert")
else:
    logger.warning("Workflow-Modul wurde nicht registriert - Blueprint nicht verfügbar")

# Registriere CV Blueprint, wenn verfügbar
if cv_bp:
    app.register_blueprint(cv_bp)
    logger.info("CV-Modul erfolgreich registriert")
else:
    logger.warning("CV-Modul wurde nicht registriert - Blueprint nicht verfügbar")

# Konfiguration
UPLOAD_FOLDER = 'temp'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Datenbank-Konfiguration
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'TalentBridgeDB'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres123'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

# Initialisiere CV-Extraktor
cv_extractor = CVExtractor()

def get_db_connection():
    try:
        # Erstelle die Verbindungszeichenfolge mit Standardwerten
        dsn_params = {
            'dbname': DB_CONFIG['dbname'],
            'user': DB_CONFIG['user'],
            'password': DB_CONFIG['password'],
            'host': DB_CONFIG['host'], 
            'port': DB_CONFIG['port']
        }
        
        # Debugging: Zeige die DSN-Parameter an (ohne Passwort)
        safe_params = dsn_params.copy()
        safe_params['password'] = '***'
        print(f"DSN Parameter: {safe_params}")
        
        try:
            logger.info(f"Versuche Verbindung zu Datenbank: {DB_CONFIG['dbname']} auf {DB_CONFIG['host']}:{DB_CONFIG['port']}")
            
            # Setze die Kodierung direkt beim Verbindungsaufbau
            conn = psycopg2.connect(**dsn_params, client_encoding='UTF8')
            logger.info("Datenbankverbindung erfolgreich hergestellt")
            return conn
        except UnicodeDecodeError as ude:
            # Bei Kodierungsproblemen versuche nochmal mit alternativer Kodierung
            print(f"Unicode-Dekodierungsfehler: {ude}")
            
            # Versuche den problematischen Teil aus der Fehlermeldung zu extrahieren
            if hasattr(ude, 'object') and isinstance(ude.object, bytes):
                error_bytes = ude.object
                try:
                    # Versuche mit Windows-Kodierung zu decodieren
                    error_msg = error_bytes.decode('cp1252', errors='replace')
                    print(f"Fehlermeldung (cp1252): {error_msg}")
                except Exception:
                    pass
            
            # Versuche es mit anderer Kodierung
            print("Versuche Verbindung mit Windows-Kodierung (cp1252)...")
            conn = psycopg2.connect(**dsn_params, client_encoding='WIN1252')
            return conn
    except psycopg2.Error as e:
        error_msg = str(e)
        # Versuche, die Fehlermeldung lesbarer zu machen
        if isinstance(error_msg, bytes):
            try:
                error_msg = error_msg.decode('cp1252', errors='replace')
            except:
                pass
        logger.error(f"Datenbankverbindungsfehler: {error_msg}")
        return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def check_ollama_status():
    """Überprüft, ob Ollama läuft und erreichbar ist"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama Status Check fehlgeschlagen: {str(e)}")
        return False

def get_ollama_response(prompt: str, text: str, max_retries: int = 3) -> str:
    """Holt eine Antwort von Ollama mit Wiederholungsversuchen"""
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                time.sleep(2)
                
            # Reduziere die Textlänge wenn nötig
            max_text_length = 4000
            if len(text) > max_text_length:
                text = text[:max_text_length]
                logger.warning(f"Text wurde auf {max_text_length} Zeichen gekürzt")
                
            response = requests.post(
                'http://localhost:11434/api/generate',
                json={
                    'model': 'mistral',
                    'prompt': f"{prompt}\n\nText:\n{text}",
                    'stream': False,
                    'options': {
                        'temperature': 0.1,  # Sehr niedrige Temperatur für konsistentere Antworten
                        'top_p': 0.1,       # Sehr niedriger top_p Wert
                        'num_predict': 512,  # Kürzere Vorhersage
                        'num_ctx': 2048,     # Kleinerer Kontext
                        'stop': ["}"],       # Stoppe nach dem schließenden JSON
                        'num_thread': 4,     # Standard Thread-Anzahl
                        'repeat_penalty': 1.2,  # Verhindere Wiederholungen
                        'seed': 42           # Fester Seed für konsistentere Ergebnisse
                    }
                },
                timeout=30  # Kurzer Timeout von 30 Sekunden
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama API Fehler: {response.status_code} - {response.text}")
                raise ConnectionError(f"Ollama API Fehler: {response.status_code}")
                
            result = response.json().get('response', '')
            if not result:
                raise ValueError("Keine Antwort von Ollama erhalten")
                
            # Stelle sicher, dass wir ein vollständiges JSON haben
            if not result.strip().endswith('}'):
                result += '}'
                
            # Versuche das JSON zu parsen
            try:
                json.loads(result)
                return result
            except json.JSONDecodeError:
                raise ValueError("Ungültiges JSON von Ollama erhalten")
            
        except requests.exceptions.Timeout:
            if attempt == max_retries - 1:
                raise TimeoutError("Zeitüberschreitung bei der KI-Verarbeitung")
            logger.warning(f"Timeout bei Versuch {attempt + 1}, versuche erneut...")
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise ConnectionError(f"Verbindungsfehler bei der KI-Verarbeitung: {str(e)}")
            logger.warning(f"Verbindungsfehler bei Versuch {attempt + 1}, versuche erneut...")
            
    raise Exception("Maximale Anzahl von Wiederholungsversuchen erreicht")

@app.route('/api/pdf/extract', methods=['POST', 'OPTIONS'])
def extract_text_from_upload():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        logger.info("PDF-Extraktion gestartet")
        if 'file' not in request.files:
            logger.error("Keine Datei in request.files gefunden")
            return jsonify({'error': 'Keine Datei hochgeladen'}), 400
            
        file = request.files['file']
        logger.info(f"Datei empfangen: {file.filename}")
        
        if file.filename == '':
            logger.error("Leerer Dateiname")
            return jsonify({'error': 'Keine Datei ausgewählt'}), 400
            
        if not file.filename.lower().endswith('.pdf'):
            logger.error("Keine PDF-Datei")
            return jsonify({'error': 'Nur PDF-Dateien sind erlaubt'}), 400

        # Generiere einen eindeutigen Dateinamen
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        logger.info(f"Speichere Datei unter: {filepath}")
        
        try:
            # Speichere die Datei temporär
            file.save(filepath)
            logger.info("Datei erfolgreich gespeichert")
            
            # Extrahiere Text aus PDF
            text = ""
            with open(filepath, 'rb') as pdf_file:
                reader = PyPDF2.PdfReader(pdf_file)
                logger.info(f"PDF hat {len(reader.pages)} Seiten")
                for page in reader.pages:
                    text += page.extract_text() + "\n"

            if not text or text.isspace():
                logger.error("Kein Text aus PDF extrahiert")
                return jsonify({'error': 'Konnte keinen Text aus der PDF extrahieren'}), 400

            # Bereinige den Text
            text = text.strip()
            text = re.sub(r'\s+', ' ', text)
            text = text.replace('\x00', '')
            logger.info(f"Extrahierter Text (erste 100 Zeichen): {text[:100]}...")

            return jsonify({'text': text})

        finally:
            # Lösche die temporäre Datei
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
                    logger.info("Temporäre Datei gelöscht")
            except Exception as e:
                logger.warning(f"Konnte temporäre Datei nicht löschen: {str(e)}")

    except Exception as e:
        logger.error(f"Fehler bei der PDF-Verarbeitung: {str(e)}")
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

def extract_text_from_pdf(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            # Extrahiere Text von jeder Seite
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    # Normalisiere Leerzeichen und Zeilenumbrüche
                    page_text = re.sub(r'\s+', ' ', page_text)
                    # Füge Zeilenumbrüche nach bestimmten Schlüsselwörtern ein
                    page_text = re.sub(r'(?i)(Telefon|Email|Adresse|Ausbildung|Berufserfahrung|Skills|Kenntnisse|Sprachen|Zertifikate|Projekte):', r'\n\1:', page_text)
                    text += page_text + "\n\n"
            
            # Bereinige den Text
            text = re.sub(r'\n\s*\n', '\n', text)  # Entferne mehrfache Leerzeilen
            text = re.sub(r' +', ' ', text)  # Normalisiere Leerzeichen
            text = text.strip()
            
            logger.info(f"PDF-Text erfolgreich extrahiert, Länge: {len(text)} Zeichen")
            return text
            
    except Exception as e:
        logger.error(f"Fehler bei der PDF-Extraktion: {str(e)}")
        raise

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
def extract_cv():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        logger.info("CV-Extraktion mit KI gestartet")
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Kein Text zum Verarbeiten gefunden'}), 400
            
        text = data['text']
        logger.info(f"Text zum Verarbeiten (erste 100 Zeichen): {text[:100]}...")
        
        # Extrahiere CV-Daten mit OpenAI
        result = cv_extractor.extract_cv_data(text)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Fehler bei der CV-Extraktion: {str(e)}")
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

def test_db_connection():
    try:
        print("Versuche Datenbankverbindung herzustellen...")
        conn = get_db_connection()
        
        if conn:
            print("Verbindung erfolgreich hergestellt, teste Abfrage...")
            # Teste die Verbindung mit einer einfachen Abfrage
            cur = conn.cursor()
            cur.execute("SELECT 1")
            result = cur.fetchone()
            cur.close()
            conn.close()
            
            if result and result[0] == 1:
                logger.info("Datenbankverbindung erfolgreich hergestellt und getestet")
                return True
            else:
                logger.error("Datenbankverbindungstest fehlgeschlagen")
                return False
        else:
            logger.error("Keine Datenbankverbindung möglich")
            return False
    except Exception as e:
        # Versuche den Fehler detaillierter zu analysieren
        error_msg = str(e)
        print(f"Fehlertyp: {type(e).__name__}")
        print(f"Rohfehlermeldung: {repr(error_msg)}")
        
        # Versuch, problematische Umlaute zu finden
        for i, char in enumerate(error_msg):
            try:
                char_code = ord(char)
                if char_code > 127:  # Nicht-ASCII-Zeichen
                    print(f"Nicht-ASCII-Zeichen an Position {i}: '{char}' (Unicode: {char_code})")
            except:
                print(f"Problem mit Zeichen an Position {i}")
        
        # Versuche die Fehlermeldung zu decodieren
        try:
            if isinstance(error_msg, bytes):
                for enc in ['cp1252', 'latin1', 'utf-8']:
                    try:
                        print(f"Versuch der Dekodierung mit {enc}: {error_msg.decode(enc, errors='replace')}")
                    except Exception as decode_err:
                        print(f"Fehler bei Dekodierung mit {enc}: {decode_err}")
        except Exception as err:
            print(f"Fehler bei Dekodierungsversuchen: {err}")
        
        logger.error(f"Fehler beim Testen der Datenbankverbindung: {error_msg}")
        return False

if __name__ == '__main__':
    # Setze die Standardkodierung für alle Strings
    import sys
    import locale
    
    # Debugging-Ausgabe zur Zeichenkodierung
    print(f"System-Kodierung: {locale.getpreferredencoding()}")
    print(f"Python-Standardkodierung: {sys.getdefaultencoding()}")
    
    # Setze die Standardkodierung auf den System-Standardwert
    # Dies kann helfen, wenn es Probleme mit deutschen Umlauten gibt
    if sys.version_info >= (3, 0):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    
    # Nutze einen Try-Block, um Fehler zu erfassen
    try:
        # Teste Datenbankverbindung
        if test_db_connection():
            # Starte den Server auf Port 5000
            app.run(host='127.0.0.1', port=5000, debug=True)
        else:
            logger.error("Server konnte nicht gestartet werden: Keine Datenbankverbindung")
    except Exception as e:
        # Versuche den Fehler in verschiedenen Kodierungen zu decodieren
        error_str = str(e)
        print(f"Originaler Fehler: {error_str}")
        for encoding in ['utf-8', 'latin1', 'cp1252', 'ascii']:
            try:
                if isinstance(error_str, bytes):
                    decoded = error_str.decode(encoding)
                    print(f"Decodiert mit {encoding}: {decoded}")
            except Exception as decode_error:
                print(f"Fehler bei Decodierung mit {encoding}: {decode_error}")
        raise e 