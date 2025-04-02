import React, { useState, useEffect } from 'react';
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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Link,
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
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
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

  const formatTimeAgo = (date: Date | undefined) => {
    if (!date) return 'Gerade hochgeladen';
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Gerade eben';
    if (diffMinutes < 60) return `vor ${diffMinutes} Minuten`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `vor ${diffHours} Stunden`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `vor ${diffWeeks} Wochen`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `vor ${diffMonths} Monaten`;
    
    const diffYears = Math.floor(diffDays / 365);
    return `vor ${diffYears} Jahren`;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
          transition: 'all 0.3s ease-in-out',
        }
      }}
      onClick={() => setDetailsOpen(true)}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flex: 1 }}>
          {cv.personalInfo?.profilePicture ? (
            <Avatar
              sx={{ width: 56, height: 56 }}
              src={cv.personalInfo.profilePicture}
              alt={`${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`}
            />
          ) : (
            <Avatar 
              sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: 'primary.main',
                fontSize: '1.4rem'
              }}
            >
              {cv.personalInfo?.firstName?.[0]}{cv.personalInfo?.lastName?.[0]}
            </Avatar>
          )}
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 500 }}>
              {cv.personalInfo?.firstName
                ? `${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`
                : 'Neuer Lebenslauf'}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 1 }}
            >
              {cv.personalInfo?.title || 'Position nicht angegeben'}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ display: 'block' }}
            >
              CV zuletzt aktualisiert: {formatTimeAgo(cv.lastUpdated)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontWeight: 500 }}
          >
            Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {cv.skills?.slice(0, 5).map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                size="small"
                sx={{
                  bgcolor: 'background.default',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              />
            ))}
            {cv.skills && cv.skills.length > 5 && (
              <Chip
                label={`+${cv.skills.length - 5}`}
                size="small"
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.main' }
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          size="small"
          fullWidth
          sx={{ textTransform: 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement download
          }}
        >
          Download CV
        </Button>
        <Button
          variant="outlined"
          size="small"
          fullWidth
          sx={{ textTransform: 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement copy to proposal
          }}
        >
          Copy to proposal
        </Button>
      </Box>

      <CVDetails
        cv={cv}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </Card>
  );
};

const CVDetails: React.FC<{ cv: CV; open: boolean; onClose: () => void }> = ({
  cv,
  open,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState('personal');
  const sections = [
    { id: 'personal', label: 'Persönliche Daten' },
    { id: 'summary', label: 'Zusammenfassung' },
    { id: 'experience', label: 'Berufserfahrung' },
    { id: 'skills', label: 'Skills & Technologien' },
    { id: 'education', label: 'Ausbildung' },
    { id: 'certifications', label: 'Zertifizierungen' },
    { id: 'languages', label: 'Sprachen' },
    { id: 'publications', label: 'Publikationen' }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Kontaktinformationen</Typography>
            <Grid container spacing={2}>
              {cv.personalInfo?.email && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="action" />
                    <Typography>{cv.personalInfo.email}</Typography>
                  </Box>
                </Grid>
              )}
              {cv.personalInfo?.phone && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" />
                    <Typography>{cv.personalInfo.phone}</Typography>
                  </Box>
                </Grid>
              )}
              {cv.personalInfo?.location && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon color="action" />
                    <Typography>{cv.personalInfo.location}</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      
      case 'summary':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Zusammenfassung</Typography>
            <Typography variant="body1" paragraph>
              {cv.personalInfo?.summary || 'Keine Zusammenfassung verfügbar.'}
            </Typography>
          </Box>
        );
      
      case 'experience':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Berufserfahrung</Typography>
            {cv.experience?.map((exp, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {exp.position} {exp.company && `bei ${exp.company}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {exp.start_year} - {exp.end_year}
                  {exp.location && ` • ${exp.location}`}
                </Typography>
                <Typography variant="body1" paragraph>
                  {exp.description}
                </Typography>
                {exp.technologies && exp.technologies.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Verwendete Technologien:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {exp.technologies.map((tech, idx) => (
                        <Chip
                          key={idx}
                          label={tech}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        );
      
      case 'skills':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Skills & Technologien</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {cv.skills?.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  sx={{
                    bgcolor: 'background.default',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                />
              ))}
            </Box>
          </Box>
        );
      
      case 'education':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Ausbildung</Typography>
            {cv.education?.map((edu, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {edu.degree}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {edu.institution && `${edu.institution} • `}
                  {edu.start_year} - {edu.end_year}
                  {edu.location && ` • ${edu.location}`}
                </Typography>
                {edu.details && (
                  <Typography variant="body1">
                    {edu.details}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        );
      
      case 'certifications':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Zertifizierungen</Typography>
            {cv.certifications?.map((cert, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {cert.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cert.issuer} • Ausgestellt: {cert.issueDate}
                  {cert.expiryDate && ` • Gültig bis: ${cert.expiryDate}`}
                </Typography>
                {cert.credentialId && (
                  <Typography variant="body2" color="text.secondary">
                    Credential ID: {cert.credentialId}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        );
      
      case 'languages':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Sprachen</Typography>
            {cv.personalInfo?.languages?.map((lang, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {lang.language}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Niveau: {lang.level}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      
      case 'publications':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Publikationen</Typography>
            {cv.publications?.map((pub, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {pub.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {pub.publisher} • {pub.date}
                </Typography>
                {pub.description && (
                  <Typography variant="body1" paragraph>
                    {pub.description}
                  </Typography>
                )}
                {pub.url && (
                  <Link href={pub.url} target="_blank" rel="noopener noreferrer">
                    Publikation ansehen
                  </Link>
                )}
              </Box>
            ))}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ px: 4, py: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {cv.personalInfo?.profilePicture ? (
            <Avatar
              sx={{ width: 100, height: 100 }}
              src={cv.personalInfo.profilePicture}
              alt={`${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`}
            />
          ) : (
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
                fontSize: '2.5rem'
              }}
            >
              {cv.personalInfo?.firstName?.[0]}{cv.personalInfo?.lastName?.[0]}
            </Avatar>
          )}
          <Box>
            <Typography variant="h4" gutterBottom>
              {cv.personalInfo?.firstName} {cv.personalInfo?.lastName}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {cv.personalInfo?.title}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={3}>
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: 'background.default',
                position: 'sticky',
                top: 20
              }}
            >
              <List>
                {sections.map((section) => (
                  <ListItemButton
                    key={section.id}
                    selected={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }
                    }}
                  >
                    <ListItemText primary={section.label} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={9}>
            {renderSection()}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 4, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          Schließen
        </Button>
        <Button variant="contained" startIcon={<DownloadIcon />}>
          CV herunterladen
        </Button>
      </DialogActions>
    </Dialog>
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