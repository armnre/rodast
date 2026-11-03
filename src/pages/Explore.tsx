import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Hash, TrendingUp, X, SearchX } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { explore, userAction, type ExploreOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { cn } from '@project/components/lib/utils';
import AvatarImg from '../components/AvatarImg';
import FeedList, { Empty } from '../components/social/FeedList';
import { tok } from '../lib/session';
import { fa } from '../lib/me';
import { onErr, useFeed } from '../lib/social';

type U = ExploreOutputType['users'][number];

function UserRow({ u }: { u: U }) {
  const [f, setF] = useState(u.iFollow);
  const toggle = async () => {
    setF(!f);
    try { await userAction({ token: tok(), username: u.username, action: f ? 'unfollow' : 'follow' }); } catch (e) { setF(f); onErr(e); }
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Link to={`/u/${u.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <AvatarImg id={u.avatar} name={u.displayName} className="size-11 ring-2" />
        <div className="min-w-0">
          <div className="truncate font-bold">{u.displayName}</div>
          <div className="truncate text-sm text-muted-foreground" dir="ltr">@{u.username}</div>
          {u.bio && <div className="truncate text-sm">{u.bio}</div>}
        </div>
      </Link>
      <Button size="sm" onClick={toggle} variant={f ? 'outline' : 'default'} className={cn('rounded-full px-4 font-bold', !f && 'bg-foreground text-background hover:bg-foreground/90')}>
        {f ? 'دنبال می‌کنی' : 'دنبال کن'}
      </Button>
    </div>
  );
}

function Results({ q }: { q: string }) {
  const tag = q.startsWith('#') ? q.slice(1) : '';
  const [users, setUsers] = useState<U[] | null>(null);
  const posts = useFeed(tag ? { mode: 'hashtag', q: tag } : { mode: 'search', q });
  useEffect(() => {
    if (tag) { setUsers([]); return; }
    setUsers(null);
    explore({ token: tok(), q }).then((r) => setUsers(r.users)).catch(onErr);
  }, [q, tag]);
  return (
    <div>
      {!tag && users && users.length > 0 && (
        <section className="border-b border-border/60 pb-2">
          <h2 className="px-4 pt-4 text-sm font-black text-muted-foreground">آدم‌ها</h2>
          {users.slice(0, 5).map((u) => <UserRow key={u.id} u={u} />)}
        </section>
      )}
      <h2 className="px-4 pt-4 text-sm font-black text-muted-foreground">{tag ? `پست‌های #${tag}` : 'پست‌ها'}</h2>
      <FeedList feed={posts} empty={<Empty icon={SearchX} title="چیزی پیدا نشد" text="یه کلمه‌ی دیگه رو امتحان کن." />} />
    </div>
  );
}

function Discover({ setQ }: { setQ: (q: string) => void }) {
  const [data, setData] = useState<ExploreOutputType | null>(null);
  const hot = useFeed({ mode: 'foryou' });
  useEffect(() => { explore({ token: tok() }).then(setData).catch(onErr); }, []);
  return (
    <div>
      <section className="px-4 pt-4">
        <h2 className="mb-2 flex items-center gap-2 text-base font-black"><TrendingUp className="size-5 text-primary" /> ترندهای این هفته</h2>
        {!data ? <div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}</div>
          : data.trends.length === 0 ? <p className="text-sm text-muted-foreground">هنوز هشتگ داغی نیست. با # یه موضوع رو شروع کن!</p>
            : <div className="flex flex-wrap gap-2">{data.trends.map((t) => (
              <button key={t.tag} onClick={() => setQ('#' + t.tag)} className="flex items-center gap-1 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-bold transition hover:border-primary/40 active:scale-95">
                <Hash className="size-3.5 text-primary" />{t.tag}<span className="mr-1 text-xs font-medium text-muted-foreground">{fa(t.count)}</span>
              </button>))}</div>}
      </section>
      {data && data.users.length > 0 && (
        <section className="mt-5 border-y border-border/60">
          <h2 className="px-4 pt-4 text-base font-black">آدم‌هایی که شاید بشناسی</h2>
          {data.users.map((u) => <UserRow key={u.id} u={u} />)}
        </section>
      )}
      <h2 className="px-4 pt-5 text-base font-black">پست‌های محبوب</h2>
      <FeedList feed={hot} empty={<p className="text-sm text-muted-foreground">هنوز پستی نیست.</p>} />
    </div>
  );
}

export default function Explore() {
  const [sp, setSp] = useSearchParams();
  const initial = sp.get('tag') ? '#' + sp.get('tag') : sp.get('q') ?? '';
  const [input, setInput] = useState(initial);
  const [q] = useDebounce(input.trim(), 400);
  useEffect(() => { setInput(initial); }, [initial]);
  useEffect(() => {
    const next = new URLSearchParams();
    if (q.startsWith('#') && q.length > 1) next.set('tag', q.slice(1)); else if (q) next.set('q', q);
    setSp(next, { replace: true });
  }, [q, setSp]);

  return (
    <div className="-mx-4 sm:mx-auto sm:max-w-xl">
      <div className="sticky top-14 z-20 bg-background/85 px-4 py-3 backdrop-blur-xl md:top-16">
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="جست‌وجوی آدم‌ها، پست‌ها یا #هشتگ"
            className="h-12 w-full rounded-full border border-border bg-muted/50 pl-11 pr-12 text-[15px] outline-none transition focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10" />
          {input && <button onClick={() => setInput('')} aria-label="پاک کردن" className="absolute left-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-muted-foreground/20"><X className="size-4" /></button>}
        </div>
      </div>
      {q.length >= 2 ? <Results key={q} q={q} /> : <Discover setQ={setInput} />}
    </div>
  );
}
