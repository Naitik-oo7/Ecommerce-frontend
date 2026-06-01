/**
 * Currency formatting (INR).
 *
 * The storefront, checkout, Razorpay and order emails all transact in INR —
 * use this helper everywhere a price is shown so the symbol stays consistent.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrFormatterWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Format a value as ₹1,234.50. Accepts numbers or numeric strings. */
export const formatCurrency = (value: number | string | null | undefined): string => {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  return inrFormatter.format(Number.isFinite(n as number) ? (n as number) : 0);
};

/** Format without decimals — handy for compact callouts. */
export const formatCurrencyWhole = (value: number | string | null | undefined): string => {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  return inrFormatterWhole.format(Number.isFinite(n as number) ? (n as number) : 0);
};
