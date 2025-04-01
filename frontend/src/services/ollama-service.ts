interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatResponse {
    message: ChatMessage;
    done: boolean;
}

interface Employee {
    id: number;
    vorname: string;
    nachname: string;
    email: string;
    position: string;
    abteilung_id: number;
    skills: string[];
}

export class OllamaService {
    private static readonly API_URL = 'http://localhost:11434/api';

    static async chat(messages: ChatMessage[]): Promise<string> {
        try {
            const response = await fetch(`${this.API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'mistral',
                    messages,
                    stream: false
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.message.content;
        } catch (error) {
            console.error('Error in chat:', error);
            throw error;
        }
    }

    static async generateResponse(userQuery: string, context?: string): Promise<string> {
        const messages: ChatMessage[] = [];
        
        if (context) {
            messages.push({
                role: 'system',
                content: `Du bist ein hilfreicher Assistent für Personalmanagement. 
                Nutze den folgenden Kontext, um die Frage zu beantworten: ${context}`
            });
        } else {
            messages.push({
                role: 'system',
                content: `Du bist ein hilfreicher Assistent für Personalmanagement. 
                Beantworte Fragen basierend auf den verfügbaren Mitarbeiterdaten.
                Wenn du die Antwort nicht kennst, sage das ehrlich.`
            });
        }

        messages.push({
            role: 'user',
            content: userQuery
        });

        return this.chat(messages);
    }

    static async queryWithEmployeeData(query: string, employees: Employee[]): Promise<string> {
        const employeeContext = employees.map(emp => `
            Mitarbeiter: ${emp.vorname} ${emp.nachname}
            Position: ${emp.position}
            Email: ${emp.email}
            Fähigkeiten: ${emp.skills.join(', ')}
        `).join('\n');

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: `Du bist ein Personalmanagement-Assistent. 
                Nutze die folgenden Mitarbeiterdaten, um die Frage zu beantworten:
                
                ${employeeContext}
                
                Antworte präzise und professionell. Wenn die Antwort nicht in den Daten gefunden werden kann, sage das ehrlich.`
            },
            {
                role: 'user',
                content: query
            }
        ];

        return this.chat(messages);
    }

    static async searchInPDFs(query: string, pdfContent: string): Promise<string> {
        const systemPrompt = `Du bist ein Assistent, der Informationen aus PDFs analysiert. 
        Nutze den folgenden PDF-Inhalt, um die Frage zu beantworten. 
        Wenn die Antwort nicht im PDF-Inhalt gefunden werden kann, sage das ehrlich.
        
        PDF-Inhalt:
        ${pdfContent}`;

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: query
            }
        ];

        return this.chat(messages);
    }
} 