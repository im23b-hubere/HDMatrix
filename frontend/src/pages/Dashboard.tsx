import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button, 
  Card, CardContent, CardHeader, Avatar, IconButton, 
  Divider, List, ListItem, ListItemText, ListItemAvatar,
  ListItemSecondaryAction, Chip, CircularProgress,
  LinearProgress
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  WorkOutline as WorkIcon,
  BusinessCenter as BusinessCenterIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import cvService from '../services/cvService';
import { CV } from '../types/cv';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [recentCVs, setRecentCVs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCVs: 0,
    totalEmployees: 0,
    activeProjects: 0,
    pendingCVs: 0,
    skillDistribution: [
      { category: 'Frontend', count: 24 },
      { category: 'Backend', count: 18 },
      { category: 'Datenbank', count: 14 },
      { category: 'DevOps', count: 12 },
      { category: 'UI/UX', count: 9 },
      { category: 'QA', count: 7 },
    ],
    experienceDistribution: [
      { range: '0-1 Jahre', count: 8 },
      { range: '1-2 Jahre', count: 12 },
      { range: '3-5 Jahre', count: 22 },
      { range: '5-8 Jahre', count: 15 },
      { range: '8+ Jahre', count: 9 },
    ],
    recentActivities: [
      { type: 'cv_updated', user: 'Anna Müller', date: '2023-06-15T09:24:00', message: 'CV aktualisiert' },
      { type: 'new_project', user: 'Thomas Fischer', date: '2023-06-14T14:32:00', message: 'Neues Projekt "E-Commerce Optimierung" hinzugefügt' },
      { type: 'skill_added', user: 'Julia Weber', date: '2023-06-14T11:15:00', message: 'Neue Fähigkeit "React Native" hinzugefügt' },
      { type: 'employee_added', user: 'Admin', date: '2023-06-13T16:48:00', message: 'Neuer Mitarbeiter hinzugefügt: Martin Schulz' },
      { type: 'cv_reviewed', user: 'Laura Becker', date: '2023-06-12T10:30:00', message: 'CV-Überprüfung abgeschlossen' },
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cvs = await cvService.getAllCVs();
        setRecentCVs(cvs.slice(0, 5)); // Nur die neuesten 5 anzeigen
        
        // In einer echten Anwendung würden hier auch die Statistiken geladen
        setStats(prevStats => ({
          ...prevStats,
          totalCVs: cvs.length,
          totalEmployees: cvs.length, // Annahme: 1 CV pro Mitarbeiter
          activeProjects: Math.floor(Math.random() * 15) + 5, // Zufällige Anzahl für Demo-Zwecke
          pendingCVs: Math.floor(Math.random() * 10) // Zufällige Anzahl für Demo-Zwecke
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Chart-Konfiguration für Skill-Verteilung
  const skillChartOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: stats.skillDistribution.map(item => item.category),
    },
    colors: [theme.palette.primary.main]
  };

  const skillChartSeries = [{
    name: 'Mitarbeiter',
    data: stats.skillDistribution.map(item => item.count)
  }];

  // Chart-Konfiguration für Erfahrungsverteilung
  const experienceChartOptions = {
    chart: {
      type: 'donut',
      toolbar: {
        show: false
      }
    },
    labels: stats.experienceDistribution.map(item => item.range),
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%'
        }
      }
    },
    colors: [
      theme.palette.primary.light,
      theme.palette.primary.main,
      theme.palette.primary.dark,
      theme.palette.secondary.light,
      theme.palette.secondary.main
    ],
    legend: {
      position: 'bottom'
    }
  };

  const experienceChartSeries = stats.experienceDistribution.map(item => item.count);

  // Helfer-Funktion zum Rendern von Aktivitäts-Icons
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'cv_updated':
        return <AssignmentIcon color="primary" />;
      case 'new_project':
        return <BusinessCenterIcon style={{ color: theme.palette.success.main }} />;
      case 'skill_added':
        return <SchoolIcon style={{ color: theme.palette.info.main }} />;
      case 'employee_added':
        return <PersonIcon style={{ color: theme.palette.secondary.main }} />;
      case 'cv_reviewed':
        return <WorkIcon color="primary" />;
      default:
        return <EmailIcon color="action" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={() => window.location.reload()}
          variant="outlined"
        >
          Aktualisieren
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Statistik-Karten */}
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  bgcolor: 'primary.main' 
                }} 
              />
              <Typography variant="overline" color="text.secondary">
                Gesamt Lebensläufe
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {stats.totalCVs}
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 48,
                    height: 48
                  }}
                >
                  <AssignmentIcon />
                </Avatar>
              </Box>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                  <span>+{Math.floor(Math.random() * 10)}% im letzten Monat</span>
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  bgcolor: 'secondary.main' 
                }} 
              />
              <Typography variant="overline" color="text.secondary">
                Mitarbeiter
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {stats.totalEmployees}
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: 'secondary.main',
                    width: 48,
                    height: 48
                  }}
                >
                  <PeopleIcon />
                </Avatar>
              </Box>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                  <span>+{Math.floor(Math.random() * 5)}% im letzten Monat</span>
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  bgcolor: 'success.main' 
                }} 
              />
              <Typography variant="overline" color="text.secondary">
                Aktive Projekte
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {stats.activeProjects}
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    width: 48,
                    height: 48
                  }}
                >
                  <BusinessCenterIcon />
                </Avatar>
              </Box>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                  <span>+{Math.floor(Math.random() * 20)}% im letzten Monat</span>
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  bgcolor: 'warning.main' 
                }} 
              />
              <Typography variant="overline" color="text.secondary">
                Zu prüfende Lebensläufe
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {stats.pendingCVs}
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: 'warning.main',
                    width: 48,
                    height: 48
                  }}
                >
                  <AssignmentIcon />
                </Avatar>
              </Box>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => navigate('/cvs')}
                  endIcon={<SearchIcon fontSize="small" />}
                >
                  Alle anzeigen
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Skill-Verteilung Chart */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Skill-Verteilung im Unternehmen</Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Chart
                options={skillChartOptions as any}
                series={skillChartSeries}
                type="bar"
                height={350}
              />
            </Paper>
          </Grid>

          {/* Erfahrungsverteilung Chart */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Erfahrungslevel</Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Chart
                options={experienceChartOptions as any}
                series={experienceChartSeries}
                type="donut"
                height={350}
              />
            </Paper>
          </Grid>

          {/* Neueste Lebensläufe */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Neueste Lebensläufe</Typography>
                <Button 
                  size="small" 
                  endIcon={<SearchIcon fontSize="small" />}
                  onClick={() => navigate('/cvs')}
                >
                  Alle anzeigen
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <List sx={{ width: '100%' }}>
                {recentCVs.map((cv) => (
                  <ListItem 
                    key={cv.id}
                    sx={{ 
                      px: 0, 
                      py: 1.5,
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 1,
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        alt={(cv.personalInfo?.fullName || cv.fullName) || ''}
                        src={(cv.personalInfo?.photoUrl || cv.photoUrl) || ''}
                        sx={{ 
                          width: 48, 
                          height: 48,
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                      >
                        {(cv.personalInfo?.fullName || cv.fullName)?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={cv.personalInfo?.fullName || cv.fullName}
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {cv.personalInfo?.position || cv.position}
                          </Typography>
                          {' — '}
                          {cv.personalInfo?.location || cv.location}
                        </React.Fragment>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => navigate(`/cvs/${cv.id}`)}
                        sx={{ borderRadius: 8 }}
                      >
                        Ansehen
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                
                {recentCVs.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                      Keine Lebensläufe gefunden.
                    </Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Aktivitäten */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Letzte Aktivitäten</Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <List>
                {stats.recentActivities.map((activity, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      px: 0, 
                      py: 1.5,
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 1,
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.message}
                      secondary={`${activity.user} - ${formatDate(activity.date)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard; 