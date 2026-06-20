import { useState } from 'react';
import { Layout } from './components/Layout';
import type { TabType } from './components/Layout';
import { DashboardOverview } from './pages/Dashboard';
import { LeadsOverview } from './pages/Leads';
import { ScraperConfig } from './pages/ScraperConfig';
import { EmailTemplates } from './pages/EmailTemplates';
import { LoginScreen } from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('scrapers');

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'scrapers': return <DashboardOverview />;
      case 'leads': return <LeadsOverview />;
      case 'config': return <ScraperConfig />;
      case 'templates': return <EmailTemplates />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab} onLogout={() => setIsAuthenticated(false)}>
      {renderContent()}
    </Layout>
  );
}

export default App;
