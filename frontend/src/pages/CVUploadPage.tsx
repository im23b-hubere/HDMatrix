import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Alert, 
  AlertTitle 
} from '@mui/material';
import CVUploadForm from '../components/CVUploadForm';

const CVUploadPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedCvId, setUploadedCvId] = useState<string | null>(null);

  // Schritte für den Upload-Prozess
  const steps = ['Lebenslauf hochladen', 'Daten überprüfen', 'Fertig'];

  // Handler für erfolgreichen Upload
  const handleUploadSuccess = (cvId: string) => {
    setUploadedCvId(cvId);
    setActiveStep(2); // Zum letzten Schritt springen
  };

  // Zurück zum Dashboard navigieren
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Zum hochgeladenen CV navigieren
  const handleViewCv = () => {
    if (uploadedCvId) {
      navigate(`/cv/${uploadedCvId}`);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Lebenslauf hochladen
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Laden Sie PDFs oder Word-Dokumente hoch und lassen Sie KI-gestützte Analyse die Daten automatisch extrahieren
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === 2 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <AlertTitle>Erfolgreich!</AlertTitle>
                Der Lebenslauf wurde erfolgreich hochgeladen und zur Datenbank hinzugefügt.
              </Alert>
              
              <Typography variant="body1" paragraph>
                Sie können den Lebenslauf jetzt ansehen oder zum Dashboard zurückkehren.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleBackToDashboard}
                >
                  Zurück zum Dashboard
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleViewCv}
                  disabled={!uploadedCvId}
                >
                  Lebenslauf anzeigen
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              {/* Informationstext */}
              {activeStep === 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    PDF-Lebenslauf hochladen
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Laden Sie einen Lebenslauf im PDF- oder Word-Format hoch. Unsere KI-gestützte Technologie extrahiert
                    automatisch wichtige Informationen wie Berufserfahrung, Ausbildung, Fähigkeiten und persönliche Daten.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hinweis: Je strukturierter der Lebenslauf ist, desto besser funktioniert die automatische Extraktion.
                    Sie können die extrahierten Daten vor dem Speichern überprüfen und bei Bedarf bearbeiten.
                  </Typography>
                </Box>
              )}
              
              {/* Upload-Formular */}
              <CVUploadForm onUploadSuccess={handleUploadSuccess} />
            </>
          )}
        </Paper>
        
        {/* Zusätzliche Informationen */}
        <Paper elevation={1} sx={{ p: 3, backgroundColor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Wie funktioniert die automatische Extraktion?
          </Typography>
          <Typography variant="body2" paragraph>
            Unsere Plattform verwendet fortschrittliche Textanalyse-Techniken, um strukturierte Daten aus Ihren Lebensläufen zu extrahieren.
            Der Prozess umfasst folgende Schritte:
          </Typography>
          <ol>
            <li>
              <Typography variant="body2">
                <strong>Text-Extraktion:</strong> Der Text wird aus dem PDF oder Word-Dokument extrahiert.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Natürliche Sprachverarbeitung:</strong> Wir analysieren den Text, um wichtige Entitäten wie Namen, Unternehmen und Daten zu identifizieren.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Kategorisierung:</strong> Die extrahierten Informationen werden in Kategorien wie Berufserfahrung, Ausbildung und Fähigkeiten eingeteilt.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Datenstrukturierung:</strong> Die Daten werden in ein strukturiertes Format gebracht, das in unserer Datenbank gespeichert werden kann.
              </Typography>
            </li>
          </ol>
        </Paper>
      </Box>
    </Container>
  );
};

export default CVUploadPage; 