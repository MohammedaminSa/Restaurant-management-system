import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Person as PersonIcon, Phone as PhoneIcon } from '@mui/icons-material';

interface CustomerInfoFormProps {
  onSubmit: (name: string, phone: string) => void;
  loading?: boolean;
}

export default function CustomerInfoForm({ onSubmit, loading = false }: CustomerInfoFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({ name: '', phone: '' });

  const validate = () => {
    const newErrors = { name: '', phone: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    if (phone && !/^[+]?[\d\s-()]+$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(name.trim(), phone.trim());
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <PersonIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Welcome!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please provide your details to start ordering
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
          disabled={loading}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
        />

        <TextField
          fullWidth
          label="Phone Number (Optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={!!errors.phone}
          helperText={errors.phone || 'We\'ll use this to notify you when your order is ready'}
          disabled={loading}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Starting Session...
            </>
          ) : (
            'Start Ordering'
          )}
        </Button>
      </form>
    </Paper>
  );
}
