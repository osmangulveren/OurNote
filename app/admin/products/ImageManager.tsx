"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  uploadProductImages,
  deleteProductImage,
  setCoverImage,
  moveImage,
} from "@/lib/products/imageActions";

interface Img { id: string; url: string; alt?: string | null; sortOrder: number; isCover: boolean }

export default function ImageManager({ productId, images }: { productId: string; images: Img[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="text-sm"
          disabled={pending}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!inputRef.current?.files?.length) {
              setError("Dosya seçin.");
              return;
            }
            const fd = new FormData();
            for (const f of Array.from(inputRef.current.files)) fd.append("files", f);
            start(async () => {
              setError(null);
              const res = await uploadProductImages(productId, fd);
              if ((res as any)?.error) setError((res as any).error);
              if (inputRef.current) inputRef.current.value = "";
            });
          }}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm rounded-lg px-3 py-1.5"
        >
          {pending ? "Yükleniyor…" : "Görselleri yükle"}
        </button>
        <span className="text-xs text-slate-500">PNG / JPG / WebP / GIF · 8MB sınır</span>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {images.length === 0 ? (
        <p className="text-sm text-slate-500">Henüz görsel eklenmemiş.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <li key={img.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="aspect-square relative bg-slate-100">
                <Image
                  src={img.url}
                  alt={img.alt ?? ""}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized
                />
                {img.isCover ? (
                  <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-emerald-600 text-white px-2 py-0.5 rounded">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1 p-2 text-xs">
                <button
                  type="button"
                  disabled={pending || i === 0}
                  onClick={() => start(async () => { await moveImage(img.id, "up"); })}
                  className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-30"
                >↑</button>
                <button
                  type="button"
                  disabled={pending || i === images.length - 1}
                  onClick={() => start(async () => { await moveImage(img.id, "down"); })}
                  className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-30"
                >↓</button>
                {!img.isCover ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => start(async () => { await setCoverImage(img.id); })}
                    className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50"
                  >Cover yap</button>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Görsel silinsin mi?")) return;
                    start(async () => { await deleteProductImage(img.id); });
                  }}
                  className="px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50"
                >Sil</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
