'use client';

import { useState, useRef, useEffect } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export function ExpandableText({ text, maxLines = 3, className = '' }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if text content overflows the max lines
    if (textRef.current) {
      const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight);
      const maxHeight = lineHeight * maxLines;
      setNeedsExpand(textRef.current.scrollHeight > maxHeight + 4); // +4 for rounding tolerance
    }
  }, [text, maxLines]);

  if (!text) {
    return <span className={className}>Tidak ada deskripsi.</span>;
  }

  return (
    <div className={className}>
      <div
        ref={textRef}
        className={`leading-relaxed overflow-hidden transition-all duration-200 ${
          !isExpanded ? `line-clamp-${maxLines}` : ''
        }`}
      >
        {text}
      </div>
      {needsExpand && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
        >
          {isExpanded ? 'Tampilkan lebih sedikit' : 'Tampilkan lebih banyak'}
        </button>
      )}
    </div>
  );
}
