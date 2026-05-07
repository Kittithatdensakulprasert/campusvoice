import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './components/admin/AdminPage';
import { LoginPage, RegisterPage } from './components/auth';
import DashboardPage from './components/admin/DashboardPage';
import { IssueDetailPage, IssueListPage } from './components/issues';
import ReportIssuePage from './components/issues/ReportIssuePage';
import Pagination from './components/common/Pagination';
import VoteButton from './components/votes/VoteButton';
import CommentList from './components/comments/CommentList';
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
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute requireStaff><AdminPage /></ProtectedRoute>}
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
