import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { Template } from '@/types/template';
import { TemplateForm } from './TemplateForm';

interface TemplateListProps {
  templates: Template[];
  onSave: (template: Template) => void;
  onDelete: (templateId: string) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  onSave,
  onDelete,
}) => {
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: 'Neues Template',
      description: 'Beschreibung des Templates',
      category: 'standard',
      sections: [],
      styling: {
        theme: 'classic',
        colors: {
          primary: '#1976d2',
          secondary: '#dc004e',
          background: '#ffffff',
          text: '#000000',
        },
        font: {
          family: 'Roboto',
          size: '14px',
        },
        spacing: {
          section: '24px',
          field: '16px',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedTemplate(newTemplate);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setIsDialogOpen(false);
  };

  const handleSave = (template: Template) => {
    onSave(template);
    handleClose();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Templates</Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleCreate}
          variant="contained"
        >
          Neues Template
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {templates.map((template) => (
          <Box
            key={template.id}
            sx={{
              flex: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' },
            }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {template.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={`${template.sections.length} Abschnitte`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={template.category}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Zuletzt aktualisiert: {new Date(template.updatedAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(template)}
                  size="small"
                >
                  Bearbeiten
                </Button>
                <IconButton
                  onClick={() => onDelete(template.id)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      <Dialog
        open={isDialogOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate?.id.startsWith('template-') ? 'Neues Template' : 'Template bearbeiten'}
        </DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <TemplateForm
              template={selectedTemplate}
              onChange={setSelectedTemplate}
              onSave={handleSave}
              onCancel={handleClose}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Abbrechen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 