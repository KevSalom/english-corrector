import React, { useState } from 'react';
import MainCorrector from './components/MainCorrector';
import VideoPracticer from './components/VideoPracticer';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [activeView, setActiveView] = useState('corrector');

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title-nav-group">
            <div className="app-title" onClick={() => setActiveView('corrector')} style={{ cursor: 'pointer' }}>
              <span>🇺🇸</span>
              <span>Inglés al Grano</span>
            </div>
            
            <nav className="header-nav">
              <button 
                className={`nav-link ${activeView === 'corrector' ? 'active' : ''}`}
                onClick={() => setActiveView('corrector')}
              >
                Corrector de Escritura
              </button>
              <button 
                className={`nav-link ${activeView === 'video' ? 'active' : ''}`}
                onClick={() => setActiveView('video')}
              >
                Práctica con Video
              </button>
            </nav>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      <main className="main-content">
        {activeView === 'corrector' ? <MainCorrector /> : <VideoPracticer />}
      </main>


      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Inglés al Grano. Tu compañero inteligente para mejorar tu inglés.</p>
      </footer>
    </div>
  );
}

export default App;
