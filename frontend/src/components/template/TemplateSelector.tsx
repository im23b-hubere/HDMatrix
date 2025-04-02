import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Template } from '@/types/template';

interface TemplateSelectorProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  onCancel: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSelect,
  onCancel,
}) => {
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onCancel}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Template auswählen
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {templates.map((template) => (
              <Box
                key={template.id}
                sx={{
                  flex: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' },
                }}
              >
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedTemplate?.id === template.id ? '2px solid #1976d2' : 'none',
                    '&:hover': {
                      border: '2px solid #1976d2',
                    },
                  }}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      bgcolor: template.styling.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#ffffff',
                        fontFamily: template.styling.font.family,
                      }}
                    >
                      {template.name}
                    </Typography>
                  </CardMedia>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip label={template.category} size="small" />
                      <Chip
                        label={`${template.sections.length} Abschnitte`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Zuletzt aktualisiert: {new Date(template.updatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Abbrechen</Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedTemplate}
        >
          Template auswählen
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 