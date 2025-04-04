from flask import Blueprint, request, jsonify, current_app
from flask_cors import CORS
import os
import tempfile
from werkzeug.utils import secure_filename
import logging
from services.cv_service import CVService
from db.db_service import get_db_connection
from ollama_extraction import OllamaExtractor

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint definieren
cv_upload_bp = Blueprint('cv_upload', __name__)

# CORS speziell für diesen Blueprint konfigurieren
CORS(cv_upload_bp, 
     origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-Custom-Header", "*"],
     supports_credentials=True,
     max_age=86400)

# CV-Service für Datenbankoperationen
cv_service = CVService()

# Ollama-Extraktor für KI-Extraktion
extractor = OllamaExtractor(model="mistral")

# Erlaubte Dateitypen für den Upload
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}

def allowed_file(filename):
    """Überprüft, ob die Datei einen erlaubten Dateityp hat"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# OPTIONS-Handler für CORS-Preflight-Anfragen
@cv_upload_bp.route('/upload', methods=['OPTIONS'])
@cv_upload_bp.route('/extract-preview', methods=['OPTIONS'])
def handle_options():
    return '', 204

# Route zum Hochladen und Verarbeiten eines Lebenslaufs (speichert in der Datenbank)
@cv_upload_bp.route('/upload', methods=['POST', 'OPTIONS'])
def upload_cv():
    # OPTIONS-Anfragen für CORS
    if request.method == 'OPTIONS':
        return '', 204
        
    logger.info("CV Upload API aufgerufen")
    
    # Überprüfe, ob eine Datei im Request vorhanden ist
    if 'file' not in request.files:
        logger.error("Keine Datei im Request gefunden")
        return jsonify({
            'success': False,
            'message': 'Keine Datei gefunden'
        }), 400
    
    file = request.files['file']
    
    # Überprüfe, ob ein Dateiname vorhanden ist
    if file.filename == '':
        logger.error("Leerer Dateiname")
        return jsonify({
            'success': False,
            'message': 'Kein Dateiname angegeben'
        }), 400
    
    # Überprüfe, ob der Dateityp erlaubt ist
    if not allowed_file(file.filename):
        logger.error(f"Nicht erlaubter Dateityp: {file.filename}")
        return jsonify({
            'success': False,
            'message': 'Nicht unterstütztes Dateiformat. Erlaubte Formate: ' + ', '.join(ALLOWED_EXTENSIONS)
        }), 400
    
    try:
        # Speichere die Datei temporär
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            file.save(temp_file.name)
            logger.info(f"Datei temporär gespeichert: {temp_file.name}")
            
            # Extrahiere Daten mit Ollama
            extraction_result = extractor.extract_from_file(temp_file.name)
            logger.info(f"Extraktion abgeschlossen: {extraction_result is not None}")
            
            if 'error' in extraction_result:
                logger.error(f"Fehler bei der Extraktion: {extraction_result['error']}")
                return jsonify({
                    'success': False,
                    'message': f"Fehler bei der Extraktion: {extraction_result['error']}"
                }), 500
            
            # Hole Mandanten-ID aus dem Formular oder setze Default
            tenant_id = request.form.get('tenant_id', '1')  # Default ist Mandant 1
            
            # Erstelle einen neuen Mitarbeiter und CV in der Datenbank
            result = cv_service.create_cv_from_extracted_data(
                extracted_data=extraction_result, 
                tenant_id=tenant_id, 
                filename=secure_filename(file.filename)
            )
            
            # Lösche die temporäre Datei
            os.unlink(temp_file.name)
            logger.info("Temporäre Datei gelöscht")
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': 'Lebenslauf erfolgreich verarbeitet',
                    'cv_id': result.get('cv_id'),
                    'employee_id': result.get('employee_id')
                })
            else:
                return jsonify({
                    'success': False,
                    'message': result.get('message', 'Fehler beim Speichern des Lebenslaufs')
                }), 500
                
    except Exception as e:
        logger.exception(f"Fehler beim Verarbeiten des Lebenslaufs: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Ein Fehler ist aufgetreten: {str(e)}'
        }), 500

# Route zum Extrahieren einer Vorschau ohne Speicherung
@cv_upload_bp.route('/extract-preview', methods=['POST', 'OPTIONS'])
def extract_preview():
    # OPTIONS-Anfragen für CORS
    if request.method == 'OPTIONS':
        return '', 204
        
    logger.info("CV Vorschau-Extraktion API aufgerufen")
    
    # Überprüfe, ob eine Datei im Request vorhanden ist
    if 'file' not in request.files:
        logger.error("Keine Datei im Request gefunden")
        return jsonify({
            'success': False,
            'message': 'Keine Datei gefunden'
        }), 400
    
    file = request.files['file']
    
    # Überprüfe, ob ein Dateiname vorhanden ist
    if file.filename == '':
        logger.error("Leerer Dateiname")
        return jsonify({
            'success': False,
            'message': 'Kein Dateiname angegeben'
        }), 400
    
    # Überprüfe, ob der Dateityp erlaubt ist
    if not allowed_file(file.filename):
        logger.error(f"Nicht erlaubter Dateityp: {file.filename}")
        return jsonify({
            'success': False,
            'message': 'Nicht unterstütztes Dateiformat. Erlaubte Formate: ' + ', '.join(ALLOWED_EXTENSIONS)
        }), 400
    
    try:
        # Speichere die Datei temporär
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            file.save(temp_file.name)
            logger.info(f"Datei temporär gespeichert: {temp_file.name}")
            
            # Extrahiere Daten mit Ollama
            logger.info("Starte Extraktion mit Ollama...")
            extraction_result = extractor.extract_from_file(temp_file.name)
            logger.info(f"Extraktion abgeschlossen: {extraction_result is not None}")
            
            # Lösche die temporäre Datei
            os.unlink(temp_file.name)
            logger.info("Temporäre Datei gelöscht")
            
            if 'error' in extraction_result:
                logger.error(f"Fehler bei der Extraktion: {extraction_result['error']}")
                return jsonify({
                    'success': False,
                    'message': f"Fehler bei der Extraktion: {extraction_result['error']}"
                }), 500
            
            # Extrahiere einen kurzen Text aus der Datei für die Vorschau (dies könnte verbessert werden)
            text_sample = "Textvorschau nicht verfügbar"
            
            return jsonify({
                'success': True,
                'message': 'Daten erfolgreich extrahiert',
                'extracted_data': extraction_result,
                'text_sample': text_sample
            })
                
    except Exception as e:
        logger.exception(f"Fehler bei der Vorschau-Extraktion: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Ein Fehler ist aufgetreten: {str(e)}'
        }), 500

# Testroute, um direkt Ollama zu überprüfen
@cv_upload_bp.route('/test-ollama', methods=['GET'])
def test_ollama():
    logger.info("Teste Ollama-Verbindung...")
    try:
        # Einfacher Test mit vordefiniertem Text
        test_text = """
        Max Mustermann
        Email: max@example.com
        Telefon: 0123-456789
        
        Ausbildung:
        2015-2019: Bachelor in Informatik, TU Berlin
        
        Berufserfahrung:
        2019-2021: Softwareentwickler bei Tech GmbH
        """
        
        result = extractor.extract_cv(test_text)
        
        if 'error' in result:
            logger.error(f"Fehler bei Ollama-Test: {result['error']}")
            return jsonify({
                'success': False,
                'message': f"Fehler bei Ollama-Test: {result['error']}",
                'test_text': test_text
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Ollama-Verbindung funktioniert',
            'result': result,
            'test_text': test_text
        })
        
    except Exception as e:
        logger.exception(f"Fehler beim Testen von Ollama: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Ein Fehler ist aufgetreten: {str(e)}'
        }), 500 