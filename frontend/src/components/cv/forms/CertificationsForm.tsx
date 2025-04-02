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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Certification } from '../../../types/cv';

interface CertificationsFormProps {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
}

export const CertificationsForm: React.FC<CertificationsFormProps> = ({
  certifications,
  onChange,
}) => {
  const [newName, setName] = useState('');
  const [newIssuer, setIssuer] = useState('');
  const [newIssueDate, setIssueDate] = useState('');
  const [newExpiryDate, setExpiryDate] = useState('');
  const [newCredentialId, setCredentialId] = useState('');
  const [newCurrent, setCurrent] = useState(false);

  const handleAddCertification = () => {
    const newCertification: Certification = {
      id: Date.now().toString(),
      name: newName,
      issuer: newIssuer,
      issueDate: newIssueDate,
      expiryDate: newExpiryDate,
      credentialId: newCredentialId,
      current: newCurrent,
    };

    onChange([...certifications, newCertification]);

    // Reset form
    setName('');
    setIssuer('');
    setIssueDate('');
    setExpiryDate('');
    setCredentialId('');
    setCurrent(false);
  };

  const handleDeleteCertification = (index: number) => {
    const updatedCertifications = certifications.filter((_, i) => i !== index);
    onChange(updatedCertifications);
  };

  const handleUpdateCertification = (
    index: number,
    field: keyof Certification,
    value: string | boolean
  ) => {
    const updatedCertifications = certifications.map((cert, i) =>
      i === index ? { ...cert, [field]: value } : cert
    );
    onChange(updatedCertifications);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Certifications
      </Typography>

      {/* Existing certifications */}
      {certifications.map((cert, index) => (
        <Box key={cert.id} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{cert.name || 'New Certification'}</Typography>
            <IconButton
              onClick={() => handleDeleteCertification(index)}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
              <TextField
                fullWidth
                required
                label="Name"
                value={cert.name}
                onChange={(e) => handleUpdateCertification(index, 'name', e.target.value)}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
              <TextField
                fullWidth
                required
                label="Issuer"
                value={cert.issuer}
                onChange={(e) => handleUpdateCertification(index, 'issuer', e.target.value)}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
              <TextField
                fullWidth
                required
                label="Issue Date"
                type="date"
                value={cert.issueDate}
                onChange={(e) => handleUpdateCertification(index, 'issueDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={cert.expiryDate}
                onChange={(e) => handleUpdateCertification(index, 'expiryDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={cert.current}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
              <TextField
                fullWidth
                label="Credential ID"
                value={cert.credentialId}
                onChange={(e) => handleUpdateCertification(index, 'credentialId', e.target.value)}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cert.current}
                    onChange={(e) => handleUpdateCertification(index, 'current', e.target.checked)}
                  />
                }
                label="Current Certification"
              />
            </Box>
          </Box>
        </Box>
      ))}

      {/* New certification form */}
      <Typography variant="subtitle1" gutterBottom>
        Add New Certification
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
          <TextField
            fullWidth
            required
            label="Name"
            value={newName}
            onChange={(e) => setName(e.target.value)}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
          <TextField
            fullWidth
            required
            label="Issuer"
            value={newIssuer}
            onChange={(e) => setIssuer(e.target.value)}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
          <TextField
            fullWidth
            required
            label="Issue Date"
            type="date"
            value={newIssueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
          <TextField
            fullWidth
            label="Expiry Date"
            type="date"
            value={newExpiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={newCurrent}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
          <TextField
            fullWidth
            label="Credential ID"
            value={newCredentialId}
            onChange={(e) => setCredentialId(e.target.value)}
          />
        </Box>
        <Box sx={{ width: '100%' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={newCurrent}
                onChange={(e) => setCurrent(e.target.checked)}
              />
            }
            label="Current Certification"
          />
        </Box>
        <Box sx={{ width: '100%' }}>
          <Button
            variant="contained"
            onClick={handleAddCertification}
            disabled={!newName.trim() || !newIssuer.trim() || !newIssueDate}
          >
            Add
          </Button>
        </Box>
      </Box>
    </Box>
  );
}; 