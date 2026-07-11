import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Schedule as ScheduleIcon,
  LocalFireDepartment as FireIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKitchenOrders, updateKitchenOrderStatus } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const statusColors = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
} as const;

const statusIcons = {
  pending: ScheduleIcon,
  confirmed: CheckCircleIcon,
  preparing: FireIcon,
  ready: CheckCircleIcon,
};

export default function KitchenDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('all');

  // Fetch kitchen orders with auto-refresh
  const { data, isLoading, isError } = useQuery({
    queryKey: ['kitchen-orders', selectedTab, user?.restaurant_id],
    queryFn: () =>
      getKitchenOrders({
        status: selectedTab === 'all' ? undefined : (selectedTab as any),
        restaurantId: user?.restaurant_id,
      }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateKitchenOrderStatus(orderId, status),
    onSuccess: () => {
      // Refetch kitchen orders
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    },
  });

  const orders = data?.data || [];

  // Filter orders by tab
  const filteredOrders = selectedTab === 'all' 
    ? orders 
    : orders.filter((o) => o.status === selectedTab);

  // Group orders by status for the "all" tab
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const handleStartPreparing = (orderId: string) => {
    updateStatusMutation.mutate({ orderId, status: 'preparing' });
  };

  const handleMarkReady = (orderId: string) => {
    updateStatusMutation.mutate({ orderId, status: 'ready' });
  };

  const getTimeSinceOrder = (createdAt: string): string => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  const OrderCard = ({ order }: { order: any }) => {
    const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
    const timeSince = getTimeSinceOrder(order.created_at);
    const isUrgent = new Date().getTime() - new Date(order.created_at).getTime() > 15 * 60 * 1000; // > 15 mins

    return (
      <Card
        sx={{
          border: isUrgent ? 2 : 1,
          borderColor: isUrgent ? 'error.main' : 'divider',
          boxShadow: isUrgent ? 3 : 1,
        }}
      >
        <CardContent>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <StatusIcon
                  color={statusColors[order.status as keyof typeof statusColors]}
                  sx={{ fontSize: 28 }}
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Order #{order.order_number}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Table {order.table_number || 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={order.status.toUpperCase()}
                color={statusColors[order.status as keyof typeof statusColors]}
                size="small"
                sx={{ mb: 0.5 }}
              />
              <Typography
                variant="caption"
                display="block"
                color={isUrgent ? 'error' : 'text.secondary'}
                fontWeight={isUrgent ? 'bold' : 'normal'}
              >
                {timeSince}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Order Items */}
          <List disablePadding>
            {order.items.map((item: any) => (
              <ListItem key={item.id} sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="medium">
                      {item.quantity}x {item.menu_item_name}
                    </Typography>
                  }
                  secondary={
                    <>
                      {item.selected_variants && Object.keys(item.selected_variants).length > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {Object.entries(item.selected_variants).map(([key, val]: [string, any]) => (
                            <span key={key}>• {val.option_name} </span>
                          ))}
                        </Typography>
                      )}
                      {item.special_instructions && (
                        <Typography variant="caption" color="primary" display="block" sx={{ fontStyle: 'italic' }}>
                          Note: {item.special_instructions}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>

          {/* Special Instructions */}
          {order.special_instructions && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Order Note:</strong> {order.special_instructions}
              </Typography>
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 2 }}>
            {order.status === 'pending' && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleStartPreparing(order.id)}
                disabled={updateStatusMutation.isPending}
              >
                Start Preparing
              </Button>
            )}

            {order.status === 'confirmed' && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleStartPreparing(order.id)}
                disabled={updateStatusMutation.isPending}
              >
                Start Preparing
              </Button>
            )}

            {order.status === 'preparing' && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={() => handleMarkReady(order.id)}
                disabled={updateStatusMutation.isPending}
              >
                Mark as Ready
              </Button>
            )}

            {order.status === 'ready' && (
              <Chip label="Waiting for Server" color="success" sx={{ width: '100%' }} />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading kitchen orders...
        </Typography>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load kitchen orders</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Kitchen Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage incoming orders and prepare food
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" fontWeight="bold">
            {orders.length} Active Orders
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Auto-refreshing every 5 seconds
          </Typography>
        </Box>
      </Stack>

      {/* Status Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'warning.light' }}>
            <Typography variant="h4" fontWeight="bold">
              {pendingOrders.length}
            </Typography>
            <Typography variant="body2">Pending</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
            <Typography variant="h4" fontWeight="bold">
              {confirmedOrders.length}
            </Typography>
            <Typography variant="body2">Confirmed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h4" fontWeight="bold">
              {preparingOrders.length}
            </Typography>
            <Typography variant="body2">Preparing</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
            <Typography variant="h4" fontWeight="bold">
              {readyOrders.length}
            </Typography>
            <Typography variant="body2">Ready</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Status Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, val) => setSelectedTab(val)}
          variant="fullWidth"
        >
          <Tab label={`All (${orders.length})`} value="all" />
          <Tab label={`Pending (${pendingOrders.length})`} value="pending" />
          <Tab label={`Confirmed (${confirmedOrders.length})`} value="confirmed" />
          <Tab label={`Preparing (${preparingOrders.length})`} value="preparing" />
          <Tab label={`Ready (${readyOrders.length})`} value="ready" />
        </Tabs>
      </Paper>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <RestaurantIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h5" color="text.secondary">
            No orders in this status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orders will appear here when customers place them
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} md={6} lg={4} key={order.id}>
              <OrderCard order={order} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
