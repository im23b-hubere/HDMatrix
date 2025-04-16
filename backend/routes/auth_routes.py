from flask import Blueprint, request, jsonify
import os
from functools import wraps
from services import auth_service
from flask_cors import CORS
import time
import traceback
from services.auth_service import AuthService
import logging

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_routes = Blueprint('auth_routes', __name__)
CORS(auth_routes, 
     origins=["http://localhost:3000"],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Authorization", "Content-Type", "Accept"])

# Expliziter Handler für OPTIONS-Anfragen an alle Routes
@auth_routes.route('/<path:path>', methods=['OPTIONS'])
@auth_routes.route('/', defaults={'path': ''}, methods=['OPTIONS'])
def handle_auth_options(path):
    return '', 204

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token fehlt'}), 401
            
        try:
            # Token Format: "Bearer <token>"
            token = token.split(' ')[1]
            user_data = AuthService.verify_token(token)
            return f(*args, user_id=user_data['user_id'], **kwargs)
        except Exception as e:
            return jsonify({'error': 'Ungültiger Token'}), 401
            
    return decorated

def permission_required(permission_name):
    def decorator(f):
        @wraps(f)
        def decorated(user_id, *args, **kwargs):
            # Berechtigung überprüfen
            if not auth_service.has_permission(user_id, permission_name):
                return jsonify({'success': False, 'message': 'Keine Berechtigung!'}), 403
            
            return f(user_id=user_id, *args, **kwargs)
        return decorated
    return decorator

@auth_routes.route('/register', methods=['POST'])
def register():
    """Neuen Benutzer registrieren"""
    data = request.json
    
    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Fehlende Pflichtfelder'}), 400
        
    user_id = AuthService.create_user(
        data['username'],
        data['email'],
        data['password']
    )
    
    if not user_id:
        return jsonify({
            'error': 'Registrierung fehlgeschlagen. Benutzername oder E-Mail bereits vergeben.'
        }), 400
        
    return jsonify({
        'success': True,
        'message': 'Registrierung erfolgreich',
        'user_id': user_id
    })

@auth_routes.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    result = auth_service.verify_email(token)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/login', methods=['POST'])
def login():
    """Benutzer einloggen"""
    data = request.json
    
    if not all(k in data for k in ['username', 'password']):
        return jsonify({'error': 'Fehlende Anmeldedaten'}), 400
        
    user_data, error = AuthService.login(data['username'], data['password'])
    
    if error:
        return jsonify({'error': error}), 401
        
    return jsonify({
        'success': True,
        'user': user_data
    })

@auth_routes.route('/logout', methods=['POST'])
@token_required
def logout(user_id):
    """Benutzer ausloggen"""
    session_token = request.json.get('session_token')
    if not session_token:
        return jsonify({'error': 'Session-Token fehlt'}), 400
        
    if AuthService.logout(user_id, session_token):
        return jsonify({
            'success': True,
            'message': 'Erfolgreich ausgeloggt'
        })
    else:
        return jsonify({'error': 'Logout fehlgeschlagen'}), 500

@auth_routes.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    
    if not data or 'email' not in data:
        return jsonify({'success': False, 'message': 'E-Mail ist erforderlich!'}), 400
    
    result = auth_service.forgot_password(data['email'])
    
    # Hier würde normalerweise eine E-Mail mit dem Reset-Link gesendet
    if result['success'] and 'reset_token' in result:
        reset_url = f"{request.host_url}auth/reset-password/{result['reset_token']}"
        print(f"Reset-URL für Benutzer: {reset_url}")
    
    # Immer Erfolg melden, damit keine Info über existierende E-Mails preisgegeben wird
    return jsonify({'success': True, 'message': 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.'}), 200

@auth_routes.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    
    if not data or 'token' not in data or 'new_password' not in data:
        return jsonify({'success': False, 'message': 'Token und neues Passwort sind erforderlich!'}), 400
    
    result = auth_service.reset_password(data['token'], data['new_password'])
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/profile', methods=['GET'])
@token_required
def get_profile(user_id):
    """Benutzerprofil abrufen"""
    user_data = AuthService.get_user_by_id(user_id)
    
    if not user_data:
        return jsonify({'error': 'Benutzer nicht gefunden'}), 404
        
    return jsonify(user_data)

@auth_routes.route('/profile', methods=['PUT'])
@token_required
def update_profile(user_id):
    """Benutzerprofil aktualisieren"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'Keine Aktualisierungsdaten'}), 400
        
    if AuthService.update_user(user_id, data):
        return jsonify({
            'success': True,
            'message': 'Profil erfolgreich aktualisiert'
        })
    else:
        return jsonify({'error': 'Aktualisierung fehlgeschlagen'}), 500

@auth_routes.route('/check-auth', methods=['GET'])
@token_required
def check_auth(user_id):
    """Überprüft die Authentifizierung"""
    return jsonify({
        'authenticated': True,
        'user_id': user_id
    })

# Benutzer-Routen (mit Berechtigungsprüfung)

@auth_routes.route('/users', methods=['GET'])
@token_required
@permission_required('user_read')
def list_users(user_id, role, tenant_id):
    offset = request.args.get('offset', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    
    result = auth_service.list_users(tenant_id, offset, limit)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/users/<int:id>', methods=['GET'])
@token_required
@permission_required('user_read')
def get_user(user_id, role, tenant_id, id):
    result = auth_service.get_user(id)
    
    if not result['success']:
        return jsonify(result), 404
    
    return jsonify(result), 200

@auth_routes.route('/users/<int:id>', methods=['PUT'])
@token_required
@permission_required('user_update')
def update_user(user_id, role, tenant_id, id):
    data = request.json
    
    if not data:
        return jsonify({'success': False, 'message': 'Keine Daten zum Aktualisieren!'}), 400
    
    result = auth_service.update_user(id, data)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/users/<int:id>', methods=['DELETE'])
@token_required
@permission_required('user_delete')
def delete_user(user_id, role, tenant_id, id):
    result = auth_service.delete_user(id)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

# Mandanten-Routen (nur für Admins)

@auth_routes.route('/tenants', methods=['POST'])
@token_required
@permission_required('tenant_manage')
def create_tenant(user_id, role, tenant_id):
    data = request.json
    
    if not data or 'name' not in data or 'subdomain' not in data:
        return jsonify({'success': False, 'message': 'Name und Subdomain sind erforderlich!'}), 400
    
    result = auth_service.create_tenant(
        name=data['name'],
        subdomain=data['subdomain'],
        logo_url=data.get('logo_url'),
        primary_color=data.get('primary_color')
    )
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 201

@auth_routes.route('/tenants', methods=['GET'])
@token_required
@permission_required('tenant_manage')
def list_tenants(user_id, role, tenant_id):
    offset = request.args.get('offset', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    
    result = auth_service.list_tenants(offset, limit)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/tenants/<int:id>', methods=['GET'])
@token_required
def get_tenant(user_id, role, tenant_id, id):
    # Für den eigenen Mandanten oder mit tenant_manage-Berechtigung
    if id != tenant_id and not auth_service.has_permission(user_id, 'tenant_manage'):
        return jsonify({'success': False, 'message': 'Keine Berechtigung!'}), 403
    
    result = auth_service.get_tenant(id)
    
    if not result['success']:
        return jsonify(result), 404
    
    return jsonify(result), 200

@auth_routes.route('/tenants/<int:id>', methods=['PUT'])
@token_required
@permission_required('tenant_manage')
def update_tenant(user_id, role, tenant_id, id):
    data = request.json
    
    if not data:
        return jsonify({'success': False, 'message': 'Keine Daten zum Aktualisieren!'}), 400
    
    result = auth_service.update_tenant(id, data)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/tenants/<int:id>', methods=['DELETE'])
@token_required
@permission_required('tenant_manage')
def delete_tenant(user_id, role, tenant_id, id):
    result = auth_service.delete_tenant(id)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/tenants/by-subdomain/<subdomain>', methods=['GET'])
def get_tenant_by_subdomain(subdomain):
    result = auth_service.get_tenant_by_subdomain(subdomain)
    
    if not result['success']:
        return jsonify(result), 404
    
    return jsonify(result), 200

# Rollen und Berechtigungen

@auth_routes.route('/roles', methods=['GET'])
@token_required
def get_roles(user_id, role, tenant_id):
    result = auth_service.get_roles()
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/permissions', methods=['GET'])
@token_required
def get_permissions(user_id, role, tenant_id):
    result = auth_service.get_permissions()
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/roles/<int:id>/permissions', methods=['GET'])
@token_required
def get_role_permissions(user_id, role, tenant_id, id):
    result = auth_service.get_role_permissions(id)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/roles/<int:id>/permissions', methods=['PUT'])
@token_required
@permission_required('tenant_manage')
def update_role_permissions(user_id, role, tenant_id, id):
    data = request.json
    
    if not data or 'permission_ids' not in data:
        return jsonify({'success': False, 'message': 'Berechtigungs-IDs sind erforderlich!'}), 400
    
    result = auth_service.update_role_permissions(id, data['permission_ids'])
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/test-post', methods=['GET', 'POST', 'OPTIONS'])
def test_post():
    """
    Test-Endpunkt für POST-Anfragen
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
        return jsonify({"success": True, "message": "POST-Anfrage erfolgreich", "data": data}), 200
    
    return jsonify({"success": True, "message": "GET-Anfrage erfolgreich"}), 200

@auth_routes.route('/test', methods=['GET'])
def test_route():
    """
    Test-Endpunkt um zu prüfen, ob die API erreichbar ist
    """
    return jsonify({"success": True, "message": "Auth-API ist erreichbar!"}), 200 