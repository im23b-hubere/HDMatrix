import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Card, CardContent, Chip, Button,
  Tabs, Tab, Grid, LinearProgress, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Divider, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  ArrowBack as BackIcon,
  PlayArrow
} from '@mui/icons-material';
import workflowService from '../services/workflowService';
import { 
  Workflow, 
  Task, 
  WorkflowStage, 
  WORKFLOW_STATUS,
  TASK_STATUS,
  TASK_PRIORITY 
} from '../types/workflow';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workflow-tabpanel-${index}`}
      aria-labelledby={`workflow-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `workflow-tab-${index}`,
    'aria-controls': `workflow-tabpanel-${index}`,
  };
};

const WorkflowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const workflowId = parseInt(id || '0');
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog-Zustände
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    stage_id: undefined,
    estimated_hours: undefined,
    due_date: undefined
  });

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflowById(workflowId);
      setWorkflow(data);
      setError(null);
    } catch (err) {
      console.error('Fehler beim Laden des Workflows:', err);
      setError('Workflow konnte nicht geladen werden. Bitte versuche es später noch einmal.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackClick = () => {
    navigate('/workflows');
  };

  const handleCreateTask = async () => {
    try {
      if (!newTask.title?.trim()) {
        return;
      }

      await workflowService.createTask({
        ...newTask,
        workflow_id: workflowId,
        assigned_by: 1, // Hier sollte die aktuelle Benutzer-ID verwendet werden
      });

      setIsTaskDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        stage_id: undefined,
        estimated_hours: undefined,
        due_date: undefined
      });

      // Lade Workflow neu
      fetchWorkflow();
    } catch (err) {
      console.error('Fehler beim Erstellen der Aufgabe:', err);
      setError('Aufgabe konnte nicht erstellt werden. Bitte versuche es später noch einmal.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      if (!workflow) return;

      const taskToUpdate = workflow.stages?.flatMap(stage => stage.tasks || [])
        .find(task => task.id === taskId);

      if (!taskToUpdate) return;

      await workflowService.updateTask(taskId, {
        ...taskToUpdate,
        status: newStatus
      });

      // Lade Workflow neu
      fetchWorkflow();
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Aufgabe:', err);
      setError('Aufgabe konnte nicht aktualisiert werden. Bitte versuche es später noch einmal.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'paused':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'pending':
        return 'info';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCompletionPercentage = () => {
    if (!workflow) return 0;
    const tasks = workflow.stages?.flatMap(stage => stage.tasks || []) || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;

    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBackClick}
            sx={{ mt: 2 }}
          >
            Zurück zur Übersicht
          </Button>
        </Box>
      </Container>
    );
  }

  if (!workflow) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography>Workflow nicht gefunden.</Typography>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBackClick}
            sx={{ mt: 2 }}
          >
            Zurück zur Übersicht
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={handleBackClick} edge="start" sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {workflow.name}
          </Typography>
          <Chip
            label={workflow.status}
            color={getStatusColor(workflow.status) as any}
            sx={{ ml: 2 }}
          />
        </Box>

        <Typography variant="body1" color="textSecondary" paragraph>
          {workflow.description || 'Keine Beschreibung verfügbar'}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Fortschritt: {getCompletionPercentage()}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={getCompletionPercentage()}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="workflow tabs">
            <Tab label="Aufgaben" {...a11yProps(0)} />
            <Tab label="Mitglieder" {...a11yProps(1)} />
            <Tab label="Aktivitäten" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setIsTaskDialogOpen(true)}
            >
              Neue Aufgabe
            </Button>
          </Box>

          {workflow.stages && workflow.stages.length > 0 ? (
            workflow.stages.map((stage) => (
              <Box key={stage.id} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {stage.name}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {stage.tasks && stage.tasks.length > 0 ? (
                  <Grid container spacing={2}>
                    {stage.tasks.map((task) => (
                      <Grid item key={task.id} xs={12} md={6} lg={4}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Typography variant="h6" component="h3" gutterBottom>
                                {task.title}
                              </Typography>
                              <Chip
                                label={task.status}
                                size="small"
                                color={getTaskStatusColor(task.status) as any}
                              />
                            </Box>

                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                              {task.description || 'Keine Beschreibung verfügbar'}
                            </Typography>

                            {task.assigned_to_name && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Zugewiesen an:</strong> {task.assigned_to_name}
                              </Typography>
                            )}

                            {task.due_date && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Fällig bis:</strong> {new Date(task.due_date).toLocaleDateString()}
                              </Typography>
                            )}

                            <Box display="flex" justifyContent="flex-end" mt={2}>
                              {task.status === 'pending' && (
                                <IconButton
                                  color="primary"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'in progress')}
                                  size="small"
                                  title="Als 'In Bearbeitung' markieren"
                                >
                                  <PlayArrow />
                                </IconButton>
                              )}
                              {task.status === 'in progress' && (
                                <IconButton
                                  color="success"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                  size="small"
                                  title="Als 'Erledigt' markieren"
                                >
                                  <CheckIcon />
                                </IconButton>
                              )}
                              <IconButton
                                color="info"
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                size="small"
                                title="Bearbeiten"
                              >
                                <EditIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Keine Aufgaben in dieser Phase.
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body1" color="textSecondary" align="center">
              Keine Phasen in diesem Workflow. Füge Aufgaben hinzu, um loszulegen.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="body1" color="textSecondary" align="center">
            Mitgliederansicht wird in Kürze verfügbar sein.
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="body1" color="textSecondary" align="center">
            Aktivitätsprotokoll wird in Kürze verfügbar sein.
          </Typography>
        </TabPanel>
      </Box>

      {/* Dialog zum Erstellen einer neuen Aufgabe */}
      <Dialog
        open={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="Titel"
            type="text"
            fullWidth
            variant="outlined"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            sx={{ mb: 2 }}
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
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="stage-label">Phase</InputLabel>
                <Select
                  labelId="stage-label"
                  id="stage"
                  value={newTask.stage_id || ''}
                  label="Phase"
                  onChange={(e) => setNewTask({ ...newTask, stage_id: e.target.value ? Number(e.target.value) : undefined })}
                >
                  {workflow.stages?.map((stage) => (
                    <MenuItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="priority-label">Priorität</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  value={newTask.priority || 'medium'}
                  label="Priorität"
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <MenuItem value="low">Niedrig</MenuItem>
                  <MenuItem value="medium">Mittel</MenuItem>
                  <MenuItem value="high">Hoch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                id="estimated_hours"
                label="Geschätzte Stunden"
                type="number"
                fullWidth
                variant="outlined"
                value={newTask.estimated_hours || ''}
                onChange={(e) => setNewTask({ ...newTask, estimated_hours: e.target.value ? Number(e.target.value) : undefined })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                id="due_date"
                label="Fälligkeitsdatum"
                type="date"
                fullWidth
                variant="outlined"
                value={newTask.due_date || ''}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTaskDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            color="primary"
            disabled={!newTask.title?.trim()}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkflowDetailPage; 