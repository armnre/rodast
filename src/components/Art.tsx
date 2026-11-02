import { useId } from 'react';
import { cn } from '@project/components/lib/utils';

// Brand asset set (cream backgrounds blend into the light theme via multiply).
type P = { className?: string };
const base = 'pointer-events-none select-none object-contain mix-blend-multiply';

/** Crisp vector coin — stays sharp at any size. */
export const CoinArt = ({ className }: P) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('shrink-0', className)}>
      <defs>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFC56B" /><stop offset="1" stopColor="#F2603F" />
        </linearGradient>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE3A3" /><stop offset="1" stopColor="#FF8A4C" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="17" r="14" fill="#C9482E" opacity=".35" />
      <circle cx="16" cy="16" r="14" fill={`url(#r${id})`} />
      <circle cx="16" cy="16" r="10.5" fill={`url(#f${id})`} stroke="#fff" strokeOpacity=".55" strokeWidth="1" />
      <path d="M11 12.5h10a1.5 1.5 0 0 1 1.5 1.5v4.5a1.5 1.5 0 0 1-1.5 1.5h-5.5l-3 2.5v-2.5H11a1.5 1.5 0 0 1-1.5-1.5V14a1.5 1.5 0 0 1 1.5-1.5Z" fill="#fff" />
      <ellipse cx="11.5" cy="9.5" rx="4" ry="2" fill="#fff" opacity=".45" transform="rotate(-30 11.5 9.5)" />
    </svg>
  );
};
export const GiftArt = ({ className }: P) => (
  <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/qpMXWb6RkbSvNDkWSGwMd2/img_A6eSpS-SIIFB3NMT.jpg" alt="" loading="lazy" decoding="async" draggable={false} className={cn(base, className)} />
);
export const WaitArt = ({ className }: P) => (
  <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/5bfN7Pmu4v5e9aoPXj5caf/img_9A5KImYpTQxoB5wx.jpg" alt="" loading="lazy" decoding="async" draggable={false} className={cn(base, className)} />
);
export const ChatsArt = ({ className }: P) => (
  <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/rbhANjU4nrBpp2nUMufJGt/img_HwwZD5346FBnuSVF.jpg" alt="" loading="lazy" decoding="async" draggable={false} className={cn(base, className)} />
);
