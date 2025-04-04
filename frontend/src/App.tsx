"use client"

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import de from 'date-fns/locale/de';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Layouts
import MainLayout from './layouts/MainLayout';
import MinimalLayout from './layouts/MinimalLayout';

// Pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CVsPage from './pages/CVsPage';
import CVDetailPage from './pages/CVDetailPage';
import CVEditPage from './pages/CVEditPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';
import EmployeesPage from './pages/EmployeesPage';
import SearchPage from './pages/SearchPage';
import CVUploadPage from './pages/CVUploadPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem('isLoggedIn') === 'true'
  );

  // Lausche auf Änderungen im localStorage
  useEffect(() => {
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem('isLoggedIn') === 'true';
      setIsAuthenticated(loginStatus);
      console.log('Login-Status geprüft:', loginStatus);
    };

    // Initial prüfen
    checkLoginStatus();
    
    // Window storage event listener für externe Änderungen
    window.addEventListener('storage', checkLoginStatus);
    
    // Custom event für lokale Änderungen
    window.addEventListener('loginStatusChanged', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('loginStatusChanged', checkLoginStatus);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public routes */}
            <Route element={<MinimalLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={isAuthenticated ? <NotFoundPage /> : <Navigate to="/login" />} />
            </Route>

            {/* Protected routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/cvs/:id" element={isAuthenticated ? <CVDetailPage /> : <Navigate to="/login" />} />
              <Route path="/cvs/edit/:id" element={isAuthenticated ? <CVEditPage /> : <Navigate to="/login" />} />
              <Route path="/cvs/new" element={isAuthenticated ? <CVEditPage /> : <Navigate to="/login" />} />
              <Route path="/employees" element={isAuthenticated ? <EmployeesPage /> : <Navigate to="/login" />} />
              <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />} />
              <Route path="/search" element={isAuthenticated ? <SearchPage /> : <Navigate to="/login" />} />
              <Route path="/cv/upload" element={isAuthenticated ? <CVUploadPage /> : <Navigate to="/login" />} />
            </Route>
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
