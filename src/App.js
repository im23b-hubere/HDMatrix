import React from 'react';
import { ThemeProvider } from './components/theme-provider';
import EmployeeSearch from './components/employee-search';
import ChatInterface from './components/chat-interface';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6 px-4">
          <h1 className="text-4xl font-bold mb-8 text-center">TalentBridge</h1>
          <div className="grid gap-6 md:grid-cols-2">
            <EmployeeSearch />
            <ChatInterface />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
