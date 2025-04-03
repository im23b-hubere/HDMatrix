import React from 'react';
import { Box, Button, Container, Typography, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import { alpha } from '@mui/material/styles';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '80vh',
          py: 8
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4
          }}
        >
          <Box
            sx={{
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                top: -10,
                left: -10,
                zIndex: -1
              }
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 100,
                color: theme.palette.primary.main
              }}
            />
          </Box>
        </Box>

        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: 100, md: 150 },
            fontWeight: 700,
            lineHeight: 1,
            mb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: -2
          }}
        >
          404
        </Typography>

        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ 
            mb: 1,
            fontWeight: 600 
          }}
        >
          Seite nicht gefunden
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ 
            maxWidth: 500,
            mb: 4
          }}
        >
          Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
          Bitte überprüfen Sie die URL oder kehren Sie zur Startseite zurück.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Zurück
          </Button>

          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
              '&:hover': {
                boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`
              }
            }}
          >
            Zur Startseite
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFoundPage; 