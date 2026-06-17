import { useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardOverview } from './pages/Dashboard';
import { LeadsOverview } from './pages/Leads';

function App() {
  const [currentTab, setCurrentTab] = useState<'scrapers' | 'leads'>('scrapers');

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'scrapers' ? <DashboardOverview /> : <LeadsOverview />}
    </Layout>
  );
}

export default App;
