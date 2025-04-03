import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import workflowService from '../services/workflowService';
import { Workflow, WORKFLOW_STATUS } from '../types/workflow';

const WorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    status: WORKFLOW_STATUS.DRAFT,
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getAllWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err) {
      console.error('Fehler beim Laden der Workflows:', err);
      setError('Workflows konnten nicht geladen werden. Bitte versuche es später noch einmal.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowClick = (workflowId: number) => {
    navigate(`/workflows/${workflowId}`);
  };

  const handleCreateWorkflow = async () => {
    try {
      if (!newWorkflow.name.trim()) {
        return;
      }

      await workflowService.createWorkflow({
        name: newWorkflow.name,
        description: newWorkflow.description,
        status: newWorkflow.status,
      });

      setOpenNewDialog(false);
      setNewWorkflow({
        name: '',
        description: '',
        status: WORKFLOW_STATUS.DRAFT,
      });

      // Workflows neu laden
      await fetchWorkflows();
    } catch (err) {
      console.error('Fehler beim Erstellen des Workflows:', err);
      setError('Workflow konnte nicht erstellt werden. Bitte versuche es später noch einmal.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case WORKFLOW_STATUS.ACTIVE:
        return 'success';
      case WORKFLOW_STATUS.COMPLETED:
        return 'info';
      case WORKFLOW_STATUS.PAUSED:
        return 'warning';
      case WORKFLOW_STATUS.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getCompletionPercentage = (workflow: Workflow) => {
    if (workflow.total_tasks === 0) return 0;
    return Math.round((workflow.completed_tasks / workflow.total_tasks) * 100);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Workflows
          </Typography>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Workflows
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewDialog(true)}
          >
            Neuer Workflow
          </Button>
        </Box>

        {error && (
          <Typography color="error" paragraph>
            {error}
          </Typography>
        )}

        {workflows.length > 0 ? (
          <Grid container spacing={3}>
            {workflows.map((workflow) => (
              <Grid item xs={12} sm={6} md={4} key={workflow.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handleWorkflowClick(workflow.id)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {workflow.name}
                      </Typography>
                      <Chip 
                        label={workflow.status} 
                        size="small"
                        color={getStatusColor(workflow.status) as any}
                      />
                    </Box>
                    
                    {workflow.created_by_name && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Erstellt von: {workflow.created_by_name}
                      </Typography>
                    )}
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {workflow.description || 'Keine Beschreibung verfügbar'}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Fortschritt: {getCompletionPercentage(workflow)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={getCompletionPercentage(workflow)} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1.5 }}>
                      Aufgaben: {workflow.completed_tasks} / {workflow.total_tasks}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={5}>
            <Typography variant="body1" color="textSecondary" paragraph>
              Keine Workflows gefunden. Erstelle deinen ersten Workflow, um loszulegen.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewDialog(true)}
            >
              Workflow erstellen
            </Button>
          </Box>
        )}
      </Box>

      {/* Dialog zum Erstellen eines neuen Workflows */}
      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)}>
        <DialogTitle>Neuen Workflow erstellen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newWorkflow.name}
            onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Beschreibung"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newWorkflow.description}
            onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={newWorkflow.status}
              label="Status"
              onChange={(e) => setNewWorkflow({ ...newWorkflow, status: e.target.value })}
            >
              <MenuItem value={WORKFLOW_STATUS.DRAFT}>Entwurf</MenuItem>
              <MenuItem value={WORKFLOW_STATUS.ACTIVE}>Aktiv</MenuItem>
              <MenuItem value={WORKFLOW_STATUS.PAUSED}>Pausiert</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDialog(false)}>Abbrechen</Button>
          <Button
            onClick={handleCreateWorkflow}
            variant="contained"
            color="primary"
            disabled={!newWorkflow.name.trim()}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkflowsPage; 