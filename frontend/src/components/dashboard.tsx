"use client";

import React from 'react';
import { 
  Grid, Box, Typography, Paper, useTheme, Stack, Divider, 
  Button, IconButton, Menu, MenuItem, alpha 
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Assessment as AssessmentIcon,
  PeopleAlt as PeopleAltIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import DepartmentChart from './department-chart';
import SkillDistributionChart from './skill-distribution-chart';
import RecentActivityList from './recent-activity-list';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const StatCard = ({ title, value, icon, change, timeframe, trend }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode;
    change?: number;
    timeframe?: string;
    trend?: 'up' | 'down' | null;
  }) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start'
        }}>
          <Box sx={{ mr: 2 }}>
            <CardTitle className="text-lg font-medium mb-1">{title}</CardTitle>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: 'text.primary',
              fontSize: '1.75rem',
              lineHeight: 1.2
            }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: '12px', 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main'
          }}>
            {icon}
          </Box>
        </Box>
      </CardHeader>
      {change && (
        <CardFooter className="pt-2">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary',
            fontSize: '0.875rem'
          }}>
            {trend === 'up' ? (
              <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
            ) : trend === 'down' ? (
              <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
            ) : null}
            <span>{change}% {timeframe}</span>
          </Box>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Dashboard
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            sx={{ 
              mr: 2,
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
          Bericht erstellen
          </Button>
          <IconButton onClick={handleMenuClick} sx={{ ml: 1 }}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { 
                mt: 1.5, 
                boxShadow: theme.shadows[3],
                borderRadius: 2,
              }
            }}
          >
            <MenuItem onClick={handleMenuClose}>Exportieren</MenuItem>
            <MenuItem onClick={handleMenuClose}>Drucken</MenuItem>
            <MenuItem onClick={handleMenuClose}>Teilen</MenuItem>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Gesamt Mitarbeiter" 
            value="248" 
            icon={<PeopleAltIcon />}
            change={5.2}
            timeframe="seit letztem Monat"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Aktive Lebensläufe" 
            value="187" 
            icon={<DescriptionIcon />}
            change={12}
            timeframe="seit letztem Monat"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Aktive Workflows" 
            value="36" 
            icon={<TimelineIcon />}
            change={2.1}
            timeframe="seit letztem Monat"
            trend="down"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Berichte" 
            value="12" 
            icon={<AssessmentIcon />}
          />
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card className="overflow-hidden h-full">
            <CardHeader>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <CardTitle>Abteilungen Übersicht</CardTitle>
                  <CardDescription>Verteilung der Mitarbeiter nach Abteilungen</CardDescription>
                </Box>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardHeader>
            <CardContent>
              <Box sx={{ height: 350, pt: 2 }}>
                <DepartmentChart />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card className="overflow-hidden h-full">
            <CardHeader>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <CardTitle>Fähigkeiten</CardTitle>
                  <CardDescription>Top Skills in der Organisation</CardDescription>
                </Box>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardHeader>
            <CardContent>
              <Box sx={{ height: 350, pt: 2 }}>
                <SkillDistributionChart />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className="overflow-hidden">
            <CardHeader>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <CardTitle>Neueste Aktivitäten</CardTitle>
                  <CardDescription>Letzte Aktionen und Änderungen im System</CardDescription>
                </Box>
                <Button variant="soft" size="sm">Alle anzeigen</Button>
              </Box>
            </CardHeader>
            <CardContent>
              <RecentActivityList />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
