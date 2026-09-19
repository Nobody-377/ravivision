import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoGo?.developer?.manifestModule?.debuggerHost ||
      Constants.linkingUri;

    if (hostUri) {
      // Remove protocol prefix if present
      const cleanUri = hostUri.replace(/^exp:\/\//, '').replace(/^http:\/\//, '').replace(/^https:\/\//, '');
      const ip = cleanUri.split(':')[0].split('/')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5000`;
      }
    }
  } catch (err) {
    // Fallback on error
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
}

export const API_BASE_URL = getApiBaseUrl();

const AUTH_TOKEN_KEY = 'ravi_customer_token';
const CART_SESSION_KEY = 'ravi_mobile_cart_session';

let cachedCartSessionId: string | null = null;

export async function getCartSessionId(): Promise<string> {
  if (cachedCartSessionId) return cachedCartSessionId;

  try {
    let id: string | null = null;
    if (Platform.OS === 'web') {
      id = localStorage.getItem(CART_SESSION_KEY);
    } else {
      id = await SecureStore.getItemAsync(CART_SESSION_KEY);
    }

    if (!id) {
      id = `mob_cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (Platform.OS === 'web') {
        localStorage.setItem(CART_SESSION_KEY, id);
      } else {
        await SecureStore.setItemAsync(CART_SESSION_KEY, id);
      }
    }

    cachedCartSessionId = id;
    return id;
  } catch {
    cachedCartSessionId = `mob_cart_${Date.now()}`;
    return cachedCartSessionId;
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch {
    // Fallback
  }
}

export async function removeStoredToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {
    // Fallback
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string }; [key: string]: any }> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const token = await getStoredToken();
    const cartSessionId = await getCartSessionId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-cart-session-id': cartSessionId,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    console.log(`[MOBILE API REQUEST] -> ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json();
    console.log(`[MOBILE API RESPONSE] <- ${response.status} from ${url} (success: ${json.success})`);

    if (!response.ok) {
      return {
        success: false,
        error: json.error || {
          code: `HTTP_${response.status}`,
          message: json.message || `Request failed with status ${response.status}`,
        },
      };
    }

    return json;
  } catch (err: any) {
    console.error(`[MOBILE API ERROR] Failed fetching ${url}:`, err.message || err);
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: { code: 'TIMEOUT', message: 'Connection timed out. Please check your network connection.' },
      };
    }
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: `Unable to connect to server at ${baseUrl}. Please verify phone is on same Wi-Fi as host PC.` },
    };
  }
}
