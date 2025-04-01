import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Search, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatabaseService } from '../services/db-service';
import { OllamaService } from '../services/ollama-service';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([{
        role: 'assistant',
        content: `Willkommen bei TalentBridge! Ich bin Ihr KI-Assistent für die Mitarbeitersuche. Sie können mich zum Beispiel fragen:

• "Wer hat Erfahrung mit Python?"
• "Zeige mir alle Mitarbeiter aus der IT-Abteilung"
• "Wer kann mir bei React helfen?"
• "Suche nach Mitarbeitern mit Scrum-Erfahrung"`,
        timestamp: new Date()
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        console.log('Verarbeite Benutzereingabe:', userMessage);
        setInput('');
        setIsLoading(true);

        // Füge die Benutzernachricht hinzu
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        }]);

        try {
            // Extrahiere den Suchbegriff aus der Frage
            let searchQuery = userMessage;
            if (userMessage.toLowerCase().includes('python')) {
                searchQuery = 'Python';
            } else if (userMessage.toLowerCase().includes('react')) {
                searchQuery = 'React';
            } else if (userMessage.toLowerCase().includes('scrum')) {
                searchQuery = 'Scrum';
            } else if (userMessage.toLowerCase().includes('it-abteilung')) {
                searchQuery = 'IT';
            }
            
            console.log('Extrahierter Suchbegriff:', searchQuery);
            
            // Suche nach relevanten Mitarbeitern
            console.log('Sende Suchanfrage an DatabaseService:', searchQuery);
            const searchResult = await DatabaseService.searchEmployees(searchQuery);
            console.log('Suchergebnis von DatabaseService:', searchResult);
            
            if (!searchResult.employees || searchResult.employees.length === 0) {
                console.log('Keine Mitarbeiter gefunden');
            } else {
                console.log(`${searchResult.employees.length} Mitarbeiter gefunden`);
            }
            
            // Generiere eine Antwort basierend auf den gefundenen Mitarbeitern
            console.log('Sende Anfrage an OllamaService');
            const response = await OllamaService.queryWithEmployeeData(
                userMessage,
                searchResult.employees
            );
            console.log('Antwort von OllamaService:', response);

            // Füge die Assistentenantwort hinzu
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response,
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error('Fehler bei der Verarbeitung:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Entschuldigung, es gab ein technisches Problem bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es erneut.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto p-4">
            <Card className="flex-grow overflow-y-auto mb-4 p-4">
                <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`flex items-start space-x-2 mb-4 ${
                                message.role === 'assistant' ? 'bg-muted/50 rounded-lg p-3' : ''
                            }`}
                        >
                            {message.role === 'assistant' ? (
                                <Bot className="w-6 h-6 mt-1 text-blue-500" />
                            ) : (
                                <User className="w-6 h-6 mt-1 text-gray-500" />
                            )}
                            <div className="flex-grow">
                                <div className="whitespace-pre-wrap">{message.content}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </Card>

            <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Stellen Sie eine Frage..."
                    disabled={isLoading}
                    className="flex-grow"
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </Button>
            </form>
        </div>
    );
}
