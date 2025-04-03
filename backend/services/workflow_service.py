import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class WorkflowService:
    """Service für die Verwaltung von Workflows und Tasks."""
    
    def __init__(self, db_connection):
        """Initialisiert den WorkflowService.
        
        Args:
            db_connection: Die Datenbankverbindung
        """
        self.conn = db_connection
    
    def get_all_workflows(self) -> List[Dict[str, Any]]:
        """Holt alle Workflows aus der Datenbank.
        
        Returns:
            Eine Liste von Workflow-Dictionaries
        """
        try:
            cur = self.conn.cursor(dictionary=True)
            query = """
            SELECT 
                w.id, w.name, w.description, w.status, w.created_at, w.updated_at,
                m.vorname || ' ' || m.nachname as created_by_name,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
            FROM workflows w
            LEFT JOIN mitarbeiter m ON w.created_by = m.id
            LEFT JOIN tasks t ON w.id = t.workflow_id
            GROUP BY w.id, m.id
            ORDER BY w.created_at DESC
            """
            cur.execute(query)
            workflows = cur.fetchall()
            cur.close()
            return workflows
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Workflows: {str(e)}")
            raise
    
    def get_workflow_by_id(self, workflow_id: int) -> Dict[str, Any]:
        """Holt einen Workflow anhand seiner ID.
        
        Args:
            workflow_id: Die ID des Workflows
            
        Returns:
            Ein Workflow-Dictionary mit allen Stages und Tasks
        """
        try:
            cur = self.conn.cursor(dictionary=True)
            
            # Workflow-Details holen
            query = """
            SELECT 
                w.*,
                m.vorname || ' ' || m.nachname as created_by_name
            FROM workflows w
            LEFT JOIN mitarbeiter m ON w.created_by = m.id
            WHERE w.id = %s
            """
            cur.execute(query, (workflow_id,))
            workflow = cur.fetchone()
            
            if not workflow:
                cur.close()
                return None
            
            # Stages für diesen Workflow holen
            query = """
            SELECT * FROM workflow_stages
            WHERE workflow_id = %s
            ORDER BY order_index
            """
            cur.execute(query, (workflow_id,))
            stages = cur.fetchall()
            workflow['stages'] = stages
            
            # Tasks für diesen Workflow holen, nach Stages gruppiert
            for stage in workflow['stages']:
                query = """
                SELECT 
                    t.*,
                    m.vorname || ' ' || m.nachname as assigned_to_name,
                    m2.vorname || ' ' || m2.nachname as assigned_by_name
                FROM tasks t
                LEFT JOIN mitarbeiter m ON t.assigned_to = m.id
                LEFT JOIN mitarbeiter m2 ON t.assigned_by = m.id
                WHERE t.workflow_id = %s AND t.stage_id = %s
                ORDER BY t.due_date
                """
                cur.execute(query, (workflow_id, stage['id']))
                tasks = cur.fetchall()
                stage['tasks'] = tasks
            
            cur.close()
            return workflow
        except Exception as e:
            logger.error(f"Fehler beim Abrufen des Workflows {workflow_id}: {str(e)}")
            raise
    
    def create_workflow(self, workflow_data: Dict[str, Any]) -> int:
        """Erstellt einen neuen Workflow.
        
        Args:
            workflow_data: Die Daten für den neuen Workflow
            
        Returns:
            Die ID des erstellten Workflows
        """
        try:
            cur = self.conn.cursor()
            
            # Workflow erstellen
            query = """
            INSERT INTO workflows (name, description, status, created_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """
            cur.execute(query, (
                workflow_data['name'],
                workflow_data.get('description'),
                workflow_data.get('status', 'active'),
                workflow_data.get('created_by')
            ))
            workflow_id = cur.fetchone()[0]
            
            # Wenn ein Template angegeben ist, Stages und Tasks kopieren
            if 'template_id' in workflow_data and workflow_data['template_id']:
                self._copy_template_to_workflow(workflow_data['template_id'], workflow_id)
            
            self.conn.commit()
            cur.close()
            return workflow_id
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Erstellen des Workflows: {str(e)}")
            raise
    
    def _copy_template_to_workflow(self, template_id: int, workflow_id: int) -> None:
        """Kopiert ein Template (Stages und Tasks) zu einem Workflow.
        
        Args:
            template_id: Die ID des Templates
            workflow_id: Die ID des Ziel-Workflows
        """
        try:
            cur = self.conn.cursor()
            
            # Stages kopieren
            query = """
            INSERT INTO workflow_stages (
                workflow_id, name, description, order_index, is_required, estimated_duration
            )
            SELECT 
                %s, name, description, order_index, is_required, estimated_duration
            FROM workflow_template_stages
            WHERE template_id = %s
            RETURNING id, (
                SELECT id FROM workflow_template_stages 
                WHERE template_id = %s AND order_index = workflow_stages.order_index
            ) as template_stage_id
            """
            cur.execute(query, (workflow_id, template_id, template_id))
            stage_mapping = {row[1]: row[0] for row in cur.fetchall()}
            
            # Tasks kopieren
            for template_stage_id, workflow_stage_id in stage_mapping.items():
                query = """
                INSERT INTO tasks (
                    workflow_id, stage_id, title, description, status, priority, estimated_hours
                )
                SELECT 
                    %s, %s, title, description, 'pending', priority, estimated_hours
                FROM workflow_template_tasks
                WHERE template_id = %s AND stage_id = %s
                """
                cur.execute(query, (workflow_id, workflow_stage_id, template_id, template_stage_id))
            
            self.conn.commit()
            cur.close()
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Kopieren des Templates {template_id} zum Workflow {workflow_id}: {str(e)}")
            raise
    
    def update_workflow(self, workflow_id: int, workflow_data: Dict[str, Any]) -> bool:
        """Aktualisiert einen Workflow.
        
        Args:
            workflow_id: Die ID des zu aktualisierenden Workflows
            workflow_data: Die aktualisierten Daten
            
        Returns:
            True, wenn erfolgreich, sonst False
        """
        try:
            cur = self.conn.cursor()
            
            query = """
            UPDATE workflows
            SET name = %s, description = %s, status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """
            cur.execute(query, (
                workflow_data['name'],
                workflow_data.get('description'),
                workflow_data.get('status', 'active'),
                workflow_id
            ))
            
            self.conn.commit()
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Aktualisieren des Workflows {workflow_id}: {str(e)}")
            return False
    
    def delete_workflow(self, workflow_id: int) -> bool:
        """Löscht einen Workflow.
        
        Args:
            workflow_id: Die ID des zu löschenden Workflows
            
        Returns:
            True, wenn erfolgreich, sonst False
        """
        try:
            cur = self.conn.cursor()
            
            # Löschen aller zugehörigen Tasks
            cur.execute("DELETE FROM tasks WHERE workflow_id = %s", (workflow_id,))
            
            # Löschen aller zugehörigen Stages
            cur.execute("DELETE FROM workflow_stages WHERE workflow_id = %s", (workflow_id,))
            
            # Löschen des Workflows
            cur.execute("DELETE FROM workflows WHERE id = %s", (workflow_id,))
            
            self.conn.commit()
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Löschen des Workflows {workflow_id}: {str(e)}")
            return False
    
    # Task-Management-Methoden
    
    def get_task_by_id(self, task_id: int) -> Dict[str, Any]:
        """Holt einen Task anhand seiner ID.
        
        Args:
            task_id: Die ID des Tasks
            
        Returns:
            Ein Task-Dictionary mit allen Details
        """
        try:
            cur = self.conn.cursor(dictionary=True)
            
            query = """
            SELECT 
                t.*,
                m.vorname || ' ' || m.nachname as assigned_to_name,
                m2.vorname || ' ' || m2.nachname as assigned_by_name,
                w.name as workflow_name,
                s.name as stage_name
            FROM tasks t
            LEFT JOIN mitarbeiter m ON t.assigned_to = m.id
            LEFT JOIN mitarbeiter m2 ON t.assigned_by = m.id
            LEFT JOIN workflows w ON t.workflow_id = w.id
            LEFT JOIN workflow_stages s ON t.stage_id = s.id
            WHERE t.id = %s
            """
            cur.execute(query, (task_id,))
            task = cur.fetchone()
            
            if not task:
                cur.close()
                return None
            
            # Kommentare holen
            query = """
            SELECT 
                c.*,
                m.vorname || ' ' || m.nachname as created_by_name
            FROM task_comments c
            LEFT JOIN mitarbeiter m ON c.created_by = m.id
            WHERE c.task_id = %s
            ORDER BY c.created_at DESC
            """
            cur.execute(query, (task_id,))
            comments = cur.fetchall()
            task['comments'] = comments
            
            # Anhänge holen
            query = """
            SELECT 
                a.*,
                m.vorname || ' ' || m.nachname as uploaded_by_name
            FROM task_attachments a
            LEFT JOIN mitarbeiter m ON a.uploaded_by = m.id
            WHERE a.task_id = %s
            ORDER BY a.uploaded_at DESC
            """
            cur.execute(query, (task_id,))
            attachments = cur.fetchall()
            task['attachments'] = attachments
            
            # Abhängigkeiten holen
            query = """
            SELECT 
                t.*,
                m.vorname || ' ' || m.nachname as assigned_to_name
            FROM tasks t
            JOIN task_dependencies d ON t.id = d.depends_on_task_id
            LEFT JOIN mitarbeiter m ON t.assigned_to = m.id
            WHERE d.task_id = %s
            """
            cur.execute(query, (task_id,))
            dependencies = cur.fetchall()
            task['dependencies'] = dependencies
            
            cur.close()
            return task
        except Exception as e:
            logger.error(f"Fehler beim Abrufen des Tasks {task_id}: {str(e)}")
            raise
    
    def create_task(self, task_data: Dict[str, Any]) -> int:
        """Erstellt einen neuen Task.
        
        Args:
            task_data: Die Daten für den neuen Task
            
        Returns:
            Die ID des erstellten Tasks
        """
        try:
            cur = self.conn.cursor()
            
            query = """
            INSERT INTO tasks (
                workflow_id, stage_id, title, description, status, priority, 
                assigned_to, assigned_by, due_date, start_date, estimated_hours
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """
            cur.execute(query, (
                task_data['workflow_id'],
                task_data.get('stage_id'),
                task_data['title'],
                task_data.get('description'),
                task_data.get('status', 'pending'),
                task_data.get('priority', 'medium'),
                task_data.get('assigned_to'),
                task_data.get('assigned_by'),
                task_data.get('due_date'),
                task_data.get('start_date'),
                task_data.get('estimated_hours')
            ))
            
            task_id = cur.fetchone()[0]
            
            # Abhängigkeiten hinzufügen, wenn vorhanden
            if 'dependencies' in task_data and task_data['dependencies']:
                for dep_task_id in task_data['dependencies']:
                    query = """
                    INSERT INTO task_dependencies (task_id, depends_on_task_id)
                    VALUES (%s, %s)
                    """
                    cur.execute(query, (task_id, dep_task_id))
            
            # Benachrichtigung erstellen, wenn zugewiesen
            if task_data.get('assigned_to'):
                self._create_assignment_notification(
                    task_id, task_data['title'], task_data.get('assigned_to'), task_data.get('assigned_by')
                )
            
            self.conn.commit()
            cur.close()
            return task_id
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Erstellen des Tasks: {str(e)}")
            raise
    
    def _create_assignment_notification(self, task_id: int, task_title: str, 
                                       user_id: int, assigned_by: Optional[int] = None) -> None:
        """Erstellt eine Benachrichtigung für eine Task-Zuweisung.
        
        Args:
            task_id: Die ID des Tasks
            task_title: Der Titel des Tasks
            user_id: Die ID des Benutzers, der benachrichtigt werden soll
            assigned_by: Die ID des Benutzers, der die Zuweisung vorgenommen hat (optional)
        """
        try:
            cur = self.conn.cursor()
            
            message = f"Du wurdest dem Task '{task_title}' zugewiesen"
            if assigned_by:
                # Name des zuweisenden Benutzers holen
                cur.execute(
                    "SELECT vorname || ' ' || nachname FROM mitarbeiter WHERE id = %s", 
                    (assigned_by,)
                )
                assigner_name = cur.fetchone()[0]
                message += f" von {assigner_name}"
            
            query = """
            INSERT INTO notifications (
                user_id, title, message, type, related_entity_type, related_entity_id
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            cur.execute(query, (
                user_id,
                "Neue Aufgabe zugewiesen",
                message,
                "task_assignment",
                "task",
                task_id
            ))
            
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Erstellen der Zuweisung-Benachrichtigung: {str(e)}")
    
    def update_task(self, task_id: int, task_data: Dict[str, Any]) -> bool:
        """Aktualisiert einen Task.
        
        Args:
            task_id: Die ID des zu aktualisierenden Tasks
            task_data: Die aktualisierten Daten
            
        Returns:
            True, wenn erfolgreich, sonst False
        """
        try:
            cur = self.conn.cursor()
            
            # Alte Daten für Vergleich holen
            cur.execute("SELECT assigned_to, status FROM tasks WHERE id = %s", (task_id,))
            old_data = cur.fetchone()
            old_assigned_to, old_status = old_data[0], old_data[1]
            
            query = """
            UPDATE tasks
            SET title = %s, description = %s, status = %s, priority = %s, 
                assigned_to = %s, due_date = %s, estimated_hours = %s,
                stage_id = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """
            cur.execute(query, (
                task_data['title'],
                task_data.get('description'),
                task_data.get('status', 'pending'),
                task_data.get('priority', 'medium'),
                task_data.get('assigned_to'),
                task_data.get('due_date'),
                task_data.get('estimated_hours'),
                task_data.get('stage_id'),
                task_id
            ))
            
            # Status-Updates verarbeiten
            if 'status' in task_data and task_data['status'] != old_status:
                if task_data['status'] == 'completed':
                    # Wenn Task abgeschlossen, Abschlussdatum setzen
                    cur.execute(
                        "UPDATE tasks SET completion_date = CURRENT_TIMESTAMP WHERE id = %s",
                        (task_id,)
                    )
                    
                    # Aktivitätslog erstellen
                    self._log_activity(
                        user_id=task_data.get('updated_by'),
                        action_type='task_completed',
                        entity_type='task',
                        entity_id=task_id,
                        details={'task_title': task_data['title']}
                    )
                elif task_data['status'] == 'in progress' and old_status == 'pending':
                    # Wenn Task gestartet, Startdatum setzen
                    cur.execute(
                        "UPDATE tasks SET start_date = CURRENT_TIMESTAMP WHERE id = %s",
                        (task_id,)
                    )
            
            # Zuweisung änderungen verarbeiten
            new_assigned_to = task_data.get('assigned_to')
            if new_assigned_to and new_assigned_to != old_assigned_to:
                self._create_assignment_notification(
                    task_id, task_data['title'], new_assigned_to, task_data.get('updated_by')
                )
            
            # Abhängigkeiten aktualisieren, wenn vorhanden
            if 'dependencies' in task_data:
                # Alle alten Abhängigkeiten löschen
                cur.execute("DELETE FROM task_dependencies WHERE task_id = %s", (task_id,))
                
                # Neue Abhängigkeiten hinzufügen
                for dep_task_id in task_data['dependencies']:
                    query = """
                    INSERT INTO task_dependencies (task_id, depends_on_task_id)
                    VALUES (%s, %s)
                    """
                    cur.execute(query, (task_id, dep_task_id))
            
            self.conn.commit()
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Aktualisieren des Tasks {task_id}: {str(e)}")
            return False
    
    def _log_activity(self, user_id: Optional[int], action_type: str, 
                     entity_type: str, entity_id: int, details: Dict[str, Any]) -> None:
        """Erstellt einen Aktivitätslog-Eintrag.
        
        Args:
            user_id: Die ID des Benutzers, der die Aktion ausgeführt hat (optional)
            action_type: Der Typ der Aktion
            entity_type: Der Typ der Entität
            entity_id: Die ID der Entität
            details: Weitere Details zur Aktion
        """
        try:
            cur = self.conn.cursor()
            
            query = """
            INSERT INTO activity_logs (
                user_id, action_type, entity_type, entity_id, details
            ) VALUES (%s, %s, %s, %s, %s)
            """
            cur.execute(query, (
                user_id,
                action_type,
                entity_type,
                entity_id,
                details
            ))
            
            self.conn.commit()
            cur.close()
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Erstellen des Aktivitätslogs: {str(e)}")
    
    def add_task_comment(self, task_id: int, comment_data: Dict[str, Any]) -> int:
        """Fügt einen Kommentar zu einem Task hinzu.
        
        Args:
            task_id: Die ID des Tasks
            comment_data: Die Daten für den Kommentar
            
        Returns:
            Die ID des erstellten Kommentars
        """
        try:
            cur = self.conn.cursor()
            
            query = """
            INSERT INTO task_comments (task_id, comment, created_by)
            VALUES (%s, %s, %s)
            RETURNING id
            """
            cur.execute(query, (
                task_id,
                comment_data['comment'],
                comment_data.get('created_by')
            ))
            
            comment_id = cur.fetchone()[0]
            
            # Task-Informationen für Benachrichtigung holen
            cur.execute("""
                SELECT t.title, t.assigned_to, w.id as workflow_id
                FROM tasks t
                JOIN workflows w ON t.workflow_id = w.id
                WHERE t.id = %s
            """, (task_id,))
            task_info = cur.fetchone()
            task_title, assigned_to, workflow_id = task_info
            
            # Benachrichtigung für den zugewiesenen Benutzer erstellen, 
            # wenn der Kommentar nicht von diesem Benutzer erstellt wurde
            if assigned_to and assigned_to != comment_data.get('created_by'):
                commenter_name = "Jemand"
                if comment_data.get('created_by'):
                    cur.execute(
                        "SELECT vorname || ' ' || nachname FROM mitarbeiter WHERE id = %s", 
                        (comment_data.get('created_by'),)
                    )
                    commenter_name = cur.fetchone()[0]
                
                query = """
                INSERT INTO notifications (
                    user_id, title, message, type, related_entity_type, related_entity_id
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """
                cur.execute(query, (
                    assigned_to,
                    "Neuer Kommentar zu deiner Aufgabe",
                    f"{commenter_name} hat einen Kommentar zu '{task_title}' hinzugefügt",
                    "comment",
                    "task",
                    task_id
                ))
            
            self.conn.commit()
            cur.close()
            return comment_id
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Hinzufügen des Kommentars zu Task {task_id}: {str(e)}")
            raise
    
    def add_task_attachment(self, task_id: int, attachment_data: Dict[str, Any]) -> int:
        """Fügt einen Anhang zu einem Task hinzu.
        
        Args:
            task_id: Die ID des Tasks
            attachment_data: Die Daten für den Anhang
            
        Returns:
            Die ID des erstellten Anhangs
        """
        try:
            cur = self.conn.cursor()
            
            query = """
            INSERT INTO task_attachments (
                task_id, file_name, file_path, file_type, file_size, uploaded_by
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """
            cur.execute(query, (
                task_id,
                attachment_data['file_name'],
                attachment_data['file_path'],
                attachment_data.get('file_type'),
                attachment_data.get('file_size'),
                attachment_data.get('uploaded_by')
            ))
            
            attachment_id = cur.fetchone()[0]
            
            self.conn.commit()
            cur.close()
            return attachment_id
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Hinzufügen des Anhangs zu Task {task_id}: {str(e)}")
            raise
    
    def get_user_tasks(self, user_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Holt alle Tasks eines Benutzers.
        
        Args:
            user_id: Die ID des Benutzers
            status: Optional, um nach Status zu filtern
            
        Returns:
            Eine Liste von Task-Dictionaries
        """
        try:
            cur = self.conn.cursor(dictionary=True)
            
            query = """
            SELECT 
                t.*,
                w.name as workflow_name,
                s.name as stage_name
            FROM tasks t
            JOIN workflows w ON t.workflow_id = w.id
            LEFT JOIN workflow_stages s ON t.stage_id = s.id
            WHERE t.assigned_to = %s
            """
            
            params = [user_id]
            
            if status:
                query += " AND t.status = %s"
                params.append(status)
            
            query += " ORDER BY t.due_date ASC"
            
            cur.execute(query, params)
            tasks = cur.fetchall()
            
            cur.close()
            return tasks
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Tasks für Benutzer {user_id}: {str(e)}")
            raise
    
    def get_user_notifications(self, user_id: int, is_read: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Holt alle Benachrichtigungen eines Benutzers.
        
        Args:
            user_id: Die ID des Benutzers
            is_read: Optional, um nach gelesenem Status zu filtern
            
        Returns:
            Eine Liste von Benachrichtigungs-Dictionaries
        """
        try:
            cur = self.conn.cursor(dictionary=True)
            
            query = """
            SELECT *
            FROM notifications
            WHERE user_id = %s
            """
            
            params = [user_id]
            
            if is_read is not None:
                query += " AND is_read = %s"
                params.append(is_read)
            
            query += " ORDER BY created_at DESC"
            
            cur.execute(query, params)
            notifications = cur.fetchall()
            
            cur.close()
            return notifications
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Benachrichtigungen für Benutzer {user_id}: {str(e)}")
            raise
    
    def mark_notification_as_read(self, notification_id: int) -> bool:
        """Markiert eine Benachrichtigung als gelesen.
        
        Args:
            notification_id: Die ID der Benachrichtigung
            
        Returns:
            True, wenn erfolgreich, sonst False
        """
        try:
            cur = self.conn.cursor()
            
            query = """
            UPDATE notifications
            SET is_read = true
            WHERE id = %s
            """
            cur.execute(query, (notification_id,))
            
            self.conn.commit()
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Fehler beim Markieren der Benachrichtigung {notification_id} als gelesen: {str(e)}")
            return False 