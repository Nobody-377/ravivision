/**
 * Currency Utility for Ravi Vision Mobile App
 * STRICT REQUIREMENT: All money values must display exactly 2 decimal places.
 * Example: 24999 -> "₹24,999.00", 1499.5 -> "₹1,499.50"
 */

export function formatINR(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '₹0.00';

  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return '₹0.00';

  const formattedNum = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `₹${formattedNum}`;
}

export function roundToTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
