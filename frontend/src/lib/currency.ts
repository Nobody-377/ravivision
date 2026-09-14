import { Prisma } from '@prisma/client';

/**
 * Format any number, string, or Prisma.Decimal into Indian Rupee (INR) currency string.
 * Example: 24999 -> "₹24,999", 24999.5 -> "₹24,999.50"
 */
export function formatINR(val: number | string | Prisma.Decimal | null | undefined): string {
  if (val === null || val === undefined) return '₹0';
  
  const num = typeof val === 'object' && 'toNumber' in val ? val.toNumber() : Number(val);
  
  if (isNaN(num)) return '₹0';

  const hasDecimal = num % 1 !== 0;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: hasDecimal ? 2 : 0,
    minimumFractionDigits: hasDecimal ? 2 : 0,
  }).format(num);
}

/**
 * Convert any string/number into safe Prisma Decimal compatible value.
 */
export function toDecimal(val: number | string): Prisma.Decimal {
  return new Prisma.Decimal(val);
}
