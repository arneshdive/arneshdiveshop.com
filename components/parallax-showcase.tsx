'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Placeholder gear photography — swap for real freediving/scuba cutouts
// (masks, fins, tanks, regulators) once that photography is available.
// Ideally transparent PNGs, matching how the reference site's garment
// cutouts blend into the dark background with no visible edges.
const TILE_IMAGES = ['/product-sample-1.webp', '/product-sample-2.webp'];

const ROTATE_DEG = 45;
const COLS = 4;
const ROWS = 4;

export function ParallaxShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Single layer drifts up and to the left as the section scrolls through view.
  const x = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const tiles = Array.from({ length: ROWS * COLS }, (_, i) => TILE_IMAGES[i % TILE_IMAGES.length]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden rounded-3xl bg-neutral-950 min-h-[500px] lg:min-h-[850px]"
    >
      {/* Tiled image layer — anchored to the right side only */}
      <div className="absolute inset-y-0 right-0 w-[75%] lg:w-[65%] overflow-hidden">
        <motion.div
          style={{
            x,
            y,
            maskImage: 'linear-gradient(to right, transparent, black 35%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%)',
          }}
          className="absolute -inset-x-[15%] -inset-y-[15%] grid grid-cols-4 gap-6 lg:gap-10 place-items-center"
        >
          {tiles.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              aria-hidden="true"
              style={{ transform: `rotate(${ROTATE_DEG}deg)`, filter: 'brightness(0.6)' }}
              className="w-28 sm:w-36 lg:w-48 opacity-70 pointer-events-none select-none"
            />
          ))}
        </motion.div>
      </div>

      {/* Content — single block, vertically centered, left-aligned */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-12">
          <div className="max-w-md">
            <span className="block text-xl lg:text-2xl font-bold tracking-tight text-white mb-10 lg:mb-16">
              ARNES DIVE
            </span>

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
      </div>
    </section>
  );
}
