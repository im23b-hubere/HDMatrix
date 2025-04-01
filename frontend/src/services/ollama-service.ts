import { Employee } from '../types/employee';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatResponse {
    message: ChatMessage;
    done: boolean;
}

export class OllamaService {
    private static readonly API_URL = 'http://localhost:11434/api/generate';
    private static readonly MODEL = 'mistral';

    static async chat(messages: ChatMessage[]): Promise<string> {
        try {
            const response = await fetch(`${this.API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.MODEL,
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
        console.log('Verarbeite Mitarbeiterdaten für Ollama:', employees);
        const context = this.createContextFromEmployees(employees);
        console.log('Generierter Kontext:', context);
        
        const prompt = `Du bist ein hilfreicher HR-Assistent für TalentBridge. 
        Deine Aufgabe ist es, präzise Informationen über Mitarbeiter und ihre Fähigkeiten zu geben.
        
        Kontext über verfügbare Mitarbeiter:
        ${context}
        
        Benutzerfrage: "${query}"
        
        Wichtige Anweisungen:
        1. Wenn Mitarbeiter mit den gesuchten Fähigkeiten gefunden wurden:
           - Liste jeden gefundenen Mitarbeiter einzeln auf
           - Nenne bei jedem Mitarbeiter die relevanten Fähigkeiten
           - Erwähne ihre Abteilung und Position
        2. Wenn keine passenden Mitarbeiter gefunden wurden:
           - Sage klar "Es wurden keine Mitarbeiter mit [gesuchte Fähigkeit] gefunden"
           - Füge KEINE weiteren Erklärungen oder Vorschläge hinzu
        3. Beziehe dich AUSSCHLIESSLICH auf die Informationen aus dem gegebenen Kontext
        4. Erfinde KEINE Informationen oder Mitarbeiter
        5. Formatiere die Antwort übersichtlich mit Aufzählungspunkten
        6. Antworte immer auf Deutsch und in einem professionellen Ton
        7. Gib KEINE Empfehlungen oder Vorschläge, wenn keine Mitarbeiter gefunden wurden
        
        Format der Antwort bei gefundenen Mitarbeitern:
        Ich habe [Anzahl] Mitarbeiter mit [gesuchte Fähigkeit] gefunden:

        • [Vorname] [Nachname] ([Abteilung])
          - Position: [Position]
          - Relevante Fähigkeiten: [spezifische Fähigkeiten]
          - Kontakt: [Email]

        [Wiederhole für jeden weiteren Mitarbeiter]`;

        try {
            console.log('Sende Prompt an Ollama:', prompt);
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    prompt: prompt,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Ollama Antwort:', data.response);
            return data.response;
        } catch (error) {
            console.error('Error querying Ollama:', error);
            throw error;
        }
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

    private static createContextFromEmployees(employees: Employee[]): string {
        if (employees.length === 0) {
            return 'Keine Mitarbeiter mit den gesuchten Kriterien gefunden.';
        }

        return employees.map(emp => {
            const department = this.getDepartmentName(emp.abteilung_id);
            return `
            Mitarbeiter: ${emp.vorname} ${emp.nachname}
            Position: ${emp.position || 'Nicht angegeben'}
            Abteilung: ${department}
            E-Mail: ${emp.email}
            Fähigkeiten: ${emp.skills.join(', ')}
            `;
        }).join('\n');
    }

    private static getDepartmentName(departmentId: number): string {
        const departments: Record<number, string> = {
            1: 'IT & Entwicklung',
            2: 'Data Science & KI',
            3: 'Design & Kreativ',
            4: 'Marketing & Kommunikation',
            5: 'Projektmanagement',
            6: 'Personal & HR',
            7: 'Finanzen & Controlling',
            8: 'Qualität & Compliance'
        };
        return departments[departmentId] || 'Unbekannte Abteilung';
    }
} 