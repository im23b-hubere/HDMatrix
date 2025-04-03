import os
import uuid
import json
from datetime import datetime
from werkzeug.utils import secure_filename

class CVService:
    def __init__(self, db):
        self.db = db

    def get_all_cvs(self, tenant_id=None):
        """Gibt alle Lebensläufe zurück, optional gefiltert nach Mandanten-ID"""
        query = """
            SELECT 
                c.id, 
                c.employee_id, 
                e.full_name, 
                e.position, 
                e.email, 
                e.phone, 
                e.location, 
                e.photo_url, 
                c.summary, 
                c.last_updated
            FROM cvs c
            JOIN employees e ON c.employee_id = e.id
            WHERE c.is_active = true
        """
        
        params = []
        if tenant_id:
            query += " AND e.tenant_id = %s"
            params.append(tenant_id)
            
        query += " ORDER BY e.full_name"
        
        result = self.db.execute(query, params).fetchall()
        
        cvs = []
        for row in result:
            cv = {
                "id": row[0],
                "employeeId": row[1],
                "fullName": row[2],
                "position": row[3],
                "email": row[4],
                "phone": row[5],
                "location": row[6],
                "photoUrl": row[7],
                "summary": row[8],
                "lastUpdated": row[9].isoformat() if row[9] else None,
                "skills": self.get_cv_skills(row[0]),
                "experience": [],
                "education": [],
                "certifications": [],
                "projects": []
            }
            
            # Für die Übersichtsseite sind nicht alle Details erforderlich
            # Wir zählen nur die Anzahl der Einträge für eine schnellere Abfrage
            cv["experienceCount"] = self.count_experience(row[0])
            cv["educationCount"] = self.count_education(row[0])
            cv["projectCount"] = self.count_projects(row[0])
            
            cvs.append(cv)
            
        return cvs
    
    def get_cv_by_id(self, cv_id, tenant_id=None):
        """Gibt einen Lebenslauf anhand seiner ID zurück, optional mit Mandanten-Filterung"""
        query = """
            SELECT 
                c.id, 
                c.employee_id, 
                e.full_name, 
                e.position, 
                e.email, 
                e.phone, 
                e.location, 
                e.photo_url, 
                c.summary, 
                c.last_updated
            FROM cvs c
            JOIN employees e ON c.employee_id = e.id
            WHERE c.id = %s AND c.is_active = true
        """
        
        params = [cv_id]
        if tenant_id:
            query += " AND e.tenant_id = %s"
            params.append(tenant_id)
            
        result = self.db.execute(query, params).fetchone()
        
        if not result:
            return None
            
        cv = {
            "id": result[0],
            "employeeId": result[1],
            "fullName": result[2],
            "position": result[3],
            "email": result[4],
            "phone": result[5],
            "location": result[6],
            "photoUrl": result[7],
            "summary": result[8],
            "lastUpdated": result[9].isoformat() if result[9] else None,
            "skills": self.get_cv_skills(result[0]),
            "experience": self.get_cv_experience(result[0]),
            "education": self.get_cv_education(result[0]),
            "certifications": self.get_cv_certifications(result[0]),
            "projects": self.get_cv_projects(result[0])
        }
        
        return cv
    
    def create_cv(self, employee_id, data, tenant_id=None):
        """Erstellt einen neuen Lebenslauf"""
        # Zuerst überprüfen, ob der Mitarbeiter zum Mandanten gehört
        if tenant_id:
            employee = self.db.execute(
                "SELECT id FROM employees WHERE id = %s AND tenant_id = %s",
                (employee_id, tenant_id)
            ).fetchone()
            
            if not employee:
                return None
        
        # Prüfen, ob bereits ein CV für diesen Mitarbeiter existiert
        existing_cv = self.db.execute(
            "SELECT id FROM cvs WHERE employee_id = %s AND is_active = true",
            (employee_id,)
        ).fetchone()
        
        if existing_cv:
            # Wenn bereits ein CV existiert, dieses als inaktiv markieren
            self.db.execute(
                "UPDATE cvs SET is_active = false WHERE id = %s",
                (existing_cv[0],)
            )
        
        # Neuen CV erstellen
        cv_id = self.db.execute(
            """
            INSERT INTO cvs (employee_id, summary, last_updated, is_active, created_by)
            VALUES (%s, %s, NOW(), true, %s)
            RETURNING id
            """,
            (employee_id, data.get('summary', ''), data.get('createdBy', None))
        ).fetchone()[0]
        
        # Skills, Erfahrungen usw. hinzufügen
        if 'skills' in data and isinstance(data['skills'], list):
            for skill in data['skills']:
                self.add_skill_to_cv(cv_id, skill)
                
        if 'experience' in data and isinstance(data['experience'], list):
            for exp in data['experience']:
                self.add_experience_to_cv(cv_id, exp)
                
        if 'education' in data and isinstance(data['education'], list):
            for edu in data['education']:
                self.add_education_to_cv(cv_id, edu)
                
        if 'certifications' in data and isinstance(data['certifications'], list):
            for cert in data['certifications']:
                self.add_certification_to_cv(cv_id, cert)
                
        if 'projects' in data and isinstance(data['projects'], list):
            for project in data['projects']:
                self.add_project_to_cv(cv_id, project)
        
        return self.get_cv_by_id(cv_id, tenant_id)
    
    def update_cv(self, cv_id, data, tenant_id=None):
        """Aktualisiert einen bestehenden Lebenslauf"""
        # Überprüfen, ob der CV existiert und zum Mandanten gehört (falls angegeben)
        cv_exists_query = "SELECT c.id FROM cvs c JOIN employees e ON c.employee_id = e.id WHERE c.id = %s"
        params = [cv_id]
        
        if tenant_id:
            cv_exists_query += " AND e.tenant_id = %s"
            params.append(tenant_id)
            
        cv_exists = self.db.execute(cv_exists_query, params).fetchone()
        
        if not cv_exists:
            return None
        
        # CV aktualisieren
        self.db.execute(
            """
            UPDATE cvs 
            SET summary = %s, last_updated = NOW(), updated_by = %s
            WHERE id = %s
            """,
            (data.get('summary', ''), data.get('updatedBy'), cv_id)
        )
        
        # Bestehende Verknüpfungen entfernen und neue hinzufügen
        if 'skills' in data:
            self.db.execute("DELETE FROM cv_skills WHERE cv_id = %s", (cv_id,))
            if isinstance(data['skills'], list):
                for skill in data['skills']:
                    self.add_skill_to_cv(cv_id, skill)
                    
        if 'experience' in data:
            self.db.execute("DELETE FROM cv_experience WHERE cv_id = %s", (cv_id,))
            if isinstance(data['experience'], list):
                for exp in data['experience']:
                    self.add_experience_to_cv(cv_id, exp)
                    
        if 'education' in data:
            self.db.execute("DELETE FROM cv_education WHERE cv_id = %s", (cv_id,))
            if isinstance(data['education'], list):
                for edu in data['education']:
                    self.add_education_to_cv(cv_id, edu)
                    
        if 'certifications' in data:
            self.db.execute("DELETE FROM cv_certifications WHERE cv_id = %s", (cv_id,))
            if isinstance(data['certifications'], list):
                for cert in data['certifications']:
                    self.add_certification_to_cv(cv_id, cert)
                    
        if 'projects' in data:
            self.db.execute("DELETE FROM cv_projects WHERE cv_id = %s", (cv_id,))
            if isinstance(data['projects'], list):
                for project in data['projects']:
                    self.add_project_to_cv(cv_id, project)
        
        return self.get_cv_by_id(cv_id, tenant_id)
    
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
        skills = self.db.execute(
            """
            SELECT s.id, s.name, sc.name as category, cs.level
            FROM cv_skills cs
            JOIN skills s ON cs.skill_id = s.id
            JOIN skill_categories sc ON s.category_id = sc.id
            WHERE cs.cv_id = %s
            ORDER BY sc.name, s.name
            """,
            (cv_id,)
        ).fetchall()
        
        return [
            {
                "id": str(skill[0]),
                "name": skill[1],
                "category": skill[2],
                "level": skill[3]
            }
            for skill in skills
        ]
    
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