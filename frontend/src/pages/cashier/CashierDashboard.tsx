import { Box, Typography } from '@mui/material';

export default function CashierDashboard() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Cashier Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Process payments and manage bills.
      </Typography>
    </Box>
  );
}
