import { Icon } from '@iconify/react';
import { valueProps } from '@/lib/data/mock-products';

export function USPSection() {
  return (
    <section className="bg-white rounded-b-[2.5rem] shadow-[0_30px_50px_-35px_rgba(0,0,0,0.35)] py-14 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
          {valueProps.map((prop) => (
            <div key={prop.title} className="text-center px-6 py-6 sm:py-0">
              <Icon icon={prop.icon} className="w-8 h-8 mx-auto mb-4 text-neutral-800" />
              <h4 className="font-semibold text-base mb-1.5">{prop.title}</h4>
              <p className="text-xs lg:text-sm text-neutral-500 max-w-[220px] mx-auto">{prop.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
