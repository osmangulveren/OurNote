'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductRecord, SelectedOptions } from '@/lib/types';
import { formatTRY } from '@/lib/data';
import { useCartStore } from '@/lib/store';

function getDefaultSelection(product: ProductRecord): SelectedOptions {
  return {
    configuration: product.availableOptions.configuration[0].value,
    fabricColor: product.availableOptions.fabricColor[0].value,
    frameType: product.availableOptions.frameType[0].value,
    armShape: product.availableOptions.armShape[0].value,
    legStyle: product.availableOptions.legStyle[0].value
  };
}

export function Customizer({ product }: { product: ProductRecord }): JSX.Element {
  const [selected, setSelected] = useState<SelectedOptions>(getDefaultSelection(product));
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const total = useMemo(() => {
    const groups = product.availableOptions;
    const modifiers = [
      groups.configuration.find((item) => item.value === selected.configuration)?.priceModifier ?? 0,
      groups.fabricColor.find((item) => item.value === selected.fabricColor)?.priceModifier ?? 0,
      groups.frameType.find((item) => item.value === selected.frameType)?.priceModifier ?? 0,
      groups.armShape.find((item) => item.value === selected.armShape)?.priceModifier ?? 0,
      groups.legStyle.find((item) => item.value === selected.legStyle)?.priceModifier ?? 0
    ];

    return product.basePrice + modifiers.reduce((sum, value) => sum + value, 0);
  }, [product, selected]);

  const addToCart = (): void => {
    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      image: product.images[0],
      selectedOptions: selected,
      unitPrice: total,
      quantity: 1
    });
    router.push('/cart');
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-zinc-50 pb-3">
        <div className="relative h-72 overflow-hidden rounded-2xl">
          <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="100vw" priority />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <OptionRow
          title="Konfigürasyon"
          items={product.availableOptions.configuration}
          selected={selected.configuration}
          onChange={(value) => setSelected((prev) => ({ ...prev, configuration: value }))}
        />
        <OptionRow
          title="Kumaş Rengi"
          items={product.availableOptions.fabricColor}
          selected={selected.fabricColor}
          onChange={(value) => setSelected((prev) => ({ ...prev, fabricColor: value }))}
          asSwatch
        />
        <OptionRow
          title="İskelet Tipi"
          items={product.availableOptions.frameType}
          selected={selected.frameType}
          onChange={(value) => setSelected((prev) => ({ ...prev, frameType: value }))}
        />
        <OptionRow
          title="Kol Şekli"
          items={product.availableOptions.armShape}
          selected={selected.armShape}
          onChange={(value) => setSelected((prev) => ({ ...prev, armShape: value }))}
        />
        <OptionRow
          title="Ayak Modeli ve Rengi"
          items={product.availableOptions.legStyle}
          selected={selected.legStyle}
          onChange={(value) => setSelected((prev) => ({ ...prev, legStyle: value }))}
        />
      </div>

      <div className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center justify-between border-t bg-white px-4 py-3">
        <div>
          <p className="text-xs text-zinc-500">Toplam</p>
          <p className="text-xl font-bold">{formatTRY(total)}</p>
        </div>
        <button onClick={addToCart} className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">
          Sepete Ekle
        </button>
      </div>
    </div>
  );
}

type OptionRowProps = {
  title: string;
  items: { value: string; label: string; hex?: string; icon?: string }[];
  selected: string;
  onChange: (value: string) => void;
  asSwatch?: boolean;
};

function OptionRow({ title, items, selected, onChange, asSwatch = false }: OptionRowProps): JSX.Element {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-zinc-600">{title}</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={`flex min-w-fit items-center gap-1 rounded-full border px-3 py-2 text-sm ${
              selected === item.value ? 'border-brand bg-brand text-white' : 'border-zinc-300 bg-white text-zinc-700'
            }`}
          >
            {asSwatch && item.hex ? <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: item.hex }} /> : null}
            {item.icon ? <span>{item.icon}</span> : null}
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
