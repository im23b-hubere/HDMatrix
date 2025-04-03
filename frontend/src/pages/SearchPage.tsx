import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, TextField, Chip, Button, Grid,
  Paper, Divider, Card, CardContent, Avatar, IconButton, 
  Autocomplete, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Rating, Badge, Tabs, Tab,
  List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  WorkOutline as WorkIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Add as AddIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import cvService from '../services/cvService';
import { CV, Skill, Employee, Project } from '../types/cv';
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [skillSearch, setSkillSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CV[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [skillOptions, setSkillOptions] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [experience, setExperience] = useState<string>('');
  const [availableFrom, setAvailableFrom] = useState<string>('');
  const [searchTeam, setSearchTeam] = useState(false);
  const [teamSize, setTeamSize] = useState<number>(2);
  const [projectDuration, setProjectDuration] = useState<string>('');
  const theme = useTheme();

  // Lade Skill-Optionen, sobald die Komponente geladen wird
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        // TODO: Ersetzen mit einem tatsächlichen API-Aufruf
        const categories = await cvService.getSkillCategories();
        const skills: Skill[] = [];
        
        // Flache Skill-Liste erstellen
        categories.forEach(category => {
          category.skills.forEach(skill => {
            skills.push({
              id: skill.id,
              name: skill.name,
              category: category.name,
              level: 0
            });
          });
        });
        
        setSkillOptions(skills);
      } catch (error) {
        console.error('Fehler beim Laden der Skills:', error);
      }
    };
    
    fetchSkills();
  }, []);

  const handleSearchBySkills = async () => {
    if (selectedSkills.length === 0) {
      return;
    }
    
    setLoading(true);
    setSearchResults([]);
    
    try {
      // Hier würde ein API-Aufruf erfolgen
      const results = await cvService.searchCVsBySkills(
        selectedSkills.map(skill => skill.id), 
        searchTeam ? teamSize : 1,
        experience ? parseInt(experience) : 0
      );
      
      setSearchResults(results);
      // Speichern der Suche im lokalen Verlauf
      saveSearchToHistory();
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Speichern der Suche im lokalen Verlauf für spätere Verwendung
  const saveSearchToHistory = () => {
    // Nur eindeutige Suchen speichern
    if (selectedSkills.length === 0) return;
    
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    const newSearch = {
      id: Date.now().toString(),
      skills: selectedSkills,
      date: new Date().toISOString()
    };
    
    // Vor dem Speichern prüfen, ob eine ähnliche Suche bereits existiert
    const isExistingSearch = searchHistory.some((search: any) => 
      JSON.stringify(search.skills.map((s: any) => s.id).sort()) === 
      JSON.stringify(selectedSkills.map(s => s.id).sort())
    );
    
    if (!isExistingSearch) {
      // Maximal 5 Suchen speichern und älteste entfernen
      const updatedHistory = [newSearch, ...searchHistory].slice(0, 5);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    }
  };

  // Berechnen der Skill-Match-Prozentsatz pro Kandidat
  const calculateMatchPercentage = (cv: CV) => {
    const matchingSkills = cv.skills.filter(skill => 
      selectedSkills.some(selected => selected.id === skill.id)
    );
    
    return Math.round((matchingSkills.length / selectedSkills.length) * 100);
  };

  // Farbberechnung basierend auf Übereinstimmungsprozentsatz
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return theme.palette.success.main;
    if (percentage >= 60) return theme.palette.info.main;
    if (percentage >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSkillsChange = (event: React.SyntheticEvent, newValue: Skill[]) => {
    setSelectedSkills(newValue);
  };

  const handleViewCV = (cvId: string) => {
    navigate(`/cvs/${cvId}`);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Skill-Suche
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="search tabs">
          <Tab 
            icon={<PersonIcon />} 
            iconPosition="start" 
            label="Mitarbeiter finden" 
          />
          <Tab 
            icon={<GroupIcon />} 
            iconPosition="start" 
            label="Team zusammenstellen" 
          />
          <Tab 
            icon={<WorkIcon />} 
            iconPosition="start" 
            label="Projekt besetzen" 
          />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Box component="form" noValidate autoComplete="off">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Suche nach Mitarbeitern mit bestimmten Fähigkeiten
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                id="skill-search"
                options={skillOptions}
                getOptionLabel={(option) => `${option.name} (${option.category})`}
                groupBy={(option) => option.category}
                filterSelectedOptions
                value={selectedSkills}
                onChange={handleSkillsChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Skills auswählen"
                    placeholder="Skills hinzufügen"
                    error={selectedSkills.length === 0 && loading}
                    helperText={selectedSkills.length === 0 && loading ? "Mindestens ein Skill ist erforderlich" : ""}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      color="primary"
                      size="small"
                    />
                  ))
                }
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="experience-label">Erfahrung</InputLabel>
                <Select
                  labelId="experience-label"
                  id="experience"
                  value={experience}
                  label="Erfahrung"
                  onChange={(e) => setExperience(e.target.value)}
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="1">1+ Jahre</MenuItem>
                  <MenuItem value="2">2+ Jahre</MenuItem>
                  <MenuItem value="3">3+ Jahre</MenuItem>
                  <MenuItem value="5">5+ Jahre</MenuItem>
                  <MenuItem value="8">8+ Jahre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="availability-label">Verfügbar ab</InputLabel>
                <Select
                  labelId="availability-label"
                  id="availability"
                  value={availableFrom}
                  label="Verfügbar ab"
                  onChange={(e) => setAvailableFrom(e.target.value)}
                >
                  <MenuItem value="">Jederzeit</MenuItem>
                  <MenuItem value="now">Sofort</MenuItem>
                  <MenuItem value="1month">In 1 Monat</MenuItem>
                  <MenuItem value="3month">In 3 Monaten</MenuItem>
                  <MenuItem value="6month">In 6 Monaten</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                onClick={handleSearchBySkills}
                disabled={selectedSkills.length === 0 || loading}
              >
                {loading ? "Suche läuft..." : "Suchen"}
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {searchResults.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Suchergebnisse ({searchResults.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {searchResults.map((cv) => {
                const matchPercentage = calculateMatchPercentage(cv);
                const matchColor = getMatchColor(matchPercentage);
                
                return (
                  <Card 
                    key={cv.id} 
                    sx={{ 
                      mb: 2, 
                      position: 'relative',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        right: 16,
                        top: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: alpha(matchColor, 0.1),
                        border: `2px solid ${matchColor}`,
                        color: matchColor,
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        zIndex: 1
                      }}
                    >
                      {matchPercentage}%
                    </Box>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={1}>
                          <Avatar 
                            sx={{ 
                              width: 70, 
                              height: 70,
                              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.15)}`
                            }}
                            alt={cv.personalInfo?.fullName || cv.fullName}
                            src={(cv.personalInfo?.photoUrl || cv.photoUrl) || ''}
                          >
                            {(cv.personalInfo?.fullName || cv.fullName)?.charAt(0)}
                          </Avatar>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="h6" fontWeight="500">{cv.personalInfo?.fullName || cv.fullName}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <WorkIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                            {cv.personalInfo?.position || cv.position}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                            {cv.personalInfo?.location || cv.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                            {cv.experience[0]?.company || 'Nicht angegeben'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <Typography variant="subtitle2" fontWeight="500">Passende Skills:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                            {cv.skills
                              .filter(skill => selectedSkills.some(s => s.id === skill.id))
                              .map(skill => (
                                <Chip 
                                  key={skill.id} 
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {skill.name}
                                      {skill.level ? (
                                        <Box component="span" ml={0.5} display="flex">
                                          <Rating value={skill.level} readOnly size="small" max={5} />
                                        </Box>
                                      ) : null}
                                    </Box>
                                  }
                                  size="small" 
                                  color="primary" 
                                  variant="outlined" 
                                  sx={{ 
                                    borderColor: alpha(theme.palette.primary.main, 0.5),
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                  }}
                                />
                              ))}
                          </Box>
                          
                          <Typography variant="subtitle2" fontWeight="500" mt={2}>Weitere Skills:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                            {cv.skills
                              .filter(skill => !selectedSkills.some(s => s.id === skill.id))
                              .slice(0, 5) // Begrenze auf 5 zusätzliche Skills
                              .map(skill => (
                                <Chip 
                                  key={skill.id} 
                                  label={skill.name}
                                  size="small" 
                                  variant="outlined" 
                                  sx={{ 
                                    borderColor: alpha(theme.palette.text.secondary, 0.3),
                                    color: theme.palette.text.secondary
                                  }}
                                />
                              ))}
                            {cv.skills.filter(skill => !selectedSkills.some(s => s.id === skill.id)).length > 5 && (
                              <Chip 
                                label={`+${cv.skills.filter(skill => !selectedSkills.some(s => s.id === skill.id)).length - 5} weitere`}
                                size="small" 
                                variant="outlined"
                                sx={{ fontStyle: 'italic' }}
                              />
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Button 
                            variant="contained" 
                            color="primary"
                            size="medium"
                            onClick={() => handleViewCV(cv.id)}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ 
                              borderRadius: 10,
                              px: 2,
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                            }}
                          >
                            Profil ansehen
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              })}
            </List>
          </Box>
        )}
        
        {searchResults.length === 0 && !loading && selectedSkills.length > 0 && (
          <Box 
            mt={4} 
            textAlign="center"
            sx={{
              p: 4,
              borderRadius: 2,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <SearchIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.5), mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Keine Mitarbeiter mit den angegebenen Kriterien gefunden
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Versuchen Sie, Ihre Suchkriterien zu ändern oder weniger spezifische Skills auszuwählen.
            </Typography>
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Box component="form" noValidate autoComplete="off">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Team nach benötigten Fähigkeiten zusammenstellen
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                id="team-skill-search"
                options={skillOptions}
                getOptionLabel={(option) => `${option.name} (${option.category})`}
                groupBy={(option) => option.category}
                filterSelectedOptions
                value={selectedSkills}
                onChange={handleSkillsChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Benötigte Skills"
                    placeholder="Skills hinzufügen"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                id="team-size"
                label="Teamgröße"
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value))}
                InputProps={{
                  inputProps: { min: 2, max: 20 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="project-duration-label">Projektdauer</InputLabel>
                <Select
                  labelId="project-duration-label"
                  id="project-duration"
                  value={projectDuration}
                  label="Projektdauer"
                  onChange={(e) => setProjectDuration(e.target.value)}
                >
                  <MenuItem value="">Beliebig</MenuItem>
                  <MenuItem value="1month">1 Monat</MenuItem>
                  <MenuItem value="3month">3 Monate</MenuItem>
                  <MenuItem value="6month">6 Monate</MenuItem>
                  <MenuItem value="1year">1 Jahr</MenuItem>
                  <MenuItem value="2year">2+ Jahre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={() => {
                  setSearchTeam(true);
                  handleSearchBySkills();
                }}
                disabled={selectedSkills.length === 0 || loading}
              >
                Team zusammenstellen
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {searchResults.length > 0 && searchTeam && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Vorgeschlagenes Team ({searchResults.length} Mitglieder)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {searchResults.map((cv) => (
                <Card key={cv.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={1}>
                        <Avatar 
                          sx={{ width: 60, height: 60 }}
                          alt={cv.personalInfo.fullName}
                          src={cv.personalInfo.photoUrl || ''}
                        >
                          {cv.personalInfo.fullName.charAt(0)}
                        </Avatar>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6">{cv.personalInfo.fullName}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {cv.personalInfo.position}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <Typography variant="subtitle2">Verantwortlich für:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {cv.skills
                            .filter(skill => selectedSkills.some(s => s.id === skill.id))
                            .map(skill => (
                              <Chip 
                                key={skill.id} 
                                label={skill.name} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                              />
                            ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => handleViewCV(cv.id)}
                        >
                          Profil ansehen
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </List>
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Box component="form" noValidate autoComplete="off">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Projektanforderungen definieren und Team zusammenstellen
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="project-name"
                label="Projektname"
                placeholder="Geben Sie den Namen des Projekts ein"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="project-client"
                label="Kunde/Auftraggeber"
                placeholder="Für wen ist das Projekt?"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="project-description"
                label="Projektbeschreibung"
                multiline
                rows={3}
                placeholder="Beschreiben Sie kurz das Projekt und dessen Anforderungen"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Benötigte Fähigkeiten und Ressourcen
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                id="project-skill-search"
                options={skillOptions}
                getOptionLabel={(option) => `${option.name} (${option.category})`}
                groupBy={(option) => option.category}
                filterSelectedOptions
                value={selectedSkills}
                onChange={handleSkillsChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Benötigte Skills"
                    placeholder="Skills hinzufügen"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                id="team-size-project"
                label="Teamgröße"
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value))}
                InputProps={{
                  inputProps: { min: 1, max: 20 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="project-duration-label">Projektdauer</InputLabel>
                <Select
                  labelId="project-duration-label"
                  id="project-duration"
                  value={projectDuration}
                  label="Projektdauer"
                  onChange={(e) => setProjectDuration(e.target.value)}
                >
                  <MenuItem value="1month">1 Monat</MenuItem>
                  <MenuItem value="3month">3 Monate</MenuItem>
                  <MenuItem value="6month">6 Monate</MenuItem>
                  <MenuItem value="1year">1 Jahr</MenuItem>
                  <MenuItem value="2year">2+ Jahre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={() => {
                  setSearchTeam(true);
                  handleSearchBySkills();
                }}
                disabled={selectedSkills.length === 0 || loading}
              >
                Passendes Team finden
              </Button>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>
    </Container>
  );
};

export default SearchPage; 