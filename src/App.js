import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import ArtifactGallery from './pages/ArtifactGallery';
import CreateArtifact from './pages/CreateArtifact';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onComplete={() => setCurrentPage('gallery')} />;
      case 'gallery':
        return <ArtifactGallery />;
      case 'create':
        return <CreateArtifact onArtifactCreated={() => setCurrentPage('gallery')} />;
      default:
        return <LandingPage onComplete={() => setCurrentPage('gallery')} />;
    }
  };

  return (
    <div className="app">
      <Header onNavigate={setCurrentPage} />
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

export default App;