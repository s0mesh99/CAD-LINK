import { useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardOverview } from './pages/Dashboard';
import { LeadsOverview } from './pages/Leads';
import { LoginScreen } from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<'scrapers' | 'leads'>('scrapers');

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab} onLogout={() => setIsAuthenticated(false)}>
      {currentTab === 'scrapers' ? <DashboardOverview /> : <LeadsOverview />}
    </Layout>
  );
}

export default App;
