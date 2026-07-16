'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

interface LineRect {
  left: number;
  top: number;
  width: number;
}

interface AnimatedUnderlineProps {
  children: React.ReactNode;
  className?: string;
  /** Sweep duration per line, in ms. Also used as the delay between lines so line N+1 starts only after line N finishes. */
  durationMs?: number;
}

// Underlines each wrapped line individually (via Range.getClientRects) so a
// hover sweep can animate left-to-right per line, in sequence, instead of
// relying on text-decoration which treats multi-line text as one underline.
//
// The measured text lives in its own span (textRef), separate from the
// overlay bars — measuring the wrapper itself would pick up the previously
// rendered bars as extra "lines" and compound on every hover.
export function AnimatedUnderline({ children, className, durationMs = 250 }: AnimatedUnderlineProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [lines, setLines] = useState<LineRect[]>([]);
  const [hovered, setHovered] = useState(false);

  const measure = useCallback(() => {
    const textEl = textRef.current;
    const wrapperEl = wrapperRef.current;
    if (!textEl || !wrapperEl) return;
    const range = document.createRange();
    range.selectNodeContents(textEl);
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 0)
      .map((r) => ({
        left: r.left - wrapperRect.left,
        top: r.bottom - wrapperRect.top + 2,
        width: r.width,
      }));
    setLines(rects);
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline ${className ?? ''}`}
      onMouseEnter={() => {
        measure();
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <span ref={textRef}>{children}</span>
      {lines.map((line, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute pointer-events-none overflow-hidden"
          style={{ left: line.left, top: line.top, width: line.width, height: 1 }}
        >
          <span
            className="block w-full h-full bg-current"
            style={{
              transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'left',
              transition: `transform ${durationMs}ms ease`,
              transitionDelay: hovered ? `${i * durationMs}ms` : '0ms',
            }}
          />
        </span>
      ))}
    </span>
  );
}
