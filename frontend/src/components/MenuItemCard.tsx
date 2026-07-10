import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Stack,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import type { MenuItem } from '../services/api';
import { useCartStore } from '../stores/cartStore';

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCardClick = () => {
    navigate(`/menu/${item.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    addItem(item, quantity, [], undefined);
    setShowSuccess(true);
    setQuantity(1); // Reset quantity after adding
  };

  const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          opacity: item.is_available ? 1 : 0.6,
        }}
      >
        <CardActionArea onClick={handleCardClick} disabled={!item.is_available}>
          {/* Image */}
          <CardMedia
            component="img"
            height="200"
            image={item.image_url || 'https://via.placeholder.com/400x200?text=No+Image'}
            alt={item.name}
            sx={{ objectFit: 'cover' }}
          />

          <CardContent sx={{ flexGrow: 1 }}>
            {/* Name and Price */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
              <Typography variant="h6" component="h3" sx={{ flexGrow: 1, pr: 1 }}>
                {item.name}
              </Typography>
              <Typography 
                variant="h6" 
                color="primary" 
                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                ${parseFloat(item.base_price).toFixed(2)}
              </Typography>
            </Box>

            {/* Description */}
            {item.description && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.description}
              </Typography>
            )}

            {/* Badges and Info */}
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
              {/* Featured Badge */}
              {item.is_featured && (
                <Chip 
                  label="Featured" 
                  color="secondary" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              )}

              {/* Availability Badge */}
              {!item.is_available && (
                <Chip 
                  label="Unavailable" 
                  color="error" 
                  size="small" 
                  variant="outlined"
                />
              )}

              {/* Preparation Time */}
              {item.preparation_time && (
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                  label={`${item.preparation_time} min`}
                  size="small"
                  variant="outlined"
                />
              )}

              {/* Dietary Info */}
              {item.dietary_info?.vegetarian && (
                <Chip 
                  label="🌱 Vegetarian" 
                  size="small" 
                  variant="outlined"
                  color="success"
                />
              )}
              {item.dietary_info?.vegan && (
                <Chip 
                  label="🌿 Vegan" 
                  size="small" 
                  variant="outlined"
                  color="success"
                />
              )}
              {item.dietary_info?.gluten_free && (
                <Chip 
                  label="Gluten-Free" 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Allergens Warning */}
            {item.allergens && item.allergens.length > 0 && (
              <Typography 
                variant="caption" 
                color="error" 
                sx={{ display: 'block', mb: 2 }}
              >
                ⚠️ Contains: {item.allergens.join(', ')}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>

        {/* Add to Cart Section */}
        {item.is_available && (
          <Box 
            sx={{ 
              p: 2, 
              pt: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quantity Selector */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton
                size="small"
                onClick={(e) => handleQuantityChange(-1, e)}
                disabled={quantity <= 1}
                sx={{ bgcolor: 'grey.100' }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography 
                variant="body2" 
                fontWeight="medium" 
                sx={{ minWidth: 24, textAlign: 'center' }}
              >
                {quantity}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => handleQuantityChange(1, e)}
                sx={{ bgcolor: 'grey.100' }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>

            {/* Add to Cart Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={handleAddToCart}
              sx={{ borderRadius: 2 }}
            >
              Add to Cart
            </Button>
          </Box>
        )}
      </Card>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Added {quantity} {item.name} to cart!
        </Alert>
      </Snackbar>
    </>
  );
}
