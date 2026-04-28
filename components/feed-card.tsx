'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { ImageCarousel } from '@/components/image-carousel';
import { formatTRY } from '@/lib/data';
import { ProductRecord } from '@/lib/types';

export function FeedCard({ product }: { product: ProductRecord }): JSX.Element {
  const [liked, setLiked] = useState(false);
  const savings = Math.round(((product.retailPrice - product.basePrice) / product.retailPrice) * 100);

  return (
    <article className="space-y-3 rounded-2xl bg-white p-3 shadow-sm">
      <ImageCarousel images={product.images} alt={product.name} />
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-brand">{formatTRY(product.basePrice)}</span>
            <span className="text-sm text-zinc-400 line-through">{formatTRY(product.retailPrice)}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">%{savings} indirim</span>
          </div>
        </div>
        <button onClick={() => setLiked((prev) => !prev)} aria-label="Kaydet" className="rounded-full border border-zinc-200 p-2">
          <Heart className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : 'text-zinc-500'}`} />
        </button>
      </div>
      <Link href={`/product/${product.id}`} className="block rounded-xl bg-brand py-3 text-center text-sm font-semibold text-white">
        Özelleştir
      </Link>
    </article>
  );
}
