/**
 * Centralized currency formatting for AXIS ERP
 * Supports PYG, USD, BRL with locale-specific formatting
 */

type Currency = 'PYG' | 'USD' | 'BRL';
type Locale = 'pt-BR' | 'es-PY' | 'en-US';

const LOCALE_MAP: Record<Currency, Locale> = {
  PYG: 'es-PY',
  USD: 'en-US',
  BRL: 'pt-BR',
};

interface FormatCurrencyOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format a numeric amount as currency based on ISO code
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  options: FormatCurrencyOptions = {}
): string {
  const locale = options.locale || LOCALE_MAP[currency];

  const defaults: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'PYG' ? 0 : 2,
    maximumFractionDigits: currency === 'PYG' ? 0 : 2,
  };

  return new Intl.NumberFormat(locale, {
    ...defaults,
    ...options,
  }).format(amount);
}

/**
 * Format a numeric amount as compact currency (e.g., PYG 1.2M)
 */
export function formatCurrencyCompact(
  amount: number,
  currency: Currency,
  locale: string = LOCALE_MAP[currency]
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: currency === 'PYG' ? 0 : 1,
    maximumFractionDigits: currency === 'PYG' ? 0 : 1,
  }).format(amount);
}

/**
 * Parse a currency string back to number
 */
export function parseCurrency(value: string, currency: Currency): number {
  const locale = LOCALE_MAP[currency];
  const cleaned = value.replace(/[^\d.,-]/g, '');
  const parts = new Intl.NumberFormat(locale).formatToParts(1000.1);
  const decimalSeparator = parts.find(p => p.type === 'decimal')?.value || '.';
  const groupSeparator = parts.find(p => p.type === 'group')?.value || ',';

  const normalized = cleaned
    .replace(new RegExp(`\\${groupSeparator}`, 'g'), '')
    .replace(decimalSeparator, '.');

  return parseFloat(normalized) || 0;
}
