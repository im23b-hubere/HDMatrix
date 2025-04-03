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
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

const steps = ['Persönliche Informationen', 'Kontoinformationen', 'Bestätigung'];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  
  // Formularstatus
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    position: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Löschen Sie Fehler, wenn das Feld geändert wird
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 0) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Vorname ist erforderlich';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Nachname ist erforderlich';
      }
      if (!formData.company.trim()) {
        newErrors.company = 'Unternehmen ist erforderlich';
      }
      if (!formData.position.trim()) {
        newErrors.position = 'Position ist erforderlich';
      }
    } else if (step === 1) {
      if (!formData.email.trim()) {
        newErrors.email = 'E-Mail ist erforderlich';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Ungültige E-Mail-Adresse';
      }
      
      if (!formData.password.trim()) {
        newErrors.password = 'Passwort ist erforderlich';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
      }
      
      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = 'Passwortbestätigung ist erforderlich';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Telefonnummer ist erforderlich';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) {
      return;
    }
    
    try {
      setLoading(true);
      setRegistrationError(null);
      
      // Simuliere einen API-Aufruf
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In einer echten Anwendung würde hier der API-Aufruf zur Registrierung erfolgen
      
      // Nach erfolgreicher Registrierung zur Bestätigungsseite gehen
      setActiveStep(2);
    } catch (error) {
      setRegistrationError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vorname"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nachname"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Unternehmen"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                error={!!errors.company}
                helperText={errors.company}
                required
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                error={!!errors.position}
                helperText={errors.position}
                required
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="E-Mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Telefonnummer"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Passwort"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                required
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
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Passwort bestätigen"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box 
              sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <PersonAddIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" gutterBottom>
              Registrierung erfolgreich!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Ihr Konto wurde erfolgreich erstellt. Sie können sich jetzt anmelden.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: 8,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              Zur Anmeldung
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      {registrationError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {registrationError}
        </Alert>
      )}
      
      <Typography variant="h5" gutterBottom fontWeight="500">
        Konto erstellen
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Erstellen Sie ein Konto, um HR Matrix zu nutzen
      </Typography>
      
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {renderStep(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        {activeStep > 0 && activeStep < 2 ? (
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<NavigateBeforeIcon />}
            disabled={loading}
          >
            Zurück
          </Button>
        ) : (
          <Box /> // Platzhalter für Ausrichtung
        )}
        
        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NavigateNextIcon />}
            disabled={loading}
          >
            Weiter
          </Button>
        )}
        
        {activeStep === 1 && (
          <Button
            variant="contained"
            type="submit"
            endIcon={<PersonAddIcon />}
            disabled={loading}
            sx={{
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            {loading ? 'Wird bearbeitet...' : 'Registrieren'}
          </Button>
        )}
      </Box>
      
      {activeStep < 2 && (
        <>
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Bereits registriert?
            </Typography>
          </Divider>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{
              py: 1.2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Anmelden
          </Button>
        </>
      )}
    </Box>
  );
};

export default RegisterPage; 