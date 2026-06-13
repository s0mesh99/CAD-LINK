/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Layout from './components/Layout';
import { HeroSection, AboutSection } from './components/HeroAbout';
import { ServicesSection, ProcessSection } from './components/ServicesProcess';
import { PortfolioSection, ContactSection } from './components/PortfolioContact';

export default function App() {
  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <ProcessSection />
      <PortfolioSection />
      <ContactSection />
    </Layout>
  );
}
