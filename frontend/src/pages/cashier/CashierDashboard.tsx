import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  TableRestaurant as TableIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveSessions, getSessionBill, recordPayment } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function CashierDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [bill, setBill] = useState<any>(null);
  
  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital_wallet'>('cash');
  const [tipAmount, setTipAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Fetch active sessions
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['active-sessions', user?.restaurant_id],
    queryFn: () => getActiveSessions(user?.restaurant_id),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      setPaymentDialogOpen(false);
      setBillDialogOpen(false);
      resetPaymentForm();
      alert('Payment recorded successfully!');
    },
  });

  const sessions = sessionsData?.data || [];

  const handleViewBill = async (session: any) => {
    setSelectedSession(session);
    try {
      const response = await getSessionBill(session.session_token);
      if (response.success) {
        setBill(response.data);
        setBillDialogOpen(true);
      }
    } catch (error) {
      alert('Failed to load bill');
    }
  };

  const handleOpenPaymentDialog = () => {
    setBillDialogOpen(false);
    setPaymentDialogOpen(true);
  };

  const resetPaymentForm = () => {
    setPaymentMethod('cash');
    setTipAmount('');
    setPaymentNotes('');
    setPaymentError('');
  };

  const handleRecordPayment = () => {
    setPaymentError('');

    if (!bill) return;

    const tip = tipAmount ? parseFloat(tipAmount) : 0;
    if (tipAmount && (isNaN(tip) || tip < 0)) {
      setPaymentError('Invalid tip amount');
      return;
    }

    recordPaymentMutation.mutate({
      session_token: selectedSession.session_token,
      amount: bill.total_amount,
      payment_method: paymentMethod,
      tip_amount: tip,
      notes: paymentNotes || undefined,
    });
  };

  const getSessionDuration = (startedAt: string): string => {
    const minutes = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const SessionCard = ({ session }: { session: any }) => {
    return (
      <Card>
        <CardContent>
          {/* Session Header */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <TableIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                Table {session.table_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {session.customer_name}
              </Typography>
              {session.customer_phone && (
                <Typography variant="caption" color="text.secondary">
                  {session.customer_phone}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip label="Active" color="success" size="small" sx={{ mb: 0.5 }} />
              <Typography variant="caption" display="block">
                {getSessionDuration(session.started_at)}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Session Info */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Orders:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {session.order_count || 0}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Unpaid Bill:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                ${parseFloat(session.total_bill || 0).toFixed(2)}
              </Typography>
            </Stack>
          </Stack>

          {/* View Bill Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleViewBill(session)}
            startIcon={<ReceiptIcon />}
          >
            View Bill & Process Payment
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading cashier dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Cashier Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage payments and bills
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" fontWeight="bold">
            {sessions.length} Active Sessions
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total: ${sessions.reduce((sum, s) => sum + parseFloat(s.total_bill || 0), 0).toFixed(2)}
          </Typography>
        </Box>
      </Stack>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h4" fontWeight="bold">
              {sessions.length}
            </Typography>
            <Typography variant="body2">Active Sessions</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
            <Typography variant="h4" fontWeight="bold">
              ${sessions.reduce((sum, s) => sum + parseFloat(s.total_bill || 0), 0).toFixed(2)}
            </Typography>
            <Typography variant="body2">Unpaid Bills</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
            <Typography variant="h4" fontWeight="bold">
              {sessions.reduce((sum, s) => sum + (s.order_count || 0), 0)}
            </Typography>
            <Typography variant="body2">Total Orders</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Active Sessions Grid */}
      {sessions.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <PaymentIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h5" color="text.secondary">
            No active sessions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sessions will appear here when customers are dining
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sessions.map((session) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={session.id}>
              <SessionCard session={session} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Bill Dialog */}
      <Dialog open={billDialogOpen} onClose={() => setBillDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight="bold">
              Bill Details
            </Typography>
            {bill && (
              <Chip label={`Table ${bill.table_number}`} color="primary" />
            )}
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {bill ? (
            <>
              {/* Customer Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Customer:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {bill.customer_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Session started: {new Date(bill.session_started_at).toLocaleString()}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Orders */}
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Orders:
              </Typography>
              <List disablePadding>
                {bill.orders?.map((order: any) => (
                  <Box key={order.id} sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Order #{order.order_number}
                    </Typography>
                    {order.items?.map((item: any) => (
                      <ListItem key={item.id} disableGutters>
                        <ListItemText
                          primary={`${item.quantity}x ${item.menu_item_name}`}
                          secondary={
                            item.selected_variants &&
                            Object.keys(item.selected_variants).length > 0 &&
                            Object.values(item.selected_variants)
                              .map((v: any) => v.option_name)
                              .join(', ')
                          }
                        />
                        <Typography variant="body2">
                          ${parseFloat(item.total_price).toFixed(2)}
                        </Typography>
                      </ListItem>
                    ))}
                  </Box>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              {/* Totals */}
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">${bill.subtotal.toFixed(2)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tax:
                  </Typography>
                  <Typography variant="body2">${bill.tax_amount.toFixed(2)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Service Charge:
                  </Typography>
                  <Typography variant="body2">${bill.service_charge.toFixed(2)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold">
                    Total:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${bill.total_amount.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBillDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleOpenPaymentDialog} startIcon={<PaymentIcon />}>
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent dividers>
          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentError}
            </Alert>
          )}

          {bill && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Total to Pay: ${bill.total_amount.toFixed(2)}
              </Typography>
            </Box>
          )}

          <Stack spacing={3}>
            {/* Payment Method */}
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                label="Payment Method"
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="digital_wallet">Digital Wallet</MenuItem>
              </Select>
            </FormControl>

            {/* Tip Amount */}
            <TextField
              fullWidth
              label="Tip Amount (Optional)"
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="0.00"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />

            {/* Total with Tip */}
            {bill && tipAmount && !isNaN(parseFloat(tipAmount)) && (
              <Alert severity="info">
                <Typography variant="subtitle2">
                  Total with Tip: ${(bill.total_amount + parseFloat(tipAmount)).toFixed(2)}
                </Typography>
              </Alert>
            )}

            {/* Notes */}
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRecordPayment}
            disabled={recordPaymentMutation.isPending}
            startIcon={<CheckCircleIcon />}
          >
            {recordPaymentMutation.isPending ? 'Processing...' : 'Complete Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
