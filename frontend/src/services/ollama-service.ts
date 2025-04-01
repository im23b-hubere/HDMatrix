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
        const totalEmployees = employees.length;
        const departmentCounts = this.getDepartmentCounts(employees);
        
        console.log('Generierter Kontext:', context);
        
        const prompt = `Du bist ein freundlicher und kompetenter HR-Assistent. Antworte natürlich und hilfreich auf alle Fragen.
        Verstehe auch informelle oder unvollständige Fragen und liefere relevante Informationen.

        Verfügbare Daten:
        - Mitarbeiteranzahl: ${totalEmployees}
        - Abteilungsstruktur: ${JSON.stringify(departmentCounts)}
        - Mitarbeiterdetails: ${context}

        Benutzeranfrage: "${query}"

        Verstehe verschiedene Fragetypen:
        
        1. Allgemeine Fragen ("Wieviele Mitarbeiter haben wir?", "Welche Abteilungen gibt es?"):
           - Gib einen kurzen Überblick
           - Nenne relevante Zahlen
           - Beispiel: "Aktuell beschäftigen wir 23 Mitarbeiter in 8 Abteilungen..."

        2. Spezifische Mitarbeitersuchen ("Wer kennt sich mit Python aus?"):
           - Liste passende Mitarbeiter
           - Zeige relevante Fähigkeiten
           - Nenne Abteilungen
           - Beispiel: "2 Mitarbeiter haben Python-Kenntnisse..."

        3. Kontaktanfragen ("Email von Max", "Wie erreiche ich Anna?"):
           - Zeige alle verfügbaren Kontaktdaten
           - Nenne Position und Abteilung
           - Beispiel: "Hier sind die Kontaktdaten von Max..."

        4. Abteilungsfragen ("Wer ist in der IT?", "Welche Skills hat Marketing?"):
           - Liste Mitarbeiter der Abteilung
           - Zeige Hauptkompetenzen
           - Beispiel: "In der IT-Abteilung arbeiten..."

        5. Skill-basierte Fragen ("Wer kann SAP?", "Suche JavaScript Entwickler"):
           - Zeige Mitarbeiter mit passenden Skills
           - Gruppiere nach Erfahrungslevel
           - Beispiel: "Folgende Mitarbeiter haben SAP-Kenntnisse..."

        Antwortstil:
        - Freundlich und natürlich
        - Klar strukturiert
        - Direkt und informativ
        - Bei Bedarf mit Vorschlägen für weitere relevante Informationen

        Wichtig:
        - Verstehe auch informelle Fragen
        - Erkenne Namen auch bei Tippfehlern
        - Biete bei unklaren Fragen Präzisierung an
        - Verknüpfe zusammenhängende Informationen sinnvoll
        - Gib bei Mitarbeitersuchen immer Abteilung und Position an`;

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
                    options: {
                        temperature: 0.4,   // Etwas flexibler für natürlichere Antworten
                        top_k: 40,          // Mehr Variabilität
                        top_p: 0.9,         // Gute Balance
                        num_predict: 500     // Ausreichend für detaillierte Antworten
                    }
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

    private static getDepartmentName(departmentId: number, position?: string): string {
        const departments: Record<number, string> = {
            1: 'IT & Entwicklung',
            2: 'Data Science',
            3: 'Design',
            4: 'Marketing',
            5: 'Projektmanagement',
            6: 'Personal',
            7: 'Finanzen',
            8: 'Qualitätsmanagement',
            9: 'Vertrieb',
            10: 'Forschung & Entwicklung'
        };
        
        // Wenn keine Abteilung zugewiesen ist, ordnen wir Entwickler der IT-Abteilung zu
        if (!departmentId && position && this.isITRole(position)) {
            return departments[1];
        }
        
        return departments[departmentId] || departments[1]; // Default: IT & Entwicklung
    }

    private static isITRole(position: string): boolean {
        if (!position) return false;
        
        const itPositions = [
            'entwickler',
            'developer',
            'software',
            'programmer',
            'programmierer',
            'engineer',
            'architekt',
            'consultant'
        ];
        
        return itPositions.some(title => 
            position.toLowerCase().includes(title.toLowerCase())
        );
    }

    private static createContextFromEmployees(employees: Employee[]): string {
        if (employees.length === 0) {
            return 'Keine Mitarbeiter mit den gesuchten Kriterien gefunden.';
        }

        return employees.map(emp => {
            // Bestimme die Abteilung basierend auf Position und Skills
            const department = this.getDepartmentName(emp.abteilung_id, emp.position);
            
            return `
            Mitarbeiter: ${emp.vorname} ${emp.nachname}
            Position: ${emp.position || 'Nicht angegeben'}
            Abteilung: ${department}
            E-Mail: ${emp.email}
            Fähigkeiten: ${emp.skills.join(', ')}
            `;
        }).join('\n');
    }

    private static getDepartmentCounts(employees: Employee[]): Record<string, number> {
        const counts: Record<string, number> = {};
        employees.forEach(emp => {
            const dept = this.getDepartmentName(emp.abteilung_id, emp.position);
            counts[dept] = (counts[dept] || 0) + 1;
        });
        return counts;
    }
} 