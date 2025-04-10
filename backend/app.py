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
from typing import List, Dict, Any, Optional
import re
import uuid
import requests
import time
from ollama_extraction import OllamaExtractor
from services.cv_extraction import CVExtractor
from dotenv import load_dotenv
from db.db_service import get_db_connection, create_tables, create_default_tenant, create_default_admin_user
from routes.auth_routes import auth_routes
from routes.workflow_routes import workflow_bp
from routes.cv_routes import cv_upload_bp
from huggingface_extraction import HuggingFaceExtractor

from nltk_extraction import NLTKExtractor

# Lade Umgebungsvariablen
load_dotenv()

# Logging-Konfiguration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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

# Import Auth Routes
try:
    from routes.auth_routes import auth_routes
    logger.info("Auth-Modul erfolgreich importiert")
except ImportError as e:
    logger.warning(f"Auth-Blueprint konnte nicht importiert werden: {str(e)}")
    auth_routes = None

app = Flask(__name__)
# Konfiguriere CORS mit erweiterten Optionen
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "X-Custom-Header", "*"],
    "supports_credentials": True,
    "max_age": 86400
}})

# Verbesserte OPTIONS-Handhabung für alle Routen
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 204  # 204 No Content für OPTIONS-Anfragen

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
    
    # Füge Debug-Route hinzu
    @app.route('/api/debug/cv', methods=['GET'])
    def debug_cv():
        """Debug-Endpoint für CV-Tabellen und Verbindung"""
        try:
            conn = get_db_connection()
            if not conn:
                return jsonify({"success": False, "error": "Keine Datenbankverbindung"}), 500
            
            cursor = conn.cursor()
            
            # Prüfe, ob die CV-Tabellen existieren
            try:
                cursor.execute("SELECT COUNT(*) FROM cvs")
                cv_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM employees")
                employee_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM skills")
                skill_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM skill_categories")
                category_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM cv_skills")
                cv_skills_count = cursor.fetchone()[0]
                
                return jsonify({
                    "success": True,
                    "tables": {
                        "cvs": cv_count,
                        "employees": employee_count,
                        "skills": skill_count,
                        "skill_categories": category_count,
                        "cv_skills": cv_skills_count
                    },
                    "connection": "ok"
                })
            except Exception as e:
                return jsonify({
                    "success": False, 
                    "error": f"Fehler beim Abfragen der Tabellen: {str(e)}",
                    "connection": "ok"
                }), 500
            
        except Exception as e:
            return jsonify({
                "success": False, 
                "error": f"Serverfehler: {str(e)}"
            }), 500

# Registriere Auth Blueprint, wenn verfügbar
if auth_routes:
    app.register_blueprint(auth_routes, url_prefix='/api/auth')
    logger.info("Auth-Modul erfolgreich registriert")
else:
    logger.warning("Auth-Modul wurde nicht registriert - Blueprint nicht verfügbar")

# Registriere CV-Upload Blueprint
if cv_upload_bp:
    app.register_blueprint(cv_upload_bp)
    logger.info("CV-Upload-Modul erfolgreich registriert")
else:
    logger.warning("CV-Upload-Modul wurde nicht registriert - Blueprint nicht verfügbar")

# DB und andere Einstellungen initialisieren
try:
    from db.db_service import create_tables, create_default_tenant, create_default_admin_user
    
    # Tabellen erstellen oder aktualisieren
    logger.info("Initialisiere Datenbank...")
    tables_result = create_tables()
    
    if tables_result["success"]:
        logger.info(f"Datenbanktabellen wurden initialisiert: {tables_result.get('message')}")
    else:
        logger.error(f"Fehler bei der Tabellenerstellung: {tables_result.get('error', 'Unbekannter Fehler')}")
except ImportError as e:
    logger.warning(f"DB-Service konnte nicht geladen werden: {str(e)}")
except Exception as e:
    logger.error(f"Fehler bei der DB-Initialisierung: {str(e)}")

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
huggingface_extractor = HuggingFaceExtractor()
ollama_extractor = OllamaExtractor()
nltk_extractor = NLTKExtractor()

def validate_extraction_result(result: Dict[str, Any]) -> bool:
    """
    Validiert das Ergebnis der Extraktion.
    
    Args:
        result: Das zu validierende Ergebnis
        
    Returns:
        bool: True wenn das Ergebnis valide ist, sonst False
    """
    if not isinstance(result, dict):
        return False

    # Prüfe ob mindestens einige wichtige Felder vorhanden sind
    required_fields = ['name', 'email', 'skills', 'work_experience']
    return all(field in result for field in required_fields)

def merge_extraction_results(results: list[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Führt mehrere Extraktionsergebnisse zusammen.
    
    Args:
        results: Liste der Extraktionsergebnisse
        
    Returns:
        Dict mit zusammengeführten Ergebnissen
    """
    merged = {
        'name': '',
        'email': '',
        'phone': '',
        'address': '',
        'skills': [],
        'work_experience': [],
        'education': [],
        'languages': [],
        'projects': []
    }
    
    for result in results:
        if not validate_extraction_result(result):
            continue
            
        # Persönliche Daten
        if result.get('name') and not merged['name']:
            merged['name'] = result['name']
        if result.get('email') and not merged['email']:
            merged['email'] = result['email']
        if result.get('phone') and not merged['phone']:
            merged['phone'] = result['phone']
        if result.get('address') and not merged['address']:
            merged['address'] = result['address']
            
        # Skills
        if result.get('skills'):
            for skill_group in result['skills']:
                if skill_group not in merged['skills']:
                    merged['skills'].append(skill_group)
                    
        # Berufserfahrung
        if result.get('work_experience'):
            for exp in result['work_experience']:
                if exp not in merged['work_experience']:
                    merged['work_experience'].append(exp)
                    
        # Ausbildung
        if result.get('education'):
            for edu in result['education']:
                if edu not in merged['education']:
                    merged['education'].append(edu)
                    
        # Sprachen
        if result.get('languages'):
            for lang in result['languages']:
                if lang not in merged['languages']:
                    merged['languages'].append(lang)
                    
        # Projekte
        if result.get('projects'):
            for proj in result['projects']:
                if proj not in merged['projects']:
                    merged['projects'].append(proj)
                    
    return merged

@app.route('/api/extract', methods=['POST'])
def extract_cv():
    """
    Extrahiert Informationen aus einem hochgeladenen PDF.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Keine Datei gefunden'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Keine Datei ausgewählt'}), 400
            
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Nur PDF-Dateien sind erlaubt'}), 400

            # Speichere die Datei temporär
        temp_path = os.path.join('temp', file.filename)
        os.makedirs('temp', exist_ok=True)
        file.save(temp_path)
            
        try:
            # Extrahiere Text aus PDF
            text = extract_text_from_pdf(temp_path)
            if not text:
                return jsonify({'error': 'Konnte keinen Text aus der PDF extrahieren'}), 400

            # Versuche die Extraktion mit verschiedenen Methoden
            results = []
            
            # 1. HuggingFace (wenn verfügbar) - DEAKTIVIERT
            # if os.getenv('USE_HUGGINGFACE', 'false').lower() == 'true':
            #     try:
            #         hf_result = huggingface_extractor.extract_cv(text)
            #         if validate_extraction_result(hf_result):
            #             results.append(hf_result)
            #             logger.info("HuggingFace Extraktion erfolgreich")
            #     except Exception as e:
            #         logger.error(f"HuggingFace Extraktion fehlgeschlagen: {str(e)}")
                    
            # 2. Ollama (lokale Option)
            try:
                ollama_result = ollama_extractor.extract_cv(text)
                if validate_extraction_result(ollama_result):
                    results.append(ollama_result)
                    logger.info("Ollama Extraktion erfolgreich")
            except Exception as e:
                logger.error(f"Ollama Extraktion fehlgeschlagen: {str(e)}")
                
            # 3. NLTK als Fallback
            try:
                nltk_result = nltk_extractor.extract_cv(text)
                if validate_extraction_result(nltk_result):
                    results.append(nltk_result)
                    logger.info("NLTK Extraktion erfolgreich")
            except Exception as e:
                logger.error(f"NLTK Extraktion fehlgeschlagen: {str(e)}")
                
            # Wenn keine Extraktion erfolgreich war
            if not results:
                return jsonify({
                    'error': 'Keine der Extraktionsmethoden war erfolgreich',
                    'status': 'failed'
                }), 500
                
            # Führe die Ergebnisse zusammen
            final_result = merge_extraction_results(results)
            
            # Füge Metadaten hinzu
            final_result['metadata'] = {
                'extraction_date': datetime.now().isoformat(),
                'source_file': file.filename,
                'methods_used': len(results)
            }
            
            return jsonify(final_result)

        finally:
            # Lösche temporäre Datei
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.error(f"Fehler beim Löschen der temporären Datei: {str(e)}")

    except Exception as e:
        logger.error(f"Fehler bei der CV-Extraktion: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'failed'
        }), 500

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
            
            # Prüfe ob PDF verschlüsselt ist
            if reader.is_encrypted:
                logger.info("PDF ist verschlüsselt, versuche automatische Entschlüsselung")
                try:
                    reader.decrypt('')  # Versuche mit leerem Passwort
                except:
                    logger.error("PDF konnte nicht entschlüsselt werden")
                    raise Exception("PDF ist verschlüsselt und konnte nicht entschlüsselt werden")
            
            text = ""
            total_pages = len(reader.pages)
            logger.info(f"PDF hat {total_pages} Seiten")
            
            # Extrahiere Text von jeder Seite
            for i, page in enumerate(reader.pages, 1):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        # Normalisiere Leerzeichen und Zeilenumbrüche
                        page_text = re.sub(r'\s+', ' ', page_text)
                        # Füge Zeilenumbrüche nach bestimmten Schlüsselwörtern ein
                        page_text = re.sub(r'(?i)(Telefon|Email|Adresse|Ausbildung|Berufserfahrung|Skills|Kenntnisse|Sprachen|Zertifikate|Projekte):', r'\n\1:', page_text)
                        text += page_text + "\n\n"
                        logger.info(f"Seite {i}/{total_pages} erfolgreich extrahiert")
                    else:
                        logger.warning(f"Keine Text auf Seite {i} gefunden")
                except Exception as e:
                    logger.error(f"Fehler beim Extrahieren von Seite {i}: {str(e)}")
                    continue
            
            if not text.strip():
                logger.error("Kein Text aus PDF extrahiert")
                raise Exception("Kein Text aus PDF extrahiert")
            
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

@app.route('/api/ai/extract-cv', methods=['POST', 'OPTIONS'], endpoint='extract_cv_with_ai')
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
        
        # Extrahiere CV-Daten mit HuggingFace
        result = huggingface_extractor.extract_cv_data(text)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Fehler bei der Datenbankverbindung: {str(e)}")
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

# Debug-Endpunkt für Datenbankstatus
@app.route('/api/debug/db-status')
def db_status():
    try:
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            return jsonify({
                "status": "connected", 
                "version": version
            })
        else:
            return jsonify({"status": "error", "message": "Keine Verbindung zur Datenbank möglich"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/auth/direct-login', methods=['POST', 'OPTIONS'])
def direct_login():
    """
    Direkter Login-Endpunkt ohne Blueprint für Testzwecke
    """
    print(f"Direkter Login-Endpunkt aufgerufen mit Methode: {request.method}")
    
    if request.method == 'OPTIONS':
        response_headers = {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
        return '', 204, response_headers
    
    try:
        data = request.get_json()
        print(f"Direkter Login-Anfrage erhalten: {data}")
        
        email = data.get('email', '')
        password = data.get('password', '')
        
        # Für Testzwecke
        if email == 'admin@example.com' and password == 'admin123':
            return jsonify({
                'success': True,
                'token': 'test_token_12345',
                'user': {
                    'id': 1,
                    'email': 'admin@example.com',
                    'role': 'admin',
                    'tenant_id': 1
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Ungültige E-Mail oder Passwort'
            }), 401
    
    except Exception as e:
        print(f"Direkter Login-Fehler: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server-Fehler: {str(e)}'
        }), 500

# Hilfs-Endpunkt zum Testen von POST-Anfragen
@app.route('/api/test-post-endpoint', methods=['POST', 'GET', 'OPTIONS'])
def test_post_endpoint():
    """
    Ein einfacher Endpunkt zum Testen von POST-Anfragen
    """
    print(f"Test-POST-Endpunkt aufgerufen mit Methode: {request.method}")
    
    if request.method == 'OPTIONS':
        response_headers = {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
        return '', 204, response_headers
    
    if request.method == 'POST':
        data = request.get_json()
        print(f"POST-Daten empfangen: {data}")
        return jsonify({
            "success": True,
            "message": "POST-Anfrage erfolgreich verarbeitet",
            "received_data": data
        }), 200
    
    # GET-Anfrage
    return jsonify({
        "success": True,
        "message": "GET-Anfrage erfolgreich verarbeitet"
    }), 200

# Debug-Endpunkte für Frontend
@app.route('/api/debug/health', methods=['GET', 'OPTIONS'])
def debug_health():
    """Health-Check-Endpoint für Frontend-API-Tests"""
    if request.method == 'OPTIONS':
        return '', 204
    
    return jsonify({
        "status": "ok",
        "message": "API ist erreichbar",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/test-huggingface', methods=['GET'])
def test_huggingface():
    # Wieder aktiviert
    try:
        result = huggingface_extractor.test_connection()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Fehler beim Testen der HuggingFace-Verbindung: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    import sys
    import locale
    
    print(f"System-Kodierung: {locale.getpreferredencoding()}")
    print(f"Python-Standardkodierung: {sys.getdefaultencoding()}")
    
    if sys.version_info >= (3, 0):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    
    try:
        if test_db_connection():
            app.run(host='127.0.0.1', port=5000, debug=True)
        else:
            logger.error("Server konnte nicht gestartet werden: Keine Datenbankverbindung")
    except Exception as e:
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