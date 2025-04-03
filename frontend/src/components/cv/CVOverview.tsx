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
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import { CV } from '@/types/cv';
import {
  Work as WorkIcon,
  School as SchoolIcon,
  Code as CodeIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';

interface CVOverviewProps {
  cvs: CV[];
  onSelectCV: (cv: CV) => void;
}

export const CVOverview: React.FC<CVOverviewProps> = ({ cvs, onSelectCV }) => {
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  const handleCVClick = async (cv: CV) => {
    setSelectedCV(cv);
    setIsLoading(true);
    
    try {
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
    const firstName = cv.personalInfo?.firstName || '';
    const lastName = cv.personalInfo?.lastName || '';
    const experienceYears = cv.experience?.length || 0;
    const skillsList = cv.skills?.join(', ') || 'Keine angegeben';
    const educationList = cv.education?.map(e => e.degree).join(', ') || 'Keine angegeben';
    const languagesList = cv.languages?.join(', ') || 'Keine angegeben';
    const certificatesCount = cv.certifications?.length || 0;
    const projectsCount = cv.projects?.length || 0;

    return `KI-Analyse für ${firstName} ${lastName}:
    
    Berufliche Expertise:
    - ${experienceYears} Jahre Erfahrung
    - Hauptkompetenzen: ${skillsList}
    
    Ausbildung:
    - ${educationList}
    
    Besondere Fähigkeiten:
    - Sprachen: ${languagesList}
    - Zertifikate: ${certificatesCount}
    - Projekte: ${projectsCount}`;
  };

  const renderDetailView = (cv: CV) => (
    <DialogContent>
      <Grid container spacing={3}>
        <Grid sx={{ gridArea: { xs: '1 / 1 / 2 / 13', md: '1 / 1 / 2 / 5' } }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            {cv.personalInfo?.profilePicture ? (
              <Avatar
                src={cv.personalInfo.profilePicture}
                sx={{ width: 150, height: 150, margin: 'auto' }}
              />
            ) : (
              <Avatar sx={{ width: 150, height: 150, margin: 'auto', bgcolor: 'primary.main' }}>
                {cv.personalInfo?.firstName?.[0]}{cv.personalInfo?.lastName?.[0]}
              </Avatar>
            )}
          </Box>
          <List>
            {cv.personalInfo?.email && (
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary={cv.personalInfo.email} />
              </ListItem>
            )}
            {cv.personalInfo?.phone && (
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary={cv.personalInfo.phone} />
              </ListItem>
            )}
            {cv.personalInfo?.location && (
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText primary={cv.personalInfo.location} />
              </ListItem>
            )}
          </List>
        </Grid>
        <Grid sx={{ gridArea: { xs: '2 / 1 / 3 / 13', md: '1 / 5 / 2 / 13' } }}>
          <Typography variant="h6" gutterBottom>
            Zusammenfassung
          </Typography>
          <Typography paragraph>
            {cv.personalInfo?.summary || 'Keine Zusammenfassung verfügbar'}
          </Typography>

          <Typography variant="h6" gutterBottom>
            Fähigkeiten
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {cv.skills?.map((skill, index) => (
              <Chip
                key={index}
                icon={<CodeIcon />}
                label={skill}
                size="small"
              />
            ))}
          </Box>

          <Typography variant="h6" gutterBottom>
            Sprachen
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {cv.languages?.map((lang, index) => (
              <Chip
                key={index}
                icon={<LanguageIcon />}
                label={lang}
                size="small"
              />
            ))}
          </Box>

          <Typography variant="h6" gutterBottom>
            Berufserfahrung
          </Typography>
          {cv.experience?.map((exp, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {exp.company || exp.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {exp.start_year} - {exp.end_year}
              </Typography>
              <Typography variant="body2">
                {exp.description}
              </Typography>
              {exp.technologies && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {exp.technologies.map((tech, techIndex) => (
                    <Chip
                      key={techIndex}
                      label={tech}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}

          <Typography variant="h6" gutterBottom>
            Ausbildung
          </Typography>
          {cv.education?.map((edu, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {edu.degree}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {edu.institution} • {edu.start_year} - {edu.end_year}
              </Typography>
              {edu.details && (
                <Typography variant="body2">
                  {edu.details}
                </Typography>
              )}
            </Box>
          ))}
        </Grid>
      </Grid>
    </DialogContent>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Lebenslauf-Übersicht
      </Typography>

      {cvs.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
          Keine Lebensläufe verfügbar
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {cvs.map((cv) => (
            <Grid key={cv.id} sx={{ width: { xs: '100%', sm: '50%', lg: '33.333%' }, p: 2 }}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease-in-out',
                  },
                }}
                onClick={() => handleCVClick(cv)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    {cv.personalInfo?.profilePicture ? (
                      <Avatar
                        src={cv.personalInfo.profilePicture}
                        sx={{ width: 56, height: 56, mr: 2 }}
                        alt={`${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`}
                      />
                    ) : (
                      <Avatar 
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2,
                          bgcolor: 'primary.main',
                          fontSize: '1.4rem'
                        }}
                      >
                        {cv.personalInfo?.firstName?.[0]}{cv.personalInfo?.lastName?.[0]}
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 500 }}>
                        {cv.personalInfo?.firstName
                          ? `${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`
                          : 'Neuer Lebenslauf'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cv.personalInfo?.title || 'Position nicht angegeben'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {cv.experience && cv.experience.length > 0 && (
                      <Chip
                        icon={<WorkIcon />}
                        label={`${cv.experience.length} Jahre Erfahrung`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {cv.education && cv.education.length > 0 && (
                      <Chip
                        icon={<SchoolIcon />}
                        label={cv.education[0].degree}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minHeight: '3.6em'
                    }}
                  >
                    {cv.personalInfo?.summary || 'Keine Zusammenfassung verfügbar'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {cv.skills?.slice(0, 5).map((skill, index) => (
                      <Chip
                        key={index}
                        icon={<CodeIcon />}
                        label={skill}
                        size="small"
                        sx={{
                          bgcolor: 'background.default',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      />
                    ))}
                    {cv.skills && cv.skills.length > 5 && (
                      <Chip
                        label={`+${cv.skills.length - 5}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCV(cv);
                      setShowDetails(true);
                    }}
                  >
                    Details anzeigen
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={!!selectedCV && showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {selectedCV?.personalInfo?.firstName} {selectedCV?.personalInfo?.lastName}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {selectedCV?.personalInfo?.title}
            </Typography>
          </Box>
        </DialogTitle>
        {selectedCV && renderDetailView(selectedCV)}
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Schließen
          </Button>
          <Button 
            variant="contained" 
            onClick={() => selectedCV && onSelectCV(selectedCV)}
          >
            Lebenslauf bearbeiten
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!selectedCV && !showDetails}
        onClose={() => setSelectedCV(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          KI-Analyse: {selectedCV?.personalInfo?.firstName} {selectedCV?.personalInfo?.lastName}
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
          <Button onClick={() => setSelectedCV(null)}>
            Schließen
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowDetails(true);
            }}
          >
            Details anzeigen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 