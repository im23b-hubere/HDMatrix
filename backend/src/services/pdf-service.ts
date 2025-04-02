import * as fs from 'fs';
import PDFParse from 'pdf-parse';

export class PDFService {
  /**
   * Extrahiert Text aus einer PDF-Datei
   * @param buffer PDF-Datei als Buffer
   * @returns Extrahierter Text
   */
  async extractText(buffer: Buffer): Promise<string> {
    try {
      console.log('Starte PDF-Textextraktion...');
      const data = await PDFParse(buffer);
      console.log('PDF-Text erfolgreich extrahiert, Länge:', data.text.length);
      return data.text;
    } catch (error) {
      console.error('Fehler bei der PDF-Textextraktion:', error);
      throw new Error('Fehler beim Extrahieren des PDF-Texts. Bitte überprüfen Sie die Datei.');
    }
  }
} 