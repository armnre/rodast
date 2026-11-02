import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { MessageSquareHeart, History, Gift, UserRound, WifiOff } from 'lucide-react';
import { cn } from '@project/components/lib/utils';
import { Logo } from './Logo';
import { fa, useMe } from '../lib/me';
import InstallPrompt from './InstallPrompt';
import { CoinArt } from './Art';
import AvatarImg from './AvatarImg';

const NAV = [
  { to: '/', label: 'جواب بساز', icon: MessageSquareHeart },
  { to: '/history', label: 'تاریخچه', icon: History },
  { to: '/invite', label: 'دعوت', icon: Gift },
  { to: '/profile', label: 'پروفایل', icon: UserRound },
];

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

function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="mx-auto mb-3 flex w-[calc(100%-1.5rem)] max-w-sm items-center justify-between gap-1 rounded-full border border-white/60 bg-card/80 p-1.5 shadow-[0_18px_50px_-14px_rgb(120_40_30/0.45),inset_0_1px_0_rgb(255_255_255/0.8)] backdrop-blur-2xl">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end className="relative flex-1">
            {({ isActive }) => (
              <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                className={cn('relative flex h-12 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-bold', isActive ? 'text-primary-foreground' : 'text-muted-foreground active:scale-90')}>
                {isActive && <motion.span layoutId="dock" className="absolute inset-0 rounded-full bg-gradient-brand shadow-lg shadow-primary/40" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <n.icon className="relative size-[22px] shrink-0" strokeWidth={isActive ? 2.4 : 1.9} />
                <AnimatePresence initial={false}>
                  {isActive && <motion.span key="l" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="relative overflow-hidden whitespace-nowrap">{n.label}</motion.span>}
                </AnimatePresence>
              </motion.div>
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

  return (
    <div className="bg-blobs min-h-[100dvh] pb-28 md:pb-12">
      {!online && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-foreground py-2 text-sm text-background">
          <WifiOff className="h-4 w-4" /> آفلاینی؛ ساختن جواب فعلاً ممکن نیست.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4 md:h-16">
          <Link to="/" className="active:scale-95"><Logo size={30} /></Link>
          <nav className="hidden gap-1 rounded-full border border-border/70 bg-card/70 p-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('rounded-full px-4 py-1.5 text-sm font-semibold transition', isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Balance bal={bal} />
            <Link to="/profile" aria-label="پروفایل" className="rounded-full transition active:scale-90">
              <AvatarImg id={me?.profile?.avatar} name={me?.profile?.displayName ?? '?'} className="size-9 ring-2 ring-primary/30" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
