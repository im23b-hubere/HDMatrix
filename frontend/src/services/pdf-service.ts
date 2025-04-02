import axios from 'axios';
import { CV } from '../types/cv';
import { aiService } from './ai-service';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const pdfService = {
    /**
     * Extrahiert Text aus einer PDF-Datei
     * @param file PDF-Datei
     * @returns Extrahierter Text
     */
    extractTextFromPDF: async (file: File): Promise<string> => {
        try {
            console.log('Starte PDF-Textextraktion für:', file.name);
            console.log('API URL:', `${API_BASE_URL}/api/pdf/extract-text`);
            
            const formData = new FormData();
            formData.append('file', file);

            // Log FormData contents safely
            console.log('FormData Datei:', file.name, 'Größe:', file.size, 'Typ:', file.type);

            const response = await axios.post(`${API_BASE_URL}/api/pdf/extract-text`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                },
                withCredentials: true
            });

            console.log('PDF-Text erfolgreich extrahiert:', response.data);
            return response.data.text;
        } catch (error) {
            console.error('Fehler bei der PDF-Textextraktion:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response:', error.response?.data);
                console.error('Status:', error.response?.status);
                console.error('Request URL:', error.config?.url);
                console.error('Request Method:', error.config?.method);
                console.error('Request Headers:', error.config?.headers);
            }
            throw new Error('Fehler beim Extrahieren des PDF-Texts. Bitte versuchen Sie es erneut.');
        }
    },

    /**
     * Extrahiert CV-Daten aus einer PDF-Datei mit KI-Unterstützung
     * @param file PDF-Datei
     * @returns CV-Objekt mit extrahierten Daten
     */
    extractFromPDF: async (file: File): Promise<CV> => {
        try {
            console.log('Starte PDF-Verarbeitung für:', file.name);
            
            // 1. Text aus PDF extrahieren
            const pdfText = await pdfService.extractTextFromPDF(file);
            console.log('Extrahierter Text (erste 100 Zeichen):', pdfText.substring(0, 100));

            // 2. Text an Backend zur KI-Verarbeitung senden
            const response = await axios.post(`${API_BASE_URL}/api/ai/extract-cv`, {
                text: pdfText
            });

            console.log('CV-Daten erfolgreich extrahiert:', response.data);
            
            // 3. CV-Daten verbessern
            const enhancedResponse = await axios.post(`${API_BASE_URL}/api/ai/enhance-cv`, {
                cv: response.data
            });

            console.log('CV-Daten erfolgreich verbessert:', enhancedResponse.data);

            return {
                ...enhancedResponse.data,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Fehler bei der PDF-Verarbeitung:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response:', error.response?.data);
                console.error('Status:', error.response?.status);
            }
            throw new Error('Fehler bei der Verarbeitung des Lebenslaufs. Bitte versuchen Sie es erneut.');
        }
    },

    /**
     * Importiert mehrere PDF-Dateien als CVs
     * @param files Array von PDF-Dateien
     * @returns Array von CV-Objekten
     */
    importMultiplePDFs: async (files: File[]): Promise<CV[]> => {
        try {
            console.log('Starte Multi-PDF-Import für', files.length, 'Dateien');
            const cvPromises = files.map(file => pdfService.extractFromPDF(file));
            return await Promise.all(cvPromises);
        } catch (error) {
            console.error('Fehler beim PDF-Import:', error);
            throw error;
        }
    },
}; 