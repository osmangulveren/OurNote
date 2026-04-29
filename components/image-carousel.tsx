'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  images: string[];
  alt: string;
};

export function ImageCarousel({ images, alt }: Props): JSX.Element {
  const [index, setIndex] = useState(0);

  const next = (): void => setIndex((prev) => (prev + 1) % images.length);
  const prev = (): void => setIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-zinc-100">
      <Image src={images[index]} alt={alt} fill className="object-cover" sizes="100vw" priority={index === 0} />
      <button aria-label="Önceki" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1">
        ‹
      </button>
      <button aria-label="Sonraki" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1">
        ›
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
        {images.map((image, imageIndex) => (
          <span key={image} className={`h-1.5 w-4 rounded-full ${imageIndex === index ? 'bg-white' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}
