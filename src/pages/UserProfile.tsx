import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Ban, Flag, MoreHorizontal, Settings, Bookmark, UserX, FileText, MessageCircle, ImageIcon, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getUserProfile, userAction, type GetUserProfileOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@project/components/ui/dropdown-menu';
import { cn } from '@project/components/lib/utils';
import AvatarImg from '../components/AvatarImg';
import RichText from '../components/social/RichText';
import FeedList, { Empty } from '../components/social/FeedList';
import { tok } from '../lib/session';
import { fa, faDate } from '../lib/me';
import { compact, onErr, useFeed } from '../lib/social';

type Prof = GetUserProfileOutputType;

function FollowButton({ p, set }: { p: Prof; set: (p: Prof) => void }) {
  const [hover, setHover] = useState(false);
  const toggle = async () => {
    const next = !p.iFollow;
    set({ ...p, iFollow: next, followers: p.followers + (next ? 1 : -1) });
    try { await userAction({ token: tok(), username: p.username, action: next ? 'follow' : 'unfollow' }); }
    catch (e) { set(p); onErr(e); }
  };
  return (
    <Button onClick={toggle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      variant={p.iFollow ? 'outline' : 'default'}
      className={cn('h-10 min-w-[110px] rounded-full font-bold', !p.iFollow && 'bg-foreground text-background hover:bg-foreground/90', p.iFollow && hover && 'border-destructive/40 text-destructive')}>
      {p.iFollow ? (hover ? 'لغو دنبال' : 'دنبال می‌کنی') : p.followsMe ? 'دنبال‌کردن متقابل' : 'دنبال کن'}
    </Button>
  );
}

function Tabs({ p }: { p: Prof }) {
  const tabs = [
    { id: 'user', label: 'پست‌ها', icon: FileText },
    { id: 'userReplies', label: 'پاسخ‌ها', icon: MessageCircle },
    { id: 'userMedia', label: 'رسانه', icon: ImageIcon },
    ...(p.isMe ? [{ id: 'likes', label: 'پسندیده‌ها', icon: Heart }] : []),
  ] as const;
  const [tab, setTab] = useState<string>('user');
  const feed = useFeed({ mode: tab as 'user', username: p.username });
  const cur = tabs.find((t) => t.id === tab) ?? tabs[0];
  return (
    <>
      <div className="sticky top-14 z-20 flex border-b border-border/60 bg-background/85 backdrop-blur-xl md:top-16">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('relative flex-1 py-3 text-sm font-bold', tab === t.id ? 'text-foreground' : 'text-muted-foreground')}>
            {t.label}{tab === t.id && <motion.span layoutId="ptab" className="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-gradient-brand" />}
          </button>
        ))}
      </div>
      <FeedList feed={feed} empty={<Empty icon={cur.icon} title={`هنوز ${cur.label} نداره`} text={p.isMe ? 'وقتشه یه چیزی منتشر کنی!' : 'بعداً دوباره سر بزن.'} />} />
    </>
  );
}

export default function UserProfile() {
  const { username = '' } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<Prof | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setP(null); setErr(false);
    getUserProfile({ token: tok(), username }).then(setP).catch((e) => { setErr(true); onErr(e); });
  }, [username]);

  const act = async (action: 'block' | 'unblock' | 'report') => {
    if (!p) return;
    try {
      await userAction({ token: tok(), username: p.username, action, reason: action === 'report' ? 'گزارش از پروفایل' : undefined });
      if (action === 'report') toast.success('گزارشت ثبت شد.');
      else { setP({ ...p, iBlocked: action === 'block', iFollow: false }); toast.success(action === 'block' ? 'مسدود شد' : 'از مسدودی دراومد'); }
    } catch (e) { onErr(e); }
  };

  if (err) return <div className="py-20"><Empty icon={UserX} title="کاربر پیدا نشد" text="شاید نام کاربری عوض شده باشه." /></div>;

  return (
    <div className="-mx-4 sm:mx-auto sm:max-w-xl">
      <div className="relative h-36 overflow-hidden bg-gradient-brand sm:h-44 sm:rounded-b-3xl">
        {p?.cover && <img src={p.cover} alt="" className="h-full w-full object-cover" />}
        <button onClick={() => nav(-1)} aria-label="بازگشت" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur"><ArrowRight className="size-5" /></button>
      </div>
      <div className="px-4">
        <div className="-mt-12 flex items-end justify-between">
          {p ? <AvatarImg id={p.avatar} name={p.displayName} className="size-24 ring-4" /> : <Skeleton className="size-24 rounded-full ring-4 ring-card" />}
          {p && (
            <div className="flex items-center gap-2 pb-1">
              {p.isMe ? (
                <>
                  <Button asChild variant="outline" size="icon" className="rounded-full"><Link to="/bookmarks" aria-label="ذخیره‌ها"><Bookmark className="size-4" /></Link></Button>
                  <Button asChild variant="outline" className="h-10 rounded-full font-bold"><Link to="/profile"><Settings className="size-4" /> ویرایش پروفایل</Link></Button>
                </>
              ) : (
                <>
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="rounded-full" aria-label="گزینه‌ها"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl">
                      <DropdownMenuItem onClick={() => act('report')}><Flag /> گزارش کاربر</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => act(p.iBlocked ? 'unblock' : 'block')}><Ban /> {p.iBlocked ? 'رفع مسدودی' : 'مسدود کردن'}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {!p.iBlocked && !p.blockedMe && <FollowButton p={p} set={setP} />}
                </>
              )}
            </div>
          )}
        </div>
        {!p ? <div className="mt-3 space-y-2 pb-4"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-full" /></div> : (
          <div className="mt-3 pb-4">
            <h1 className="text-xl font-black">{p.displayName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span dir="ltr">@{p.username}</span>
              {p.followsMe && !p.isMe && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold">دنبالت می‌کنه</span>}
            </div>
            {p.bio && <RichText text={p.bio} className="mt-3 whitespace-pre-wrap text-[15px] leading-7" />}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {p.vibe && <span>✨ {p.vibe}</span>}
              {p.joinedAt && <span className="flex items-center gap-1"><CalendarDays className="size-4" /> عضو از {faDate(p.joinedAt)}</span>}
            </div>
            <div className="mt-3 flex gap-5 text-sm">
              <span><b className="font-black text-foreground">{compact(p.following)}</b> <span className="text-muted-foreground">دنبال‌شونده</span></span>
              <span><b className="font-black text-foreground">{compact(p.followers)}</b> <span className="text-muted-foreground">دنبال‌کننده</span></span>
              <span><b className="font-black text-foreground">{fa(p.posts)}</b> <span className="text-muted-foreground">پست</span></span>
            </div>
          </div>
        )}
      </div>
      {p && (p.iBlocked || p.blockedMe
        ? <div className="border-t border-border/60 py-14"><Empty icon={Ban} title={p.iBlocked ? 'این کاربر رو مسدود کردی' : 'دسترسی نداری'} text={p.iBlocked ? 'برای دیدن پست‌هاش اول از مسدودی درش بیار.' : 'این کاربر امکان تعامل رو محدود کرده.'} /></div>
        : <Tabs p={p} />)}
    </div>
  );
}
