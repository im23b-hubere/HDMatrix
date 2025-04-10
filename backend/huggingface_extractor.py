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
# Verwende ein kostenloses Modell für die CV-Extraktion
model_id = "facebook/bart-large-cnn"  # Kostenloses Modell für Textextraktion und Zusammenfassung

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
            Du bist ein Experte für die Analyse deutscher Lebensläufe. Extrahiere präzise die folgenden Informationen aus dem Lebenslauf und gib sie im JSON-Format zurück.
            Achte besonders auf:
            - Deutsche Datumsformate und Zeitangaben
            - Deutsche Bildungsabschlüsse (z.B. Abitur, Bachelor, Master, Promotion)
            - Deutsche Berufsbezeichnungen
            - Typisch deutsche Formulierungen und Strukturen in Lebensläufen

            Extrahiere diese Informationen:
            1. Persönliche Daten:
               - name: Vor- und Nachname
               - email: E-Mail-Adresse
               - phone: Telefonnummer (deutsche Format)
               - address: Vollständige Adresse

            2. Beruflicher Werdegang (work_experience):
               - Genaue Position/Rolle
               - Firma/Unternehmen
               - Zeitraum (Beginn und Ende)
               - Detaillierte Beschreibung der Tätigkeiten
               - Verantwortlichkeiten und Erfolge

            3. Ausbildung (education):
               - Art des Abschlusses (z.B. Abitur, Bachelor, Master)
               - Bildungseinrichtung
               - Zeitraum
               - Schwerpunkte/Vertiefungen
               - Abschlussnote falls angegeben

            4. Fähigkeiten (skills):
               - Technische Fähigkeiten
               - Programmiersprachen
               - Frameworks und Tools
               - Methoden (z.B. Scrum, Kanban)
               - Soft Skills

            5. Sprachen (languages):
               - Sprache
               - Niveau nach europäischem Referenzrahmen (A1-C2)

            6. Projekte (projects):
               - Projektname
               - Detaillierte Beschreibung
               - Eingesetzte Technologien
               - Rolle im Projekt
               - Ergebnisse/Erfolge

            Hier ist der Lebenslauf:
            
            {cv_text}
            
            Formatiere die Antwort EXAKT in diesem JSON-Format:
            {{
                "name": "Vorname Nachname",
                "email": "email@domain.de",
                "phone": "+49 123 45678",
                "address": "Straße Nr, PLZ Ort",
                "skills": [
                    {{
                        "category": "Programmiersprachen",
                        "items": ["Python", "Java", "JavaScript"]
                    }},
                    {{
                        "category": "Frameworks",
                        "items": ["React", "Angular", "Spring"]
                    }},
                    {{
                        "category": "Methoden",
                        "items": ["Scrum", "Kanban"]
                    }}
                ],
                "work_experience": [
                    {{
                        "position": "Senior Entwickler",
                        "company": "Firma GmbH",
                        "start_date": "01.2020",
                        "end_date": "heute",
                        "description": "Detaillierte Beschreibung",
                        "responsibilities": ["Verantwortung 1", "Verantwortung 2"],
                        "achievements": ["Erfolg 1", "Erfolg 2"]
                    }}
                ],
                "education": [
                    {{
                        "degree": "Master of Science",
                        "institution": "Universität",
                        "start_date": "10.2018",
                        "end_date": "09.2020",
                        "focus": "Schwerpunkt",
                        "grade": "1,3"
                    }}
                ],
                "languages": [
                    {{
                        "language": "Deutsch",
                        "proficiency": "Muttersprache"
                    }},
                    {{
                        "language": "Englisch",
                        "proficiency": "C1"
                    }}
                ],
                "projects": [
                    {{
                        "name": "Projektname",
                        "description": "Detaillierte Beschreibung",
                        "technologies": ["Tech1", "Tech2"],
                        "role": "Projektrolle",
                        "achievements": ["Ergebnis 1", "Ergebnis 2"]
                    }}
                ]
            }}
            
            WICHTIG:
            - Extrahiere ALLE verfügbaren Informationen
            - Behalte das exakte JSON-Format bei
            - Verwende deutsche Datumsformate (MM.YYYY)
            - Kategorisiere die Skills sinnvoll
            - Füge leere Arrays [] ein, wenn keine Daten verfügbar sind
            - Setze "heute" als end_date bei aktuellen Positionen
            [/INST]</s>
            """
            
            # API-Anfrage - Parameter für BART angepasst
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_length": 1024,        # Maximale Länge der Ausgabe
                    "min_length": 512,         # Minimale Länge für vollständige Extraktion
                    "length_penalty": 2.0,     # Bevorzugt längere Antworten
                    "num_beams": 4,            # Beam Search für bessere Qualität
                    "temperature": 0.7,        # Moderate Kreativität
                    "no_repeat_ngram_size": 3, # Verhindert Wiederholungen
                    "early_stopping": True     # Stoppt wenn fertig
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