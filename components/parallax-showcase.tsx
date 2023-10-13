'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

// Placeholder gear photography — swap `src` for real freediving/scuba
// cutouts (masks, fins, tanks, regulators) once that photography is
// available. Full images shown uncropped, rotated diagonally, scattered
// edge-to-edge across the section.
interface FloatingItem {
  src: string;
  className: string;
  speed: number;
  rotate: number;
}

const floatingItems: FloatingItem[] = [
  { src: '/product-sample-1.webp', className: '-top-[8%] -left-[4%] w-56 lg:w-80', speed: -90, rotate: -35 },
  { src: '/product-sample-2.webp', className: '-top-[4%] left-[32%] w-48 lg:w-64', speed: 70, rotate: 28 },
  { src: '/product-sample-1.webp', className: 'top-[2%] right-[18%] w-56 lg:w-80', speed: 110, rotate: -40 },
  { src: '/product-sample-2.webp', className: '-top-[10%] -right-[6%] w-60 lg:w-96', speed: -75, rotate: 34 },
  { src: '/product-sample-2.webp', className: 'top-[40%] -left-[6%] w-48 lg:w-72', speed: 60, rotate: 30 },
  { src: '/product-sample-1.webp', className: 'top-[42%] left-[28%] w-40 lg:w-56', speed: -100, rotate: -25 },
  { src: '/product-sample-2.webp', className: 'top-[38%] right-[8%] w-44 lg:w-64', speed: 90, rotate: 40 },
  { src: '/product-sample-1.webp', className: '-bottom-[8%] -left-[4%] w-56 lg:w-80', speed: 85, rotate: 32 },
  { src: '/product-sample-2.webp', className: 'bottom-[2%] left-[38%] w-44 lg:w-64', speed: -60, rotate: -30 },
  { src: '/product-sample-1.webp', className: '-bottom-[10%] right-[14%] w-52 lg:w-72', speed: 95, rotate: 38 },
  { src: '/product-sample-2.webp', className: '-bottom-[6%] -right-[6%] w-60 lg:w-96', speed: -110, rotate: -34 },
];

function FloatingObject({
  item,
  progress,
}: {
  item: FloatingItem;
  progress: MotionValue<number>;
}) {
  const y = useTransform(progress, [0, 1], [0, item.speed]);

  return (
    <motion.img
      src={item.src}
      alt=""
      aria-hidden="true"
      style={{ y, rotate: item.rotate, filter: 'brightness(0.7)' }}
      className={`absolute object-contain opacity-70 pointer-events-none select-none ${item.className}`}
    />
  );
}

export function ParallaxShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden rounded-t-3xl bg-neutral-950 min-h-[600px] lg:min-h-[820px]"
    >
      <div className="absolute inset-0">
        {floatingItems.map((item, i) => (
          <FloatingObject key={i} item={item} progress={scrollYProgress} />
        ))}
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 h-full py-14 lg:py-16 min-h-[600px] lg:min-h-[820px] flex flex-col justify-between">
        <span className="text-xl lg:text-2xl font-bold tracking-tight text-white">
          ARNES DIVE
        </span>

        <div className="max-w-xl">
          <span className="block text-xs uppercase tracking-widest text-white/60 mb-4">
            Jelajahi kedalaman bersama Arnes Dive
          </span>
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tighter">
            Berani. Simpel. Milikmu.
          </h2>
          <p className="text-white/70 text-base lg:text-lg leading-relaxed">
            Temukan peralatan yang mendukung setiap penyelaman. Koleksi eksklusif kami
            menghadirkan masker, fin, dan tabung scuba pilihan yang dirancang untuk
            performa dan kenyamanan di bawah laut.
          </p>
        </div>
      </div>
    </section>
  );
}
