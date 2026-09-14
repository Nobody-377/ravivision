/**
 * Sanitizes string input by stripping HTML tags and trimming whitespace to prevent XSS attacks.
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toString()
    .trim()
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[<>'"]/g, '');   // Escape special characters
}

/**
 * Validates Indian 10-digit mobile number format.
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
}

/**
 * Validates 6-digit Indian Pincode format.
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return true; // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
