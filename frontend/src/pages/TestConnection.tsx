import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Chip,
  Stack,
} from '@mui/material';


import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

import { Refresh as RefreshIcon } from '@mui/icons-material';
import { getCategories, getMenuItems } from '../services/api';

export default function TestConnection() {
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});

  const testConnections = async () => {
    setLoading(true);
    setErrors({});
    const newErrors: any = {};

    // Test 1: Backend Health Check
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      newErrors.health = 'Backend server is not running on port 5000';
    }

    // Test 2: Get Categories
    try {
      const result = await getCategories();
      if (result.success) {
        setCategories(result.data || []);
      } else {
        newErrors.categories = 'API returned success: false';
      }
    } catch (error: any) {
      newErrors.categories = error.message || 'Failed to fetch categories';
    }

    // Test 3: Get Menu Items
    try {
      const result = await getMenuItems({ page: 1, pageSize: 10 });
      if (result.success) {
        setMenuItems(result.data || []);
      } else {
        newErrors.menuItems = 'API returned success: false';
      }
    } catch (error: any) {
      newErrors.menuItems = error.message || 'Failed to fetch menu items';
    }

    setErrors(newErrors);
    setLoading(false);
  };

  useEffect(() => {
    testConnections();
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          🔌 Backend Connection Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Testing frontend-backend connectivity
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={testConnections}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          Refresh Tests
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Testing connections...
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Test 1: Health Check */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {errors.health ? (
                <ErrorIcon color="error" sx={{ mr: 1, fontSize: 32 }} />
              ) : (
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 32 }} />
              )}
              <Typography variant="h5">
                Test 1: Backend Health Check
              </Typography>
            </Box>

            {errors.health ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.health}
                <br />
                <strong>Solution:</strong> Run <code>cd backend && npm run dev</code>
              </Alert>
            ) : (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Backend is running! ✅
                </Alert>
                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" component="pre">
                    {JSON.stringify(healthStatus, null, 2)}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>

          {/* Test 2: Categories API */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {errors.categories ? (
                <ErrorIcon color="error" sx={{ mr: 1, fontSize: 32 }} />
              ) : (
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 32 }} />
              )}
              <Typography variant="h5">
                Test 2: Menu Categories API
              </Typography>
            </Box>

            {errors.categories ? (
              <Alert severity="error">
                {errors.categories}
                <br />
                <strong>Endpoint:</strong> GET /api/v1/menu/categories
              </Alert>
            ) : (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Successfully fetched {categories.length} categories! ✅
                </Alert>
                {categories.length > 0 ? (
                  <Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {categories.map((cat) => (
                        <Chip
                          key={cat.id}
                          label={cat.name}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No categories found. Run: <code>cd backend && npm run seed</code>
                  </Alert>
                )}
              </>
            )}
          </Paper>

          {/* Test 3: Menu Items API */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {errors.menuItems ? (
                <ErrorIcon color="error" sx={{ mr: 1, fontSize: 32 }} />
              ) : (
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 32 }} />
              )}
              <Typography variant="h5">
                Test 3: Menu Items API
              </Typography>
            </Box>

            {errors.menuItems ? (
              <Alert severity="error">
                {errors.menuItems}
                <br />
                <strong>Endpoint:</strong> GET /api/v1/menu/items
              </Alert>
            ) : (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Successfully fetched {menuItems.length} menu items! ✅
                </Alert>
                {menuItems.length > 0 ? (
                  <Box>
                    {menuItems.slice(0, 5).map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          p: 2,
                          mb: 1,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          borderLeft: 3,
                          borderColor: item.is_available ? 'success.main' : 'error.main',
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${parseFloat(item.base_price).toFixed(2)} •{' '}
                          {item.is_available ? '✅ Available' : '❌ Unavailable'}
                        </Typography>
                      </Box>
                    ))}
                    {menuItems.length > 5 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        ... and {menuItems.length - 5} more items
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No menu items found. Run: <code>cd backend && npm run seed</code>
                  </Alert>
                )}
              </>
            )}
          </Paper>

          {/* Summary */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              bgcolor: hasErrors ? 'error.light' : 'success.light',
              borderLeft: 6,
              borderColor: hasErrors ? 'error.main' : 'success.main',
            }}
          >
            <Typography variant="h5" gutterBottom>
              {hasErrors ? '❌ Connection Issues Detected' : '✅ All Tests Passed!'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            {hasErrors ? (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Issues found:</strong>
                </Typography>
                <ul>
                  {Object.keys(errors).map((key) => (
                    <li key={key}>
                      <Typography variant="body2">{errors[key]}</Typography>
                    </li>
                  ))}
                </ul>

                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>To fix:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  1. Make sure backend is running:
                  <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 1, mt: 1, mb: 1 }}>
                    <code>cd backend && npm run dev</code>
                  </Box>
                  2. Seed the database if empty:
                  <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 1, mt: 1 }}>
                    <code>cd backend && npm run seed</code>
                  </Box>
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1">
                  Your frontend is successfully communicating with the backend! 🎉
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Backend: <code>http://localhost:5000</code>
                  <br />
                  Frontend: <code>http://localhost:5173</code>
                </Typography>
              </Box>
            )}
          </Paper>
        </Stack>
      )}
    </Container>
  );
}
