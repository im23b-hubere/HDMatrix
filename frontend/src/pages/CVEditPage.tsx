import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, Button, TextField,
  CircularProgress, Alert, Tabs, Tab, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Chip, Rating,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem,
  ListItemText, Card, CardContent, FormControlLabel, Switch,
  FormHelperText
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import cvService from '../services/cvService';
import { CV, Skill, WorkExperience, Education, Certification, Project } from '../types/cv';

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
      id={`cv-edit-tabpanel-${index}`}
      aria-labelledby={`cv-edit-tab-${index}`}
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
    id: `cv-edit-tab-${index}`,
    'aria-controls': `cv-edit-tabpanel-${index}`,
  };
};

const CVEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewCV = id === 'new';
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  
  // CV-Daten
  const [cv, setCv] = useState<Partial<CV>>({
    employeeId: 0,
    fullName: '',
    position: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: []
  });
  
  // Modals
  const [skillDialogOpen, setSkillDialogOpen] = useState<boolean>(false);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState<boolean>(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState<boolean>(false);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState<boolean>(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState<boolean>(false);
  
  // Neue Daten
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '',
    category: '',
    level: 3
  });
  
  const [newExperience, setNewExperience] = useState<Partial<WorkExperience>>({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    achievements: []
  });
  
  const [newEducation, setNewEducation] = useState<Partial<Education>>({
    start_year: '',
    end_year: '',
    degree: '',
    institution: '',
    details: ''
  });
  
  const [newCertification, setNewCertification] = useState<Partial<Certification>>({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    current: true
  });
  
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    current: false,
    technologies: [],
    achievements: []
  });
  
  // Bearbeitungs-Modus für bestehende Einträge
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [editingCertificationId, setEditingCertificationId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  
  // Temporäre Werte für Listen von Strings
  const [newAchievement, setNewAchievement] = useState<string>('');
  const [newTechnology, setNewTechnology] = useState<string>('');
  
  const [skillCategories, setSkillCategories] = useState<string[]>([
    'Programmiersprachen', 'Frameworks', 'Datenbanken', 'Tools & Software', 
    'Methoden', 'Sprachen', 'Soft Skills', 'Frontend', 'Backend'
  ]);
  
  useEffect(() => {
    if (!isNewCV) {
      fetchCV();
    } else {
      setLoading(false);
    }
    
    // Skill-Kategorien laden
    fetchSkillCategories();
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
  
  const fetchSkillCategories = async () => {
    try {
      // Später von API laden
      // const data = await cvService.getAllSkillCategories();
      // setSkillCategories(data.map(cat => cat.name));
    } catch (err) {
      console.error('Fehler beim Laden der Skill-Kategorien:', err);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCv(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveCV = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      let savedCV: CV;
      if (isNewCV) {
        savedCV = await cvService.createCV(cv) as CV;
        setSaveSuccess(true);
        setTimeout(() => {
          navigate(`/cvs/${savedCV.id}`);
        }, 1500);
      } else {
        await cvService.updateCV(parseInt(id as string, 10), cv);
        setSaveSuccess(true);
        setTimeout(() => {
          navigate(`/cvs/${id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Fehler beim Speichern des Lebenslaufs:', err);
      setError('Lebenslauf konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    if (isNewCV) {
      navigate('/cvs');
    } else {
      navigate(`/cvs/${id}`);
    }
  };
  
  // Skill-Funktionen
  const openSkillDialog = () => {
    setNewSkill({ name: '', level: 3, category: skillCategories[0] });
    setSkillDialogOpen(true);
  };
  
  const closeSkillDialog = () => {
    setSkillDialogOpen(false);
  };
  
  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSkill(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSkillLevelChange = (newLevel: number | null) => {
    setNewSkill(prev => ({ ...prev, level: newLevel || 3 }));
  };
  
  const handleSkillCategoryChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setNewSkill(prev => ({ ...prev, category: e.target.value as string }));
  };
  
  const addSkill = () => {
    if (!newSkill.name || !newSkill.category) return;
    
    const newSkillWithId: Skill = {
      id: Date.now().toString(), // Temporäre ID für Frontend
      name: newSkill.name,
      level: newSkill.level || 3,
      category: newSkill.category
    };
    
    setCv(prev => ({
      ...prev,
      skills: [...(prev.skills || []), newSkillWithId]
    }));
    
    closeSkillDialog();
  };
  
  const removeSkill = (skillId: string) => {
    setCv(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(skill => skill.id !== skillId)
    }));
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
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {isNewCV ? 'Neuen Lebenslauf erstellen' : 'Lebenslauf bearbeiten'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveCV}
              disabled={saving}
            >
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Lebenslauf erfolgreich gespeichert!
          </Alert>
        )}
        
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Persönliche Informationen
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                label="Name"
                name="fullName"
                fullWidth
                value={cv.fullName || ''}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Position"
                name="position"
                fullWidth
                value={cv.position || ''}
                onChange={handleInputChange}
              />
              <TextField
                label="E-Mail"
                name="email"
                fullWidth
                type="email"
                value={cv.email || ''}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Telefon"
                name="phone"
                fullWidth
                value={cv.phone || ''}
                onChange={handleInputChange}
              />
              <TextField
                label="Standort"
                name="location"
                fullWidth
                value={cv.location || ''}
                onChange={handleInputChange}
                sx={{ gridColumn: '1 / -1' }}
              />
              <TextField
                label="Zusammenfassung"
                name="summary"
                fullWidth
                multiline
                rows={4}
                value={cv.summary || ''}
                onChange={handleInputChange}
                sx={{ gridColumn: '1 / -1' }}
              />
            </Box>
          </Box>
          
          <Divider />
          
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="CV-Bearbeitungs-Tabs"
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
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Skills</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openSkillDialog}
                >
                  Skill hinzufügen
                </Button>
              </Box>
              
              {cv.skills && cv.skills.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {cv.skills.map((skill) => (
                    <Card key={skill.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">{skill.name}</Typography>
                          <Box>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setNewSkill({ ...skill });
                                setEditingSkillId(skill.id);
                                setSkillDialogOpen(true);
                              }}
                              aria-label="Skill bearbeiten"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => removeSkill(skill.id)}
                              aria-label="Skill löschen"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Kategorie: {skill.category}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            Level:
                          </Typography>
                          <Rating
                            name={`skill-rating-${skill.id}`}
                            value={skill.level}
                            readOnly
                            max={5}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Keine Skills vorhanden. Fügen Sie Skills hinzu, um Ihre Fähigkeiten zu präsentieren.
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            {/* Berufserfahrung Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Berufserfahrung</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewExperience({
                      company: '',
                      position: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      description: '',
                      achievements: []
                    });
                    setEditingExperienceId(null);
                    setExperienceDialogOpen(true);
                  }}
                >
                  Erfahrung hinzufügen
                </Button>
              </Box>
              
              {cv.experience && cv.experience.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {cv.experience.map((exp) => (
                    <Card key={exp.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" component="div">
                              {exp.position}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                              {exp.company} {exp.location && `• ${exp.location}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {exp.startDate && new Date(exp.startDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
                              {' - '}
                              {exp.current ? 'Aktuell' : (exp.endDate && new Date(exp.endDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' }))}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setNewExperience({ ...exp });
                                setEditingExperienceId(exp.id);
                                setExperienceDialogOpen(true);
                              }}
                              aria-label="Erfahrung bearbeiten"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCv(prev => ({
                                  ...prev,
                                  experience: (prev.experience || []).filter(item => item.id !== exp.id)
                                }));
                              }}
                              aria-label="Erfahrung löschen"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        {exp.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {exp.description}
                          </Typography>
                        )}
                        
                        {exp.achievements && exp.achievements.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Erfolge und Verantwortlichkeiten:
                            </Typography>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
                              {exp.achievements.map((achievement, i) => (
                                <li key={i}>
                                  <Typography variant="body2">{achievement}</Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Keine Berufserfahrung vorhanden. Fügen Sie Ihre beruflichen Stationen hinzu.
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Ausbildung</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewEducation({
                      institution: '',
                      degree: '',
                      start_year: '',
                      end_year: '',
                      details: ''
                    });
                    setEditingEducationIndex(null);
                    setEducationDialogOpen(true);
                  }}
                >
                  Ausbildung hinzufügen
                </Button>
              </Box>
              
              {cv.education && cv.education.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {cv.education.map((edu, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" component="div">
                              {edu.degree}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                              {edu.institution}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {edu.start_year} - {edu.end_year || 'Aktuell'}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setNewEducation({ ...edu });
                                setEditingEducationIndex(index);
                                setEducationDialogOpen(true);
                              }}
                              aria-label="Ausbildung bearbeiten"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCv(prev => ({
                                  ...prev,
                                  education: (prev.education || []).filter((_, i) => i !== index)
                                }));
                              }}
                              aria-label="Ausbildung löschen"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        {edu.details && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {edu.details}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Keine Ausbildung vorhanden. Fügen Sie Ihre Bildungsabschlüsse hinzu.
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Projekte</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewProject({
                      name: '',
                      description: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      technologies: [],
                      achievements: []
                    });
                    setEditingProjectId(null);
                    setProjectDialogOpen(true);
                  }}
                >
                  Projekt hinzufügen
                </Button>
              </Box>
              
              {cv.projects && cv.projects.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {cv.projects.map((project) => (
                    <Card key={project.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div">
                            {project.name}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setNewProject({ ...project });
                                setEditingProjectId(project.id);
                                setProjectDialogOpen(true);
                              }}
                              aria-label="Projekt bearbeiten"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCv(prev => ({
                                  ...prev,
                                  projects: (prev.projects || []).filter(item => item.id !== project.id)
                                }));
                              }}
                              aria-label="Projekt löschen"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {project.startDate && new Date(project.startDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
                          {' - '}
                          {project.current ? 'Aktuell' : (project.endDate && new Date(project.endDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' }))}
                        </Typography>
                        
                        {project.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {project.description}
                          </Typography>
                        )}
                        
                        {project.technologies && project.technologies.length > 0 && (
                          <Box sx={{ mt: 2 }}>
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
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Erfolge:
                            </Typography>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
                              {project.achievements.map((achievement, i) => (
                                <li key={i}>
                                  <Typography variant="body2">{achievement}</Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Keine Projekte vorhanden. Fügen Sie Ihre Projekte hinzu.
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={4}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Zertifikate</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewCertification({
                      name: '',
                      issuer: '',
                      issueDate: '',
                      expiryDate: '',
                      credentialId: '',
                      current: true
                    });
                    setEditingCertificationId(null);
                    setCertificationDialogOpen(true);
                  }}
                >
                  Zertifikat hinzufügen
                </Button>
              </Box>
              
              {cv.certifications && cv.certifications.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {cv.certifications.map((cert) => (
                    <Card key={cert.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div">
                            {cert.name}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setNewCertification({ ...cert });
                                setEditingCertificationId(cert.id);
                                setCertificationDialogOpen(true);
                              }}
                              aria-label="Zertifikat bearbeiten"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCv(prev => ({
                                  ...prev,
                                  certifications: (prev.certifications || []).filter(item => item.id !== cert.id)
                                }));
                              }}
                              aria-label="Zertifikat löschen"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="subtitle1" color="text.secondary">
                          {cert.issuer}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Ausgestellt: {cert.issueDate && new Date(cert.issueDate).toLocaleDateString('de-DE')}
                        </Typography>
                        {!cert.current && cert.expiryDate && (
                          <Typography variant="body2" color="text.secondary">
                            Gültig bis: {new Date(cert.expiryDate).toLocaleDateString('de-DE')}
                          </Typography>
                        )}
                        {cert.credentialId && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            ID: {cert.credentialId}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Keine Zertifikate vorhanden. Fügen Sie Ihre Zertifikate und Lizenzen hinzu.
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Box>
        </Paper>
      </Box>
      
      {/* Dialog zum Hinzufügen/Bearbeiten von Skills */}
      <Dialog open={skillDialogOpen} onClose={closeSkillDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSkillId ? 'Skill bearbeiten' : 'Neuen Skill hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              name="name"
              fullWidth
              value={newSkill.name || ''}
              onChange={handleSkillInputChange}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={newSkill.category || ''}
                onChange={(e) => handleSkillCategoryChange(e as any)}
                label="Kategorie"
                name="category"
              >
                {skillCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" gutterBottom>Level</Typography>
              <Rating
                name="skill-level"
                value={newSkill.level || 3}
                onChange={(event, newValue) => {
                  handleSkillLevelChange(newValue);
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSkillDialog}>Abbrechen</Button>
          <Button onClick={addSkill} variant="contained">
            {editingSkillId ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog zum Hinzufügen/Bearbeiten von Berufserfahrung */}
      <Dialog open={experienceDialogOpen} onClose={() => setExperienceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExperienceId ? 'Berufserfahrung bearbeiten' : 'Neue Berufserfahrung hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Unternehmen"
                name="company"
                fullWidth
                value={newExperience.company || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                required
              />
              <TextField
                label="Position / Titel"
                name="position"
                fullWidth
                value={newExperience.position || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                required
              />
              <TextField
                label="Ort"
                name="location"
                fullWidth
                value={newExperience.location || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, location: e.target.value }))}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newExperience.current || false}
                    onChange={(e) => setNewExperience(prev => ({ ...prev, current: e.target.checked }))}
                    name="current"
                  />
                }
                label="Aktuelle Position"
              />
              <TextField
                label="Startdatum"
                name="startDate"
                type="date"
                fullWidth
                value={newExperience.startDate || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
              {!newExperience.current && (
                <TextField
                  label="Enddatum"
                  name="endDate"
                  type="date"
                  fullWidth
                  value={newExperience.endDate || ''}
                  onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              )}
            </Box>
            <TextField
              label="Beschreibung"
              name="description"
              fullWidth
              multiline
              rows={3}
              value={newExperience.description || ''}
              onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Erfolge und Verantwortlichkeiten
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Neuer Eintrag"
                  fullWidth
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  size="small"
                />
                <Button 
                  variant="outlined"
                  onClick={() => {
                    if (newAchievement.trim()) {
                      setNewExperience(prev => ({
                        ...prev,
                        achievements: [...(prev.achievements || []), newAchievement.trim()]
                      }));
                      setNewAchievement('');
                    }
                  }}
                >
                  Hinzufügen
                </Button>
              </Box>
              
              {newExperience.achievements && newExperience.achievements.length > 0 ? (
                <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                  {newExperience.achievements.map((achievement, index) => (
                    <Box component="li" key={index} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {achievement}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setNewExperience(prev => ({
                              ...prev,
                              achievements: prev.achievements?.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Keine Einträge vorhanden. Fügen Sie Erfolge und Verantwortlichkeiten hinzu.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExperienceDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={() => {
              if (!newExperience.company || !newExperience.position) {
                setError('Bitte füllen Sie alle Pflichtfelder aus.');
                return;
              }
              
              const expWithId: WorkExperience = {
                ...newExperience as WorkExperience,
                id: editingExperienceId || Date.now().toString(),
              };
              
              if (editingExperienceId) {
                setCv(prev => ({
                  ...prev,
                  experience: prev.experience?.map(exp => 
                    exp.id === editingExperienceId ? expWithId : exp
                  ) || []
                }));
              } else {
                setCv(prev => ({
                  ...prev,
                  experience: [...(prev.experience || []), expWithId]
                }));
              }
              
              setExperienceDialogOpen(false);
            }}
            variant="contained"
          >
            {editingExperienceId ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog zum Hinzufügen/Bearbeiten von Ausbildung */}
      <Dialog open={educationDialogOpen} onClose={() => setEducationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEducationIndex !== null ? 'Ausbildung bearbeiten' : 'Neue Ausbildung hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Bildungseinrichtung"
              name="institution"
              fullWidth
              value={newEducation.institution || ''}
              onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
              required
            />
            <TextField
              label="Abschluss / Studiengang"
              name="degree"
              fullWidth
              value={newEducation.degree || ''}
              onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
              required
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Startjahr"
                name="start_year"
                fullWidth
                value={newEducation.start_year || ''}
                onChange={(e) => setNewEducation(prev => ({ ...prev, start_year: e.target.value }))}
                required
              />
              <TextField
                label="Endjahr"
                name="end_year"
                fullWidth
                value={newEducation.end_year || ''}
                onChange={(e) => setNewEducation(prev => ({ ...prev, end_year: e.target.value }))}
              />
            </Box>
            <TextField
              label="Details"
              name="details"
              fullWidth
              multiline
              rows={3}
              value={newEducation.details || ''}
              onChange={(e) => setNewEducation(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Beschreiben Sie Ihren Studiengang, Schwerpunkte, Leistungen etc."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEducationDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={() => {
              if (!newEducation.institution || !newEducation.degree || !newEducation.start_year) {
                setError('Bitte füllen Sie alle Pflichtfelder aus.');
                return;
              }
              
              if (editingEducationIndex !== null) {
                setCv(prev => {
                  const updatedEducation = [...(prev.education || [])];
                  updatedEducation[editingEducationIndex] = newEducation as Education;
                  return { ...prev, education: updatedEducation };
                });
              } else {
                setCv(prev => ({
                  ...prev,
                  education: [...(prev.education || []), newEducation as Education]
                }));
              }
              
              setEducationDialogOpen(false);
            }}
            variant="contained"
          >
            {editingEducationIndex !== null ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog zum Hinzufügen/Bearbeiten von Zertifikaten */}
      <Dialog open={certificationDialogOpen} onClose={() => setCertificationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCertificationId ? 'Zertifikat bearbeiten' : 'Neues Zertifikat hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Zertifikatsname"
              name="name"
              fullWidth
              value={newCertification.name || ''}
              onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <TextField
              label="Aussteller"
              name="issuer"
              fullWidth
              value={newCertification.issuer || ''}
              onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
              required
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Ausstellungsdatum"
                name="issueDate"
                type="date"
                fullWidth
                value={newCertification.issueDate || ''}
                onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newCertification.current || false}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, current: e.target.checked }))}
                    name="current"
                  />
                }
                label="Ohne Ablaufdatum"
              />
            </Box>
            {!newCertification.current && (
              <TextField
                label="Ablaufdatum"
                name="expiryDate"
                type="date"
                fullWidth
                value={newCertification.expiryDate || ''}
                onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
            <TextField
              label="Zertifikats-ID / Credential-ID"
              name="credentialId"
              fullWidth
              value={newCertification.credentialId || ''}
              onChange={(e) => setNewCertification(prev => ({ ...prev, credentialId: e.target.value }))}
              placeholder="Optional: Geben Sie die Zertifikats-ID ein, falls vorhanden"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificationDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={() => {
              if (!newCertification.name || !newCertification.issuer || !newCertification.issueDate) {
                setError('Bitte füllen Sie alle Pflichtfelder aus.');
                return;
              }
              
              const certWithId: Certification = {
                ...newCertification as Certification,
                id: editingCertificationId || Date.now().toString(),
              };
              
              if (editingCertificationId) {
                setCv(prev => ({
                  ...prev,
                  certifications: prev.certifications?.map(cert => 
                    cert.id === editingCertificationId ? certWithId : cert
                  ) || []
                }));
              } else {
                setCv(prev => ({
                  ...prev,
                  certifications: [...(prev.certifications || []), certWithId]
                }));
              }
              
              setCertificationDialogOpen(false);
            }}
            variant="contained"
          >
            {editingCertificationId ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog zum Hinzufügen/Bearbeiten von Projekten */}
      <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProjectId ? 'Projekt bearbeiten' : 'Neues Projekt hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Projektname"
              name="name"
              fullWidth
              value={newProject.name || ''}
              onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <TextField
              label="Beschreibung"
              name="description"
              fullWidth
              multiline
              rows={3}
              value={newProject.description || ''}
              onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              required
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Startdatum"
                name="startDate"
                type="date"
                fullWidth
                value={newProject.startDate || ''}
                onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newProject.current || false}
                    onChange={(e) => setNewProject(prev => ({ ...prev, current: e.target.checked }))}
                    name="current"
                  />
                }
                label="Aktuelles Projekt"
              />
              {!newProject.current && (
                <TextField
                  label="Enddatum"
                  name="endDate"
                  type="date"
                  fullWidth
                  value={newProject.endDate || ''}
                  onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              )}
            </Box>
            
            {/* Technologien */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Technologien
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Neue Technologie"
                  fullWidth
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                  size="small"
                />
                <Button 
                  variant="outlined"
                  onClick={() => {
                    if (newTechnology.trim()) {
                      setNewProject(prev => ({
                        ...prev,
                        technologies: [...(prev.technologies || []), newTechnology.trim()]
                      }));
                      setNewTechnology('');
                    }
                  }}
                >
                  Hinzufügen
                </Button>
              </Box>
              
              {newProject.technologies && newProject.technologies.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {newProject.technologies.map((tech, index) => (
                    <Chip
                      key={index}
                      label={tech}
                      onDelete={() => {
                        setNewProject(prev => ({
                          ...prev,
                          technologies: prev.technologies?.filter((_, i) => i !== index)
                        }));
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Keine Technologien hinzugefügt.
                </Typography>
              )}
            </Box>
            
            {/* Erfolge */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Erfolge und Ergebnisse
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Neuer Erfolg"
                  fullWidth
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  size="small"
                />
                <Button 
                  variant="outlined"
                  onClick={() => {
                    if (newAchievement.trim()) {
                      setNewProject(prev => ({
                        ...prev,
                        achievements: [...(prev.achievements || []), newAchievement.trim()]
                      }));
                      setNewAchievement('');
                    }
                  }}
                >
                  Hinzufügen
                </Button>
              </Box>
              
              {newProject.achievements && newProject.achievements.length > 0 ? (
                <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                  {newProject.achievements.map((achievement, index) => (
                    <Box component="li" key={index} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {achievement}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setNewProject(prev => ({
                              ...prev,
                              achievements: prev.achievements?.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Keine Erfolge hinzugefügt.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={() => {
              if (!newProject.name || !newProject.description || !newProject.startDate) {
                setError('Bitte füllen Sie alle Pflichtfelder aus.');
                return;
              }
              
              const projectWithId: Project = {
                ...newProject as Project,
                id: editingProjectId || Date.now().toString(),
              };
              
              if (editingProjectId) {
                setCv(prev => ({
                  ...prev,
                  projects: prev.projects?.map(project => 
                    project.id === editingProjectId ? projectWithId : project
                  ) || []
                }));
              } else {
                setCv(prev => ({
                  ...prev,
                  projects: [...(prev.projects || []), projectWithId]
                }));
              }
              
              setProjectDialogOpen(false);
            }}
            variant="contained"
          >
            {editingProjectId ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CVEditPage; 