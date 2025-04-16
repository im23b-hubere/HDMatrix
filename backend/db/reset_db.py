import logging
from .database import db
from .schema import create_tables, create_test_user

logger = logging.getLogger(__name__)

def reset_database() -> bool:
    """Reset the database by dropping and recreating it"""
    try:
        # Drop and recreate database
        if not db.create_database(drop_if_exists=True):
            return False
            
        # Create tables
        if not create_tables():
            return False
            
        # Create test user
        if not create_test_user():
            return False
            
        logger.info("Database reset successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to reset database: {str(e)}")
        return False

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Reset database
    if reset_database():
        print("Database reset completed successfully")
    else:
        print("Database reset failed") 