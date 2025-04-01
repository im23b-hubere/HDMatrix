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
    'password': 'hello1234',  # Korrektes Passwort
    'database': 'talentbridgedb',
    'port': 3306,  # Standard MySQL-Port
    'raise_on_warnings': True
}

def get_db_connection():
    try:
        print("Versuche Verbindung zur Datenbank herzustellen mit:", {
            'host': DB_CONFIG['host'],
            'user': DB_CONFIG['user'],
            'database': DB_CONFIG['database'],
            'port': DB_CONFIG['port']
        })
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            db_info = connection.get_server_info()
            cursor = connection.cursor()
            cursor.execute("select database();")
            db_name = cursor.fetchone()[0]
            cursor.close()
            print(f"Erfolgreich verbunden mit MySQL Server version {db_info}")
            print(f"Verbunden mit Datenbank: {db_name}")
            return connection
        else:
            print("Verbindung konnte nicht hergestellt werden")
            return None
    except Error as e:
        print(f"Fehler bei der Datenbankverbindung: {e}")
        return None

@app.route('/api/employees/search', methods=['GET'])
def search_employees():
    query = request.args.get('query', '')
    department = request.args.get('department')
    skills = request.args.get('skills', '').split(',') if request.args.get('skills') else []

    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Datenbankverbindung fehlgeschlagen'}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        
        # Basis-Query
        sql = """
        SELECT DISTINCT m.mitarbeiter_id as id, m.vorname, m.nachname, 
               m.email, m.faehigkeiten, m.abteilungs_id
        FROM mitarbeiter m
        WHERE 1=1
        """
        params = []

        # Suchbegriff
        if query:
            sql += """ AND (
                m.vorname LIKE %s 
                OR m.nachname LIKE %s 
                OR m.faehigkeiten LIKE %s
            )"""
            search_term = f"%{query}%"
            params.extend([search_term] * 3)

        # Abteilungsfilter
        if department:
            sql += " AND m.abteilungs_id = %s"
            params.append(int(department))

        # Skills-Filter
        if skills:
            skill_conditions = []
            for skill in skills:
                skill_conditions.append("m.faehigkeiten LIKE %s")
                params.append(f"%{skill}%")
            sql += " AND (" + " OR ".join(skill_conditions) + ")"

        cursor.execute(sql, params)
        employees = cursor.fetchall()

        # Fähigkeiten für jeden Mitarbeiter aufbereiten
        for employee in employees:
            if employee['faehigkeiten']:
                employee['skills'] = [skill.strip() for skill in employee['faehigkeiten'].split(',')]
            else:
                employee['skills'] = []
            del employee['faehigkeiten']  # Original-Feld entfernen

        return jsonify({'employees': employees})

    except Error as e:
        print(f"Datenbankfehler: {e}")
        return jsonify({'error': f'Datenbankfehler: {e}'}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

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