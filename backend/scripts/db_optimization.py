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

def add_missing_indices():
    """Fügt fehlende Indizes für bessere Performance hinzu"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Tabellen mit Fremdschlüsseln identifizieren
        cursor.execute("""
            SELECT tc.table_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        """)
        
        fk_columns = cursor.fetchall()
        
        # Prüfen, ob für Fremdschlüssel Indizes existieren
        missing_indices = []
        for table, column in fk_columns:
            cursor.execute("""
                SELECT 1
                FROM pg_indexes
                WHERE tablename = %s AND indexdef LIKE %s
            """, (table, f'%{column}%'))
            
            if not cursor.fetchone():
                missing_indices.append((table, column))
        
        # Indizes für fehlende Fremdschlüssel erstellen
        if missing_indices:
            print("\nErstelle fehlende Indizes für Fremdschlüssel:")
            for table, column in missing_indices:
                index_name = f"idx_{table}_{column}"
                sql = f"CREATE INDEX {index_name} ON {table}({column})"
                print(f"- {sql}")
                cursor.execute(sql)
        else:
            print("\nAlle Fremdschlüssel sind bereits indiziert.")
        
        # Spezielle Indizes für häufig abgefragte Spalten
        special_indices = [
            # Indizes für Namenssuchen
            ("employees", "first_name, last_name", "name_search"),
            # Indizes für Benutzerauthentifizierung
            ("users", "email", "user_email"),
            ("users", "role_id, is_active", "active_role"),
            # Tenant Indizes
            ("tenants", "name", "tenant_search")
        ]
        
        print("\nErstelle spezielle Indizes für Leistungsoptimierung:")
        for table, columns, suffix in special_indices:
            index_name = f"idx_{table}_{suffix}"
            # Prüfen, ob Index bereits existiert
            cursor.execute("""
                SELECT 1 FROM pg_indexes 
                WHERE tablename = %s AND indexname = %s
            """, (table, index_name))
            
            if not cursor.fetchone():
                try:
                    sql = f"CREATE INDEX {index_name} ON {table}({columns})"
                    print(f"- {sql}")
                    cursor.execute(sql)
                except Exception as e:
                    print(f"  Fehler: {str(e)}")
        
        conn.commit()
        print("\nIndex-Optimierung abgeschlossen.")
        
    except Exception as e:
        conn.rollback()
        print(f"Fehler bei der Index-Erstellung: {e}")
    finally:
        cursor.close()
        conn.close()

def optimize_constraints():
    """Prüft und fügt fehlende Constraints hinzu"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Zu prüfende Constraints
        constraints = [
            # Fremdschlüssel für Mitarbeiter
            "ALTER TABLE mitarbeiter ADD CONSTRAINT fk_mitarbeiter_abteilung FOREIGN KEY (abteilung_id) REFERENCES abteilungen(id) ON DELETE SET NULL",
            # Fremdschlüssel für Projekte
            "ALTER TABLE projekterfahrungen ADD CONSTRAINT fk_projekterfahrungen_mitarbeiter FOREIGN KEY (mitarbeiter_id) REFERENCES mitarbeiter(id) ON DELETE CASCADE",
            # Fremdschlüssel für Weiterbildungen
            "ALTER TABLE weiterbildungen ADD CONSTRAINT fk_weiterbildungen_mitarbeiter FOREIGN KEY (mitarbeiter_id) REFERENCES mitarbeiter(id) ON DELETE CASCADE",
            # Fremdschlüssel für Bewertungen
            "ALTER TABLE bewertungen ADD CONSTRAINT fk_bewertungen_mitarbeiter FOREIGN KEY (mitarbeiter_id) REFERENCES mitarbeiter(id) ON DELETE CASCADE",
            # Unique Constraints
            "ALTER TABLE users ADD CONSTRAINT unique_user_email UNIQUE (email)",
            "ALTER TABLE mitarbeiter ADD CONSTRAINT unique_mitarbeiter_email UNIQUE (email)"
        ]
        
        print("\nOptimiere Datenbank-Constraints:")
        for constraint in constraints:
            try:
                cursor.execute(constraint)
                print(f"- {constraint}")
            except Exception as e:
                print(f"  Fehler bei '{constraint}': {str(e)}")
        
        conn.commit()
        print("\nConstraint-Optimierung abgeschlossen.")
        
    except Exception as e:
        conn.rollback()
        print(f"Fehler bei der Constraint-Optimierung: {e}")
    finally:
        cursor.close()
        conn.close()

def check_table_structure():
    """Prüft wichtige Tabellen auf Vollständigkeit"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Zu prüfende Tabellen und erwartete Spalten
        expected_columns = {
            "employees": ["id", "tenant_id", "first_name", "last_name", "email"],
            "cvs": ["id", "employee_id", "file_path", "file_name", "title", "created_at"],
            "skills": ["id", "name", "category_id", "description"],
            "skill_categories": ["id", "name", "description"],
            "cv_skills": ["id", "cv_id", "skill_id", "proficiency_level", "years_of_experience"],
            "users": ["id", "email", "password_hash", "role_id", "tenant_id"],
            "projekterfahrungen": ["id", "mitarbeiter_id", "projekt_name", "beschreibung", "start_datum", "end_datum"],
            "weiterbildungen": ["id", "mitarbeiter_id", "titel", "beschreibung", "datum"]
        }
        
        print("\nPrüfe Tabellenstrukturen:")
        for table, expected in expected_columns.items():
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
            """, (table,))
            
            actual_columns = [row[0] for row in cursor.fetchall()]
            
            if not actual_columns:
                print(f"- Tabelle '{table}' existiert nicht!")
                continue
                
            missing = set(expected) - set(actual_columns)
            
            if missing:
                print(f"- Tabelle '{table}' fehlen Spalten: {', '.join(missing)}")
            else:
                print(f"- Tabelle '{table}' hat alle erwarteten Spalten.")
        
    except Exception as e:
        print(f"Fehler bei der Strukturprüfung: {e}")
    finally:
        cursor.close()
        conn.close()

def optimize_encoding():
    """Versucht, die Datenbankkodierung anzupassen"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Aktuelle Kodierung prüfen
        cursor.execute("SHOW client_encoding")
        current_encoding = cursor.fetchone()[0]
        print(f"\nAktuelle Client-Kodierung: {current_encoding}")
        
        cursor.execute("SHOW server_encoding")
        server_encoding = cursor.fetchone()[0]
        print(f"Aktuelle Server-Kodierung: {server_encoding}")
        
        # Warnung ausgeben
        print("\nDie Kodierung kann nicht direkt auf einer existierenden Datenbank geändert werden.")
        print("Folgende Optionen sind möglich:")
        print("1. Dump erstellen, neue DB mit UTF8-Kodierung erstellen, Daten reimportieren")
        print("2. Datenbank-Template ändern für zukünftige DBs")
        print("3. Weiterhin client_encoding=latin1 verwenden")
        
        # Empfehlung für die Codierung
        print("\nEmpfehlung:")
        print("Da die Datenbankverbindung jetzt stabil mit latin1 als Client-Encoding funktioniert,")
        print("empfehlen wir, diese Einstellung beizubehalten und in der Anwendung alle Texte vor")
        print("dem Speichern entsprechend zu kodieren.")
        
    except Exception as e:
        print(f"Fehler bei der Kodierungsprüfung: {e}")
    finally:
        cursor.close()
        conn.close()

def main():
    """Hauptfunktion zur Ausführung aller Optimierungen"""
    print("=== HRMatrix Datenbank-Optimierung ===")
    
    while True:
        print("\nOptimierungsoptionen:")
        print("1. Indizes optimieren")
        print("2. Constraints optimieren")
        print("3. Tabellenstrukturen prüfen")
        print("4. Kodierungseinstellungen prüfen")
        print("5. Alle Optimierungen ausführen")
        print("q. Beenden")
        
        option = input("\nOption wählen: ")
        
        if option == '1':
            add_missing_indices()
        elif option == '2':
            optimize_constraints()
        elif option == '3':
            check_table_structure()
        elif option == '4':
            optimize_encoding()
        elif option == '5':
            check_table_structure()
            add_missing_indices()
            optimize_constraints()
            optimize_encoding()
        elif option.lower() == 'q':
            break
        else:
            print("Ungültige Option!")

if __name__ == "__main__":
    main() 