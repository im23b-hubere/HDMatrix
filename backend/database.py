import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'dbname': 'hrmatrixdb',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5432'
}

def init_database():
    """Initialize the database"""
    try:
        # Connect without database
        conn = psycopg2.connect(
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port']
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create database if not exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_CONFIG['dbname'],))
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f"CREATE DATABASE {DB_CONFIG['dbname']}")
            logger.info(f"Database '{DB_CONFIG['dbname']}' created.")
        
        cursor.close()
        conn.close()
        
        # Connect to the database and create tables
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create cv_data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cv_data (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                extracted_data JSONB,
                skills JSONB,
                projects JSONB,
                languages JSONB,
                certifications JSONB,
                template_version VARCHAR(50),
                last_modified_by INTEGER,
                status VARCHAR(50) DEFAULT 'active',
                visibility VARCHAR(50) DEFAULT 'private',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        logger.info("Tables created successfully.")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        return False

if __name__ == "__main__":
    if init_database():
        print("Database setup completed successfully.")
    else:
        print("Database setup failed.") 