import { FeedCard } from '@/components/feed-card';
import { mapProduct } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export default async function FeedPage(): Promise<JSX.Element> {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-bold">Sana Özel Koltuklar</h2>
      {products.map((product) => (
        <FeedCard key={product.id} product={mapProduct(product)} />
      ))}
    </div>
  );
}
