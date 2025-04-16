import os
import re
import psycopg2
import json
from pathlib import Path

# Database connection configuration
DB_CONFIG = {
    'dbname': 'hrmatrixdb',
    'user': 'postgres',
    'password': 'Steinadler17',
    'host': 'localhost',
    'port': '5432',
    'options': '-c client_encoding=UTF8'
}

def test_connection():
    """Test database connection"""
    print("\nTesting database connection...")
    
    try:
        conn = psycopg2.connect(
            dbname=DB_CONFIG['dbname'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            options=DB_CONFIG['options']
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        db_version = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        print(f"✓ Connection successful!")
        print(f"  Database version: {db_version[0]}")
        return True
    
    except Exception as e:
        print(f"✗ Connection error: {str(e)}")
        return False

def get_python_files():
    """Find all Python files in the backend directory"""
    backend_dir = Path('.')
    python_files = list(backend_dir.glob('**/*.py'))
    
    # Exclude virtualenv and test files
    excluded_dirs = ['venv', 'env', '__pycache__', 'tests']
    filtered_files = [f for f in python_files if not any(excl in str(f) for excl in excluded_dirs)]
    
    return filtered_files

def check_config_in_file(file_path):
    """Check if the file contains database connection parameters"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
            # Search for typical database connection parameters
            db_patterns = [
                r'psycopg2\.connect\s*\(',
                r'dbname\s*=',
                r'host\s*=',
                r'password\s*=',
                r'DB_CONFIG\s*='
            ]
            
            for pattern in db_patterns:
                if re.search(pattern, content):
                    return True
                    
        return False
    except Exception as e:
        print(f"Error reading {file_path}: {str(e)}")
        return False

def scan_for_db_configs():
    """Scan for files with database connection parameters"""
    python_files = get_python_files()
    
    print("\nSearching for files with database connection parameters...")
    db_config_files = []
    
    for file_path in python_files:
        if check_config_in_file(file_path):
            db_config_files.append(file_path)
            print(f"- {file_path}")
    
    return db_config_files

def check_environment_variables():
    """Check and update environment variables for database connection"""
    print("\nChecking environment variables...")
    
    env_file = Path('.env')
    env_vars = {
        'DB_NAME': DB_CONFIG['dbname'],
        'DB_USER': DB_CONFIG['user'],
        'DB_PASSWORD': DB_CONFIG['password'],
        'DB_HOST': DB_CONFIG['host'],
        'DB_PORT': DB_CONFIG['port'],
        'DB_OPTIONS': DB_CONFIG['options']
    }
    
    if env_file.exists():
        try:
            # Read existing .env file
            with open(env_file, 'r') as f:
                content = f.read()
            
            # Update values
            for key, value in env_vars.items():
                pattern = rf'^{key}=.*$'
                replacement = f'{key}={value}'
                
                if re.search(pattern, content, re.MULTILINE):
                    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
                else:
                    content += f'\n{key}={value}'
            
            # Write updated .env file
            with open(env_file, 'w') as f:
                f.write(content)
                
            print(f"✓ Environment variables updated in .env file")
            
        except Exception as e:
            print(f"✗ Error updating .env file: {str(e)}")
    else:
        # Create new .env file
        try:
            with open(env_file, 'w') as f:
                for key, value in env_vars.items():
                    f.write(f'{key}={value}\n')
            
            print(f"✓ New .env file created with database connection parameters")
            
        except Exception as e:
            print(f"✗ Error creating .env file: {str(e)}")

def update_config_file():
    """Update or create the configuration file"""
    print("\nUpdating configuration file...")
    
    config_dir = Path('config')
    config_file = config_dir / 'database.json'
    
    if not config_dir.exists():
        config_dir.mkdir(exist_ok=True)
    
    try:
        config_data = {
            'database': {
                'development': DB_CONFIG,
                'production': {
                    **DB_CONFIG,
                    'host': '${DB_HOST}',  # Placeholder for environment variables
                    'password': '${DB_PASSWORD}'
                }
            }
        }
        
        with open(config_file, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        print(f"✓ Configuration file updated: {config_file}")
        
    except Exception as e:
        print(f"✗ Error updating configuration file: {str(e)}")

def main():
    print("=== HRMatrix Database Connection Optimizer ===")
    
    # Check connection
    if not test_connection():
        print("\nWarning: Could not establish database connection.")
        proceed = input("Do you want to continue? (y/n): ")
        if proceed.lower() != 'y':
            return
    
    # Search for files with database connection parameters
    db_config_files = scan_for_db_configs()
    
    # Update environment variables
    check_environment_variables()
    
    # Update configuration file
    update_config_file()
    
    print("\n=== Database connection configured ===")
    print(f"""
Database connection has been updated. The following settings are being used:
- Database name: {DB_CONFIG['dbname']}
- User: {DB_CONFIG['user']}
- Password: {'*' * len(DB_CONFIG['password'])}
- Host: {DB_CONFIG['host']}
- Port: {DB_CONFIG['port']}
- Options: {DB_CONFIG['options']}
""")

if __name__ == '__main__':
    main() 