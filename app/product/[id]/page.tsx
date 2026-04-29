import { notFound } from 'next/navigation';
import { Customizer } from '@/components/customizer';
import { mapProduct } from '@/lib/data';
import { prisma } from '@/lib/prisma';

type Props = {
  params: { id: string };
};

export default async function ProductPage({ params }: Props): Promise<JSX.Element> {
  const product = await prisma.product.findUnique({ where: { id: params.id } });

  if (!product) {
    notFound();
  }

  return <Customizer product={mapProduct(product)} />;
}
