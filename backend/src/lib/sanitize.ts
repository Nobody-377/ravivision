export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>'"]/g, '') // Strip dangerous injection characters
    .substring(0, 1000); // Enforce upper length limit
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');

  // 10-digit Indian mobile format (starting with 6, 7, 8, or 9)
  const pattern = /^[6-9]\d{9}$/;
  return pattern.test(cleaned.slice(-10));
}

export function isValidPincode(pincode: string): boolean {
  if (!pincode) return false;
  const cleaned = pincode.trim();

  // 6-digit Indian PIN code format (cannot start with 0)
  const pattern = /^[1-9][0-9]{5}$/;
  return pattern.test(cleaned);
}
