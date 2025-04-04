import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, Paper, Divider, CircularProgress,
  Grid, Stack, Chip, List, ListItem, ListItemText, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, FormControlLabel, Switch,
  Card, CardContent, Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PreviewIcon from '@mui/icons-material/Preview';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { styled } from '@mui/material/styles';
import { TimelineDot } from '@mui/lab';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import cvUploadService from '../services/cvUploadService';
import { useDropzone } from 'react-dropzone';

// Styled Components
const DropzoneContainer = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.3s ease-in-out, background-color 0.3s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main
  }
}));

const PreviewContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper
}));

const PreviewSection = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2]
}));

const StyledAlert = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText
}));

// Definiere die erlaubten Dateitypen
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Schnittstelle für extrahierte Daten
interface ExtractedData {
  // Alte Format-Unterstützung
  personal_data?: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    adresse?: string;
  };
  // Verwende nur einen education-Typ mit einer Vereinigung der möglichen Formate
  education?: Array<{
    institution?: string;
    abschluss?: string;
    zeitraum?: string;
    fachrichtung?: string;
    ort?: string;
    degree?: string;
    start_date?: string;
    end_date?: string;
  }>;
  experience?: Array<{
    firma?: string;
    position?: string;
    zeitraum?: string;
    beschreibung?: string;
  }>;
  // Definiere skills als Union-Typ
  skills?: string[] | {
    technische_skills?: string[];
    sprachen?: string[];
    soft_skills?: string[];
  };
  // Neues Format-Unterstützung für direkten HuggingFace/Basis-Extraktor
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  summary?: string;
  work_experience?: Array<{
    position?: string;
    company?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  languages?: Array<{
    language?: string;
    proficiency?: string;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
  }>;
  // Metadaten
  extraction_method?: string;
  text_sample?: string;
}

// Helper-Funktionen für die Datenformatierung und Konvertierung
const formatDateRange = (start?: string, end?: string): string => {
  if (!start && !end) return '';
  if (start && !end) return start;
  if (!start && end) return `bis ${end}`;
  if (end?.toLowerCase() === 'present' || end?.toLowerCase() === 'heute') {
    return `${start} - heute`;
  }
  return `${start} - ${end}`;
};

const getEducationDisplay = (education: any[]): any[] => {
  if (!education || education.length === 0) return [];
  
  // Prüfe das Format des ersten Elements
  const firstItem = education[0];
  
  // Neues Format (degree, institution, start_date, end_date)
  if ('degree' in firstItem || 'start_date' in firstItem) {
    return education.map(item => ({
      institution: item.institution || '',
      abschluss: item.degree || '',
      zeitraum: formatDateRange(item.start_date, item.end_date),
      fachrichtung: '', // Nicht im neuen Format vorhanden
      ort: '' // Nicht im neuen Format vorhanden
    }));
  }
  
  // Altes Format bleibt unverändert
  return education;
};

const getExperienceDisplay = (experience: any[]): any[] => {
  if (!experience || experience.length === 0) return [];
  
  // Prüfe das Format des ersten Elements
  const firstItem = experience[0];
  
  // Neues Format (position, company, start_date, end_date, description)
  if ('position' in firstItem || 'company' in firstItem) {
    return experience.map(item => ({
      position: item.position || '',
      firma: item.company || '',
      zeitraum: formatDateRange(item.start_date, item.end_date),
      beschreibung: item.description || ''
    }));
  }
  
  // Altes Format bleibt unverändert
  return experience;
};

const getSkillsDisplay = (skills: any): { technische_skills: string[], sprachen: string[], soft_skills: string[] } => {
  // Standardwerte
  const defaultSkills = {
    technische_skills: [],
    sprachen: [],
    soft_skills: []
  };
  
  if (!skills) return defaultSkills;
  
  // Array-Format (Alle als technische Skills betrachten)
  if (Array.isArray(skills)) {
    return {
      ...defaultSkills,
      technische_skills: skills
    };
  }
  
  // Objekt-Format (altes Format)
  if (typeof skills === 'object') {
    return {
      technische_skills: skills.technische_skills || [],
      sprachen: skills.sprachen || [],
      soft_skills: skills.soft_skills || []
    };
  }
  
  return defaultSkills;
};

interface CVUploadFormProps {
  onUploadSuccess?: (cvId: string) => void;
  tenantId?: string;
}

const CVUploadForm: React.FC<CVUploadFormProps> = ({ onUploadSuccess, tenantId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [showTextPreview, setShowTextPreview] = useState<boolean>(false);
  const [useMockData, setUseMockData] = useState<boolean>(cvUploadService.useMockData());

  // Referenz für das Vorschau-Formular, um es programmatisch zu scrollen
  const previewRef = useRef<HTMLDivElement>(null);

  // Toggle für Mock-Daten
  const handleToggleMockData = () => {
    const newValue = !useMockData;
    cvUploadService.setMockData(newValue);
    setUseMockData(newValue);
    
    if (newValue) {
      setError('Mock-Modus aktiviert. Es werden Beispieldaten verwendet.');
    } else {
      setError('Echtmodus aktiviert. Verbindung zum API-Server wird verwendet.');
    }
  };

  // Drag & Drop mit react-dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setSuccess(null);
    setExtractedData(null);
    
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      // Überprüfe Dateityp
      if (!/\.(pdf|docx|doc)$/i.test(selectedFile.name)) {
        setError('Nicht unterstütztes Dateiformat. Bitte nur PDF oder Word-Dokumente hochladen.');
        return;
      }
      
      // Überprüfe Dateigröße (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Die Datei ist zu groß. Maximale Größe beträgt 10MB.');
        return;
      }
      
      setFile(selectedFile);
      handleExtractPreview(selectedFile);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  // Extraktion der Vorschau
  const handleExtractPreview = async (selectedFile: File) => {
    setPreviewLoading(true);
    setError(null);
    
    // Prüfen, ob der Server erreichbar ist
    try {
      const apiStatus = await cvUploadService.testApiConnection();
      if (apiStatus.status === 'error') {
        console.log('API nicht erreichbar, verwende Mock-Daten');
      }
    } catch (e) {
      console.error('Fehler beim API-Test:', e);
    }
    
    // Timeout-Handler
    const timeoutId = setTimeout(() => {
      if (previewLoading) {
        setError('Die Anfrage dauert ungewöhnlich lange. Das könnte an Server- oder Ollama-Problemen liegen. Es werden Mock-Daten verwendet, wenn keine Antwort erfolgt.');
        console.error('Timeout bei der Extraktion - Anzeige einer Warnung, aber wir lassen die Anfrage weiterlaufen.');
      }
    }, 20000); // 20 Sekunden Timeout für Feedback
    
    try {
      console.log('Starte Extraktion:', selectedFile.name);
      const response = await cvUploadService.extractPreview(selectedFile);
      
      clearTimeout(timeoutId);
      
      // Zeige Mock-Hinweis
      if (cvUploadService.useMockData()) {
        setError('Die echte API ist nicht erreichbar. Es werden Demo-Daten angezeigt.');
      }
      
      if (response.success) {
        setExtractedData(response.extracted_data);
        setTextPreview(response.text_sample || null);
        
        // Scrolle zur Vorschau
        setTimeout(() => {
          if (previewRef.current) {
            previewRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        setError(response.message || 'Fehler bei der Extraktion der Daten');
        setExtractedData(null);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      console.error('Extraktion Fehler:', err);
    } finally {
      clearTimeout(timeoutId);
      setPreviewLoading(false);
    }
  };

  // Hochladen und Speichern des CV
  const handleUpload = async () => {
    if (!file) {
      setError('Bitte wählen Sie zuerst eine Datei aus.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await cvUploadService.uploadCV(file, tenantId);
      
      // Zeige Mock-Hinweis
      if (cvUploadService.useMockData()) {
        setSuccess('DEMO-MODUS: Die Daten wurden simuliert gespeichert.');
      } else if (response.success) {
        setSuccess('Lebenslauf wurde erfolgreich hochgeladen und verarbeitet!');
      } else {
        setError(response.message || 'Fehler beim Hochladen des Lebenslaufs');
      }
      
      setFile(null);
      
      // Callback aufrufen, falls vorhanden
      if (onUploadSuccess && response.cv_id) {
        onUploadSuccess(response.cv_id);
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      console.error('Upload Fehler:', err);
    } finally {
      setLoading(false);
    }
  };

  // Datei entfernen
  const handleRemoveFile = () => {
    setFile(null);
    setExtractedData(null);
    setTextPreview(null);
    setError(null);
    setSuccess(null);
  };

  // Text-Vorschau anzeigen
  const handleShowTextPreview = () => {
    setShowTextPreview(true);
  };

  // Text-Vorschau schließen
  const handleCloseTextPreview = () => {
    setShowTextPreview(false);
  };

  return (
    <Box>
      {/* Mock-Modus-Switch */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControlLabel
          control={
            <Switch
              checked={useMockData}
              onChange={handleToggleMockData}
              color="primary"
            />
          }
          label="Demo-Modus"
        />
      </Box>
      
      {/* Drag & Drop Zone */}
      <DropzoneContainer
        {...getRootProps()}
        sx={{
          borderColor: isDragActive ? 'primary.main' : file ? 'success.main' : 'divider',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper'
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ p: 3 }}>
          {file ? (
            <>
              <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                sx={{ mt: 1 }}
              >
                Entfernen
              </Button>
            </>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive
                  ? 'Datei hier ablegen...'
                  : 'Klicken oder ziehen Sie eine Datei hierher, um sie hochzuladen'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Unterstützte Formate: PDF, DOC, DOCX (max. 10MB)
              </Typography>
            </>
          )}
        </Box>
      </DropzoneContainer>

      {/* Fehlermeldungen oder Erfolgsmeldungen */}
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      {/* Ladeindikator für Vorschau */}
      {previewLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Daten werden extrahiert...
          </Typography>
        </Box>
      )}

      {/* Vorschau der extrahierten Daten */}
      {extractedData && !previewLoading && (
        <PreviewContainer ref={previewRef}>
          <Typography variant="h5" gutterBottom>
            Extrahierte Daten
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {/* Extraktionsmethode und -erfolg anzeigen */}
          {extractedData.extraction_method && (
            <Chip 
              icon={<InfoIcon />} 
              label={`Extraktionsmethode: ${extractedData.extraction_method}`} 
              color="info" 
              variant="outlined" 
              sx={{ mb: 2 }}
            />
          )}

          <Grid container spacing={3}>
            {/* Persönliche Daten */}
            <Grid item xs={12} md={6}>
              <PreviewSection>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Persönliche Daten
                  </Typography>
                  
                  <TextField
                    label="Vorname"
                    value={extractedData.personal_data?.vorname || 
                          (extractedData.name ? extractedData.name.split(' ')[0] : '')}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                  
                  <TextField
                    label="Nachname"
                    value={extractedData.personal_data?.nachname || 
                          (extractedData.name && extractedData.name.split(' ').length > 1 
                            ? extractedData.name.split(' ').slice(1).join(' ') 
                            : '')}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                  
                  <TextField
                    label="E-Mail"
                    value={extractedData.personal_data?.email || extractedData.email || ''}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                  
                  <TextField
                    label="Telefon"
                    value={extractedData.personal_data?.telefon || extractedData.phone || ''}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                  
                  <TextField
                    label="Adresse"
                    value={extractedData.personal_data?.adresse || extractedData.address || ''}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </CardContent>
              </PreviewSection>
              
              {/* Zusammenfassung, falls vorhanden */}
              {extractedData.summary && (
                <PreviewSection sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Zusammenfassung
                    </Typography>
                    <TextField
                      value={extractedData.summary}
                      fullWidth
                      multiline
                      rows={4}
                      margin="normal"
                      InputProps={{ readOnly: true }}
                    />
                  </CardContent>
                </PreviewSection>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              {/* Skills */}
              <PreviewSection>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Fähigkeiten
                  </Typography>
                  
                  {/* Technische Skills */}
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Technische Fähigkeiten
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {Array.isArray(extractedData.skills) 
                      ? extractedData.skills.map((skill, index) => (
                          <Chip key={index} label={skill} />
                        ))
                      : (extractedData.skills?.technische_skills || []).map((skill, index) => (
                          <Chip key={index} label={skill} />
                        ))}
                  </Box>
                  
                  {/* Sprachen */}
                  <Typography variant="subtitle1" sx={{ mt: 3 }}>
                    Sprachen
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {extractedData.languages 
                      ? extractedData.languages.map((lang, index) => (
                          <Chip 
                            key={index} 
                            label={lang.proficiency ? `${lang.language} (${lang.proficiency})` : lang.language} 
                          />
                        ))
                      : (extractedData.skills?.sprachen || []).map((lang, index) => (
                          <Chip key={index} label={lang} />
                        ))}
                  </Box>
                  
                  {/* Soft Skills */}
                  {(extractedData.skills?.soft_skills || []).length > 0 && (
                    <>
                      <Typography variant="subtitle1" sx={{ mt: 3 }}>
                        Soft Skills
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {(extractedData.skills?.soft_skills || []).map((skill, index) => (
                          <Chip key={index} label={skill} />
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>
              </PreviewSection>
            </Grid>
            
            {/* Arbeitserfahrung */}
            <Grid item xs={12}>
              <PreviewSection>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Berufserfahrung
                  </Typography>
                  
                  {(extractedData.work_experience && extractedData.work_experience.length > 0) || 
                   (extractedData.experience && extractedData.experience.length > 0) ? (
                    <Timeline position="alternate" sx={{ mt: 2 }}>
                      {(extractedData.work_experience 
                        ? getExperienceDisplay(extractedData.work_experience) 
                        : extractedData.experience || []).map((exp, index) => (
                        <TimelineItem key={index}>
                          <TimelineOppositeContent color="text.secondary">
                            {exp.zeitraum || formatDateRange(exp.start_date, exp.end_date)}
                          </TimelineOppositeContent>
                          
                          <TimelineSeparator>
                            <TimelineDot color="primary" />
                            {index < (extractedData.work_experience?.length || extractedData.experience?.length || 0) - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          
                          <TimelineContent>
                            <Paper elevation={3} sx={{ p: 2 }}>
                              <Typography variant="h6" component="div">
                                {exp.position || exp.firma}
                              </Typography>
                              
                              <Typography color="textSecondary">
                                {exp.company || exp.firma}
                              </Typography>
                              
                              {(exp.description || exp.beschreibung) && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {exp.description || exp.beschreibung}
                                </Typography>
                              )}
                            </Paper>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  ) : (
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                      Keine Berufserfahrung gefunden
                    </Typography>
                  )}
                </CardContent>
              </PreviewSection>
            </Grid>
            
            {/* Ausbildung */}
            <Grid item xs={12}>
              <PreviewSection>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ausbildung
                  </Typography>
                  
                  {(extractedData.education && extractedData.education.length > 0) ? (
                    <Timeline position="alternate" sx={{ mt: 2 }}>
                      {(Array.isArray(extractedData.education) 
                        ? getEducationDisplay(extractedData.education) 
                        : []).map((edu, index) => (
                        <TimelineItem key={index}>
                          <TimelineOppositeContent color="text.secondary">
                            {edu.zeitraum || formatDateRange(edu.start_date, edu.end_date)}
                          </TimelineOppositeContent>
                          
                          <TimelineSeparator>
                            <TimelineDot color="secondary" />
                            {index < (extractedData.education?.length || 0) - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          
                          <TimelineContent>
                            <Paper elevation={3} sx={{ p: 2 }}>
                              <Typography variant="h6" component="div">
                                {edu.abschluss || edu.degree || 'Ausbildung'}
                              </Typography>
                              
                              <Typography color="textSecondary">
                                {edu.institution}
                              </Typography>
                              
                              {edu.fachrichtung && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {edu.fachrichtung}
                                </Typography>
                              )}
                            </Paper>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  ) : (
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                      Keine Ausbildungsdaten gefunden
                    </Typography>
                  )}
                </CardContent>
              </PreviewSection>
            </Grid>
          </Grid>

          {/* Textprobe */}
          {extractedData.text_sample && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                color="info"
                onClick={handleShowTextPreview}
                startIcon={<VisibilityIcon />}
              >
                Text-Vorschau anzeigen
              </Button>
              
              <Dialog open={showTextPreview} onClose={handleCloseTextPreview} maxWidth="md" fullWidth>
                <DialogTitle>Text-Vorschau</DialogTitle>
                <DialogContent>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {extractedData.text_sample}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseTextPreview} color="primary">
                    Schließen
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

          {/* Aktionen */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={handleUpload}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Wird gespeichert...' : 'In Datenbank speichern'}
            </Button>
          </Box>
        </PreviewContainer>
      )}
    </Box>
  );
};

export default CVUploadForm; 