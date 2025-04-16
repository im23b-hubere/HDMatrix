from flask import Blueprint, request, jsonify
from flask_cors import CORS
import os
import logging
from werkzeug.utils import secure_filename
from services.cv_service import CVService
from functools import wraps
import jwt

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint und CORS
cv_upload_bp = Blueprint('cv_upload', __name__, url_prefix='/api/cv')
CORS(cv_upload_bp)

# Konfiguration
UPLOAD_FOLDER = 'temp'
ALLOWED_EXTENSIONS = {'pdf'}

# CV Service initialisieren
cv_service = CVService()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token fehlt'}), 401
            
        try:
            token = token.split(' ')[1]  # "Bearer <token>"
            data = jwt.decode(
                token, 
                os.getenv('JWT_SECRET_KEY'), 
                algorithms=['HS256']
            )
            return f(*args, user_id=data['user_id'], **kwargs)
        except Exception as e:
            return jsonify({'error': 'Ungültiger Token'}), 401
            
    return decorated

def allowed_file(filename):
    """Prüfe ob die Dateiendung erlaubt ist"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@cv_upload_bp.route('/upload', methods=['POST'])
@token_required
def upload_cv(user_id):
    """CV hochladen und extrahieren"""
    if 'file' not in request.files:
        return jsonify({'error': 'Keine Datei gefunden'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Kein Dateiname angegeben'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'Nur PDF-Dateien sind erlaubt'}), 400

    # Stelle sicher, dass der Upload-Ordner existiert
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    temp_path = None
    try:
        # Datei sicher speichern
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(temp_path)
        
        # CV verarbeiten
        cv_data = cv_service.process_cv(temp_path)
        
        # CV in Datenbank speichern
        cv_id = cv_service.create_or_update_cv(user_id, {
            'file_name': filename,
            'extracted_data': cv_data,
            'skills': cv_data.get('skills', {}),
            'projects': cv_data.get('experience', []),
            'languages': cv_data.get('skills', {}).get('languages', []),
            'certifications': []  # Optional, falls später benötigt
        })
        
        if not cv_id:
            return jsonify({'error': 'Fehler beim Speichern des CVs'}), 500
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'cv_data': cv_data
        })
                
    except Exception as e:
        logger.error(f"Allgemeiner Fehler: {str(e)}")
        return jsonify({'error': f'Serverfehler: {str(e)}'}), 500
        
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.error(f"Fehler beim Löschen der temporären Datei: {str(e)}")

@cv_upload_bp.route('/<int:cv_id>', methods=['GET'])
@token_required
def get_cv(cv_id, user_id):
    """CV nach ID abrufen"""
    cv_data = cv_service.get_cv_by_id(cv_id, user_id)
    if not cv_data:
        return jsonify({'error': 'CV nicht gefunden'}), 404
        
    return jsonify(cv_data)

@cv_upload_bp.route('/search', methods=['POST'])
@token_required
def search_cvs(user_id):
    """CVs durchsuchen"""
    query = request.json or {}
    results = cv_service.search_cvs(query)
    return jsonify(results)

@cv_upload_bp.route('/<int:cv_id>/export', methods=['POST'])
@token_required
def export_cv(cv_id, user_id):
    """CV exportieren"""
    template_id = request.json.get('template_id')
    if not template_id:
        return jsonify({'error': 'Template-ID fehlt'}), 400
        
    result = cv_service.export_cv(cv_id, user_id, template_id)
    if not result:
        return jsonify({'error': 'Export fehlgeschlagen'}), 500
        
    return jsonify(result)

@cv_upload_bp.route('/<int:cv_id>', methods=['PUT'])
@token_required
def update_cv(cv_id, user_id):
    """CV aktualisieren"""
    cv_data = request.json
    cv_data['id'] = cv_id
    
    updated_id = cv_service.create_or_update_cv(user_id, cv_data)
    if not updated_id:
        return jsonify({'error': 'Aktualisierung fehlgeschlagen'}), 500
        
    return jsonify({'success': True, 'cv_id': updated_id}) 