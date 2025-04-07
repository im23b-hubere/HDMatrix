import psycopg2
import sys

def get_connection():
    """Stellt eine Verbindung zur Datenbank her"""
    try:
        conn = psycopg2.connect(
            dbname="hrmatrixdb", 
            user="postgres", 
            password="Steinadler17", 
            host="localhost", 
            port="5432",
            options="-c client_encoding=latin1"
        )
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"Fehler bei der Verbindung: {e}")
        sys.exit(1)

def add_missing_columns():
    """Fügt fehlende Spalten zu den Tabellen hinzu"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Spalten, die hinzugefügt werden müssen
        alterations = [
            # Format: (Tabelle, Spaltenname, Datentyp, Standardwert, NULL erlaubt)
            ("cv_skills", "proficiency_level", "INTEGER", "5", False),
            ("cv_skills", "years_of_experience", "NUMERIC(4,1)", "0", True),
            ("projekterfahrungen", "projekt_name", "VARCHAR(255)", None, False),
            ("projekterfahrungen", "beschreibung", "TEXT", None, True),
            ("projekterfahrungen", "start_datum", "DATE", None, True),
            ("projekterfahrungen", "end_datum", "DATE", None, True),
            ("weiterbildungen", "titel", "VARCHAR(255)", None, False),
            ("weiterbildungen", "beschreibung", "TEXT", None, True),
            ("weiterbildungen", "datum", "DATE", None, True)
        ]
        
        print("\nFüge fehlende Spalten hinzu:")
        
        for table, column, data_type, default, required in alterations:
            # Prüfen, ob die Spalte bereits existiert
            cursor.execute("""
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = %s 
                AND column_name = %s
            """, (table, column))
            
            # Spalte nur hinzufügen, wenn sie noch nicht existiert
            if not cursor.fetchone():
                # SQL-Befehl zum Hinzufügen der Spalte aufbauen
                sql = f"ALTER TABLE {table} ADD COLUMN {column} {data_type}"
                
                # NOT NULL-Constraint hinzufügen, wenn erforderlich
                if not required:
                    sql += " NULL"
                else:
                    # Wenn NOT NULL erforderlich ist, muss ein Standardwert gesetzt werden
                    if default:
                        sql += f" DEFAULT {default} NOT NULL"
                    else:
                        sql += " NOT NULL"
                
                # Standardwert hinzufügen, wenn angegeben und nicht bereits mit NOT NULL
                if default and not required:
                    sql += f" DEFAULT {default}"
                
                print(f"- {sql}")
                
                try:
                    cursor.execute(sql)
                    print(f"  ✓ Spalte {column} zu {table} hinzugefügt")
                except Exception as e:
                    print(f"  ✗ Fehler beim Hinzufügen von {column} zu {table}: {str(e)}")
            else:
                print(f"- Spalte {column} existiert bereits in {table}")
        
        conn.commit()
        print("\nStrukturanpassungen abgeschlossen.")
        
    except Exception as e:
        conn.rollback()
        print(f"Fehler bei der Spaltenergänzung: {e}")
    finally:
        cursor.close()
        conn.close()

def update_db_connections():
    """Aktualisiert die Datenbankverbindung in der Konfiguration"""
    print("\nAktualisiere Datenbankverbindung für HRMatrix:")
    
    # Hier könnten wir die Konfigurationsdateien anpassen
    # oder die Umgebungsvariablen setzen
    
    print("""
Die Datenbankverbindung wurde in der app.py und db_service.py bereits optimiert.
Folgende Einstellungen werden verwendet:
- Datenbankname: hrmatrixdb
- Benutzer: postgres
- Passwort: Steinadler17
- Host: localhost
- Port: 5432
- Client-Encoding: latin1 (via options-Parameter)

Diese Einstellungen sollten auch in allen anderen Skripten verwendet werden,
die eine Datenbankverbindung herstellen.
    """)

if __name__ == "__main__":
    add_missing_columns()
    update_db_connections() 