import axios from 'axios';
import { CV } from '../types/cv';

interface OllamaResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
}

export class AIService {
  private readonly OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

  /**
   * Extrahiert CV-Daten aus einem Text
   * @param text Der zu analysierende Text
   * @returns Extrahiertes CV
   */
  async extractCVFromText(text: string): Promise<CV> {
    try {
      const prompt = `
        Analysiere den folgenden Text und extrahiere die CV-Daten.
        Formatiere die Antwort als JSON-Objekt mit den folgenden Feldern:
        - personalInfo: { firstName, lastName, email, phone, address, title, summary }
        - workExperience: Array von { company, position, startDate, endDate, description }
        - education: Array von { institution, degree, field, startDate, endDate, grade }
        - certifications: Array von { name, issuer, date }
        - skills: Array von Strings
        - languages: Array von { language, level }
        - projects: Array von { name, description, technologies }

        Text:
        ${text}

        Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.
      `;

      const response = await axios.post<OllamaResponse>(`${this.OLLAMA_URL}/api/generate`, {
        model: "mistral",
        prompt: prompt,
        stream: false
      });

      const cvData = JSON.parse(response.data.response);
      return this.validateAndEnhanceCV(cvData);
    } catch (error) {
      console.error('Fehler bei der KI-Extraktion:', error);
      throw error;
    }
  }

  /**
   * Verbessert und vervollständigt die CV-Daten
   * @param cv Das zu verbessernde CV
   * @returns Verbessertes CV
   */
  async enhanceCV(cv: CV): Promise<CV> {
    try {
      const prompt = `
        Verbessere und vervollständige die folgenden CV-Daten. 
        Füge relevante Details hinzu und optimiere die Beschreibungen.
        Antworte im gleichen JSON-Format.

        CV-Daten:
        ${JSON.stringify(cv, null, 2)}

        Antworte NUR mit dem verbesserten JSON, keine zusätzlichen Erklärungen.
      `;

      const response = await axios.post<OllamaResponse>(`${this.OLLAMA_URL}/api/generate`, {
        model: "mistral",
        prompt: prompt,
        stream: false
      });

      const enhancedCV = JSON.parse(response.data.response);
      return this.validateAndEnhanceCV(enhancedCV);
    } catch (error) {
      console.error('Fehler bei der CV-Verbesserung:', error);
      throw error;
    }
  }

  /**
   * Validiert und standardisiert ein CV-Objekt
   * @param cv Das zu validierende CV
   * @returns Validiertes und standardisiertes CV
   */
  private validateAndEnhanceCV(cv: Partial<CV>): CV {
    // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
    return {
      id: cv.id || Date.now().toString(),
      userId: cv.userId || '',
      title: cv.title || '',
      personalInfo: {
        firstName: cv.personalInfo?.firstName || '',
        lastName: cv.personalInfo?.lastName || '',
        email: cv.personalInfo?.email || '',
        phone: cv.personalInfo?.phone || '',
        address: cv.personalInfo?.address || '',
        title: cv.personalInfo?.title || '',
        summary: cv.personalInfo?.summary || '',
      },
      workExperience: cv.workExperience || [],
      education: cv.education || [],
      certifications: cv.certifications || [],
      skills: cv.skills || [],
      languages: cv.languages || [],
      projects: cv.projects || [],
      createdAt: cv.createdAt || new Date().toISOString(),
      updatedAt: cv.updatedAt || new Date().toISOString(),
    };
  }
} 