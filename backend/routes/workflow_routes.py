from flask import Blueprint, request, jsonify
from services.workflow_service import WorkflowService
import logging
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

workflow_bp = Blueprint('workflow', __name__, url_prefix='/api/workflow')

# Pfad für Uploads
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'workflow_attachments')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db_connection():
    from app import get_db_connection as get_conn
    return get_conn()

@workflow_bp.route('/workflows', methods=['GET'])
def get_all_workflows():
    """Ruft alle Workflows ab."""
    try:
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        workflows = workflow_service.get_all_workflows()
        
        if conn:
            conn.close()
        
        return jsonify(workflows)
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Workflows: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/workflows/<int:workflow_id>', methods=['GET'])
def get_workflow_by_id(workflow_id):
    """Ruft einen Workflow anhand seiner ID ab."""
    try:
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        workflow = workflow_service.get_workflow_by_id(workflow_id)
        
        if conn:
            conn.close()
        
        if not workflow:
            return jsonify({'error': 'Workflow nicht gefunden'}), 404
        
        return jsonify(workflow)
    except Exception as e:
        logger.error(f"Fehler beim Abrufen des Workflows {workflow_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/workflows', methods=['POST'])
def create_workflow():
    """Erstellt einen neuen Workflow."""
    try:
        data = request.json
        
        if not data or 'name' not in data:
            return jsonify({'error': 'Name ist erforderlich'}), 400
        
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        workflow_id = workflow_service.create_workflow(data)
        
        if conn:
            conn.close()
        
        return jsonify({
            'id': workflow_id,
            'message': 'Workflow erfolgreich erstellt'
        }), 201
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Workflows: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/workflows/<int:workflow_id>', methods=['PUT'])
def update_workflow(workflow_id):
    """Aktualisiert einen Workflow."""
    try:
        data = request.json
        
        if not data or 'name' not in data:
            return jsonify({'error': 'Name ist erforderlich'}), 400
        
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        success = workflow_service.update_workflow(workflow_id, data)
        
        if conn:
            conn.close()
        
        if not success:
            return jsonify({'error': 'Workflow konnte nicht aktualisiert werden'}), 400
        
        return jsonify({'message': 'Workflow erfolgreich aktualisiert'})
    except Exception as e:
        logger.error(f"Fehler beim Aktualisieren des Workflows {workflow_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/workflows/<int:workflow_id>', methods=['DELETE'])
def delete_workflow(workflow_id):
    """Löscht einen Workflow."""
    try:
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        success = workflow_service.delete_workflow(workflow_id)
        
        if conn:
            conn.close()
        
        if not success:
            return jsonify({'error': 'Workflow konnte nicht gelöscht werden'}), 400
        
        return jsonify({'message': 'Workflow erfolgreich gelöscht'})
    except Exception as e:
        logger.error(f"Fehler beim Löschen des Workflows {workflow_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Task-Routen

@workflow_bp.route('/tasks/<int:task_id>', methods=['GET'])
def get_task_by_id(task_id):
    """Ruft einen Task anhand seiner ID ab."""
    try:
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        task = workflow_service.get_task_by_id(task_id)
        
        if conn:
            conn.close()
        
        if not task:
            return jsonify({'error': 'Task nicht gefunden'}), 404
        
        return jsonify(task)
    except Exception as e:
        logger.error(f"Fehler beim Abrufen des Tasks {task_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/tasks', methods=['POST'])
def create_task():
    """Erstellt einen neuen Task."""
    try:
        data = request.json
        
        if not data or 'title' not in data or 'workflow_id' not in data:
            return jsonify({'error': 'Titel und Workflow-ID sind erforderlich'}), 400
        
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        task_id = workflow_service.create_task(data)
        
        if conn:
            conn.close()
        
        return jsonify({
            'id': task_id,
            'message': 'Task erfolgreich erstellt'
        }), 201
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Tasks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Aktualisiert einen Task."""
    try:
        data = request.json
        
        if not data or 'title' not in data:
            return jsonify({'error': 'Titel ist erforderlich'}), 400
        
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        success = workflow_service.update_task(task_id, data)
        
        if conn:
            conn.close()
        
        if not success:
            return jsonify({'error': 'Task konnte nicht aktualisiert werden'}), 400
        
        return jsonify({'message': 'Task erfolgreich aktualisiert'})
    except Exception as e:
        logger.error(f"Fehler beim Aktualisieren des Tasks {task_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/tasks/<int:task_id>/comments', methods=['POST'])
def add_task_comment(task_id):
    """Fügt einen Kommentar zu einem Task hinzu."""
    try:
        data = request.json
        
        if not data or 'comment' not in data:
            return jsonify({'error': 'Kommentar ist erforderlich'}), 400
        
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        comment_id = workflow_service.add_task_comment(task_id, data)
        
        if conn:
            conn.close()
        
        return jsonify({
            'id': comment_id,
            'message': 'Kommentar erfolgreich hinzugefügt'
        }), 201
    except Exception as e:
        logger.error(f"Fehler beim Hinzufügen des Kommentars zu Task {task_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/tasks/<int:task_id>/attachments', methods=['POST'])
def add_task_attachment(task_id):
    """Fügt einen Anhang zu einem Task hinzu."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Keine Datei im Request gefunden'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Keine Datei ausgewählt'}), 400
        
        # Erstelle eindeutigen Dateinamen
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Speichere Datei
        file.save(file_path)
        
        # Erstelle Attachment-Eintrag in der Datenbank
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        
        attachment_data = {
            'file_name': filename,
            'file_path': file_path,
            'file_type': file.content_type,
            'file_size': os.path.getsize(file_path),
            'uploaded_by': request.form.get('user_id')
        }
        
        attachment_id = workflow_service.add_task_attachment(task_id, attachment_data)
        
        if conn:
            conn.close()
        
        return jsonify({
            'id': attachment_id,
            'file_name': filename,
            'file_path': file_path,
            'message': 'Anhang erfolgreich hochgeladen'
        }), 201
    except Exception as e:
        logger.error(f"Fehler beim Hochladen des Anhangs für Task {task_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/user/<int:user_id>/tasks', methods=['GET'])
def get_user_tasks(user_id):
    """Ruft alle Tasks eines Benutzers ab."""
    try:
        status = request.args.get('status')
        
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        tasks = workflow_service.get_user_tasks(user_id, status)
        
        if conn:
            conn.close()
        
        return jsonify(tasks)
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Tasks für Benutzer {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/user/<int:user_id>/notifications', methods=['GET'])
def get_user_notifications(user_id):
    """Ruft alle Benachrichtigungen eines Benutzers ab."""
    try:
        is_read = request.args.get('is_read')
        if is_read is not None:
            is_read = is_read.lower() == 'true'
        
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        notifications = workflow_service.get_user_notifications(user_id, is_read)
        
        if conn:
            conn.close()
        
        return jsonify(notifications)
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Benachrichtigungen für Benutzer {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workflow_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    """Markiert eine Benachrichtigung als gelesen."""
    try:
        conn = get_db_connection()
        workflow_service = WorkflowService(conn)
        success = workflow_service.mark_notification_as_read(notification_id)
        
        if conn:
            conn.close()
        
        if not success:
            return jsonify({'error': 'Benachrichtigung konnte nicht als gelesen markiert werden'}), 400
        
        return jsonify({'message': 'Benachrichtigung erfolgreich als gelesen markiert'})
    except Exception as e:
        logger.error(f"Fehler beim Markieren der Benachrichtigung {notification_id} als gelesen: {str(e)}")
        return jsonify({'error': str(e)}), 500 