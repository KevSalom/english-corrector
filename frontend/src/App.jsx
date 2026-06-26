import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CorrectorPage from './pages/CorrectorPage';
import VideoPage from './pages/VideoPage';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-app text-text-primary transition-all duration-200">
        
        {/* Header */}
        <header className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-border-custom z-40 transition-all duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <NavLink to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-text-primary">
                <img src="/favicon.svg" alt="Inglés al Grano Logo" className="w-7 h-7 object-contain" />
                <span className="font-bold">Inglés al Grano</span>
              </NavLink>
              
              <nav className="hidden sm:flex items-center gap-1">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => `px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-brand-light text-brand font-semibold' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  end
                >
                  Corrector de Escritura
                </NavLink>
                <NavLink 
                  to="/video" 
                  className={({ isActive }) => `px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-brand-light text-brand font-semibold' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  Práctica con Video
                </NavLink>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <nav className="sm:hidden flex items-center gap-1">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => `px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-brand-light text-brand font-semibold' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  end
                >
                  Corrector
                </NavLink>
                <NavLink 
                  to="/video" 
                  className={({ isActive }) => `px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-brand-light text-brand font-semibold' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Video
                </NavLink>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 transition-all duration-200">
          <Routes>
            <Route path="/" element={<CorrectorPage />} />
            <Route path="/video" element={<VideoPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-surface border-t border-border-custom py-6 mt-12 transition-all duration-200">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-text-muted">
            <p>© {new Date().getFullYear()} Inglés al Grano. Tu compañero inteligente para mejorar tu inglés.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
