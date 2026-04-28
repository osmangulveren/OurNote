import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapProduct } from '@/lib/data';

export async function GET(): Promise<NextResponse> {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(products.map(mapProduct));
}
