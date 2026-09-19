/**
 * Input Validation Utilities for Ravi Vision Mobile App
 */

export const SERVICED_PINCODES = [
  '821107', // Kargahar (Local)
  '821112', // Kochas
  '821115', // Sasaram (Head Office)
  '821104', // Chenari
  '802215', // Garh Nokha
  '821113', // Sheosagar
  '821108', // Kudra
  '802212', // Bikramganj
  '821307', // Dehri-on-Sone
  '821109', // Mohania
];

export function isValidMobileNumber(phone: string): boolean {
  const clean = phone.replace(/\D/g, '').trim();
  return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}

export function isPincodeServiced(pincode: string): boolean {
  const clean = pincode.replace(/\D/g, '').trim();
  return SERVICED_PINCODES.includes(clean);
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim();
}
