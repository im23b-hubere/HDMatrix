import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const MinimalLayout: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            padding: { xs: 3, sm: 4 },
            borderRadius: 3,
            boxShadow: theme => `0 15px 30px ${alpha(theme.palette.primary.dark, 0.25)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #3f51b5, #5c6bc0)',
            }
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 3
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #3f51b5, #5c6bc0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              HRMatrix
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ textAlign: 'center' }}
            >
              Ihr HR-Management-System für effizientes CV- und Skill-Management
            </Typography>
          </Box>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default MinimalLayout; 