import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  IconButton,
  Button,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Education } from '@/types/cv';

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({
  education,
  onChange,
}) => {
  const handleAddEducation = () => {
    const newEducation: Education = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
      location: '',
      description: '',
      gpa: '',
    };
    onChange([...education, newEducation]);
  };

  const handleUpdateEducation = (index: number, field: keyof Education, value: any) => {
    const updatedEducation = [...education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value,
    };
    onChange(updatedEducation);
  };

  const handleDeleteEducation = (index: number) => {
    const updatedEducation = education.filter((_, i) => i !== index);
    onChange(updatedEducation);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Ausbildung</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddEducation}
        >
          Neue Ausbildung hinzufügen
        </Button>
      </Box>

      {education.map((edu, index) => (
        <Box key={edu.id} sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle1">Ausbildung {index + 1}</Typography>
            <IconButton
              size="small"
              onClick={() => handleDeleteEducation(index)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Institution"
                value={edu.institution}
                onChange={(e) => handleUpdateEducation(index, 'institution', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Abschluss"
                value={edu.degree}
                onChange={(e) => handleUpdateEducation(index, 'degree', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Fachrichtung"
                value={edu.field}
                onChange={(e) => handleUpdateEducation(index, 'field', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Notendurchschnitt"
                value={edu.gpa}
                onChange={(e) => handleUpdateEducation(index, 'gpa', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Startdatum"
                type="date"
                value={edu.startDate}
                onChange={(e) => handleUpdateEducation(index, 'startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enddatum"
                type="date"
                value={edu.endDate}
                onChange={(e) => handleUpdateEducation(index, 'endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={edu.current}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={edu.current}
                    onChange={(e) => handleUpdateEducation(index, 'current', e.target.checked)}
                  />
                }
                label="Aktuelle Ausbildung"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Standort"
                value={edu.location}
                onChange={(e) => handleUpdateEducation(index, 'location', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Beschreibung"
                value={edu.description}
                onChange={(e) => handleUpdateEducation(index, 'description', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      ))}
    </Box>
  );
}; 