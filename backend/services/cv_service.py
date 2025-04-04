import os
import uuid
import json
from datetime import datetime
from werkzeug.utils import secure_filename
import logging
from typing import Dict, List, Any, Optional, Union

logger = logging.getLogger(__name__)

class CVService:
    def __init__(self, db):
        self.db = db
        self.cursor = self.db.cursor()

    def get_all_cvs(self, tenant_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Hole alle CVs aus der Datenbank
        
        Args:
            tenant_id: Optionale tenant_id für Multi-Tenant-Unterstützung
            
        Returns:
            List: Liste von CV-Datensätzen
        """
        try:
            if tenant_id:
                query = """
                SELECT cv.id, cv.employee_id, cv.created_at, cv.updated_at, 
                       cv.summary, cv.personal_data, cv.education, cv.work_experience, cv.projects, cv.certifications, cv.languages,
                       e.first_name, e.last_name, e.position, e.address, e.email, e.phone
                FROM cvs cv
                JOIN employees e ON cv.employee_id = e.id
                WHERE cv.tenant_id = %s
                ORDER BY cv.updated_at DESC
                """
                self.cursor.execute(query, (tenant_id,))
            else:
                query = """
                SELECT cv.id, cv.employee_id, cv.created_at, cv.updated_at, 
                       cv.summary, cv.personal_data, cv.education, cv.work_experience, cv.projects, cv.certifications, cv.languages,
                       e.first_name, e.last_name, e.position, e.address, e.email, e.phone
                FROM cvs cv
                JOIN employees e ON cv.employee_id = e.id
                ORDER BY cv.updated_at DESC
                """
                self.cursor.execute(query)
            
            cvs = []
            for row in self.cursor.fetchall():
                # Verarbeite die verschiedenen JSON-Felder
                personal_data = row[5] if isinstance(row[5], dict) else json.loads(row[5]) if row[5] else {}
                education_data = row[6] if isinstance(row[6], list) else json.loads(row[6]) if row[6] else []
                work_experience = row[7] if isinstance(row[7], list) else json.loads(row[7]) if row[7] else []
                projects = row[8] if isinstance(row[8], list) else json.loads(row[8]) if row[8] else []
                certifications = row[9] if isinstance(row[9], list) else json.loads(row[9]) if row[9] else []
                languages = row[10] if isinstance(row[10], list) else json.loads(row[10]) if row[10] else []
                
                full_name = f"{row[11]} {row[12]}" if row[11] and row[12] else ""
                
                cv = {
                    "id": row[0],
                    "employee_id": row[1],
                    "created_at": row[2].isoformat() if row[2] else None,
                    "updated_at": row[3].isoformat() if row[3] else None,
                    "full_name": full_name,
                    "position": row[13],
                    "location": row[14],  # address
                    "email": row[15],
                    "phone": row[16],
                    "photo_url": "",  # Nicht in der Abfrage enthalten
                    "summary": row[4] or "",
                    "personal_data": personal_data,
                    "education": education_data,
                    "experience": work_experience,
                    "projects": projects,
                    "certifications": certifications,
                    "languages": languages,
                }
                cvs.append(cv)
                
            return cvs
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der CVs: {str(e)}")
            return []
    
    def get_cv_by_id(self, cv_id: str, tenant_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Hole einen CV anhand seiner ID
        
        Args:
            cv_id: ID des CV
            tenant_id: Optionale tenant_id für Multi-Tenant-Unterstützung
            
        Returns:
            Dict: CV-Datensatz oder None wenn nicht gefunden
        """
        try:
            if tenant_id:
                query = """
                SELECT cv.id, cv.employee_id, cv.created_at, cv.updated_at, 
                       cv.summary, cv.personal_data, cv.education, cv.work_experience, cv.projects, cv.certifications, cv.languages,
                       e.first_name, e.last_name, e.position, e.address, e.email, e.phone
                FROM cvs cv
                JOIN employees e ON cv.employee_id = e.id
                WHERE cv.id = %s AND cv.tenant_id = %s
                """
                self.cursor.execute(query, (cv_id, tenant_id))
            else:
                query = """
                SELECT cv.id, cv.employee_id, cv.created_at, cv.updated_at, 
                       cv.summary, cv.personal_data, cv.education, cv.work_experience, cv.projects, cv.certifications, cv.languages,
                       e.first_name, e.last_name, e.position, e.address, e.email, e.phone
                FROM cvs cv
                JOIN employees e ON cv.employee_id = e.id
                WHERE cv.id = %s
                """
                self.cursor.execute(query, (cv_id,))
            
            row = self.cursor.fetchone()
            if not row:
                return None
            
            # Verarbeite die verschiedenen JSON-Felder
            personal_data = row[5] if isinstance(row[5], dict) else json.loads(row[5]) if row[5] else {}
            education_data = row[6] if isinstance(row[6], list) else json.loads(row[6]) if row[6] else []
            work_experience = row[7] if isinstance(row[7], list) else json.loads(row[7]) if row[7] else []
            projects = row[8] if isinstance(row[8], list) else json.loads(row[8]) if row[8] else []
            certifications = row[9] if isinstance(row[9], list) else json.loads(row[9]) if row[9] else []
            languages = row[10] if isinstance(row[10], list) else json.loads(row[10]) if row[10] else []
            
            full_name = f"{row[11]} {row[12]}" if row[11] and row[12] else ""
            
            cv = {
                "id": row[0],
                "employee_id": row[1],
                "created_at": row[2].isoformat() if row[2] else None,
                "updated_at": row[3].isoformat() if row[3] else None,
                "full_name": full_name,
                "position": row[13],
                "location": row[14],  # address
                "email": row[15],
                "phone": row[16],
                "photo_url": "",  # Nicht in der Abfrage enthalten
                "summary": row[4] or "",
                "personal_data": personal_data,
                "education": education_data,
                "experience": work_experience,
                "projects": projects,
                "certifications": certifications,
                "languages": languages,
            }
            return cv
        except Exception as e:
            logger.error(f"Fehler beim Abrufen des CV mit ID {cv_id}: {str(e)}")
            return None
    
    def create_employee(self, employee_data: Dict[str, Any]) -> Optional[str]:
        """
        Erstelle einen neuen Mitarbeiter
        
        Args:
            employee_data: Daten des Mitarbeiters 
            
        Returns:
            str: ID des erstellten Mitarbeiters oder None bei Fehler
        """
        try:
            employee_id = str(uuid.uuid4())
            now = datetime.now()
            
            # Standardwerte für nicht vorhandene Felder
            full_name = employee_data.get("full_name", "")
            
            # Name aufteilen in Vor- und Nachname
            name_parts = full_name.split(" ", 1)
            first_name = name_parts[0] if len(name_parts) > 0 else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            
            email = employee_data.get("email", "")
            phone = employee_data.get("phone", "")
            position = employee_data.get("position", "")
            address = employee_data.get("location", "")
            tenant_id = employee_data.get("tenant_id")
            
            query = """
            INSERT INTO employees 
            (id, first_name, last_name, email, phone, position, address, created_at, updated_at, tenant_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            self.cursor.execute(
                query, 
                (employee_id, first_name, last_name, email, phone, position, address, now, now, tenant_id)
            )
            self.db.commit()
            
            return employee_id
        except Exception as e:
            self.db.rollback()
            logger.error(f"Fehler beim Erstellen des Mitarbeiters: {str(e)}")
            return None
    
    def create_cv(self, employee_id: str, cv_data: Dict[str, Any], tenant_id: Optional[str] = None) -> Optional[str]:
        """
        Erstelle einen neuen CV für einen Mitarbeiter
        
        Args:
            employee_id: ID des Mitarbeiters
            cv_data: CV-Daten
            tenant_id: Optionale tenant_id für Multi-Tenant-Unterstützung
            
        Returns:
            str: ID des erstellten CV oder None bei Fehler
        """
        try:
            cv_id = str(uuid.uuid4())
            now = datetime.now()
            
            # Extrahiere die verschiedenen Daten aus cv_data
            title = cv_data.get("title", f"Lebenslauf {now.strftime('%d.%m.%Y')}")
            summary = cv_data.get("summary", "")
            personal_data = json.dumps(cv_data.get("personal_data", {}))
            education = json.dumps(cv_data.get("education", []))
            work_experience = json.dumps(cv_data.get("experience", []))
            projects = json.dumps(cv_data.get("projects", []))
            certifications = json.dumps(cv_data.get("certifications", []))
            languages = json.dumps(cv_data.get("languages", []))
            hobbies = cv_data.get("hobbies", [])
            
            query = """
            INSERT INTO cvs 
            (id, employee_id, title, summary, personal_data, education, work_experience, projects, 
             certifications, languages, hobbies, is_active, is_public, tenant_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, FALSE, %s, %s, %s)
            """
            
            self.cursor.execute(
                query, 
                (cv_id, employee_id, title, summary, personal_data, education, work_experience, 
                 projects, certifications, languages, hobbies, tenant_id, now, now)
            )
            self.db.commit()
            
            return cv_id
        except Exception as e:
            self.db.rollback()
            logger.error(f"Fehler beim Erstellen des CV: {str(e)}")
            return None
    
    def update_cv(self, cv_id: str, cv_data: Dict[str, Any], tenant_id: Optional[str] = None) -> bool:
        """
        Aktualisiere einen bestehenden CV
        
        Args:
            cv_id: ID des CV
            cv_data: CV-Daten
            tenant_id: Optionale tenant_id für Multi-Tenant-Unterstützung
            
        Returns:
            bool: True bei Erfolg, False bei Fehler
        """
        try:
            now = datetime.now()
            
            # Konvertiere Daten in JSON-Format
            cv_data_json = json.dumps(cv_data)
            
            if tenant_id:
                query = """
                UPDATE cvs 
                SET data = %s, updated_at = %s
                WHERE id = %s AND tenant_id = %s
                """
                self.cursor.execute(query, (cv_data_json, now, cv_id, tenant_id))
            else:
                query = """
                UPDATE cvs 
                SET data = %s, updated_at = %s
                WHERE id = %s
                """
                self.cursor.execute(query, (cv_data_json, now, cv_id))
            
            self.db.commit()
            return self.cursor.rowcount > 0
        except Exception as e:
            self.db.rollback()
            logger.error(f"Fehler beim Aktualisieren des CV mit ID {cv_id}: {str(e)}")
            return False
    
    def delete_cv(self, cv_id, tenant_id=None):
        """Löscht einen Lebenslauf (markiert ihn als inaktiv)"""
        query = "UPDATE cvs c JOIN employees e ON c.employee_id = e.id SET c.is_active = false WHERE c.id = %s"
        params = [cv_id]
        
        if tenant_id:
            query += " AND e.tenant_id = %s"
            params.append(tenant_id)
            
        self.db.execute(query, params)
        return True
    
    # Hilfsmethoden für Skills
    def get_cv_skills(self, cv_id):
        """Gibt alle Skills eines Lebenslaufs zurück"""
        try:
            # Verwende eine parametrisierte Abfrage, um SQL-Injektionen zu vermeiden
            query = """
                SELECT s.id, s.name, sc.id as category_id, sc.name as category_name
                FROM cv_skills cs
                JOIN skills s ON cs.skill_id = s.id
                JOIN skill_categories sc ON s.category_id = sc.id
                WHERE cs.cv_id = %s
                ORDER BY sc.name, s.name
            """
            
            result = self.db.execute(query, (cv_id,)).fetchall()
            
            # Wenn keine Skills gefunden wurden, gib eine leere Liste zurück
            if not result:
                print(f"Keine Skills gefunden für CV {cv_id}")
                return []
            
            # Konvertiere die Ergebnisse in eine Liste von Dictionaries
            skills = []
            for row in result:
                skill = {
                    "id": row[0],
                    "name": row[1],
                    "categoryId": row[2],
                    "category": row[3]
                }
                
                # Füge Skill-Level hinzu, wenn vorhanden
                if len(row) > 4:
                    skill["level"] = row[4]
                else:
                    skill["level"] = 0  # Standardwert, wenn kein Level angegeben ist
                    
                skills.append(skill)
                
            return skills
            
        except Exception as e:
            # Log den Fehler und gib eine leere Liste zurück
            print(f"Fehler beim Abrufen der Skills für CV {cv_id}: {str(e)}")
            return []
    
    def add_skill_to_cv(self, cv_id, skill_data):
        """Fügt einen Skill zum Lebenslauf hinzu"""
        # Kategorie suchen oder erstellen
        category_id = None
        if 'category' in skill_data:
            category = self.db.execute(
                "SELECT id FROM skill_categories WHERE name = %s",
                (skill_data['category'],)
            ).fetchone()
            
            if category:
                category_id = category[0]
            else:
                category_id = self.db.execute(
                    "INSERT INTO skill_categories (name) VALUES (%s) RETURNING id",
                    (skill_data['category'],)
                ).fetchone()[0]
        
        # Skill suchen oder erstellen
        skill_id = None
        if 'id' in skill_data and skill_data['id']:
            # Prüfen, ob der Skill existiert
            skill = self.db.execute(
                "SELECT id FROM skills WHERE id = %s",
                (skill_data['id'],)
            ).fetchone()
            
            if skill:
                skill_id = skill[0]
        
        if not skill_id and 'name' in skill_data:
            # Nach Name suchen
            skill = self.db.execute(
                "SELECT id FROM skills WHERE name = %s AND category_id = %s",
                (skill_data['name'], category_id)
            ).fetchone()
            
            if skill:
                skill_id = skill[0]
            else:
                # Neuen Skill erstellen
                skill_id = self.db.execute(
                    "INSERT INTO skills (name, category_id) VALUES (%s, %s) RETURNING id",
                    (skill_data['name'], category_id)
                ).fetchone()[0]
        
        if skill_id:
            # Verknüpfung erstellen
            self.db.execute(
                "INSERT INTO cv_skills (cv_id, skill_id, level) VALUES (%s, %s, %s)",
                (cv_id, skill_id, skill_data.get('level', 3))
            )
    
    # Hilfsmethoden für Experience
    def count_experience(self, cv_id):
        """Zählt die Anzahl der Berufserfahrungen eines Lebenslaufs"""
        count = self.db.execute(
            "SELECT COUNT(*) FROM cv_experience WHERE cv_id = %s",
            (cv_id,)
        ).fetchone()[0]
        
        return count
    
    def get_cv_experience(self, cv_id):
        """Gibt alle Berufserfahrungen eines Lebenslaufs zurück"""
        experiences = self.db.execute(
            """
            SELECT 
                id, company, position, location, 
                start_date, end_date, description, achievements
            FROM cv_experience
            WHERE cv_id = %s
            ORDER BY start_date DESC
            """,
            (cv_id,)
        ).fetchall()
        
        result = []
        for exp in experiences:
            achievements = []
            if exp[7]:  # achievements can be NULL
                try:
                    achievements = json.loads(exp[7])
                except:
                    pass
                
            result.append({
                "id": str(exp[0]),
                "company": exp[1],
                "position": exp[2],
                "location": exp[3],
                "startDate": exp[4].isoformat() if exp[4] else None,
                "endDate": exp[5].isoformat() if exp[5] else None,
                "description": exp[6],
                "achievements": achievements,
                "current": exp[5] is None
            })
            
        return result
    
    def add_experience_to_cv(self, cv_id, exp_data):
        """Fügt eine Berufserfahrung zum Lebenslauf hinzu"""
        achievements = json.dumps(exp_data.get('achievements', []))
        
        exp_id = self.db.execute(
            """
            INSERT INTO cv_experience (
                cv_id, company, position, location, 
                start_date, end_date, description, achievements
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                cv_id,
                exp_data.get('company', ''),
                exp_data.get('position', ''),
                exp_data.get('location'),
                exp_data.get('startDate'),
                exp_data.get('endDate') if not exp_data.get('current', False) else None,
                exp_data.get('description', ''),
                achievements
            )
        ).fetchone()[0]
        
        return exp_id
    
    # Ähnliche Hilfsmethoden für Education, Certifications und Projects...
    # [Diese würden ähnlich implementiert wie für Skills und Experience]
    
    def count_education(self, cv_id):
        """Zählt die Anzahl der Ausbildungen eines Lebenslaufs"""
        count = self.db.execute(
            "SELECT COUNT(*) FROM cv_education WHERE cv_id = %s",
            (cv_id,)
        ).fetchone()[0]
        
        return count
    
    def get_cv_education(self, cv_id):
        """Gibt alle Ausbildungen eines Lebenslaufs zurück"""
        educations = self.db.execute(
            """
            SELECT 
                id, institution, degree, field, 
                start_year, end_year, details
            FROM cv_education
            WHERE cv_id = %s
            ORDER BY end_year DESC
            """,
            (cv_id,)
        ).fetchall()
        
        result = []
        for edu in educations:
            result.append({
                "start_year": edu[4],
                "end_year": edu[5],
                "degree": edu[2],
                "institution": edu[1],
                "field": edu[3],
                "details": edu[6]
            })
            
        return result
    
    def add_education_to_cv(self, cv_id, edu_data):
        """Fügt eine Ausbildung zum Lebenslauf hinzu"""
        edu_id = self.db.execute(
            """
            INSERT INTO cv_education (
                cv_id, institution, degree, field, 
                start_year, end_year, details
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                cv_id,
                edu_data.get('institution', ''),
                edu_data.get('degree', ''),
                edu_data.get('field'),
                edu_data.get('start_year'),
                edu_data.get('end_year'),
                edu_data.get('details')
            )
        ).fetchone()[0]
        
        return edu_id
    
    def count_projects(self, cv_id):
        """Zählt die Anzahl der Projekte eines Lebenslaufs"""
        count = self.db.execute(
            "SELECT COUNT(*) FROM cv_projects WHERE cv_id = %s",
            (cv_id,)
        ).fetchone()[0]
        
        return count
    
    def get_cv_projects(self, cv_id):
        """Gibt alle Projekte eines Lebenslaufs zurück"""
        projects = self.db.execute(
            """
            SELECT 
                id, name, description, start_date, 
                end_date, technologies, achievements
            FROM cv_projects
            WHERE cv_id = %s
            ORDER BY start_date DESC
            """,
            (cv_id,)
        ).fetchall()
        
        result = []
        for proj in projects:
            technologies = []
            if proj[5]:  # technologies can be NULL
                try:
                    technologies = json.loads(proj[5])
                except:
                    pass
                    
            achievements = []
            if proj[6]:  # achievements can be NULL
                try:
                    achievements = json.loads(proj[6])
                except:
                    pass
                
            result.append({
                "id": str(proj[0]),
                "name": proj[1],
                "description": proj[2],
                "startDate": proj[3].isoformat() if proj[3] else None,
                "endDate": proj[4].isoformat() if proj[4] else None,
                "technologies": technologies,
                "achievements": achievements,
                "current": proj[4] is None
            })
            
        return result
    
    def add_project_to_cv(self, cv_id, project_data):
        """Fügt ein Projekt zum Lebenslauf hinzu"""
        technologies = json.dumps(project_data.get('technologies', []))
        achievements = json.dumps(project_data.get('achievements', []))
        
        project_id = self.db.execute(
            """
            INSERT INTO cv_projects (
                cv_id, name, description, start_date, 
                end_date, technologies, achievements
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                cv_id,
                project_data.get('name', ''),
                project_data.get('description', ''),
                project_data.get('startDate'),
                project_data.get('endDate') if not project_data.get('current', False) else None,
                technologies,
                achievements
            )
        ).fetchone()[0]
        
        return project_id
    
    def get_cv_certifications(self, cv_id):
        """Gibt alle Zertifizierungen eines Lebenslaufs zurück"""
        certs = self.db.execute(
            """
            SELECT 
                id, name, issuer, issue_date, 
                expiry_date, credential_id
            FROM cv_certifications
            WHERE cv_id = %s
            ORDER BY issue_date DESC
            """,
            (cv_id,)
        ).fetchall()
        
        result = []
        for cert in certs:
            result.append({
                "id": str(cert[0]),
                "name": cert[1],
                "issuer": cert[2],
                "issueDate": cert[3].isoformat() if cert[3] else None,
                "expiryDate": cert[4].isoformat() if cert[4] else None,
                "credentialId": cert[5],
                "current": cert[4] is None or cert[4] > datetime.now()
            })
            
        return result
    
    def add_certification_to_cv(self, cv_id, cert_data):
        """Fügt eine Zertifizierung zum Lebenslauf hinzu"""
        cert_id = self.db.execute(
            """
            INSERT INTO cv_certifications (
                cv_id, name, issuer, issue_date, 
                expiry_date, credential_id
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                cv_id,
                cert_data.get('name', ''),
                cert_data.get('issuer', ''),
                cert_data.get('issueDate'),
                cert_data.get('expiryDate'),
                cert_data.get('credentialId')
            )
        ).fetchone()[0]
        
        return cert_id
    
    # Methoden für Foto-Upload
    def upload_photo(self, employee_id, file, tenant_id=None):
        """Lädt ein Foto für einen Mitarbeiter hoch"""
        # Überprüfen, ob der Mitarbeiter zum Mandanten gehört
        if tenant_id:
            employee = self.db.execute(
                "SELECT id FROM employees WHERE id = %s AND tenant_id = %s",
                (employee_id, tenant_id)
            ).fetchone()
            
            if not employee:
                return None
        
        # Dateinamen sichern und eindeutig machen
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        # Speicherpfad erstellen
        upload_folder = os.path.join("uploads", "employee_photos")
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # URL für das Foto erstellen
        photo_url = f"/api/uploads/employee_photos/{unique_filename}"
        
        # URL in der Datenbank speichern
        self.db.execute(
            "UPDATE employees SET photo_url = %s WHERE id = %s",
            (photo_url, employee_id)
        )
        
        return photo_url
    
    # Methoden für Export
    def export_cv_with_template(self, cv_id, template_id, tenant_id=None):
        """Exportiert einen Lebenslauf mit einer Vorlage"""
        # Überprüfen, ob der CV und die Vorlage existieren und zum Mandanten gehören
        cv = self.get_cv_by_id(cv_id, tenant_id)
        if not cv:
            return None
            
        template = self.db.execute(
            "SELECT * FROM cv_templates WHERE id = %s",
            (template_id,)
        ).fetchone()
        
        if not template:
            return None
            
        # TODO: Implementierung des eigentlichen Exports
        # Dies würde HTML-Generierung und PDF-Konvertierung einschließen
        
        return {
            "cv": cv,
            "template": template,
            "exported_at": datetime.now().isoformat()
        } 