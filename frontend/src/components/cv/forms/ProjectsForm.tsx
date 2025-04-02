import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  Typography,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Project } from '@/types/cv';

interface ProjectsFormProps {
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ projects, onChange }) => {
  const [newName, setName] = useState('');
  const [newDescription, setDescription] = useState('');
  const [newStartDate, setStartDate] = useState('');
  const [newEndDate, setEndDate] = useState('');
  const [newCurrent, setCurrent] = useState(false);
  const [newTechnologies, setTechnologies] = useState('');
  const [newAchievements, setAchievements] = useState('');

  const handleAddProject = () => {
    if (!newName.trim() || !newDescription.trim() || !newStartDate) {
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: newName,
      description: newDescription,
      startDate: newStartDate,
      endDate: newCurrent ? undefined : newEndDate,
      current: newCurrent,
      technologies: newTechnologies.split(',').map(tech => tech.trim()).filter(Boolean),
      achievements: newAchievements.split('\n').map(achievement => achievement.trim()).filter(Boolean),
    };

    onChange([...projects, newProject]);

    // Reset form
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setCurrent(false);
    setTechnologies('');
    setAchievements('');
  };

  const handleDeleteProject = (index: number) => {
    const updatedProjects = projects.filter((_, i) => i !== index);
    onChange(updatedProjects);
  };

  const handleUpdateProject = (index: number, field: keyof Project, value: any) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = {
      ...updatedProjects[index],
      [field]: value,
    };
    onChange(updatedProjects);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Projekte</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddProject}
        >
          Neues Projekt hinzufügen
        </Button>
      </Box>

      {projects.map((project, index) => (
        <Box key={project.id} sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle1">Projekt {index + 1}</Typography>
            <IconButton
              size="small"
              onClick={() => handleDeleteProject(index)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Name"
                value={project.name}
                onChange={(e) => handleUpdateProject(index, 'name', e.target.value)}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Startdatum"
                type="date"
                value={project.startDate}
                onChange={(e) => handleUpdateProject(index, 'startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enddatum"
                type="date"
                value={project.endDate}
                onChange={(e) => handleUpdateProject(index, 'endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={project.current}
              />
            </Grid>
            <Grid xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={project.current}
                    onChange={(e) => handleUpdateProject(index, 'current', e.target.checked)}
                  />
                }
                label="Aktuelles Projekt"
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                required
                label="Beschreibung"
                value={project.description}
                onChange={(e) => handleUpdateProject(index, 'description', e.target.value)}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Technologien (durch Kommas getrennt)"
                value={project.technologies?.join(', ')}
                onChange={(e) => handleUpdateProject(index, 'technologies', e.target.value.split(',').map(tech => tech.trim()).filter(Boolean))}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Erfolge (eine pro Zeile)"
                value={project.achievements?.join('\n')}
                onChange={(e) => handleUpdateProject(index, 'achievements', e.target.value.split('\n').map(achievement => achievement.trim()).filter(Boolean))}
              />
            </Grid>
          </Grid>
        </Box>
      ))}

      <Box sx={{ mt: 4, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Neues Projekt
        </Typography>
        <Grid container spacing={2}>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Name"
              value={newName}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Startdatum"
              type="date"
              value={newStartDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Enddatum"
              type="date"
              value={newEndDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={newCurrent}
            />
          </Grid>
          <Grid xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newCurrent}
                  onChange={(e) => setCurrent(e.target.checked)}
                />
              }
              label="Aktuelles Projekt"
            />
          </Grid>
          <Grid xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              required
              label="Beschreibung"
              value={newDescription}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Technologien (durch Kommas getrennt)"
              value={newTechnologies}
              onChange={(e) => setTechnologies(e.target.value)}
            />
          </Grid>
          <Grid xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Erfolge (eine pro Zeile)"
              value={newAchievements}
              onChange={(e) => setAchievements(e.target.value)}
            />
          </Grid>
          <Grid xs={12}>
            <Button
              variant="contained"
              onClick={handleAddProject}
              disabled={!newName.trim() || !newDescription.trim() || !newStartDate}
            >
              Hinzufügen
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}; 