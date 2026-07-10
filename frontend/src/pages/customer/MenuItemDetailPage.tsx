import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  Chip,
  Divider,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  FormGroup,
  FormHelperText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getMenuItemById } from '../../services/api';
import { useCartStore, CartItemVariant } from '../../stores/cartStore';

interface VariantOption {
  id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
  display_order: number;
}

interface ItemVariant {
  id: string;
  name: string;
  type: 'single_select' | 'multi_select';
  is_required: boolean;
  display_order: number;
  options: VariantOption[];
}

interface MenuItemDetail {
  id: string;
  restaurant_id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string;
  image_url: string;
  base_price: string;
  preparation_time: number;
  is_available: boolean;
  is_featured: boolean;
  dietary_info: Record<string, boolean>;
  allergens: string[];
  nutritional_info: Record<string, any>;
  display_order: number;
  variants: ItemVariant[];
}

export default function MenuItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch menu item details
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['menu-item', itemId],
    queryFn: () => getMenuItemById(itemId!),
    enabled: !!itemId,
  });

  const menuItem = data?.data as MenuItemDetail | undefined;

  // Initialize default selections
  useEffect(() => {
    if (menuItem?.variants) {
      const defaults: Record<string, string[]> = {};
      menuItem.variants.forEach((variant) => {
        const defaultOptions = variant.options.filter((opt) => opt.is_default);
        if (defaultOptions.length > 0) {
          defaults[variant.id] = defaultOptions.map((opt) => opt.id);
        } else if (variant.type === 'single_select' && variant.options.length > 0) {
          // Auto-select first option for single_select if no default
          defaults[variant.id] = [variant.options[0].id];
        }
      });
      setSelectedVariants(defaults);
    }
  }, [menuItem]);

  // Handle single select variant change
  const handleSingleSelectChange = (variantId: string, optionId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantId]: [optionId],
    }));
    setValidationError(null);
  };

  // Handle multi select variant change
  const handleMultiSelectChange = (variantId: string, optionId: string, checked: boolean) => {
    setSelectedVariants((prev) => {
      const current = prev[variantId] || [];
      if (checked) {
        return { ...prev, [variantId]: [...current, optionId] };
      } else {
        return { ...prev, [variantId]: current.filter((id) => id !== optionId) };
      }
    });
    setValidationError(null);
  };

  // Calculate total price
  const calculatePrice = (): number => {
    if (!menuItem) return 0;

    let total = parseFloat(menuItem.base_price);

    menuItem.variants.forEach((variant) => {
      const selected = selectedVariants[variant.id] || [];
      selected.forEach((optionId) => {
        const option = variant.options.find((opt) => opt.id === optionId);
        if (option) {
          total += option.price_modifier;
        }
      });
    });

    return total * quantity;
  };

  // Validate selections
  const validateSelections = (): boolean => {
    if (!menuItem) return false;

    for (const variant of menuItem.variants) {
      if (variant.is_required) {
        const selected = selectedVariants[variant.id] || [];
        if (selected.length === 0) {
          setValidationError(`Please select ${variant.name}`);
          return false;
        }
      }
    }

    return true;
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!menuItem) return;

    if (!validateSelections()) {
      return;
    }

    // Convert selections to CartItemVariant format
    const cartVariants: CartItemVariant[] = [];
    menuItem.variants.forEach((variant) => {
      const selected = selectedVariants[variant.id] || [];
      selected.forEach((optionId) => {
        const option = variant.options.find((opt) => opt.id === optionId);
        if (option) {
          cartVariants.push({
            variant_id: variant.id,
            variant_name: variant.name,
            option_id: option.id,
            option_name: option.name,
            price_modifier: option.price_modifier,
          });
        }
      });
    });

    addItem(menuItem, quantity, cartVariants, specialInstructions || undefined);
    setShowSuccess(true);
    
    // Reset form
    setTimeout(() => {
      setQuantity(1);
      setSpecialInstructions('');
    }, 1000);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading item details...
        </Typography>
      </Container>
    );
  }

  if (isError || !menuItem) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Failed to load menu item'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/menu')} sx={{ mt: 2 }}>
          Back to Menu
        </Button>
      </Container>
    );
  }

  const totalPrice = calculatePrice();
  const unitPrice = calculatePrice() / quantity;

  return (
    <>
      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/menu')}
          sx={{ mb: 2 }}
        >
          Back to Menu
        </Button>

        {/* Item Image */}
        <Paper sx={{ overflow: 'hidden', mb: 3 }}>
          <Box
            component="img"
            src={menuItem.image_url || 'https://via.placeholder.com/800x400?text=No+Image'}
            alt={menuItem.name}
            sx={{
              width: '100%',
              height: { xs: 250, md: 400 },
              objectFit: 'cover',
            }}
          />
        </Paper>

        {/* Item Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {menuItem.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {menuItem.description}
              </Typography>
            </Box>
            <Typography variant="h4" color="primary" fontWeight="bold" sx={{ ml: 2 }}>
              ${parseFloat(menuItem.base_price).toFixed(2)}
            </Typography>
          </Stack>

          {/* Badges */}
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
            {menuItem.is_featured && (
              <Chip label="Featured" color="secondary" size="small" />
            )}
            {!menuItem.is_available && (
              <Chip label="Unavailable" color="error" size="small" />
            )}
            {menuItem.preparation_time && (
              <Chip
                icon={<AccessTimeIcon />}
                label={`${menuItem.preparation_time} min`}
                size="small"
                variant="outlined"
              />
            )}
            {menuItem.dietary_info?.vegetarian && (
              <Chip label="🌱 Vegetarian" size="small" variant="outlined" color="success" />
            )}
            {menuItem.dietary_info?.vegan && (
              <Chip label="🌿 Vegan" size="small" variant="outlined" color="success" />
            )}
            {menuItem.dietary_info?.gluten_free && (
              <Chip label="Gluten-Free" size="small" variant="outlined" />
            )}
          </Stack>

          {/* Allergens */}
          {menuItem.allergens && menuItem.allergens.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Contains allergens:</strong> {menuItem.allergens.join(', ')}
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Variants */}
        {menuItem.variants && menuItem.variants.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Customize Your Order
            </Typography>

            <Stack spacing={3} sx={{ mt: 2 }}>
              {menuItem.variants.map((variant) => (
                <Box key={variant.id}>
                  <FormControl component="fieldset" fullWidth required={variant.is_required}>
                    <FormLabel component="legend">
                      <Typography variant="subtitle1" fontWeight="medium">
                        {variant.name} {variant.is_required && <span style={{ color: 'red' }}>*</span>}
                      </Typography>
                    </FormLabel>

                    {variant.type === 'single_select' ? (
                      // Radio buttons for single select
                      <RadioGroup
                        value={selectedVariants[variant.id]?.[0] || ''}
                        onChange={(e) => handleSingleSelectChange(variant.id, e.target.value)}
                      >
                        {variant.options.map((option) => (
                          <FormControlLabel
                            key={option.id}
                            value={option.id}
                            control={<Radio />}
                            label={
                              <Stack direction="row" justifyContent="space-between" sx={{ width: '100%', pr: 2 }}>
                                <Typography variant="body2">{option.name}</Typography>
                                {option.price_modifier !== 0 && (
                                  <Typography variant="body2" color="text.secondary">
                                    {option.price_modifier > 0 ? '+' : ''}${option.price_modifier.toFixed(2)}
                                  </Typography>
                                )}
                              </Stack>
                            }
                            sx={{ width: '100%' }}
                          />
                        ))}
                      </RadioGroup>
                    ) : (
                      // Checkboxes for multi select
                      <FormGroup>
                        {variant.options.map((option) => (
                          <FormControlLabel
                            key={option.id}
                            control={
                              <Checkbox
                                checked={selectedVariants[variant.id]?.includes(option.id) || false}
                                onChange={(e) =>
                                  handleMultiSelectChange(variant.id, option.id, e.target.checked)
                                }
                              />
                            }
                            label={
                              <Stack direction="row" justifyContent="space-between" sx={{ width: '100%', pr: 2 }}>
                                <Typography variant="body2">{option.name}</Typography>
                                {option.price_modifier !== 0 && (
                                  <Typography variant="body2" color="text.secondary">
                                    {option.price_modifier > 0 ? '+' : ''}${option.price_modifier.toFixed(2)}
                                  </Typography>
                                )}
                              </Stack>
                            }
                            sx={{ width: '100%' }}
                          />
                        ))}
                      </FormGroup>
                    )}

                    {variant.is_required && (
                      <FormHelperText>Required - Please select at least one option</FormHelperText>
                    )}
                  </FormControl>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Special Instructions */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Special Instructions
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Any special requests? (e.g., no onions, extra sauce)"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </Paper>

        {/* Validation Error */}
        {validationError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {validationError}
          </Alert>
        )}

        {/* Add to Cart Section */}
        <Paper
          sx={{
            p: 3,
            position: 'sticky',
            bottom: 16,
            zIndex: 100,
            boxShadow: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Quantity Selector */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                sx={{ bgcolor: 'grey.100' }}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="medium" sx={{ minWidth: 40, textAlign: 'center' }}>
                {quantity}
              </Typography>
              <IconButton
                onClick={() => setQuantity(quantity + 1)}
                sx={{ bgcolor: 'grey.100' }}
              >
                <AddIcon />
              </IconButton>
            </Stack>

            {/* Price Display */}
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                ${unitPrice.toFixed(2)} each
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                ${totalPrice.toFixed(2)} total
              </Typography>
            </Box>

            {/* Add to Cart Button */}
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCartIcon />}
              onClick={handleAddToCart}
              disabled={!menuItem.is_available}
              sx={{ minWidth: 180 }}
            >
              Add to Cart
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Added {quantity} {menuItem.name} to cart!
        </Alert>
      </Snackbar>
    </>
  );
}
