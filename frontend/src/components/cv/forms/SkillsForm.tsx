import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  Typography,
  Chip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Skill } from '../../types/cv';

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({ skills, onChange }) => {
  const [newSkill, setNewSkill] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('');

  const handleAddSkill = () => {
    if (!newSkill.trim() || !newSkillCategory.trim()) {
      return;
    }

    const newSkillObj: Skill = {
      id: Date.now().toString(),
      name: newSkill,
      category: newSkillCategory,
      level: newSkillLevel ? parseInt(newSkillLevel) : undefined,
      yearsOfExperience: undefined,
    };

    onChange([...skills, newSkillObj]);

    // Reset form
    setNewSkill('');
    setNewSkillCategory('');
    setNewSkillLevel('');
  };

  const handleDeleteSkill = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onChange(updatedSkills);
  };

  const handleUpdateSkill = (index: number, field: keyof Skill, value: any) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value,
    };
    onChange(updatedSkills);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Fähigkeiten</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddSkill}
        >
          Neue Fähigkeit hinzufügen
        </Button>
      </Box>

      {skills.map((skill, index) => (
        <Box key={skill.id} sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle1">Fähigkeit {index + 1}</Typography>
            <IconButton
              size="small"
              onClick={() => handleDeleteSkill(index)}
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
                value={skill.name}
                onChange={(e) => handleUpdateSkill(index, 'name', e.target.value)}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Kategorie"
                value={skill.category}
                onChange={(e) => handleUpdateSkill(index, 'category', e.target.value)}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Niveau (1-5)"
                type="number"
                value={skill.level || ''}
                onChange={(e) => handleUpdateSkill(index, 'level', e.target.value ? parseInt(e.target.value) : undefined)}
                InputProps={{ inputProps: { min: 1, max: 5 } }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Jahre Erfahrung"
                type="number"
                value={skill.yearsOfExperience || ''}
                onChange={(e) => handleUpdateSkill(index, 'yearsOfExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
          </Grid>
        </Box>
      ))}

      <Box sx={{ mt: 4, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Neue Fähigkeit
        </Typography>
        <Grid container spacing={2}>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Name"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Kategorie"
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Niveau (1-5)"
              type="number"
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
              InputProps={{ inputProps: { min: 1, max: 5 } }}
            />
          </Grid>
          <Grid xs={12}>
            <Button
              variant="contained"
              onClick={handleAddSkill}
              disabled={!newSkill.trim() || !newSkillCategory.trim()}
            >
              Hinzufügen
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}; 