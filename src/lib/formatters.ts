import i18n from '@/i18n';

export function getDecimalValue(value: number | { $numberDecimal: string }): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal);
  }
  return 0;
}

function getIntlLocale(locale?: string): string {
  const lang = locale || i18n.language || 'en';
  return lang.startsWith('es') ? 'es-CL' : 'en-US';
}

export function formatCurrency(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency: currency || 'CLP',
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(amount);
}

export function formatDate(dateString: string, locale?: string): string {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}
