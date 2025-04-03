import { createTheme } from '@mui/material/styles';
import { red, blue, blueGrey, teal } from '@mui/material/colors';

// Erstelle ein Theme-Objekt.
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // Indigoblau
      light: '#757de8',
      dark: '#002984',
    },
    secondary: {
      main: '#4caf50', // Grün
      light: '#80e27e',
      dark: '#087f23',
    },
    error: {
      main: red[500],
    },
    warning: {
      main: '#ff9800', // Orange
      light: '#ffc947',
      dark: '#c66900',
    },
    info: {
      main: blue[500], // Blau
      light: blue[300],
      dark: blue[700],
    },
    success: {
      main: teal[500], // Teal
      light: teal[300], 
      dark: teal[700],
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: blueGrey[900],
      secondary: blueGrey[600],
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          boxShadow: '0 2px 8px rgba(63, 81, 181, 0.2)',
        },
        containedSecondary: {
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
        elevation1: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        },
        elevation3: {
          boxShadow: '0 6px 20px rgba(0,0,0,0.07)',
        },
        elevation4: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 0 0 4px rgba(63, 81, 181, 0.05)',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(63, 81, 181, 0.1)',
            },
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(63, 81, 181, 0.04) !important',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
          borderRadius: 8,
          '&:hover': {
            backgroundColor: 'rgba(63, 81, 181, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
          '&.Mui-selected': {
            fontWeight: 600,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

export default theme; 