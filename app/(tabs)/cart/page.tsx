'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { formatTRY } from '@/lib/data';

export default function CartPage(): JSX.Element {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-bold">Sepetim</h2>
      {items.length === 0 ? <p className="text-sm text-zinc-500">Sepet boş.</p> : null}
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-xs text-zinc-500">
                {item.selectedOptions.configuration} · {item.selectedOptions.fabricColor} · {item.selectedOptions.legStyle}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-semibold">{formatTRY(item.unitPrice)}</p>
                <div className="flex items-center gap-2 rounded-full border px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-500">Toplam</p>
        <p className="text-2xl font-bold">{formatTRY(total)}</p>
        <Link href="/checkout" className="mt-3 block rounded-xl bg-brand py-3 text-center text-sm font-semibold text-white">
          Ödemeye Geç
        </Link>
      </div>
    </div>
  );
}
