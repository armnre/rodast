import {
  HeartHandshake, Camera, Snowflake, LifeBuoy, MessageCircleMore, Briefcase, PenLine,
  Laugh, Flame, Crown, Glasses, HandHeart, Drama, Zap, HandMetal, Flower2,
  Sparkle, UserPlus, Heart, Users, HeartCrack, Building2, House, type LucideIcon,
} from 'lucide-react';
import { cn } from '@project/components/lib/utils';

const ICONS: Record<string, { icon: LucideIcon; hue: string }> = {
  // situations
  flirt: { icon: HeartHandshake, hue: 'from-pink-500 to-rose-500' },
  story: { icon: Camera, hue: 'from-fuchsia-500 to-orange-400' },
  cold: { icon: Snowflake, hue: 'from-sky-400 to-cyan-500' },
  rescue: { icon: LifeBuoy, hue: 'from-amber-400 to-red-500' },
  start: { icon: MessageCircleMore, hue: 'from-violet-500 to-indigo-500' },
  formal: { icon: Briefcase, hue: 'from-slate-400 to-slate-600' },
  custom: { icon: PenLine, hue: 'from-lime-400 to-emerald-500' },
  // tones
  funny: { icon: Laugh, hue: 'from-yellow-400 to-orange-500' },
  naughty: { icon: Flame, hue: 'from-pink-500 to-purple-600' },
  classy: { icon: Crown, hue: 'from-amber-300 to-yellow-600' },
  cool: { icon: Glasses, hue: 'from-zinc-400 to-zinc-700' },
  warm: { icon: HandHeart, hue: 'from-orange-400 to-pink-500' },
  sarcastic: { icon: Drama, hue: 'from-teal-400 to-cyan-600' },
  bold: { icon: Zap, hue: 'from-lime-400 to-green-600' },
  polite: { icon: HandMetal, hue: 'from-sky-400 to-blue-600' },
  romantic: { icon: Flower2, hue: 'from-rose-400 to-red-600' },
  // relationships
  crush: { icon: Sparkle, hue: 'from-pink-400 to-fuchsia-600' },
  new: { icon: UserPlus, hue: 'from-violet-400 to-purple-600' },
  partner: { icon: Heart, hue: 'from-red-400 to-rose-600' },
  friend: { icon: Users, hue: 'from-cyan-400 to-blue-500' },
  ex: { icon: HeartCrack, hue: 'from-zinc-400 to-zinc-600' },
  colleague: { icon: Building2, hue: 'from-slate-400 to-indigo-500' },
  family: { icon: House, hue: 'from-amber-400 to-orange-600' },
};

export const hasIcon = (id: string) => id in ICONS;

export default function OptionIcon({ id, size = 'md', className }: { id: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const it = ICONS[id];
  if (!it) return null;
  const box = size === 'sm' ? 'h-6 w-6 rounded-lg' : size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-9 w-9 rounded-xl';
  const ic = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-[18px] w-[18px]';
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center bg-gradient-to-br text-white shadow-lg shadow-black/30 ring-1 ring-white/20', it.hue, box, className)}>
      <it.icon className={ic} strokeWidth={2.2} />
    </span>
  );
}
