import mysql.connector
from mysql.connector import Error

# Datenbankverbindung konfigurieren
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'hello1234',
    'database': 'talentbridgedb',
    'port': 3306
}

def test_python_search():
    try:
        print("Verbinde mit Datenbank...")
        connection = mysql.connector.connect(**DB_CONFIG)
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            # Direkte Suche nach Python-Skills
            sql = """
            SELECT DISTINCT m.mitarbeiter_id, m.vorname, m.nachname, 
                   m.email, m.faehigkeiten, m.position,
                   a.name as abteilung
            FROM mitarbeiter m
            LEFT JOIN abteilungen a ON m.abteilungs_id = a.abteilungs_id
            WHERE LOWER(m.faehigkeiten) LIKE LOWER('%Python%')
            """
            
            print("Führe SQL-Abfrage aus:", sql)
            cursor.execute(sql)
            employees = cursor.fetchall()
            
            print(f"\nGefundene Mitarbeiter mit Python-Skills: {len(employees)}")
            for emp in employees:
                print("\nMitarbeiter gefunden:")
                print(f"Name: {emp['vorname']} {emp['nachname']}")
                print(f"Email: {emp['email']}")
                print(f"Fähigkeiten: {emp['faehigkeiten']}")
                print(f"Position: {emp['position']}")
                print(f"Abteilung: {emp['abteilung']}")
            
            # Zeige alle Mitarbeiter mit ihren Fähigkeiten
            print("\nAlle Mitarbeiter und ihre Fähigkeiten:")
            cursor.execute("SELECT vorname, nachname, faehigkeiten FROM mitarbeiter")
            all_employees = cursor.fetchall()
            for emp in all_employees:
                print(f"{emp['vorname']} {emp['nachname']}: {emp['faehigkeiten']}")
            
    except Error as e:
        print(f"Datenbankfehler: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("\nDatenbankverbindung geschlossen.")

if __name__ == "__main__":
    test_python_search() 