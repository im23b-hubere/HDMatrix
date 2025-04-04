import axios from 'axios';

// Wähle die richtige API-URL basierend auf der Umgebung oder den Konfigurationseinstellungen
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API-URL für CV-Upload-Service:', API_URL);

// Mock-Daten für Offline-Tests
const MOCK_DATA = {
  personal_data: {
    vorname: "Max",
    nachname: "Mustermann",
    email: "max@example.com",
    telefon: "0123-456789",
    adresse: "Musterstraße 123, 12345 Berlin"
  },
  education: [
    {
      institution: "Technische Universität Berlin",
      abschluss: "Bachelor of Science",
      fachrichtung: "Informatik",
      zeitraum: "2015-2019",
      ort: "Berlin"
    }
  ],
  experience: [
    {
      firma: "Tech GmbH",
      position: "Softwareentwickler",
      zeitraum: "2019-2021",
      ort: "Berlin",
      beschreibung: "Entwicklung von Webanwendungen mit React und Node.js"
    },
    {
      firma: "Innovation AG",
      position: "Senior Developer",
      zeitraum: "2021-heute",
      ort: "München",
      beschreibung: "Leitung eines Entwicklerteams und Implementierung von Cloud-basierten Lösungen"
    }
  ],
  skills: {
    technische_skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "Git"],
    soft_skills: ["Teamarbeit", "Kommunikation", "Problemlösung", "Zeitmanagement"],
    sprachen: ["Deutsch (Muttersprache)", "Englisch (fließend)", "Französisch (Grundkenntnisse)"]
  }
};

// Konfiguration
const CONFIG = {
  useMockData: false,  // Auf true setzen, um Mock-Daten zu verwenden
  mockDelay: 2000,     // Verzögerung in ms für Mock-Daten
  debug: true,         // Debug-Modus (zusätzliche Konsolenausgaben)
  autoSwitchToMock: false  // Auf false setzen, um automatische Umschaltung zu deaktivieren
};

// Debug-Ausgabe
const debug = (message: string, data?: any) => {
  if (CONFIG.debug) {
    if (data) {
      console.log(`[CV-Upload] ${message}`, data);
    } else {
      console.log(`[CV-Upload] ${message}`);
    }
  }
};

// Test-Funktion, um festzustellen, ob die API erreichbar ist
const testApiConnection = async () => {
  try {
    debug('Testing API connection...');
    const response = await axios.get(`${API_URL}/debug/health`, { timeout: 5000 });
    debug('API connection test result:', response.data);
    return response.data;
  } catch (error) {
    debug('API connection test failed:', error);
    // Aktiviere Mock-Modus nur, wenn autoSwitchToMock aktiviert ist
    if (CONFIG.autoSwitchToMock) {
      CONFIG.useMockData = true;
      debug('Aktiviere Mock-Modus aufgrund fehlgeschlagener API-Verbindung');
    } else {
      debug('API nicht erreichbar, aber Mock-Modus bleibt deaktiviert (autoSwitchToMock ist aus)');
    }
    return { status: 'error', message: 'API nicht erreichbar' };
  }
};

// Teste Ollama-Verbindung
const testOllamaConnection = async () => {
  try {
    debug('Testing Ollama connection...');
    const response = await axios.get(`${API_URL}/cv-upload/test-ollama`, { timeout: 10000 });
    debug('Ollama connection test result:', response.data);
    return response.data;
  } catch (error) {
    debug('Ollama connection test failed:', error);
    return { 
      success: false, 
      message: 'Ollama-Verbindung fehlgeschlagen. Bitte Ollama-Server überprüfen.'
    };
  }
};

// Extraktion von Daten aus dem CV ohne Speicherung
const extractPreview = async (file: File) => {
  debug(`Starte Extraktion mit Datei: ${file.name}`);
  console.time('extractPreview');
  
  // Mock-Modus
  if (CONFIG.useMockData) {
    debug('Verwende Mock-Daten für Extraktion');
    return new Promise(resolve => {
      setTimeout(() => {
        console.timeEnd('extractPreview');
        resolve({
          success: true,
          message: 'Daten erfolgreich extrahiert (MOCK)',
          extracted_data: MOCK_DATA,
          text_sample: "Dies ist ein Beispieltext aus dem Lebenslauf... (MOCK)"
        });
      }, CONFIG.mockDelay);
    });
  }
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    debug('Sende Anfrage an:', `${API_URL}/cv-upload/extract-preview`);
    
    const response = await axios.post(`${API_URL}/cv-upload/extract-preview`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 Minuten Timeout
    });
    
    console.timeEnd('extractPreview');
    debug('Extraktionsergebnis:', response.data);
    
    return response.data;
  } catch (error) {
    console.timeEnd('extractPreview');
    debug('Fehler bei der Extraktion:', error);
    
    // Automatisch auf Mock-Daten umschalten bei Fehler
    if (!CONFIG.useMockData && CONFIG.autoSwitchToMock) {
      debug('Schalte auf Mock-Modus nach Fehler bei echter API');
      CONFIG.useMockData = true;
      
      // Zweiter Versuch mit Mock-Daten
      return extractPreview(file);
    }
    
    // Detaillierte Fehlerbehandlung
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return { success: false, message: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.' };
      }
      
      if (error.response) {
        debug('Fehlerantwort vom Server:', error.response.data);
        // Server hat geantwortet, aber mit einem Fehlercode
        return { 
          success: false, 
          message: `Server-Fehler (${error.response.status}): ${error.response.data.message || 'Unbekannter Fehler'}`,
          error: error.response.data
        };
      } else if (error.request) {
        // Keine Antwort vom Server erhalten
        debug('Keine Antwort vom Server erhalten');
        return { 
          success: false, 
          message: 'Der Server antwortet nicht. Bitte überprüfen Sie Ihre Verbindung.'
        };
      }
    }
    
    return { 
      success: false, 
      message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' 
    };
  }
};

// Hochladen und Speicherung des CV
const uploadCV = async (file: File, tenantId?: string) => {
  debug(`Starte Upload mit Datei: ${file.name}`);
  console.time('uploadCV');
  
  // Mock-Modus
  if (CONFIG.useMockData) {
    debug('Verwende Mock-Daten für Upload');
    return new Promise(resolve => {
      setTimeout(() => {
        console.timeEnd('uploadCV');
        resolve({
          success: true,
          message: 'Lebenslauf erfolgreich gespeichert (MOCK)',
          cv_id: 'mock-cv-123',
          employee_id: 'mock-emp-456'
        });
      }, CONFIG.mockDelay);
    });
  }
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (tenantId) {
      formData.append('tenant_id', tenantId);
    }
    
    debug('Sende Anfrage an:', `${API_URL}/cv-upload/upload`);
    
    const response = await axios.post(`${API_URL}/cv-upload/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 Minuten Timeout
    });
    
    console.timeEnd('uploadCV');
    debug('Upload-Ergebnis:', response.data);
    
    return response.data;
  } catch (error) {
    console.timeEnd('uploadCV');
    debug('Fehler beim Upload:', error);
    
    // Automatisch auf Mock-Daten umschalten bei Fehler
    if (!CONFIG.useMockData && CONFIG.autoSwitchToMock) {
      debug('Schalte auf Mock-Modus nach Fehler bei echtem Upload');
      CONFIG.useMockData = true;
      
      // Zweiter Versuch mit Mock-Daten
      return uploadCV(file, tenantId);
    }
    
    // Detaillierte Fehlerbehandlung
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return { success: false, message: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.' };
      }
      
      if (error.response) {
        debug('Fehlerantwort vom Server:', error.response.data);
        // Server hat geantwortet, aber mit einem Fehlercode
        return { 
          success: false, 
          message: `Server-Fehler (${error.response.status}): ${error.response.data.message || 'Unbekannter Fehler'}`,
          error: error.response.data
        };
      } else if (error.request) {
        // Keine Antwort vom Server erhalten
        debug('Keine Antwort vom Server erhalten');
        return { 
          success: false, 
          message: 'Der Server antwortet nicht. Bitte überprüfen Sie Ihre Verbindung.'
        };
      }
    }
    
    return { 
      success: false, 
      message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' 
    };
  }
};

export default {
  extractPreview,
  uploadCV,
  testApiConnection,
  testOllamaConnection,
  useMockData: () => CONFIG.useMockData,
  setMockData: (value: boolean) => {
    CONFIG.useMockData = value;
    debug(`Mock-Modus ${value ? 'aktiviert' : 'deaktiviert'}`);
    return value;
  }
}; 