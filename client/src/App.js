import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SignalDetail from './pages/SignalDetail';
import Learning from './pages/Learning';
import LearningModule from './pages/LearningModule';
import Rules from './pages/Rules';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <span className="nav-logo">📊</span>
            <span className="nav-title">Options Signal Engine</span>
          </div>
          <div className="nav-links">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/learning">Learning</NavLink>
            <NavLink to="/rules">Trading Rules</NavLink>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/signal/:symbol" element={<SignalDetail />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/learning/:id" element={<LearningModule />} />
            <Route path="/rules" element={<Rules />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
