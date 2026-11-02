import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@project/components/lib/utils';
import { AVATARS } from '../shared/avatars';

export default function AvatarPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((a) => {
        const on = a.id === value;
        return (
          <motion.button key={a.id} type="button" whileTap={{ scale: 0.92 }} onClick={() => onChange(on ? '' : a.id)}
            className={cn('group relative aspect-square overflow-hidden rounded-2xl ring-2 transition', on ? 'ring-primary shadow-lg shadow-primary/30' : 'ring-transparent hover:ring-border')}
            aria-label={a.label} aria-pressed={on}>
            <img src={a.url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
            {on && <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" /></span>}
          </motion.button>
        );
      })}
    </div>
  );
}
