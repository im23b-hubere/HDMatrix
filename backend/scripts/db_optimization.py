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
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"Connection error: {e}")
        sys.exit(1)

def add_missing_indices():
    """Add missing indices for better performance"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Identify tables with foreign keys
        cursor.execute("""
            SELECT tc.table_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        """)
        
        fk_columns = cursor.fetchall()
        
        # Check if indices exist for foreign keys
        missing_indices = []
        for table, column in fk_columns:
            cursor.execute("""
                SELECT 1
                FROM pg_indexes
                WHERE tablename = %s AND indexdef LIKE %s
            """, (table, f'%{column}%'))
            
            if not cursor.fetchone():
                missing_indices.append((table, column))
        
        # Create indices for missing foreign keys
        if missing_indices:
            print("\nCreating missing indices for foreign keys:")
            for table, column in missing_indices:
                index_name = f"idx_{table}_{column}"
                sql = f"CREATE INDEX {index_name} ON {table}({column})"
                print(f"- {sql}")
                cursor.execute(sql)
        else:
            print("\nAll foreign keys are already indexed.")
        
        # Special indices for frequently queried columns
        special_indices = [
            # Indices for name searches
            ("employees", "first_name, last_name", "name_search"),
            # Indices for user authentication
            ("users", "email", "user_email"),
            ("users", "role_id, is_active", "active_role"),
            # Tenant indices
            ("tenants", "name", "tenant_search")
        ]
        
        print("\nCreating special indices for performance optimization:")
        for table, columns, suffix in special_indices:
            index_name = f"idx_{table}_{suffix}"
            # Check if index already exists
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
                    print(f"  Error: {str(e)}")
        
        conn.commit()
        print("\nIndex optimization completed.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating indices: {e}")
    finally:
        cursor.close()
        conn.close()

def optimize_constraints():
    """Check and add missing constraints"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Constraints to check
        constraints = [
            # Foreign keys for employees
            "ALTER TABLE employees ADD CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL",
            # Foreign keys for projects
            "ALTER TABLE project_experiences ADD CONSTRAINT fk_project_experiences_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE",
            # Foreign keys for training
            "ALTER TABLE trainings ADD CONSTRAINT fk_trainings_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE",
            # Foreign keys for evaluations
            "ALTER TABLE evaluations ADD CONSTRAINT fk_evaluations_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE",
            # Unique constraints
            "ALTER TABLE users ADD CONSTRAINT unique_user_email UNIQUE (email)",
            "ALTER TABLE employees ADD CONSTRAINT unique_employee_email UNIQUE (email)"
        ]
        
        print("\nOptimizing database constraints:")
        for constraint in constraints:
            try:
                cursor.execute(constraint)
                print(f"- {constraint}")
            except Exception as e:
                print(f"  Error with '{constraint}': {str(e)}")
        
        conn.commit()
        print("\nConstraint optimization completed.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error optimizing constraints: {e}")
    finally:
        cursor.close()
        conn.close()

def check_table_structure():
    """Check important tables for completeness"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Tables and expected columns to check
        expected_columns = {
            "employees": ["id", "tenant_id", "first_name", "last_name", "email"],
            "cvs": ["id", "employee_id", "file_path", "file_name", "title", "created_at"],
            "skills": ["id", "name", "category_id", "description"],
            "skill_categories": ["id", "name", "description"],
            "cv_skills": ["id", "cv_id", "skill_id", "proficiency_level", "years_of_experience"],
            "users": ["id", "email", "password_hash", "role_id", "tenant_id"],
            "project_experiences": ["id", "employee_id", "project_name", "description", "start_date", "end_date"],
            "trainings": ["id", "employee_id", "title", "description", "date"]
        }
        
        print("\nChecking table structures:")
        for table, expected in expected_columns.items():
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
            """, (table,))
            
            actual_columns = [row[0] for row in cursor.fetchall()]
            
            if not actual_columns:
                print(f"- Table '{table}' does not exist!")
                continue
                
            missing = set(expected) - set(actual_columns)
            
            if missing:
                print(f"- Table '{table}' is missing columns: {', '.join(missing)}")
            else:
                print(f"- Table '{table}' has all expected columns.")
        
    except Exception as e:
        print(f"Error checking structure: {e}")
    finally:
        cursor.close()
        conn.close()

def optimize_encoding():
    """Try to adjust database encoding"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Check current encoding
        cursor.execute("SHOW client_encoding")
        current_encoding = cursor.fetchone()[0]
        print(f"\nCurrent client encoding: {current_encoding}")
        
        cursor.execute("SHOW server_encoding")
        server_encoding = cursor.fetchone()[0]
        print(f"Current server encoding: {server_encoding}")
        
        # Output warning
        print("\nEncoding cannot be changed directly on an existing database.")
        print("To change the encoding:")
        print("1. Create a new database with the desired encoding")
        print("2. Export data from the current database")
        print("3. Import data into the new database")
        
    except Exception as e:
        print(f"Error checking encoding: {e}")
    finally:
        cursor.close()
        conn.close()

def main():
    print("=== HRMatrix Database Optimization ===")
    
    # Add missing indices
    add_missing_indices()
    
    # Optimize constraints
    optimize_constraints()
    
    # Check table structure
    check_table_structure()
    
    # Check encoding
    optimize_encoding()
    
    print("\n=== Database optimization completed ===")

if __name__ == '__main__':
    main() 