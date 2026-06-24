import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CorrectorPage from './pages/CorrectorPage';
import VideoPage from './pages/VideoPage';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="app-title-nav-group">
              <NavLink to="/" className="app-title" style={{ textDecoration: 'none' }}>
                <span>🇺🇸</span>
                <span>Inglés al Grano</span>
              </NavLink>
              
              <nav className="header-nav">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  end
                >
                  Corrector de Escritura
                </NavLink>
                <NavLink 
                  to="/video" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Práctica con Video
                </NavLink>
              </nav>
            </div>
            
            <ThemeToggle />
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<CorrectorPage />} />
            <Route path="/video" element={<VideoPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} Inglés al Grano. Tu compañero inteligente para mejorar tu inglés.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
