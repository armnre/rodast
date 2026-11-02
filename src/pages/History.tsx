import { tok } from '../lib/session';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Trash2, Search, Loader2, Check, MessageSquareText, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteHistory, type GetHistoryOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Skeleton } from '@project/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@project/components/ui/alert-dialog';
import { cn } from '@project/components/lib/utils';
import { SITUATIONS, TONES, labelOf } from '../shared/options';
import { errMsg, fa, faDate } from '../lib/me';

type Item = GetHistoryOutputType['items'][0];

const dayKey = (iso: string) => {
  const d = new Date(iso), t = new Date();
  const diff = Math.floor((new Date(t.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 864e5);
  return diff === 0 ? 'امروز' : diff === 1 ? 'دیروز' : diff < 7 ? 'این هفته' : faDate(iso);
};

export default function History() {
  const nav = useNavigate();
  const [items, setItems] = useState<Item[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState('');
  const [tone, setTone] = useState('');

  const load = async (offset = 0) => {
    const r = await getHistory({ token: tok(), offset });
    setItems((prev) => (offset ? [...(prev ?? []), ...r.items] : r.items));
    setHasMore(r.hasMore);
  };
  useEffect(() => { load().catch((e) => { toast.error(errMsg(e)); setItems([]); }); }, []);

  const remove = async (id?: string) => {
    const before = items;
    setItems(id ? (items ?? []).filter((i) => i.id !== id) : []);
    try { await deleteHistory(id ? { token: tok(), id } : { token: tok(), all: true }); toast.success('پاک شد'); }
    catch (e) { setItems(before); toast.error(errMsg(e)); }
  };

  const tonesUsed = useMemo(() => [...new Set((items ?? []).map((i) => i.tone))], [items]);
  const groups = useMemo(() => {
    const s = q.trim();
    const list = (items ?? []).filter((i) => (!tone || i.tone === tone) && (!s || i.text.includes(s) || i.replies.some((r) => r.includes(s))));
    const m = new Map<string, Item[]>();
    list.forEach((i) => { const k = dayKey(i.createdAt); m.set(k, [...(m.get(k) ?? []), i]); });
    return [...m.entries()];
  }, [items, q, tone]);
  const totalReplies = (items ?? []).reduce((s, i) => s + i.replies.length, 0);

  return (
    <div className="space-y-5 pt-2">
      <div className="card-soft overflow-hidden">
        <div className="relative">
          <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/iFen8Zgbs9ByVhqesogWqm/img_avIPvJLpu9-Nm5f_.jpg" alt="" className="aspect-[16/6] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        </div>
        <div className="-mt-8 flex flex-wrap items-end justify-between gap-3 px-5 pb-5 sm:px-6">
          <div className="relative">
            <h1 className="font-display text-2xl sm:text-3xl">تاریخچه</h1>
            <p className="text-sm text-muted-foreground">فقط خودت می‌بینیش؛ هر وقت خواستی پاکش کن.</p>
          </div>
          {!!items?.length && (
            <div className="flex gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-bold text-secondary-foreground"><CalendarDays className="size-3.5" />{fa(items.length)} پیام</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 font-bold text-accent"><MessageSquareText className="size-3.5" />{fa(totalReplies)} جواب</span>
            </div>
          )}
        </div>
      </div>

      {!!items?.length && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو توی پیام‌ها و جواب‌ها…" className="h-11 rounded-xl bg-card pr-9" />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="h-11 rounded-xl text-destructive"><Trash2 className="size-4 sm:ml-2" /><span className="hidden sm:inline">پاک کردن همه</span></Button></AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader><AlertDialogTitle>کل تاریخچه پاک بشه؟</AlertDialogTitle><AlertDialogDescription>متن پیام‌ها و جواب‌ها برای همیشه حذف می‌شن.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter className="gap-2"><AlertDialogCancel>نه</AlertDialogCancel><AlertDialogAction onClick={() => remove()} className="bg-destructive text-destructive-foreground">پاک کن</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {tonesUsed.length > 1 && (
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              <Chip on={!tone} onClick={() => setTone('')}>همه</Chip>
              {tonesUsed.map((t) => <Chip key={t} on={tone === t} onClick={() => setTone(t)}>{labelOf(TONES, t)}</Chip>)}
            </div>
          )}
        </div>
      )}

      {!items ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />) : items.length === 0 ? (
        <div className="card-soft flex flex-col items-center p-8 text-center">
          <p className="font-display text-lg">هنوز جوابی نساختی</p>
          <p className="mt-1 text-sm text-muted-foreground">اولین پیام رو بده تا رودستی‌ترین جواب‌ها اینجا جمع بشن.</p>
          <Button onClick={() => nav('/')} className="mt-4 rounded-xl bg-gradient-brand">بریم جواب بسازیم</Button>
        </div>
      ) : groups.length === 0 ? (
        <p className="card-soft p-8 text-center text-sm text-muted-foreground">چیزی پیدا نشد.</p>
      ) : groups.map(([day, list]) => (
        <section key={day} className="space-y-3">
          <h3 className="sticky top-14 z-10 inline-block rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-muted-foreground backdrop-blur">{day}</h3>
          <AnimatePresence initial={false}>
            {list.map((it) => <Card key={it.id} it={it} onDelete={() => remove(it.id)} />)}
          </AnimatePresence>
        </section>
      ))}

      {hasMore && (
        <Button variant="outline" className="h-11 w-full rounded-2xl" disabled={loadingMore} onClick={async () => { setLoadingMore(true); await load(items?.length ?? 0).catch(() => {}); setLoadingMore(false); }}>
          {loadingMore && <Loader2 className="ml-2 size-4 animate-spin" />}نمایش بیشتر
        </Button>
      )}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn('shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition', on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/40')}>{children}</button>;
}

function Card({ it, onDelete }: { it: Item; onDelete: () => void }) {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = (r: string, i: number) => { navigator.clipboard.writeText(r); setCopied(i); toast.success('کپی شد'); setTimeout(() => setCopied(null), 1200); };
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="card-soft p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{labelOf(SITUATIONS, it.situation)}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{labelOf(TONES, it.tone)}</span>
            <span className="px-1 py-0.5 font-normal text-muted-foreground">{faDate(it.createdAt, true)}</span>
          </div>
          <p className="mt-2 line-clamp-2 border-r-2 border-primary/40 pr-3 font-bold leading-7">{it.text}</p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 rounded-xl text-muted-foreground" onClick={onDelete} aria-label="حذف"><Trash2 className="size-4" /></Button>
      </div>
      <ul className="mt-3 space-y-2">
        {it.replies.map((r, i) => (
          <li key={i}>
            <button onClick={() => copy(r, i)} className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-right text-sm leading-7 transition hover:bg-secondary/70">
              <span>{r}</span>
              {copied === i ? <Check className="size-4 shrink-0 text-accent" /> : <Copy className="size-4 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />}
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
