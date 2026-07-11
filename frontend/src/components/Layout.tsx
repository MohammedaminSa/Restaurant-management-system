import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, IconButton, Badge, Menu, MenuItem, Avatar } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon, Restaurant as RestaurantIcon, AccountCircle as AccountCircleIcon } from '@mui/icons-material';
import { useCartStore } from '../stores/cartStore';
import { useAuth } from '../contexts/AuthContext';
import CartDrawer from './CartDrawer';
import FloatingCartButton from './FloatingCartButton';

export default function Layout() {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const itemCount = useCartStore((state) => state.getItemCount());
  const { isAuthenticated, user, logout } = useAuth();

  const handleCartClick = () => {
    setCartOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <RestaurantIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Restaurant Ordering
          </Typography>

          {/* Show cart icon only for customer routes */}
          {!isAuthenticated && (
            <IconButton color="inherit" aria-label="cart" onClick={handleCartClick}>
              <Badge badgeContent={itemCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          )}

          {/* Show user menu for staff */}
          {isAuthenticated && user && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.5, borderRadius: 1 }}>
                  {user.role.replace('_', ' ')}
                </Typography>
              </Box>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                {user.avatar_url ? (
                  <Avatar src={user.avatar_url} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container component="main" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Restaurant Ordering System
          </Typography>
        </Container>
      </Box>

      {/* Cart Drawer - Only for customers */}
      {!isAuthenticated && (
        <>
          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
          <FloatingCartButton onClick={handleCartClick} />
        </>
      )}
    </Box>
  );
}
