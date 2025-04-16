# -*- coding: utf-8 -*-
import os
import logging
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

class Database:
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = os.getenv('DB_PORT', '5432')
        self.user = os.getenv('DB_USER', 'postgres')
        self.password = os.getenv('DB_PASSWORD', 'postgres')
        self.dbname = os.getenv('DB_NAME', 'hrmatrix')

    def get_connection(self, database=None):
        """Get a database connection"""
        try:
            conn = psycopg2.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=database if database else self.dbname,
                options="-c client_encoding=utf8"
            )
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            return None

    def create_database(self):
        """Create the database if it doesn't exist"""
        try:
            # Connect to postgres database to create new database
            conn = self.get_connection('postgres')
            if not conn:
                return False

            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = conn.cursor()

            # Check if database exists
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (self.dbname,))
            exists = cur.fetchone()
            
            if not exists:
                # Create database with Windows-compatible encoding
                cur.execute(f'CREATE DATABASE {self.dbname} WITH ENCODING = \'UTF8\' LC_COLLATE = \'German_Germany.1252\' LC_CTYPE = \'German_Germany.1252\' TEMPLATE template0')
                logger.info(f"Database {self.dbname} created successfully")
            
            cur.close()
            conn.close()
            return True

        except Exception as e:
            logger.error(f"Failed to create database: {str(e)}")
            return False

    def execute_query(self, query, params=None):
        """Execute a database query"""
        conn = None
        try:
            conn = self.get_connection()
            if not conn:
                return False

            cur = conn.cursor()
            if params:
                cur.execute(query, params)
            else:
                cur.execute(query)
            
            conn.commit()
            return True

        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            if conn:
                conn.rollback()
            return False

        finally:
            if conn:
                conn.close()

    def fetch_one(self, query, params=None):
        """Fetch a single row from the database"""
        conn = None
        try:
            conn = self.get_connection()
            if not conn:
                return None

            cur = conn.cursor()
            if params:
                cur.execute(query, params)
            else:
                cur.execute(query)
            
            return cur.fetchone()

        except Exception as e:
            logger.error(f"Query fetch failed: {str(e)}")
            return None

        finally:
            if conn:
                conn.close()

    def fetch_all(self, query, params=None):
        """Fetch all rows from the database"""
        conn = None
        try:
            conn = self.get_connection()
            if not conn:
                return None

            cur = conn.cursor()
            if params:
                cur.execute(query, params)
            else:
                cur.execute(query)
            
            return cur.fetchall()

        except Exception as e:
            logger.error(f"Query fetch failed: {str(e)}")
            return None

        finally:
            if conn:
                conn.close()

# Create a global database instance
db = Database() 