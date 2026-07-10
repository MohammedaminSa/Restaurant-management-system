import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '../services/api';

export interface CartItemVariant {
  variant_id: string;
  variant_name: string;
  option_id: string;
  option_name: string;
  price_modifier: number;
}

export interface CartItem {
  id: string; // Unique ID for cart item (menuItemId + variants hash)
  menuItem: MenuItem;
  quantity: number;
  selectedVariants: CartItemVariant[];
  specialInstructions?: string;
  itemTotal: number; // Total price for this item (base + variants) * quantity
}

interface CartStore {
  items: CartItem[];
  
  // Actions
  addItem: (
    menuItem: MenuItem,
    quantity: number,
    selectedVariants: CartItemVariant[],
    specialInstructions?: string
  ) => void;
  
  removeItem: (cartItemId: string) => void;
  
  updateQuantity: (cartItemId: string, quantity: number) => void;
  
  updateInstructions: (cartItemId: string, instructions: string) => void;
  
  clearCart: () => void;
  
  // Computed values
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: (taxRate: number) => number;
  getServiceCharge: (serviceChargeRate: number) => number;
  getTotal: (taxRate: number, serviceChargeRate: number) => number;
}

// Helper function to generate unique cart item ID
const generateCartItemId = (menuItemId: string, variants: CartItemVariant[]): string => {
  const variantIds = variants
    .map((v) => `${v.variant_id}-${v.option_id}`)
    .sort()
    .join('_');
  return `${menuItemId}_${variantIds || 'no-variants'}`;
};

// Helper function to calculate item total
const calculateItemTotal = (basePrice: string, variants: CartItemVariant[], quantity: number): number => {
  const base = parseFloat(basePrice);
  const variantsTotal = variants.reduce((sum, v) => sum + v.price_modifier, 0);
  return (base + variantsTotal) * quantity;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem, quantity, selectedVariants, specialInstructions) => {
        const cartItemId = generateCartItemId(menuItem.id, selectedVariants);
        const existingItem = get().items.find((item) => item.id === cartItemId);

        if (existingItem) {
          // Item with same variants exists, update quantity
          set((state) => ({
            items: state.items.map((item) =>
              item.id === cartItemId
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    itemTotal: calculateItemTotal(
                      menuItem.base_price,
                      selectedVariants,
                      item.quantity + quantity
                    ),
                    // Update special instructions if provided
                    specialInstructions: specialInstructions || item.specialInstructions,
                  }
                : item
            ),
          }));
        } else {
          // New item, add to cart
          const newItem: CartItem = {
            id: cartItemId,
            menuItem,
            quantity,
            selectedVariants,
            specialInstructions,
            itemTotal: calculateItemTotal(menuItem.base_price, selectedVariants, quantity),
          };

          set((state) => ({
            items: [...state.items, newItem],
          }));
        }
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId
              ? {
                  ...item,
                  quantity,
                  itemTotal: calculateItemTotal(
                    item.menuItem.base_price,
                    item.selectedVariants,
                    quantity
                  ),
                }
              : item
          ),
        }));
      },

      updateInstructions: (cartItemId, instructions) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId
              ? { ...item, specialInstructions: instructions }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.itemTotal, 0);
      },

      getTax: (taxRate) => {
        const subtotal = get().getSubtotal();
        return subtotal * (taxRate / 100);
      },

      getServiceCharge: (serviceChargeRate) => {
        const subtotal = get().getSubtotal();
        return subtotal * (serviceChargeRate / 100);
      },

      getTotal: (taxRate, serviceChargeRate) => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax(taxRate);
        const serviceCharge = get().getServiceCharge(serviceChargeRate);
        return subtotal + tax + serviceCharge;
      },
    }),
    {
      name: 'restaurant-cart', // localStorage key
    }
  )
);
