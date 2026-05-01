import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RegisterPage } from './components/auth';
import DashboardPage from './components/admin/DashboardPage';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/issues" replace />} />
        <Route
          path="/issues"
          element={<div style={{ padding: '2rem' }}>Issue List — Feature 3 (ครีม)</div>}
        />
        <Route
          path="/issues/:id"
          element={<div style={{ padding: '2rem' }}>Issue Detail — Feature 3 &amp; 4</div>}
        />
        <Route
          path="/report"
          element={<div style={{ padding: '2rem' }}>Report Issue — Feature 2 (แฮม)</div>}
        />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/register"
          element={<RegisterPage />}
        />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/admin"
          element={<div style={{ padding: '2rem' }}>Admin Panel — Feature 6 (mark)</div>}
        />
        <Route
          path="*"
          element={<div style={{ padding: '2rem' }}>404 — Page Not Found</div>}
        />
      </Routes>
    </div>
  );
}

export default App;
