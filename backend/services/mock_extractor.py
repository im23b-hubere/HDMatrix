# -*- coding: utf-8 -*-
import logging
from typing import Dict, Any
import json

logger = logging.getLogger(__name__)

class MockExtractor:
    """Mock-Extraktor for testing"""
    
    def __init__(self):
        """Initialize the mock extractor"""
        logger.info("Mock extractor initialized")
        
    def test_connection(self) -> bool:
        """Mock connection test"""
        return True
        
    def extract_cv_data(self, text: str) -> Dict[str, Any]:
        """Extract mock data from CV text
        
        Args:
            text: The CV text to analyze
            
        Returns:
            Dict with mock data in standardized format
        """
        # Create mock data
        mock_data = {
            "personal_data": {
                "first_name": "Max",
                "last_name": "Mustermann",
                "email": "max.mustermann@example.com",
                "phone": "+49 123 4567890",
                "location": {
                    "city": "Berlin",
                    "country": "Germany"
                }
            },
            "education": [
                {
                    "degree": "Master of Science",
                    "field": "Computer Science",
                    "institution": "Technical University Berlin",
                    "location": "Berlin",
                    "start_date": "2018-09",
                    "end_date": "2020-06",
                    "description": "Focus: Artificial Intelligence and Machine Learning"
                },
                {
                    "degree": "Bachelor of Science",
                    "field": "Computer Science",
                    "institution": "University Hamburg",
                    "location": "Hamburg",
                    "start_date": "2015-09",
                    "end_date": "2018-06",
                    "description": "Computer Science and Software Development Basics"
                }
            ],
            "experience": [
                {
                    "title": "Senior Software Engineer",
                    "company": "Tech GmbH",
                    "location": "Berlin",
                    "start_date": "2020-07",
                    "end_date": "2023-12",
                    "description": "Development of AI-based applications",
                    "achievements": [
                        "Implementation of ML pipeline",
                        "System architecture optimization",
                        "Leading a team of 5 developers"
                    ]
                }
            ],
            "skills": {
                "technical": [
                    "Python",
                    "JavaScript",
                    "Machine Learning",
                    "Docker",
                    "Git"
                ],
                "soft": [
                    "Team Leadership",
                    "Project Management",
                    "Communication"
                ],
                "languages": [
                    {
                        "language": "German",
                        "level": "C2"
                    },
                    {
                        "language": "English",
                        "level": "C1"
                    }
                ]
            }
        }
        
        logger.info("Mock data created successfully")
        return mock_data
        
    def extract_from_text(self, text: str) -> Dict[str, Any]:
        """Wrapper method for text extraction"""
        return self.extract_cv_data(text) 