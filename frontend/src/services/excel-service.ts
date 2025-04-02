import * as XLSX from 'xlsx';
import { CV, PersonalInfo, WorkExperience, Education, Certification, Skill } from '../types/cv';

export const excelService = {
  /**
   * Extrahiert CV-Daten aus einer Excel/CSV-Datei
   * @param file Excel/CSV-Datei
   * @returns CV-Objekt mit extrahierten Daten
   */
  extractFromExcel: async (file: File): Promise<CV> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (jsonData.length === 0) {
            throw new Error('Die Excel-Datei enthält keine Daten');
          }

          const row = jsonData[0] as any;
          
          const cv: CV = {
            id: Date.now().toString(),
            personalInfo: {
              firstName: row.firstName || '',
              lastName: row.lastName || '',
              email: row.email || '',
              phone: row.phone || '',
              address: row.address || '',
              title: row.title || '',
              summary: row.summary || '',
            } as PersonalInfo,
            workExperience: [],
            education: [],
            certifications: [],
            skills: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          resolve(cv);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Fehler beim Lesen der Datei'));
      };

      reader.readAsBinaryString(file);
    });
  },

  /**
   * Generiert eine Excel-Vorlage für den CV-Import
   * @returns Blob der Excel-Datei
   */
  generateTemplate: (): Blob => {
    const template = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      title: '',
      summary: '',
      // Weitere Felder können hier hinzugefügt werden
    };

    const ws = XLSX.utils.json_to_sheet([template]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CV Template');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}; 