import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
} from '@mui/material';
import { LucideIcon } from 'lucide-react';
import { DarkMode, LightMode } from '@mui/icons-material';

interface NavigationItem {
  label: string;
  icon: LucideIcon;
  value: string;
}

interface NavigationProps {
  items: NavigationItem[];
  activeItem: string;
  onItemSelect: (value: string) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activeItem,
  onItemSelect,
  isDarkMode,
  onThemeToggle,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 240,
        borderRight: `1px solid ${theme.palette.divider}`,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <List sx={{ flexGrow: 1 }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.value} disablePadding>
              <ListItemButton
                selected={activeItem === item.value}
                onClick={() => onItemSelect(item.value)}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <IconButton onClick={onThemeToggle} size="large">
          {isDarkMode ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Box>
    </Box>
  );
}; 