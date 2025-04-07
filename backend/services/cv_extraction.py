import nltk
import re
import json
import logging
from typing import Dict, List, Any
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords

logger = logging.getLogger(__name__)

class CVExtractor:
    def __init__(self):
        # Download benötigte NLTK-Daten, falls noch nicht vorhanden
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('punkt')
            nltk.download('stopwords')
            
        try:
            nltk.data.find('taggers/averaged_perceptron_tagger')
        except LookupError:
            nltk.download('averaged_perceptron_tagger')
            
    def clean_text(self, text: str) -> str:
        """Text bereinigen und vorbereiten"""
        # Überflüssige Leerzeichen entfernen
        text = re.sub(r'\s+', ' ', text)
        # Zeilenumbrüche normalisieren
        text = re.sub(r'\n+', '\n', text)
        return text.strip()
        
    def extract_personal_data(self, text: str) -> Dict[str, str]:
        """Persönliche Daten aus dem Text extrahieren"""
        personal_data = {
            "vorname": "",
            "nachname": "",
            "email": "",
            "telefon": "",
            "adresse": ""
        }
        
        try:
            # Verbesserte E-Mail-Extraktion (keine Feldbezeichnungen mehr anfügen)
            email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
            if email_match:
                email = email_match.group(0)
                # Prüfen ob die E-Mail gültig aussieht und keine Feldbezeichnungen enthält
                if '@' in email and '.' in email and not any(field in email.lower() for field in ['email', 'e-mail', 'kontakt']):
                    personal_data['email'] = email
            
            # Verbesserte Telefonnummer-Extraktion (keine Jahreszahlen mehr als Telefonnummern)
            phone_patterns = [
                # Schweizer/Europäische Nummern
                r'\+\d{2}\s?(?:\d{2}\s?){4,5}',  # +41 79 123 45 67
                r'0\d{2}\s?\d{3}\s?\d{2}\s?\d{2}',  # 079 123 45 67
                # Allgemeine Telefonnummern mit verschiedenen Formaten
                r'(?<!\d)(?:\+\d{1,4}[\s-]?)?(?:\(?\d{1,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}(?!\d)'
            ]
            
            for pattern in phone_patterns:
                phone_match = re.search(pattern, text)
                if phone_match:
                    phone = phone_match.group(0).strip()
                    # Keine Jahreszahlen (wie 2019) als Telefonnummern erkennen
                    if not re.match(r'^(19|20)\d{2}(\s+|$)', phone):
                        personal_data['telefon'] = phone
                        break
            
            # Verbesserte Namensextraktion - sucht typische Namensformate am Anfang des Dokuments
            # Hierbei werden häufige Feldbezeichnungen explizit ausgeschlossen
            excluded_terms = ['kontakt', 'schulbildung', 'ausbildung', 'email', 'e-mail', 'telefon', 'adresse', 'fähigkeiten']
            
            # Suche nach Namen in den ersten Zeilen
            first_lines = text.split('\n')[:5]  # Nur die ersten 5 Zeilen betrachten
            
            for line in first_lines:
                line = line.strip()
                # Überspringe leere Zeilen oder Zeilen mit ausgeschlossenen Begriffen
                if not line or any(term in line.lower() for term in excluded_terms):
                    continue
                    
                # Suche nach Vor- und Nachnamen (2-3 Wörter, kein Sonderzeichen außer -)
                name_match = re.match(r'^([A-ZÄÖÜa-zäöüß][A-ZÄÖÜa-zäöüß-]+)(\s+[A-ZÄÖÜa-zäöüß][A-ZÄÖÜa-zäöüß-]+){1,2}$', line)
                
                if name_match:
                    name_parts = line.split()
                    if len(name_parts) >= 2:
                        personal_data['vorname'] = name_parts[0]
                        personal_data['nachname'] = ' '.join(name_parts[1:])
                    break
                    
            # Verbesserte Adressextraktion
            address_patterns = [
                # Schweizer PLZ mit Ort
                r'\b[1-9]\d{3}\s+[A-ZÄÖÜa-zäöüß\s-]+\b',
                # Deutsche PLZ mit Ort
                r'\b[0-9]{5}\s+[A-ZÄÖÜa-zäöüß\s-]+\b',
                # Straße mit Hausnummer
                r'\b[A-ZÄÖÜa-zäöüß][A-ZÄÖÜa-zäöüß\s-]+(?:straße|strasse|weg|allee|platz|gasse)\s+\d+\w*\b'
            ]
            
            for pattern in address_patterns:
                address_match = re.search(pattern, text, re.IGNORECASE)
                if address_match:
                    addr = address_match.group(0).strip()
                    # Ausschluss von Feldbezeichnungen
                    if not any(term in addr.lower() for term in excluded_terms):
                        personal_data['adresse'] = addr
                        break
                    
            return personal_data
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion persönlicher Daten: {str(e)}")
            return personal_data
        
    def extract_education(self, text: str) -> List[Dict[str, str]]:
        education = []
        
        try:
            # Abschnitte identifizieren, die auf Bildung hindeuten
            education_keywords = [
                'ausbildung', 'studium', 'bildung', 'schulbildung', 'hochschule', 
                'universität', 'bachelor', 'master', 'diplom', 'promotion'
            ]
            
            # Textblöcke suchen, die Bildungsinformationen enthalten könnten
            sentences = sent_tokenize(text.lower())
            edu_start_idx = -1
            
            for i, sentence in enumerate(sentences):
                if any(keyword in sentence for keyword in education_keywords) and edu_start_idx == -1:
                    edu_start_idx = i
            
            if edu_start_idx >= 0:
                # Nächste 10 Sätze betrachten oder bis zum Ende
                edu_end_idx = min(edu_start_idx + 10, len(sentences))
                edu_text = ' '.join(sentences[edu_start_idx:edu_end_idx])
                
                # Abschlüsse finden
                degrees = ['bachelor', 'master', 'diplom', 'doktor', 'abitur', 'promotion', 'phd']
                degree_matches = [degree for degree in degrees if degree in edu_text]
                
                # Zeiträume finden
                year_pattern = r'\b(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}|\b(19|20)\d{2}\s*[-–]\s*heute\b'
                year_matches = re.findall(year_pattern, edu_text)
                
                # Hochschulen/Universitäten finden
                university_keywords = ['universität', 'hochschule', 'tu ', 'fh ', 'school', 'college']
                university_matches = []
                
                for keyword in university_keywords:
                    if keyword in edu_text:
                        # Versuche den vollen Namen der Institution zu extrahieren
                        pattern = rf"{keyword}\s[A-Za-zÄÖÜäöüß\s]+"
                        match = re.search(pattern, edu_text, re.IGNORECASE)
                        if match:
                            university_matches.append(match.group(0))
                
                # Bildungsdaten zusammenstellen
                if degree_matches or year_matches or university_matches:
                    education_entry = {}
                    
                    if degree_matches:
                        education_entry['abschluss'] = degree_matches[0].capitalize()
                    
                    if year_matches and any(year_matches[0]):
                        # Formatiere den Zeitraum
                        if isinstance(year_matches[0], tuple):
                            if len(year_matches[0]) >= 2 and year_matches[0][0] and year_matches[0][1]:
                                education_entry['zeitraum'] = f"{year_matches[0][0]}-{year_matches[0][1]}"
                            elif year_matches[0][0]:
                                education_entry['zeitraum'] = year_matches[0][0]
                        else:
                            education_entry['zeitraum'] = year_matches[0]
                    
                    if university_matches:
                        education_entry['institution'] = university_matches[0]
                    
                    if education_entry:
                        education.append(education_entry)
                
            return education
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion von Bildungsdaten: {str(e)}")
            return education
        
    def extract_experience(self, text: str) -> List[Dict[str, str]]:
        experience = []
        
        try:
            # Abschnitte identifizieren, die auf Berufserfahrung hindeuten
            experience_keywords = [
                'berufserfahrung', 'arbeitserfahrung', 'berufspraxis', 
                'berufliche laufbahn', 'tätigkeiten', 'work experience'
            ]
            
            # Finde den Abschnitt im Text, der Berufserfahrung enthält
            exp_section = None
            for keyword in experience_keywords:
                pattern = rf'(?i){keyword}.*?(?=(ausbildung|bildung|skills|kenntnisse|sprachen|hobbies|referenzen|$))'
                match = re.search(pattern, text, re.DOTALL)
                if match:
                    exp_section = match.group(0)
                    break
            
            if not exp_section:
                return experience
            
            # Zeiträume identifizieren für potenzielle Einträge
            time_pattern = r'\b(0?[1-9]|1[0-2])/\d{4}\s*[-–]\s*(0?[1-9]|1[0-2])/\d{4}|\b(0?[1-9]|1[0-2])/\d{4}\s*[-–]\s*heute|\b(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}|\b(19|20)\d{2}\s*[-–]\s*heute\b'
            time_matches = re.finditer(time_pattern, exp_section)
            
            for time_match in time_matches:
                # Für jeden Zeitraum, extrahiere die umliegenden Informationen
                position_start = max(0, time_match.start() - 100)
                position_end = min(len(exp_section), time_match.end() + 200)
                job_text = exp_section[position_start:position_end]
                
                # Position/Job-Titel finden
                position_pattern = r'(?i)(entwickler|engineer|manager|berater|consultant|analyst|spezialist|leiter|direktor|chef|führungskraft|mitarbeiter|assistent)[a-zäöüß\s]*'
                position_match = re.search(position_pattern, job_text)
                
                # Firma finden
                company_pattern = r'(?i)(GmbH|AG|KG|OHG|Co\.|Inc\.|LLC|Ltd\.)[^.]*'
                company_match = re.search(company_pattern, job_text)
                
                # Erfahrungseintrag erstellen
                exp_entry = {
                    'zeitraum': time_match.group(0),
                    'position': position_match.group(0).strip().capitalize() if position_match else '',
                    'firma': company_match.group(0).strip() if company_match else ''
                }
                
                # Beschreibungstext extrahieren (nach dem Zeitraum)
                description_text = job_text[time_match.end():].strip()
                if description_text:
                    # Begrenzen auf maximal die ersten 3 Sätze oder 200 Zeichen
                    sentences = sent_tokenize(description_text)
                    desc = ' '.join(sentences[:min(3, len(sentences))])
                    exp_entry['beschreibung'] = desc[:200] + '...' if len(desc) > 200 else desc
                
                experience.append(exp_entry)
                
            return experience
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion von Berufserfahrung: {str(e)}")
            return experience
        
    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        skills = {
            "technische_skills": [],
            "sprachen": [],
            "soft_skills": []
        }
        
        try:
            # Listen mit gängigen Fähigkeiten
            tech_skills_keywords = [
                'python', 'java', 'javascript', 'typescript', 'html', 'css', 'react', 'angular', 'vue', 
                'node.js', 'express', 'django', 'flask', 'spring', 'hibernate', 'sql', 'nosql', 'mongodb', 
                'postgresql', 'mysql', 'oracle', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 
                'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'agile', 'scrum', 'kanban', 
                'devops', 'ci/cd', 'test-driven development', 'unit testing', 'integration testing', 
                'selenium', 'rest api', 'graphql', 'microservices', 'c#', 'c++', 'php', 'ruby', 'go', 
                'scala', 'kotlin', 'swift', 'objective-c', 'matlab', 'r', 'hadoop', 'spark', 'tensorflow', 
                'pytorch', 'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science', 
                'data analytics', 'data visualization', 'power bi', 'tableau', 'd3.js', 'excel', 'vba', 
                'sap', 'salesforce', 'dynamics 365', 'sharepoint', 'linux', 'unix', 'windows', 'macos', 
                'android', 'ios', 'redux', 'bootstrap', 'sass', 'less', 'webpack', 'babel', 'npm', 'yarn', 
                'gradle', 'maven', 'ant', 'cypress', 'jest', 'mocha', 'jasmine', 'junit', 'testng', 'postman', 
                'swagger', 'openapi', 'soap', 'jquery', 'figma', 'adobe xd', 'photoshop', 'illustrator'
            ]
            
            language_skills_keywords = [
                'deutsch', 'englisch', 'französisch', 'spanisch', 'italienisch', 'russisch', 'chinesisch', 
                'japanisch', 'arabisch', 'portugiesisch', 'niederländisch', 'schwedisch', 'norwegisch', 
                'finnisch', 'dänisch', 'polnisch', 'tschechisch', 'ungarisch', 'türkisch', 'griechisch', 
                'koreanisch', 'hindi', 'german', 'english', 'french', 'spanish', 'italian', 'russian', 
                'chinese', 'japanese', 'arabic', 'portuguese', 'dutch', 'swedish', 'norwegian', 'finnish', 
                'danish', 'polish', 'czech', 'hungarian', 'turkish', 'greek', 'korean', 'hindi'
            ]
            
            soft_skills_keywords = [
                'kommunikation', 'teamarbeit', 'problemlösung', 'zeitmanagement', 'führung', 'kreativität', 
                'analytisches denken', 'kritisches denken', 'flexibilität', 'anpassungsfähigkeit', 'resilienz', 
                'selbstmotivation', 'selbstständigkeit', 'zuverlässigkeit', 'verantwortungsbewusstsein', 
                'interkulturelle kompetenz', 'kundenorientierung', 'verhandlungsgeschick', 'präsentation', 
                'moderation', 'konfliktmanagement', 'empathie', 'communication', 'teamwork', 'problem solving', 
                'time management', 'leadership', 'creativity', 'analytical thinking', 'critical thinking', 
                'flexibility', 'adaptability', 'resilience', 'self-motivation', 'independence', 'reliability', 
                'responsibility', 'intercultural competence', 'customer orientation', 'negotiation', 
                'presentation', 'facilitation', 'conflict management', 'empathy'
            ]
            
            # Extrahiere Skills-Abschnitt
            skills_section = None
            skills_keywords = ['skills', 'kenntnisse', 'fähigkeiten', 'kompetenzen', 'qualifikationen']
            
            for keyword in skills_keywords:
                pattern = rf'(?i){keyword}.*?(?=(berufserfahrung|ausbildung|bildung|sprachen|hobbies|referenzen|$))'
                match = re.search(pattern, text, re.DOTALL)
                if match:
                    skills_section = match.group(0)
                    break
            
            # Wenn kein spezieller Skills-Bereich gefunden wurde, verwende den gesamten Text
            if not skills_section:
                skills_section = text
            
            # Tokenisiere den Text
            words = word_tokenize(skills_section.lower())
            
            # Extrahiere Fähigkeiten basierend auf den Schlüsselwörtern
            for word in words:
                if word in tech_skills_keywords and word not in skills['technische_skills']:
                    skills['technische_skills'].append(word)
                elif word in language_skills_keywords and word not in skills['sprachen']:
                    skills['sprachen'].append(word)
                elif word in soft_skills_keywords and word not in skills['soft_skills']:
                    skills['soft_skills'].append(word)
            
            # Suche auch nach Mehrwort-Fähigkeiten
            for skill in tech_skills_keywords:
                if ' ' in skill and skill.lower() in skills_section.lower() and skill not in skills['technische_skills']:
                    skills['technische_skills'].append(skill)
            
            for skill in soft_skills_keywords:
                if ' ' in skill and skill.lower() in skills_section.lower() and skill not in skills['soft_skills']:
                    skills['soft_skills'].append(skill)
            
            return skills
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion von Skills: {str(e)}")
            return skills
        
    def extract_basic_info(self, text: str) -> Dict[str, Any]:
        """Extrahiert grundlegende Informationen aus einem Text mit Regex-Mustern
        
        Args:
            text: Der zu analysierende CV-Text
            
        Returns:
            Dict mit extrahierten grundlegenden Daten
        """
        # Initialisiere das Ergebnisformat
        info = {
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
        
        try:
            # Text vorverarbeiten und bereinigen
            # Ersetze mehrfache Leerzeichen und Tabs durch ein einzelnes Leerzeichen
            text = re.sub(r'[ \t]+', ' ', text)
            # Ersetze mehrfache Zeilenumbrüche durch einen einzelnen
            text = re.sub(r'\n+', '\n', text)
            # Entferne Leerzeichen am Anfang und Ende jeder Zeile
            lines = [line.strip() for line in text.split('\n')]
            # Filtriere leere Zeilen
            lines = [line for line in lines if line]
            
            # Textblöcke erzeugen, getrennt durch leere Zeilen
            blocks = []
            current_block = []
            
            for line in lines:
                if line:
                    current_block.append(line)
                elif current_block:
                    blocks.append("\n".join(current_block))
                    current_block = []
                    
            if current_block:
                blocks.append("\n".join(current_block))
            
            # Debug-Ausgabe der Textblöcke
            logger.debug(f"Extrahierte {len(blocks)} Textblöcke aus CV")
            
            # SCHRITT 1: Extrahiere Name aus dem ersten Block
            if blocks and len(blocks[0]) < 100:  # Erster Block ist wahrscheinlich der Name
                name_pattern = r'^([A-Za-zÀ-ÖØ-öø-ÿ.\s-]{2,50})$'
                name_match = re.search(name_pattern, blocks[0], re.MULTILINE)
                if name_match:
                    info['name'] = name_match.group(1).strip()
                else:
                    # Alternative: Nimm die erste Zeile als Namen, wenn sie kurz ist
                    if len(lines[0]) < 40 and not any(x in lines[0].lower() for x in ['email', 'telefon', 'fax', 'adresse']):
                        info['name'] = lines[0]
            
            # SCHRITT 2: Extrahiere Kontaktdaten mit präziseren Mustern
            # E-Mail extrahieren
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
            email_matches = re.findall(email_pattern, text)
            if email_matches:
                info['email'] = email_matches[0]
                
            # Telefonnummern extrahieren (verschiedene Formate mit Priorisierung)
            phone_patterns = [
                # Schweizer/Deutsche Nummern mit internationaler Vorwahl
                r'(?<!\d)(?:\+41|0041|0)\s?(?:7[5-9]|6[1-9]|4[1-9]|3[1-9]|2[1-9]|1[1-9])\s?(?:[0-9]{3})\s?(?:[0-9]{2})\s?(?:[0-9]{2})(?!\d)',
                # Allgemeinere Muster mit Validierung
                r'(?<!\d)(?:\+\d{1,3}\s?)?(?:\(?\d{2,4}\)?[\s.-]?)?(?:\d{3,5}[\s.-]?)(?:\d{2,5}[\s.-]?)(?:\d{2,5})(?!\d)'
            ]
            
            for pattern in phone_patterns:
                phone_matches = re.findall(pattern, text)
                if phone_matches:
                    # Formatiere Telefonnummer (entferne überflüssige Zeichen)
                    phone = re.sub(r'[^\d+]', ' ', phone_matches[0]).strip()
                    # Überprüfe nochmals, dass es keine Jahreszahl ist
                    if not re.match(r'^(19|20)\d{2}$', phone):
                        info['phone'] = phone
                        break
            
            # Adresse extrahieren - Suche nach Straße/Hausnummer/PLZ/Ort-Kombinationen
            address_patterns = [
                # Schweizer Format: Straße + Hausnummer + PLZ + Ort
                r'([A-Za-zÀ-ÖØ-öø-ÿ\s.-]+\s\d+[a-zA-Z]?)\s*,?\s*(\d{4,5})\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.-]+)',
                # Allgemeines Format: PLZ + Ort
                r'(\d{4,5})\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.-]+)'
            ]
            
            for pattern in address_patterns:
                address_match = re.search(pattern, text)
                if address_match:
                    if len(address_match.groups()) == 3:  # vollständige Adresse
                        street = address_match.group(1)
                        zip_code = address_match.group(2)
                        city = address_match.group(3)
                        info['address'] = f"{street}, {zip_code} {city}"
                    elif len(address_match.groups()) == 2:  # nur PLZ + Ort
                        zip_code = address_match.group(1)
                        city = address_match.group(2)
                        info['address'] = f"{zip_code} {city}"
                    
                    break
            
            # SCHRITT 3: Skills extrahieren
            # Suche nach Abschnitten mit typischen Überschriften
            skill_section_patterns = [
                r'(?:Fähigkeiten|Skills|Kenntnisse|Kompetenzen|Technologien|Technische\s+Fähigkeiten)[:\s]*(.+?)(?=\n\s*\n|\n[A-ZÄÖÜ]|\Z)',
                r'(?:Programmiersprachen|Tools|Software)[:\s]*(.+?)(?=\n\s*\n|\n[A-ZÄÖÜ]|\Z)'
            ]
            
            all_skills = []
            
            for pattern in skill_section_patterns:
                skill_matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
                
                for skill_match in skill_matches:
                    skill_text = skill_match.group(1).strip()
                    
                    # Extrahiere Skills basierend auf verschiedenen Formatierungen
                    if ',' in skill_text:
                        # Komma-getrennte Liste
                        extracted_skills = [s.strip() for s in skill_text.split(',')]
                    elif '•' in skill_text:
                        # Bullet-Liste
                        extracted_skills = [s.strip() for s in skill_text.split('•') if s.strip()]
                    elif '\n' in skill_text:
                        # Zeilenweise Liste
                        extracted_skills = [s.strip() for s in skill_text.split('\n') if s.strip()]
                    else:
                        # Leerzeichen oder andere Trennzeichen
                        extracted_skills = [s.strip() for s in re.split(r'[\s|;/]+', skill_text) if len(s.strip()) > 2]
                    
                    # Filtere kurze oder leere Skills
                    extracted_skills = [s for s in extracted_skills if len(s) > 2]
                    all_skills.extend(extracted_skills)
            
            # Wenn keine Skills gefunden wurden, extrahiere häufige Technologien direkt
            if not all_skills:
                tech_patterns = [
                    r'\b(?:Java|Python|C\+\+|JavaScript|TypeScript|HTML|CSS|SQL|Git|Docker|Kubernetes|AWS|Azure|PHP|Ruby|Swift|Kotlin|React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|REST|API|OOP|DevOps|CI/CD|Linux|Unix|Windows|MacOS)\b',
                    r'\b(?:Word|Excel|PowerPoint|Office|SAP|Jira|Confluence|Photoshop|Illustrator|InDesign|Figma|Sketch)\b'
                ]
                
                tech_skills = []
                for pattern in tech_patterns:
                    tech_matches = re.finditer(pattern, text, re.IGNORECASE)
                    tech_skills.extend([match.group(0) for match in tech_matches])
                
                # Entferne Duplikate und sortiere
                tech_skills = sorted(list(set(tech_skills)))
                all_skills.extend(tech_skills)
            
            # Entferne Duplikate und speichere
            info['skills'] = sorted(list(set(all_skills)))
            
            # SCHRITT 4: Arbeitserfahrung extrahieren
            experience_section_pattern = r'(?:Berufserfahrung|Arbeitserfahrung|Work\s+Experience|Berufliche\s+Laufbahn|Berufspraxis)[:\s]*(.+?)(?=(?:Ausbildung|Education|Bildung|Projekte|Projects|Referenzen|\Z))'
            experience_match = re.search(experience_section_pattern, text, re.IGNORECASE | re.DOTALL)
            
            if experience_match:
                experience_text = experience_match.group(1).strip()
                
                # Teile den Text in einzelne Einträge auf, basierend auf Zeitangaben oder Absätzen
                entries = re.split(r'\n\s*\n|\n(?=\d{2}[\./]\d{2}|\d{4}|[A-Za-z]+\s+\d{4})', experience_text)
                
                for entry in entries:
                    if len(entry.strip()) < 10:
                        continue
                        
                    experience_entry = {
                        "position": "",
                        "company": "",
                        "start_date": "",
                        "end_date": "",
                        "description": ""
                    }
                    
                    # Versuche Position zu extrahieren (oft die erste Zeile)
                    lines = entry.strip().split('\n')
                    if lines:
                        first_line = lines[0].strip()
                        if len(first_line) < 50 and not re.search(r'\d{4}', first_line):
                            experience_entry["position"] = first_line
                    
                    # Versuche Firma zu extrahieren (oft enthält "bei" oder "at")
                    company_pattern = r'(?:bei|at|@)\s+([A-Za-z0-9\s&.()\-]+)'
                    company_match = re.search(company_pattern, entry, re.IGNORECASE)
                    if company_match:
                        experience_entry["company"] = company_match.group(1).strip()
                    
                    # Versuche Zeitraum zu extrahieren
                    date_patterns = [
                        r'(\d{2}[\./]\d{2}[\./]\d{2,4})\s*-\s*(\d{2}[\./]\d{2}[\./]\d{2,4}|\bheute\b|\bpresent\b)',
                        r'(\d{2}[\./]\d{4})\s*-\s*(\d{2}[\./]\d{4}|\bheute\b|\bpresent\b)',
                        r'(\d{4})\s*-\s*(\d{4}|\bheute\b|\bpresent\b)',
                        r'([A-Za-z]+\s+\d{4})\s*-\s*([A-Za-z]+\s+\d{4}|\bheute\b|\bpresent\b)'
                    ]
                    
                    for pattern in date_patterns:
                        date_match = re.search(pattern, entry, re.IGNORECASE)
                        if date_match:
                            experience_entry["start_date"] = date_match.group(1)
                            experience_entry["end_date"] = date_match.group(2)
                            break
                    
                    # Extrahiere Beschreibung als den gesamten verbleibenden Text
                    description = entry
                    
                    # Entferne bereits extrahierte Informationen
                    if experience_entry["position"]:
                        description = description.replace(experience_entry["position"], "", 1)
                    if experience_entry["company"]:
                        description = description.replace(experience_entry["company"], "", 1)
                    if experience_entry["start_date"] and experience_entry["end_date"]:
                        date_string = f"{experience_entry['start_date']} - {experience_entry['end_date']}"
                        description = description.replace(date_string, "", 1)
                    
                    # Bereinige und kürze die Beschreibung
                    description = re.sub(r'\s+', ' ', description).strip()
                    experience_entry["description"] = description
                    
                    # Füge den Eintrag nur hinzu, wenn er sinnvolle Daten enthält
                    if experience_entry["position"] or experience_entry["company"] or experience_entry["description"]:
                        info['work_experience'].append(experience_entry)
            
            # SCHRITT 5: Sprachen extrahieren
            language_section_pattern = r'(?:Sprachen|Languages|Sprachkenntnisse)[:\s]*(.+?)(?=\n\s*\n|\n[A-ZÄÖÜ]|\Z)'
            language_match = re.search(language_section_pattern, text, re.IGNORECASE | re.DOTALL)
            
            if language_match:
                language_text = language_match.group(1).strip()
                
                # Teile den Text in einzelne Einträge auf
                if ',' in language_text:
                    language_entries = [s.strip() for s in language_text.split(',')]
                elif '•' in language_text:
                    language_entries = [s.strip() for s in language_text.split('•') if s.strip()]
                elif '\n' in language_text:
                    language_entries = [s.strip() for s in language_text.split('\n') if s.strip()]
                else:
                    language_entries = [language_text.strip()]
                
                for entry in language_entries:
                    if len(entry) < 3:
                        continue
                        
                    language_entry = {
                        "language": "",
                        "proficiency": ""
                    }
                    
                    # Extrahiere Sprache und Niveau
                    parts = re.split(r'[:–\-\(\)]', entry, 1)
                    
                    if parts:
                        language_entry["language"] = parts[0].strip()
                        
                        if len(parts) > 1:
                            language_entry["proficiency"] = parts[1].strip()
                            
                        info['languages'].append(language_entry)
            
            # Wenn keine Sprachen gefunden wurden, versuche gängige Sprachen direkt zu erkennen
            if not info['languages']:
                common_languages = {
                    'Deutsch': ['deutsch', 'german', 'muttersprachlich', 'muttersprache', 'native', 'c2'],
                    'Englisch': ['englisch', 'english', 'b2', 'c1', 'business', 'fließend'],
                    'Französisch': ['französisch', 'french', 'francais'],
                    'Spanisch': ['spanisch', 'spanish', 'espanol'],
                    'Italienisch': ['italienisch', 'italian', 'italiano']
                }
                
                text_lower = text.lower()
                
                for language, keywords in common_languages.items():
                    for keyword in keywords:
                        if keyword in text_lower:
                            info['languages'].append({
                                "language": language,
                                "proficiency": ""
                            })
                            break
                            
            # Entferne Duplikate bei Sprachen
            if info['languages']:
                unique_languages = {}
                for lang in info['languages']:
                    if lang["language"] not in unique_languages:
                        unique_languages[lang["language"]] = lang["proficiency"]
                
                info['languages'] = [{"language": lang, "proficiency": prof} for lang, prof in unique_languages.items()]
            
            return info
            
        except Exception as e:
            logger.error(f"Fehler bei der verbesserten Basisextraktion von CV-Daten: {str(e)}")
            return info
        
    def extract_cv_data(self, text: str) -> Dict[str, Any]:
        """
        Extrahiert alle relevanten Daten aus einem CV-Text
        
        Args:
            text (str): Der zu analysierende Text des Lebenslaufs
            
        Returns:
            dict: Ein Dictionary mit den extrahierten Daten
        """
        try:
            # Text bereinigen
            cleaned_text = self.clean_text(text)
            
            # Extrahiere alle Daten
            cv_data = {
                "personal_data": self.extract_personal_data(cleaned_text),
                "education": self.extract_education(cleaned_text),
                "experience": self.extract_experience(cleaned_text),
                "skills": self.extract_skills(cleaned_text),
                "basic_info": self.extract_basic_info(cleaned_text)
            }
            
            # Daten bereinigen
            cv_data = self.sanitize_cv_data(cv_data)
            
            logger.info("CV-Daten erfolgreich extrahiert")
            return cv_data
            
        except Exception as e:
            logger.error(f"Fehler bei der CV-Extraktion: {str(e)}")
            raise Exception(f"Fehler bei der CV-Extraktion: {str(e)}") 
            
    def sanitize_cv_data(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Bereinigt die extrahierten Daten, um sicherzustellen, dass keine Feldbezeichnungen 
        oder ungültige Werte enthalten sind.
        """
        # Liste von Wörtern, die nicht als Daten erkannt werden sollten
        forbidden_terms = [
            'vorname', 'nachname', 'name', 'email', 'e-mail', 'telefon', 'tel', 'adresse', 
            'kontakt', 'schulbildung', 'ausbildung', 'bildung', 'erfahrung', 'berufserfahrung',
            'fähigkeiten', 'skills', 'sprachen', 'persönliche', 'daten', 'persönlich'
        ]
        
        # Persönliche Daten bereinigen
        personal_data = cv_data.get('personal_data', {})
        for key, value in personal_data.items():
            if isinstance(value, str):
                # Prüfe, ob der Wert ein verbotener Begriff ist
                if value.lower() in forbidden_terms:
                    personal_data[key] = ""
                # Entferne Feldbezeichnungen aus Werten (z.B. "eric.huber@gmail.comEmail" -> "eric.huber@gmail.com")
                elif key == 'email' and any(term in value.lower() for term in ['email', 'e-mail']):
                    personal_data[key] = re.sub(r'(?i)(email|e-mail)', '', value).strip()
                # Entferne mögliche Zahlen-Wiederholungen bei Telefonnummern
                elif key == 'telefon' and re.match(r'^\d{4}\s+\d{4}$', value):
                    personal_data[key] = ""
        
        # Stelle sicher, dass keine Feldbezeichnungen als Namen verwendet werden
        if personal_data.get('vorname', '').lower() in forbidden_terms:
            personal_data['vorname'] = ""
        if personal_data.get('nachname', '').lower() in forbidden_terms:
            personal_data['nachname'] = ""
            
        # Aktualisiere die bereinigten Daten
        cv_data['personal_data'] = personal_data
        
        return cv_data 