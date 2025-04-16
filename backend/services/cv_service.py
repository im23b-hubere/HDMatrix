import logging
from typing import Optional, Dict, Any
from services.pdf_extractor import PDFExtractor
from services.openai_extractor import OpenAIExtractor
from services.mock_extractor import MockExtractor
import os
from dotenv import load_dotenv
import psycopg2
from datetime import datetime

load_dotenv()

class CVService:
    def __init__(self):
        """Initialize the CV Service"""
        self.logger = logging.getLogger(__name__)
        
        # Initialize PDF Extractor
        self.pdf_extractor = PDFExtractor()
        
        # Choose extractor based on environment variables
        self.use_openai = os.getenv('USE_OPENAI', 'false').lower() == 'true'
        self.use_mock = os.getenv('USE_MOCK_EXTRACTION', 'false').lower() == 'true'
        
        if self.use_openai:
            try:
                self.extractor = OpenAIExtractor()
                self.logger.info("OpenAI Extractor initialized")
            except Exception as e:
                self.logger.error(f"Error initializing OpenAI: {str(e)}")
                self.use_openai = False
                self.use_mock = True
                
        if self.use_mock:
            self.extractor = MockExtractor()
            self.logger.info("Mock Extractor initialized")
            
        if not hasattr(self, 'extractor'):
            raise RuntimeError("No extractor available")
            
    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(
            dbname=os.getenv('DB_NAME', 'hrmatrixdb'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'postgres'),
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432')
        )
            
    def process_cv(self, file_path):
        """
        Process a CV from a file path
        
        Args:
            file_path (str): Path to the PDF file
            
        Returns:
            dict: Extracted CV data
        """
        try:
            # Extract text from PDF
            extracted_text, error = self.pdf_extractor.extract_text(file_path)
            if error:
                raise Exception(f"PDF extraction failed: {error}")
                
            # Process text with configured extractor
            cv_data = self.extractor.extract_cv_data(extracted_text)
            
            return cv_data
            
        except Exception as e:
            self.logger.error(f"CV processing failed: {str(e)}")
            raise
            
    def create_or_update_cv(self, user_id: int, cv_data: Dict[str, Any]) -> Optional[int]:
        """
        Create or update a CV entry in the database
        
        Args:
            user_id (int): User ID
            cv_data (dict): CV data to store
            
        Returns:
            Optional[int]: CV entry ID if successful, None otherwise
        """
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Check if CV already exists for update
            cv_id = cv_data.get('id')
            if cv_id:
                # Update existing CV
                cursor.execute("""
                    UPDATE cv_data 
                    SET 
                        file_name = %s,
                        extracted_data = %s,
                        skills = %s,
                        projects = %s,
                        languages = %s,
                        certifications = %s,
                        last_modified_by = %s,
                        updated_at = %s
                    WHERE id = %s AND user_id = %s
                    RETURNING id
                """, (
                    cv_data['file_name'],
                    cv_data['extracted_data'],
                    cv_data['skills'],
                    cv_data['projects'],
                    cv_data['languages'],
                    cv_data['certifications'],
                    user_id,
                    datetime.now(),
                    cv_id,
                    user_id
                ))
            else:
                # Create new CV
                cursor.execute("""
                    INSERT INTO cv_data (
                        user_id,
                        file_name,
                        extracted_data,
                        skills,
                        projects,
                        languages,
                        certifications,
                        last_modified_by,
                        created_at,
                        updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    user_id,
                    cv_data['file_name'],
                    cv_data['extracted_data'],
                    cv_data['skills'],
                    cv_data['projects'],
                    cv_data['languages'],
                    cv_data['certifications'],
                    user_id,
                    datetime.now(),
                    datetime.now()
                ))
            
            result = cursor.fetchone()
            conn.commit()
            
            if result:
                return result[0]  # Return CV ID
            return None
            
        except Exception as e:
            self.logger.error(f"Database error in create_or_update_cv: {str(e)}")
            if conn:
                conn.rollback()
            return None
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
                
    def get_cv_by_id(self, cv_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get CV by ID
        
        Args:
            cv_id (int): CV ID
            user_id (int): User ID for authorization
            
        Returns:
            Optional[Dict[str, Any]]: CV data if found, None otherwise
        """
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    id,
                    file_name,
                    extracted_data,
                    skills,
                    projects,
                    languages,
                    certifications,
                    created_at,
                    updated_at
                FROM cv_data
                WHERE id = %s AND user_id = %s
            """, (cv_id, user_id))
            
            result = cursor.fetchone()
            if not result:
                return None
                
            return {
                'id': result[0],
                'file_name': result[1],
                'extracted_data': result[2],
                'skills': result[3],
                'projects': result[4],
                'languages': result[5],
                'certifications': result[6],
                'created_at': result[7].isoformat(),
                'updated_at': result[8].isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Database error in get_cv_by_id: {str(e)}")
            return None
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
                
    def search_cvs(self, query: Dict[str, Any]) -> list:
        """
        Search CVs based on query parameters
        
        Args:
            query (Dict[str, Any]): Search parameters
            
        Returns:
            list: List of matching CVs
        """
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Base query
            sql = """
                SELECT 
                    id,
                    file_name,
                    extracted_data,
                    skills,
                    created_at,
                    updated_at
                FROM cv_data
                WHERE 1=1
            """
            params = []
            
            # Add search conditions
            if 'skills' in query:
                sql += " AND skills ?| array[%s]"
                params.append(query['skills'])
                
            if 'text' in query:
                sql += " AND (extracted_data::text ILIKE %s OR file_name ILIKE %s)"
                search_term = f"%{query['text']}%"
                params.extend([search_term, search_term])
            
            cursor.execute(sql, params)
            results = cursor.fetchall()
            
            return [{
                'id': row[0],
                'file_name': row[1],
                'extracted_data': row[2],
                'skills': row[3],
                'created_at': row[4].isoformat(),
                'updated_at': row[5].isoformat()
            } for row in results]
            
        except Exception as e:
            self.logger.error(f"Database error in search_cvs: {str(e)}")
            return []
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close() 