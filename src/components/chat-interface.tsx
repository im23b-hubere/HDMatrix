import React, { useState } from 'react';

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ text: string; isUser: boolean }>>([]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    setChatHistory(prev => [...prev, { text: message, isUser: true }]);
    setMessage('');

    // TODO: Implement AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        text: "I'm here to help you find information about our employees.", 
        isUser: false 
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg max-w-[80%] ${
              msg.isUser
                ? 'ml-auto bg-blue-500 text-white'
                : 'bg-white border border-gray-300'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};
