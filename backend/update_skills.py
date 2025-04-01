import mysql.connector
from mysql.connector import Error

# Datenbankverbindung konfigurieren
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'hello1234',
    'database': 'talentbridgedb',
    'port': 3306
}

def update_skills():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            cursor = connection.cursor()
            
            # SQL-Updates für die Fähigkeiten
            updates = [
                # IT/Software-Entwicklung
                ("Python, Django, SQL, Git", 1),
                ("JavaScript, React, Node.js, TypeScript", 2),
                ("Java, Spring Boot, MySQL, Docker", 3),
                ("C#, .NET Core, Azure, SQL Server", 4),
                ("PHP, Laravel, Vue.js, PostgreSQL", 5),
                
                # Data Science & KI
                ("Python, TensorFlow, PyTorch, Data Science", 6),
                ("Machine Learning, scikit-learn, Pandas, NumPy", 7),
                
                # DevOps & Cloud
                ("AWS, DevOps, Kubernetes, Docker", 8),
                ("Azure Cloud, CI/CD, Jenkins, Terraform", 9),
                
                # Design & Kreativ
                ("UI/UX Design, Figma, Adobe XD, Sketch", 10),
                ("Grafikdesign, Adobe Creative Suite, Illustration", 11),
                ("Motion Design, After Effects, Cinema 4D", 12),
                
                # Marketing & Kommunikation
                ("Content Marketing, SEO, Social Media Management", 13),
                ("Digital Marketing, Google Analytics, AdWords", 14),
                ("PR, Kommunikation, Event Management", 15),
                
                # Personal & HR
                ("Personalmanagement, Recruiting, Arbeitsrecht", 16),
                ("Personalentwicklung, Coaching, Training", 17),
                
                # Finanzen & Controlling
                ("Buchhaltung, SAP FI, DATEV", 18),
                ("Controlling, Business Intelligence, Excel", 19),
                
                # Vertrieb & Sales
                ("B2B Sales, CRM, Salesforce", 20),
                ("Account Management, Verhandlungsführung", 21),
                
                # Projektmanagement
                ("Scrum, JIRA, Agile Methoden", 22),
                ("Prince2, PMI, Projektplanung", 23),
                
                # Produktion & Logistik
                ("Supply Chain Management, SAP MM, Logistik", 24),
                ("Lean Management, Six Sigma, Prozessoptimierung", 25),
                
                # Qualitätsmanagement
                ("ISO 9001, Audit Management, FMEA", 26),
                ("Qualitätssicherung, Testmanagement", 27),
                
                # Recht & Compliance
                ("Vertragsrecht, Datenschutz, DSGVO", 28),
                ("Compliance Management, Risikomanagement", 29),
                
                # Forschung & Entwicklung
                ("Produktentwicklung, R&D, Innovationsmanagement", 30)
            ]
            
            update_query = "UPDATE mitarbeiter SET faehigkeiten = %s WHERE mitarbeiter_id = %s"
            cursor.executemany(update_query, updates)
            connection.commit()
            
            print(f"Erfolgreich aktualisiert: {cursor.rowcount} Datensätze")
            
    except Error as e:
        print(f"Fehler beim Aktualisieren der Fähigkeiten: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("Datenbankverbindung geschlossen")

if __name__ == "__main__":
    update_skills() 