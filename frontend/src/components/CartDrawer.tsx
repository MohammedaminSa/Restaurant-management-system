import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useSession } from '../contexts/SessionContext';
import CartItem from './CartItem';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { items, getItemCount, getSubtotal, getTax, getServiceCharge, getTotal } = useCartStore();
  const { sessionData } = useSession();

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const tax = sessionData ? getTax(sessionData.tax_rate) : 0;
  const serviceCharge = sessionData ? getServiceCharge(sessionData.service_charge_rate) : 0;
  const total = sessionData ? getTotal(sessionData.tax_rate, sessionData.service_charge_rate) : subtotal;

  const handlePlaceOrder = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100%',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ShoppingCartIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Your Cart ({itemCount})
            </Typography>
          </Stack>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Cart Items */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {items.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 4,
                textAlign: 'center',
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add items from the menu to get started
              </Typography>
              <Button variant="contained" onClick={() => { onClose(); navigate('/menu'); }}>
                Browse Menu
              </Button>
            </Box>
          ) : (
            <>
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </>
          )}
        </Box>

        {/* Footer - Totals & Checkout */}
        {items.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            {/* Session Warning */}
            {!sessionData && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please scan a QR code to start a session before placing an order.
              </Alert>
            )}

            {/* Price Breakdown */}
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">${subtotal.toFixed(2)}</Typography>
              </Stack>

              {sessionData && (
                <>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Tax ({sessionData.tax_rate}%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${tax.toFixed(2)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Service Charge ({sessionData.service_charge_rate}%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${serviceCharge.toFixed(2)}
                    </Typography>
                  </Stack>
                </>
              )}

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">
                  Total
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ${total.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>

            {/* Place Order Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handlePlaceOrder}
              disabled={!sessionData}
              sx={{ py: 1.5 }}
            >
              {sessionData ? 'Place Order' : 'Start Session First'}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
