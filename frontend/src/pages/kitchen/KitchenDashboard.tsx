import { Box, Typography } from '@mui/material';

export default function KitchenDashboard() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Kitchen Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage orders from the kitchen.
      </Typography>
    </Box>
  );
}
