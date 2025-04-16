import psycopg2
import sys

def get_connection():
    """Establish a connection to the database"""
    try:
        conn = psycopg2.connect(
            dbname="hrmatrixdb", 
            user="postgres", 
            password="Steinadler17", 
            host="localhost", 
            port="5432",
            options="-c client_encoding=UTF8"
        )
        return conn
    except Exception as e:
        print(f"Connection error: {e}")
        sys.exit(1)

def list_tables():
    """List all tables in the database"""
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
        
        print("\nExisting tables:")
        for table in tables:
            print(f"- {table[0]}")
        
        print(f"\nTotal number of tables: {len(tables)}")
        
    except Exception as e:
        print(f"Query error: {e}")
    finally:
        cursor.close()
        conn.close()

def describe_table(table_name):
    """Show the structure of a table"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Query columns
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cursor.fetchall()
        
        if not columns:
            print(f"Table '{table_name}' does not exist.")
            return
        
        print(f"\nStructure of table '{table_name}':")
        print("---------------------------------------")
        for col in columns:
            nullable = "NULL" if col[2] == "YES" else "NOT NULL"
            default = f" DEFAULT {col[3]}" if col[3] else ""
            print(f"{col[0]}: {col[1]} {nullable}{default}")
        
        # Query indices
        cursor.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = %s
        """, (table_name,))
        
        indices = cursor.fetchall()
        
        if indices:
            print("\nIndices:")
            for idx in indices:
                print(f"- {idx[0]}: {idx[1]}")
        
        # Query constraints
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
        
        # Number of rows
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"\nNumber of records: {count}")
        
    except Exception as e:
        print(f"Query error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    # List tables
    list_tables()
    
    # Ask for table name
    print("\nEnter a table name to show details (or 'q' to quit):")
    while True:
        table_name = input("> ")
        if table_name.lower() == 'q':
            break
        describe_table(table_name) 