interface MarqueeProps {
  items: string[];
  theme?: 'paper' | 'ink';
  separator?: string;
}

export function Marquee({ items, theme = 'paper', separator = '·' }: MarqueeProps) {
  const isInk = theme === 'ink';

  return (
    <div
      className={`relative flex overflow-hidden border-y py-3.5 ${
        isInk
          ? 'border-[#F5F4F0]/12 bg-[#111110] text-[#F5F4F0]'
          : 'border-[#111110]/12 bg-[#F5F4F0] text-[#111110]'
      }`}
    >
      <div className="lab-marquee-track flex w-max">
        {[0, 1].map((group) => (
          <ul key={group} className="flex items-center" aria-hidden={group === 1}>
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-10 pr-10 text-[10.5px] font-semibold uppercase tracking-[0.34em]"
              >
                <span>{item}</span>
                <span className="opacity-35">{separator}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
