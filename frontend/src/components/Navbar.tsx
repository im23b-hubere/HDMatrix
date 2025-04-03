import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery,
  Divider, Avatar, Menu, MenuItem, Button, Badge, Tooltip
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
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';

export interface NavbarProps {
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
  drawerWidth?: number;
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

  const drawer = (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%' 
        }}
      >
        <Toolbar sx={{ 
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
          color: 'white',
          '&.MuiToolbar-root': {
            minHeight: '64px'
          }
        }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            HRMatrix
          </Typography>
          {isMobile && (
            <IconButton 
              onClick={onDrawerToggle} 
              sx={{ color: 'inherit' }}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Toolbar>
        <Divider />
        <Box sx={{ overflow: 'auto', flexGrow: 1, mt: 2 }}>
          <List>
            {drawerItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '8px',
                    mx: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'primary.main',
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                      minWidth: 42,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 1,
              p: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Avatar 
              src="/path/to/user-avatar.jpg" 
              alt="Benutzer"
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap>
                Max Mustermann
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Administrator
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
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
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            <Tooltip title="Benachrichtigungen">
              <IconButton 
                color="inherit" 
                onClick={handleNotificationsOpen}
                sx={{ 
                  borderRadius: 1.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                ml: 2,
                cursor: 'pointer',
                padding: 1,
                borderRadius: 1.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
              onClick={handleProfileMenuOpen}
            >
              <Avatar 
                src="/path/to/user-avatar.jpg" 
                alt="Benutzer"
                sx={{ width: 36, height: 36 }}
              />
              <Box sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}>
                <Typography variant="subtitle2" component="div" noWrap>
                  Max Mustermann
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div" noWrap>
                  Administrator
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <AccountCircleIcon />
            </IconButton>
          </Box>
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