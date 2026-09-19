/**
 * IST Date Formatter for Ravi Vision Mobile App
 * STRICT REQUIREMENT: Preserves Asia/Kolkata (IST) wall-clock time semantics.
 */

export function formatISTDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date) + ' IST';
}
