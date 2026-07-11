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
  Chip,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import {
  TableRestaurant as TableIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RoomService as RoomServiceIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWaiterTables, getWaiterOrders, serveOrder } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const tableStatusColors = {
  available: 'success',
  occupied: 'warning',
  reserved: 'info',
  maintenance: 'error',
} as const;

const orderStatusColors = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
  served: 'default',
} as const;

export default function WaiterDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedView, setSelectedView] = useState<'tables' | 'orders'>('tables');
  const [tableFilter, setTableFilter] = useState('all');

  // Fetch tables
  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['waiter-tables', user?.restaurant_id],
    queryFn: () => getWaiterTables(user?.restaurant_id),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['waiter-orders', user?.restaurant_id],
    queryFn: () => getWaiterOrders(user?.restaurant_id),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Serve order mutation
  const serveOrderMutation = useMutation({
    mutationFn: (orderId: string) => serveOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-orders'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-tables'] });
    },
  });

  const tables = tablesData?.data || [];
  const orders = ordersData?.data || [];

  // Filter tables
  const filteredTables =
    tableFilter === 'all' ? tables : tables.filter((t) => t.status === tableFilter);

  // Filter orders - only show ready orders for serving
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const activeOrders = orders.filter((o) => o.status !== 'served' && o.status !== 'cancelled');

  // Statistics
  const availableTables = tables.filter((t) => t.status === 'available').length;
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const reservedTables = tables.filter((t) => t.status === 'reserved').length;

  const handleServeOrder = (orderId: string) => {
    serveOrderMutation.mutate(orderId);
  };

  const getSessionDuration = (startedAt?: string): string => {
    if (!startedAt) return '';
    const minutes = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const TableCard = ({ table }: { table: any }) => {
    const statusColor = tableStatusColors[table.status as keyof typeof tableStatusColors];
    const hasReadyOrders = readyOrders.some((o) => o.table_number === table.table_number);

    return (
      <Card
        sx={{
          border: hasReadyOrders ? 2 : 1,
          borderColor: hasReadyOrders ? 'success.main' : 'divider',
          position: 'relative',
        }}
      >
        <CardContent>
          {/* Ready Badge */}
          {hasReadyOrders && (
            <Chip
              label="Order Ready!"
              color="success"
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
          )}

          {/* Table Header */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <TableIcon sx={{ fontSize: 40, color: `${statusColor}.main` }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Table {table.table_number}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {table.location}
              </Typography>
            </Box>
          </Stack>

          {/* Status Chip */}
          <Chip
            label={table.status.toUpperCase()}
            color={statusColor}
            size="small"
            sx={{ mb: 2 }}
          />

          {/* Capacity */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2">
              Capacity: {table.capacity} guests
            </Typography>
          </Stack>

          {/* Session Info (if occupied) */}
          {table.status === 'occupied' && table.customer_name && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Current Session:
              </Typography>
              <Typography variant="body2">{table.customer_name}</Typography>
              {table.customer_phone && (
                <Typography variant="caption" color="text.secondary">
                  {table.customer_phone}
                </Typography>
              )}
              {table.session_started_at && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Duration: {getSessionDuration(table.session_started_at)}
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const OrderCard = ({ order }: { order: any }) => {
    const statusColor = orderStatusColors[order.status as keyof typeof orderStatusColors];

    return (
      <Card>
        <CardContent>
          {/* Order Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Order #{order.order_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Table {order.table_number || 'N/A'}
              </Typography>
            </Box>
            <Chip label={order.status.toUpperCase()} color={statusColor} />
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Order Items */}
          <List disablePadding>
            {order.items.slice(0, 3).map((item: any, index: number) => (
              <ListItem key={item.id || index} sx={{ px: 0, py: 0.5 }}>
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
              </ListItem>
            ))}
            {order.items.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                + {order.items.length - 3} more items
              </Typography>
            )}
          </List>

          {/* Time Info */}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Ordered: {new Date(order.created_at).toLocaleTimeString()}
          </Typography>

          {/* Serve Button */}
          {order.status === 'ready' && (
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={() => handleServeOrder(order.id)}
              disabled={serveOrderMutation.isPending}
              sx={{ mt: 2 }}
              startIcon={<CheckCircleIcon />}
            >
              Mark as Served
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (tablesLoading || ordersLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading waiter dashboard...
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
            Waiter Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage tables and serve orders
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Badge badgeContent={readyOrders.length} color="success">
            <RoomServiceIcon sx={{ fontSize: 40 }} />
          </Badge>
          <Typography variant="caption" display="block">
            {readyOrders.length} ready to serve
          </Typography>
        </Box>
      </Stack>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
            <Typography variant="h4" fontWeight="bold">
              {availableTables}
            </Typography>
            <Typography variant="body2">Available Tables</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: 'warning.light' }}>
            <Typography variant="h4" fontWeight="bold">
              {occupiedTables}
            </Typography>
            <Typography variant="body2">Occupied Tables</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
            <Typography variant="h4" fontWeight="bold">
              {activeOrders.length}
            </Typography>
            <Typography variant="body2">Active Orders</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Ready Orders Alert */}
      {readyOrders.length > 0 && (
        <Alert severity="success" icon={<RoomServiceIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {readyOrders.length} {readyOrders.length === 1 ? 'order is' : 'orders are'} ready to be
            served!
          </Typography>
          <Typography variant="body2">
            Check the "Orders" tab to mark them as served
          </Typography>
        </Alert>
      )}

      {/* View Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedView} onChange={(e, val) => setSelectedView(val)} variant="fullWidth">
          <Tab label={`Tables (${tables.length})`} value="tables" icon={<TableIcon />} />
          <Tab
            label={`Orders (${activeOrders.length})`}
            value="orders"
            icon={
              <Badge badgeContent={readyOrders.length} color="success">
                <ScheduleIcon />
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Tables View */}
      {selectedView === 'tables' && (
        <>
          {/* Table Status Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label="All"
                onClick={() => setTableFilter('all')}
                color={tableFilter === 'all' ? 'primary' : 'default'}
              />
              <Chip
                label="Available"
                onClick={() => setTableFilter('available')}
                color={tableFilter === 'available' ? 'success' : 'default'}
              />
              <Chip
                label="Occupied"
                onClick={() => setTableFilter('occupied')}
                color={tableFilter === 'occupied' ? 'warning' : 'default'}
              />
              <Chip
                label="Reserved"
                onClick={() => setTableFilter('reserved')}
                color={tableFilter === 'reserved' ? 'info' : 'default'}
              />
            </Stack>
          </Paper>

          {/* Tables Grid */}
          <Grid container spacing={3}>
            {filteredTables.map((table) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
                <TableCard table={table} />
              </Grid>
            ))}
          </Grid>

          {filteredTables.length === 0 && (
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <TableIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                No tables in this status
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Orders View */}
      {selectedView === 'orders' && (
        <>
          {/* Ready Orders Section */}
          {readyOrders.length > 0 && (
            <>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Ready to Serve ({readyOrders.length})
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {readyOrders.map((order) => (
                  <Grid item xs={12} sm={6} md={4} key={order.id}>
                    <OrderCard order={order} />
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* Active Orders Section */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Active Orders ({activeOrders.length})
          </Typography>
          <Grid container spacing={2}>
            {activeOrders.map((order) => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <OrderCard order={order} />
              </Grid>
            ))}
          </Grid>

          {activeOrders.length === 0 && (
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                No active orders
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}
