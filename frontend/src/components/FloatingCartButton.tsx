import { Fab, Badge } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useCartStore } from '../stores/cartStore';

interface FloatingCartButtonProps {
  onClick: () => void;
}

export default function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const itemCount = useCartStore((state) => state.getItemCount());

  if (itemCount === 0) {
    return null; // Hide FAB when cart is empty
  }

  return (
    <Fab
      color="primary"
      aria-label="shopping cart"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <Badge badgeContent={itemCount} color="error">
        <ShoppingCartIcon />
      </Badge>
    </Fab>
  );
}
