import psycopg2
import os
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

def create_auth_tables():
    """Erstellt alle Authentifizierungstabellen"""
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
        
        print("Erstelle Authentifizierungstabellen...")
        
        # Mandanten (Tenants)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tenants (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subdomain VARCHAR(50) UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                max_users INTEGER DEFAULT 0,
                logo_url TEXT,
                primary_color VARCHAR(20),
                secondary_color VARCHAR(20)
            );
        """)
        
        # Benutzerrollen
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                description TEXT,
                is_system_role BOOLEAN DEFAULT FALSE
            );
        """)
        
        # Berechtigungen
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                description TEXT,
                module VARCHAR(50) NOT NULL
            );
        """)
        
        # Rollen-Berechtigungen
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS role_permissions (
                id SERIAL PRIMARY KEY,
                role_id INTEGER NOT NULL,
                permission_id INTEGER NOT NULL,
                FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
                UNIQUE (role_id, permission_id)
            );
        """)
        
        # Benutzer
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                role_id INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_email_verified BOOLEAN DEFAULT FALSE,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                profile_image TEXT,
                phone VARCHAR(50),
                language VARCHAR(10) DEFAULT 'de',
                timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
                failed_login_attempts INTEGER DEFAULT 0,
                account_locked_until TIMESTAMP,
                reset_password_token TEXT,
                reset_password_expires TIMESTAMP,
                email_verification_token TEXT,
                email_verification_expires TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles (id)
            );
        """)
        
        # Login-Versuche
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_attempts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                email VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                success BOOLEAN DEFAULT FALSE,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reason TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
            );
        """)
        
        # Token-Blacklist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_blacklist (
                id SERIAL PRIMARY KEY,
                token TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                revoked_by_user_id INTEGER,
                revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reason VARCHAR(50) DEFAULT 'logout',
                FOREIGN KEY (revoked_by_user_id) REFERENCES users (id) ON DELETE SET NULL
            );
        """)
        
        # Benutzereinstellungen
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                theme VARCHAR(20) DEFAULT 'light',
                language VARCHAR(10) DEFAULT 'de',
                notifications_enabled BOOLEAN DEFAULT TRUE,
                email_notifications_enabled BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        """)
        
        # Sitzungen
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(36) PRIMARY KEY,
                user_id INTEGER NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        """)

        # Audit-Logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                tenant_id INTEGER,
                action VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER,
                changes JSONB,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
                FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE SET NULL
            );
        """)

        # Standard-Rollen
        cursor.execute("""
            INSERT INTO roles (name, description, is_system_role)
            VALUES 
                ('Admin', 'Systemadministrator mit vollen Rechten', TRUE),
                ('Manager', 'Projektmanager mit erweiterten Rechten', TRUE),
                ('HR', 'HR-Mitarbeiter mit Zugriff auf Personalverwaltung', TRUE),
                ('Employee', 'Normaler Mitarbeiter', TRUE),
                ('Guest', 'Gast mit eingeschränkten Rechten', TRUE)
            ON CONFLICT DO NOTHING;
        """)

        # Standard-Mandant
        cursor.execute("""
            INSERT INTO tenants (name, subdomain, max_users, primary_color)
            VALUES ('Standard', 'default', 100, '#3f51b5')
            ON CONFLICT (subdomain) DO NOTHING;
        """)
        
        connection.commit()
        print("Authentifizierungstabellen erfolgreich erstellt.")
        
    except Exception as e:
        print(f"Fehler beim Erstellen der Tabellen: {str(e)}")
        print(f"Fehlerdetails: {sys.exc_info()}")
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    create_auth_tables() 