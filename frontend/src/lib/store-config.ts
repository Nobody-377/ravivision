import { prisma } from './prisma';

/**
 * Central Store Configuration Utility
 * Consumes environment variables for store-wide contact info (e.g. STORE_PHONE)
 */

export function getStorePhone(): string {
  const phone = process.env.STORE_PHONE || process.env.NEXT_PUBLIC_STORE_PHONE || '';
  return phone.trim();
}

export function isStorePhoneConfigured(): boolean {
  return getStorePhone().length > 0;
}

export function getCallLink(): string | null {
  const phone = getStorePhone();
  if (!phone) return null;
  // Remove non-digit characters except leading +
  const cleaned = phone.replace(/(?!^\+)[^\d]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
}

export interface StoreConfig {
  storeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  openingHours: string;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  defaultDeliveryCharge: number;
}

export async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const settings = await prisma.storeSetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return {
      storeName: map['storeName'] || 'Ravi Vision',
      phone: getStorePhone() || map['phone'] || '',
      whatsapp: map['whatsapp'] || '',
      email: map['email'] || '',
      address: map['address'] || '',
      city: map['city'] || 'Local Area',
      state: map['state'] || '',
      pincode: map['pincode'] || '',
      openingHours: map['openingHours'] || '10:00 AM - 9:00 PM (Mon-Sat)',
      codEnabled: map['codEnabled'] !== 'false',
      onlinePaymentEnabled: map['onlinePaymentEnabled'] !== 'false',
      defaultDeliveryCharge: Number(map['defaultDeliveryCharge'] || 0),
    };
  } catch {
    return {
      storeName: 'Ravi Vision',
      phone: getStorePhone(),
      whatsapp: '',
      email: '',
      address: '',
      city: 'Local Area',
      state: '',
      pincode: '',
      openingHours: '10:00 AM - 9:00 PM (Mon-Sat)',
      codEnabled: true,
      onlinePaymentEnabled: true,
      defaultDeliveryCharge: 0,
    };
  }
}

export function checkConfigCompleteness(providedConfig?: StoreConfig): { isComplete: boolean; missingFields: string[] } {
  const phone = providedConfig?.phone || getStorePhone();
  const missingFields: string[] = [];

  if (!phone) missingFields.push('Store Phone (STORE_PHONE in .env)');
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
