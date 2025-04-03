import ollama
from typing import Dict, Any
import json
import logging
import re

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class OllamaExtractor:
    def __init__(self, model: str = "mistral"):
        """
        Initialisiert den Ollama-Extraktor mit einem spezifischen Modell.
        
        Args:
            model (str): Name des zu verwendenden Ollama-Modells
        """
        self.model = model
        logger.info(f"Initialisiere OllamaExtractor mit Modell: {model}")

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
        
        return text

    def extract_cv(self, text: str) -> Dict[str, Any]:
        """
        Extrahiert Informationen aus einem Lebenslauf-Text mit Ollama.
        
        Args:
            text (str): Der zu analysierende Lebenslauf-Text
            
        Returns:
            Dict[str, Any]: Extrahierten Informationen im strukturierten Format
        """
        logger.debug(f"Starte Extraktion mit Text: {text[:100]}...")
        
        prompt = f"""[INST]Du bist ein KI-Assistent, der Lebensläufe analysiert. 
        Extrahiere die wichtigsten Informationen aus dem folgenden Lebenslauf und gib sie in einem strukturierten JSON-Format zurück.
        
        Wichtige Regeln:
        1. Gib NUR valides JSON zurück, KEINE Kommentare
        2. Verwende "null" für fehlende Informationen, aber füge KEINE Kommentare hinzu
        3. Formatiere die Antwort NICHT als Markdown-Code-Block
        
        Extrahiere diese Informationen:
        - Persönliche Informationen (Name, Kontakt, etc.)
        - Ausbildung
        - Berufserfahrung
        - Fähigkeiten und Kompetenzen
        - Sprachen
        - Zertifikate und Qualifikationen
        
        Lebenslauf:
        {text}[/INST]"""
        
        try:
            logger.info("Sende Anfrage an Ollama...")
            response = ollama.chat(model=self.model, messages=[
                {
                    'role': 'user',
                    'content': prompt
                }
            ])
            
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
                return extracted_data
            except json.JSONDecodeError as je:
                logger.error(f"JSON Parsing Fehler: {str(je)}")
                return {
                    "error": "JSON Parsing Fehler",
                    "raw_response": cleaned_text,
                    "status": "failed"
                }
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion: {str(e)}")
            return {
                "error": str(e),
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
        # TODO: Implementiere Datei-Extraktion
        pass

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