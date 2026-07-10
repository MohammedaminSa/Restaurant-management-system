import { Box, Typography } from '@mui/material';

export default function WaiterDashboard() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Waiter Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage tables and orders.
      </Typography>
    </Box>
  );
}
