import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useSession } from '../../contexts/SessionContext';
import { useCartStore } from '../../stores/cartStore';
import { placeOrder } from '../../services/api';
import type { PlaceOrderRequest } from '../../services/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { sessionToken, sessionData } = useSession();
  const { items, getItemCount, getSubtotal, getTax, getServiceCharge, getTotal, clearCart } = useCartStore();
  const [orderInstructions, setOrderInstructions] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const tax = sessionData ? getTax(sessionData.tax_rate) : 0;
  const serviceCharge = sessionData ? getServiceCharge(sessionData.service_charge_rate) : 0;
  const total = sessionData ? getTotal(sessionData.tax_rate, sessionData.service_charge_rate) : subtotal;

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: (orderData: PlaceOrderRequest) => placeOrder(orderData),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setOrderNumber(response.data.order_number);
        setShowSuccessDialog(true);
        clearCart();
      }
    },
  });

  const handlePlaceOrder = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmOrder = async () => {
    setShowConfirmDialog(false);

    if (!sessionToken) {
      return;
    }

    const orderData: PlaceOrderRequest = {
      session_token: sessionToken,
      order_type: 'dine_in',
      items: items.map((item) => ({
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        selected_variants: item.selectedVariants.length > 0 
          ? item.selectedVariants.reduce((acc, v) => ({
              ...acc,
              [v.variant_id]: {
                option_id: v.option_id,
                option_name: v.option_name,
                price_modifier: v.price_modifier,
              }
            }), {})
          : undefined,
        special_instructions: item.specialInstructions,
      })),
      special_instructions: orderInstructions || undefined,
    };

    placeOrderMutation.mutate(orderData);
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    navigate('/orders');
  };

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add items from the menu to place an order
          </Typography>
          <Button variant="contained" onClick={() => navigate('/menu')}>
            Browse Menu
          </Button>
        </Paper>
      </Container>
    );
  }

  // Redirect if no session
  if (!sessionData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          No active session found. Please scan a QR code to start a session.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/menu')}
          variant="outlined"
        >
          Back to Menu
        </Button>
        <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
          Checkout
        </Typography>
      </Stack>

      {/* Session Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dining Information
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Table
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {sessionData.table_number}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {sessionData.customer_name}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Location
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {sessionData.location}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Order Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Order Summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </Typography>

        <List disablePadding>
          {items.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                py: 2,
                px: 0,
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-child': { borderBottom: 0 },
              }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="medium">
                      {item.quantity}x {item.menuItem.name}
                    </Typography>
                  </Stack>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    {/* Variants */}
                    {item.selectedVariants.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }} flexWrap="wrap">
                        {item.selectedVariants.map((variant, index) => (
                          <Chip
                            key={index}
                            label={`${variant.variant_name}: ${variant.option_name}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                      </Stack>
                    )}
                    {/* Special Instructions */}
                    {item.specialInstructions && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Note: {item.specialInstructions}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Typography variant="subtitle1" fontWeight="medium">
                ${item.itemTotal.toFixed(2)}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Order Instructions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Special Instructions (Optional)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Any special requests for your order? (e.g., allergies, preferences)"
          value={orderInstructions}
          onChange={(e) => setOrderInstructions(e.target.value)}
          variant="outlined"
        />
      </Paper>

      {/* Price Breakdown */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Payment Summary
        </Typography>

        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body1">Subtotal</Typography>
            <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
          </Stack>

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

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h5" fontWeight="bold">
              Total
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              ${total.toFixed(2)}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Place Order Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handlePlaceOrder}
        disabled={placeOrderMutation.isPending}
        sx={{ py: 2, fontSize: '1.1rem' }}
      >
        {placeOrderMutation.isPending ? (
          <>
            <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
            Placing Order...
          </>
        ) : (
          'Place Order'
        )}
      </Button>

      {/* Error Alert */}
      {placeOrderMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {placeOrderMutation.error instanceof Error
            ? placeOrderMutation.error.message
            : 'Failed to place order. Please try again.'}
        </Alert>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Your Order</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to place this order?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} • Total: ${total.toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmOrder} variant="contained" autoFocus>
            Confirm Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleSuccessClose}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Order Placed Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your order number is
          </Typography>
          <Typography variant="h3" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
            #{orderNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We'll notify you when your order is ready
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={handleSuccessClose} variant="contained" size="large">
            Track My Order
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
