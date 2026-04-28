'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';

export default function CheckoutPage(): JSX.Element {
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const router = useRouter();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, name, items })
    });

    const data = (await response.json()) as { orderId: string };
    clear();
    router.replace(`/checkout/success?orderId=${data.orderId}`);
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Teslimat ve Ödeme</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ad Soyad"
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3"
        />
        <textarea
          required
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Açık adres"
          className="h-28 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3"
        />
        <button className="w-full rounded-xl bg-brand py-3 font-semibold text-white">Siparişi Tamamla</button>
      </form>
    </div>
  );
}
