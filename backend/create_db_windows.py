import psycopg2
import sys
import os

# Konfiguration
DB_CONFIG = {
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5432',
    'dbname': 'hrmatrixdb'
}

def create_database():
    """Erstellt die PostgreSQL-Datenbank, falls sie nicht existiert."""
    print("Versuche, PostgreSQL-Verbindung herzustellen...")
    
    # Verbindung ohne Datenbankangabe (zum postgres-Standardsystem)
    conn_params = {
        'user': DB_CONFIG['user'],
        'password': DB_CONFIG['password'],
        'host': DB_CONFIG['host'],
        'port': DB_CONFIG['port']
    }
    
    try:
        # Verbindung zum Server herstellen
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True  # Wichtig, um Datenbank erstellen zu können
        cursor = conn.cursor()
        
        print("Verbindung zum PostgreSQL-Server erfolgreich!")
        
        # Prüfen, ob die Datenbank bereits existiert
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_CONFIG['dbname'],))
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Datenbank '{DB_CONFIG['dbname']}' existiert nicht. Erstelle...")
            # Datenbank erstellen
            cursor.execute(f"CREATE DATABASE {DB_CONFIG['dbname']}")
            print(f"Datenbank '{DB_CONFIG['dbname']}' erfolgreich erstellt!")
        else:
            print(f"Datenbank '{DB_CONFIG['dbname']}' existiert bereits.")
        
        cursor.close()
        conn.close()
        
        # Jetzt testen, ob wir uns mit der neuen Datenbank verbinden können
        test_connection()
        
        return True
    except Exception as e:
        print(f"Fehler beim Erstellen der Datenbank: {str(e)}")
        return False

def test_connection():
    """Testet die Verbindung zur Datenbank."""
    try:
        conn = psycopg2.connect(
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            dbname=DB_CONFIG['dbname']
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        db_version = cursor.fetchone()
        
        print(f"Erfolgreich mit Datenbank '{DB_CONFIG['dbname']}' verbunden.")
        print(f"PostgreSQL-Version: {db_version[0]}")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Fehler beim Verbinden mit der Datenbank '{DB_CONFIG['dbname']}': {str(e)}")
        return False

if __name__ == "__main__":
    print("=== PostgreSQL-Datenbankeinrichtung ===")
    success = create_database()
    
    if success:
        print("\nDatenbank-Setup erfolgreich abgeschlossen.")
        sys.exit(0)
    else:
        print("\nDatenbank-Setup fehlgeschlagen.")
        sys.exit(1) 