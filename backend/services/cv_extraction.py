import nltk
import re
import json
import logging
from typing import Dict, List, Any
from nltk.tokenize import sent_tokenize, word_tokenize

logger = logging.getLogger(__name__)

class CVExtractor:
    def __init__(self):
        # Download benötigte NLTK-Daten
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('tokenizers/punkt_tab')
        except LookupError:
            nltk.download('punkt')
            nltk.download('punkt_tab')
            
        try:
            nltk.data.find('taggers/averaged_perceptron_tagger')
        except LookupError:
            nltk.download('averaged_perceptron_tagger')
            
    def clean_text(self, text: str) -> str:
        # Entferne überflüssige Whitespaces und Sonderzeichen
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text
        
    def extract_personal_data(self, text: str) -> Dict[str, str]:
        personal_data = {
            "vorname": "",
            "nachname": "",
            "email": "",
            "telefon": "",
            "adresse": ""
        }
        
        try:
            # E-Mail-Extraktion
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            email_match = re.search(email_pattern, text)
            if email_match:
                personal_data["email"] = email_match.group()
                
            # Telefonnummer-Extraktion (deutsche und internationale Formate)
            phone_pattern = r'(?:\+49|0|\+41)[- ]?(?:\(?\d{2,4}\)?[- ]?)?\d{3,4}[- ]?\d{4}|\+\d{1,3}[- ]?\d{3,4}[- ]?\d{3,4}'
            phone_matches = re.finditer(phone_pattern, text)
            for match in phone_matches:
                if not personal_data["telefon"]:  # Nimm die erste gefundene Nummer
                    personal_data["telefon"] = match.group()
                
            # Adressextraktion
            address_pattern = r'(?:[A-ZÄÖÜ][a-zäöüß\-]+(?:straße|strasse|weg|gasse|platz|allee)\s+\d+[a-z]?(?:\s*,\s*)?(?:\d{4,5}\s+)?[A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)'
            address_match = re.search(address_pattern, text)
            if address_match:
                personal_data["adresse"] = address_match.group()
                
            # Verbesserte Namensextraktion
            name_patterns = [
                # Suche nach "Vorname: Name" oder "Name: Max Mustermann" Formaten
                r'(?i)(?:name|vorname|nachname|personalien)[:\s]*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)',
                # Suche nach alleinstehenden Namen am Anfang des Dokuments
                r'^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)',
                # Suche nach "Max Mustermann" Format
                r'([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß]+)'
            ]
            
            for pattern in name_patterns:
                name_match = re.search(pattern, text)
                if name_match:
                    full_name = name_match.group(1)
                    name_parts = full_name.split()
                    if len(name_parts) >= 2:
                        personal_data["vorname"] = name_parts[0]
                        personal_data["nachname"] = name_parts[1]
                    break
                    
            # Wenn keine persönlichen Daten gefunden wurden, versuche es mit dem ersten Absatz
            if not any([personal_data["vorname"], personal_data["nachname"]]):
                first_paragraph = text.split('\n')[0]
                words = first_paragraph.split()
                capitalized_words = [w for w in words if w[0].isupper()]
                if len(capitalized_words) >= 2:
                    personal_data["vorname"] = capitalized_words[0]
                    personal_data["nachname"] = capitalized_words[1]
                    
            return personal_data
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion persönlicher Daten: {str(e)}")
            return personal_data
        
    def extract_education(self, text: str) -> List[Dict[str, str]]:
        education = []
        
        try:
            # Erweiterte Schlüsselwörter für Bildung
            edu_keywords = [
                "ausbildung", "studium", "hochschule", "universität", "schule",
                "abschluss", "diplom", "master", "bachelor", "promotion",
                "weiterbildung", "fortbildung", "kurs", "seminar",
                "gymnasium", "berufsschule", "fachhochschule", "eth", "fh"
            ]
            
            # Teile Text in Sätze
            sentences = sent_tokenize(text.lower(), language='german')
            
            current_edu = None
            for sentence in sentences:
                if any(keyword in sentence for keyword in edu_keywords):
                    if current_edu:
                        education.append(current_edu)
                    current_edu = {
                        "zeitraum": "",
                        "institution": "",
                        "abschluss": ""
                    }
                    
                    # Verbesserte Zeitraum-Extraktion
                    date_patterns = [
                        r'\d{4}\s*-\s*\d{4}',
                        r'\d{4}\s*bis\s*\d{4}',
                        r'\d{2}/\d{4}',
                        r'\d{4}\s*-\s*heute',
                        r'\d{4}\s*bis\s*heute',
                        r'seit\s+\d{4}'
                    ]
                    
                    for pattern in date_patterns:
                        date_match = re.search(pattern, sentence)
                        if date_match:
                            current_edu["zeitraum"] = date_match.group()
                            break
                            
                    # Extrahiere Institution und Abschluss
                    words = word_tokenize(sentence, language='german')
                    
                    institution_words = []
                    abschluss_words = []
                    
                    for word in words:
                        if word[0].isupper() or word.lower() in edu_keywords:
                            if not current_edu["institution"]:
                                institution_words.append(word)
                            elif not current_edu["abschluss"]:
                                abschluss_words.append(word)
                                
                    if institution_words:
                        current_edu["institution"] = " ".join(institution_words)
                    if abschluss_words:
                        current_edu["abschluss"] = " ".join(abschluss_words)
                        
            if current_edu:
                education.append(current_edu)
                
            return education
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion von Bildungsdaten: {str(e)}")
            return education
        
    def extract_experience(self, text: str) -> List[Dict[str, str]]:
        experience = []
        
        try:
            # Erweiterte Schlüsselwörter für Berufserfahrung
            exp_keywords = [
                "erfahrung", "tätigkeit", "position", "arbeit", "beruf",
                "projekt", "unternehmen", "firma", "arbeitgeber",
                "praktikum", "werkstudent", "werkstudentin",
                "verantwortlich", "zuständig", "leitung"
            ]
            
            # Teile Text in Sätze
            sentences = sent_tokenize(text.lower(), language='german')
            
            current_exp = None
            for sentence in sentences:
                if any(keyword in sentence for keyword in exp_keywords):
                    if current_exp:
                        experience.append(current_exp)
                    current_exp = {
                        "zeitraum": "",
                        "firma": "",
                        "position": "",
                        "beschreibung": sentence
                    }
                    
                    # Verbesserte Zeitraum-Extraktion
                    date_patterns = [
                        r'\d{4}\s*-\s*\d{4}',
                        r'\d{4}\s*bis\s*\d{4}',
                        r'\d{2}/\d{4}',
                        r'\d{4}\s*-\s*heute',
                        r'\d{4}\s*bis\s*heute',
                        r'seit\s+\d{4}'
                    ]
                    
                    for pattern in date_patterns:
                        date_match = re.search(pattern, sentence)
                        if date_match:
                            current_exp["zeitraum"] = date_match.group()
                            break
                            
                    # Extrahiere Firma und Position
                    words = word_tokenize(sentence, language='german')
                    
                    firma_words = []
                    position_words = []
                    
                    for word in words:
                        if word[0].isupper():
                            if not current_exp["firma"]:
                                firma_words.append(word)
                            elif not current_exp["position"]:
                                position_words.append(word)
                                
                    if firma_words:
                        current_exp["firma"] = " ".join(firma_words)
                    if position_words:
                        current_exp["position"] = " ".join(position_words)
                        
            if current_exp:
                experience.append(current_exp)
                
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
            # Erweiterte Listen von Schlüsselwörtern
            tech_keywords = [
                "python", "java", "javascript", "html", "css", "sql", "git",
                "c++", "c#", "php", "ruby", "swift", "kotlin", "typescript",
                "react", "angular", "vue", "node.js", "django", "flask",
                "docker", "kubernetes", "aws", "azure", "gcp", "linux",
                "windows", "macos", "android", "ios", "mysql", "postgresql",
                "mongodb", "redis", "graphql", "rest", "api", "microservices",
                "excel", "word", "powerpoint", "office", "sap", "jira",
                "confluence", "photoshop", "illustrator", "figma", "sketch"
            ]
            
            lang_keywords = [
                "deutsch", "englisch", "französisch", "spanisch", "italienisch",
                "chinesisch", "japanisch", "russisch", "arabisch", "portugiesisch",
                "niederländisch", "schwedisch", "dänisch", "norwegisch", "finnisch",
                "muttersprache", "verhandlungssicher", "fließend", "grundkenntnisse"
            ]
            
            soft_keywords = [
                "teamfähigkeit", "kommunikation", "führung", "projektmanagement",
                "zeitmanagement", "organisation", "kreativität", "problemlösung",
                "analytisches denken", "strategisches denken", "kundenorientierung",
                "selbstständigkeit", "flexibilität", "belastbarkeit", "initiative",
                "verantwortungsbewusstsein", "kooperationsfähigkeit", "konfliktfähigkeit",
                "präsentation", "moderation", "verhandlung", "motivation"
            ]
            
            # Extrahiere Skills basierend auf Schlüsselwörtern
            words = text.lower().split()
            for word in words:
                if word in tech_keywords:
                    skills["technische_skills"].append(word)
                elif word in lang_keywords:
                    skills["sprachen"].append(word)
                elif word in soft_keywords:
                    skills["soft_skills"].append(word)
                    
            # Entferne Duplikate und sortiere
            skills["technische_skills"] = sorted(list(set(skills["technische_skills"])))
            skills["sprachen"] = sorted(list(set(skills["sprachen"])))
            skills["soft_skills"] = sorted(list(set(skills["soft_skills"])))
            
            return skills
            
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion von Skills: {str(e)}")
            return skills
        
    def extract_cv_data(self, text: str) -> Dict[str, Any]:
        try:
            # Säubere den Text
            text = self.clean_text(text)
            
            # Extrahiere alle Informationen
            cv_data = {
                "persönliche_daten": self.extract_personal_data(text),
                "ausbildung": self.extract_education(text),
                "berufserfahrung": self.extract_experience(text),
                "fähigkeiten": self.extract_skills(text)
            }
            
            logger.info("CV-Daten erfolgreich extrahiert")
            return cv_data
            
        except Exception as e:
            logger.error(f"Fehler bei der CV-Extraktion: {str(e)}")
            raise Exception(f"Fehler bei der CV-Extraktion: {str(e)}") 