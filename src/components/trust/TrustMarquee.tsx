'use client';

import { Truck, RefreshCw, Gem, Leaf, type LucideIcon } from 'lucide-react';
import { useGetSettingQuery } from '@/services/api/settingsApi';

const iconMap: Record<string, LucideIcon> = {
  Truck,
  RefreshCw,
  Gem,
  Leaf,
};

const defaultItems = [
  { icon: 'Truck', text: 'Free Shipping Worldwide' },
  { icon: 'RefreshCw', text: '30-Day Returns' },
  { icon: 'Gem', text: 'Premium Materials' },
  { icon: 'Leaf', text: 'Carbon Neutral Delivery' },
];

export const TrustMarquee = () => {
  const { data: trustData } = useGetSettingQuery('trust_items');
  const trustItems: { icon: string; text: string }[] = (trustData as { icon: string; text: string }[] | undefined) || defaultItems;

  const items = [...trustItems, ...trustItems, ...trustItems, ...trustItems];

  return (
    <section className="relative py-6 bg-[#111111] overflow-hidden">
      {/* Gradient edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#111111] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#111111] to-transparent z-10 pointer-events-none" />

      <div className="flex animate-marquee hover:pause">
        {items.map((item, index) => {
          const Icon = iconMap[item.icon] || Truck;
          return (
            <div
              key={index}
              className="flex items-center gap-3 px-8 whitespace-nowrap"
            >
              <Icon className="h-4 w-4 text-[#C7A27C]" />
              <span className="text-sm font-medium text-white/90 tracking-wide">
                {item.text}
              </span>
              <span className="text-[#C7A27C]/30 mx-4">•</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustMarquee;
