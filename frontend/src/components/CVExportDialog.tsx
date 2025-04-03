import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, RadioGroup, FormControlLabel, Radio, TextField, FormControl,
  InputLabel, Select, MenuItem, Typography, Divider, Paper,
  CircularProgress, Alert
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Code as HtmlIcon,
  FormatPaint as CustomizeIcon
} from '@mui/icons-material';
import { CV } from '../types/cv';
import cvService from '../services/cvService';

// Vorlagenstile
const TEMPLATE_STYLES = [
  { id: 'professional', name: 'Professional', description: 'Klassischer, professioneller Stil für formelle Bewerbungen.' },
  { id: 'modern', name: 'Modern', description: 'Modernes Design mit klaren Linien und Farbakzenten.' },
  { id: 'minimalist', name: 'Minimalistisch', description: 'Reduziertes Design, das den Inhalt in den Vordergrund stellt.' },
  { id: 'creative', name: 'Kreativ', description: 'Auffälliges Design für kreative Berufe und Positionen.' },
  { id: 'executive', name: 'Executive', description: 'Elegantes Design für Führungskräfte und Management-Positionen.' }
];

// Exportformate
const EXPORT_FORMATS = [
  { id: 'pdf', name: 'PDF', icon: <PdfIcon /> },
  { id: 'docx', name: 'Word (DOCX)', icon: <DocIcon /> },
  { id: 'html', name: 'HTML', icon: <HtmlIcon /> }
];

// Exportsprachen
const EXPORT_LANGUAGES = [
  { id: 'de', name: 'Deutsch' },
  { id: 'en', name: 'Englisch' },
  { id: 'fr', name: 'Französisch' },
  { id: 'es', name: 'Spanisch' },
  { id: 'it', name: 'Italienisch' }
];

interface CVExportDialogProps {
  open: boolean;
  onClose: () => void;
  cv: CV;
}

const CVExportDialog: React.FC<CVExportDialogProps> = ({ open, onClose, cv }) => {
  const [templateStyle, setTemplateStyle] = useState('professional');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLanguage, setExportLanguage] = useState('de');
  const [includePhoto, setIncludePhoto] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  
  // Optionen für benutzerdefinierte Anpassungen
  const [includeSections, setIncludeSections] = useState({
    personalInfo: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    certifications: true
  });
  
  const handleExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In einer echten Anwendung würden wir hier einen API-Aufruf zum Export machen
      // Für jetzt simulieren wir den Export
      const exportOptions = {
        templateStyle,
        exportFormat,
        exportLanguage,
        includePhoto,
        customTitle: customTitle || cv.fullName,
        includeSections
      };
      
      await cvService.exportCV(cv.id, exportFormat as 'pdf' | 'docx');
      
      setLoading(false);
      onClose();
    } catch (err) {
      console.error('Fehler beim Exportieren des Lebenslaufs:', err);
      setError('Der Lebenslauf konnte nicht exportiert werden. Bitte versuchen Sie es später erneut.');
      setLoading(false);
    }
  };

  const handleToggleSection = (section: string) => {
    setIncludeSections({
      ...includeSections,
      [section]: !includeSections[section as keyof typeof includeSections]
    });
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Lebenslauf exportieren
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Exportoptionen
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Dokumenttitel"
                variant="outlined"
                fullWidth
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={cv.fullName}
                margin="normal"
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Vorlagenstil</InputLabel>
                <Select
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value)}
                  label="Vorlagenstil"
                >
                  {TEMPLATE_STYLES.map(style => (
                    <MenuItem key={style.id} value={style.id}>
                      <Box>
                        <Typography variant="body1">{style.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {style.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Exportformat</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  label="Exportformat"
                >
                  {EXPORT_FORMATS.map(format => (
                    <MenuItem key={format.id} value={format.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {format.icon}
                        <Typography>{format.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Sprache</InputLabel>
                <Select
                  value={exportLanguage}
                  onChange={(e) => setExportLanguage(e.target.value)}
                  label="Sprache"
                >
                  {EXPORT_LANGUAGES.map(lang => (
                    <MenuItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Radio
                    checked={includePhoto}
                    onChange={(e) => setIncludePhoto(e.target.checked)}
                  />
                }
                label="Foto einschließen"
              />
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<CustomizeIcon />}
              onClick={() => setCustomMode(!customMode)}
              sx={{ mb: 2 }}
              fullWidth
            >
              {customMode ? 'Einfachen Modus anzeigen' : 'Erweiterte Anpassungen'}
            </Button>
          </Box>
          
          {customMode && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Inhalt anpassen
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Wählen Sie aus, welche Abschnitte im exportierten Dokument enthalten sein sollen.
              </Typography>
              
              <FormControlLabel
                control={
                  <Radio
                    checked={includeSections.personalInfo}
                    onChange={() => handleToggleSection('personalInfo')}
                  />
                }
                label="Persönliche Informationen"
              />
              
              <FormControlLabel
                control={
                  <Radio
                    checked={includeSections.summary}
                    onChange={() => handleToggleSection('summary')}
                  />
                }
                label="Zusammenfassung / Profil"
              />
              
              <FormControlLabel
                control={
                  <Radio
                    checked={includeSections.skills}
                    onChange={() => handleToggleSection('skills')}
                  />
                }
                label="Fähigkeiten"
              />
              
              <FormControlLabel
                control={
                  <Radio
                    checked={includeSections.experience}
                    onChange={() => handleToggleSection('experience')}
                  />
                }
                label="Berufserfahrung"
              />
              
              <FormControlLabel
                control={
                  <Radio
                    checked={includeSections.education}
                    onChange={() => handleToggleSection('education')}
                  />
                }
                label="Ausbildung"
              />
              
              <FormControlLabel
                control={
                  <Radio
                    checked={includeSections.projects}
                    onChange={() => handleToggleSection('projects')}
                  />
                }
                label="Projekte"
              />
              
              <FormControlLabel
                control={
                  <Radio
                    checked={includeSections.certifications}
                    onChange={() => handleToggleSection('certifications')}
                  />
                }
                label="Zertifikate"
              />
            </Box>
          )}
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Vorschau:
          </Typography>
          
          <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
              height: 200, 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'background.default',
              color: 'text.secondary',
              p: 2
            }}
          >
            <Typography>
              Vorschau für {TEMPLATE_STYLES.find(t => t.id === templateStyle)?.name}-Vorlage in {EXPORT_LANGUAGES.find(l => l.id === exportLanguage)?.name}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button 
          variant="contained" 
          startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? 'Wird exportiert...' : 'Exportieren'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CVExportDialog; 