import { useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Stack,
  Divider,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  TableRestaurant as TableIcon,
  People as PeopleIcon,
  Kitchen as KitchenIcon,
  RoomService as WaiterIcon,
  Payment as CashierIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 260;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Navigation items
  const managementItems = [
    { text: 'Overview', icon: DashboardIcon, path: '/admin' },
    { text: 'Menu Management', icon: RestaurantIcon, path: '/admin/menu' },
    { text: 'Table Management', icon: TableIcon, path: '/admin/tables' },
    { text: 'User Management', icon: PeopleIcon, path: '/admin/users' },
  ];

  const staffItems = [
    { text: 'Kitchen Dashboard', icon: KitchenIcon, path: '/kitchen' },
    { text: 'Waiter Dashboard', icon: WaiterIcon, path: '/waiter' },
    { text: 'Cashier Dashboard', icon: CashierIcon, path: '/cashier' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Sidebar content
  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'primary.main',
        color: 'white',
      }}
    >
      {/* Logo/Brand Section */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.dark', width: 44, height: 44 }}>
            <RestaurantIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight="700" noWrap>
              Restaurant
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }} noWrap>
              Welcome Admin
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List disablePadding sx={{ px: 1.5 }}>
          {managementItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                py: 1.5,
                px: 2,
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'white',
                },
                '&.Mui-selected': {
                  bgcolor: 'primary.dark',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <item.icon />
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

        <List disablePadding sx={{ px: 1.5 }}>
          {staffItems.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                py: 1.5,
                px: 2,
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'white',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* User Profile at Bottom */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.dark', width: 36, height: 36 }}>
            {user?.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="600" noWrap>
              {user?.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}
              noWrap
            >
              {user?.role?.replace('_', ' ')}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile menu button */}
      {isMobile && (
        <IconButton
          color="primary"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300,
            bgcolor: 'white',
            boxShadow: 3,
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              position: 'fixed',
              height: '100vh',
              border: 'none',
              borderRight: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: '#fafafa',
          position: 'relative',
          border: 'none',
          outline: 'none',
          // Hide scrollbar completely - all browsers (multiple methods for maximum compatibility)
          scrollbarWidth: 'none', // Firefox
          '-ms-overflow-style': 'none', // IE and Edge
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome, Safari, Opera
            width: '0px',
            background: 'transparent',
          },
          '&::-webkit-scrollbar-track': {
            display: 'none',
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            display: 'none',
            background: 'transparent',
          },
          '&::-webkit-scrollbar-corner': {
            display: 'none',
            background: 'transparent',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
