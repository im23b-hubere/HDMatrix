"use client"

import React from 'react';
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

function App() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

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
              <Route path="*" element={isLoggedIn ? <NotFoundPage /> : <Navigate to="/login" />} />
            </Route>

            {/* Protected routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/cvs/:id" element={isLoggedIn ? <CVDetailPage /> : <Navigate to="/login" />} />
              <Route path="/cvs/edit/:id" element={isLoggedIn ? <CVEditPage /> : <Navigate to="/login" />} />
              <Route path="/cvs/new" element={isLoggedIn ? <CVEditPage /> : <Navigate to="/login" />} />
              <Route path="/employees" element={isLoggedIn ? <EmployeesPage /> : <Navigate to="/login" />} />
              <Route path="/settings" element={isLoggedIn ? <SettingsPage /> : <Navigate to="/login" />} />
              <Route path="/search" element={isLoggedIn ? <SearchPage /> : <Navigate to="/login" />} />
            </Route>
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
