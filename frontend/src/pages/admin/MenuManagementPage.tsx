import { Box, Typography } from '@mui/material';

export default function MenuManagementPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Menu Management
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage menu items and categories.
      </Typography>
    </Box>
  );
}
