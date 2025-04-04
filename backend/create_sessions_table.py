import psycopg2
import os
from dotenv import load_dotenv

# Laden der Umgebungsvariablen
load_dotenv()

# Konfiguration
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'hrmatrixdb'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres123'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

def create_sessions_table():
    """Erstellt die sessions-Tabelle, falls sie noch nicht existiert"""
    connection = None
    try:
        print(f"Verbinde mit Datenbank {DB_CONFIG['dbname']} auf {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
        connection = psycopg2.connect(
            dbname=DB_CONFIG['dbname'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port']
        )
        
        cursor = connection.cursor()
        
        # Prüfen, ob die sessions-Tabelle bereits existiert
        cursor.execute("""
            SELECT EXISTS (
               SELECT FROM pg_tables
               WHERE schemaname = 'public'
               AND tablename = 'sessions'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            print("Die sessions-Tabelle existiert bereits.")
        else:
            print("Erstelle sessions-Tabelle...")
            
            # Erstellen der sessions-Tabelle
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    ip_address VARCHAR(45) NOT NULL,
                    user_agent TEXT,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                );
            """)
            
            connection.commit()
            print("Sessions-Tabelle erfolgreich erstellt.")
        
        cursor.close()
    except Exception as e:
        print(f"Fehler beim Erstellen der sessions-Tabelle: {str(e)}")
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    create_sessions_table() 