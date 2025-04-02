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
  Chip,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { WorkExperience } from '@/types/cv';

interface WorkExperienceFormProps {
  workExperience: WorkExperience[];
  onChange: (workExperience: WorkExperience[]) => void;
}

export const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({ workExperience, onChange }) => {
  const [newCompany, setCompany] = useState('');
  const [newPosition, setPosition] = useState('');
  const [newStartDate, setStartDate] = useState('');
  const [newEndDate, setEndDate] = useState('');
  const [newCurrent, setCurrent] = useState(false);
  const [newLocation, setLocation] = useState('');
  const [newDescription, setDescription] = useState('');
  const [newSkill, setSkill] = useState('');
  const [newAchievement, setAchievement] = useState('');

  const handleAddExperience = () => {
    if (!newCompany.trim() || !newPosition.trim() || !newStartDate) {
      return;
    }

    const newExperience: WorkExperience = {
      id: Date.now().toString(),
      company: newCompany,
      position: newPosition,
      startDate: newStartDate,
      endDate: newCurrent ? undefined : newEndDate,
      current: newCurrent,
      location: newLocation,
      description: newDescription,
      skills: [],
      achievements: [],
      technologies: [],
    };

    onChange([...workExperience, newExperience]);

    // Reset form
    setCompany('');
    setPosition('');
    setStartDate('');
    setEndDate('');
    setCurrent(false);
    setLocation('');
    setDescription('');
    setSkill('');
    setAchievement('');
  };

  const handleDeleteExperience = (index: number) => {
    const updatedExperience = workExperience.filter((_, i) => i !== index);
    onChange(updatedExperience);
  };

  const handleUpdateExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updatedExperience = [...workExperience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value,
    };
    onChange(updatedExperience);
  };

  const handleAddSkill = (index: number) => {
    if (!newSkill.trim()) {
      return;
    }

    const updatedExperience = [...workExperience];
    if (!updatedExperience[index].skills) {
      updatedExperience[index].skills = [];
    }
    updatedExperience[index].skills.push(newSkill);
    onChange(updatedExperience);
    setSkill('');
  };

  const handleDeleteSkill = (index: number, skillIndex: number) => {
    const updatedExperience = [...workExperience];
    if (updatedExperience[index].skills) {
      updatedExperience[index].skills = updatedExperience[index].skills.filter((_, i) => i !== skillIndex);
    }
    onChange(updatedExperience);
  };

  const handleAddAchievement = (index: number) => {
    if (!newAchievement.trim()) {
      return;
    }

    const updatedExperience = [...workExperience];
    if (!updatedExperience[index].achievements) {
      updatedExperience[index].achievements = [];
    }
    updatedExperience[index].achievements.push(newAchievement);
    onChange(updatedExperience);
    setAchievement('');
  };

  const handleDeleteAchievement = (index: number, achievementIndex: number) => {
    const updatedExperience = [...workExperience];
    if (updatedExperience[index].achievements) {
      updatedExperience[index].achievements = updatedExperience[index].achievements.filter((_, i) => i !== achievementIndex);
    }
    onChange(updatedExperience);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Berufserfahrung</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddExperience}
        >
          Neue Erfahrung hinzufügen
        </Button>
      </Box>

      {workExperience.map((experience, index) => (
        <Box key={experience.id} sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle1">Berufserfahrung {index + 1}</Typography>
            <IconButton
              size="small"
              onClick={() => handleDeleteExperience(index)}
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
                label="Unternehmen"
                value={experience.company}
                onChange={(e) => handleUpdateExperience(index, 'company', e.target.value)}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Position"
                value={experience.position}
                onChange={(e) => handleUpdateExperience(index, 'position', e.target.value)}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Startdatum"
                type="date"
                value={experience.startDate}
                onChange={(e) => handleUpdateExperience(index, 'startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enddatum"
                type="date"
                value={experience.endDate}
                onChange={(e) => handleUpdateExperience(index, 'endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={experience.current}
              />
            </Grid>
            <Grid xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={experience.current}
                    onChange={(e) => handleUpdateExperience(index, 'current', e.target.checked)}
                  />
                }
                label="Aktuelle Position"
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Standort"
                value={experience.location}
                onChange={(e) => handleUpdateExperience(index, 'location', e.target.value)}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Beschreibung"
                value={experience.description}
                onChange={(e) => handleUpdateExperience(index, 'description', e.target.value)}
              />
            </Grid>

            {/* Skills */}
            <Grid xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Fähigkeiten
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  label="Neue Fähigkeit"
                  value={newSkill}
                  onChange={(e) => setSkill(e.target.value)}
                />
                <Button
                  variant="outlined"
                  onClick={() => handleAddSkill(index)}
                  disabled={!newSkill.trim()}
                >
                  Hinzufügen
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {experience.skills?.map((skill, skillIndex) => (
                  <Chip
                    key={skillIndex}
                    label={skill}
                    onDelete={() => handleDeleteSkill(index, skillIndex)}
                  />
                ))}
              </Stack>
            </Grid>

            {/* Achievements */}
            <Grid xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Erfolge
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  label="Neuer Erfolg"
                  value={newAchievement}
                  onChange={(e) => setAchievement(e.target.value)}
                />
                <Button
                  variant="outlined"
                  onClick={() => handleAddAchievement(index)}
                  disabled={!newAchievement.trim()}
                >
                  Hinzufügen
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {experience.achievements?.map((achievement, achievementIndex) => (
                  <Chip
                    key={achievementIndex}
                    label={achievement}
                    onDelete={() => handleDeleteAchievement(index, achievementIndex)}
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      ))}

      <Box sx={{ mt: 4, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Neue Berufserfahrung
        </Typography>
        <Grid container spacing={2}>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Unternehmen"
              value={newCompany}
              onChange={(e) => setCompany(e.target.value)}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Position"
              value={newPosition}
              onChange={(e) => setPosition(e.target.value)}
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
              label="Aktuelle Position"
            />
          </Grid>
          <Grid xs={12}>
            <TextField
              fullWidth
              label="Standort"
              value={newLocation}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Grid>
          <Grid xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Beschreibung"
              value={newDescription}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid xs={12}>
            <Button
              variant="contained"
              onClick={handleAddExperience}
              disabled={!newCompany.trim() || !newPosition.trim() || !newStartDate}
            >
              Hinzufügen
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}; 