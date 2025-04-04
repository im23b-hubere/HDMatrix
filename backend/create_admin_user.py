import psycopg2
import os
import bcrypt
from dotenv import load_dotenv
import sys

# Laden der Umgebungsvariablen
load_dotenv()

# Konfiguration
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'hrmatrixdb'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'Steinadler17'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

print(f"Datenbankeinstellungen: {DB_CONFIG['dbname']} auf {DB_CONFIG['host']}:{DB_CONFIG['port']}")

def get_password_hash(password):
    """Erzeugt einen bcrypt-Hash für das Passwort"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_admin_user():
    """Erstellt einen Admin-Benutzer in der Datenbank"""
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
        
        # Prüfen, ob der Admin-Benutzer bereits existiert
        cursor.execute("SELECT id FROM users WHERE email = %s", ('admin@example.com',))
        user = cursor.fetchone()
        
        if user:
            print("Admin-Benutzer existiert bereits.")
            return
        
        # Prüfen, ob eine Admin-Rolle existiert
        cursor.execute("SELECT id FROM roles WHERE name = 'Admin'")
        admin_role = cursor.fetchone()
        
        if not admin_role:
            print("Erstelle Admin-Rolle...")
            cursor.execute("""
                INSERT INTO roles (name, description, is_system_role)
                VALUES ('Admin', 'Administrator mit allen Rechten', TRUE)
                RETURNING id
            """)
            admin_role_id = cursor.fetchone()[0]
        else:
            admin_role_id = admin_role[0]
        
        # Prüfen, ob ein Standard-Tenant existiert
        cursor.execute("SELECT id FROM tenants WHERE subdomain = 'default'")
        tenant = cursor.fetchone()
        
        if not tenant:
            print("Erstelle Standard-Tenant...")
            cursor.execute("""
                INSERT INTO tenants (name, subdomain, is_active)
                VALUES ('Standard', 'default', TRUE)
                RETURNING id
            """)
            tenant_id = cursor.fetchone()[0]
        else:
            tenant_id = tenant[0]
        
        # Admin-Benutzer erstellen
        print("Erstelle Admin-Benutzer...")
        password_hash = get_password_hash('admin123')
        
        cursor.execute("""
            INSERT INTO users (
                email, 
                password_hash, 
                first_name, 
                last_name, 
                role_id, 
                tenant_id, 
                is_active, 
                is_email_verified
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'admin@example.com',
            password_hash,
            'Admin',
            'User',
            admin_role_id,
            tenant_id,
            True,
            True
        ))
        
        user_id = cursor.fetchone()[0]
        connection.commit()
        
        print(f"Admin-Benutzer erfolgreich erstellt (ID: {user_id}).")
        print("Anmeldedaten: admin@example.com / admin123")
        
    except Exception as e:
        print(f"Fehler beim Erstellen des Admin-Benutzers: {str(e)}")
        print(f"Fehlerdetails: {sys.exc_info()}")
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    create_admin_user() 