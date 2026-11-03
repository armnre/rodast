import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageBoundary from './PageBoundary';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Compass, Plus, Bell, UserRound, WifiOff, Sparkles } from 'lucide-react';
import { getNotifications } from 'zitejs/api';
import { tok } from '../lib/session';
import { cn } from '@project/components/lib/utils';
import { Logo } from './Logo';
import { fa, useMe } from '../lib/me';
import InstallPrompt from './InstallPrompt';
import { CoinArt } from './Art';
import AvatarImg from './AvatarImg';

function useNav() {
  const { me } = useMe();
  return [
    { to: '/feed', label: 'فید', icon: HomeIcon },
    { to: '/explore', label: 'کشف', icon: Compass },
    { to: '/', label: 'جواب بده', icon: Sparkles },
    { to: '/notifications', label: 'اعلان‌ها', icon: Bell },
    { to: `/u/${me?.profile?.username ?? ''}`, label: 'پروفایل', icon: UserRound },
  ];
}

function useUnread() {
  const [n, setN] = useState(0);
  const loc = useLocation();
  useEffect(() => {
    let alive = true;
    const pull = () => getNotifications({ token: tok(), countOnly: true }).then((r) => alive && setN(r.unread)).catch(() => {});
    pull();
    const t = setInterval(pull, 60000);
    const clear = () => setN(0);
    window.addEventListener('rd:notif-read', clear);
    return () => { alive = false; clearInterval(t); window.removeEventListener('rd:notif-read', clear); };
  }, [loc.pathname]);
  return n;
}

function Dot({ n }: { n: number }) {
  if (!n) return null;
  return <span className="absolute -top-0.5 left-1/2 ml-1 min-w-[18px] rounded-full bg-primary px-1 text-center text-[10px] font-black leading-[18px] text-primary-foreground ring-2 ring-card">{n > 99 ? '۹۹+' : fa(n)}</span>;
}

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}

function Balance({ bal }: { bal: number }) {
  return (
    <Link to="/invite" className={cn('flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-black tabular-nums transition active:scale-95',
      bal > 0 ? 'bg-accent/10 text-accent ring-1 ring-accent/25' : 'bg-destructive/10 text-destructive ring-1 ring-destructive/30')}>
      <CoinArt className="h-5 w-5" />{bal > 0 ? fa(bal) : 'تموم شد'}
    </Link>
  );
}

function BottomNav({ unread }: { unread: number }) {
  const NAV = useNav();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="mx-auto mb-3 flex w-[calc(100%-1.5rem)] max-w-sm items-center justify-between rounded-full border border-white/60 bg-card/85 p-1.5 shadow-[0_18px_50px_-14px_rgb(120_40_30/0.45),inset_0_1px_0_rgb(255_255_255/0.8)] backdrop-blur-2xl">
        {NAV.map((n) => n.to === '/' ? (
          <NavLink key={n.to} to={n.to} end aria-label={n.label} className="grid flex-1 place-items-center">
            <motion.span whileTap={{ scale: 0.85 }} className="grid size-12 place-items-center rounded-full bg-gradient-brand text-white shadow-lg shadow-primary/40">
              <Sparkles className="size-6" strokeWidth={2.4} />
            </motion.span>
          </NavLink>
        ) : (
          <NavLink key={n.to} to={n.to} end aria-label={n.label} className="relative flex-1">
            {({ isActive }) => (
              <div className={cn('relative flex h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition', isActive ? 'text-primary' : 'text-muted-foreground active:scale-90')}>
                <n.icon className="size-[22px]" strokeWidth={isActive ? 2.5 : 1.9} />
                {n.label}
                {n.to === '/notifications' && <Dot n={unread} />}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Layout() {
  const { me } = useMe();
  const online = useOnline();
  const loc = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [loc.pathname]);
  const bal = me?.quota?.balance ?? 0;
  const NAV = useNav();
  const unread = useUnread();

  return (
    <div className="bg-blobs min-h-[100dvh] pb-28 md:pb-12">
      {!online && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-foreground py-2 text-sm text-background">
          <WifiOff className="h-4 w-4" /> آفلاینی؛ تا برگشتن اینترنت چیزی به‌روز نمی‌شه.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4 md:h-16">
          <Link to="/" className="active:scale-95"><Logo size={30} /></Link>
          <nav className="hidden gap-1 rounded-full border border-border/70 bg-card/70 p-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('relative rounded-full px-4 py-1.5 text-sm font-semibold transition', isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{n.label}{n.to === '/notifications' && <Dot n={unread} />}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/compose" aria-label="پست جدید" className="hidden h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-bold text-foreground transition hover:border-primary/40 active:scale-95 md:flex">
              <Plus className="size-4" />پست
            </Link>
            <Balance bal={bal} />
            <Link to="/profile" aria-label="پروفایل" className="rounded-full transition active:scale-90">
              <AvatarImg id={me?.profile?.avatar} name={me?.profile?.displayName ?? '?'} className="size-9 ring-2 ring-primary/30" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
          <PageBoundary><Outlet /></PageBoundary>
        </motion.div>
      </main>
      <BottomNav unread={unread} />
      <InstallPrompt />
    </div>
  );
}
