import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Einfache Validierung
    if (!email.trim() || !password.trim()) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Simuliere eine API-Anfrage (würde in echter Anwendung durch einen tatsächlichen API-Aufruf ersetzt)
      setTimeout(() => {
        // Einfache Demo-Anmeldedaten für Testzwecke (in echter Anwendung würde dies durch eine Backend-Authentifizierung ersetzt)
        if (email === 'admin@example.com' && password === 'password123') {
          localStorage.setItem('isLoggedIn', 'true');
          navigate('/');
        } else {
          setError('Ungültige E-Mail oder Passwort. Versuchen Sie es erneut.');
          setLoading(false);
        }
      }, 1500);
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h5" gutterBottom fontWeight="500">
        Anmelden
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Melden Sie sich an, um auf Ihr Konto zuzugreifen
      </Typography>
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="E-Mail Adresse"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mt: 3 }}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Passwort"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleTogglePasswordVisibility}
                edge="end"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <Box sx={{ textAlign: 'right', mt: 1 }}>
        <Link href="#" variant="body2" underline="hover">
          Passwort vergessen?
        </Link>
      </Box>
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        startIcon={<LoginIcon />}
        sx={{
          mt: 3,
          mb: 2,
          py: 1.2,
          fontWeight: 600,
          boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
          '&:hover': {
            boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
          },
        }}
      >
        {loading ? 'Anmeldung läuft...' : 'Anmelden'}
      </Button>
      
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Neu bei HRMatrix?
        </Typography>
      </Divider>
      
      <Button
        fullWidth
        variant="outlined"
        onClick={() => navigate('/register')}
        sx={{
          py: 1.2,
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        }}
      >
        Konto erstellen
      </Button>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Demo-Zugangsdaten: admin@example.com / password123
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage; 