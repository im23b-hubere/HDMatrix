// API-Konfiguration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Weitere Konfigurationsoptionen
export const CONFIG = {
    // API Timeouts (in Millisekunden)
    API_TIMEOUT: 60000,
    
    // Feature Flags
    ENABLE_MOCK_DATA: process.env.REACT_APP_ENABLE_MOCK_DATA === 'true',
    
    // Debug-Einstellungen
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    
    // Upload-Einstellungen
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx'],
    
    // Versionsinfo
    VERSION: '1.0.0'
}; 