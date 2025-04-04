import ollama
from typing import Dict, Any
import json
import logging
import re
import os
import sys
import time
import httpx
import PyPDF2

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Debug-Logging für detaillierte HTTP-Requests aktivieren, wenn nötig
if os.environ.get("DEBUG_OLLAMA", "").lower() in ("true", "1", "yes"):
    logging.getLogger("httpx").setLevel(logging.DEBUG)

class OllamaExtractor:
    def __init__(self, model: str = "mistral", max_retries: int = 3, timeout: int = 120):
        """
        Initialisiert den Ollama-Extraktor mit einem spezifischen Modell.
        
        Args:
            model (str): Name des zu verwendenden Ollama-Modells
            max_retries (int): Maximale Anzahl an Versuchen
            timeout (int): Timeout in Sekunden
        """
        self.model = model
        self.base_url = "http://localhost:11434/api"
        self.max_retries = max_retries
        self.timeout = timeout
        self.client = httpx.Client(timeout=timeout)
        logger.info(f"Initialisiere OllamaExtractor mit Modell: {model}")
        
        # Überprüfen, ob Ollama verfügbar ist
        try:
            # Liste der verfügbaren Modelle abrufen
            try:
                models_response = self.client.get(f"{self.base_url}/tags")
                models_data = models_response.json()
                logger.info(f"Verfügbare Ollama-Modelle: {models_data}")
                
                # Holen Sie die tatsächlichen Modellnamen ohne Version
                available_models = [m['name'] for m in models_data.get('models', [])]
                
                # Überprüfen, ob das angeforderte Modell existiert, und wählen Sie ein alternatives
                if self.model not in available_models:
                    logger.warning(f"Modell {self.model} ist nicht in der Liste der verfügbaren Modelle: {available_models}")
                    
                    # Suchen Sie nach alternativen Modellen mit ähnlichem Namen
                    for available_model in available_models:
                        if self.model in available_model:
                            self.model = available_model
                            logger.info(f"Verwende stattdessen Modell: {self.model}")
                            break
            except Exception as e:
                logger.error(f"Fehler beim Abrufen der Ollama-Modelle: {str(e)}")
                
        except Exception as e:
            logger.error(f"Unerwarteter Fehler bei der Initialisierung von Ollama: {str(e)}")

    def clean_json_response(self, text: str) -> str:
        """
        Bereinigt die JSON-Antwort von Kommentaren und Markdown.
        """
        # Entferne Markdown-Code-Blocks
        text = re.sub(r'```json\s*|\s*```', '', text)
        
        # Entferne Kommentare
        text = re.sub(r'//.*$', '', text, flags=re.MULTILINE)
        
        # Entferne leere Zeilen und führende/nachfolgende Leerzeichen
        text = '\n'.join(line.strip() for line in text.split('\n') if line.strip())
        
        # Versuche, ungültige JSON-Zeichenfolgen zu beheben
        text = text.replace("'", '"')  # Einfache Anführungszeichen durch doppelte ersetzen
        
        return text

    def remove_field_labels(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Entfernt Feldbezeichnungen aus extrahierten Daten.
        Beispiel: "email: max@example.com" wird zu "max@example.com"
        """
        def clean_value(value):
            if isinstance(value, str):
                # Entferne Feldbezeichnungen wie "Email:", "Telefon:", usw.
                patterns = [
                    r'^(email|e-mail|e mail)\s*:\s*', 
                    r'^(telefon|tel|phone|handy)\s*:\s*',
                    r'^(adresse|address|anschrift)\s*:\s*',
                    r'^(name|vorname)\s*:\s*',
                    r'^(nachname|familienname)\s*:\s*',
                    r'^(geburtsdatum|geburtstag|dob)\s*:\s*',
                    r'^(firma|company)\s*:\s*',
                    r'^(position|title|stelle)\s*:\s*',
                    r'^(zeitraum|period|datum)\s*:\s*',
                    r'^(ort|location|stadt)\s*:\s*',
                    r'^(beschreibung|description)\s*:\s*',
                    r'^(institution|schule|universität)\s*:\s*',
                    r'^(abschluss|degree|titel)\s*:\s*',
                    r'^(fachrichtung|field|studiengang)\s*:\s*'
                ]
                for pattern in patterns:
                    value = re.sub(pattern, '', value, flags=re.IGNORECASE)
                return value.strip()
            return value
            
        if not isinstance(data, dict):
            return data
            
        result = {}
        for key, value in data.items():
            if isinstance(value, dict):
                result[key] = self.remove_field_labels(value)
            elif isinstance(value, list):
                if all(isinstance(item, dict) for item in value):
                    result[key] = [self.remove_field_labels(item) for item in value]
                elif all(isinstance(item, str) for item in value):
                    result[key] = [clean_value(item) for item in value]
                else:
                    result[key] = value
            elif isinstance(value, str):
                result[key] = clean_value(value)
            else:
                result[key] = value
                
        return result

    def extract_cv(self, text: str) -> Dict[str, Any]:
        """
        Extrahiert Informationen aus einem Lebenslauf-Text mit Ollama.
        
        Args:
            text (str): Der zu analysierende Lebenslauf-Text
            
        Returns:
            Dict[str, Any]: Extrahierten Informationen im strukturierten Format
        """
        logger.debug(f"Starte Extraktion mit Text: {text[:100]}...")
        
        # Wenn der Text zu lang ist, kürzen wir ihn für bessere Ergebnisse
        max_text_length = 4000  # Modellabhängig, für Mistral sollten 4000 Zeichen ausreichen
        if len(text) > max_text_length:
            logger.info(f"Text ist zu lang ({len(text)} Zeichen), kürze auf {max_text_length} Zeichen")
            # Behalte den Anfang und das Ende des Textes
            text = text[:max_text_length//2] + "\n...\n" + text[-max_text_length//2:]
        
        prompt = f"""[INST]Du bist ein KI-Assistent, der Lebensläufe analysiert. 
        Extrahiere die wichtigsten Informationen aus dem folgenden Lebenslauf und gib sie in einem strukturierten JSON-Format zurück.
        
        Wichtige Regeln:
        1. Gib NUR valides JSON zurück, KEINE Kommentare
        2. Verwende "null" für fehlende Informationen, aber füge KEINE Kommentare hinzu
        3. Formatiere die Antwort NICHT als Markdown-Code-Block
        4. Die Schlüsselnamen müssen genau so sein wie im Beispielformat angegeben
        5. EXTRAHIERE NUR ECHTE DATEN, KEINE FELDNAMEN. Beispiel: Aus "Email: max@example.com" extrahiere nur "max@example.com"
        
        Extrahiere nur echte Daten aus dem Lebenslauf, KEINE Formularfelder oder Beschriftungen wie "Vorname", "Email", usw.
        
        Antworte im folgenden Format:
        {{
            "personal_data": {{
                "vorname": "string",
                "nachname": "string",
                "email": "string",
                "telefon": "string",
                "adresse": "string"
            }},
            "education": [
                {{
                    "institution": "string",
                    "abschluss": "string",
                    "fachrichtung": "string",
                    "zeitraum": "string",
                    "ort": "string"
                }}
            ],
            "experience": [
                {{
                    "firma": "string",
                    "position": "string",
                    "zeitraum": "string",
                    "ort": "string",
                    "beschreibung": "string"
                }}
            ],
            "skills": {{
                "technische_skills": ["string"],
                "soft_skills": ["string"],
                "sprachen": ["string"]
            }}
        }}
        
        Lebenslauf:
        {text}[/INST]"""
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Sende Anfrage an Ollama (Versuch {attempt + 1}/{self.max_retries})...")
                
                try:
                    # Ollama-Anfrage mit Timeout
                    start_time = time.time()
                    response = ollama.chat(model=self.model, messages=[
                        {
                            'role': 'user',
                            'content': prompt
                        }
                    ])
                    elapsed_time = time.time() - start_time
                    logger.info(f"Antwort von Ollama erhalten in {elapsed_time:.2f} Sekunden")
                    
                    logger.debug(f"Erhaltene Antwort: {response}")
                    
                    # Extrahiere die JSON-Antwort aus der Ollama-Antwort
                    response_text = response['message']['content']
                    logger.debug(f"Extrahierter Text: {response_text}")
                    
                    # Bereinige die Antwort
                    cleaned_text = self.clean_json_response(response_text)
                    logger.debug(f"Bereinigter Text: {cleaned_text}")
                    
                    # Versuche die Antwort als JSON zu parsen
                    try:
                        extracted_data = json.loads(cleaned_text)
                        logger.info("JSON erfolgreich geparst")
                        
                        # Bereinige die extrahierten Daten von Feldbezeichnungen
                        extracted_data = self.remove_field_labels(extracted_data)
                        logger.info("Feldbezeichnungen wurden entfernt")
                        
                        return extracted_data
                    except json.JSONDecodeError as je:
                        logger.error(f"JSON Parsing Fehler: {str(je)}")
                        # Erweiterte Fehlersuche für JSON-Fehler
                        logger.error(f"Problematische Stelle im JSON: {cleaned_text[max(0, je.pos-20):min(len(cleaned_text), je.pos+20)]}")
                        
                        # Bei JSON-Fehler, versuche es erneut, außer beim letzten Versuch
                        if attempt < self.max_retries - 1:
                            logger.info(f"Versuche es erneut in 2 Sekunden...")
                            time.sleep(2)
                            continue
                        
                        return {
                            "error": "JSON Parsing Fehler",
                            "raw_response": cleaned_text,
                            "status": "failed"
                        }
                    
                except Exception as e:
                    logger.error(f"Ollama API Fehler: {str(e)}")
                    
                    # Bei API-Fehler, versuche es erneut, außer beim letzten Versuch
                    if attempt < self.max_retries - 1:
                        logger.info(f"Versuche es erneut in 3 Sekunden...")
                        time.sleep(3)
                        continue
                    
                    return {
                        "error": f"Ollama API Fehler: {str(e)}",
                        "status": "failed"
                    }
                
            except Exception as e:
                logger.error(f"Fehler bei der Extraktion: {str(e)}")
                
                # Bei allgemeinem Fehler, versuche es erneut, außer beim letzten Versuch
                if attempt < self.max_retries - 1:
                    logger.info(f"Versuche es erneut in 3 Sekunden...")
                    time.sleep(3)
                    continue
                
                return {
                    "error": str(e),
                    "status": "failed"
                }
        
        # Wenn alle Versuche fehlschlagen
        return {
            "error": "Maximale Anzahl an Versuchen erreicht",
            "status": "failed"
        }

    def extract_from_file(self, file_path: str) -> Dict[str, Any]:
        """
        Extrahiert Informationen aus einer Datei (PDF oder DOCX).
        
        Args:
            file_path (str): Pfad zur Datei
            
        Returns:
            Dict[str, Any]: Extrahierten Informationen
        """
        file_ext = os.path.splitext(file_path)[1].lower()
        
        extracted_text = ""
        
        try:
            # PDF-Extraktion
            if file_ext == '.pdf':
                extracted_text = self._extract_text_from_pdf(file_path)
            
            # DOCX-Extraktion
            elif file_ext == '.docx':
                extracted_text = self._extract_text_from_file(file_path)
            
            # DOC-Extraktion (erfordert externe Tools)
            elif file_ext == '.doc':
                return {
                    "error": "DOC-Format wird derzeit nicht unterstützt. Bitte in PDF oder DOCX konvertieren.",
                    "status": "failed"
                }
            
            else:
                return {
                    "error": f"Nicht unterstütztes Dateiformat: {file_ext}",
                    "status": "failed"
                }
            
            # Extrahiere Informationen aus dem Text
            if extracted_text:
                return self.extract_cv(extracted_text)
            else:
                return {
                    "error": "Kein Text aus der Datei extrahiert",
                    "status": "failed"
                }
            
        except Exception as e:
            logger.error(f"Fehler bei der Datei-Extraktion: {str(e)}")
            return {
                "error": str(e),
                "status": "failed"
            }

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
                
                # Verwende nur die ersten 2000 Zeichen für bessere Leistung
                text = text[:2000]
                logger.debug(f"Starte Extraktion mit Text: {text[:100]}...")
                return text
        except Exception as e:
            logger.error(f"Fehler beim Extrahieren von Text aus PDF: {str(e)}")
            return ""

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

def main():
    # Beispiel für die Verwendung
    extractor = OllamaExtractor()
    
    # Beispiel-Text
    sample_cv = """
    Max Mustermann
    Musterstraße 123
    12345 Berlin
    
    Ausbildung:
    2015-2019: Bachelor in Informatik, TU Berlin
    
    Berufserfahrung:
    2019-2021: Softwareentwickler bei Tech GmbH
    2021-heute: Senior Developer bei Innovation AG
    
    Fähigkeiten:
    - Python, JavaScript, Java
    - Docker, Kubernetes
    - Agile Methoden
    """
    
    logger.info("Starte Test-Extraktion...")
    result = extractor.extract_cv(sample_cv)
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main() 