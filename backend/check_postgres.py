import os
import sys
import subprocess
import platform

def check_postgres_installation():
    """Überprüft, ob PostgreSQL installiert ist und sammelt Informationen dazu"""
    print(f"Betriebssystem: {platform.system()} {platform.release()}")
    print(f"Python-Version: {sys.version}")
    
    # Bekannte PostgreSQL-Installationspfade unter Windows
    possible_paths = [
        r"C:\Program Files\PostgreSQL",
        r"C:\Program Files (x86)\PostgreSQL"
    ]
    
    # Überprüfen der bekannten Pfade
    postgres_found = False
    for base_path in possible_paths:
        if os.path.exists(base_path):
            print(f"PostgreSQL-Installationsverzeichnis gefunden: {base_path}")
            versions = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]
            if versions:
                print(f"Gefundene PostgreSQL-Versionen: {', '.join(versions)}")
                postgres_found = True
                
                # Prüfen, ob psql.exe existiert
                for version in versions:
                    psql_path = os.path.join(base_path, version, "bin", "psql.exe")
                    if os.path.exists(psql_path):
                        print(f"psql.exe gefunden unter: {psql_path}")
                        return psql_path
    
    if not postgres_found:
        print("Keine PostgreSQL-Installation in den Standard-Verzeichnissen gefunden.")
    
    # Überprüfen der Umgebungsvariablen
    path_env = os.environ.get('PATH', '')
    path_dirs = path_env.split(os.pathsep)
    
    print("\nSuche in PATH nach PostgreSQL:")
    for path_dir in path_dirs:
        if 'postgresql' in path_dir.lower() or 'postgres' in path_dir.lower():
            print(f"Möglicher PostgreSQL-Pfad in PATH gefunden: {path_dir}")
            
            psql_path = os.path.join(path_dir, "psql.exe")
            if os.path.exists(psql_path):
                print(f"psql.exe gefunden unter: {psql_path}")
                return psql_path
    
    print("Keine PostgreSQL-Binaries im PATH gefunden.")
    return None

def test_postgres_connection(psql_path=None):
    """Testet die Verbindung zu PostgreSQL mit psql, falls vorhanden"""
    if psql_path and os.path.exists(psql_path):
        try:
            print(f"\nTeste PostgreSQL-Verbindung mit {psql_path}...")
            # Führe psql mit der Version-Option aus
            result = subprocess.run([psql_path, "--version"], 
                                   capture_output=True, 
                                   text=True, 
                                   check=False)
            
            if result.returncode == 0:
                print(f"PostgreSQL-Version: {result.stdout.strip()}")
                
                # Versuche, eine Liste der Datenbanken zu erhalten
                result = subprocess.run([psql_path, "-U", "postgres", "-c", "\\l"], 
                                       capture_output=True, 
                                       text=True, 
                                       check=False)
                
                if result.returncode == 0:
                    print("Datenbankverbindung erfolgreich!")
                    print("Verfügbare Datenbanken:")
                    print(result.stdout)
                else:
                    print("Konnte keine Verbindung zur PostgreSQL-Datenbank herstellen.")
                    print(f"Fehler: {result.stderr}")
            else:
                print(f"Fehler beim Ausführen von psql: {result.stderr}")
        except Exception as e:
            print(f"Fehler beim Testen der PostgreSQL-Verbindung: {str(e)}")
    else:
        print("\nKeine psql.exe gefunden. Überprüfe deine PostgreSQL-Installation.")
        print("Stelle sicher, dass PostgreSQL installiert ist und die Binaries im PATH sind.")

if __name__ == "__main__":
    print("=== PostgreSQL-Überprüfung ===")
    
    psql_path = check_postgres_installation()
    test_postgres_connection(psql_path)
    
    print("\nHinweise zur Problemlösung:")
    print("1. Stelle sicher, dass PostgreSQL installiert ist")
    print("2. Füge das Verzeichnis mit psql.exe zu deinem PATH hinzu")
    print("3. Prüfe, ob der PostgreSQL-Dienst läuft (Dienste-App in Windows)")
    print("4. Überprüfe die Anmeldedaten (Benutzername und Passwort)")
    print("5. Stelle sicher, dass der Port 5432a nicht blockiert ist") 