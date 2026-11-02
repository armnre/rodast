import { tok } from '../lib/session';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { trackEvent } from 'zitejs/api';

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
const KEY = 'rodast_install_dismissed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export default function InstallPrompt() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [hidden, setHidden] = useState(() => isStandalone() || localStorage.getItem(KEY) === '1');
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    const installed = () => { trackEvent({ token: tok(),  event: 'pwa_installed' }).catch(() => {}); setHidden(true); };
    window.addEventListener('beforeinstallprompt', h);
    window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', h); window.removeEventListener('appinstalled', installed); };
  }, []);

  if (hidden || (!evt && !ios)) return null;
  const close = () => { localStorage.setItem(KEY, '1'); setHidden(true); };
  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const c = await evt.userChoice;
    if (c.outcome === 'accepted') trackEvent({ token: tok(),  event: 'pwa_installed' }).catch(() => {});
    close();
  };

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 rounded-3xl border bg-card p-4 shadow-xl md:bottom-6 md:left-6 md:right-auto md:w-80">
      <button onClick={close} className="absolute left-3 top-3 text-muted-foreground" aria-label="بستن"><X className="h-4 w-4" /></button>
      <div className="flex gap-3">
        <Download className="h-6 w-6 shrink-0 text-primary" />
        <div className="text-sm">
          <b>رو دست رو نصب کن</b>
          <p className="mt-1 text-muted-foreground">
            {ios ? 'تو سافاری دکمه‌ی Share رو بزن و بعد «Add to Home Screen».' : 'مثل یه اپ واقعی، همیشه دم دستت.'}
          </p>
          {evt && <Button size="sm" className="mt-3 rounded-xl" onClick={install}>نصب</Button>}
        </div>
      </div>
    </div>
  );
}
