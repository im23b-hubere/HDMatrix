import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Container,
} from '@mui/material';
import { CV } from '@/types/cv';
import { PersonalInfoForm } from './cv-forms/personal-info-form';

interface CVEditorProps {
  initialCV?: CV;
  onSave: (cv: CV) => void;
}

const steps = [
  'Persönliche Informationen',
  'Berufserfahrung',
  'Ausbildung',
  'Fähigkeiten',
  'Sprachen',
  'Zertifikate',
  'Projekte',
  'Zusätzliche Informationen',
];

export const CVEditor: React.FC<CVEditorProps> = ({ initialCV, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [cv, setCV] = useState<CV>(
    initialCV || {
      id: `cv-${Date.now()}`,
      userId: 'user-1', // TODO: Get from auth context
      title: 'Neuer Lebenslauf',
      templateId: 'template-1',
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
      },
      workExperience: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      projects: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (updatedCV: CV) => {
    setCV(updatedCV);
    onSave(updatedCV);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Persönliche Informationen</Typography>
            <PersonalInfoForm cv={cv} onChange={handleChange} />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Berufserfahrung</Typography>
            {/* Hier kommt das Formular für Berufserfahrung */}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Ausbildung</Typography>
            {/* Hier kommt das Formular für Ausbildung */}
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Fähigkeiten</Typography>
            {/* Hier kommt das Formular für Fähigkeiten */}
          </Box>
        );
      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Sprachen</Typography>
            {/* Hier kommt das Formular für Sprachen */}
          </Box>
        );
      case 5:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Zertifikate</Typography>
            {/* Hier kommt das Formular für Zertifikate */}
          </Box>
        );
      case 6:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Projekte</Typography>
            {/* Hier kommt das Formular für Projekte */}
          </Box>
        );
      case 7:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Zusätzliche Informationen</Typography>
            {/* Hier kommt das Formular für zusätzliche Informationen */}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Zurück
            </Button>
          )}
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={() => onSave(cv)}>
              Speichern
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Weiter
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}; 