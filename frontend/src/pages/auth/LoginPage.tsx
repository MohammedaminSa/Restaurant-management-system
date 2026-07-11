import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/kitchen';
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);

      // Get redirect path from location state or default based on role
      const from = (location.state as any)?.from?.pathname;
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        // Default redirect based on role (will be handled after login)
        navigate('/kitchen', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <RestaurantIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Staff Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Login to access staff dashboard
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Email Field */}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={isLoading}
                placeholder="your.email@example.com"
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Login Button */}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ py: 1.5 }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </Stack>
          </form>

          {/* Demo Credentials */}
          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Demo Credentials:
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Kitchen Staff:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  kitchen@test.com / password123
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Waiter:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  waiter@test.com / password123
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cashier:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  cashier@test.com / password123
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Admin:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  admin@test.com / password123
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Back to Customer App */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="text"
              onClick={() => navigate('/')}
              disabled={isLoading}
            >
              ← Back to Customer App
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
