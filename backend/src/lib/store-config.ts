import { prisma } from './prisma';

export interface StoreConfig {
  codEnabled: boolean;
  storePhone: string;
  razorpayKeyId: string;
  storeName: string;
}

export async function getStoreConfig(): Promise<StoreConfig> {
  const settings = await prisma.storeSetting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const codEnabled = settingsMap.get('COD_ENABLED') !== 'false';
  const storePhone = settingsMap.get('STORE_PHONE') || process.env.STORE_PHONE || '+91 9631410611';
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

  return {
    codEnabled,
    storePhone,
    razorpayKeyId,
    storeName: 'Ravi Vision',
  };
}
