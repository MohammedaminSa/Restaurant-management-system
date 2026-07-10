import { Box, Typography } from '@mui/material';

export default function UserManagementPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage staff users and permissions.
      </Typography>
    </Box>
  );
}
