import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../contexts/SessionContext';
import { getSessionOrders } from '../../services/api';

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'warning' as const,
    icon: ScheduleIcon,
    description: 'Waiting for confirmation',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'info' as const,
    icon: CheckCircleIcon,
    description: 'Order confirmed',
  },
  preparing: {
    label: 'Preparing',
    color: 'primary' as const,
    icon: RestaurantIcon,
    description: 'Kitchen is preparing your order',
  },
  ready: {
    label: 'Ready',
    color: 'success' as const,
    icon: LocalShippingIcon,
    description: 'Ready to be served',
  },
  served: {
    label: 'Served',
    color: 'default' as const,
    icon: DoneAllIcon,
    description: 'Enjoy your meal!',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error' as const,
    icon: ScheduleIcon,
    description: 'Order cancelled',
  },
};

export default function OrderTrackingPage() {
  const navigate = useNavigate();
  const { sessionToken, sessionData } = useSession();

  // Fetch orders with auto-refresh every 10 seconds
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['session-orders', sessionToken],
    queryFn: () => getSessionOrders(sessionToken!),
    enabled: !!sessionToken,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  if (!sessionData || !sessionToken) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          No active session found. Please scan a QR code to start a session.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Go to Home
        </Button>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Loading your orders...
          </Typography>
          <LinearProgress />
        </Paper>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Failed to load orders'}
        </Alert>
      </Container>
    );
  }

  const orders = data?.data || [];
  const activeOrders = orders.filter((o) => o.status !== 'served' && o.status !== 'cancelled');
  const pastOrders = orders.filter((o) => o.status === 'served' || o.status === 'cancelled');

  // Calculate bill summary
  const totalBill = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          My Orders
        </Typography>
        <Button variant="contained" onClick={() => navigate('/menu')}>
          Order More
        </Button>
      </Stack>

      {/* Session Info */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <RestaurantIcon sx={{ fontSize: 40 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                Table {sessionData.table_number}
              </Typography>
              <Typography variant="body2">
                {sessionData.customer_name} • {sessionData.location}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2">Current Bill</Typography>
              <Typography variant="h5" fontWeight="bold">
                ${totalBill.toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* No Orders */}
      {orders.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <RestaurantIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No orders yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding items from the menu
          </Typography>
          <Button variant="contained" onClick={() => navigate('/menu')}>
            Browse Menu
          </Button>
        </Paper>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Active Orders
          </Typography>
          <Stack spacing={2}>
            {activeOrders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = config.icon;

              return (
                <Paper key={order.id} sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <StatusIcon color={config.color} sx={{ fontSize: 32 }} />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          Order #{order.order_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip label={config.label} color={config.color} />
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {config.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <List disablePadding>
                    {order.items.map((item) => (
                      <ListItem key={item.id} sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary={`${item.quantity}x ${item.menu_item_name}`}
                          secondary={item.special_instructions}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          ${parseFloat(item.total_price).toFixed(2)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </Typography>
                  </Stack>

                  {order.special_instructions && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        <strong>Special Instructions:</strong> {order.special_instructions}
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Past Orders
          </Typography>
          <Stack spacing={2}>
            {pastOrders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig];

              return (
                <Paper key={order.id} sx={{ p: 2, opacity: 0.7 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Order #{order.order_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Chip label={config.label} color={config.color} size="small" />
                      <Typography variant="subtitle1" fontWeight="medium">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Request Bill Button */}
      {orders.length > 0 && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Ready to leave?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Request your bill and complete your session
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                // TODO: Implement bill request functionality
                alert('Bill request functionality will be implemented in the cashier phase');
              }}
            >
              Request Bill
            </Button>
          </Stack>
        </Paper>
      )}
    </Container>
  );
}
