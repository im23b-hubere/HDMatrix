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
        return conn
    except Exception as e:
        print(f"Fehler bei der Verbindung: {e}")
        sys.exit(1)

def list_tables():
    """Listet alle Tabellen in der Datenbank auf"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' 
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        
        print("\nVorhandene Tabellen:")
        for table in tables:
            print(f"- {table[0]}")
        
        print(f"\nGesamtzahl der Tabellen: {len(tables)}")
        
    except Exception as e:
        print(f"Fehler bei der Abfrage: {e}")
    finally:
        cursor.close()
        conn.close()

def describe_table(table_name):
    """Zeigt die Struktur einer Tabelle an"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Spalten abfragen
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cursor.fetchall()
        
        if not columns:
            print(f"Tabelle '{table_name}' existiert nicht.")
            return
        
        print(f"\nStruktur der Tabelle '{table_name}':")
        print("---------------------------------------")
        for col in columns:
            nullable = "NULL" if col[2] == "YES" else "NOT NULL"
            default = f" DEFAULT {col[3]}" if col[3] else ""
            print(f"{col[0]}: {col[1]} {nullable}{default}")
        
        # Indices abfragen
        cursor.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = %s
        """, (table_name,))
        
        indices = cursor.fetchall()
        
        if indices:
            print("\nIndizes:")
            for idx in indices:
                print(f"- {idx[0]}: {idx[1]}")
        
        # Constraints abfragen
        cursor.execute("""
            SELECT con.conname, con.contype, pg_get_constraintdef(con.oid)
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = %s
        """, (table_name,))
        
        constraints = cursor.fetchall()
        
        if constraints:
            print("\nConstraints:")
            for con in constraints:
                con_type = ""
                if con[1] == 'p': con_type = "PRIMARY KEY"
                elif con[1] == 'f': con_type = "FOREIGN KEY"
                elif con[1] == 'u': con_type = "UNIQUE"
                elif con[1] == 'c': con_type = "CHECK"
                
                print(f"- {con[0]} ({con_type}): {con[2]}")
        
        # Anzahl der Zeilen
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"\nAnzahl Datensätze: {count}")
        
    except Exception as e:
        print(f"Fehler bei der Abfrage: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    # Tabellen auflisten
    list_tables()
    
    # Nach Tabellenname fragen
    print("\nGeben Sie einen Tabellennamen ein, um Details anzuzeigen (oder 'q' zum Beenden):")
    while True:
        table_name = input("> ")
        if table_name.lower() == 'q':
            break
        describe_table(table_name) 