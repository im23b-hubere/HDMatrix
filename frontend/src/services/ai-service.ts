import axios from 'axios';
import { CV } from '../types/cv';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const aiService = {
  /**
   * Extrahiert strukturierte CV-Daten aus einem PDF-Text mit KI
   * @param pdfText Der extrahierte Text aus der PDF
   * @returns Strukturierte CV-Daten
   */
  extractCVDataFromText: async (pdfText: string): Promise<CV> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/extract-cv`, {
        text: pdfText
      });

      return response.data;
    } catch (error) {
      console.error('Fehler bei der KI-Verarbeitung:', error);
      throw error;
    }
  },

  /**
   * Analysiert und verbessert die extrahierten CV-Daten
   * @param cv Rohes CV-Objekt
   * @returns Verbessertes CV-Objekt
   */
  enhanceCVData: async (cv: CV): Promise<CV> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/enhance-cv`, {
        cv: cv
      });

      return response.data;
    } catch (error) {
      console.error('Fehler bei der CV-Verbesserung:', error);
      throw error;
    }
  }
}; 