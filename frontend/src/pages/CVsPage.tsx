import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Card, CardContent, 
  CardActions, Grid, Chip, Avatar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, Alert, AlertTitle, Divider, Tooltip,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import cvService from '../services/cvService';
import { CV } from '../types/cv';

interface CVItemProps {
  cv: Partial<CV>;
  onClick: (id: string | number) => void;
}

const CVItem: React.FC<CVItemProps> = ({ cv, onClick }) => {
  const handleClick = () => {
    if (cv.id) {
      onClick(cv.id);
    }
  };

  // Berechnet, wie lange der CV zuletzt aktualisiert wurde
  const getLastUpdatedText = (dateString?: string) => {
    if (!dateString) return 'Nie aktualisiert';
    
    const lastUpdated = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute aktualisiert';
    if (diffDays === 1) return 'Gestern aktualisiert';
    if (diffDays < 7) return `Vor ${diffDays} Tagen aktualisiert`;
    if (diffDays < 30) return `Vor ${Math.floor(diffDays / 7)} Wochen aktualisiert`;
    if (diffDays < 365) return `Vor ${Math.floor(diffDays / 30)} Monaten aktualisiert`;
    return `Vor ${Math.floor(diffDays / 365)} Jahren aktualisiert`;
  };

  return (
    <Card 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }
      }} 
      onClick={handleClick}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {cv.photoUrl ? (
            <Avatar src={cv.photoUrl} sx={{ width: 56, height: 56, mr: 2 }} />
          ) : (
            <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}>
              {cv.fullName?.charAt(0) || <PersonIcon />}
            </Avatar>
          )}
          <Box>
            <Typography variant="h6" component="h2" noWrap>
              {cv.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {cv.position || 'Keine Position angegeben'}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {cv.location || 'Kein Standort angegeben'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cv.summary || 'Keine Zusammenfassung verfügbar'}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {cv.skills?.slice(0, 5).map((skill) => (
            <Chip 
              key={skill.id} 
              label={skill.name} 
              size="small" 
              sx={{ backgroundColor: `${getSkillColor(skill.category)}20`, color: getSkillColor(skill.category) }}
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
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {getLastUpdatedText(cv.lastUpdated)}
          </Typography>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box>
          <Tooltip title="Berufserfahrungen">
            <Chip 
              label={`${(cv as any).experienceCount || 0} Berufserfahrungen`} 
              size="small" 
              sx={{ mr: 1 }}
            />
          </Tooltip>
          <Tooltip title="Ausbildungen">
            <Chip 
              label={`${(cv as any).educationCount || 0} Ausbildungen`} 
              size="small"
            />
          </Tooltip>
        </Box>
        <Tooltip title="CV anzeigen">
          <Button size="small" color="primary">Details</Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
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
    'Soft Skills': '#607d8b',           // Grau-Blau
    'Frontend': '#2196f3',             // Blau
    'Backend': '#4caf50'               // Grün
  };
  
  return colors[category] || '#757575';  // Standard-Grau, wenn keine Kategorie übereinstimmt
};

interface EmployeeData {
  fullName: string;
  position: string;
  email: string;
  phone: string;
  location: string;
}

const CVsPage: React.FC = () => {
  const navigate = useNavigate();
  const [cvs, setCVs] = useState<Partial<CV>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('name');
  const [showNewEmployeeDialog, setShowNewEmployeeDialog] = useState<boolean>(false);
  const [newEmployeeData, setNewEmployeeData] = useState<EmployeeData>({
    fullName: '',
    position: '',
    email: '',
    phone: '',
    location: ''
  });
  
  useEffect(() => {
    fetchCVs();
  }, []);
  
  const fetchCVs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Vorübergehend verwenden wir getMockCVs, bis die Backend-API fertig ist
      // const data = await cvService.getAllCVs();
      const data = cvService.getMockCVs();
      setCVs(data);
    } catch (err) {
      console.error('Fehler beim Laden der CVs:', err);
      setError('CVs konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCVClick = (id: string | number) => {
    navigate(`/cvs/${id}`);
  };
  
  const handleCreateEmployee = async () => {
    // Validierung
    if (!newEmployeeData.fullName.trim()) {
      setError('Bitte geben Sie einen Namen ein.');
      return;
    }
    
    if (!newEmployeeData.email.trim()) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }
    
    try {
      const employee = await cvService.createEmployee(newEmployeeData);
      
      // Nachdem der Mitarbeiter erstellt wurde, erstellen wir einen leeren Lebenslauf
      const cv = await cvService.createCV({ employeeId: employee.id, summary: '' });
      
      // Dialog schließen und zur CV-Bearbeitungsseite navigieren
      setShowNewEmployeeDialog(false);
      navigate(`/cvs/${cv.id}/edit`);
    } catch (err) {
      console.error('Fehler beim Erstellen des Mitarbeiters:', err);
      setError('Der Mitarbeiter konnte nicht erstellt werden. Bitte versuchen Sie es später erneut.');
    }
  };
  
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterCategory(event.target.value);
  };
  
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortOption(event.target.value);
  };
  
  const filteredAndSortedCVs = () => {
    let result = [...cvs];
    
    // Filtern nach Suchbegriff
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(cv => 
        cv.fullName?.toLowerCase().includes(searchLower) || 
        cv.position?.toLowerCase().includes(searchLower) ||
        cv.summary?.toLowerCase().includes(searchLower) ||
        cv.skills?.some((s) => s.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtern nach Kategorie
    if (filterCategory) {
      result = result.filter(cv => 
        cv.skills?.some((s) => s.category === filterCategory)
      );
    }
    
    // Sortieren
    switch (sortOption) {
      case 'name':
        result.sort((a, b) => {
          if (a.fullName && b.fullName) {
            return a.fullName.localeCompare(b.fullName);
          }
          return 0;
        });
        break;
      case 'date':
        result.sort((a, b) => {
          if (!a.lastUpdated) return 1;
          if (!b.lastUpdated) return -1;
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        });
        break;
      case 'skills':
        result.sort((a, b) => (b.skills?.length || 0) - (a.skills?.length || 0));
        break;
      default:
        break;
    }
    
    return result;
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Lebensläufe
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/cvs/new')}
            >
              Neuer Lebenslauf
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setShowNewEmployeeDialog(true)}
            >
              Neuer Mitarbeiter
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Fehler</AlertTitle>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: 500 }}>
            <TextField
              label="Suche"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} /> }}
              size="small"
            />
          </Box>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="category-filter-label">Kategorie</InputLabel>
            <Select
              labelId="category-filter-label"
              value={filterCategory}
              onChange={handleFilterChange}
              label="Kategorie"
              startAdornment={<FilterIcon sx={{ color: 'action.active', mr: 1 }} />}
            >
              <MenuItem value="">Alle Kategorien</MenuItem>
              <MenuItem value="Programmiersprachen">Programmiersprachen</MenuItem>
              <MenuItem value="Frameworks">Frameworks</MenuItem>
              <MenuItem value="Datenbanken">Datenbanken</MenuItem>
              <MenuItem value="Tools & Software">Tools & Software</MenuItem>
              <MenuItem value="Methoden">Methoden</MenuItem>
              <MenuItem value="Sprachen">Sprachen</MenuItem>
              <MenuItem value="Soft Skills">Soft Skills</MenuItem>
              <MenuItem value="Frontend">Frontend</MenuItem>
              <MenuItem value="Backend">Backend</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-option-label">Sortieren nach</InputLabel>
            <Select
              labelId="sort-option-label"
              value={sortOption}
              onChange={handleSortChange}
              label="Sortieren nach"
              startAdornment={<SortIcon sx={{ color: 'action.active', mr: 1 }} />}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="date">Zuletzt aktualisiert</MenuItem>
              <MenuItem value="skills">Anzahl der Skills</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : cvs.length === 0 ? (
          <Box sx={{ textAlign: 'center', my: 4, p: 4, border: '1px dashed #ccc', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Keine Lebensläufe gefunden
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Erstellen Sie einen neuen Mitarbeiter, um mit der Eingabe von Lebenslaufdaten zu beginnen.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setShowNewEmployeeDialog(true)}
            >
              Neuer Mitarbeiter
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredAndSortedCVs().map(cv => (
              <Grid key={cv.id || Math.random()} item xs={12} sm={6} md={4} lg={3}>
                <CVItem cv={cv} onClick={handleCVClick} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* Dialog zum Erstellen eines neuen Mitarbeiters */}
      <Dialog
        open={showNewEmployeeDialog}
        onClose={() => setShowNewEmployeeDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Neuen Mitarbeiter erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name *"
              variant="outlined"
              fullWidth
              value={newEmployeeData.fullName}
              onChange={(e) => setNewEmployeeData({...newEmployeeData, fullName: e.target.value})}
              required
            />
            <TextField
              label="Position"
              variant="outlined"
              fullWidth
              value={newEmployeeData.position}
              onChange={(e) => setNewEmployeeData({...newEmployeeData, position: e.target.value})}
            />
            <TextField
              label="E-Mail *"
              variant="outlined"
              fullWidth
              type="email"
              value={newEmployeeData.email}
              onChange={(e) => setNewEmployeeData({...newEmployeeData, email: e.target.value})}
              required
            />
            <TextField
              label="Telefon"
              variant="outlined"
              fullWidth
              value={newEmployeeData.phone}
              onChange={(e) => setNewEmployeeData({...newEmployeeData, phone: e.target.value})}
            />
            <TextField
              label="Standort"
              variant="outlined"
              fullWidth
              value={newEmployeeData.location}
              onChange={(e) => setNewEmployeeData({...newEmployeeData, location: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewEmployeeDialog(false)}>Abbrechen</Button>
          <Button onClick={handleCreateEmployee} variant="contained">Erstellen</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CVsPage; 