import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Tab,
  Tabs
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Brightness4 as DarkModeIcon,
  BrightnessHigh as LightModeIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  
  // Allgemeine Einstellungen
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('de');
  
  // Benachrichtigungseinstellungen
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  
  // Sicherheitseinstellungen
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  
  // Kontoeinstellungen
  const [fullName, setFullName] = useState('Max Mustermann');
  const [email, setEmail] = useState('max.mustermann@example.com');
  const [phone, setPhone] = useState('+49 123 456789');
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value);
  };
  
  const handleFullNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(event.target.value);
  };
  
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };
  
  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(event.target.value);
  };
  
  const saveSettings = () => {
    // In einer echten Anwendung würden hier die Einstellungen gespeichert werden
    console.log('Einstellungen gespeichert', {
      darkMode,
      language,
      emailNotifications,
      pushNotifications,
      weeklyReports,
      twoFactorAuth,
      passwordChangeRequired,
      fullName,
      email,
      phone
    });
    
    // Erfolgsmeldung zeigen (in einer echten Anwendung)
    alert('Einstellungen erfolgreich gespeichert');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="medium">
        Einstellungen
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Verwalten Sie Ihre Anwendungseinstellungen und Kontodetails
      </Typography>
      
      <Card sx={{ borderRadius: 2, mb: 4, overflow: 'visible' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<PaletteIcon fontSize="small" />} 
            label="Allgemein" 
            {...a11yProps(0)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            icon={<NotificationsIcon fontSize="small" />} 
            label="Benachrichtigungen" 
            {...a11yProps(1)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            icon={<SecurityIcon fontSize="small" />} 
            label="Sicherheit" 
            {...a11yProps(2)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            icon={<AccountIcon fontSize="small" />} 
            label="Konto" 
            {...a11yProps(3)} 
            sx={{ textTransform: 'none' }}
          />
        </Tabs>
        
        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <Typography variant="h6" gutterBottom>
                Allgemeine Einstellungen
              </Typography>
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {darkMode ? 
                        <DarkModeIcon sx={{ mr: 1, color: theme.palette.primary.main }} /> : 
                        <LightModeIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                      }
                      <Typography>Dunkles Design</Typography>
                    </Box>
                  }
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 7, mt: 0.5 }}>
                  Ändern Sie das Erscheinungsbild der Benutzeroberfläche
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="language-select-label">Sprache</InputLabel>
                  <Select
                    labelId="language-select-label"
                    id="language-select"
                    value={language}
                    onChange={handleLanguageChange}
                    label="Sprache"
                    startAdornment={<LanguageIcon sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="en">Englisch</MenuItem>
                    <MenuItem value="fr">Französisch</MenuItem>
                    <MenuItem value="es">Spanisch</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1, mt: 0.5 }}>
                  Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche
                </Typography>
              </Box>
            </Stack>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Benachrichtigungseinstellungen
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon color={emailNotifications ? "primary" : "disabled"} />
                </ListItemIcon>
                <ListItemText 
                  primary="E-Mail-Benachrichtigungen" 
                  secondary="Erhalten Sie wichtige Updates per E-Mail" 
                />
                <Switch
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  color="primary"
                />
              </ListItem>
              
              <Divider variant="inset" component="li" />
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon color={pushNotifications ? "primary" : "disabled"} />
                </ListItemIcon>
                <ListItemText 
                  primary="Push-Benachrichtigungen" 
                  secondary="Erhalten Sie Echtzeit-Benachrichtigungen im Browser" 
                />
                <Switch
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  color="primary"
                />
              </ListItem>
              
              <Divider variant="inset" component="li" />
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon color={weeklyReports ? "primary" : "disabled"} />
                </ListItemIcon>
                <ListItemText 
                  primary="Wöchentliche Berichte" 
                  secondary="Erhalten Sie wöchentliche Zusammenfassungen der Aktivitäten" 
                />
                <Switch
                  checked={weeklyReports}
                  onChange={(e) => setWeeklyReports(e.target.checked)}
                  color="primary"
                />
              </ListItem>
            </List>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Sicherheitseinstellungen
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color={twoFactorAuth ? "primary" : "disabled"} />
                </ListItemIcon>
                <ListItemText 
                  primary="Zwei-Faktor-Authentifizierung" 
                  secondary="Erhöhen Sie die Sicherheit Ihres Kontos mit 2FA" 
                />
                <Switch
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  color="primary"
                />
              </ListItem>
              
              <Divider variant="inset" component="li" />
              
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color={passwordChangeRequired ? "primary" : "disabled"} />
                </ListItemIcon>
                <ListItemText 
                  primary="Regelmäßige Passwortänderung" 
                  secondary="Fordern Sie alle 90 Tage eine Passwortänderung an" 
                />
                <Switch
                  checked={passwordChangeRequired}
                  onChange={(e) => setPasswordChangeRequired(e.target.checked)}
                  color="primary"
                />
              </ListItem>
              
              <Divider variant="inset" component="li" />
              
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText primary="Passwort ändern" />
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => alert('Passwortänderung-Dialog öffnen (in einer echten Anwendung)')}
                >
                  Ändern
                </Button>
              </ListItem>
            </List>
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Kontoeinstellungen
            </Typography>
            
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Vollständiger Name"
                value={fullName}
                onChange={handleFullNameChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="E-Mail-Adresse"
                value={email}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
                type="email"
              />
              
              <TextField
                label="Telefonnummer"
                value={phone}
                onChange={handlePhoneChange}
                fullWidth
                variant="outlined"
              />
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="error" 
                  sx={{ mr: 2 }}
                  onClick={() => alert('Konto deaktivieren (in einer echten Anwendung)')}
                >
                  Konto deaktivieren
                </Button>
                <Button 
                  variant="outlined"
                  onClick={() => alert('Konto löschen (in einer echten Anwendung)')}
                >
                  Konto löschen
                </Button>
              </Box>
            </Stack>
          </TabPanel>
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={saveSettings}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 8,
            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          Einstellungen speichern
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPage; 