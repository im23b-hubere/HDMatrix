import React from 'react';
import { EmployeeSearch } from './employee-search';
import { ChatInterface } from './chat-interface';

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">TalentBridge</h1>
      
      <div className="space-y-8">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Employee Search</h2>
          <EmployeeSearch />
        </div>

        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Chat with TalentBridge</h2>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
