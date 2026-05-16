import React, { useState, useEffect } from 'react';
import { PublicLayout } from './PublicLayout';
import { PublicHomePage } from './PublicHomePage';
import { PublicFeaturesPage } from './PublicFeaturesPage';
import { PublicPricingPage } from './PublicPricingPage';
import { PublicContactPage } from './PublicContactPage';

interface PublicSiteProps {
  onLogin: () => void;
}

export const PublicSite = ({ onLogin }: PublicSiteProps) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <PublicHomePage onNavigate={navigate} />;
      case '/funcionalidades':
        return <PublicFeaturesPage onNavigate={navigate} />;
      case '/precos':
        return <PublicPricingPage onNavigate={navigate} />;
      case '/contato':
        return <PublicContactPage />;
      default:
        // Redireciona rota inválida para home
        window.history.replaceState({}, '', '/');
        if (currentPath !== '/') {
           setTimeout(() => setCurrentPath('/'), 0);
        }
        return <PublicHomePage onNavigate={navigate} />;
    }
  };

  useEffect(() => {
    // Dynamic document title based on current path
    const titles: Record<string, string> = {
      '/': 'Gestifique — Gestão de tickets e atendimento',
      '/funcionalidades': 'Funcionalidades | Gestifique',
      '/precos': 'Preços | Gestifique',
      '/contato': 'Contato | Gestifique'
    };
    document.title = titles[currentPath] || 'Gestifique';
  }, [currentPath]);

  return (
    <PublicLayout 
      onLogin={onLogin} 
      currentPath={currentPath} 
      onNavigate={navigate}
    >
      {renderContent()}
    </PublicLayout>
  );
};
