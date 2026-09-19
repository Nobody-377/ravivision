import { create } from 'zustand';
import { apiFetch, getStoredToken, setStoredToken, removeStoredToken } from '../api/client';

export interface CustomerProfile {
  id: string;
  name: string;
  mobileNumber: string;
  pincode: string;
}

interface AuthState {
  customer: CustomerProfile | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  login: (mobileNumber: string) => Promise<boolean>;
  signup: (name: string, mobileNumber: string, pincode: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    const res = await apiFetch('/api/auth/customer');
    if (res.success && res.customer) {
      set({ customer: res.customer, isLoading: false });
    } else {
      set({ customer: null, isLoading: false });
    }
  },

  login: async (mobileNumber: string) => {
    set({ isLoading: true, error: null });
    const res = await apiFetch('/api/auth/customer', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', mobileNumber }),
    });

    if (res.success && res.customer) {
      if (res.token) {
        await setStoredToken(res.token);
      }
      set({ customer: res.customer, isLoading: false, error: null });
      return true;
    } else {
      set({ error: res.error?.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  signup: async (name: string, mobileNumber: string, pincode: string) => {
    set({ isLoading: true, error: null });
    const res = await apiFetch('/api/auth/customer', {
      method: 'POST',
      body: JSON.stringify({ action: 'signup', name, mobileNumber, pincode }),
    });

    if (res.success && res.customer) {
      if (res.token) {
        await setStoredToken(res.token);
      }
      set({ customer: res.customer, isLoading: false, error: null });
      return true;
    } else {
      set({ error: res.error?.message || 'Signup failed', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await apiFetch('/api/auth/customer/logout', { method: 'POST' });
    await removeStoredToken();
    set({ customer: null, error: null });
  },
}));
