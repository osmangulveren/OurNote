"use client";

import { useState } from "react";
import Image from "next/image";

interface Img { url: string; alt: string }

export default function Gallery({ images }: { images: Img[] }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  if (images.length === 0) {
    return <div className="aspect-square bg-slate-100 rounded-2xl" />;
  }
  const active = images[idx];
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="block w-full aspect-[4/3] relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-200"
        aria-label="Görseli büyüt"
      >
        <Image
          src={active.url}
          alt={active.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          unoptimized
        />
      </button>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-20 h-20 relative flex-shrink-0 rounded-lg overflow-hidden border ${i === idx ? "border-slate-900" : "border-slate-200"}`}
              aria-label={`Görsel ${i + 1}`}
            >
              <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="80px" unoptimized />
            </button>
          ))}
        </div>
      ) : null}

      {zoom ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoom(false)}
        >
          <div className="relative max-w-5xl max-h-full w-full h-full">
            <Image
              src={active.url}
              alt={active.alt}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
