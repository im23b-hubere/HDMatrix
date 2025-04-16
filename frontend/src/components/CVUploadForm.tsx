import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, Paper, Divider, CircularProgress,
  Grid as MuiGrid, Stack, Chip, List, ListItem, ListItemText, Dialog, DialogTitle,
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
  personal_data?: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    adresse?: string;
  };
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
  skills?: {
    technische_skills?: string[];
    sprachen?: string[];
    soft_skills?: string[];
  } | string[];
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
  text_sample?: string;
  extraction_method?: string;
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
  const [mockMode, setMockMode] = useState<boolean>(false);

  // Referenz für das Vorschau-Formular, um es programmatisch zu scrollen
  const previewRef = useRef<HTMLDivElement>(null);

  // Toggle für Mock-Daten
  const handleToggleMockData = () => {
    const newValue = !mockMode;
    setMockMode(newValue);
    cvUploadService.setMockData(newValue);
    
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
              checked={mockMode}
              onChange={handleToggleMockData}
              color="primary"
            />
          }
          label="Demo-Modus"
        />
      </Box>
      
      {/* Drag & Drop Zone */}
      <DropzoneContainer {...getRootProps()}>
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 40, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          PDF hier ablegen oder klicken zum Auswählen
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Unterstützte Formate: PDF, DOC, DOCX
        </Typography>
      </DropzoneContainer>

      {/* Fehlermeldungen oder Erfolgsmeldungen */}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

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
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">
                Extrahierte Daten
              </Typography>
              {extractedData?.extraction_method && (
                <Chip
                  label={`Methode: ${extractedData.extraction_method}`}
                  color="info"
                  size="small"
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <PreviewSection>
                <CardContent>
                  {/* Persönliche Daten */}
                  {extractedData?.personal_data && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Persönliche Daten
                      </Typography>
                      <List>
                        {Object.entries(extractedData.personal_data).map(([key, value]) => (
                          value && (
                            <ListItem key={key} sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={value}
                                secondary={key.charAt(0).toUpperCase() + key.slice(1)}
                              />
                            </ListItem>
                          )
                        ))}
                      </List>
                    </>
                  )}
                </CardContent>
              </PreviewSection>
            </Box>
          </Box>

          {/* Aktionen */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            {/* Text-Vorschau Button */}
            {extractedData?.text_sample && (
              <Button
                variant="outlined"
                color="info"
                onClick={handleShowTextPreview}
                startIcon={<VisibilityIcon />}
              >
                Text-Vorschau anzeigen
              </Button>
            )}

            {/* Speichern Button */}
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

      {/* Dialog für Text-Vorschau */}
      <Dialog 
        open={showTextPreview} 
        onClose={handleCloseTextPreview} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Text-Vorschau
          <IconButton
            aria-label="close"
            onClick={handleCloseTextPreview}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {extractedData?.text_sample}
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CVUploadForm; 