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
        
        const prompt = `Du bist ein fortschrittliches HR-Analyse-System mit Zugriff auf die komplette Mitarbeiterdatenbank.
        Analysiere die verfügbaren Daten intelligent und liefere tiefgehende Einblicke.

        Verfügbare Daten:
        - Mitarbeiteranzahl: ${totalEmployees}
        - Abteilungsstruktur: ${JSON.stringify(departmentCounts)}
        - Mitarbeiterdetails: ${context}

        Benutzeranfrage: "${query}"

        Analysiere verschiedene Anfragetypen:
        
        1. Kompetenzanalyse ("Wer hat die besten Python-Kenntnisse?"):
           - Bewerte Erfahrungslevel
           - Berücksichtige Projekterfahrung
           - Zeige relevante Zertifikate
           - Beispiel: "Basierend auf Projekterfahrung und Zertifikaten..."

        2. Team-Building ("Suche ein Team für ein KI-Projekt"):
           - Analysiere Kompetenzprofile
           - Vorschläge für Teamzusammensetzung
           - Berücksichtige Abteilungszugehörigkeit
           - Beispiel: "Für dieses Projekt empfehle ich..."

        3. Karriereentwicklung ("Wer könnte als Teamleiter infrage kommen?"):
           - Analysiere Führungspotenzial
           - Berücksichtige Erfahrung
           - Zeige Entwicklungsmöglichkeiten
           - Beispiel: "Basierend auf Erfahrung und Qualifikation..."

        4. Projekt-Matching ("Wer passt zu Projekt X?"):
           - Match Skills mit Projektanforderungen
           - Berücksichtige Verfügbarkeit
           - Zeige relevante Erfahrungen
           - Beispiel: "Für dieses Projekt sind folgende Mitarbeiter geeignet..."

        5. Kompetenzlücken ("Wo fehlen uns Skills?"):
           - Analysiere Skill-Matrix
           - Identifiziere Lücken
           - Vorschläge für Weiterbildung
           - Beispiel: "In folgenden Bereichen fehlen Kompetenzen..."

        Antwortstil:
        - Analytisch und fundiert
        - Datenbasiert
        - Mit konkreten Empfehlungen
        - Strukturiert und übersichtlich

        Wichtig:
        - Berücksichtige alle verfügbaren Daten
        - Analysiere Zusammenhänge
        - Gib konkrete Handlungsempfehlungen
        - Zeige Entwicklungsmöglichkeiten
        - Berücksichtige Team-Dynamiken`;

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
                        temperature: 0.3,   // Präzise für analytische Antworten
                        top_k: 40,          // Gute Abdeckung
                        top_p: 0.9,         // Fokussierte Antworten
                        num_predict: 800     // Mehr Raum für detaillierte Analysen
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