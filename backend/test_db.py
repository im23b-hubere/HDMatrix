import mysql.connector
from mysql.connector import Error
import psycopg2
import sys
import locale

# Diagnose-Informationen ausgeben
print(f"System-Kodierung: {locale.getpreferredencoding()}")
print(f"Python-Standardkodierung: {sys.getdefaultencoding()}")

# Datenbankverbindung konfigurieren
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'hello1234',
    'database': 'talentbridgedb',
    'port': 3306
}

# Verbindungsparameter
db_params = {
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'Steinadler17',  # Korrigiertes Passwort
    'host': 'localhost',
    'port': '5432',
    'client_encoding': 'UTF8'
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

# Versuche die Verbindung herzustellen
try:
    print("Versuche Verbindung herzustellen...")
    conn = psycopg2.connect(**db_params)
    
    print("Verbindung erfolgreich hergestellt.")
    
    # Teste eine einfache Abfrage
    cur = conn.cursor()
    cur.execute("SELECT 1")
    result = cur.fetchone()
    print(f"Abfrageergebnis: {result}")
    
    cur.close()
    conn.close()
    print("Verbindung geschlossen.")
    
except Exception as e:
    print(f"Fehlertyp: {type(e).__name__}")
    print(f"Fehler: {e}")
    
    # Wenn es sich um ein UnicodeDecodeError handelt
    if isinstance(e, UnicodeDecodeError):
        if hasattr(e, 'object') and isinstance(e.object, bytes):
            try:
                # Versuche mit Windows-Kodierung zu decodieren
                error_msg = e.object.decode('cp1252', errors='replace')
                print(f"Fehlermeldung (cp1252): {error_msg}")
            except Exception as decode_err:
                print(f"Fehler bei Dekodierung: {decode_err}") 