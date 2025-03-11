# Verwende ein offizielles Python-Image als Basis
FROM python:3.9-slim

# Arbeitsverzeichnis im Container festlegen
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Anwendungscode kopieren
COPY . .

# Port freigeben, den Flask verwendet
EXPOSE 5000

# Flask-Anwendung starten
CMD ["python", "app.py"]