import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, IconButton, Badge } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon, Restaurant as RestaurantIcon } from '@mui/icons-material';
import { useCartStore } from '../stores/cartStore';
import CartDrawer from './CartDrawer';
import FloatingCartButton from './FloatingCartButton';

export default function Layout() {
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());

  const handleCartClick = () => {
    setCartOpen(true);
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
          <IconButton color="inherit" aria-label="cart" onClick={handleCartClick}>
            <Badge badgeContent={itemCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
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

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Floating Cart Button */}
      <FloatingCartButton onClick={handleCartClick} />
    </Box>
  );
}
