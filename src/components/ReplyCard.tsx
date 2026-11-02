import { tok } from '../lib/session';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, Wand2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@project/components/ui/dropdown-menu';
import { trackEvent } from 'zitejs/api';
import { TONES } from '../shared/options';
import OptionIcon from './OptionIcon';
import { fa } from '../lib/me';

type Props = { text: string; tone: string; index: number; disabled: boolean; onRegenerate: () => void; onChangeTone: (t: string) => void };
const VIBES = ['امن', 'متعادل', 'جسورانه'];

export default function ReplyCard({ text, tone, index, disabled, onRegenerate, onChangeTone }: Props) {
  const [copied, setCopied] = useState(false);
  const t = TONES.find((x) => x.id === tone);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true); toast.success('کپی شد! حالا بفرستش 😉');
    navigator.vibrate?.(15);
    setTimeout(() => setCopied(false), 1500);
    trackEvent({ token: tok(), event: 'reply_copied', meta: tone }).catch(() => {});
  };
  const share = () => navigator.share?.({ text }).catch(() => {});
  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 220, damping: 22 }}
      className="card-soft group relative flex flex-col overflow-hidden p-4 sm:p-5">
      <div aria-hidden className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <OptionIcon id={tone} size="sm" />{t?.label}
        </span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
          {fa(index + 1)} · {VIBES[index] ?? ''}
        </span>
      </div>
      <button onClick={copy} className="relative mt-4 flex-1 rounded-2xl rounded-tr-md bg-gradient-brand p-4 text-right text-[17px] font-semibold leading-8 text-white shadow-lg shadow-primary/20 transition active:scale-[0.98]">
        {text}
      </button>
      <div className="relative mt-4 grid grid-cols-4 gap-2">
        <Button onClick={copy} className="col-span-2 h-11 rounded-xl bg-accent font-bold text-accent-foreground hover:bg-accent/90">
          {copied ? <Check className="ml-1 h-4 w-4" /> : <Copy className="ml-1 h-4 w-4" />}{copied ? 'کپی شد' : 'کپی'}
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-full rounded-xl" disabled={disabled} onClick={onRegenerate} aria-label="دوباره بساز"><RefreshCw className="h-4 w-4" /></Button>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-full rounded-xl" disabled={disabled} aria-label="تغییر لحن"><Wand2 className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {typeof navigator.share === 'function' && <DropdownMenuItem onClick={share}><Share2 className="ml-2 h-4 w-4" />اشتراک‌گذاری</DropdownMenuItem>}
            {TONES.filter((x) => x.id !== tone).map((x) => (
              <DropdownMenuItem key={x.id} onClick={() => onChangeTone(x.id)} className="gap-2"><OptionIcon id={x.id} size="sm" />{x.label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
