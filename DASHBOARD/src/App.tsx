import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardOverview } from './pages/Dashboard';
import { LeadsCRM } from './pages/Leads';
import { Campaigns } from './pages/Campaigns';
import { ScraperDiagnostics } from './pages/Scrapers';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/leads" element={<LeadsCRM />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/scrapers" element={<ScraperDiagnostics />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
