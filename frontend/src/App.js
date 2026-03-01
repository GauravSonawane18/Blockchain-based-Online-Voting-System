import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Elections from './pages/Elections';
import VotePage from './pages/VotePage';
import Results from './pages/Results';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

function PrivateRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg2)',
            color: 'var(--text1)',
            border: '1px solid var(--border)',
          },
          success: { iconTheme: { primary: 'var(--accent)', secondary: '#000' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#000' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected - voter */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"        element={<Dashboard />} />
          <Route path="elections"        element={<Elections />} />
          <Route path="vote/:electionId" element={<VotePage />} />
          <Route path="results/:id"      element={<Results />} />
          <Route path="profile"          element={<Profile />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={
          <PrivateRoute adminOnly>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}