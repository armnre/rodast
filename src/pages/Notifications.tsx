import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageCircle, Repeat2, Quote, UserPlus, AtSign, Loader2 } from 'lucide-react';
import { getNotifications, type GetNotificationsOutputType } from 'zitejs/api';
import { cn } from '@project/components/lib/utils';
import AvatarImg from '../components/AvatarImg';
import { Empty, PostSkeleton } from '../components/social/FeedList';
import { tok } from '../lib/session';
import { onErr, timeAgo } from '../lib/social';

type N = GetNotificationsOutputType['items'][number];
const KIND: Record<string, { icon: typeof Heart; text: string; color: string }> = {
  Like: { icon: Heart, text: 'پستت رو پسندید', color: 'text-primary bg-primary/10' },
  Reply: { icon: MessageCircle, text: 'بهت پاسخ داد', color: 'text-sky-600 bg-sky-500/10' },
  Repost: { icon: Repeat2, text: 'پستت رو بازنشر کرد', color: 'text-accent bg-accent/10' },
  Quote: { icon: Quote, text: 'پستت رو نقل‌قول کرد', color: 'text-accent bg-accent/10' },
  Follow: { icon: UserPlus, text: 'دنبالت کرد', color: 'text-violet-600 bg-violet-500/10' },
  Mention: { icon: AtSign, text: 'بهت اشاره کرد', color: 'text-amber-600 bg-amber-500/10' },
};

function Row({ n }: { n: N }) {
  const nav = useNavigate();
  const k = KIND[n.kind] ?? KIND.Like;
  const go = () => nav(n.kind === 'Follow' || !n.postId ? `/u/${n.actor.username}` : `/post/${n.postId}`);
  return (
    <button onClick={go} className={cn('flex w-full gap-3 border-b border-border/60 px-4 py-3.5 text-right transition hover:bg-muted/30', !n.read && 'bg-primary/[0.04]')}>
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', k.color)}><k.icon className="size-[18px]" /></span>
      <div className="min-w-0 flex-1">
        <Link to={`/u/${n.actor.username}`} onClick={(e) => e.stopPropagation()}>
          <AvatarImg id={n.actor.avatar} name={n.actor.displayName} className="size-8 ring-0" />
        </Link>
        <p className="mt-1.5 text-[15px]"><b className="font-bold">{n.actor.displayName}</b> {k.text} <span className="text-sm text-muted-foreground">· {timeAgo(n.createdAt)}</span></p>
        {n.postBody && n.kind !== 'Follow' && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.postBody}</p>}
      </div>
      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
    </button>
  );
}

export default function Notifications() {
  const [items, setItems] = useState<N[] | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getNotifications({ token: tok(), markRead: true }).then((r) => {
      setItems(r.items); setMore(r.hasMore);
      window.dispatchEvent(new Event('rd:notif-read'));
    }).catch(onErr);
  }, []);

  const loadMore = async () => {
    setBusy(true);
    try { const r = await getNotifications({ token: tok(), offset: items?.length ?? 0 }); setItems((x) => [...(x ?? []), ...r.items]); setMore(r.hasMore); }
    catch (e) { onErr(e); } finally { setBusy(false); }
  };

  return (
    <div className="-mx-4 sm:mx-auto sm:max-w-xl">
      <h1 className="px-4 py-4 text-xl font-black">اعلان‌ها</h1>
      {!items ? [0, 1, 2].map((i) => <PostSkeleton key={i} />) : items.length === 0
        ? <div className="py-16"><Empty icon={Bell} title="فعلاً خبری نیست" text="وقتی کسی پستت رو پسندید، جواب داد یا دنبالت کرد، اینجا می‌بینی." /></div>
        : <>
          {items.map((n) => <Row key={n.id} n={n} />)}
          {more && <button onClick={loadMore} disabled={busy} className="w-full py-4 text-sm font-bold text-primary">{busy ? <Loader2 className="mx-auto size-5 animate-spin" /> : 'بیشتر'}</button>}
        </>}
    </div>
  );
}
