import { logout } from '../lib/session';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { Menu, MessageSquareHeart, History, Gift, UserRound, Shield, LogOut, FileText, WifiOff, Coins } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@project/components/ui/sheet';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';
import { Logo } from './Logo';
import { fa, useMe } from '../lib/me';
import InstallPrompt from './InstallPrompt';

const NAV = [
  { to: '/', label: 'جوابشو بده', icon: MessageSquareHeart },
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

export default function Layout() {
  const { me } = useMe();
  const online = useOnline();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const bal = me?.quota?.balance ?? 0;

  return (
    <div className="bg-blobs min-h-[100dvh] pb-28 md:pb-12">
      {!online && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-foreground py-2 text-sm text-background">
          <WifiOff className="h-4 w-4" /> آفلاینی؛ ساختن جواب فعلاً ممکن نیست.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/60 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}><div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/"><Logo size={34} /></Link>
        <nav className="hidden gap-1 md:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('rounded-full px-4 py-2 text-sm font-medium transition', isActive ? 'bg-white/[0.08] text-foreground' : 'text-muted-foreground hover:text-foreground')}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/invite" className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-black tabular-nums', bal > 0 ? 'border-accent/30 bg-accent/10 text-accent' : 'border-destructive/40 bg-destructive/10 text-destructive')}>
            <Coins className="h-4 w-4" />{bal > 0 ? fa(bal) : 'تموم شد'}
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-2xl border border-white/10" aria-label="منو"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs border-white/10 bg-card/95 backdrop-blur-xl" dir="rtl">
              <SheetHeader><SheetTitle className="text-right">{me?.profile?.displayName}<span className="block text-xs font-normal text-muted-foreground" dir="ltr">@{me?.profile?.username}</span></SheetTitle></SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {NAV.map((n) => <MenuLink key={n.to} to={n.to} icon={n.icon} label={n.label} />)}
                <MenuLink to="/terms" icon={FileText} label="قوانین و حریم خصوصی" />
                {me?.profile?.isAdmin && <MenuLink to="/admin" icon={Shield} label="پنل مدیریت" />}
                <button onClick={() => logout()} className="flex items-center gap-3 rounded-xl px-3 py-3 text-right text-destructive hover:bg-destructive/10"><LogOut className="h-5 w-5" /> خروج</button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div></header>
      <main className="mx-auto max-w-5xl px-4">
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="mx-3 mb-2 grid grid-cols-4 rounded-[1.6rem] border border-white/10 bg-card/80 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-bold transition', isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {({ isActive }) => (<>
                {isActive && <motion.span layoutId="tab" className="absolute inset-0 rounded-2xl bg-white/[0.07]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <n.icon className={cn('relative h-[22px] w-[22px]', isActive && 'text-primary')} strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="relative">{n.label}</span>
              </>)}
            </NavLink>
          ))}
        </div>
      </nav>
      <InstallPrompt />
    </div>
  );
}

function MenuLink({ to, icon: Icon, label }: { to: string; icon: typeof History; label: string }) {
  return <Link to={to} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted"><Icon className="h-5 w-5 text-muted-foreground" />{label}</Link>;
}
