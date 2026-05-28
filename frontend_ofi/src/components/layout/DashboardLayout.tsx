import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-void text-text-primary">
      {/* Top Navigation / Telemetry */}
      <Header />

      {/* Main App Work Area */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Panel viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface-void/35 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom telemetry line */}
      <Footer />
    </div>
  );
};
