import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './components/admin/AdminPage';
import { LoginPage, RegisterPage } from './components/auth';
import DashboardPage from './components/admin/DashboardPage';
import { IssueDetailPage, IssueListPage } from './components/issues';
import ReportIssuePage from './components/issues/ReportIssuePage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, requireStaff = false }) {
  const { isAuthenticated, isStaff, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireStaff && !isStaff) return <Navigate to="/issues" replace />;
  return children;
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/issues" element={<IssueListPage />} />
        <Route path="/issues/:id" element={<IssueDetailPage />} />
        <Route
          path="/report"
          element={<ProtectedRoute><ReportIssuePage /></ProtectedRoute>}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute requireStaff><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute requireStaff><AdminPage /></ProtectedRoute>}
        />
        <Route
          path="*"
          element={<div style={{ padding: '2rem' }}>404 — ไม่พบหน้าที่ต้องการ</div>}
        />
      </Routes>
    </div>
  );
}

export default App;
