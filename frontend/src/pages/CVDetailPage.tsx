import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, Button, Chip, Avatar,
  CircularProgress, Alert, Tabs, Tab, Divider, IconButton,
  Card, CardContent, Rating
} from '@mui/material';
import {
  Edit as EditIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Code as CodeIcon,
  VerifiedUser as CertificateIcon,
  Language as LanguageIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import cvService from '../services/cvService';
import { CV } from '../types/cv';
import CVExportDialog from '../components/CVExportDialog';

// Hilfsfunktion für Tabs
const TabPanel: React.FC<{
  children?: React.ReactNode;
  index: number;
  value: number;
}> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cv-tabpanel-${index}`}
      aria-labelledby={`cv-tab-${index}`}
      {...other}
      style={{ paddingTop: 20 }}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
};

// Hilfsfunktion für Accessibility
const a11yProps = (index: number) => {
  return {
    id: `cv-tab-${index}`,
    'aria-controls': `cv-tabpanel-${index}`,
  };
};

// Hilfsfunktion für Farben basierend auf der Skill-Kategorie
const getSkillColor = (category: string) => {
  const colors: Record<string, string> = {
    'Programmiersprachen': '#4caf50',  // Grün
    'Frameworks': '#2196f3',           // Blau
    'Datenbanken': '#ff9800',          // Orange
    'Tools & Software': '#9c27b0',     // Lila
    'Methoden': '#f44336',             // Rot
    'Sprachen': '#00bcd4',             // Türkis
    'Soft Skills': '#607d8b',          // Grau-Blau
    'Frontend': '#2196f3',             // Blau
    'Backend': '#4caf50'               // Grün
  };
  
  return colors[category] || '#757575';  // Standard-Grau, wenn keine Kategorie übereinstimmt
};

const CVDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<Partial<CV> | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  
  useEffect(() => {
    fetchCV();
  }, [id]);
  
  const fetchCV = async () => {
    setLoading(true);
    setError(null);
    try {
      // Vorübergehend Mock-Daten verwenden, bis Backend-API fertig ist
      // const data = await cvService.getCVById(parseInt(id as string, 10));
      const mockCVs = cvService.getMockCVs();
      const data = mockCVs.find(cv => cv.id === parseInt(id as string, 10));
      if (data) {
        setCv(data);
      } else {
        setError('Lebenslauf nicht gefunden');
      }
    } catch (err) {
      console.error('Fehler beim Laden des Lebenslaufs:', err);
      setError('Lebenslauf konnte nicht geladen werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleEdit = () => {
    navigate(`/cvs/${id}/edit`);
  };
  
  const handleDownloadCV = async () => {
    setExportDialogOpen(true);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error || !cv) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Lebenslauf konnte nicht geladen werden.'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/cvs')}>
            Zurück zur Übersicht
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Lebenslauf
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadCV}
            >
              Exportieren
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Bearbeiten
            </Button>
          </Box>
        </Box>
        
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: {xs: 'wrap', md: 'nowrap'} }}>
              {/* Profilbild */}
              <Avatar 
                src={cv.photoUrl || undefined} 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: 'primary.main',
                  fontSize: '3rem'
                }}
              >
                {cv.fullName?.charAt(0)}
              </Avatar>
              
              {/* Persönliche Informationen */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {cv.fullName}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {cv.position}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  {cv.email && (
                    <Typography variant="body2">
                      E-Mail: {cv.email}
                    </Typography>
                  )}
                  {cv.phone && (
                    <Typography variant="body2">
                      Telefon: {cv.phone}
                    </Typography>
                  )}
                  {cv.location && (
                    <Typography variant="body2">
                      Standort: {cv.location}
                    </Typography>
                  )}
                </Box>
                
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {cv.summary}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
        
        <Paper elevation={2}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                aria-label="CV-Tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Skills" {...a11yProps(0)} />
                <Tab label="Berufserfahrung" {...a11yProps(1)} />
                <Tab label="Ausbildung" {...a11yProps(2)} />
                <Tab label="Projekte" {...a11yProps(3)} />
                <Tab label="Zertifikate" {...a11yProps(4)} />
              </Tabs>
            </Box>
            
            {/* Skills Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Fähigkeiten und Kompetenzen
                </Typography>
                
                {cv.skills && cv.skills.length > 0 ? (
                  <>
                    {/* Nach Kategorien gruppieren */}
                    {Object.entries(
                      cv.skills.reduce<Record<string, typeof cv.skills>>((acc, skill) => {
                        if (!acc[skill.category]) {
                          acc[skill.category] = [];
                        }
                        acc[skill.category].push(skill);
                        return acc;
                      }, {})
                    ).map(([category, skills]) => (
                      <Box key={category} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: getSkillColor(category) }}>
                          {category}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {skills.map((skill) => (
                            <Chip 
                              key={skill.id}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <span>{skill.name}</span>
                                  <Rating 
                                    value={skill.level} 
                                    readOnly 
                                    size="small" 
                                    max={5}
                                    sx={{ ml: 0.5 }}
                                  />
                                </Box>
                              }
                              sx={{ 
                                bgcolor: `${getSkillColor(category)}20`, 
                                color: getSkillColor(category),
                                '& .MuiChip-label': { px: 1, py: 0.5 }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Keine Skills angegeben.
                  </Typography>
                )}
              </Box>
            </TabPanel>
            
            {/* Berufserfahrung Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Berufserfahrung
                </Typography>
                
                {cv.experience && cv.experience.length > 0 ? (
                  <Box sx={{ position: 'relative', ml: 3, pl: 3, borderLeft: '2px solid #ccc' }}>
                    {cv.experience.map((exp, index) => (
                      <Box key={exp.id || index} sx={{ mb: 3, position: 'relative' }}>
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            left: -20, 
                            top: 0,
                            width: 40, 
                            height: 40, 
                            bgcolor: 'primary.main',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}
                        >
                          <WorkIcon />
                        </Box>
                        <Card variant="outlined" sx={{ ml: 3 }}>
                          <CardContent>
                            <Typography variant="h6" component="div">
                              {exp.position}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                              {exp.company} {exp.location && `• ${exp.location}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {exp.startDate && new Date(exp.startDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
                              {' - '}
                              {exp.current ? 'Aktuell' : (exp.endDate && new Date(exp.endDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' }))}
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                              {exp.description}
                            </Typography>
                            
                            {exp.achievements && exp.achievements.length > 0 && (
                              <>
                                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                  Erfolge und Verantwortlichkeiten:
                                </Typography>
                                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                  {exp.achievements.map((achievement, i) => (
                                    <li key={i}>
                                      <Typography variant="body2">{achievement}</Typography>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Keine Berufserfahrung angegeben.
                  </Typography>
                )}
              </Box>
            </TabPanel>
            
            {/* Ausbildung Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Ausbildung
                </Typography>
                
                {cv.education && cv.education.length > 0 ? (
                  <Box sx={{ position: 'relative', ml: 3, pl: 3, borderLeft: '2px solid #ccc' }}>
                    {cv.education.map((edu, index) => (
                      <Box key={index} sx={{ mb: 3, position: 'relative' }}>
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            left: -20, 
                            top: 0,
                            width: 40, 
                            height: 40, 
                            bgcolor: 'secondary.main',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}
                        >
                          <SchoolIcon />
                        </Box>
                        <Card variant="outlined" sx={{ ml: 3 }}>
                          <CardContent>
                            <Typography variant="h6" component="div">
                              {edu.degree}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                              {edu.institution}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {edu.start_year} - {edu.end_year}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {edu.details}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Keine Ausbildung angegeben.
                  </Typography>
                )}
              </Box>
            </TabPanel>
            
            {/* Projekte Tab */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Projekte
                </Typography>
                
                {cv.projects && cv.projects.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    {cv.projects.map((project) => (
                      <Card key={project.id} variant="outlined">
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {project.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {project.startDate && new Date(project.startDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
                            {' - '}
                            {project.current ? 'Aktuell' : (project.endDate && new Date(project.endDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' }))}
                          </Typography>
                          
                          <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                            {project.description}
                          </Typography>
                          
                          {project.technologies && project.technologies.length > 0 && (
                            <Box sx={{ mt: 2, mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Technologien:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {project.technologies.map((tech, i) => (
                                  <Chip 
                                    key={i} 
                                    label={tech} 
                                    size="small"
                                    sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                          
                          {project.achievements && project.achievements.length > 0 && (
                            <>
                              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                Erfolge:
                              </Typography>
                              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                {project.achievements.map((achievement, i) => (
                                  <li key={i}>
                                    <Typography variant="body2">{achievement}</Typography>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Keine Projekte angegeben.
                  </Typography>
                )}
              </Box>
            </TabPanel>
            
            {/* Zertifikate Tab */}
            <TabPanel value={tabValue} index={4}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Zertifikate und Lizenzen
                </Typography>
                
                {cv.certifications && cv.certifications.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                    {cv.certifications.map((cert) => (
                      <Card key={cert.id} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CertificateIcon color="success" sx={{ mr: 1 }} />
                            <Typography variant="h6" component="div">
                              {cert.name}
                            </Typography>
                          </Box>
                          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            {cert.issuer}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Ausgestellt: {cert.issueDate && new Date(cert.issueDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
                          </Typography>
                          {!cert.current && cert.expiryDate && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Gültig bis: {new Date(cert.expiryDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
                            </Typography>
                          )}
                          {cert.credentialId && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Zertifikat-ID: {cert.credentialId}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Keine Zertifikate angegeben.
                  </Typography>
                )}
              </Box>
            </TabPanel>
          </Box>
        </Paper>
      </Box>
      
      {cv && (
        <CVExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          cv={cv as CV}
        />
      )}
    </Container>
  );
};

export default CVDetailPage; 