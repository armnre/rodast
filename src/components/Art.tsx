import { cn } from '@project/components/lib/utils';

// Brand 3D asset set (cream backgrounds blend into the light theme via multiply).
type P = { className?: string };
const base = 'pointer-events-none select-none object-contain mix-blend-multiply';

export const CoinArt = ({ className }: P) => (
  <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/oB3DNKSp5MEFWaD6F6mmwx/img_2nZywrqa3iAVmpz5.jpg" alt="" loading="lazy" decoding="async" draggable={false} className={cn(base, 'scale-125', className)} />
);
export const GiftArt = ({ className }: P) => (
  <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/qpMXWb6RkbSvNDkWSGwMd2/img_A6eSpS-SIIFB3NMT.jpg" alt="" loading="lazy" decoding="async" draggable={false} className={cn(base, className)} />
);
export const WaitArt = ({ className }: P) => (
  <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/5bfN7Pmu4v5e9aoPXj5caf/img_9A5KImYpTQxoB5wx.jpg" alt="" loading="lazy" decoding="async" draggable={false} className={cn(base, className)} />
);
export const ChatsArt = ({ className }: P) => (
  <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/rbhANjU4nrBpp2nUMufJGt/img_HwwZD5346FBnuSVF.jpg" alt="" loading="lazy" decoding="async" draggable={false} className={cn(base, className)} />
);
