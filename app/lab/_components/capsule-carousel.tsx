'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { LabProduct } from './types';

export function CapsuleCarousel({ products }: { products: LabProduct[] }) {
  const [index, setIndex] = useState(0);

  const active = products[index];
  if (!active) return null;

  const go = (delta: number) =>
    setIndex((prev) => (prev + delta + products.length) % products.length);

  return (
    <section className="px-5 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
            Segera Hadir
          </h2>
          <p className="hidden max-w-xs pb-2 font-editorial text-lg italic leading-snug text-[#111110]/55 sm:block">
            Koleksi berikutnya — daftar untuk akses awal.
          </p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="relative">
            <div className="relative mx-auto flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[999px] bg-[#DDE8CF]">
              {active.image && (
                <Image
                  key={active.id}
                  src={active.image}
                  alt={active.name}
                  fill
                  sizes="(max-width: 1024px) 92vw, 900px"
                  className="object-contain p-12 mix-blend-multiply sm:p-16"
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Sebelumnya"
              className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#111110] text-[#F5F4F0] transition-transform hover:scale-105 lg:-left-6"
            >
              <Icon icon="solar:arrow-left-linear" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Berikutnya"
              className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#111110] text-[#F5F4F0] transition-transform hover:scale-105 lg:-right-6"
            >
              <Icon icon="solar:arrow-right-linear" className="h-5 w-5" />
            </button>

            <div className="mt-8 flex justify-center gap-2">
              {products.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Ke slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-7 bg-[#111110]' : 'w-1.5 bg-[#111110]/25'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <ul className="space-y-1.5">
              {products.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`block max-w-full truncate text-left font-editorial text-[26px] leading-tight transition-colors ${
                      i === index
                        ? 'text-[#111110]'
                        : 'text-[#111110]/25 hover:text-[#111110]/55'
                    }`}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
            <Link
              href={`/produk/${active.slug}`}
              className="mt-7 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] underline-offset-4 hover:underline"
            >
              Lihat Produk
              <Icon icon="solar:arrow-right-up-linear" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
