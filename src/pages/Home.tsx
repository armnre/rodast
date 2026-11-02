import { tok } from '../lib/session';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, PartyPopper, RefreshCw, ClipboardPaste, X, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { generateReplies } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { cn } from '@project/components/lib/utils';
import { SITUATIONS, TONES, RELATIONSHIPS, LENGTHS, MAX_INPUT } from '../shared/options';
import { errMsg, fa, useMe, type Quota } from '../lib/me';
import ReplyCard from '../components/ReplyCard';
import LimitedPanel from '../components/LimitedPanel';
import OptionIcon from '../components/OptionIcon';

type Item = { id: string; label: string };

function Tiles({ items, value, onChange }: { items: readonly Item[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
      {items.map((i) => {
        const on = value === i.id;
        return (
          <motion.button key={i.id} type="button" whileTap={{ scale: 0.94 }} onClick={() => onChange(i.id)}
            className={cn('relative flex w-[5.5rem] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs font-bold transition sm:w-auto',
              on ? 'border-primary/70 bg-primary/10 text-foreground glow' : 'border-white/[0.07] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground')}>
            <OptionIcon id={i.id} />
            <span className="leading-5">{i.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function Pills({ items, value, onChange, optional }: { items: readonly Item[]; value?: string; onChange: (v?: string) => void; optional?: boolean }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {items.map((i) => {
        const on = value === i.id;
        return (
          <button key={i.id} type="button" onClick={() => onChange(on && optional ? undefined : i.id)}
            className={cn('flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pl-3.5 pr-1.5 text-sm font-medium transition',
              on ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground')}>
            <OptionIcon id={i.id} size="sm" className={cn(!on && 'opacity-80')} />
            {i.label}
          </button>
        );
      })}
    </div>
  );
}

function Seg({ items, value, onChange }: { items: readonly Item[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
      {items.map((i) => (
        <button key={i.id} type="button" onClick={() => onChange(i.id)} className="relative rounded-xl py-2 text-sm font-bold">
          {value === i.id && <motion.span layoutId="seg" className="absolute inset-0 rounded-xl bg-secondary" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
          <span className={cn('relative', value === i.id ? 'text-secondary-foreground' : 'text-muted-foreground')}>{i.label}</span>
        </button>
      ))}
    </div>
  );
}

const Label = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <div className="mb-3 flex items-center gap-2 text-sm font-black">
    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] text-xs text-muted-foreground">{n}</span>{children}
  </div>
);

export default function Home() {
  const { me, setQuota } = useMe();
  const [text, setText] = useState('');
  const [situation, setSituation] = useState('flirt');
  const [tone, setTone] = useState('funny');
  const [relationship, setRelationship] = useState<string | undefined>();
  const [length, setLength] = useState('short');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ replies: string[]; tone: string } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const balance = me?.quota?.balance ?? 0;

  const paste = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) setText(t.slice(0, MAX_INPUT)); } catch { toast('اجازه‌ی دسترسی به کلیپ‌بورد داده نشد'); }
  };

  const run = async (opts: { tone?: string; regenerate?: boolean } = {}) => {
    const t = text.trim();
    if (t.length < 2) { toast.error('اول پیام یا موقعیت رو بنویس.'); return; }
    if (!navigator.onLine) { toast.error('آفلاینی؛ وصل شو و دوباره امتحان کن.'); return; }
    const useTone = opts.tone ?? tone;
    if (opts.tone) setTone(opts.tone);
    setBusy(true);
    (document.activeElement as HTMLElement | null)?.blur();
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    const key = crypto.randomUUID();
    const call = () => generateReplies({ token: tok(), text: t, situation, tone: useTone, relationship, length, idempotencyKey: key, isRegenerate: opts.regenerate });
    try {
      let res;
      try { res = await call(); } catch (e) {
        if (!(e as { userFacingMessage?: string }).userFacingMessage) res = await call(); else throw e;
      }
      setResult({ replies: res.replies, tone: res.tone ?? useTone });
      setQuota(res.quota as Quota);
      navigator.vibrate?.([10, 40, 10]);
    } catch (e) {
      toast.error(errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 pb-4 md:space-y-8">
      <section className="pt-3 text-center md:pt-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-muted-foreground">
          <Coins className="h-3.5 w-3.5 text-accent" /> {fa(balance)} جواب داری
        </motion.div>
        <h1 className="text-[2.1rem] font-black leading-tight sm:text-5xl">جواب <span className="text-gradient">چی بدیم؟</span></h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">پیامتو بده، یه جواب رو‌دست‌خور بگیر.</p>
      </section>

      {balance <= 0 ? <LimitedPanel /> : (
        <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={(e) => { e.preventDefault(); run(); }}
          className="card-soft space-y-7 p-4 sm:p-6 md:p-8">
          <div>
            <Label n="۱">طرف چی گفته؟</Label>
            <div className="relative rounded-2xl border border-white/10 bg-background/60 transition focus-within:border-primary/60 focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]">
              <textarea value={text} maxLength={MAX_INPUT} onChange={(e) => setText(e.target.value)} rows={4}
                placeholder="مثلاً: «باشه هر جور راحتی...»"
                className="block w-full resize-none bg-transparent p-4 pb-12 text-base leading-7 outline-none placeholder:text-muted-foreground/60" />
              <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between">
                <span className="text-xs tabular-nums text-muted-foreground">{fa(text.length)}/{fa(MAX_INPUT)}</span>
                {text
                  ? <button type="button" onClick={() => setText('')} className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-muted-foreground"><X className="h-3.5 w-3.5" />پاک کن</button>
                  : <button type="button" onClick={paste} className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-bold text-foreground"><ClipboardPaste className="h-3.5 w-3.5" />چسباندن</button>}
              </div>
            </div>
          </div>
          <div><Label n="۲">موقعیت</Label><Tiles items={SITUATIONS} value={situation} onChange={setSituation} /></div>
          <div><Label n="۳">لحن جواب</Label><Pills items={TONES} value={tone} onChange={(v) => v && setTone(v)} /></div>
          <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-start">
            <div><Label n="۴">طرف کیه؟ <span className="font-normal text-muted-foreground">(اختیاری)</span></Label><Pills items={RELATIONSHIPS} value={relationship} onChange={setRelationship} optional /></div>
            <div className="md:w-64"><Label n="۵">طول جواب</Label><Seg items={LENGTHS} value={length} onChange={setLength} /></div>
          </div>

          <div className="sticky bottom-[5.5rem] z-20 -mx-1 md:static md:mx-0">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button type="submit" disabled={busy} className="h-14 w-full rounded-2xl bg-gradient-brand text-lg font-black text-white shadow-xl shadow-primary/40 hover:opacity-95">
                {busy ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <Sparkles className="ml-2 h-5 w-5" />}
                {busy ? 'دارم یه چیز توپ می‌سازم...' : 'جوابشو بساز'}
              </Button>
            </motion.div>
          </div>
          <p className="-mt-3 text-center text-xs text-muted-foreground">هر بار ساختن یه اعتبار مصرف می‌کنه؛ اگه خطا بخوره کم نمی‌شه.</p>
        </motion.form>
      )}

      <div ref={resultsRef} className="scroll-mt-20">
        {busy && !result && (
          <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-3xl bg-white/[0.05]" />)}</div>
        )}
        {result && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black"><PartyPopper className="h-6 w-6 text-accent" />اینم جواب‌هات!</h2>
                <p className="text-sm text-muted-foreground">روی هر جواب بزنی کپی می‌شه.</p>
              </div>
              <Button variant="outline" className="rounded-full" disabled={busy || balance <= 0} onClick={() => run({ tone: result.tone, regenerate: true })}>
                <RefreshCw className={cn('ml-1 h-4 w-4', busy && 'animate-spin')} />سه تای جدید
              </Button>
            </div>
            <div className={cn('grid gap-4 md:grid-cols-3', busy && 'pointer-events-none opacity-50')}>
              {result.replies.map((r, i) => (
                <ReplyCard key={`${r}-${i}`} text={r} tone={result.tone} index={i} disabled={busy || balance <= 0}
                  onRegenerate={() => run({ tone: result.tone, regenerate: true })} onChangeTone={(t) => run({ tone: t, regenerate: true })} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
