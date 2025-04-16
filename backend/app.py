import os
import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from db.database import db
from db.schema import create_tables, create_test_user
from routes.cv_routes import cv_upload_bp
from logging.handlers import RotatingFileHandler

# Load environment variables
load_dotenv()

# Configure logging
if not os.path.exists('logs'):
    os.makedirs('logs')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add file handler
file_handler = RotatingFileHandler(
    'logs/app.log',
    maxBytes=10240,
    backupCount=10
)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
logger.addHandler(file_handler)

logger.info('Starting HRMatrix backend...')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

def init_database():
    """Initialize database and create tables"""
    try:
        # Create database if it doesn't exist
        if not db.create_database():
            logger.error("Failed to create database")
            return False

        # Create tables and triggers
        if not create_tables():
            logger.error("Failed to create tables")
            return False

        # Create test user
        if not create_test_user():
            logger.error("Failed to create test user")
            return False

        logger.info("Database initialization completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False

def init_app():
    """Initialize the application"""
    try:
        # Initialize database
        if not init_database():
            return False
        
        # Register blueprints
        app.register_blueprint(cv_upload_bp)
        logger.info("Application blueprints registered successfully")
        
        return True
        
    except Exception as e:
        logger.error(f"Application initialization failed: {str(e)}")
        return False

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return {'status': 'healthy'}, 200

if __name__ == '__main__':
    if init_app():
        port = int(os.getenv('PORT', 5000))
        logger.info(f"Starting server on port {port}")
        app.run(
            host='0.0.0.0',
            port=port,
            debug=True
        )
    else:
        logger.error("Failed to initialize application")
        exit(1) 