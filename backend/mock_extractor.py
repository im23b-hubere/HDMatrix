import os
import logging
import PyPDF2
from typing import Dict, Any, Optional

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockExtractor:
    """Mock-Extraktor für CVs, gibt feste Testdaten zurück"""
    
    def __init__(self):
        logger.info("Initialisiere MockExtractor")
    
    def extract_from_file(self, file_path: str) -> Dict[str, Any]:
        """Extrahiert 'Informationen' aus einer Datei (gibt Mockdaten zurück)"""
        logger.info(f"MockExtractor verarbeitet Datei: {file_path}")
        
        # Extrahiere echten Namen aus der Datei für personalisiertere Mockdaten
        extracted_name = self._try_extract_name(file_path)
        first_name = extracted_name.get("first_name", "Eric") 
        last_name = extracted_name.get("last_name", "Huber")
        
        # Mock-Daten mit ggf. personalisierten Namen
        return {
            "personal_data": {
                "vorname": first_name,
                "nachname": last_name,
                "email": f"{first_name.lower()}.{last_name.lower()}@example.com",
                "telefon": "+41 76 544 25 87",
                "adresse": "Sonnenhofstrasse 38, Egg bei Zürich"
            },
            "education": [
                {
                    "institution": "ETH Zürich",
                    "abschluss": "Master of Science",
                    "fachrichtung": "Informatik",
                    "zeitraum": "2018-2022"
                },
                {
                    "institution": "Universität Zürich",
                    "abschluss": "Bachelor of Science",
                    "fachrichtung": "Wirtschaftsinformatik",
                    "zeitraum": "2015-2018"
                }
            ],
            "experience": [
                {
                    "firma": "Datahouse AG",
                    "position": "Software Engineer",
                    "zeitraum": "2022-heute",
                    "beschreibung": "Entwicklung von Datenanalyselösungen"
                },
                {
                    "firma": "UBS",
                    "position": "IT Praktikant",
                    "zeitraum": "2020-2021",
                    "beschreibung": "Mitarbeit an Banking-Applikationen"
                }
            ],
            "skills": {
                "technische_skills": ["Python", "Java", "SQL", "Machine Learning", "Docker", "AWS"],
                "soft_skills": ["Teamarbeit", "Kommunikation", "Projektmanagement"],
                "sprachen": ["Deutsch (Muttersprache)", "Englisch (fließend)", "Französisch (Grundkenntnisse)"]
            }
        }
    
    def _try_extract_name(self, file_path: str) -> Dict[str, str]:
        """Versucht, den Namen aus der Datei zu extrahieren"""
        try:
            if file_path.lower().endswith('.pdf'):
                with open(file_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    text = ""
                    # Nur die erste Seite lesen, wo Namen oft stehen
                    if len(reader.pages) > 0:
                        text = reader.pages[0].extract_text()
                    
                    # Einfache heuristische Namensextraktion
                    # Suche nach verbreiteten Mustern in Lebensläufen
                    import re
                    
                    # Pattern für "Vorname Nachname" Format
                    name_match = re.search(r'\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b', text)
                    if name_match:
                        return {
                            "first_name": name_match.group(1),
                            "last_name": name_match.group(2)
                        }
                    
                    # Dateiname als Fallback
                    filename = os.path.basename(file_path)
                    name_parts = filename.split('_')
                    if len(name_parts) >= 2:
                        return {
                            "first_name": name_parts[0].capitalize(),
                            "last_name": name_parts[1].capitalize()
                        }
        except Exception as e:
            logger.warning(f"Fehler bei Namensextraktion: {str(e)}")
        
        # Standardwerte, wenn keine Extraktion möglich
        return {
            "first_name": "Max",
            "last_name": "Mustermann"
        } 