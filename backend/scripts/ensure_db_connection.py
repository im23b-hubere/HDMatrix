import os
import re
import psycopg2
import json
from pathlib import Path

# Konfiguration für die Datenbankverbindung
DB_CONFIG = {
    'dbname': 'hrmatrixdb',
    'user': 'postgres',
    'password': 'Steinadler17',
    'host': 'localhost',
    'port': '5432',
    'options': '-c client_encoding=latin1'
}

def test_connection():
    """Testet die Datenbankverbindung"""
    print("\nTeste Datenbankverbindung...")
    
    try:
        conn = psycopg2.connect(
            dbname=DB_CONFIG['dbname'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            options=DB_CONFIG['options']
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        db_version = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        print(f"✓ Verbindung erfolgreich hergestellt!")
        print(f"  Datenbank-Version: {db_version[0]}")
        return True
    
    except Exception as e:
        print(f"✗ Verbindungsfehler: {str(e)}")
        return False

def get_python_files():
    """Findet alle Python-Dateien im Backend-Verzeichnis"""
    backend_dir = Path('.')
    python_files = list(backend_dir.glob('**/*.py'))
    
    # Exclude virtualenv and test files
    excluded_dirs = ['venv', 'env', '__pycache__', 'tests']
    filtered_files = [f for f in python_files if not any(excl in str(f) for excl in excluded_dirs)]
    
    return filtered_files

def check_config_in_file(file_path):
    """Überprüft, ob die Datei Datenbankverbindungsparameter enthält"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
            # Suche nach typischen Datenbankverbindungsparametern
            db_patterns = [
                r'psycopg2\.connect\s*\(',
                r'dbname\s*=',
                r'host\s*=',
                r'password\s*=',
                r'DB_CONFIG\s*='
            ]
            
            for pattern in db_patterns:
                if re.search(pattern, content):
                    return True
                    
        return False
    except Exception as e:
        print(f"Fehler beim Lesen von {file_path}: {str(e)}")
        return False

def scan_for_db_configs():
    """Scannt nach Dateien mit Datenbankverbindungsparametern"""
    python_files = get_python_files()
    
    print("\nSuche nach Dateien mit Datenbankverbindungsparametern...")
    db_config_files = []
    
    for file_path in python_files:
        if check_config_in_file(file_path):
            db_config_files.append(file_path)
            print(f"- {file_path}")
    
    return db_config_files

def check_environment_variables():
    """Überprüft und aktualisiert Umgebungsvariablen für die Datenbankverbindung"""
    print("\nPrüfe Umgebungsvariablen...")
    
    env_file = Path('.env')
    env_vars = {
        'DB_NAME': DB_CONFIG['dbname'],
        'DB_USER': DB_CONFIG['user'],
        'DB_PASSWORD': DB_CONFIG['password'],
        'DB_HOST': DB_CONFIG['host'],
        'DB_PORT': DB_CONFIG['port'],
        'DB_OPTIONS': DB_CONFIG['options']
    }
    
    if env_file.exists():
        try:
            # Lese vorhandene .env-Datei
            with open(env_file, 'r') as f:
                content = f.read()
            
            # Aktualisiere Werte
            for key, value in env_vars.items():
                pattern = rf'^{key}=.*$'
                replacement = f'{key}={value}'
                
                if re.search(pattern, content, re.MULTILINE):
                    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
                else:
                    content += f'\n{key}={value}'
            
            # Schreibe aktualisierte .env-Datei
            with open(env_file, 'w') as f:
                f.write(content)
                
            print(f"✓ Umgebungsvariablen in .env-Datei aktualisiert")
            
        except Exception as e:
            print(f"✗ Fehler beim Aktualisieren der .env-Datei: {str(e)}")
    else:
        # Erstelle neue .env-Datei
        try:
            with open(env_file, 'w') as f:
                for key, value in env_vars.items():
                    f.write(f'{key}={value}\n')
            
            print(f"✓ Neue .env-Datei mit Datenbankverbindungsparametern erstellt")
            
        except Exception as e:
            print(f"✗ Fehler beim Erstellen der .env-Datei: {str(e)}")

def update_config_file():
    """Aktualisiert oder erstellt die Konfigurationsdatei"""
    print("\nAktualisiere Konfigurationsdatei...")
    
    config_dir = Path('config')
    config_file = config_dir / 'database.json'
    
    if not config_dir.exists():
        config_dir.mkdir(exist_ok=True)
    
    try:
        config_data = {
            'database': {
                'development': DB_CONFIG,
                'production': {
                    **DB_CONFIG,
                    'host': '${DB_HOST}',  # Platzhalter für Umgebungsvariablen
                    'password': '${DB_PASSWORD}'
                }
            }
        }
        
        with open(config_file, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        print(f"✓ Konfigurationsdatei aktualisiert: {config_file}")
        
    except Exception as e:
        print(f"✗ Fehler beim Aktualisieren der Konfigurationsdatei: {str(e)}")

def main():
    print("=== HRMatrix Datenbankverbindung optimieren ===")
    
    # Prüfe Verbindung
    if not test_connection():
        print("\nWarnung: Datenbankverbindung konnte nicht hergestellt werden.")
        proceed = input("Möchten Sie trotzdem fortfahren? (j/n): ")
        if proceed.lower() != 'j':
            return
    
    # Suche nach Dateien mit Datenbankverbindungsparametern
    db_config_files = scan_for_db_configs()
    
    # Aktualisiere Umgebungsvariablen
    check_environment_variables()
    
    # Aktualisiere Konfigurationsdatei
    update_config_file()
    
    print("\n=== Datenbankverbindung eingerichtet ===")
    print(f"""
Die Datenbankverbindung wurde aktualisiert. Folgende Einstellungen werden verwendet:
- Datenbankname: {DB_CONFIG['dbname']}
- Benutzer: {DB_CONFIG['user']}
- Passwort: {'*' * len(DB_CONFIG['password'])}
- Host: {DB_CONFIG['host']}
- Port: {DB_CONFIG['port']}
- Client-Encoding: latin1 (über options-Parameter)

Stellen Sie sicher, dass diese Einstellungen mit Ihrer Datenbankinstallation übereinstimmen.
Falls nötig, passen Sie die .env-Datei oder config/database.json an.
    """)

if __name__ == "__main__":
    main() 