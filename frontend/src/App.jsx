import React from 'react';
import MainCorrector from './components/MainCorrector';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <span>🇺🇸</span>
            <span>EnglishCorrector</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="main-content">
        <MainCorrector />
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} English Corrector App. Tu compañero inteligente para mejorar tu escritura.</p>
      </footer>
    </div>
  );
}

export default App;
