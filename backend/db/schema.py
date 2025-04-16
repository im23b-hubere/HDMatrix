from typing import List
import logging
from .database import db

logger = logging.getLogger(__name__)

TABLES = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    """,
    
    """
    CREATE TABLE IF NOT EXISTS cvs (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        content_text TEXT,
        extracted_data JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    )
    """,
    
    """
    CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    """,
    
    """
    CREATE TABLE IF NOT EXISTS cv_tags (
        cv_id INTEGER REFERENCES cvs(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (cv_id, tag_id)
    )
    """
]

TRIGGERS = [
    """
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """,
    
    """
    DO $$ 
    BEGIN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
        WHEN others THEN null;
    END $$;
    """,
    
    """
    DO $$ 
    BEGIN
        CREATE TRIGGER update_cvs_updated_at
            BEFORE UPDATE ON cvs
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
        WHEN others THEN null;
    END $$;
    """,
    
    """
    DO $$ 
    BEGIN
        CREATE TRIGGER update_tags_updated_at
            BEFORE UPDATE ON tags
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
        WHEN others THEN null;
    END $$;
    """
]

def create_tables() -> bool:
    """Create all database tables"""
    try:
        # Create tables
        for table_sql in TABLES:
            if not db.execute_query(table_sql):
                logger.error(f"Failed to create table: {table_sql[:50]}...")
                return False
                
        # Create triggers
        for trigger_sql in TRIGGERS:
            if not db.execute_query(trigger_sql):
                logger.error(f"Failed to create trigger: {trigger_sql[:50]}...")
                return False
                
        logger.info("Database tables and triggers created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to create tables: {str(e)}")
        return False

def create_test_user() -> bool:
    """Create a test user if it doesn't exist"""
    try:
        # Check if test user exists
        result = db.fetch_one(
            "SELECT id FROM users WHERE username = %s",
            ('test',)
        )
        
        if not result:
            # Create test user with password 'test123'
            success = db.execute_query("""
                INSERT INTO users (username, password_hash, email)
                VALUES (%s, %s, %s)
            """, ('test', 
                'pbkdf2:sha256:600000$X7YEGxNyC6B2Th0q$c33c54c8c495493f1aaa0f8063e1d45c6f3c4f48192f5505d7d1c892ea957164',
                'test@example.com'))
                
            if success:
                logger.info("Test user created successfully")
            else:
                logger.error("Failed to create test user")
                return False
        else:
            logger.info("Test user already exists")
            
        return True
        
    except Exception as e:
        logger.error(f"Failed to create test user: {str(e)}")
        return False 