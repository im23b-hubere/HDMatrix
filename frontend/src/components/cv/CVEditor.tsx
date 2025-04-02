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
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import { WorkExperienceForm } from './forms/WorkExperienceForm';
import { EducationForm } from './forms/EducationForm';
import { SkillsForm } from './forms/SkillsForm';
import { CertificationsForm } from './forms/CertificationsForm';
import { ProjectsForm } from './forms/ProjectsForm';
import { CV, PersonalInfo, WorkExperience, Education, Skill, Certification, Project } from '../../types/cv';

interface CVEditorProps {
  cv: CV;
  onSave: (cv: CV) => void;
}

const steps = [
  'Persönliche Informationen',
  'Berufserfahrung',
  'Ausbildung',
  'Fähigkeiten',
  'Zertifizierungen',
  'Projekte',
];

export const CVEditor: React.FC<CVEditorProps> = ({ cv, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [editedCV, setEditedCV] = useState<CV>(cv);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePersonalInfoChange = (personalInfo: PersonalInfo) => {
    setEditedCV({ ...editedCV, personalInfo });
  };

  const handleWorkExperienceChange = (workExperience: WorkExperience[]) => {
    setEditedCV({ ...editedCV, workExperience });
  };

  const handleEducationChange = (education: Education[]) => {
    setEditedCV({ ...editedCV, education });
  };

  const handleSkillsChange = (skills: Skill[]) => {
    setEditedCV({ ...editedCV, skills });
  };

  const handleCertificationsChange = (certifications: Certification[]) => {
    setEditedCV({ ...editedCV, certifications });
  };

  const handleProjectsChange = (projects: Project[]) => {
    setEditedCV({ ...editedCV, projects });
  };

  const handleSave = () => {
    onSave(editedCV);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PersonalInfoForm
            personalInfo={editedCV.personalInfo}
            onChange={handlePersonalInfoChange}
          />
        );
      case 1:
        return (
          <WorkExperienceForm
            workExperience={editedCV.workExperience}
            onChange={handleWorkExperienceChange}
          />
        );
      case 2:
        return (
          <EducationForm
            education={editedCV.education}
            onChange={handleEducationChange}
          />
        );
      case 3:
        return (
          <SkillsForm
            skills={editedCV.skills}
            onChange={handleSkillsChange}
          />
        );
      case 4:
        return (
          <CertificationsForm
            certifications={editedCV.certifications}
            onChange={handleCertificationsChange}
          />
        );
      case 5:
        return (
          <ProjectsForm
            projects={editedCV.projects}
            onChange={handleProjectsChange}
          />
        );
      default:
        return 'Unbekannter Schritt';
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Lebenslauf bearbeiten
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Zurück
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSave}
              >
                Speichern
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Weiter
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}; 