from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from services.pdf_extractor import PDFExtractor
import logging

pdf_bp = Blueprint('pdf', __name__)
logger = logging.getLogger(__name__)

# Konfiguration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@pdf_bp.route('/extract', methods=['POST'])
def extract_pdf():
    """
    Einfache Route zum Testen der PDF-Extraktion.
    Erwartet eine PDF-Datei im Formular-Feld 'file'.
    """
    try:
        # Überprüfe ob eine Datei gesendet wurde
        if 'file' not in request.files:
            return jsonify({'error': 'Keine Datei gefunden'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Kein Dateiname'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'error': 'Nur PDF-Dateien erlaubt'}), 400
            
        # Sichere die Datei
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Stelle sicher dass der Upload-Ordner existiert
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Speichere die Datei
        file.save(filepath)
        
        # Extrahiere Text
        extractor = PDFExtractor()
        if not extractor.is_valid_pdf(filepath):
            os.remove(filepath)
            return jsonify({'error': 'Ungültige PDF-Datei'}), 400
            
        text = extractor.extract_text(filepath)
        
        # Lösche die temporäre Datei
        os.remove(filepath)
        
        if text is None:
            return jsonify({'error': 'Konnte keinen Text aus der PDF extrahieren'}), 400
            
        return jsonify({
            'success': True,
            'text': text,
            'length': len(text)
        })
        
    except Exception as e:
        logger.error(f"Fehler bei der PDF-Verarbeitung: {str(e)}")
        return jsonify({'error': str(e)}), 500 