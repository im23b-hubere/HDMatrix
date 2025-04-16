import { createTheme } from '@mui/material/styles';
import { red, blue, blueGrey, teal, grey } from '@mui/material/colors';

// Erstelle ein modernes Theme-Objekt mit verbesserten visuellen Effekten
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Helles Blau, moderner und freundlicher
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981', // Modernes Grün
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // Helleres Rot
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b', // Warmes Orange
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6', // Helles Info-Blau
      light: '#60a5fa',
      dark: '#2563eb',
    },
    success: {
      main: '#10b981', // Helles Grün
      light: '#34d399', 
      dark: '#059669',
    },
    background: {
      default: '#f9fafb', // Leicht heller für bessere Lesbarkeit
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // Dunkler für besseren Kontrast
      secondary: '#4b5563',
    },
    divider: 'rgba(0, 0, 0, 0.06)',
  },
  shape: {
    borderRadius: 10, // Erhöht für moderneres Aussehen
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          },
        },
        containedPrimary: {
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
          },
        },
        containedSecondary: {
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        },
        elevation1: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        },
        elevation2: {
          boxShadow: '0 8px 25px rgba(0,0,0,0.07)',
        },
        elevation3: {
          boxShadow: '0 12px 30px rgba(0,0,0,0.09)',
        },
        elevation4: {
          boxShadow: '0 16px 35px rgba(0,0,0,0.11)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 25px rgba(0,0,0,0.07)',
          overflow: 'hidden',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 16px 35px rgba(0,0,0,0.12)',
          },
          border: '1px solid rgba(0, 0, 0, 0.03)',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.08)',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.04) !important',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
          borderColor: 'rgba(0, 0, 0, 0.06)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 10,
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&.Mui-selected': {
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
          },
        },
        colorPrimary: {
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          color: '#2563eb',
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.18)',
          },
        },
        colorSecondary: {
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#059669',
          '&:hover': {
            backgroundColor: 'rgba(16, 185, 129, 0.18)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
          border: '2px solid white',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: '4px 0 16px rgba(0,0,0,0.06)',
          border: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(6px)',
          fontSize: '0.75rem',
          padding: '8px 12px',
          borderRadius: 6,
          boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
        },
        arrow: {
          color: 'rgba(17, 24, 39, 0.9)',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
  },
}); 

export default theme; 