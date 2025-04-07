import psycopg2
from psycopg2.extras import RealDictCursor
import os
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import locale
import sys

# Logging-Konfiguration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Datenbank-Konfiguration
DB_CONFIG = {
    'dbname': 'hrmatrixdb',
    'user': 'postgres',
    'password': 'Steinadler17',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    """Stellt eine Verbindung zur Datenbank her und gibt ein Connection-Objekt zurück."""
    try:
        # Verbindungsparameter mit options für Kodierung
        dsn_params = {
            'dbname': DB_CONFIG['dbname'],
            'user': DB_CONFIG['user'],
            'password': DB_CONFIG['password'],
            'host': DB_CONFIG['host'], 
            'port': DB_CONFIG['port'],
            'options': '-c client_encoding=latin1'  # Kodierung über Options setzen
        }
        
        # Zeige Verbindungsparameter (ohne Passwort)
        safe_dsn = dsn_params.copy()
        safe_dsn['password'] = '***'
        logger.info(f"Verbindungsparameter: {safe_dsn}")
        
        # Verbindung herstellen
        conn = psycopg2.connect(**dsn_params)
        
        logger.info("Datenbankverbindung erfolgreich hergestellt")
        
        # Test-Query zur Überprüfung der Verbindung
        cursor = conn.cursor()
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()
        logger.info(f"Test-Abfrage Ergebnis: {result}")
        cursor.close()
        
        return conn
    except Exception as e:
        logger.error(f"Datenbankverbindungsfehler: {str(e)}")
        return None

def execute_query(query: str, params: tuple = None, fetchone: bool = False) -> Dict[str, Any]:
    """
    Führt eine SQL-Abfrage aus und gibt das Ergebnis zurück.
    
    Args:
        query: Die SQL-Abfrage als String
        params: Die Parameter für die SQL-Abfrage als Tuple
        fetchone: Ob nur ein Ergebnis zurückgegeben werden soll
        
    Returns:
        Ein Dictionary mit dem Ergebnis und dem Erfolg der Abfrage
    """
    conn = get_db_connection()
    if not conn:
        return {"success": False, "error": "Keine Datenbankverbindung"}
    
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        # Wenn es eine SELECT-Abfrage ist, gib die Ergebnisse zurück
        if query.strip().upper().startswith("SELECT"):
            if fetchone:
                result = cursor.fetchone()
                if result is None:
                    return {"success": True, "data": None}
                return {"success": True, "data": dict(result)}
            else:
                results = cursor.fetchall()
                return {"success": True, "data": [dict(row) for row in results]}
        
        # Für INSERT-, UPDATE-, DELETE-Abfragen
        conn.commit()
        
        # Bei INSERT-Abfragen mit RETURNING-Klausel
        if "RETURNING" in query.upper():
            if fetchone:
                result = cursor.fetchone()
                if result is None:
                    return {"success": True, "data": None}
                return {"success": True, "data": dict(result)}
            else:
                results = cursor.fetchall()
                return {"success": True, "data": [dict(row) for row in results]}
        
        return {"success": True, "rows_affected": cursor.rowcount}
    
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Datenbankfehler: {str(e)}")
        return {"success": False, "error": str(e)}
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def create_tables():
    """Erstellt alle benötigten Tabellen, falls sie noch nicht existieren."""
    conn = get_db_connection()
    if conn is None:
        logger.error("Konnte keine Datenbankverbindung herstellen, um Tabellen zu erstellen.")
        return {"success": False, "error": "Keine Datenbankverbindung möglich"}

    try:
        logger.info("Erstelle Tabellen, wenn nötig...")
        with conn.cursor() as cur:
            # Tenant-Tabelle
            cur.execute("""
                CREATE TABLE IF NOT EXISTS tenants (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Mitarbeiter-Tabelle
            cur.execute("""
                CREATE TABLE IF NOT EXISTS employees (
                    id SERIAL PRIMARY KEY,
                    tenant_id INTEGER REFERENCES tenants(id),
                    first_name VARCHAR(50) NOT NULL,
                    last_name VARCHAR(50) NOT NULL,
                    email VARCHAR(100) UNIQUE,
                    phone VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Skill-Kategorie-Tabelle
            cur.execute("""
                CREATE TABLE IF NOT EXISTS skill_categories (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    description TEXT
                );
            """)
            
            # Skills-Tabelle
            cur.execute("""
                CREATE TABLE IF NOT EXISTS skills (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    category_id INTEGER REFERENCES skill_categories(id),
                    description TEXT
                );
            """)
            
            # Lebenslauf-Tabelle
            cur.execute("""
                CREATE TABLE IF NOT EXISTS cvs (
                    id SERIAL PRIMARY KEY,
                    employee_id INTEGER REFERENCES employees(id),
                    file_path VARCHAR(255),
                    file_name VARCHAR(255),
                    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    extracted_text TEXT,
                    extracted_data JSONB,
                    status VARCHAR(20) DEFAULT 'new'
                );
            """)
            
            # Verknüpfungstabelle zwischen Lebenslauf und Skills
            cur.execute("""
                CREATE TABLE IF NOT EXISTS cv_skills (
                    id SERIAL PRIMARY KEY,
                    cv_id INTEGER REFERENCES cvs(id),
                    skill_id INTEGER REFERENCES skills(id),
                    proficiency_level INTEGER,
                    years_of_experience NUMERIC(4,1),
                    is_extracted BOOLEAN DEFAULT true,
                    UNIQUE(cv_id, skill_id)
                );
            """)
            
            # Indizes für bessere Abfrageleistung
            cur.execute("CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_skills_category_id ON skills(category_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_cvs_employee_id ON cvs(employee_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_cv_skills_cv_id ON cv_skills(cv_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_cv_skills_skill_id ON cv_skills(skill_id);")
            
            conn.commit()
            logger.info("Tabellen erfolgreich erstellt oder waren bereits vorhanden.")
            
            # Überprüfe, ob die Tabellen tatsächlich erstellt wurden
            cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
            table_count = cur.fetchone()[0]  # Verwende Index anstelle von String-Key
            logger.info(f"Anzahl der Tabellen im Schema 'public': {table_count}")
            
            # Default-Tenant erstellen, falls noch nicht vorhanden
            tenant_result = create_default_tenant(conn)
            
            return {
                "success": True, 
                "message": "Tabellen erfolgreich erstellt",
                "tables": table_count,
                "tenant_id": tenant_result
            }
    except Exception as e:
        logger.error(f"Fehler beim Erstellen der Tabellen: {str(e)}")
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def create_default_tenant(conn):
    """Erstellt einen Standard-Tenant, falls noch keiner existiert."""
    try:
        with conn.cursor() as cur:
            # Prüfen, ob bereits ein Tenant existiert
            cur.execute("SELECT id FROM tenants LIMIT 1;")
            tenant_result = cur.fetchone()
            
            if not tenant_result:
                logger.info("Erstelle Standard-Tenant...")
                cur.execute("""
                    INSERT INTO tenants (name, description)
                    VALUES ('Default Tenant', 'Standardmäßiger Tenant für HRMatrix')
                    RETURNING id;
                """)
                tenant_id = cur.fetchone()[0]  # Verwende Index anstelle von String-Key
                conn.commit()
                logger.info(f"Standard-Tenant erstellt mit ID: {tenant_id}")
                return {"success": True, "id": tenant_id, "message": "Neuer Standard-Tenant erstellt"}
            else:
                tenant_id = tenant_result[0]  # Verwende Index anstelle von String-Key
                logger.info(f"Standard-Tenant existiert bereits mit ID: {tenant_id}")
                return {"success": True, "id": tenant_id, "message": "Existierender Tenant verwendet"}
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Standard-Tenants: {str(e)}")
        conn.rollback()
        return {"success": False, "error": str(e)}

def create_default_admin_user() -> Dict[str, Any]:
    """Erstellt einen Standard-Admin-Benutzer, falls noch keiner existiert."""
    try:
        # Hier würde die Logik für die Erstellung eines Admin-Benutzers stehen
        # Da wir keine Benutzertabelle haben, geben wir einfach erfolgreich zurück
        return {
            "success": True,
            "user_id": 1,
            "email": "admin@example.com",
            "message": "Standard-Admin-Benutzer verfügbar"
        }
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Admin-Benutzers: {str(e)}")
        return {
            "success": False, 
            "error": str(e)
        } 