import os
from dotenv import load_dotenv
import logging

# Environment Variablen neu laden
load_dotenv()

# Logger für dieses Modul
logger = logging.getLogger(__name__)

# Datenbank-Konfiguration
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", 3306))
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", "hr_matrix")
DB_CHARSET = os.environ.get("DB_CHARSET", "utf8mb4")

# API-Konfiguration
HUGGINGFACE_API_KEY = os.environ.get("HUGGINGFACE_API_KEY", "")
USE_HUGGINGFACE = os.environ.get("USE_HUGGINGFACE", "true").lower() == "true"
USE_MOCK_EXTRACTION = os.environ.get("USE_MOCK_EXTRACTION", "true").lower() == "true" and not USE_HUGGINGFACE

# Explizit API-Key ins Log schreiben
logger.info(f"HuggingFace API-Key: {HUGGINGFACE_API_KEY[:4]}...{HUGGINGFACE_API_KEY[-4:]}")

# Logging-Konfiguration
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_FORMAT = os.environ.get("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Logging initialisieren
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT
)

# Import-Konfiguration für Dateien
MAX_FILE_SIZE = int(os.environ.get("MAX_FILE_SIZE", 10 * 1024 * 1024))  # 10 MB
ALLOWED_FILE_TYPES = ["pdf", "docx", "txt"]
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")

# Konfiguration prüfen und Loggen
logger.info("Datenbank-Konfiguration: %s@%s:%s/%s", DB_USER, DB_HOST, DB_PORT, DB_NAME)
logger.info("API-Konfiguration: HuggingFace=%s, Mock=%s", USE_HUGGINGFACE, USE_MOCK_EXTRACTION)

if USE_HUGGINGFACE and not HUGGINGFACE_API_KEY:
    logger.warning("USE_HUGGINGFACE ist aktiviert, aber kein API-Key gesetzt!")

# Stellen Sie sicher, dass der Upload-Ordner existiert
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    logger.info(f"Upload-Ordner erstellt: {UPLOAD_FOLDER}") 