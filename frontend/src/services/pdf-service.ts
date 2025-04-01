export class PDFService {
    private static readonly API_URL = '/api';  // Ihr Backend-API-Endpunkt

    static async uploadPDF(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.id; // ID des hochgeladenen Dokuments
        } catch (error) {
            console.error('Error uploading PDF:', error);
            throw error;
        }
    }

    static async getPDFContent(id: string): Promise<string> {
        try {
            const response = await fetch(`${this.API_URL}/documents/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.content;
        } catch (error) {
            console.error('Error getting PDF content:', error);
            throw error;
        }
    }

    static async searchPDFs(query: string): Promise<Array<{id: string, content: string, score: number}>> {
        try {
            const response = await fetch(`${this.API_URL}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error searching PDFs:', error);
            throw error;
        }
    }
} 