import os
import logging
import json
from typing import Dict, Any
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenAIExtractor:
    """OpenAI-based CV Extractor"""
    
    def __init__(self):
        """Initialize the OpenAI Extractor"""
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API Key not found in .env")
            
        self.client = OpenAI(api_key=self.api_key)
        logger.info("OpenAI Extractor initialized")
        
    def test_connection(self) -> bool:
        """Test the connection to the OpenAI API"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Test"}],
                max_tokens=5
            )
            logger.info("OpenAI connection test successful")
            return True
        except Exception as e:
            logger.error(f"OpenAI connection test failed: {str(e)}")
            return False
            
    def extract_cv_data(self, text: str) -> Dict[str, Any]:
        """Extract structured data from CV text
        
        Args:
            text: The CV text to analyze
            
        Returns:
            Dict with extracted data in standardized format
        """
        try:
            # System prompt defines the role and task
            system_prompt = """You are an expert in analyzing resumes.
            Extract precise key information and format it as JSON.
            Pay special attention to completeness and accuracy in:
            - Personal data (name, contact, location)
            - Education (chronological, with exact time periods)
            - Work experience (chronological, with details)
            - Skills (technical, soft skills)
            - Languages (with levels)
            
            Format all dates as 'YYYY-MM'.
            For missing information, leave fields empty ([]/{}/""), but maintain the structure."""

            # User prompt defines the expected format
            user_prompt = f"""Analyze the following resume and extract the data in the specified JSON format:

            {{
                "personal_data": {{
                    "first_name": "",
                    "last_name": "",
                    "email": "",
                    "phone": "",
                    "location": {{
                        "city": "",
                        "country": ""
                    }}
                }},
                "education": [
                    {{
                        "degree": "",
                        "field": "",
                        "institution": "",
                        "location": "",
                        "start_date": "YYYY-MM",
                        "end_date": "YYYY-MM",
                        "description": ""
                    }}
                ],
                "experience": [
                    {{
                        "title": "",
                        "company": "",
                        "location": "",
                        "start_date": "YYYY-MM",
                        "end_date": "YYYY-MM",
                        "description": "",
                        "achievements": []
                    }}
                ],
                "skills": {{
                    "technical": [],
                    "soft": [],
                    "languages": [
                        {{
                            "language": "",
                            "level": ""
                        }}
                    ]
                }}
            }}

            Resume:
            {text}"""

            # OpenAI API request with new syntax
            response = self.client.chat.completions.create(
                model="gpt-4",  # Use GPT-4 for better extraction
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Low temperature for more consistent results
                max_tokens=2000
            )
            
            # Extract and validate the response
            result = response.choices[0].message.content.strip()
            
            try:
                extracted_data = json.loads(result)
                logger.info(f"CV data successfully extracted for: {extracted_data.get('personal_data', {}).get('first_name', '')} {extracted_data.get('personal_data', {}).get('last_name', '')}")
                return extracted_data
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {str(e)}\nResponse: {result}")
                raise ValueError(f"Error parsing OpenAI response: {str(e)}")
                
        except Exception as e:
            logger.error(f"OpenAI extraction error: {str(e)}")
            raise ValueError(f"Error during CV extraction: {str(e)}")
            
    def extract_from_text(self, text: str) -> Dict[str, Any]:
        """Wrapper method for text extraction"""
        return self.extract_cv_data(text) 