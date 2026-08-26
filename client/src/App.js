import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, BookOpen, ClipboardList, Home, Menu, Moon, Sun, TrendingUp, Trophy, X } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Journal = lazy(() => import('./pages/Journal'));
const Learning = lazy(() => import('./pages/Learning'));
const LearningModule = lazy(() => import('./pages/LearningModule'));
const Rules = lazy(() => import('./pages/Rules'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Achievements = lazy(() => import('./pages/Achievements'));

function LoadingFallback() {
  return (
    <div className="page-loader">
      <div className="loader-ring">
        <div className="loader-ring-inner"></div>
      </div>
      <p>Loading...</p>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/learning/:id" element={<LearningModule />} />
            <Route path="/rules" element={<Rules />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function NavContent({ onClose }) {
  return (
    <>
      <NavLink to="/" end onClick={onClose} className="nav-link">
        <Home size={18} /> <span>Dashboard</span>
      </NavLink>
      <NavLink to="/journal" onClick={onClose} className="nav-link">
        <ClipboardList size={18} /> <span>Journal</span>
      </NavLink>
      <NavLink to="/analytics" onClick={onClose} className="nav-link">
        <BarChart3 size={18} /> <span>Analytics</span>
      </NavLink>
      <NavLink to="/achievements" onClick={onClose} className="nav-link">
        <Trophy size={18} /> <span>Achievements</span>
      </NavLink>
      <NavLink to="/learning" onClick={onClose} className="nav-link">
        <BookOpen size={18} /> <span>Learn</span>
      </NavLink>
      <NavLink to="/rules" onClick={onClose} className="nav-link">
        <TrendingUp size={18} /> <span>Rules</span>
      </NavLink>
    </>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </button>
  );
}

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="app">
        {/* Skip to main content for accessibility */}
        <a href="#main-content" className="skip-link">Skip to main content</a>

        <nav className="navbar" aria-label="Main navigation">
          <div className="nav-brand">
            <div className="nav-logo-wrapper">
              <TrendingUp size={22} className="nav-logo-icon" />
            </div>
            <span className="nav-title">SignalEngine</span>
            <span className="nav-version">v2.0</span>
          </div>

          <div className="nav-links desktop-nav">
            <NavContent onClose={() => {}} />
          </div>

          <div className="nav-actions">
            <ThemeToggle />
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="mobile-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                className="mobile-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="mobile-drawer-header">
                  <span>Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                    <X size={20} />
                  </button>
                </div>
                <div className="mobile-nav-links">
                  <NavContent onClose={() => setMobileMenuOpen(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main id="main-content" className="main-content">
          <AnimatedRoutes />
        </main>

        <footer className="app-footer">
          <p>Options Signal Engine &mdash; Educational tool for Indian markets. Not financial advice.</p>
        </footer>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
