import { tok } from '../lib/session';
import { useEffect, useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getHistory, deleteHistory, type GetHistoryOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@project/components/ui/alert-dialog';
import { SITUATIONS, TONES, labelOf } from '../shared/options';
import { errMsg, faDate } from '../lib/me';
import { ChatsArt } from '../components/Art';

type Item = GetHistoryOutputType['items'][0];

export default function History() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (offset = 0) => {
    const r = await getHistory({ token: tok(),  offset });
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

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black">تاریخچه</h1><p className="text-sm text-muted-foreground">فقط خودت می‌بینیش؛ هر وقت خواستی پاکش کن.</p></div>
        {!!items?.length && (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full">پاک کردن همه</Button></AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader><AlertDialogTitle>کل تاریخچه پاک بشه؟</AlertDialogTitle><AlertDialogDescription>متن پیام‌ها و جواب‌ها برای همیشه حذف می‌شن.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter className="gap-2"><AlertDialogCancel>نه</AlertDialogCancel><AlertDialogAction onClick={() => remove()}>پاک کن</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {!items ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />) : items.length === 0 ? (
        <div className="card-soft flex flex-col items-center p-8 text-center text-muted-foreground"><ChatsArt className="h-36 w-36" /><p className="mt-2">هنوز جوابی نساختی. برو سراغ «جواب بساز»!</p></div>
      ) : items.map((it) => (
        <div key={it.id} className="card-soft p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{faDate(it.createdAt, true)} · {labelOf(SITUATIONS, it.situation)} · {labelOf(TONES, it.tone)}</div>
              <p className="mt-1 line-clamp-2 font-bold">«{it.text}»</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(it.id)} aria-label="حذف"><Trash2 className="h-4 w-4" /></Button>
          </div>
          <ul className="mt-3 space-y-2">
            {it.replies.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-2xl bg-muted/60 px-4 py-2.5 text-sm">
                <span>{r}</span>
                <button onClick={() => { navigator.clipboard.writeText(r); toast.success('کپی شد'); }} aria-label="کپی"><Copy className="h-4 w-4 text-muted-foreground" /></button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {hasMore && (
        <Button variant="outline" className="w-full rounded-2xl" disabled={loadingMore} onClick={async () => { setLoadingMore(true); await load(items?.length ?? 0).catch(() => {}); setLoadingMore(false); }}>
          بیشتر
        </Button>
      )}
    </div>
  );
}
