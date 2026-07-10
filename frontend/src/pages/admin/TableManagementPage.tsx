import { Box, Typography } from '@mui/material';

export default function TableManagementPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Table Management
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage restaurant tables and QR codes.
      </Typography>
    </Box>
  );
}
