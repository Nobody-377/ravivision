import { create } from 'zustand';
import { apiFetch } from '../api/client';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  quantity: number;
  effectiveQuantity: number;
  isAvailable: boolean;
  itemTotal: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  totalItems: 0,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    const res = await apiFetch('/api/cart');
    if (res.success && res.data) {
      set({
        items: res.data.items || [],
        subtotal: res.data.subtotal || 0,
        totalItems: res.data.totalItems || 0,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity = 1) => {
    set({ isLoading: true, error: null });
    const res = await apiFetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });

    if (res.success) {
      if (res.data) {
        set({
          items: res.data.items || [],
          subtotal: res.data.subtotal || 0,
          totalItems: res.data.totalItems || 0,
          isLoading: false,
        });
      } else {
        await get().fetchCart();
      }
      return true;
    } else {
      set({ error: res.error?.message || 'Failed to add item to cart', isLoading: false });
      return false;
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    set({ isLoading: true, error: null });
    const res = await apiFetch('/api/cart', {
      method: 'PUT',
      body: JSON.stringify({ itemId, quantity }),
    });

    if (res.success) {
      if (res.data) {
        set({
          items: res.data.items || [],
          subtotal: res.data.subtotal || 0,
          totalItems: res.data.totalItems || 0,
          isLoading: false,
        });
      } else {
        await get().fetchCart();
      }
      return true;
    } else {
      set({ error: res.error?.message || 'Failed to update quantity', isLoading: false });
      return false;
    }
  },

  removeItem: async (itemId: string) => {
    set({ isLoading: true, error: null });
    const res = await apiFetch(`/api/cart?itemId=${itemId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      if (res.data) {
        set({
          items: res.data.items || [],
          subtotal: res.data.subtotal || 0,
          totalItems: res.data.totalItems || 0,
          isLoading: false,
        });
      } else {
        await get().fetchCart();
      }
      return true;
    } else {
      set({ error: res.error?.message || 'Failed to remove item', isLoading: false });
      return false;
    }
  },

  clearCart: async () => {
    set({ items: [], subtotal: 0, totalItems: 0 });
  },
}));
