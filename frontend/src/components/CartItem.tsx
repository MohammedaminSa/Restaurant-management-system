import {
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import type { CartItem as CartItemType } from '../stores/cartStore';
import { useCartStore } from '../stores/cartStore';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, updateInstructions } = useCartStore();
  const [instructions, setInstructions] = useState(item.specialInstructions || '');
  const [showInstructions, setShowInstructions] = useState(false);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleInstructionsBlur = () => {
    if (instructions !== item.specialInstructions) {
      updateInstructions(item.id, instructions);
    }
  };

  const unitPrice = parseFloat(item.menuItem.base_price) +
    item.selectedVariants.reduce((sum, v) => sum + v.price_modifier, 0);

  return (
    <Box
      sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'grey.50',
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* Item Image */}
        {item.menuItem.image_url && (
          <Box
            component="img"
            src={item.menuItem.image_url}
            alt={item.menuItem.name}
            sx={{
              width: 60,
              height: 60,
              borderRadius: 1,
              objectFit: 'cover',
            }}
          />
        )}

        {/* Item Details */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight="bold" noWrap>
            {item.menuItem.name}
          </Typography>

          {/* Selected Variants */}
          {item.selectedVariants.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
              {item.selectedVariants.map((variant, index) => (
                <Chip
                  key={index}
                  label={`${variant.variant_name}: ${variant.option_name}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
            </Stack>
          )}

          {/* Unit Price */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ${unitPrice.toFixed(2)} each
          </Typography>

          {/* Special Instructions */}
          {showInstructions ? (
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Add special instructions..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              onBlur={handleInstructionsBlur}
              sx={{ mt: 1 }}
            />
          ) : item.specialInstructions ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: 'block',
                fontStyle: 'italic',
                cursor: 'pointer',
              }}
              onClick={() => setShowInstructions(true)}
            >
              Note: {item.specialInstructions}
            </Typography>
          ) : (
            <Typography
              variant="caption"
              color="primary"
              sx={{
                mt: 0.5,
                display: 'block',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
              onClick={() => setShowInstructions(true)}
            >
              + Add instructions
            </Typography>
          )}
        </Box>

        {/* Quantity Controls & Price */}
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            ${item.itemTotal.toFixed(2)}
          </Typography>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(-1)}
              sx={{ bgcolor: 'grey.100' }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>

            <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 24, textAlign: 'center' }}>
              {item.quantity}
            </Typography>

            <IconButton
              size="small"
              onClick={() => handleQuantityChange(1)}
              sx={{ bgcolor: 'grey.100' }}
            >
              <AddIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => removeItem(item.id)}
              color="error"
              sx={{ ml: 0.5 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
