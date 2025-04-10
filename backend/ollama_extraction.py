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
        Extrahiert Informationen aus einem CV-Text.
        
        Args:
            text (str): Der CV-Text
            
        Returns:
            Dict[str, Any]: Extrahierten Informationen
        """
        try:
            # Bereite den Prompt vor
            prompt = f"""Analysiere den folgenden Lebenslauf und extrahiere die wichtigsten Informationen im JSON-Format.
            Verwende KEINE Feldbezeichnungen wie "Name:", "Email:" etc. in den Werten.
            Formatiere die Antwort als JSON-Objekt mit folgenden Feldern:
            - name: Vollständiger Name
            - email: E-Mail-Adresse
            - phone: Telefonnummer
            - address: Adresse
            - skills: Liste der Fähigkeiten
            - work_experience: Liste der Berufserfahrungen
            - education: Liste der Ausbildungen
            - languages: Liste der Sprachen
            - projects: Liste der Projekte

            Lebenslauf:
            {text}

            Antworte NUR mit dem JSON-Objekt, ohne weitere Erklärungen."""

            # Sende Anfrage an Ollama
            response = self._make_request(prompt)
            
            if response:
                # Bereinige die Antwort
                cleaned_response = self.clean_json_response(response)
                
                # Extrahiere JSON aus der Antwort
                json_match = re.search(r'\{.*\}', cleaned_response, re.DOTALL)
                
                if json_match:
                    try:
                        extracted_data = json.loads(json_match.group(1))
                    except json.JSONDecodeError:
                        raise ValueError("Konnte kein gültiges JSON aus der Antwort extrahieren")
                else:
                    raise ValueError("Konnte kein JSON-Objekt in der Antwort finden")
                
                # Entferne Feldbezeichnungen
                extracted_data = self.remove_field_labels(extracted_data)
                
                logger.info(f"Erfolgreich CV-Daten extrahiert für: {extracted_data.get('name', 'Unbekannt')}")
                return extracted_data
            
        except Exception as e:
            logger.error(f"Fehler bei der Ollama-Extraktion: {str(e)}")
            raise

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

    def _make_request(self, prompt: str) -> str:
        """
        Sendet eine Anfrage an den Ollama-Server.
        
        Args:
            prompt (str): Der Prompt für das Modell
            
        Returns:
            str: Die Antwort des Modells
        """
        try:
            logger.info(f"Sende Anfrage an Ollama mit Modell: {self.model}")
            
            # Sende Anfrage an Ollama
            response = self.client.post(
                f"{self.base_url}/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.1,
                        "num_predict": 4096
                    }
                }
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Extrahiere den generierten Text
            generated_text = result.get("response", "")
            logger.debug(f"Generierter Text: {generated_text[:100]}...")
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Fehler bei der Ollama-Anfrage: {str(e)}")
            raise

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