import { Product } from '@prisma/client';
import { ProductOptions, ProductRecord } from '@/lib/types';

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  }

  return [];
}

function asProductOptions(value: unknown): ProductOptions {
  if (typeof value === 'string') {
    return JSON.parse(value) as ProductOptions;
  }

  return value as ProductOptions;
}

export function mapProduct(product: Product): ProductRecord {
  const images = asStringArray(product.images);
  const availableOptions = asProductOptions(product.availableOptions);

  return {
    id: product.id,
    name: product.name,
    basePrice: product.basePrice,
    retailPrice: product.retailPrice,
    category: product.category,
    images,
    availableOptions
  };
}

export function formatTRY(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0
  }).format(value);
}
