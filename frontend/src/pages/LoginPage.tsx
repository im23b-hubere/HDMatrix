import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LoginOutlined as LoginIcon
} from '@mui/icons-material';
import authService, { LoginCredentials } from '../services/authService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Einfache Validierung
    if (!email || !password) {
      setErrorMsg('Bitte füllen Sie alle Felder aus.');
      return;
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }

    setLoading(true);
    console.log('Login-Handler gestartet', { email });

    try {
      const credentials: LoginCredentials = { email, password };
      
      // Debug-Ausgabe in der Konsole
      console.log('Sende Login-Anfrage mit:', { email, passwordLength: password.length });
      
      // Login-Anfrage senden
      const response = await authService.login(credentials);
      console.log('Login-Antwort erhalten:', response);
      
      if (response.success) {
        // Erfolgreich eingeloggt
        console.log('Login erfolgreich, leite weiter...');
        
        // Um sicherzustellen, dass der Login funktioniert, setzen wir ein Debug-Element
        const debugElement = document.createElement('div');
        debugElement.id = 'login-success-debug';
        debugElement.style.position = 'fixed';
        debugElement.style.bottom = '10px';
        debugElement.style.right = '10px';
        debugElement.style.backgroundColor = 'green';
        debugElement.style.color = 'white';
        debugElement.style.padding = '10px';
        debugElement.style.zIndex = '10000';
        debugElement.textContent = 'Login erfolgreich!';
        document.body.appendChild(debugElement);
        
        // Weiterleitung über window.location.href statt navigate() um Neuladen der App zu erzwingen
        setTimeout(() => {
          console.log('Weiterleitung zum Dashboard...');
          window.location.href = '/dashboard';
        }, 500);
      } else {
        // Fehlermeldung anzeigen
        console.error('Login fehlgeschlagen:', response.message);
        setErrorMsg(response.message || 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      setErrorMsg('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Grid 
      container 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <Grid 
        item 
        xs={12} 
        sm={8} 
        md={6} 
        lg={4} 
        sx={{ 
          margin: 'auto',
          px: 2,
          py: { xs: 4, sm: 6 }
        }}
      >
        <Paper 
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}
        >
          <Box 
            component="form" 
            onSubmit={handleLogin}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 3
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                HR Matrix
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" mt={1}>
                Melden Sie sich mit Ihren Zugangsdaten an
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
                {errorMsg}
              </Alert>
            )}

            <TextField
              fullWidth
              label="E-Mail-Adresse"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="beispiel@firma.de"
              autoComplete="email"
              required
            />

            <TextField
              fullWidth
              label="Passwort"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              autoComplete="current-password"
              required
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Passwort vergessen?
                </Typography>
              </Link>
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{ 
                py: 1.5,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Demo-Zugang
              </Typography>
            </Divider>

            <Box sx={{ backgroundColor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" mb={1}>
                Für Testzwecke können Sie diese Anmeldedaten verwenden:
              </Typography>
              <Typography variant="body2" component="div">
                <Box component="span" fontWeight="bold">E-Mail:</Box> admin@example.com
              </Typography>
              <Typography variant="body2">
                <Box component="span" fontWeight="bold">Passwort:</Box> admin123
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Noch kein Konto?{' '}
                <Link to="/register" style={{ textDecoration: 'none', color: 'primary.main', fontWeight: 'bold' }}>
                  Registrieren
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default LoginPage; 