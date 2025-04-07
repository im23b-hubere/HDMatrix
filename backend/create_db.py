import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import logging
import locale

# Logging-Konfiguration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# System-Kodierung anzeigen
system_encoding = locale.getpreferredencoding()
logger.info(f"System-Kodierung: {system_encoding}")

# Datenbank-Konfiguration
DB_CONFIG = {
    'dbname': 'hrmatrixdb',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5432'
}

def create_database():
    """Erstellt die Datenbank, falls sie noch nicht existiert."""
    try:
        # Verbindung zu PostgreSQL ohne spezifische Datenbank
        conn_params = {
            'user': DB_CONFIG['user'],
            'password': DB_CONFIG['password'],
            'host': DB_CONFIG['host'],
            'port': DB_CONFIG['port']
        }
        
        # Verbindungsdetails anzeigen (ohne Passwort)
        safe_params = conn_params.copy()
        safe_params['password'] = '***'
        logger.info(f"Verbindungsparameter: {safe_params}")
        
        # Versuchen wir es mit direkter DSN-Zeichenfolge, um Kodierungsprobleme zu vermeiden
        dsn = f"host={DB_CONFIG['host']} port={DB_CONFIG['port']} user={DB_CONFIG['user']} password={DB_CONFIG['password']}"
        logger.info(f"Versuche Verbindung mit DSN-String (ohne Datenbank)")
        
        # Verbindung herstellen
        conn = psycopg2.connect(dsn)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        logger.info("Verbindung erfolgreich hergestellt!")
        
        # Prüfen, ob die Datenbank bereits existiert
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_CONFIG['dbname'],))
        exists = cursor.fetchone()
        
        if not exists:
            logger.info(f"Datenbank '{DB_CONFIG['dbname']}' existiert nicht. Erstelle...")
            # Datenbank erstellen
            cursor.execute(f"CREATE DATABASE {DB_CONFIG['dbname']}")
            logger.info(f"Datenbank '{DB_CONFIG['dbname']}' erfolgreich erstellt!")
        else:
            logger.info(f"Datenbank '{DB_CONFIG['dbname']}' existiert bereits.")
        
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        logger.error(f"Fehler beim Erstellen der Datenbank: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starte Datenbank-Setup...")
    success = create_database()
    
    if success:
        print("Datenbank-Setup erfolgreich abgeschlossen.")
        sys.exit(0)
    else:
        print("Datenbank-Setup fehlgeschlagen.")
        sys.exit(1) 