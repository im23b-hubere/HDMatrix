import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.tag import pos_tag
from nltk.chunk import ne_chunk
import re
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class NLTKExtractor:
    """
    Extrahiert Informationen aus CV-Texten mit NLTK.
    """
    
    def __init__(self):
        """
        Initialisiert den NLTK-Extraktor und lädt benötigte Ressourcen.
        """
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('averaged_perceptron_tagger', quiet=True)
            nltk.download('maxent_ne_chunker', quiet=True)
            nltk.download('words', quiet=True)
            logger.info("NLTK Ressourcen erfolgreich geladen")
        except Exception as e:
            logger.error(f"Fehler beim Laden der NLTK Ressourcen: {str(e)}")
            raise
            
    def extract_email(self, text: str) -> str:
        """
        Extrahiert E-Mail-Adressen aus dem Text.
        """
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        matches = re.findall(email_pattern, text)
        return matches[0] if matches else ''
        
    def extract_phone(self, text: str) -> str:
        """
        Extrahiert Telefonnummern aus dem Text.
        """
        # Deutsche Telefonnummern
        phone_pattern = r'(?:(?:\+49|0049|0)[1-9]\d{1,14})'
        matches = re.findall(phone_pattern, text)
        return matches[0] if matches else ''
        
    def extract_name(self, text: str) -> str:
        """
        Extrahiert den Namen aus dem Text.
        """
        # Tokenisiere und tagge den Text
        tokens = word_tokenize(text)
        tagged = pos_tag(tokens)
        
        # Suche nach Named Entities
        entities = ne_chunk(tagged)
        
        # Extrahiere PERSON Entities
        for entity in entities:
            if hasattr(entity, 'label') and entity.label() == 'PERSON':
                return ' '.join([e[0] for e in entity])
                
        return ''
        
    def extract_skills(self, text: str) -> List[Dict[str, Any]]:
        """
        Extrahiert Skills aus dem Text.
        """
        # Liste bekannter Skills
        known_skills = {
            'programming': [
                'python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby',
                'swift', 'kotlin', 'go', 'rust', 'scala', 'typescript'
            ],
            'frameworks': [
                'react', 'angular', 'vue', 'django', 'flask', 'spring',
                'laravel', 'express', 'node.js', 'tensorflow', 'pytorch'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'oracle', 'sql server',
                'redis', 'elasticsearch', 'cassandra'
            ],
            'tools': [
                'git', 'docker', 'kubernetes', 'jenkins', 'jira', 'confluence',
                'aws', 'azure', 'gcp', 'linux', 'unix'
            ]
        }
        
        # Tokenisiere den Text
        tokens = word_tokenize(text.lower())
        
        # Finde Skills
        found_skills = {
            'programming': [],
            'frameworks': [],
            'databases': [],
            'tools': []
        }
        
        for category, skills in known_skills.items():
            for skill in skills:
                if skill in tokens:
                    found_skills[category].append(skill)
                    
        return [
            {'category': category, 'skills': skills}
            for category, skills in found_skills.items()
            if skills
        ]
        
    def extract_work_experience(self, text: str) -> List[Dict[str, Any]]:
        """
        Extrahiert Berufserfahrung aus dem Text.
        """
        # Teile Text in Sätze
        sentences = sent_tokenize(text)
        
        # Suche nach Zeitangaben
        date_pattern = r'\b(?:Jan(?:uar)?|Feb(?:ruar)?|Mär(?:z)?|Apr(?:il)?|Mai|Jun(?:i)?|Jul(?:i)?|Aug(?:ust)?|Sep(?:tember)?|Okt(?:ober)?|Nov(?:ember)?|Dez(?:ember)?)\s+\d{4}\b'
        
        experiences = []
        current_exp = None
        
        for sentence in sentences:
            # Suche nach Zeitangaben
            dates = re.findall(date_pattern, sentence)
            
            if dates:
                if current_exp:
                    experiences.append(current_exp)
                    
                current_exp = {
                    'start_date': dates[0],
                    'end_date': dates[1] if len(dates) > 1 else 'Present',
                    'company': '',
                    'position': '',
                    'description': []
                }
            elif current_exp:
                # Füge Satz zur Beschreibung hinzu
                current_exp['description'].append(sentence)
                
                # Suche nach Position/Unternehmen
                if not current_exp['position'] and 'entwickler' in sentence.lower():
                    current_exp['position'] = sentence
                elif not current_exp['company'] and 'gmbh' in sentence.lower():
                    current_exp['company'] = sentence
                    
        if current_exp:
            experiences.append(current_exp)
            
        return experiences
        
    def extract_education(self, text: str) -> List[Dict[str, Any]]:
        """
        Extrahiert Ausbildung aus dem Text.
        """
        # Teile Text in Sätze
        sentences = sent_tokenize(text)
        
        education = []
        current_edu = None
        
        # Schlüsselwörter für Ausbildung
        edu_keywords = ['studium', 'ausbildung', 'schule', 'universität', 'hochschule', 'fachhochschule']
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in edu_keywords):
                if current_edu:
                    education.append(current_edu)
                    
                current_edu = {
                    'degree': '',
                    'institution': '',
                    'field': '',
                    'start_date': '',
                    'end_date': '',
                    'description': []
                }
                
                # Extrahiere Details
                if 'bachelor' in sentence.lower() or 'master' in sentence.lower():
                    current_edu['degree'] = sentence
                elif any(keyword in sentence.lower() for keyword in ['uni', 'hochschule', 'schule']):
                    current_edu['institution'] = sentence
                else:
                    current_edu['description'].append(sentence)
                    
        if current_edu:
            education.append(current_edu)
            
        return education
        
    def extract_languages(self, text: str) -> List[Dict[str, Any]]:
        """
        Extrahiert Sprachkenntnisse aus dem Text.
        """
        # Liste bekannter Sprachen
        languages = {
            'deutsch': ['deutsch', 'german'],
            'englisch': ['englisch', 'english'],
            'französisch': ['französisch', 'francais', 'french'],
            'spanisch': ['spanisch', 'espanol', 'spanish'],
            'italienisch': ['italienisch', 'italiano', 'italian']
        }
        
        # Suche nach Sprachen und Niveaus
        found_languages = []
        
        for lang, variants in languages.items():
            for variant in variants:
                if variant in text.lower():
                    # Suche nach Niveau
                    level_pattern = r'(?:A1|A2|B1|B2|C1|C2|native|muttersprache)'
                    level_match = re.search(level_pattern, text.lower())
                    level = level_match.group(0) if level_match else 'Not specified'
                    
                    found_languages.append({
                        'language': lang,
                        'level': level
                    })
                    break
                    
        return found_languages
        
    def extract_cv(self, text: str) -> Dict[str, Any]:
        """
        Extrahiert alle CV-Informationen aus dem Text.
        """
        try:
            return {
                'name': self.extract_name(text),
                'email': self.extract_email(text),
                'phone': self.extract_phone(text),
                'skills': self.extract_skills(text),
                'work_experience': self.extract_work_experience(text),
                'education': self.extract_education(text),
                'languages': self.extract_languages(text)
            }
        except Exception as e:
            logger.error(f"Fehler bei der NLTK-Extraktion: {str(e)}")
            return {} 