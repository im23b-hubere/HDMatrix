import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Search, User, Bot } from 'lucide-react';
import { DatabaseService } from '../services/db-service';
import { OllamaService } from '../services/ollama-service';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hallo! Ich bin Ihr HR-Assistent. Sie können mich nach Mitarbeitern und deren Fähigkeiten fragen. Zum Beispiel:\n\n' +
                    '• "Wer hat Erfahrung mit Python?"\n' +
                    '• "Zeige mir alle Java-Entwickler"\n' +
                    '• "Wer arbeitet im Marketing?"\n' +
                    '• "Welche Mitarbeiter kennen sich mit SAP aus?"',
            timestamp: new Date()
        }
    ]);
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
        <div className="container mx-auto px-4 py-2 h-screen flex items-start pt-4">
            <div className="flex flex-col w-full max-w-3xl h-[550px] bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-2 rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg font-semibold text-gray-900">TalentBridge Assistant</h1>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
                    <AnimatePresence initial={false}>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className={`flex items-start gap-2 ${
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="flex-shrink-0">
                                        <Bot className="w-7 h-7 text-blue-600 bg-blue-50 rounded-full p-1" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border border-gray-200 shadow-sm'
                                }`}>
                                    <div className="whitespace-pre-wrap text-[14px] leading-relaxed">{message.content}</div>
                                    <div className={`text-[10px] mt-1 ${
                                        message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                        {message.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                                {message.role === 'user' && (
                                    <div className="flex-shrink-0">
                                        <User className="w-7 h-7 text-white bg-blue-600 rounded-full p-1" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <div className="border-t border-gray-200 bg-white px-4 py-2 rounded-b-lg">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Fragen Sie nach Mitarbeitern..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-[14px]"
                                disabled={isLoading}
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-[14px] ${
                                isLoading || !input.trim()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Senden</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
