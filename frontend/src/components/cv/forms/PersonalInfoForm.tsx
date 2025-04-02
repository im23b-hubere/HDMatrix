import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { PersonalInfo } from '@/types/cv';

interface PersonalInfoFormProps {
  personalInfo: PersonalInfo;
  onChange: (personalInfo: PersonalInfo) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  personalInfo,
  onChange,
}) => {
  const handleChange = (field: keyof PersonalInfo) => (
    event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent
  ) => {
    onChange({
      ...personalInfo,
      [field]: event.target.value,
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Persönliche Informationen
      </Typography>
      <Grid container spacing={3}>
        <Grid xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Vorname"
            value={personalInfo.firstName}
            onChange={handleChange('firstName')}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Nachname"
            value={personalInfo.lastName}
            onChange={handleChange('lastName')}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="E-Mail"
            type="email"
            value={personalInfo.email}
            onChange={handleChange('email')}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            label="Telefon"
            value={personalInfo.phone || ''}
            onChange={handleChange('phone')}
          />
        </Grid>
        <Grid xs={12}>
          <TextField
            fullWidth
            label="Adresse"
            value={personalInfo.location || ''}
            onChange={handleChange('location')}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            label="Geburtsdatum"
            type="date"
            value={personalInfo.birthDate || ''}
            onChange={handleChange('birthDate')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            label="Staatsangehörigkeit"
            value={personalInfo.nationality || ''}
            onChange={handleChange('nationality')}
          />
        </Grid>
        <Grid xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Zusammenfassung"
            value={personalInfo.summary || ''}
            onChange={handleChange('summary')}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Verfügbarkeit</InputLabel>
            <Select
              value={personalInfo.availability || ''}
              onChange={handleChange('availability')}
              label="Verfügbarkeit"
            >
              <MenuItem value="Sofort">Sofort</MenuItem>
              <MenuItem value="In 1 Monat">In 1 Monat</MenuItem>
              <MenuItem value="In 3 Monaten">In 3 Monaten</MenuItem>
              <MenuItem value="In 6 Monaten">In 6 Monaten</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Gewünschte Beschäftigungsart</InputLabel>
            <Select
              value={personalInfo.desiredEmploymentType || ''}
              onChange={handleChange('desiredEmploymentType')}
              label="Gewünschte Beschäftigungsart"
            >
              <MenuItem value="Vollzeit">Vollzeit</MenuItem>
              <MenuItem value="Teilzeit">Teilzeit</MenuItem>
              <MenuItem value="Freiberuflich">Freiberuflich</MenuItem>
              <MenuItem value="Remote">Remote</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            label="Gewünschte Position"
            value={personalInfo.desiredPosition || ''}
            onChange={handleChange('desiredPosition')}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            label="Gewünschtes Gehalt"
            value={personalInfo.desiredSalary || ''}
            onChange={handleChange('desiredSalary')}
          />
        </Grid>
        <Grid xs={12}>
          <TextField
            fullWidth
            label="Gewünschter Standort"
            value={personalInfo.desiredLocation || ''}
            onChange={handleChange('desiredLocation')}
          />
        </Grid>
      </Grid>
    </Box>
  );
}; 