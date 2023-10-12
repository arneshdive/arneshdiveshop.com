'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

// Placeholder gear photography — swap `src`/`objectPosition` for real
// freediving/scuba cutouts (masks, fins, tanks, regulators) once that
// photography is available. `objectPosition` crops a different focal
// area of each shared source photo so repeats don't read as identical.
interface FloatingItem {
  src: string;
  objectPosition: string;
  className: string;
  speed: number;
  rotate: number;
  flip?: boolean;
}

const floatingItems: FloatingItem[] = [
  { src: '/product-sample-1.webp', objectPosition: '50% 15%', className: '-top-[6%] left-[4%] w-44 lg:w-72', speed: -90, rotate: -14 },
  { src: '/product-sample-2.webp', objectPosition: '50% 55%', className: 'top-[10%] left-[38%] w-32 lg:w-48', speed: 70, rotate: 8 },
  { src: '/product-sample-1.webp', objectPosition: '80% 40%', className: '-top-[4%] right-[16%] w-36 lg:w-56', speed: 120, rotate: -18, flip: true },
  { src: '/product-sample-2.webp', objectPosition: '50% 10%', className: 'top-[6%] -right-[4%] w-48 lg:w-80', speed: -75, rotate: 10 },
  { src: '/product-sample-1.webp', objectPosition: '25% 90%', className: 'top-[42%] left-[14%] w-28 lg:w-40', speed: 60, rotate: 6 },
  { src: '/product-sample-2.webp', objectPosition: '50% 45%', className: 'top-[46%] right-[36%] w-24 lg:w-36', speed: -100, rotate: -10, flip: true },
  { src: '/product-sample-1.webp', objectPosition: '50% 10%', className: 'bottom-[4%] left-[8%] w-40 lg:w-60', speed: 85, rotate: 9 },
  { src: '/product-sample-2.webp', objectPosition: '20% 85%', className: 'bottom-[6%] left-[44%] w-28 lg:w-40', speed: -60, rotate: -7 },
  { src: '/product-sample-1.webp', objectPosition: '50% 50%', className: '-bottom-[6%] right-[24%] w-32 lg:w-48', speed: 95, rotate: 14 },
  { src: '/product-sample-2.webp', objectPosition: '75% 35%', className: '-bottom-[8%] -right-[4%] w-44 lg:w-72', speed: -110, rotate: -12, flip: true },
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
    <motion.div
      style={{
        y,
        rotate: item.rotate,
        maskImage: 'radial-gradient(closest-side, black 45%, transparent 90%)',
        WebkitMaskImage: 'radial-gradient(closest-side, black 45%, transparent 90%)',
      }}
      className={`absolute aspect-square overflow-hidden pointer-events-none select-none ${item.className}`}
    >
      <img
        src={item.src}
        alt=""
        aria-hidden="true"
        style={{
          objectPosition: item.objectPosition,
          transform: item.flip ? 'scaleX(-1)' : undefined,
          filter: 'grayscale(0.4) brightness(0.55)',
        }}
        className="w-full h-full object-cover scale-150"
      />
    </motion.div>
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
