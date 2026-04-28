import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { IssueListPage, IssueDetailPage } from './components/issues';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/issues" replace />} />
        <Route path="/issues" element={<IssueListPage />} />
        <Route path="/issues/:id" element={<IssueDetailPage />} />

        <Route
          path="/report"
          element={<div style={{ padding: '2rem' }}>Report Issue — Feature 2 (แฮม)</div>}
        />
        <Route
          path="/login"
          element={<div style={{ padding: '2rem' }}>Login — Feature 1 (มิว)</div>}
        />
        <Route
          path="/register"
          element={<div style={{ padding: '2rem' }}>Register — Feature 1 (มิว)</div>}
        />
        <Route
          path="/dashboard"
          element={<div style={{ padding: '2rem' }}>Dashboard — Feature 5 (ไผ่)</div>}
        />
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