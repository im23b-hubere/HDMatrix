import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Menu as MenuIcon, Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';

interface NavbarProps {
  toggleTheme?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleTheme }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <AppBar position="static" color="default" elevation={1} sx={{ mb: 3 }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              mr: 1
            }}
          >
            HR
          </Box>
          HRMatrix
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button 
            component={RouterLink} 
            to="/workflows"
            color="inherit"
            sx={{ mx: 1 }}
          >
            Workflows
          </Button>
          <Button 
            component={RouterLink} 
            to="/cvs"
            color="inherit"
            sx={{ mx: 1 }}
          >
            Lebensläufe
          </Button>
          <Button 
            component={RouterLink} 
            to="/tasks"
            color="inherit"
            sx={{ mx: 1 }}
          >
            Aufgaben
          </Button>
        </Box>
        
        {toggleTheme && (
          <IconButton 
            onClick={toggleTheme} 
            color="inherit"
            sx={{ ml: 1 }}
            aria-label={isDarkMode ? 'In hellen Modus wechseln' : 'In dunklen Modus wechseln'}
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 