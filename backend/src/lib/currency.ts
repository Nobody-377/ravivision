import { Prisma } from '@prisma/client';

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

export function toDecimal(val: number | string): Prisma.Decimal {
  return new Prisma.Decimal(val);
}
