import os
import sys
import subprocess

def main():
    """
    Startet die Flask-Anwendung aus dem 'backend'-Verzeichnis.
    Diese Datei dient als Einstiegspunkt für die Anwendung vom Hauptverzeichnis aus.
    """
    print("Starte HRMatrix Backend-Server...")
    
    # Pfad zum Backend-Verzeichnis
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    backend_app = os.path.join(backend_dir, "app.py")
    
    if not os.path.exists(backend_app):
        print(f"FEHLER: Die Datei {backend_app} wurde nicht gefunden.")
        print("Bitte stellen Sie sicher, dass das Backend-Verzeichnis korrekt eingerichtet ist.")
        sys.exit(1)
    
    # Aktiviere die virtuelle Umgebung, falls vorhanden
    venv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "venv")
    venv_new_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "venv_new")
    
    # Setze das Arbeitsverzeichnis auf das Backend-Verzeichnis
    os.chdir(backend_dir)
    
    # Starte die Backend-Anwendung
    try:
        # Führe die Backend-App aus
        print(f"Backend-Pfad: {backend_app}")
        print("Starte Backend-Server...")
        
        # Verwende Python-Interpreter, um die App zu starten
        subprocess.run([sys.executable, backend_app], check=True)
    except subprocess.CalledProcessError as e:
        print(f"FEHLER: Der Server konnte nicht gestartet werden: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("Server wurde durch Benutzer beendet.")

if __name__ == "__main__":
    main() 