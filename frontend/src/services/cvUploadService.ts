import axios from 'axios';
import { API_BASE_URL, CONFIG } from '../config';

// Mock-Daten für Entwicklung
const mockExtractedData = {
    personal_data: {
        first_name: 'Max',
        last_name: 'Mustermann',
        email: 'max.mustermann@example.com',
        phone: '+49 123 4567890'
    },
    education: [
        {
            period: { from: '2015', to: '2019' },
            degree: 'Bachelor of Science in Informatik',
            institution: 'Technische Universität Berlin'
        }
    ],
    experience: [
        {
            period: { from: '2019', to: '2023' },
            position: 'Software Engineer',
            company: 'Tech GmbH',
            description: 'Entwicklung von Webanwendungen'
        }
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
    languages: [
        { language: 'Deutsch', level: 'Muttersprachlich' },
        { language: 'Englisch', level: 'Fließend' }
    ]
};

class CVUploadService {
    private autoSwitchToMock: boolean = CONFIG.ENABLE_MOCK_DATA;
    private useMock: boolean = false;
    private apiChecked: boolean = false;

    constructor() {
        if (CONFIG.DEBUG_MODE) {
            console.log('[CV-Upload] Service initialisiert mit:', {
                apiUrl: API_BASE_URL,
                mockEnabled: this.autoSwitchToMock
            });
        }
        this.checkAPIAvailability();
    }

    // Öffentliche Methoden für Mock-Data-Handling
    public useMockData(): boolean {
        return this.useMock;
    }

    public setMockData(value: boolean): void {
        this.useMock = value;
        if (CONFIG.DEBUG_MODE) {
            console.log(`[CV-Upload] Mock-Modus ${value ? 'aktiviert' : 'deaktiviert'}`);
        }
    }

    public toggleMockData(): boolean {
        this.useMock = !this.useMock;
        if (CONFIG.DEBUG_MODE) {
            console.log(`[CV-Upload] Mock-Modus ${this.useMock ? 'aktiviert' : 'deaktiviert'}`);
        }
        return this.useMock;
    }

    // API-Test-Methode
    public async testApiConnection(): Promise<{ status: string; message?: string }> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/cv-upload/health`, {
                timeout: CONFIG.API_TIMEOUT / 2
            });
            return {
                status: 'success',
                message: 'API ist erreichbar'
            };
        } catch (error) {
            console.error('[CV-Upload] API-Test fehlgeschlagen:', error);
            return {
                status: 'error',
                message: 'API ist nicht erreichbar'
            };
        }
    }

    // CV-Upload-Methode
    public async uploadCV(file: File, tenantId?: string): Promise<any> {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                success: true,
                message: 'CV erfolgreich hochgeladen (MOCK)',
                cv_id: 'mock-cv-' + Date.now(),
                employee_id: 'mock-emp-' + Date.now()
            };
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (tenantId) {
                formData.append('tenant_id', tenantId);
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/cv-upload/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: CONFIG.API_TIMEOUT
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('[CV-Upload] Upload-Fehler:', error);
            
            if (this.autoSwitchToMock) {
                console.log('[CV-Upload] Fallback auf Mock-Daten');
                return {
                    success: true,
                    message: 'CV erfolgreich hochgeladen (MOCK - Fallback)',
                    cv_id: 'mock-cv-' + Date.now(),
                    employee_id: 'mock-emp-' + Date.now()
                };
            }
            
            throw error;
        }
    }

    private async checkAPIAvailability(): Promise<void> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/cv-upload/health`, {
                timeout: CONFIG.API_TIMEOUT / 2
            });
            this.apiChecked = true;
            this.useMock = false;
            if (CONFIG.DEBUG_MODE) {
                console.log('[CV-Upload] API verfügbar:', response.data);
            }
        } catch (error) {
            this.apiChecked = true;
            if (this.autoSwitchToMock) {
                this.useMock = true;
                console.log('[CV-Upload] API nicht erreichbar, verwende Mock-Daten');
            } else {
                console.error('[CV-Upload] API nicht erreichbar:', error);
                throw error;
            }
        }
    }

    private validateFile(file: File): void {
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            throw new Error(`Datei zu groß. Maximale Größe: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
        }
        
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!CONFIG.ALLOWED_FILE_TYPES.includes(fileExtension)) {
            throw new Error(`Ungültiger Dateityp. Erlaubte Typen: ${CONFIG.ALLOWED_FILE_TYPES.join(', ')}`);
        }
    }

    public async extractPreview(file: File): Promise<any> {
        if (CONFIG.DEBUG_MODE) {
            console.log('extractPreview:', file.name);
        }
        const startTime = performance.now();

        try {
            this.validateFile(file);

            if (!this.apiChecked) {
                await this.checkAPIAvailability();
            }

            if (this.useMock) {
                await new Promise(resolve => setTimeout(resolve, 500));
                return {
                    success: true,
                    message: 'Daten erfolgreich extrahiert (MOCK)',
                    extracted_data: mockExtractedData,
                    text_sample: "Dies ist ein Beispieltext aus dem Lebenslauf... (MOCK)"
                };
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${API_BASE_URL}/api/cv-upload/extract`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: CONFIG.API_TIMEOUT
                }
            );

            if (CONFIG.DEBUG_MODE) {
                const endTime = performance.now();
                console.log(`extractPreview: ${endTime - startTime} ms`);
            }

            return response.data;
        } catch (error: any) {
            console.error('[CV-Upload] Extraktionsfehler:', error);

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    throw new Error(error.response.data.error || 'Serverfehler bei der Extraktion');
                } else if (error.request) {
                    if (this.autoSwitchToMock) {
                        console.log('[CV-Upload] API nicht erreichbar, verwende Mock-Daten');
                        return {
                            success: true,
                            message: 'Daten erfolgreich extrahiert (MOCK - Fallback)',
                            extracted_data: mockExtractedData,
                            text_sample: "Dies ist ein Beispieltext aus dem Lebenslauf... (MOCK)"
                        };
                    }
                    throw new Error('Server nicht erreichbar');
                }
            }
            throw error;
        }
    }

    public async debugExtraction(file: File): Promise<any> {
        try {
            this.validateFile(file);

            if (this.useMock) {
                return {
                    mock: true,
                    data: mockExtractedData,
                    config: {
                        apiUrl: API_BASE_URL,
                        mockEnabled: this.autoSwitchToMock,
                        debug: CONFIG.DEBUG_MODE,
                        useMock: this.useMock
                    }
                };
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${API_BASE_URL}/api/cv-upload/debug`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: CONFIG.API_TIMEOUT
                }
            );

            return response.data;
        } catch (error) {
            console.error('[CV-Upload] Debug-Fehler:', error);
            throw error;
        }
    }
}

export default new CVUploadService(); 