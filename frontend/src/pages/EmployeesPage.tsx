import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Avatar, Chip,
  IconButton, TextField, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions,
  DialogContentText,
  TablePagination, Tooltip, CircularProgress,
  Card, CardContent, Grid, Stack
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Group as GroupIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import cvService from '../services/cvService';
import { Employee } from '../types/cv';

// Mock-Daten für Mitarbeiter, in realer Anwendung würden diese von einer API kommen
const mockEmployees = [
  {
    id: 1,
    name: 'Max Mustermann',
    position: 'Senior Softwareentwickler',
    email: 'max.mustermann@example.com',
    phone: '+49 123 456789',
    department: 'Engineering',
    hireDate: '2019-05-15',
    status: 'Aktiv'
  },
  {
    id: 2,
    name: 'Anna Schmidt',
    position: 'UX Designer',
    email: 'anna.schmidt@example.com',
    phone: '+49 123 456790',
    department: 'Design',
    hireDate: '2020-02-10',
    status: 'Aktiv'
  },
  {
    id: 3,
    name: 'Thomas Weber',
    position: 'Projektmanager',
    email: 'thomas.weber@example.com',
    phone: '+49 123 456791',
    department: 'Projektmanagement',
    hireDate: '2018-11-01',
    status: 'Aktiv'
  },
  {
    id: 4,
    name: 'Laura Müller',
    position: 'Frontend Entwicklerin',
    email: 'laura.mueller@example.com',
    phone: '+49 123 456792',
    department: 'Engineering',
    hireDate: '2021-03-22',
    status: 'Aktiv'
  },
  {
    id: 5,
    name: 'Michael Becker',
    position: 'Datenwissenschaftler',
    email: 'michael.becker@example.com',
    phone: '+49 123 456793',
    department: 'Data Science',
    hireDate: '2020-07-15',
    status: 'Beurlaubt'
  }
];

const EmployeesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState(mockEmployees);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

  // Statistiken berechnen
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'Aktiv').length;
  const departments = Array.from(new Set(employees.map(emp => emp.department))).length;

  useEffect(() => {
    // In einer echten Anwendung würden hier Daten von einer API geladen
    setLoading(true);
    setTimeout(() => {
      setEmployees(mockEmployees);
      setLoading(false);
    }, 500);
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedEmployee(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedEmployee !== null) {
      setEmployees(employees.filter(emp => emp.id !== selectedEmployee));
    }
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/employees/${id}`);
  };

  const handleEditEmployee = (id: number) => {
    navigate(`/employees/edit/${id}`);
  };

  const handleAddEmployee = () => {
    navigate('/employees/new');
  };

  // Filtern der Mitarbeiter basierend auf der Suche
  const filteredEmployees = employees.filter(
    employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="500" gutterBottom>
          Mitarbeiter & Teams
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Verwalten Sie Mitarbeiterinformationen und Teamzuweisungen
        </Typography>
      </Box>

      {/* Statistikkarten */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    p: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mr: 2
                  }}
                >
                  <PersonIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {totalEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mitarbeiter gesamt
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    p: 1.5,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    mr: 2
                  }}
                >
                  <GroupIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {activeEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktive Mitarbeiter
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    p: 1.5,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    mr: 2
                  }}
                >
                  <AssignmentIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {departments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Abteilungen
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Suchleiste und Hinzufügen-Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Mitarbeiter suchen..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ 
            width: { xs: '100%', sm: '50%', md: '40%' },
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddEmployee}
          sx={{ 
            borderRadius: 8,
            px: 3,
            py: 1,
            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
            '&:hover': {
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            }
          }}
        >
          Mitarbeiter hinzufügen
        </Button>
      </Box>

      {/* Mitarbeitertabelle */}
      <Paper 
        sx={{ 
          width: '100%', 
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Position</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Abteilung</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee) => (
                  <TableRow 
                    hover 
                    key={employee.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {employee.name}
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={employee.status === 'Aktiv' ? 'success' : 'default'}
                        size="small"
                        sx={{ borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewDetails(employee.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => handleEditEmployee(employee.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(employee.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      Keine Mitarbeiter gefunden
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Zeilen pro Seite"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} von ${count !== -1 ? count : `mehr als ${to}`}`
          }
        />
      </Paper>

      {/* Löschdialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Mitarbeiter löschen
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Abbrechen
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeesPage; 