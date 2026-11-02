import { logout } from '../lib/session';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, MessageSquareHeart, History, Gift, UserRound, Shield, LogOut, FileText, WifiOff } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@project/components/ui/sheet';
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
      <div className="mx-3 mb-2 grid grid-cols-4 rounded-[1.6rem] border border-border/80 bg-card/90 p-1.5 shadow-[0_12px_40px_-12px_rgb(120_40_30/0.3)] backdrop-blur-2xl">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold transition', isActive ? 'text-primary' : 'text-muted-foreground')}>
            {({ isActive }) => (<>
              {isActive && <motion.span layoutId="tab" className="absolute inset-0 rounded-2xl bg-secondary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <n.icon className="relative h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="relative">{n.label}</span>
            </>)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Layout() {
  const { me } = useMe();
  const online = useOnline();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [loc.pathname]);
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
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 active:scale-95" aria-label="منو"><Menu className="h-[18px] w-[18px]" /></button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs" dir="rtl">
                <SheetHeader><SheetTitle className="flex items-center gap-3 text-right"><AvatarImg id={me?.profile?.avatar} name={me?.profile?.displayName ?? '?'} className="size-12 ring-2" /><span className="min-w-0">{me?.profile?.displayName}<span className="block text-xs font-normal text-muted-foreground" dir="ltr">@{me?.profile?.username}</span></span></SheetTitle></SheetHeader>
                <div className="mt-6 flex flex-col gap-1">
                  {NAV.map((n) => <MenuLink key={n.to} to={n.to} icon={n.icon} label={n.label} />)}
                  <MenuLink to="/terms" icon={FileText} label="قوانین و حریم خصوصی" />
                  {me?.profile?.isAdmin && <MenuLink to="/admin" icon={Shield} label="پنل مدیریت" />}
                  <button onClick={() => logout()} className="flex items-center gap-3 rounded-xl px-3 py-3 text-right text-destructive hover:bg-destructive/10"><LogOut className="h-5 w-5" /> خروج</button>
                </div>
              </SheetContent>
            </Sheet>
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

function MenuLink({ to, icon: Icon, label }: { to: string; icon: typeof History; label: string }) {
  return <Link to={to} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted"><Icon className="h-5 w-5 text-muted-foreground" />{label}</Link>;
}
