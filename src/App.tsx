import React from 'react';
import { ThemeProvider } from './components/theme-provider';
import Dashboard from './components/dashboard';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Dashboard />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
