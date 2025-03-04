import mysql.connector
from faker import Faker
import random
import os

# Verbindung zur MySQL-Datenbank herstellen
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "hello1234",
    "database": "TalentBridgeDB"
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    print("Verbindung zur Datenbank erfolgreich!")
except mysql.connector.Error as err:
    print(f"Fehler bei der Verbindung zur Datenbank: {err}")
    exit()

fake = Faker()

num_departments = 5
num_employees = 20
num_projects = 10
num_tasks = 30
num_certificates = 15
num_pdfs = 10

print("Erstelle Abteilungen...")
departments = []
for _ in range(num_departments):
    name = fake.company()
    cursor.execute("INSERT INTO abteilungen (name) VALUES (%s)", (name,))
    departments.append(cursor.lastrowid)

print("Erstelle Mitarbeiter...")
employees = []
for _ in range(num_employees):
    vorname = fake.first_name()
    nachname = fake.last_name()
    email = fake.unique.email()
    faehigkeiten = ", ".join(fake.words(nb=3))
    abteilungs_id = random.choice(departments) if departments else None
    cursor.execute(
        "INSERT INTO mitarbeiter (vorname, nachname, email, faehigkeiten, abteilungs_id) VALUES (%s, %s, %s, %s, %s)",
        (vorname, nachname, email, faehigkeiten, abteilungs_id)
    )
    employees.append(cursor.lastrowid)

print("Erstelle Projekte...")
projects = []
for _ in range(num_projects):
    name = fake.catch_phrase()
    beschreibung = fake.text()
    cursor.execute("INSERT INTO projekte (name, beschreibung) VALUES (%s, %s)", (name, beschreibung))
    projects.append(cursor.lastrowid)

print("Erstelle Aufgaben...")
for _ in range(num_tasks):
    beschreibung = fake.sentence()
    projekt_id = random.choice(projects) if projects else None
    mitarbeiter_id = random.choice(employees) if employees else None
    status = random.choice(["offen", "in Bearbeitung", "abgeschlossen"])
    cursor.execute(
        "INSERT INTO aufgaben (beschreibung, projekt_id, mitarbeiter_id, status) VALUES (%s, %s, %s, %s)",
        (beschreibung, projekt_id, mitarbeiter_id, status)
    )

print("Erstelle Zertifikate...")
for _ in range(num_certificates):
    name = fake.word()
    beschreibung = fake.text()
    mitarbeiter_id = random.choice(employees) if employees else None
    cursor.execute(
        "INSERT INTO zertifikate (name, beschreibung, mitarbeiter_id) VALUES (%s, %s, %s)",
        (name, beschreibung, mitarbeiter_id)
    )

print("Erstelle PDF-Daten...")
for _ in range(num_pdfs):
    dateiname = fake.file_name(extension="pdf")  # FIXED: `category="pdf"` ersetzt
    speicherort = os.path.join("C:/FakePDFs", dateiname)
    mitarbeiter_id = random.choice(employees) if employees else None
    inhalt = fake.binary(length=1024)  # Fake-PDF-Inhalt
    cursor.execute(
        "INSERT INTO pdf_data (dateiname, speicherort, mitarbeiter_id, inhalt) VALUES (%s, %s, %s, %s)",
        (dateiname, speicherort, mitarbeiter_id, inhalt)
    )

conn.commit()
cursor.close()
conn.close()
print("Testdaten erfolgreich generiert!")
