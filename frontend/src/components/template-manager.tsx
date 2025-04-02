import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { api } from '../services/api';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  variables: TemplateVariable[];
}

interface TemplateVariable {
  name: string;
  type: string;
  description: string;
}

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [newVariable, setNewVariable] = useState<TemplateVariable>({
    name: '',
    type: 'string',
    description: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
    }
  };

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setCurrentTemplate(template);
    } else {
      setCurrentTemplate({
        id: '',
        name: '',
        category: '',
        description: '',
        variables: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTemplate(null);
  };

  const handleSaveTemplate = async () => {
    try {
      if (currentTemplate) {
        if (currentTemplate.id) {
          await api.put(`/templates/${currentTemplate.id}`, currentTemplate);
        } else {
          await api.post('/templates', currentTemplate);
        }
        loadTemplates();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Templates:', error);
    }
  };

  const handleAddVariable = () => {
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        variables: [...currentTemplate.variables, newVariable],
      });
      setNewVariable({
        name: '',
        type: 'string',
        description: '',
      });
    }
  };

  const handleRemoveVariable = (index: number) => {
    if (currentTemplate) {
      const updatedVariables = currentTemplate.variables.filter((_, i) => i !== index);
      setCurrentTemplate({
        ...currentTemplate,
        variables: updatedVariables,
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Template-Verwaltung</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Neues Template
        </Button>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Box key={template.id} sx={{ width: { xs: '100%', md: '50%', lg: '33.33%' }, p: 1.5 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">{template.name}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {template.category}
                </Typography>
                <Typography variant="body2">{template.description}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {template.variables.length} Variablen
                </Typography>
              </CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <IconButton onClick={() => handleOpenDialog(template)}>
                  <EditIcon />
                </IconButton>
              </Box>
            </Card>
          </Box>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentTemplate?.id ? 'Template bearbeiten' : 'Neues Template'}
        </DialogTitle>
        <DialogContent>
          {currentTemplate && (
            <>
              <TextField
                fullWidth
                label="Name"
                value={currentTemplate.name}
                onChange={(e) =>
                  setCurrentTemplate({ ...currentTemplate, name: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Kategorie"
                value={currentTemplate.category}
                onChange={(e) =>
                  setCurrentTemplate({ ...currentTemplate, category: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Beschreibung"
                value={currentTemplate.description}
                onChange={(e) =>
                  setCurrentTemplate({ ...currentTemplate, description: e.target.value })
                }
                margin="normal"
                multiline
                rows={3}
              />

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Variablen
              </Typography>
              <List>
                {currentTemplate.variables.map((variable, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={variable.name}
                      secondary={`${variable.type} - ${variable.description}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveVariable(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Neue Variable</Typography>
                <TextField
                  label="Name"
                  value={newVariable.name}
                  onChange={(e) =>
                    setNewVariable({ ...newVariable, name: e.target.value })
                  }
                  margin="normal"
                  size="small"
                />
                <TextField
                  label="Typ"
                  value={newVariable.type}
                  onChange={(e) =>
                    setNewVariable({ ...newVariable, type: e.target.value })
                  }
                  margin="normal"
                  size="small"
                />
                <TextField
                  label="Beschreibung"
                  value={newVariable.description}
                  onChange={(e) =>
                    setNewVariable({ ...newVariable, description: e.target.value })
                  }
                  margin="normal"
                  size="small"
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddVariable}
                  sx={{ mt: 1 }}
                >
                  Variable hinzufügen
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 