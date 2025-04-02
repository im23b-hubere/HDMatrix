import React from 'react';
import {
  Box,
  TextField,
  Avatar,
  Button,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { CV, PersonalInfo } from '@/types/cv';

interface PersonalInfoFormProps {
  cv: CV;
  onChange: (cv: CV) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ cv, onChange }) => {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...cv,
      personalInfo: {
        ...cv.personalInfo,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          ...cv,
          personalInfo: {
            ...cv.personalInfo,
            profilePicture: reader.result as string,
          },
          updatedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Profilbild */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={cv.personalInfo.profilePicture}
            sx={{ width: 120, height: 120 }}
          />
          <Button
            component="label"
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              minWidth: 'auto',
              p: 1,
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'background.paper',
              },
            }}
          >
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Avatar sx={{ width: 32, height: 32 }}>+</Avatar>
          </Button>
        </Box>
      </Box>

      {/* Persönliche Informationen */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Vorname"
            value={cv.personalInfo.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Nachname"
            value={cv.personalInfo.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="E-Mail"
            type="email"
            value={cv.personalInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Telefon"
            value={cv.personalInfo.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Ort"
            value={cv.personalInfo.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Geburtsdatum"
            type="date"
            value={cv.personalInfo.birthDate || ''}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Nationalität"
            value={cv.personalInfo.nationality || ''}
            onChange={(e) => handleChange('nationality', e.target.value)}
          />
        </Box>
      </Box>

      {/* Berufliche Informationen */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Titel"
            value={cv.personalInfo.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </Box>
        <Box sx={{ flex: '100%' }}>
          <TextField
            fullWidth
            label="Zusammenfassung"
            multiline
            rows={4}
            value={cv.personalInfo.summary || ''}
            onChange={(e) => handleChange('summary', e.target.value)}
            required
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Gewünschte Position"
            value={cv.personalInfo.desiredPosition || ''}
            onChange={(e) => handleChange('desiredPosition', e.target.value)}
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Gewünschter Ort"
            value={cv.personalInfo.desiredLocation || ''}
            onChange={(e) => handleChange('desiredLocation', e.target.value)}
          />
        </Box>
        <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
          <TextField
            fullWidth
            label="Verfügbarkeit"
            value={cv.personalInfo.availability || ''}
            onChange={(e) => handleChange('availability', e.target.value)}
          />
        </Box>
      </Box>
    </Box>
  );
}; 