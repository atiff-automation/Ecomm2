import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatMalaysianCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length) + '...';
}

export function generateSKU(prefix = 'SKU'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

export function validateMalaysianPostalCode(postalCode: string): boolean {
  return /^\d{5}$/.test(postalCode);
}

export function validateMalaysianPhoneNumber(phoneNumber: string): boolean {
  return /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/.test(phoneNumber);
}
