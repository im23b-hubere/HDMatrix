import os
import logging
import requests
import json
import PyPDF2
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
from dotenv import load_dotenv

# Umgebungsvariablen explizit neu laden
load_dotenv()

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Standard-Modell für die Extraktion
# Verwende ein leistungsfähigeres Modell für komplexe Extraktionsaufgaben
model_id = "mistralai/Mistral-7B-Instruct-v0.2"  # Stärkeres Modell für Textextraktion

class HuggingFaceExtractor:
    """Extractor zur Nutzung der HuggingFace API zur Extraktion von CV-Daten"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = model_id):
        """Initialisiere den HuggingFace Extraktor
        
        Args:
            api_key: HuggingFace API-Key
            model: HuggingFace Modell-ID
        """
        # Lade die Umgebungsvariablen neu und verwende den neuen API-Key
        load_dotenv()
        
        # Verwende den API-Key aus der Umgebungsvariable oder der .env-Datei
        self.api_key = api_key or os.environ.get("HUGGINGFACE_API_KEY")
        
        if not self.api_key:
            raise ValueError("Kein HuggingFace API-Key gefunden. Bitte in der .env-Datei oder als Umgebungsvariable angeben.")
        
        logger.info(f"Verwende API-Key: {self.api_key[:4]}...{self.api_key[-4:]}")
        
        self.model = model
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"
        # Stelle sicher, dass der API-Key korrekt formatiert ist
        self.headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json"
        }
        
        logger.info(f"HuggingFaceExtractor initialisiert mit Modell: {model}")

    def extract_cv_data(self, cv_text: str) -> Dict[str, Any]:
        """Extrahiert strukturierte Daten aus einem CV-Text
        
        Args:
            cv_text: Der zu analysierende CV-Text
            
        Returns:
            Dict mit extrahierten CV-Daten
        """
        try:
            logger.info("Extrahiere CV-Daten mit HuggingFace API")
            
            # Prompt für die Extraktion der CV-Daten - Format für Mistral-Modell angepasst
            prompt = f"""<s>[INST]
            Extrahiere die folgenden Informationen aus dem Lebenslauf und gib sie im JSON-Format zurück:
            - name: vollständiger Name
            - email: E-Mail-Adresse
            - phone: Telefonnummer
            - address: vollständige Adresse
            - skills: Liste von Fähigkeiten
            - work_experience: Liste von Arbeitserfahrungen mit position, company, start_date, end_date, description
            - education: Liste von Ausbildungen mit degree, institution, start_date, end_date
            - languages: Liste von Sprachen mit language, proficiency
            - summary: Zusammenfassung/Profil
            - projects: Liste von Projekten mit name, description, technologies

            Hier ist der Lebenslauf:
            
            {cv_text}
            
            Gib deine Antwort nur im folgenden JSON-Format zurück ohne Markdown-Format oder andere Formatierungen:
            {{
                "name": "",
                "email": "",
                "phone": "",
                "address": "",
                "skills": [],
                "work_experience": [
                    {{
                        "position": "",
                        "company": "",
                        "start_date": "",
                        "end_date": "",
                        "description": ""
                    }}
                ],
                "education": [
                    {{
                        "degree": "",
                        "institution": "",
                        "start_date": "",
                        "end_date": ""
                    }}
                ],
                "languages": [
                    {{
                        "language": "",
                        "proficiency": ""
                    }}
                ],
                "summary": "",
                "projects": [
                    {{
                        "name": "",
                        "description": "",
                        "technologies": []
                    }}
                ]
            }}
            [/INST]</s>
            """
            
            # API-Anfrage - Parameter für Mistral angepasst
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 2048,
                    "temperature": 0.1,
                    "top_p": 0.95,
                    "do_sample": True,
                    "return_full_text": False
                }
            }
            
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            logger.info(f"API-Antwort: Status {response.status_code}")
            
            # Extrahiere JSON aus der Antwort
            result = response.json()
            logger.debug(f"API-Antwort (Rohdaten): {result}")
            
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
            else:
                generated_text = result.get("generated_text", "")
                
            logger.debug(f"Generierter Text: {generated_text[:100]}...")
                
            # JSON extrahieren, falls es in Markdown-Blöcken eingebettet ist
            if "```json" in generated_text:
                json_str = generated_text.split("```json")[1].split("```")[0].strip()
            elif "```" in generated_text:
                json_str = generated_text.split("```")[1].strip()
            else:
                # Versuche, das erste valid JSON-Objekt im Text zu finden
                import re
                json_match = re.search(r'(\{.*\})', generated_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                else:
                    json_str = generated_text.strip()
                
            logger.debug(f"Extrahiertes JSON: {json_str[:100]}...")
                
            # Versuche, JSON zu parsen
            try:
                extracted_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                logger.error(f"Fehler beim Parsen des JSON: {str(e)}")
                # Fallback auf Regex-Extraktion von JSON
                json_match = re.search(r'(\{.*\})', generated_text, re.DOTALL)
                if json_match:
                    try:
                        extracted_data = json.loads(json_match.group(1))
                    except json.JSONDecodeError:
                        raise ValueError("Konnte kein gültiges JSON aus der Antwort extrahieren")
                else:
                    raise ValueError("Konnte kein JSON-Objekt in der Antwort finden")
            
            # Format überprüfen und fehlende Felder hinzufügen
            required_fields = [
                "name", "email", "phone", "address", "skills", 
                "work_experience", "education", "languages", "summary", "projects"
            ]
            
            for field in required_fields:
                if field not in extracted_data:
                    extracted_data[field] = [] if field in ["skills", "work_experience", "education", "languages", "projects"] else ""
            
            logger.info(f"Erfolgreich Daten extrahiert für: {extracted_data.get('name', 'Unbekannt')}")
            return extracted_data
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion mit HuggingFace: {str(e)}")
            # Fallback auf leeres Ergebnis bei Fehler
            return {
                "name": "",
                "email": "",
                "phone": "",
                "address": "",
                "skills": [],
                "work_experience": [],
                "education": [],
                "languages": [],
                "summary": "",
                "projects": []
            }
            
    def test_connection(self) -> Dict[str, Any]:
        """Testet die Verbindung zur HuggingFace API
        
        Returns:
            Dict mit Ergebnis des Tests
        """
        try:
            # Einfacher Test mit minimaler Anfrage - angepasst für Mistral
            test_prompt = "<s>[INST] Sag mir: Hallo [/INST]</s>"
            payload = {
                "inputs": test_prompt,
                "parameters": {
                    "max_new_tokens": 10,
                    "temperature": 0.1,
                    "do_sample": True,
                    "return_full_text": False
                }
            }
            
            logger.info(f"Teste Verbindung zu HuggingFace mit Modell {self.model}")
            logger.debug(f"API-URL: {self.api_url}")
            logger.debug(f"Headers: Authorization: Bearer {self.api_key[:4]}...{self.api_key[-4:]}")
            
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            logger.info(f"Test-Antwort Status: {response.status_code}")
            
            return {
                "success": True,
                "message": "Verbindung zur HuggingFace API erfolgreich",
                "model": self.model,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Fehler bei der Verbindung zur HuggingFace API: {str(e)}")
            return {
                "success": False,
                "message": f"Fehler bei der Verbindung zur HuggingFace API: {str(e)}",
                "model": self.model,
                "timestamp": datetime.now().isoformat()
            }
    
    def extract_from_file(self, file_path: str) -> Dict[str, Any]:
        """Extrahiert Informationen aus einer PDF-Datei"""
        try:
            # Text aus PDF extrahieren
            extracted_text = self._extract_text_from_file(file_path)
            
            if not extracted_text:
                return {"error": "Kein Text aus der Datei extrahiert"}
            
            # Text analysieren mit Hugging Face API
            return self.extract_cv_data(extracted_text)
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion: {str(e)}")
            return {"error": str(e), "status": "failed"}
    
    def _extract_text_from_file(self, file_path: str) -> str:
        """Extrahiert Text aus einer Datei basierend auf dem Dateityp"""
        if file_path.lower().endswith('.pdf'):
            return self._extract_text_from_pdf(file_path)
        elif file_path.lower().endswith(('.docx', '.doc')):
            logger.warning("Word-Dokumente werden nicht vollständig unterstützt")
            return "Word-Dokument (Text nicht extrahiert)"
        else:
            logger.warning(f"Nicht unterstützter Dateityp: {file_path}")
            return ""
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extrahiert Text aus einer PDF-Datei"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                return text
        except Exception as e:
            logger.error(f"Fehler beim Extrahieren von Text aus PDF: {str(e)}")
            return "" 