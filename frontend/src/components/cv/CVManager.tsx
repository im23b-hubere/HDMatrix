import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  DialogContentText,
  Tab,
  Tabs,
  Input,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  LinkedIn as LinkedInIcon,
  Description as DescriptionIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { CV } from '../../types/cv';
import { pdfService } from '../../services/pdf-service';
import { excelService } from '../../services/excel-service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface CVManagerProps {
  cvs: CV[];
  onSave: (cv: CV) => void;
  onDelete: (cvId: string) => void;
  onDuplicate: (cvId: string) => void;
  onAddEmployee?: () => void;
}

const CVCard: React.FC<{ cv: CV }> = ({ cv }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <Card
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
          transition: 'all 0.3s ease-in-out',
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
              {cv.personalInfo?.firstName && cv.personalInfo?.lastName
                ? `${cv.personalInfo.firstName[0]}${cv.personalInfo.lastName[0]}`
                : 'CV'}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {cv.personalInfo?.firstName
                  ? `${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`
                  : 'New CV'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cv.personalInfo?.email || 'No email specified'}
              </Typography>
            </Box>
          </Box>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Skills:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {cv.skills?.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                size="small"
                sx={{ bgcolor: 'background.default' }}
              />
            ))}
          </Box>
        </Box>

        {cv.experience && cv.experience.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Erfahrung:
            </Typography>
            {cv.experience.map((exp, index) => (
              <Typography key={index} variant="body2">
                {exp.start_year} - {exp.end_year}: {exp.description}
              </Typography>
            ))}
          </Box>
        )}

        {cv.education && cv.education.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ausbildung:
            </Typography>
            {cv.education.map((edu, index) => (
              <Typography key={index} variant="body2">
                {edu.start_year} - {edu.end_year}: {edu.degree}
              </Typography>
            ))}
          </Box>
        )}

        <Button
          fullWidth
          variant="outlined"
          onClick={() => setDetailsOpen(true)}
          sx={{ mt: 2 }}
        >
          Details anzeigen
        </Button>
      </CardContent>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          CV Details: {cv.personalInfo?.firstName} {cv.personalInfo?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>Persönliche Informationen</Typography>
            <Typography>Name: {cv.personalInfo?.firstName} {cv.personalInfo?.lastName}</Typography>
            <Typography>Email: {cv.personalInfo?.email}</Typography>
            <Typography>Telefon: {cv.personalInfo?.phone}</Typography>

            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Skills</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {cv.skills?.map((skill, index) => (
                <Chip key={index} label={skill} />
              ))}
            </Box>

            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Berufserfahrung</Typography>
            {cv.experience?.map((exp, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {exp.start_year} - {exp.end_year}
                </Typography>
                <Typography>{exp.description}</Typography>
              </Box>
            ))}

            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Ausbildung</Typography>
            {cv.education?.map((edu, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {edu.start_year} - {edu.end_year}
                </Typography>
                <Typography>{edu.degree}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export const CVManager: React.FC<CVManagerProps> = ({
  cvs,
  onSave,
  onDelete,
  onDuplicate,
  onAddEmployee,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedCV, setSelectedCV] = React.useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importTab, setImportTab] = React.useState(0);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [linkedInUrl, setLinkedInUrl] = React.useState('');

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, cvId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCV(cvId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCV(null);
  };

  const handleDelete = () => {
    if (selectedCV) {
      onDelete(selectedCV);
      handleMenuClose();
    }
  };

  const handleDuplicate = () => {
    if (selectedCV) {
      onDuplicate(selectedCV);
      handleMenuClose();
    }
  };

  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
    setLinkedInUrl('');
    setImportTab(0);
  };

  const handleImportTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setImportTab(newValue);
    setSelectedFile(null);
    setLinkedInUrl('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      console.log('Datei ausgewählt:', file.name);
      setSelectedFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    const template = excelService.generateTemplate();
    const url = window.URL.createObjectURL(template);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv_template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImport = async () => {
    try {
      console.log('Import gestartet:', { importTab, selectedFile, linkedInUrl });
      
      switch (importTab) {
        case 0: // Excel/CSV
          if (selectedFile) {
            console.log('Verarbeite Excel/CSV:', selectedFile.name);
            const importedCV = await excelService.extractFromExcel(selectedFile);
            onSave(importedCV);
            console.log('Excel/CSV erfolgreich importiert');
          }
          break;
        case 1: // PDF
          if (selectedFile) {
            console.log('Verarbeite PDF:', selectedFile.name);
            const importedCV = await pdfService.extractFromPDF(selectedFile);
            onSave(importedCV);
            console.log('PDF erfolgreich importiert');
          }
          break;
        case 2: // LinkedIn
          if (linkedInUrl) {
            console.log('LinkedIn-Import noch nicht implementiert');
          }
          break;
      }
      
      handleImportDialogClose();
    } catch (error) {
      console.error('Import fehlgeschlagen:', error);
      // TODO: Zeige Fehlermeldung an
      alert('Import fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4">CV Manager</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Verwalten Sie Mitarbeiter-CVs im System
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleImportDialogOpen}
            startIcon={<UploadIcon />}
          >
            Import CVs
          </Button>
          <Button
            variant="outlined"
            onClick={onAddEmployee}
            startIcon={<PersonAddIcon />}
          >
            Mitarbeiter hinzufügen
          </Button>
        </Box>
      </Box>

      {cvs.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8, 
            px: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" gutterBottom>
            No CVs yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by creating a new CV or importing existing ones
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {/* TODO: Implement import dialog */}}
            >
              Import from Excel/CSV
            </Button>
            <Button
              variant="outlined"
              onClick={() => {/* TODO: Implement PDF import */}}
            >
              Import from PDF
            </Button>
            <Button
              variant="outlined"
              onClick={() => {/* TODO: Implement LinkedIn import */}}
            >
              Import from LinkedIn
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {cvs.map((cv) => (
            <CVCard key={cv.id} cv={cv} />
          ))}
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDuplicate}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import CVs</DialogTitle>
        <DialogContent>
          <Tabs
            value={importTab}
            onChange={handleImportTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab icon={<DescriptionIcon />} label="Excel/CSV" />
            <Tab icon={<DescriptionIcon />} label="PDF" />
            <Tab icon={<LinkedInIcon />} label="LinkedIn" />
          </Tabs>

          <TabPanel value={importTab} index={0}>
            <DialogContentText gutterBottom>
              Upload an Excel or CSV file containing CV data. The file should follow our template format.
            </DialogContentText>
            <Input
              type="file"
              fullWidth
              onChange={handleFileChange}
              inputProps={{
                accept: '.xlsx,.xls,.csv'
              }}
            />
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={handleDownloadTemplate}
            >
              Template herunterladen
            </Button>
          </TabPanel>

          <TabPanel value={importTab} index={1}>
            <DialogContentText gutterBottom>
              Upload PDF files containing CVs. We'll extract the information automatically.
            </DialogContentText>
            <Input
              type="file"
              fullWidth
              onChange={handleFileChange}
              inputProps={{
                accept: '.pdf'
              }}
              sx={{ mb: 2 }}
            />
            {selectedFile && (
              <Typography variant="body2" color="primary">
                Ausgewählte Datei: {selectedFile.name}
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={importTab} index={2}>
            <DialogContentText gutterBottom>
              Enter a LinkedIn profile URL to import CV data directly.
            </DialogContentText>
            <TextField
              fullWidth
              placeholder="https://www.linkedin.com/in/username"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
            />
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={
              (importTab === 0 && !selectedFile) ||
              (importTab === 1 && !selectedFile) ||
              (importTab === 2 && !linkedInUrl.trim())
            }
          >
            {selectedFile ? 'Import' : 'Bitte Datei auswählen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 