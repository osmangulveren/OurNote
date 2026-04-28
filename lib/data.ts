import { Product } from '@prisma/client';
import { ProductOptions, ProductRecord } from '@/lib/types';

export function mapProduct(product: Product): ProductRecord {
  const images = JSON.parse(product.images as string) as string[];
  const availableOptions = JSON.parse(product.availableOptions as string) as ProductOptions;

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
