import axios from 'axios';
import { CV } from '../types/cv';

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
            
            // Überprüfe Dateigröße (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Die PDF-Datei ist zu groß. Maximale Größe: 10MB');
            }
            
            // Überprüfe Dateityp
            if (!file.type.includes('pdf')) {
                throw new Error('Nur PDF-Dateien sind erlaubt');
            }
            
            const formData = new FormData();
            formData.append('file', file);

            console.log('Sende Anfrage an:', `${API_BASE_URL}/api/pdf/extract`);
            
            const response = await axios.post(`${API_BASE_URL}/api/pdf/extract`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000, // 60 Sekunden Timeout für PDF-Extraktion
                maxContentLength: 10 * 1024 * 1024 // 10MB max
            });

            if (!response.data.text) {
                console.error('Kein Text in der Antwort:', response.data);
                throw new Error('Kein Text aus PDF extrahiert');
            }

            console.log('PDF-Text erfolgreich extrahiert');
            return response.data.text;
        } catch (error) {
            console.error('Fehler bei der PDF-Textextraktion:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 413) {
                    throw new Error('Die PDF-Datei ist zu groß. Maximale Größe: 10MB');
                }
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Zeitüberschreitung bei der PDF-Extraktion');
                }
                if (error.response?.status === 400) {
                    throw new Error(error.response.data?.error || 'Fehler beim Extrahieren des PDF-Texts');
                }
                if (error.response?.status === 500) {
                    throw new Error('Server-Fehler bei der PDF-Extraktion');
                }
                throw new Error(error.response?.data?.error || 'Fehler beim Extrahieren des PDF-Texts');
            }
            throw error;
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
            if (!pdfText) {
                throw new Error('Kein Text aus PDF extrahiert');
            }

            console.log('Text extrahiert, sende an KI...');

            // 2. Text an KI zur Verarbeitung senden
            const response = await axios.post(`${API_BASE_URL}/api/ai/extract-cv`, 
                { text: pdfText },
                { 
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 300000 // 5 Minuten Timeout für KI-Verarbeitung
                }
            );

            if (!response.data) {
                throw new Error('Keine Daten von der KI erhalten');
            }

            console.log('CV-Daten erfolgreich extrahiert');

            // 3. CV-Objekt erstellen und validieren
            const cv: CV = {
                ...response.data,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Validiere die extrahierten Daten
            if (!cv.personalInfo) {
                throw new Error('Keine persönlichen Informationen gefunden');
            }

            // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
            const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'title', 'location', 'summary'];
            for (const field of requiredFields) {
                if (!(field in cv.personalInfo)) {
                    (cv.personalInfo as any)[field] = '';
                }
            }

            // Stelle sicher, dass alle Arrays vorhanden sind
            const arrayFields = ['skills', 'experience', 'education', 'languages', 'certifications', 'projects'];
            for (const field of arrayFields) {
                if (!Array.isArray((cv as any)[field])) {
                    (cv as any)[field] = [];
                }
            }

            return cv;
        } catch (error) {
            console.error('Fehler bei der PDF-Verarbeitung:', error);
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Zeitüberschreitung bei der Verarbeitung. Bitte versuchen Sie es erneut.');
                }
                if (error.response?.status === 503) {
                    throw new Error('KI-Service ist nicht verfügbar. Bitte starten Sie Ollama.');
                }
                throw new Error(error.response?.data?.error || 'Fehler bei der Verarbeitung des Lebenslaufs');
            }
            throw error;
        }
    },

    /**
     * Importiert mehrere PDF-Dateien als CVs
     * @param files Array von PDF-Dateien
     * @returns Array von CV-Objekten
     */
    importMultiplePDFs: async (files: File[]): Promise<CV[]> => {
        const results: CV[] = [];
        const errors: string[] = [];

        for (const file of files) {
            try {
                const cv = await pdfService.extractFromPDF(file);
                results.push(cv);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
                errors.push(`Fehler bei ${file.name}: ${errorMessage}`);
                console.error(`Fehler bei der Verarbeitung von ${file.name}:`, error);
            }
        }

        if (errors.length > 0) {
            console.error('Fehler beim Import einiger PDFs:', errors);
            if (results.length === 0) {
                throw new Error('Keine PDFs konnten importiert werden');
            }
        }

        return results;
    },
}; 