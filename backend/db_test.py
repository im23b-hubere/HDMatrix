import sys
import os

# Füge das Backend-Verzeichnis zum Systempfad hinzu
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.db_service import get_db_connection, create_tables

def test_db_connection():
    print("Teste Datenbankverbindung...")
    conn = get_db_connection()
    if conn:
        print("Datenbankverbindung erfolgreich!")
        conn.close()
        return True
    else:
        print("Fehler: Konnte keine Verbindung zur Datenbank herstellen!")
        return False

def setup_database():
    print("Erstelle Datenbanktabellen...")
    result = create_tables()
    if result["success"]:
        print("Tabellen erfolgreich erstellt!")
        print(f"Anzahl der Tabellen: {result.get('tables')}")
        print(f"Tenant-ID: {result.get('tenant_id')}")
    else:
        print(f"Fehler beim Erstellen der Tabellen: {result.get('error')}")

if __name__ == "__main__":
    connection_ok = test_db_connection()
    if connection_ok:
        setup_database() 