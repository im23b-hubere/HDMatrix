from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

# Datenbankverbindung konfigurieren
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'hello1234',
    'database': 'talentbridgedb',
    'port': 3306
}

def get_db_connection():
    try:
        print("Versuche Verbindung zur Datenbank herzustellen...")
        connection = mysql.connector.connect(**DB_CONFIG)
        
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"Erfolgreich verbunden mit MySQL Server version {db_info}")
            return connection
        else:
            print("Verbindung konnte nicht hergestellt werden")
            return None
    except Error as e:
        print(f"Fehler bei der Datenbankverbindung: {e}")
        return None

@app.route('/api/employees/search', methods=['GET'])
def search_employees():
    connection = None
    cursor = None
    try:
        query = request.args.get('query', '')
        department = request.args.get('department')
        skills = request.args.get('skills', '').split(',') if request.args.get('skills') else []

        print(f"Received search query: {query}")  # Debug output
        print(f"Department: {department}")  # Debug output
        print(f"Skills: {skills}")  # Debug output

        connection = get_db_connection()
        if not connection:
            print("Keine Datenbankverbindung möglich")
            return jsonify({'error': 'Datenbankverbindung fehlgeschlagen'}), 500

        cursor = connection.cursor(dictionary=True)
        
        # Basis-Query mit LOWER() für case-insensitive Suche
        sql = """
        SELECT DISTINCT m.mitarbeiter_id as id, m.vorname, m.nachname, 
               m.email, m.faehigkeiten, m.abteilungs_id,
               a.name as abteilung
        FROM mitarbeiter m
        LEFT JOIN abteilungen a ON m.abteilungs_id = a.abteilungs_id
        WHERE 1=1
        """
        params = []

        # Suchbegriff
        if query:
            sql += """ AND (
                LOWER(m.vorname) LIKE LOWER(%s) 
                OR LOWER(m.nachname) LIKE LOWER(%s) 
                OR LOWER(m.faehigkeiten) LIKE LOWER(%s)
            )"""
            search_term = f"%{query}%"
            params.extend([search_term] * 3)

        # Abteilungsfilter
        if department:
            sql += " AND m.abteilungs_id = %s"
            params.append(int(department))

        # Skills-Filter
        if skills and skills[0]:  # Prüfe ob skills nicht leer ist
            skill_conditions = []
            for skill in skills:
                skill_conditions.append("LOWER(m.faehigkeiten) LIKE LOWER(%s)")
                params.append(f"%{skill}%")
            sql += " AND (" + " OR ".join(skill_conditions) + ")"

        print(f"Executing SQL: {sql}")  # Debug output
        print(f"With params: {params}")  # Debug output
        
        cursor.execute(sql, params)
        employees = cursor.fetchall()

        print(f"Found {len(employees)} employees")  # Debug output
        for emp in employees:  # Debug output
            print(f"Employee: {emp}")  # Debug output

        # Fähigkeiten für jeden Mitarbeiter aufbereiten
        result_employees = []
        for employee in employees:
            try:
                emp_dict = dict(employee)  # Erstelle eine Kopie des Mitarbeiters
                
                if emp_dict.get('faehigkeiten'):
                    emp_dict['skills'] = [skill.strip() for skill in emp_dict['faehigkeiten'].split(',')]
                else:
                    emp_dict['skills'] = []
                del emp_dict['faehigkeiten']  # Original-Feld entfernen
                
                # Setze Standardwerte
                emp_dict['position'] = 'Software Entwickler'  # Position immer als Standard setzen
                if emp_dict.get('abteilung') is None:
                    emp_dict['abteilung'] = 'IT & Entwicklung'
                
                result_employees.append(emp_dict)
            except Exception as e:
                print(f"Fehler bei der Verarbeitung des Mitarbeiters {employee.get('id', 'unknown')}: {str(e)}")
                continue

        result = {'employees': result_employees}
        print(f"Returning result: {result}")  # Debug output
        return jsonify(result)

    except Exception as e:
        print(f"Unerwarteter Fehler: {str(e)}")  # Debug output
        return jsonify({'error': f'Unerwarteter Fehler: {str(e)}'}), 500
    finally:
        try:
            if cursor:
                cursor.close()
            if connection and connection.is_connected():
                connection.close()
                print("Datenbankverbindung geschlossen")
        except Exception as e:
            print(f"Fehler beim Schließen der Verbindung: {str(e)}")

@app.route('/api/departments', methods=['GET'])
def get_departments():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Datenbankverbindung fehlgeschlagen'}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        # Wir verwenden Aliase, um die Spaltennamen für das Frontend anzupassen
        cursor.execute("SELECT abteilungs_id as id, name FROM abteilungen")
        departments = cursor.fetchall()
        return jsonify(departments)
    except Error as e:
        error_msg = str(e)
        print(f"Detaillierter Datenbankfehler: {error_msg}")
        return jsonify({'error': f'Datenbankfehler: {error_msg}'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/skills', methods=['GET'])
def get_skills():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Datenbankverbindung fehlgeschlagen'}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        
        # Alle eindeutigen Fähigkeiten aus der mitarbeiter-Tabelle extrahieren
        cursor.execute("""
            SELECT DISTINCT faehigkeiten 
            FROM mitarbeiter 
            WHERE faehigkeiten IS NOT NULL AND faehigkeiten != ''
        """)
        
        # Alle Fähigkeiten sammeln und aufteilen
        all_skills = set()
        for row in cursor.fetchall():
            # Annahme: Fähigkeiten sind durch Kommas getrennt
            if row['faehigkeiten']:
                skills = [skill.strip() for skill in row['faehigkeiten'].split(',')]
                all_skills.update(skills)
        
        # Sortierte Liste zurückgeben
        skills_list = sorted(list(all_skills))
        print(f"Gefundene Fähigkeiten: {skills_list}")
        return jsonify(skills_list)
        
    except Error as e:
        error_msg = str(e)
        print(f"Detaillierter Datenbankfehler: {error_msg}")
        return jsonify({'error': f'Datenbankfehler: {error_msg}'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    app.run(port=5000, debug=True) 