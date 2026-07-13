import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  TableRestaurant as TableIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getMenuItems, getTables, getUsers } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import DashboardHeader from '../../components/DashboardHeader';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { modernColors, modernBorderRadius, modernShadows, modernSpacing } from '../../theme/designSystem';

const COLORS = [modernColors.success.main, modernColors.error.main];

export default function AdminDashboard() {
  const { user } = useAuth();

  // Fetch summary data
  const { data: menuItemsData } = useQuery({
    queryKey: ['menu-items-summary', user?.restaurant_id],
    queryFn: () => getMenuItems({ restaurantId: user?.restaurant_id }),
  });

  const { data: tablesData } = useQuery({
    queryKey: ['tables-summary', user?.restaurant_id],
    queryFn: () => getTables(user?.restaurant_id),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-summary', user?.restaurant_id],
    queryFn: () => getUsers({ restaurantId: user?.restaurant_id }),
  });

  const menuItems = menuItemsData?.data || [];
  const tables = tablesData?.data || [];
  const users = usersData?.data || [];

  // Statistics
  const availableTables = tables.filter((t: any) => t.status === 'available').length;
  const occupiedTables = tables.filter((t: any) => t.status === 'occupied').length;
  const activeUsers = users.filter((u: any) => u.is_active).length;
  const availableItems = menuItems.filter((i: any) => i.is_available).length;

  // Chart data
  const tableStatusData = [
    { name: 'Available', value: availableTables },
    { name: 'Occupied', value: occupiedTables },
    { name: 'Reserved', value: tables.filter((t: any) => t.status === 'reserved').length },
  ];

  const userRoleData = [
    { name: 'Kitchen', value: users.filter((u: any) => u.role === 'kitchen_staff').length },
    { name: 'Waiter', value: users.filter((u: any) => u.role === 'waiter').length },
    { name: 'Cashier', value: users.filter((u: any) => u.role === 'cashier').length },
    { name: 'Admin', value: users.filter((u: any) => u.role.includes('admin')).length },
  ];

  const menuAvailabilityData = [
    { name: 'Available', value: availableItems },
    { name: 'Unavailable', value: menuItems.length - availableItems },
  ];

  const weeklyOrdersData = [
    { day: 'Mon', orders: 45 },
    { day: 'Tue', orders: 52 },
    { day: 'Wed', orders: 48 },
    { day: 'Thu', orders: 61 },
    { day: 'Fri', orders: 75 },
    { day: 'Sat', orders: 82 },
    { day: 'Sun', orders: 68 },
  ];

  return (
    <AdminLayout>
      <DashboardHeader 
        title="Dashboard Overview"
        subtitle="Monitor your restaurant operations in real-time"
      />
      
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        {/* Content with top margin to account for fixed header */}
        <Box sx={{ pt: '110px' }}>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4, px: 3, pr: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: '#fff',
              borderRadius: modernBorderRadius.lg,
              border: `1px solid ${modernColors.neutral[200]}`,
              boxShadow: modernShadows.sm,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: modernShadows.md,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: modernBorderRadius.md,
                      bgcolor: modernColors.success[50],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RestaurantIcon sx={{ fontSize: 24, color: modernColors.success.main }} />
                  </Box>
                  <Typography variant="h3" fontWeight="700" sx={{ color: modernColors.neutral[900] }}>
                    {menuItems.length}
                  </Typography>
                </Stack>
                <Box>
                  <Typography variant="body2" fontWeight="500" sx={{ color: modernColors.neutral[600], mb: 0.5 }}>
                    Menu Items
                  </Typography>
                  <Typography variant="caption" sx={{ color: modernColors.success.main, fontWeight: 600 }}>
                    {availableItems} available
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: '#fff',
              borderRadius: modernBorderRadius.lg,
              border: `1px solid ${modernColors.neutral[200]}`,
              boxShadow: modernShadows.sm,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: modernShadows.md,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: modernBorderRadius.md,
                      bgcolor: modernColors.info[50],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TableIcon sx={{ fontSize: 24, color: modernColors.info.main }} />
                  </Box>
                  <Typography variant="h3" fontWeight="700" sx={{ color: modernColors.neutral[900] }}>
                    {tables.length}
                  </Typography>
                </Stack>
                <Box>
                  <Typography variant="body2" fontWeight="500" sx={{ color: modernColors.neutral[600], mb: 0.5 }}>
                    Total Tables
                  </Typography>
                  <Typography variant="caption" sx={{ color: modernColors.info.main, fontWeight: 600 }}>
                    {availableTables} available
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: '#fff',
              borderRadius: modernBorderRadius.lg,
              border: `1px solid ${modernColors.neutral[200]}`,
              boxShadow: modernShadows.sm,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: modernShadows.md,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: modernBorderRadius.md,
                      bgcolor: modernColors.warning[50],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 24, color: modernColors.warning.main }} />
                  </Box>
                  <Typography variant="h3" fontWeight="700" sx={{ color: modernColors.neutral[900] }}>
                    {users.length}
                  </Typography>
                </Stack>
                <Box>
                  <Typography variant="body2" fontWeight="500" sx={{ color: modernColors.neutral[600], mb: 0.5 }}>
                    Staff Members
                  </Typography>
                  <Typography variant="caption" sx={{ color: modernColors.warning.main, fontWeight: 600 }}>
                    {activeUsers} active
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              bgcolor: '#fff',
              borderRadius: modernBorderRadius.lg,
              border: `1px solid ${modernColors.neutral[200]}`,
              boxShadow: modernShadows.sm,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: modernShadows.md,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: modernBorderRadius.md,
                      bgcolor: modernColors.error[50],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 24, color: modernColors.error.main }} />
                  </Box>
                  <Typography variant="h3" fontWeight="700" sx={{ color: modernColors.neutral[900] }}>
                    {occupiedTables}
                  </Typography>
                </Stack>
                <Box>
                  <Typography variant="body2" fontWeight="500" sx={{ color: modernColors.neutral[600], mb: 0.5 }}>
                    Occupied Tables
                  </Typography>
                  <Typography variant="caption" sx={{ color: modernColors.error.main, fontWeight: 600 }}>
                    Currently dining
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ px: 3, pb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: modernBorderRadius.lg,
              border: `1px solid ${modernColors.neutral[200]}`,
              boxShadow: modernShadows.sm,
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: modernColors.neutral[900] }}>
              Weekly Orders Trend
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" stroke={modernColors.neutral[200]} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke={modernColors.neutral[600]} />
                <YAxis tick={{ fontSize: 12 }} stroke={modernColors.neutral[600]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke={modernColors.primary.main}
                  strokeWidth={3}
                  dot={{ fill: modernColors.primary.main, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: modernBorderRadius.lg,
              border: `1px solid ${modernColors.neutral[200]}`,
              boxShadow: modernShadows.sm,
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: modernColors.neutral[900] }}>
              Table Status
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={tableStatusData} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  dataKey="value" 
                  label
                >
                  <Cell fill={modernColors.success.main} />
                  <Cell fill={modernColors.warning.main} />
                  <Cell fill={modernColors.info.main} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: modernBorderRadius.lg,
              border: `1px solid ${modernColors.neutral[200]}`,
              boxShadow: modernShadows.sm,
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: modernColors.neutral[900] }}>
              Staff Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userRoleData}>
                <CartesianGrid strokeDasharray="3 3" stroke={modernColors.neutral[200]} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={modernColors.neutral[600]} />
                <YAxis tick={{ fontSize: 12 }} stroke={modernColors.neutral[600]} />
                <Tooltip />
                <Bar dataKey="value" fill={modernColors.primary.main} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: modernBorderRadius.lg,
              border: `1px solid ${modernColors.neutral[200]}`,
              boxShadow: modernShadows.sm,
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: modernColors.neutral[900] }}>
              Menu Availability
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={menuAvailabilityData} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={70} 
                  dataKey="value" 
                  label
                >
                  {menuAvailabilityData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
        </Box>
      </Box>
    </AdminLayout>
  );
}
