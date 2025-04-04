from flask import Blueprint, request, jsonify, current_app
from flask_cors import CORS
import os
import tempfile
import uuid
from werkzeug.utils import secure_filename
from services.cv_extraction import CVExtractor
from services.cv_service import CVService
from db.db_service import get_db_connection
import PyPDF2
import logging
import requests
from mock_extractor import MockExtractor
from huggingface_extractor import HuggingFaceExtractor
from datetime import datetime
from config import USE_HUGGINGFACE, USE_MOCK_EXTRACTION, HUGGINGFACE_API_KEY

logger = logging.getLogger(__name__)

cv_upload_bp = Blueprint('cv_upload', __name__, url_prefix='/api/cv-upload')
CORS(cv_upload_bp, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"], 
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With", "X-Custom-Header", "X-CSRF-Token", "*"])

# Konfiguration für CV-Extraktion wird jetzt aus config.py importiert
# USE_HUGGINGFACE wird importiert
# USE_MOCK_EXTRACTION wird importiert
# HUGGINGFACE_API_KEY wird importiert

# Initialisiere Extraktoren
cv_extractor = CVExtractor()
# HuggingFace-Extraktor initialisieren, wenn konfiguriert
huggingface_extractor = None
if USE_HUGGINGFACE and HUGGINGFACE_API_KEY:
    try:
        huggingface_extractor = HuggingFaceExtractor(api_key=HUGGINGFACE_API_KEY)
        logger.info("HuggingFace-Extraktor initialisiert")
    except Exception as e:
        logger.error(f"Fehler bei der Initialisierung des HuggingFace-Extraktors: {str(e)}")

# Mock-Extraktor initialisieren, wenn konfiguriert
mock_extractor = None
if USE_MOCK_EXTRACTION:
    mock_extractor = MockExtractor()
    logger.info("Mock-Extraktor initialisiert")

# Konfiguration für Datei-Uploads
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')

# Stelle sicher, dass der Upload-Ordner existiert
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@cv_upload_bp.route('/<path:path>', methods=['OPTIONS'])
@cv_upload_bp.route('/', methods=['OPTIONS'])
def handle_cv_options(path=None):
    return '', 204  # 204 No Content für OPTIONS-Anfragen

@cv_upload_bp.route('/extract-preview', methods=['POST', 'OPTIONS'])
def extract_preview():
    """
    Extrahiert Vorschaudaten aus einem hochgeladenen CV, ohne es zu speichern
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    logger.info("Extract Preview API aufgerufen")
    
    # Überprüfe, ob Dateien im Request sind
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Keine Datei hochgeladen"}), 400
        
    file = request.files['file']
    
    # Überprüfe, ob Dateiname leer ist
    if file.filename == '':
        return jsonify({"success": False, "message": "Keine Datei ausgewählt"}), 400
        
    # Überprüfe, ob Dateityp erlaubt ist
    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": f"Dateityp nicht erlaubt. Erlaubte Formate: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
    
    # Sicheres temporäres Verzeichnis erstellen
    with tempfile.TemporaryDirectory() as temp_dir:
        filename = secure_filename(file.filename)
        temp_file = os.path.join(temp_dir, filename)
        
        # Datei speichern
        file.save(temp_file)
        logger.info(f"Verarbeite Datei: {filename}")
        
        # Text aus der Datei extrahieren
        extracted_text = ""
        try:
            if filename.lower().endswith('.pdf'):
                # PDF-Text extrahieren
                with open(temp_file, 'rb') as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    for page in pdf_reader.pages:
                        extracted_text += page.extract_text() + "\n"
            elif filename.lower().endswith('.txt'):
                # Text-Datei direkt lesen
                with open(temp_file, 'r', encoding='utf-8') as txt_file:
                    extracted_text = txt_file.read()
            # Weitere Dateitypen hier hinzufügen...
            
            if not extracted_text:
                return jsonify({
                    "success": False, 
                    "message": "Konnte keinen Text aus der Datei extrahieren"
                }), 400
                
            # SCHRITT 1: Basis-Extraktion mit lokalen Methoden
            basic_extracted_data = {}
            
            try:
                # Verwende den CVExtractor für die Basisextraktion
                basic_extracted_data = cv_extractor.extract_basic_info(extracted_text)
                
                # Erfolg für die Basis-Extraktion
                extraction_success = True
                extraction_method = "Lokale Extraktion"
                
                # SCHRITT 2: Erweiterte Extraktion mit KI (falls verfügbar und gewünscht)
                enhanced_data = {}
                enhanced_extraction_success = False
                
                # Nur HuggingFace verwenden, wenn konfiguriert und wenn der API-Key gültig ist
                if USE_HUGGINGFACE and huggingface_extractor and HUGGINGFACE_API_KEY:
                    try:
                        logger.info("Verwende HuggingFace für Extraktion")
                        logger.info(f"HuggingFace Modell: {huggingface_extractor.model}")
                        logger.info(f"API-Key: {HUGGINGFACE_API_KEY[:4]}...{HUGGINGFACE_API_KEY[-4:]}")
                        
                        # Führe einen schnellen Test durch
                        test_result = huggingface_extractor.test_connection()
                        logger.info(f"HuggingFace Test: {test_result.get('success')}, Nachricht: {test_result.get('message')}")
                        
                        if test_result.get('success'):
                            enhanced_data = huggingface_extractor.extract_cv_data(extracted_text)
                            
                            # Prüfen ob HuggingFace Daten geliefert hat
                            if enhanced_data and not isinstance(enhanced_data, str) and not enhanced_data.get("error"):
                                # Kombiniere die Basis-Daten mit den KI-Daten
                                # KI-Daten haben Priorität, wenn sie vorhanden sind
                                enhanced_extraction_success = True
                                for key, value in enhanced_data.items():
                                    if value: # Nur nicht-leere Werte übernehmen
                                        basic_extracted_data[key] = value
                                
                                extraction_method = "HuggingFace"
                        else:
                            logger.warning(f"HuggingFace-Test fehlgeschlagen: {test_result.get('message')}")
                    except Exception as e:
                        logger.error(f"Fehler bei der HuggingFace-Extraktion: {str(e)}")
                        # Weiter mit lokalen Daten arbeiten
                
                # Fallback auf Mock-Extraktor, wenn konfiguriert und HuggingFace fehlgeschlagen ist
                if USE_MOCK_EXTRACTION and mock_extractor and not enhanced_extraction_success:
                    try:
                        logger.info("Verwende Mock-Extraktor als Fallback")
                        mock_data = mock_extractor.extract_cv_data(extracted_text)
                        
                        if mock_data and not isinstance(mock_data, str) and not mock_data.get("error"):
                            # Kombiniere die Basis-Daten mit den Mock-Daten
                            for key, value in mock_data.items():
                                if value:  # Nur nicht-leere Werte übernehmen
                                    basic_extracted_data[key] = value
                                    
                            extraction_method = "Mock-Extraktion"
                    except Exception as e:
                        logger.error(f"Fehler bei der Mock-Extraktion: {str(e)}")
                        # Weiter mit lokalen Daten arbeiten
                
                # Füge eine Textprobe für Debugging-Zwecke hinzu
                text_sample = extracted_text[:150] + "..." if len(extracted_text) > 150 else extracted_text
                
                # Rückgabe mit den extrahierten Daten
                return jsonify({
                    "success": extraction_success,
                    "extracted_data": basic_extracted_data,
                    "extraction_method": extraction_method,
                    "message": "Daten erfolgreich extrahiert",
                    "text_sample": text_sample
                })
                
            except Exception as e:
                logger.error(f"Fehler bei der CV-Extraktion: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": f"Fehler bei der Extraktion: {str(e)}",
                    "extracted_data": {},
                    "error": "extraction_error"
                }), 500
        
        except Exception as e:
            logger.error(f"Fehler beim Verarbeiten der Datei: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Fehler beim Verarbeiten der Datei: {str(e)}",
                "error": "file_processing_error"
            }), 500

@cv_upload_bp.route('/upload', methods=['POST', 'OPTIONS'])
def upload_cv():
    """CV-Dokument hochladen und Daten extrahieren"""
    # Für OPTIONS-Anfragen
    if request.method == 'OPTIONS':
        return '', 204
        
    # Überprüfe, ob Dateien im Request sind
    if 'file' not in request.files:
        logger.error("Keine Datei im Request")
        return jsonify({"success": False, "message": "Keine Datei hochgeladen"}), 400
        
    file = request.files['file']
    
    # Überprüfe, ob Dateiname leer ist
    if file.filename == '':
        logger.error("Leerer Dateiname")
        return jsonify({"success": False, "message": "Keine Datei ausgewählt"}), 400
        
    # Überprüfe, ob Dateityp erlaubt ist
    if not allowed_file(file.filename):
        logger.error(f"Nicht erlaubter Dateityp: {file.filename}")
        return jsonify({"success": False, "message": f"Dateityp nicht erlaubt. Erlaubte Typen: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
    # Hole tenant_id aus dem Request
    tenant_id = request.form.get('tenant_id', 1)  # Standard ist Tenant 1
    logger.info(f"Verwende Tenant-ID: {tenant_id}")
    
    try:
        # Datei sicher speichern mit eindeutigem Namen
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        
        extracted_data = None
        extracted_text = ""
        extraction_method = "Unbekannt"
        
        # Versuche Extraktion mit HuggingFace
        if USE_HUGGINGFACE and HUGGINGFACE_API_KEY:
            try:
                logger.info("Verwende HuggingFace für Upload-Extraktion")
                extracted_data = huggingface_extractor.extract_from_file(filepath)
                
                if "error" in extracted_data or extracted_data is None:
                    logger.warning(f"HuggingFace-Extraktion fehlgeschlagen: {extracted_data.get('error', 'Unbekannter Fehler')}")
                    extracted_data = None
                else:
                    extraction_method = "HuggingFace"
            except Exception as e:
                logger.warning(f"Fehler bei HuggingFace-Extraktion: {str(e)}")
                extracted_data = None
        
        # Fallback auf Mock-Extraktion, wenn HuggingFace fehlgeschlagen ist
        if extracted_data is None and USE_MOCK_EXTRACTION:
            try:
                logger.info("Verwende Mock-Extraktion als Fallback")
                extracted_data = mock_extractor.extract_from_file(filepath)
                extraction_method = "Mock"
            except Exception as e:
                logger.warning(f"Fehler bei Mock-Extraktion: {str(e)}")
                extracted_data = None
        
        # Letzter Fallback: Standard-Extraktor
        if extracted_data is None:
            logger.info("Verwende Standard-Extraktion als letzten Fallback")
            
            # Extrahiere Text für die Standard-Extraktion
            try:
                with open(filepath, 'rb') as f:
                    if filepath.lower().endswith('.pdf'):
                        pdf_reader = PyPDF2.PdfReader(f)
                        extracted_text = ""
                        for page in pdf_reader.pages:
                            extracted_text += page.extract_text() + "\n"
                    else:
                        # Für andere Dateitypen
                        extracted_text = f.read().decode('utf-8', errors='replace')
                        
                extracted_data = cv_extractor.extract_cv_data(extracted_text)
                extraction_method = "Regelbasiert"
            except Exception as e:
                logger.error(f"Fehler bei Standard-Extraktion: {str(e)}")
                return jsonify({"success": False, "message": f"Extraktion fehlgeschlagen: {str(e)}"}), 500
        
        # Verbindung zur Datenbank herstellen
        conn = get_db_connection()
        if not conn:
            return jsonify({"success": False, "message": "Datenbankverbindung konnte nicht hergestellt werden"}), 500
        
        try:
            # Erstelle einen Mitarbeiter-Datensatz
            cv_service = CVService(conn)
            
            personal_data = extracted_data.get('personal_data', {})
            
            # Erstelle einen neuen Mitarbeiter
            employee_data = {
                "full_name": f"{personal_data.get('vorname', '')} {personal_data.get('nachname', '')}",
                "email": personal_data.get('email', ''),
                "phone": personal_data.get('telefon', ''),
                "position": extracted_data.get('experience', [{}])[0].get('position', '') if extracted_data.get('experience') else '',
                "location": personal_data.get('adresse', ''),
                "tenant_id": tenant_id
            }
            
            employee_id = cv_service.create_employee(employee_data)
            
            if not employee_id:
                return jsonify({"success": False, "message": "Mitarbeiter konnte nicht erstellt werden"}), 500
            
            # Erstelle einen CV-Datensatz
            cv_data = {
                "title": f"Lebenslauf von {personal_data.get('vorname', '')} {personal_data.get('nachname', '')}",
                "summary": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
                "personal_data": personal_data,
                "education": [
                    {
                        "institution": edu.get('institution', ''),
                        "degree": edu.get('abschluss', ''),
                        "field": edu.get('fachrichtung', ''),
                        "start_year": edu.get('zeitraum', '').split('-')[0].strip() if '-' in edu.get('zeitraum', '') else '',
                        "end_year": edu.get('zeitraum', '').split('-')[1].strip() if '-' in edu.get('zeitraum', '') else '',
                        "details": ""
                    }
                    for edu in extracted_data.get('education', [])
                ],
                "experience": [
                    {
                        "company": exp.get('firma', ''),
                        "position": exp.get('position', ''),
                        "start_date": exp.get('zeitraum', '').split('-')[0].strip() if '-' in exp.get('zeitraum', '') else '',
                        "end_date": exp.get('zeitraum', '').split('-')[1].strip() if '-' in exp.get('zeitraum', '') else '',
                        "current": "heute" in exp.get('zeitraum', '').lower(),
                        "description": exp.get('beschreibung', '')
                    }
                    for exp in extracted_data.get('experience', [])
                ],
                "languages": [
                    {"name": lang, "level": "Fließend"} 
                    for lang in extracted_data.get('skills', {}).get('sprachen', [])
                ],
                "skills": extracted_data.get('skills', {}).get('technische_skills', []) + 
                          extracted_data.get('skills', {}).get('soft_skills', [])
            }
            
            cv_id = cv_service.create_cv(employee_id, cv_data, tenant_id)
            
            if not cv_id:
                return jsonify({"success": False, "message": "CV konnte nicht erstellt werden"}), 500
            
            # Hole den erstellten CV
            created_cv = cv_service.get_cv_by_id(cv_id, tenant_id)
            
            return jsonify({
                "success": True,
                "message": "CV erfolgreich hochgeladen und verarbeitet",
                "cv_id": cv_id,
                "employee_id": employee_id,
                "extracted_data": extracted_data,
                "cv": created_cv,
                "extraction_method": extraction_method
            }), 201
            
        except Exception as e:
            logger.error(f"Fehler bei der CV-Erstellung: {str(e)}")
            return jsonify({"success": False, "message": f"Fehler bei der CV-Erstellung: {str(e)}"}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Fehler beim Hochladen: {str(e)}")
        return jsonify({"success": False, "message": f"Fehler beim Hochladen: {str(e)}"}), 500

# Test-Endpunkt für Extraktor-Verbindung
@cv_upload_bp.route('/test-extractor', methods=['GET', 'OPTIONS'])
def test_extractor():
    """Überprüft, ob der Extraktor funktioniert"""
    if request.method == 'OPTIONS':
        return '', 204
        
    # Teste die verschiedenen Extraktoren
    results = {
        "success": True,
        "date": datetime.now().isoformat(),
        "extractors": {},
        "config": {
            "USE_HUGGINGFACE": USE_HUGGINGFACE,
            "USE_MOCK_EXTRACTION": USE_MOCK_EXTRACTION,
            "HUGGINGFACE_API_KEY_SET": bool(HUGGINGFACE_API_KEY),
            "HUGGINGFACE_API_KEY_MASKED": f"{HUGGINGFACE_API_KEY[:4]}...{HUGGINGFACE_API_KEY[-4:]}" if HUGGINGFACE_API_KEY else None
        }
    }
    
    # Teste Hugging Face Extraktor
    try:
        if HUGGINGFACE_API_KEY:
            # Führe einen direkten Verbindungstest durch
            test_result = huggingface_extractor.test_connection() if huggingface_extractor else {"success": False, "message": "Extraktor nicht initialisiert"}
            
            results["extractors"]["huggingface"] = {
                "name": "HuggingFaceExtractor",
                "available": test_result.get("success", False),
                "api_key_set": True,
                "model": huggingface_extractor.model if huggingface_extractor else None,
                "test_result": test_result,
                "message": test_result.get("message", "Test durchgeführt")
            }
        else:
            results["extractors"]["huggingface"] = {
                "available": False,
                "api_key_set": False,
                "message": "HuggingFace API-Key ist nicht konfiguriert"
            }
    except Exception as e:
        logger.error(f"Fehler bei der Prüfung des HuggingFace Extraktors: {str(e)}")
        results["extractors"]["huggingface"] = {
            "available": False,
            "error": str(e),
            "message": "Fehler bei der Prüfung des HuggingFace Extraktors"
        }
    
    # Teste Mock Extraktor
    try:
        results["extractors"]["mock"] = {
            "name": "MockExtractor",
            "available": True,
            "message": "Mock-Extraktor ist verfügbar"
        }
    except Exception as e:
        results["extractors"]["mock"] = {
            "available": False,
            "error": str(e),
            "message": "Fehler bei der Prüfung des Mock-Extraktors"
        }
    
    # Teste Basis-Extraktor
    try:
        test_text = "Max Mustermann, Softwareentwickler mit 5 Jahren Erfahrung in Python und JavaScript."
        extracted = cv_extractor.extract_cv_data(test_text)
        
        results["extractors"]["basic"] = {
            "name": "CVExtractor",
            "available": True,
            "sample_test": "Erfolgreich" if extracted else "Fehlgeschlagen",
            "message": "Basis-Extraktor ist verfügbar"
        }
    except Exception as e:
        results["extractors"]["basic"] = {
            "available": False,
            "error": str(e),
            "message": "Fehler bei der Prüfung des Basis-Extraktors"
        }
    
    return jsonify(results) 