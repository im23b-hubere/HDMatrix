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

            response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=60) # Timeout hinzugefügt
            response.raise_for_status()

            logger.info(f"API-Antwort: Status {response.status_code}")

            # Extrahiere JSON aus der Antwort
            result = response.json()
            logger.debug(f"API-Antwort (Rohdaten): {result}")

            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
            elif isinstance(result, dict): # Manchmal gibt die API ein Dict zurück
                 generated_text = result.get("generated_text", "")
            else:
                 generated_text = "" # Fallback

            logger.debug(f"Generierter Text: {generated_text[:100]}...")

            # JSON extrahieren, falls es in Markdown-Blöcken eingebettet ist
            json_str = generated_text.strip() # Starte mit dem bereinigten Text
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                 # Manchmal fehlt 'json' nach ```
                 parts = json_str.split("```")
                 if len(parts) > 1:
                     json_str = parts[1].strip()


            # Versuche, das erste valid JSON-Objekt im Text zu finden, falls kein Markdown gefunden wurde
            if not json_str.startswith('{'):
                json_match = re.search(r'(\{.*\})', generated_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                else:
                    # Wenn immer noch kein JSON gefunden wird, versuchen wir, es aus dem ursprünglichen Text zu extrahieren
                    json_str = generated_text.strip()


            logger.debug(f"Versuche JSON zu parsen: {json_str[:100]}...")

            # Versuche, JSON zu parsen
            try:
                # Entferne ggf. führende/anhängende Zeichen, die keine JSON sind
                first_brace = json_str.find('{')
                last_brace = json_str.rfind('}')
                if first_brace != -1 and last_brace != -1:
                    json_str = json_str[first_brace:last_brace+1]

                extracted_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                logger.error(f"Fehler beim Parsen des JSON: {str(e)}")
                # Fallback: Versuche erneut mit Regex, falls das Parsen fehlschlägt
                json_match = re.search(r'(\{.*\})', generated_text, re.DOTALL)
                if json_match:
                    try:
                         json_str_fallback = json_match.group(1)
                         first_brace = json_str_fallback.find('{')
                         last_brace = json_str_fallback.rfind('}')
                         if first_brace != -1 and last_brace != -1:
                              json_str_fallback = json_str_fallback[first_brace:last_brace+1]
                         extracted_data = json.loads(json_str_fallback)
                         logger.info("JSON erfolgreich nach Fallback-Regex geparst.")
                    except json.JSONDecodeError:
                        logger.error("Auch Fallback-JSON-Parsing fehlgeschlagen.")
                        raise ValueError("Konnte kein gültiges JSON aus der Antwort extrahieren, auch nicht mit Fallback.")
                else:
                    raise ValueError("Konnte kein JSON-Objekt in der Antwort finden.")

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

        except requests.exceptions.RequestException as e:
             logger.error(f"Netzwerkfehler bei der Extraktion mit HuggingFace: {str(e)}")
             # Spezifischer Fehler für Netzwerkprobleme
             return {"error": f"Netzwerkfehler: {str(e)}", "status": "network_error"}
        except Exception as e:
            logger.error(f"Allgemeiner Fehler bei der Extraktion mit HuggingFace: {str(e)}")
            # Fallback auf leeres Ergebnis bei anderen Fehlern
            return {
                "name": "", "email": "", "phone": "", "address": "",
                "skills": [], "work_experience": [], "education": [],
                "languages": [], "summary": "", "projects": [],
                "error": str(e), "status": "extraction_error"
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

            response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=30) # Kurzer Timeout für Test
            response.raise_for_status()

            logger.info(f"Test-Antwort Status: {response.status_code}")

            return {
                "success": True,
                "message": "Verbindung zur HuggingFace API erfolgreich",
                "model": self.model,
                "timestamp": datetime.now().isoformat()
            }
        except requests.exceptions.RequestException as e:
             logger.error(f"Netzwerkfehler beim Testen der HuggingFace-Verbindung: {str(e)}")
             return {
                 "success": False,
                 "message": f"Netzwerkfehler bei der Verbindung zur HuggingFace API: {str(e)}",
                 "model": self.model, "timestamp": datetime.now().isoformat()
             }
        except Exception as e:
            logger.error(f"Fehler beim Testen der HuggingFace-Verbindung: {str(e)}")
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
            logger.error(f"Fehler bei der Extraktion aus Datei: {str(e)}")
            return {"error": str(e), "status": "failed"}

    def _extract_text_from_file(self, file_path: str) -> str:
        """Extrahiert Text aus einer Datei basierend auf dem Dateityp"""
        if file_path.lower().endswith('.pdf'):
            return self._extract_text_from_pdf(file_path)
        elif file_path.lower().endswith(('.docx', '.doc')):
            logger.warning("Word-Dokumente werden nicht vollständig unterstützt")
            # Hier könnte man optional eine DOCX-Extraktion hinzufügen (z.B. mit python-docx)
            return "Word-Dokument (Text nicht extrahiert)"
        else:
            logger.warning(f"Nicht unterstützter Dateityp: {file_path}")
            return ""

    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extrahiert Text aus einer PDF-Datei, behandelt auch verschlüsselte PDFs"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)

                # Prüfen, ob PDF verschlüsselt ist
                if reader.is_encrypted:
                    try:
                        # Versuche, mit leerem Passwort zu entschlüsseln
                        reader.decrypt('')
                        logger.info("PDF war verschlüsselt, konnte aber entschlüsselt werden.")
                    except Exception as decrypt_error:
                        logger.error(f"PDF ist verschlüsselt und konnte nicht entschlüsselt werden: {decrypt_error}")
                        return "" # Gib leeren String zurück bei unentschlüsselbaren PDFs

                # Extrahiere Text von jeder Seite
                for i, page in enumerate(reader.pages):
                    try:
                         page_text = page.extract_text()
                         if page_text:
                             text += page_text + "\n"
                    except Exception as page_error:
                         logger.warning(f"Fehler beim Extrahieren von Text aus Seite {i+1}: {page_error}")
                         text += "[FEHLER BEI SEITENEXTRAKTION]\n" # Füge Hinweis im Text ein


                # Bereinigung hinzufügen (optional, aber oft nützlich)
                text = re.sub(r'\s+', ' ', text).strip() # Normalisiere Leerzeichen
                text = text.replace('\x00', '') # Entferne Null-Bytes

                logger.info(f"Text aus PDF extrahiert, Länge: {len(text)} Zeichen")
                return text

        except FileNotFoundError:
             logger.error(f"PDF-Datei nicht gefunden: {file_path}")
             return ""
        except PyPDF2.errors.PdfReadError as pdf_error:
             logger.error(f"Fehler beim Lesen der PDF-Datei ({file_path}): {pdf_error}")
             return ""
        except Exception as e:
            logger.error(f"Allgemeiner Fehler beim Extrahieren von Text aus PDF ({file_path}): {str(e)}")
            return "" 