from flask import Blueprint, request, jsonify
import os
from functools import wraps
from services import auth_service
from flask_cors import CORS
import time
import traceback

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
        token = None
        
        # Token aus Header holen
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Token fehlt!'}), 401
        
        # Token überprüfen
        decoded = auth_service.decode_jwt_token(token)
        if not decoded['valid']:
            return jsonify({'success': False, 'message': decoded['error']}), 401
        
        # Benutzer-ID und Rolle aus Token holen
        user_id = decoded['payload']['sub']
        role = decoded['payload']['role']
        tenant_id = decoded['payload']['tenant_id']
        
        # Daten an die dekorierte Funktion übergeben
        return f(user_id=user_id, role=role, tenant_id=tenant_id, *args, **kwargs)
    
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
    data = request.json
    
    # Prüfen, ob alle erforderlichen Felder vorhanden sind
    required_fields = ['email', 'password', 'first_name', 'last_name', 'tenant_id', 'role_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Feld {field} fehlt!'}), 400
    
    # Optional: Auch Mitarbeiter erstellen
    create_employee = data.get('create_employee', False)
    
    # Benutzer registrieren
    result = auth_service.register_user(
        tenant_id=data['tenant_id'],
        email=data['email'],
        password=data['password'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        role_id=data['role_id'],
        create_employee=create_employee
    )
    
    if not result['success']:
        return jsonify(result), 400
    
    # Hier würde normalerweise eine E-Mail mit dem Verifizierungslink gesendet
    verification_url = f"{request.host_url}auth/verify-email/{result['verification_token']}"
    
    return jsonify({
        'success': True,
        'user_id': result['user_id'],
        'verification_url': verification_url
    }), 201

@auth_routes.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    result = auth_service.verify_email(token)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

@auth_routes.route('/login', methods=['POST', 'OPTIONS'])
def login_route():
    """
    Endpunkt für die Benutzeranmeldung
    """
    # Behandle OPTIONS-Anfragen
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        # Request-Daten holen
        data = request.get_json()
        print(f"Login-Anfrage erhalten: {data}")
        
        if not data:
            print("Keine Daten empfangen")
            return jsonify({"success": False, "message": "Keine Daten empfangen. Bitte E-Mail und Passwort angeben."}), 400
        
        email = data.get('email', '')
        password = data.get('password', '')
        
        # Basisvalidierung
        if not email or not password:
            print(f"Email oder Passwort fehlt. Email: {email}, Passwort: {'*'*len(password) if password else 'leer'}")
            return jsonify({"success": False, "message": "E-Mail und Passwort sind erforderlich"}), 400
        
        # IP-Adresse und User-Agent des Clients erfassen
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        print(f"Login-Versuch für {email} von IP {ip_address}")
        
        # Login-Funktion aufrufen
        result = auth_service.login(email, password, ip_address, user_agent)
        
        print(f"Login-Ergebnis: {result}")
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 401
    
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Login-Fehler: {str(e)}\n{error_trace}")
        return jsonify({"success": False, "message": f"Server-Fehler: {str(e)}"}), 500

@auth_routes.route('/logout', methods=['POST'])
@token_required
def logout(user_id, role, tenant_id):
    token = request.headers['Authorization'].split(' ')[1]
    result = auth_service.logout(token)
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify({'success': True}), 200

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

@auth_routes.route('/me', methods=['GET'])
@token_required
def get_current_user(user_id, role, tenant_id):
    result = auth_service.get_user(user_id)
    
    if not result['success']:
        return jsonify(result), 404
    
    return jsonify(result), 200

@auth_routes.route('/change-password', methods=['POST'])
@token_required
def change_password(user_id, role, tenant_id):
    data = request.json
    
    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({'success': False, 'message': 'Aktuelles und neues Passwort sind erforderlich!'}), 400
    
    result = auth_service.change_password(
        user_id=user_id,
        current_password=data['current_password'],
        new_password=data['new_password']
    )
    
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result), 200

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