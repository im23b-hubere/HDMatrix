from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import mysql.connector
import os
from datetime import datetime, timedelta
import random

def create_employee_cv(employee_data, output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#1a365d')
    )
    
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#2c5282')
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=8
    )

    # Header
    story.append(Paragraph(f"{employee_data['vorname']} {employee_data['nachname']}", title_style))
    
    # Kontaktinformationen
    story.append(Paragraph("Kontaktinformationen", section_style))
    story.append(Paragraph(f"Email: {employee_data['email']}", normal_style))
    story.append(Paragraph(f"Abteilung: {employee_data['abteilung'] or 'Nicht zugewiesen'}", normal_style))
    story.append(Spacer(1, 12))
    
    # Zusammenfassung
    story.append(Paragraph("Profil", section_style))
    profile_text = f"Erfahrener Mitarbeiter bei TalentBridge mit Schwerpunkt auf {', '.join(employee_data['faehigkeiten'].split(', '))}. "
    profile_text += "Fokussiert auf innovative Lösungen und kontinuierliche Weiterentwicklung."
    story.append(Paragraph(profile_text, normal_style))
    
    # Fähigkeiten
    story.append(Paragraph("Fähigkeiten & Kompetenzen", section_style))
    skills = employee_data['faehigkeiten'].split(", ")
    for skill in skills:
        story.append(Paragraph(f"• {skill.title()} - {random.choice(['Fortgeschritten', 'Experte', 'Grundkenntnisse'])}", normal_style))
    story.append(Spacer(1, 12))
    
    # Projekte
    if employee_data['projects']:
        story.append(Paragraph("Projektbeteiligungen", section_style))
        for project in employee_data['projects']:
            story.append(Paragraph(f"• {project['name']}", styles["Heading3"]))
            story.append(Paragraph(f"{project['beschreibung']}", normal_style))
            # Zufälliger Projektzeitraum
            start_date = datetime.now() - timedelta(days=random.randint(30, 365))
            end_date = start_date + timedelta(days=random.randint(30, 180))
            story.append(Paragraph(f"Zeitraum: {start_date.strftime('%B %Y')} - {end_date.strftime('%B %Y')}", normal_style))
        story.append(Spacer(1, 12))
    
    # Zertifikate
    if employee_data['certificates']:
        story.append(Paragraph("Zertifizierungen", section_style))
        for cert in employee_data['certificates']:
            story.append(Paragraph(f"• {cert['name'].title()}", styles["Heading3"]))
            story.append(Paragraph(f"{cert['beschreibung']}", normal_style))
            # Zufälliges Zertifizierungsdatum
            cert_date = datetime.now() - timedelta(days=random.randint(0, 730))
            story.append(Paragraph(f"Erworben am: {cert_date.strftime('%d.%m.%Y')}", normal_style))
    
    doc.build(story)

def create_project_documentation(project_data, output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#1a365d')
    )
    
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#2c5282')
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=8
    )

    # Header
    story.append(Paragraph(f"Projektdokumentation: {project_data['name']}", title_style))
    
    # Projektbeschreibung
    story.append(Paragraph("Projektübersicht", section_style))
    story.append(Paragraph(project_data['beschreibung'], normal_style))
    story.append(Spacer(1, 12))
    
    # Projektdetails
    if project_data['tasks']:
        story.append(Paragraph("Aufgaben und Status", section_style))
        for task in project_data['tasks']:
            story.append(Paragraph(f"• {task['beschreibung']}", normal_style))
            story.append(Paragraph(f"  Status: {task['status']}", normal_style))
            if task['mitarbeiter_name']:
                story.append(Paragraph(f"  Verantwortlich: {task['mitarbeiter_name']}", normal_style))
    
    doc.build(story)

# Datenbankverbindung
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "hello1234",
    "database": "TalentBridgeDB"
}

def get_data():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    # Hole alle Mitarbeiter
    cursor.execute("""
        SELECT m.*, a.name as abteilung 
        FROM mitarbeiter m 
        LEFT JOIN abteilungen a ON m.abteilungs_id = a.abteilungs_id
    """)
    employees = cursor.fetchall()
    
    # Hole alle Projekte
    cursor.execute("SELECT * FROM projekte")
    projects = cursor.fetchall()
    
    # Füge Projekte und Zertifikate zu Mitarbeitern hinzu
    for emp in employees:
        # Projekte
        cursor.execute("""
            SELECT p.* 
            FROM projekte p 
            JOIN aufgaben a ON p.projekt_id = a.projekt_id 
            WHERE a.mitarbeiter_id = %s
        """, (emp['mitarbeiter_id'],))
        emp['projects'] = cursor.fetchall()
        
        # Zertifikate
        cursor.execute("""
            SELECT * 
            FROM zertifikate 
            WHERE mitarbeiter_id = %s
        """, (emp['mitarbeiter_id'],))
        emp['certificates'] = cursor.fetchall()
    
    # Füge Aufgaben und Mitarbeiter zu Projekten hinzu
    for proj in projects:
        cursor.execute("""
            SELECT a.*, CONCAT(m.vorname, ' ', m.nachname) as mitarbeiter_name
            FROM aufgaben a
            LEFT JOIN mitarbeiter m ON a.mitarbeiter_id = m.mitarbeiter_id
            WHERE a.projekt_id = %s
        """, (proj['projekt_id'],))
        proj['tasks'] = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return employees, projects

def main():
    # Verzeichnisse erstellen
    pdf_dir = os.path.join("frontend", "public", "pdfs")
    cv_dir = os.path.join(pdf_dir, "cvs")
    project_dir = os.path.join(pdf_dir, "projects")
    
    os.makedirs(cv_dir, exist_ok=True)
    os.makedirs(project_dir, exist_ok=True)
    
    print("Hole Daten aus der Datenbank...")
    employees, projects = get_data()
    
    # Generiere CVs
    print("Generiere Mitarbeiter-CVs...")
    for emp in employees:
        pdf_path = os.path.join(cv_dir, f"{emp['vorname']}_{emp['nachname']}_CV.pdf")
        create_employee_cv(emp, pdf_path)
        print(f"CV erstellt für {emp['vorname']} {emp['nachname']}")
    
    # Generiere Projektdokumentationen
    print("Generiere Projektdokumentationen...")
    for proj in projects:
        pdf_path = os.path.join(project_dir, f"Projekt_{proj['name'].replace(' ', '_')}.pdf")
        create_project_documentation(proj, pdf_path)
        print(f"Projektdokumentation erstellt für {proj['name']}")
    
    print("PDF-Generierung abgeschlossen!")

if __name__ == "__main__":
    main() 