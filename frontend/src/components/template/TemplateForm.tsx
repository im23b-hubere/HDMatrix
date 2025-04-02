import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Template, TemplateSection, TemplateField, FieldType, FIELD_TYPES } from '@/types/template';

interface TemplateFormProps {
  template: Template;
  onChange: (template: Template) => void;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onChange,
  onSave,
  onCancel,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const handleTemplateChange = (field: keyof Template, value: any) => {
    onChange({
      ...template,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSectionChange = (sectionId: string, field: keyof TemplateSection, value: any) => {
    const updatedSections = template.sections.map(section =>
      section.id === sectionId
        ? { ...section, [field]: value }
        : section
    );
    handleTemplateChange('sections', updatedSections);
  };

  const handleFieldChange = (sectionId: string, fieldId: string, field: keyof TemplateField, value: any) => {
    const updatedSections = template.sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.map(f =>
              f.id === fieldId
                ? { ...f, [field]: value }
                : f
            ),
          }
        : section
    );
    handleTemplateChange('sections', updatedSections);
  };

  const addSection = () => {
    if (!newSectionTitle) return;

    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      title: newSectionTitle,
      order: template.sections.length + 1,
      visible: true,
      required: false,
      description: '',
      fields: [],
    };

    handleTemplateChange('sections', [...template.sections, newSection]);
    setNewSectionTitle('');
  };

  const removeSection = (sectionId: string) => {
    const updatedSections = template.sections.filter(section => section.id !== sectionId);
    handleTemplateChange('sections', updatedSections);
    if (activeSection === sectionId) {
      setActiveSection(null);
    }
  };

  const addField = (sectionId: string) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    const newField: TemplateField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'Neues Feld',
      required: false,
    };

    handleSectionChange(sectionId, 'fields', [...section.fields, newField]);
  };

  const removeField = (sectionId: string, fieldId: string) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    handleSectionChange(
      sectionId,
      'fields',
      section.fields.filter(field => field.id !== fieldId)
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Template bearbeiten
      </Typography>

      {/* Template Basis-Informationen */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basis-Informationen
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Name"
              value={template.name}
              onChange={(e) => handleTemplateChange('name', e.target.value)}
            />
          </Box>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={template.category}
                label="Kategorie"
                onChange={(e) => handleTemplateChange('category', e.target.value as Template['category'])}
              >
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="creative">Kreativ</MenuItem>
                <MenuItem value="academic">Akademisch</MenuItem>
                <MenuItem value="technical">Technisch</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '100%' }}>
            <TextField
              fullWidth
              label="Beschreibung"
              multiline
              rows={2}
              value={template.description}
              onChange={(e) => handleTemplateChange('description', e.target.value)}
            />
          </Box>
        </Box>
      </Paper>

      {/* Abschnitte */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Abschnitte
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Neuer Abschnitt"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addSection}
              disabled={!newSectionTitle}
            >
              Hinzufügen
            </Button>
          </Box>
        </Box>

        {template.sections.map((section) => (
          <Box key={section.id} sx={{ mb: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: activeSection === section.id ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
              }}
              onClick={() => setActiveSection(section.id)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TextField
                  label="Titel"
                  value={section.title}
                  onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                  sx={{ flex: 1, mr: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={section.required}
                      onChange={(e) => handleSectionChange(section.id, 'required', e.target.checked)}
                    />
                  }
                  label="Pflichtfeld"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={section.visible}
                      onChange={(e) => handleSectionChange(section.id, 'visible', e.target.checked)}
                    />
                  }
                  label="Sichtbar"
                />
                <IconButton onClick={() => removeSection(section.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>

              <TextField
                fullWidth
                label="Beschreibung"
                value={section.description || ''}
                onChange={(e) => handleSectionChange(section.id, 'description', e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* Felder */}
              <Box sx={{ ml: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Felder</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addField(section.id)}
                    size="small"
                  >
                    Feld hinzufügen
                  </Button>
                </Box>

                {section.fields.map((field) => (
                  <Paper key={field.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: { xs: '100%', md: 'calc(33.333% - 8px)' } }}>
                        <TextField
                          fullWidth
                          label="Bezeichnung"
                          value={field.label}
                          onChange={(e) => handleFieldChange(section.id, field.id, 'label', e.target.value)}
                        />
                      </Box>
                      <Box sx={{ flex: { xs: '100%', md: 'calc(33.333% - 8px)' } }}>
                        <FormControl fullWidth>
                          <InputLabel>Typ</InputLabel>
                          <Select
                            value={field.type}
                            label="Typ"
                            onChange={(e) => handleFieldChange(section.id, field.id, 'type', e.target.value)}
                          >
                            {FIELD_TYPES.map((type) => (
                              <MenuItem key={type} value={type}>
                                {type}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                      <Box sx={{ flex: { xs: '100%', md: 'calc(33.333% - 8px)' } }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.required}
                              onChange={(e) => handleFieldChange(section.id, field.id, 'required', e.target.checked)}
                            />
                          }
                          label="Pflichtfeld"
                        />
                      </Box>
                      <Box sx={{ flex: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton
                          onClick={() => removeField(section.id, field.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Box>
        ))}
      </Paper>

      {/* Styling */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Styling
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={template.styling.theme}
                label="Theme"
                onChange={(e) => handleTemplateChange('styling', {
                  ...template.styling,
                  theme: e.target.value as Template['styling']['theme'],
                })}
              >
                <MenuItem value="classic">Klassisch</MenuItem>
                <MenuItem value="modern">Modern</MenuItem>
                <MenuItem value="minimal">Minimal</MenuItem>
                <MenuItem value="professional">Professionell</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Primärfarbe"
              type="color"
              value={template.styling.colors.primary}
              onChange={(e) => handleTemplateChange('styling', {
                ...template.styling,
                colors: { ...template.styling.colors, primary: e.target.value },
              })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Sekundärfarbe"
              type="color"
              value={template.styling.colors.secondary}
              onChange={(e) => handleTemplateChange('styling', {
                ...template.styling,
                colors: { ...template.styling.colors, secondary: e.target.value },
              })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Hintergrundfarbe"
              type="color"
              value={template.styling.colors.background}
              onChange={(e) => handleTemplateChange('styling', {
                ...template.styling,
                colors: { ...template.styling.colors, background: e.target.value },
              })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Textfarbe"
              type="color"
              value={template.styling.colors.text}
              onChange={(e) => handleTemplateChange('styling', {
                ...template.styling,
                colors: { ...template.styling.colors, text: e.target.value },
              })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Schriftart"
              value={template.styling.font.family}
              onChange={(e) => handleTemplateChange('styling', {
                ...template.styling,
                font: { ...template.styling.font, family: e.target.value },
              })}
            />
          </Box>
          <Box sx={{ flex: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Schriftgröße"
              value={template.styling.font.size}
              onChange={(e) => handleTemplateChange('styling', {
                ...template.styling,
                font: { ...template.styling.font, size: e.target.value },
              })}
            />
          </Box>
        </Box>
      </Paper>

      {/* Aktionen */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} variant="outlined">
          Abbrechen
        </Button>
        <Button onClick={() => onSave(template)} variant="contained" color="primary">
          Speichern
        </Button>
      </Box>
    </Box>
  );
}; 