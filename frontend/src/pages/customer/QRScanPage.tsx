import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  TableBar as TableBarIcon,
  People as PeopleIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomerInfoForm from '../../components/CustomerInfoForm';
import { getTableByQRCode, createSession, CreateSessionRequest } from '../../services/api';
import { useSession } from '../../contexts/SessionContext';

export default function QRScanPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const { setSession } = useSession();
  const [showForm, setShowForm] = useState(false);

  // Fetch table information
  const {
    data: tableData,
    isLoading: loadingTable,
    error: tableError,
  } = useQuery({
    queryKey: ['table', qrCode],
    queryFn: () => getTableByQRCode(qrCode!),
    enabled: !!qrCode,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: CreateSessionRequest) => createSession(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Store session token
        const sessionDetail = {
          id: response.data.session_id,
          restaurant_id: response.data.restaurant_id,
          table_id: response.data.table_id,
          session_token: response.data.session_token,
          customer_name: response.data.customer_name,
          status: response.data.status,
          started_at: response.data.started_at,
          table_number: tableData?.data?.table_number || '',
          capacity: tableData?.data?.capacity || 0,
          location: tableData?.data?.location || '',
          restaurant_name: tableData?.data?.restaurant_name || '',
          restaurant_logo: tableData?.data?.restaurant_logo,
          tax_rate: tableData?.data?.tax_rate || 0,
          service_charge_rate: tableData?.data?.service_charge_rate || 0,
          currency: 'USD',
          orders: [],
        };

        setSession(response.data.session_token, sessionDetail);
        
        // Redirect to menu
        navigate('/menu');
      }
    },
  });

  // Show form after table is loaded
  useEffect(() => {
    if (tableData?.success) {
      setShowForm(true);
    }
  }, [tableData]);

  const handleCustomerInfoSubmit = (name: string, phone: string) => {
    if (tableData?.data) {
      createSessionMutation.mutate({
        table_id: tableData.data.id,
        customer_name: name,
        customer_phone: phone || undefined,
      });
    }
  };

  // Loading state
  if (loadingTable) {
    return <LoadingSpinner message="Loading table information..." />;
  }

  // Error state
  if (tableError || !tableData?.success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Invalid QR Code
          </Typography>
          <Typography variant="body2">
            The QR code you scanned is invalid or has expired. Please scan a valid table QR code.
          </Typography>
        </Alert>
      </Container>
    );
  }

  const table = tableData.data;

  // Check if table is available
  if (table.status !== 'available') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Table Not Available
          </Typography>
          <Typography variant="body2">
            This table is currently {table.status}. Please contact a waiter for assistance.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Restaurant Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        {table.restaurant_logo && (
          <Box
            component="img"
            src={table.restaurant_logo}
            alt={table.restaurant_name}
            sx={{ height: 80, mb: 2 }}
          />
        )}
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RestaurantIcon sx={{ mr: 1, fontSize: 32 }} />
          {table.restaurant_name}
        </Typography>
      </Box>

      {/* Table Information Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Table Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TableBarIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Table Number
              </Typography>
              <Typography variant="h6">
                {table.table_number}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PeopleIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Capacity
              </Typography>
              <Typography variant="body1">
                Up to {table.capacity} guests
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOnIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body1">
                {table.location}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Tax: ${table.tax_rate}%`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Service Charge: ${table.service_charge_rate}%`}
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Customer Info Form */}
      {showForm && (
        <CustomerInfoForm
          onSubmit={handleCustomerInfoSubmit}
          loading={createSessionMutation.isPending}
        />
      )}

      {/* Error Message */}
      {createSessionMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to create session. Please try again.
        </Alert>
      )}
    </Container>
  );
}
