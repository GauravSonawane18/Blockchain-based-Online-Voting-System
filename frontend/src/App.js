import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Elections from './pages/Elections';
import VotePage from './pages/VotePage';
import Results from './pages/Results';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Layout from './components/Layout';

const PrivateRoute = ({ children, adminOnly }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" />;
  if (adminOnly && role !== 'ADMIN') return <Navigate to="/dashboard" />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a2e', color: '#e0e0ff', border: '1px solid #2a2a4a', fontFamily: 'Space Mono, monospace', fontSize: '13px' },
        success: { iconTheme: { primary: '#00ff88', secondary: '#0a0a1f' } },
        error: { iconTheme: { primary: '#ff4466', secondary: '#0a0a1f' } }
      }} />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="elections" element={<Elections />} />
          <Route path="vote/:electionId" element={<VotePage />} />
          <Route path="results/:electionId" element={<Results />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
