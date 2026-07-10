import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Box,
  Typography,
  TextField,
  Tabs,
  Tab,
  Grid,
  InputAdornment,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import { Search as SearchIcon, RestaurantMenu as RestaurantMenuIcon } from '@mui/icons-material';
import LoadingSpinner from '../../components/LoadingSpinner';
import MenuItemCard from '../../components/MenuItemCard';
import { getCategories, getMenuItems } from '../../services/api';
import { useSession } from '../../contexts/SessionContext';

export default function MenuPage() {
  const { sessionData } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<string | null>(null);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', sessionData?.restaurant_id],
    queryFn: () => getCategories(sessionData?.restaurant_id),
    enabled: !!sessionData?.restaurant_id,
  });

  // Fetch menu items
  const { data: menuItemsData, isLoading, error } = useQuery({
    queryKey: ['menuItems', sessionData?.restaurant_id, selectedCategory, searchQuery],
    queryFn: () => getMenuItems({
      restaurantId: sessionData?.restaurant_id,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchQuery || undefined,
      isAvailable: true,
    }),
    enabled: !!sessionData?.restaurant_id,
  });

  const categories = categoriesData?.data || [];
  const menuItems = menuItemsData?.data || [];

  // Filter by dietary preferences
  const filteredItems = dietaryFilter
    ? menuItems.filter((item) => {
        if (dietaryFilter === 'vegetarian') return item.dietary_info?.vegetarian;
        if (dietaryFilter === 'vegan') return item.dietary_info?.vegan;
        if (dietaryFilter === 'gluten_free') return item.dietary_info?.gluten_free;
        return true;
      })
    : menuItems;

  // Get featured items
  const featuredItems = menuItems.filter((item) => item.is_featured).slice(0, 3);

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
  };

  const handleDietaryFilter = (filter: string) => {
    setDietaryFilter(dietaryFilter === filter ? null : filter);
  };

  if (!sessionData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please scan a QR code to start ordering.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RestaurantMenuIcon sx={{ mr: 1, fontSize: 32 }} />
          Menu
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {sessionData.restaurant_name} - Table {sessionData.table_number}
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Dietary Filters */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
        <Chip
          label="🌱 Vegetarian"
          onClick={() => handleDietaryFilter('vegetarian')}
          color={dietaryFilter === 'vegetarian' ? 'success' : 'default'}
          variant={dietaryFilter === 'vegetarian' ? 'filled' : 'outlined'}
        />
        <Chip
          label="🌿 Vegan"
          onClick={() => handleDietaryFilter('vegan')}
          color={dietaryFilter === 'vegan' ? 'success' : 'default'}
          variant={dietaryFilter === 'vegan' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Gluten-Free"
          onClick={() => handleDietaryFilter('gluten_free')}
          color={dietaryFilter === 'gluten_free' ? 'primary' : 'default'}
          variant={dietaryFilter === 'gluten_free' ? 'filled' : 'outlined'}
        />
      </Stack>

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Items" value="all" />
          {categories.map((category) => (
            <Tab key={category.id} label={category.name} value={category.id} />
          ))}
        </Tabs>
      </Box>

      {/* Featured Items Section */}
      {selectedCategory === 'all' && !searchQuery && featuredItems.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            ⭐ Featured Items
          </Typography>
          <Grid container spacing={3}>
            {featuredItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <MenuItemCard item={item} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && <LoadingSpinner message="Loading menu..." />}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load menu items. Please try again.
        </Alert>
      )}

      {/* Menu Items Grid */}
      {!isLoading && !error && (
        <>
          {filteredItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No items found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <MenuItemCard item={item} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}
