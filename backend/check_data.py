import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'hello1234',
    'database': 'talentbridgedb',
    'port': 3306
}

def check_database():
    try:
        print("Verbinde mit Datenbank...")
        connection = mysql.connector.connect(**DB_CONFIG)
        
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            
            # Überprüfe Tabellen
            print("\nVerfügbare Tabellen:")
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            for table in tables:
                print(table)
            
            # Überprüfe Mitarbeiter
            print("\nAnzahl Mitarbeiter:")
            cursor.execute("SELECT COUNT(*) as count FROM mitarbeiter")
            count = cursor.fetchone()
            print(f"Mitarbeiter gesamt: {count['count']}")
            
            # Zeige alle Mitarbeiter
            print("\nAlle Mitarbeiter und ihre Fähigkeiten:")
            cursor.execute("""
                SELECT m.vorname, m.nachname, m.faehigkeiten, a.name as abteilung
                FROM mitarbeiter m
                LEFT JOIN abteilungen a ON m.abteilungs_id = a.abteilungs_id
            """)
            employees = cursor.fetchall()
            for emp in employees:
                print(f"\nName: {emp['vorname']} {emp['nachname']}")
                print(f"Abteilung: {emp['abteilung']}")
                print(f"Fähigkeiten: {emp['faehigkeiten']}")
            
            # Überprüfe Abteilungen
            print("\nAlle Abteilungen:")
            cursor.execute("SELECT * FROM abteilungen")
            departments = cursor.fetchall()
            for dept in departments:
                print(dept)
            
    except Error as e:
        print(f"Datenbankfehler: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("\nDatenbankverbindung geschlossen.")

if __name__ == "__main__":
    check_database() 