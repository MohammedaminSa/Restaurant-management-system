import { Box, Typography } from '@mui/material';

export default function LoginPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Staff Login
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Login to access staff dashboard.
      </Typography>
    </Box>
  );
}
