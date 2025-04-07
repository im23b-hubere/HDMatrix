import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery,
  Divider, Avatar, Menu, MenuItem, Button, Badge, Tooltip, Stack, TextField, InputAdornment
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Workspaces as WorkspacesIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

export interface NavbarProps {
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
  drawerWidth?: number;
  isMobile?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  mobileOpen = false, 
  onDrawerToggle = () => {}, 
  drawerWidth = 260 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(anchorEl);
  const notificationsMenuOpen = Boolean(notificationsAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const drawerItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
    },
    {
      text: 'Lebensläufe',
      icon: <DescriptionIcon />,
      path: '/cvs',
    },
    {
      text: 'CV hochladen',
      icon: <CloudUploadIcon />,
      path: '/cv/upload',
    },
    {
      text: 'Mitarbeiter & Teams',
      icon: <PeopleIcon />,
      path: '/employees',
    },
    {
      text: 'Suche',
      icon: <SearchIcon />,
      path: '/search',
    },
    {
      text: 'Workflows',
      icon: <WorkspacesIcon />,
      path: '/workflows',
    },
    {
      text: 'Einstellungen',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  // Stil für Drawer-Header
  const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.85)} 100%)`,
    color: 'white',
    minHeight: '64px',
  }));

  // Verbessertes Logo
  const Logo = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <WorkspacesIcon sx={{ mr: 1, fontSize: 28 }} />
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700, 
          letterSpacing: '0.02em',
          background: 'linear-gradient(45deg, #fff 30%, rgba(255,255,255,0.8) 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        HRMatrix
      </Typography>
    </Box>
  );

  const drawer = (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DrawerHeader>
          <Logo />
          {isMobile && (
            <IconButton 
              onClick={onDrawerToggle} 
              sx={{ color: 'inherit' }}
              size="small"
            >
              <ChevronLeftIcon />
            </IconButton>
          )}
        </DrawerHeader>
        
        <Divider sx={{ opacity: 0.6 }} />
        
        <Box sx={{ overflow: 'auto', flexGrow: 1, py: 2, px: 1.5 }}>
          {/* Navigation Groups */}
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                px: 3, 
                py: 1, 
                fontWeight: 700, 
                color: 'text.secondary', 
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.1em'
              }}
            >
              Hauptnavigation
            </Typography>
            
            <List component="nav" disablePadding>
              {drawerItems.slice(0, 3).map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: '10px',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                        '& .MuiListItemText-primary': {
                          color: 'white',
                          fontWeight: 600,
                        },
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: location.pathname === item.path ? 'white' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        fontWeight: location.pathname === item.path ? 600 : 500,
                        variant: 'body2'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
          
          <Box sx={{ my: 2 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                px: 3, 
                py: 1, 
                fontWeight: 700, 
                color: 'text.secondary', 
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.1em'
              }}
            >
              Verwaltung
            </Typography>
            
            <List component="nav" disablePadding>
              {drawerItems.slice(3).map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: '10px',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                        '& .MuiListItemText-primary': {
                          color: 'white',
                          fontWeight: 600,
                        },
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: location.pathname === item.path ? 'white' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        fontWeight: location.pathname === item.path ? 600 : 500,
                        variant: 'body2'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
        
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              p: 1.5,
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                cursor: 'pointer'
              },
              transition: 'background-color 0.2s',
            }}
            onClick={handleProfileMenuOpen}
          >
            <Avatar 
              src="/path/to/user-avatar.jpg" 
              alt="Benutzer"
              sx={{ 
                width: 42, 
                height: 42, 
                mr: 2,
                background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
              }}
            >
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap fontWeight={600}>
                Max Mustermann
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Administrator
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              sx={{ ml: 1, color: 'text.secondary' }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
          backgroundColor: 'background.paper',
          backdropFilter: 'blur(20px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ height: 64 }}>
          <IconButton
            color="inherit"
            aria-label="Menü öffnen"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'primary.main' }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <TextField
              size="small"
              placeholder="Globale Suche..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { 
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                  width: 250,
                }
              }}
            />
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Benachrichtigungen">
                <IconButton 
                  color="inherit" 
                  onClick={handleNotificationsOpen}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <Badge badgeContent={3} color="primary">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Profil">
                <IconButton 
                  color="inherit" 
                  onClick={handleProfileMenuOpen}
                  sx={{ 
                    color: 'text.secondary',
                    ml: 1,
                    '&:hover': {
                      color: 'primary.main',
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={onDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={profileMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            borderRadius: 2,
            minWidth: 180,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 0.5,
              my: 0.25,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Mein Profil
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Einstellungen
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Abmelden
        </MenuItem>
      </Menu>
      
      <Menu
        anchorEl={notificationsAnchorEl}
        id="notifications-menu"
        open={notificationsMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            borderRadius: 2,
            width: 320,
            maxHeight: 440,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Benachrichtigungen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            3 ungelesene Benachrichtigungen
          </Typography>
        </Box>
        
        <List sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
          <ListItem 
            sx={{ 
              px: 2, 
              py: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  color: theme.palette.primary.main
                }}
              >
                <DescriptionIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText 
              primary="Lebenslauf aktualisiert" 
              secondary="Max Mustermann hat seinen Lebenslauf aktualisiert."
              primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          
          <ListItem 
            sx={{ 
              px: 2, 
              py: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  backgroundColor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main
                }}
              >
                <WorkspacesIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText 
              primary="Neuer Workflow" 
              secondary="Ein neuer Workflow 'Onboarding' wurde erstellt."
              primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          
          <ListItem 
            sx={{ 
              px: 2, 
              py: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  backgroundColor: alpha(theme.palette.info.main, 0.15),
                  color: theme.palette.info.main
                }}
              >
                <PersonIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText 
              primary="Neuer Mitarbeiter" 
              secondary="Lisa Schmidt wurde als neuer Mitarbeiter hinzugefügt."
              primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
        
        <Box sx={{ p: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
          <Button 
            fullWidth 
            size="small" 
            onClick={() => navigate('/notifications')}
          >
            Alle Benachrichtigungen anzeigen
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default Navbar; 