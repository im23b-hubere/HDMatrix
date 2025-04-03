import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import EqualizerIcon from '@mui/icons-material/Equalizer';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      title: 'Lebenslauf-Verwaltung',
      description: 'Erstellen und verwalten Sie professionelle Lebensläufe für Ihre Mitarbeiter.',
      icon: <PersonIcon sx={{ fontSize: 60 }} color="primary" />,
      route: '/cvs',
      color: theme.palette.primary.main
    },
    {
      title: 'Skill-Suche',
      description: 'Finden Sie schnell die richtigen Mitarbeiter für Ihre Projekte basierend auf Skills.',
      icon: <SearchIcon sx={{ fontSize: 60 }} color="primary" />,
      route: '/search',
      color: theme.palette.secondary.main
    },
    {
      title: 'Workflow-Management',
      description: 'Verwalten Sie Ihre Geschäftsprozesse effizient mit anpassbaren Workflows.',
      icon: <GroupWorkIcon sx={{ fontSize: 60 }} color="primary" />,
      route: '/workflows',
      color: theme.palette.error.main
    },
    {
      title: 'CV-Exporte',
      description: 'Exportieren Sie Lebensläufe in verschiedenen Formaten für Ihre Kunden.',
      icon: <AssignmentIcon sx={{ fontSize: 60 }} color="primary" />,
      route: '/cvs',
      color: theme.palette.warning.main
    },
  ];

  const additionalFeatures = [
    { 
      title: 'Dashboard', 
      description: 'Behalten Sie den Überblick mit unserem Dashboard', 
      icon: <DashboardIcon />, 
      color: theme.palette.info.main 
    },
    { 
      title: 'Projekte', 
      description: 'Verwalten Sie alle relevanten Projekte', 
      icon: <FolderSpecialIcon />, 
      color: theme.palette.success.main 
    },
    { 
      title: 'Aufgabenverwaltung', 
      description: 'Weisen Sie Aufgaben zu und verfolgen Sie deren Fortschritt', 
      icon: <FormatListBulletedIcon />, 
      color: theme.palette.error.light 
    },
    { 
      title: 'Berichte & Analysen', 
      description: 'Erstellen Sie detaillierte Berichte und Analysen', 
      icon: <EqualizerIcon />, 
      color: theme.palette.secondary.dark 
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero-Bereich */}
      <Box 
        sx={{ 
          py: { xs: 6, md: 10 }, 
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.secondary.light, 0.3)} 100%)`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          mb: 6
        }}
      >
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
            zIndex: 0
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Willkommen bei HRMatrix
          </Typography>
          <Typography 
            variant="h5" 
            color="text.secondary" 
            paragraph
            sx={{ 
              maxWidth: 700, 
              mx: 'auto',
              mb: 4
            }}
          >
            Ihr umfassendes System für HR-Management und Projekt-Ressourcen mit intelligenter Skill-Matching-Technologie
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => navigate('/cvs')}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Lebensläufe verwalten
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              size="large"
              onClick={() => navigate('/search')}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Mitarbeiter finden
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Hauptfunktionen */}
      <Typography 
        variant="h4" 
        component="h2" 
        gutterBottom
        sx={{ 
          textAlign: 'center', 
          mb: 2,
          position: 'relative',
          '&:after': {
            content: '""',
            display: 'block',
            width: '80px',
            height: '4px',
            backgroundColor: theme.palette.primary.main,
            margin: '16px auto'
          }
        }}
      >
        Hauptfunktionen
      </Typography>

      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  borderRadius: '0 0 0 120px',
                  background: alpha(feature.color, 0.1),
                  zIndex: 0
                }}
              />
              <CardActionArea 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  p: 2,
                  zIndex: 1,
                  position: 'relative'
                }}
                onClick={() => navigate(feature.route)}
              >
                <Avatar
                  sx={{
                    width: 70,
                    height: 70,
                    mb: 2,
                    bgcolor: alpha(feature.color, 0.15),
                    color: feature.color,
                    boxShadow: `0 4px 14px ${alpha(feature.color, 0.2)}`
                  }}
                >
                  {React.cloneElement(feature.icon as React.ReactElement, { 
                    sx: { fontSize: 40 },
                    style: { color: feature.color }
                  })}
                </Avatar>
                <Typography gutterBottom variant="h5" component="div" fontWeight={500}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Statistiken */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 4, 
          mb: 6, 
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
          borderRadius: 2
        }}
      >
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Systemstatistiken
        </Typography>
        <Divider sx={{ mb: 4, width: '120px', mx: 'auto', borderColor: theme.palette.primary.main, borderWidth: 2 }} />
        
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="div" color="primary" fontWeight="bold">
                248
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Mitarbeiter
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="div" color="secondary" fontWeight="bold">
                128
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Aktive Projekte
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="div" sx={{ color: theme.palette.error.main }} fontWeight="bold">
                587
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Skills erfasst
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="div" sx={{ color: theme.palette.success.main }} fontWeight="bold">
                24
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Workflows
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Weitere Funktionen */}
      <Typography 
        variant="h4" 
        component="h2" 
        gutterBottom
        sx={{ 
          textAlign: 'center', 
          mb: 4,
          position: 'relative',
          '&:after': {
            content: '""',
            display: 'block',
            width: '80px',
            height: '4px',
            backgroundColor: theme.palette.secondary.main,
            margin: '16px auto'
          }
        }}
      >
        Weitere Funktionen
      </Typography>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {additionalFeatures.map((feature, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '&:hover': {
                  boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                  transform: 'translateY(-3px)'
                }
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: alpha(feature.color, 0.1),
                  color: feature.color,
                  mr: 2
                }}
              >
                {feature.icon}
              </Avatar>
              <Box>
                <Typography variant="h6">{feature.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Hilfebereich */}
      <Box 
        sx={{ 
          textAlign: 'center',
          py: 5,
          px: 3,
          borderRadius: 4,
          backgroundImage: `linear-gradient(45deg, ${alpha(theme.palette.secondary.light, 0.2)} 0%, ${alpha(theme.palette.primary.light, 0.3)} 100%)`,
          mb: 4
        }}
      >
        <Typography variant="h5" gutterBottom>
          Brauchen Sie Hilfe?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          Unser Support-Team steht Ihnen zur Verfügung. Durchsuchen Sie unsere Dokumentation oder kontaktieren Sie uns direkt.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={() => {/* Hier könnte ein Hilfe-Dialog geöffnet werden */}}
          >
            Dokumentation ansehen
          </Button>
          <Button 
            variant="outlined"
            size="large"
          >
            Support kontaktieren
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage; 