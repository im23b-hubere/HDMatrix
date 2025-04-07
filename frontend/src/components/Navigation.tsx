import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Box, List, ListItem, ListItemIcon, ListItemText, 
  Typography, Divider, useTheme, alpha 
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  WorkOutline as WorkOutlineIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const Navigation: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  
  const navItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <DashboardIcon />,
    },
    {
      title: 'Lebensläufe',
      path: '/cvs',
      icon: <DescriptionIcon />,
    },
    {
      title: 'CV hochladen',
      path: '/cv/upload',
      icon: <CloudUploadIcon />,
    },
    {
      title: 'Mitarbeiter',
      path: '/employees',
      icon: <PeopleIcon />,
    },
    {
      title: 'Workflows',
      path: '/workflows',
      icon: <WorkOutlineIcon />,
    },
    {
      title: 'Suche',
      path: '/search',
      icon: <SearchIcon />,
    },
    {
      title: 'Einstellungen',
      path: '/settings',
      icon: <SettingsIcon />,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3, px: 3 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            textTransform: 'uppercase', 
            fontWeight: 700, 
            color: 'text.secondary',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            display: 'block',
            mb: 1.5
          }}
        >
          Hauptnavigation
        </Typography>
      </Box>
      
      <List sx={{ px: 2 }}>
        {navItems.map((item, index) => (
          <ListItem 
            key={item.path} 
            disablePadding 
            sx={{ 
              mb: 1,
              display: 'block'
            }}
          >
            <NavLink 
              to={item.path}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive: linkIsActive }) => (
                <Box
                  sx={{
                    borderRadius: '10px',
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: isActive(item.path) ? 'primary.main' : 'transparent',
                    color: isActive(item.path) ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive(item.path) 
                        ? 'primary.dark' 
                        : alpha(theme.palette.primary.main, 0.08),
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 40, 
                      color: isActive(item.path) ? 'white' : 'text.secondary' 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title} 
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 500,
                      variant: 'body2'
                    }}
                  />
                </Box>
              )}
            </NavLink>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Navigation; 