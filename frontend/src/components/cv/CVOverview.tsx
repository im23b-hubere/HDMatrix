import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { CV } from '@/types/cv';
import { Work as WorkIcon, School as SchoolIcon, Code as CodeIcon, Language as LanguageIcon } from '@mui/icons-material';

interface CVOverviewProps {
  cvs: CV[];
  onSelectCV: (cv: CV) => void;
}

export const CVOverview: React.FC<CVOverviewProps> = ({ cvs, onSelectCV }) => {
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');

  const handleCVClick = async (cv: CV) => {
    setSelectedCV(cv);
    setIsLoading(true);
    
    try {
      // TODO: Implementiere API-Aufruf für KI-Analyse
      const summary = await generateAISummary(cv);
      setAiSummary(summary);
    } catch (error) {
      console.error('Fehler bei der KI-Analyse:', error);
      setAiSummary('Entschuldigung, die KI-Analyse konnte nicht durchgeführt werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISummary = async (cv: CV): Promise<string> => {
    // TODO: Implementiere echte KI-Analyse
    return `KI-Analyse für ${cv.personalInfo.firstName} ${cv.personalInfo.lastName}:
    
    Berufliche Expertise:
    - ${cv.workExperience.length} Jahre Berufserfahrung
    - Hauptkompetenzen: ${cv.skills.map(s => s.name).join(', ')}
    
    Ausbildung:
    - ${cv.education.map(e => e.degree).join(', ')}
    
    Besondere Fähigkeiten:
    - Sprachen: ${cv.languages.map(l => `${l.name} (${l.level})`).join(', ')}
    - Zertifikate: ${cv.certifications.length}
    - Projekte: ${cv.projects.length}
    
    Empfehlungen:
    - Geeignet für: ${cv.personalInfo.desiredPosition || 'Verschiedene Positionen'}
    - Verfügbar: ${cv.personalInfo.availability || 'Sofort'}
    - Präferierter Standort: ${cv.personalInfo.desiredLocation || 'Flexibel'}`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Lebenslauf-Übersicht
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        '& > *': {
          flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)', lg: '1 1 calc(33.333% - 16px)' },
          minWidth: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' }
        }
      }}>
        {cvs.map((cv) => (
          <Card 
            key={cv.id}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 6,
              },
            }}
            onClick={() => handleCVClick(cv)}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {cv.personalInfo.firstName} {cv.personalInfo.lastName}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  icon={<WorkIcon />}
                  label={`${cv.workExperience.length} Jahre Erfahrung`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<SchoolIcon />}
                  label={cv.education[0]?.degree || 'Keine Ausbildung'}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                {cv.personalInfo.summary || 'Keine Zusammenfassung verfügbar'}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {cv.skills.slice(0, 3).map((skill) => (
                  <Chip
                    key={skill.id}
                    icon={<CodeIcon />}
                    label={skill.name}
                    size="small"
                  />
                ))}
                {cv.languages.slice(0, 2).map((lang) => (
                  <Chip
                    key={lang.id}
                    icon={<LanguageIcon />}
                    label={lang.name}
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">
                Details anzeigen
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      <Dialog
        open={!!selectedCV}
        onClose={() => setSelectedCV(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          KI-Analyse: {selectedCV?.personalInfo.firstName} {selectedCV?.personalInfo.lastName}
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Typography
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              {aiSummary}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCV(null)}>Schließen</Button>
          <Button 
            variant="contained" 
            onClick={() => selectedCV && onSelectCV(selectedCV)}
          >
            Lebenslauf bearbeiten
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 