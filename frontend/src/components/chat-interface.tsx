import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { OllamaService } from '../services/ollama-service';
import { DatabaseService } from '../services/db-service';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        // Füge Benutzernachricht hinzu
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            // Suche zuerst in der Datenbank nach relevanten Mitarbeitern
            const employeeResults = await DatabaseService.searchEmployees(userMessage);
            let response: string;

            if (employeeResults.employees.length > 0) {
                // Wenn Mitarbeiter gefunden wurden, nutze diese für die Antwort
                response = await OllamaService.queryWithEmployeeData(userMessage, employeeResults.employees);
            } else {
                // Wenn keine spezifischen Daten gefunden wurden, generiere eine allgemeine Antwort
                response = await OllamaService.generateResponse(userMessage);
            }

            // Füge Assistentenantwort hinzu
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Willkommen beim TalentBridge Assistenten!</p>
                        <p className="text-sm mt-2">
                            Sie können Fragen zu Mitarbeitern, deren Fähigkeiten und Projekten stellen.
                            Zum Beispiel:
                        </p>
                        <ul className="text-sm mt-2 space-y-1">
                            <li>"Welche Mitarbeiter haben Erfahrung mit Python?"</li>
                            <li>"In welcher Abteilung arbeitet Max Mustermann?"</li>
                            <li>"Zeige mir alle Entwickler im Unternehmen."</li>
                        </ul>
                    </div>
                )}
                {messages.map((message, index) => (
                    <Card key={index} className={`p-4 ${
                        message.role === 'user' ? 'bg-primary/10 ml-12' : 'bg-secondary/10 mr-12'
                    }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </Card>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Stellen Sie eine Frage zu Ihren Mitarbeitern..."
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Lädt...' : 'Senden'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
