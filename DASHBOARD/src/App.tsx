import { useState } from 'react';
import { Layout } from './components/Layout';
import type { TabType } from './components/Layout';
import { DashboardOverview } from './pages/Dashboard';
import { LeadsOverview } from './pages/Leads';
import { InboxManager } from './pages/InboxManager';
import { ScraperConfig } from './pages/ScraperConfig';
import { EmailTemplates } from './pages/EmailTemplates';
import { CRMDatabase } from './pages/CRM';
import { LoginScreen } from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <DashboardOverview setCurrentTab={setCurrentTab} />;
      case 'crm': return <CRMDatabase />;
      case 'inbox': return <InboxManager />;
      case 'leads': return <LeadsOverview />;
      case 'scrapers': return <ScraperConfig />;
      case 'templates': return <EmailTemplates />;
      default: return <DashboardOverview setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab} onLogout={() => setIsAuthenticated(false)}>
      {renderContent()}
    </Layout>
  );
}

export default App;
