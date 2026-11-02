import { tok } from '../lib/session';
import { useEffect, useState } from 'react';
import { Gift, Clock, Copy, Check } from 'lucide-react';
import { getReferrals, trackEvent, type GetReferralsOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { toast } from 'sonner';
import { fa, faDate, useMe } from '../lib/me';
import { ShareButtons } from './ShareButtons';
import { WaitArt } from './Art';

function Countdown({ target, serverNow }: { target: string; serverNow: string }) {
  const { refresh } = useMe();
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const [now, setNow] = useState(Date.now() + offset);
  useEffect(() => { const t = setInterval(() => setNow(Date.now() + offset), 1000); return () => clearInterval(t); }, [offset]);
  const left = Math.max(0, new Date(target).getTime() - now);
  useEffect(() => { if (left === 0) { const t = setTimeout(refresh, 1500); return () => clearTimeout(t); } }, [left === 0]); // eslint-disable-line
  const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000), s = Math.floor((left % 60000) / 1000);
  const pad = (n: number) => fa(String(n).padStart(2, '0'));
  return <div className="text-3xl font-black tabular-nums sm:text-4xl" dir="ltr">{pad(h)}:{pad(m)}:{pad(s)}</div>;
}

export default function LimitedPanel() {
  const { me } = useMe();
  const q = me?.quota;
  const [ref, setRef] = useState<GetReferralsOutputType | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { getReferrals({ token: tok(), }).then(setRef).catch(() => {}); }, []);
  if (!q) return null;
  const copy = async () => {
    if (!ref) return;
    await navigator.clipboard.writeText(ref.link);
    setCopied(true); toast.success('لینک کپی شد'); setTimeout(() => setCopied(false), 1500);
    trackEvent({ token: tok(),  event: 'referral_link_shared', meta: 'copy' }).catch(() => {});
  };

  return (
    <div className="card-soft p-5 text-center sm:p-6 md:p-8">
      <WaitArt className="mx-auto h-32 w-32 sm:h-40 sm:w-40" />
      <h2 className="mt-3 text-2xl font-black">فعلاً جوابی نمونده!</h2>
      <p className="mt-2 text-muted-foreground">با دعوت دوستات {fa(q.referralReward)} پاسخ هدیه بگیر یا برای شارژ بعدی کمی صبر کن.</p>
      {q.pendingReferralCredits > 0 && <p className="mt-3 text-sm text-primary">{fa(q.pendingReferralCredits)} پاسخ هدیه‌ی دعوت در راهه!</p>}
      <div className="mt-6 grid min-w-0 gap-4 text-right md:grid-cols-2">
        {q.referralsEnabled && (
          <div className="min-w-0 rounded-3xl bg-secondary/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 font-bold"><Gift className="h-5 w-5 text-primary" /> {fa(q.referralReward)} پاسخ هدیه برای هر دعوت موفق</div>
            {ref ? (
              <>
                <div className="mt-4 flex min-w-0 items-center gap-2 rounded-2xl bg-card p-2">
                  <span className="min-w-0 flex-1 truncate px-2 text-sm" dir="ltr">{ref.link}</span>
                  <Button size="sm" className="rounded-xl" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
                </div>
                <ShareButtons link={ref.link} />
                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  <span>موفق: <b className="text-foreground">{fa(ref.successful)}</b></span>
                  <span>در انتظار: <b className="text-foreground">{fa(ref.waiting)}</b></span>
                </div>
              </>
            ) : <div className="mt-4 h-24 animate-pulse rounded-2xl bg-card" />}
          </div>
        )}
        <div className="min-w-0 rounded-3xl bg-muted p-4 sm:p-5">
          <div className="flex items-center gap-2 font-bold"><Clock className="h-5 w-5 text-primary" /> شارژ بعدی</div>
          {q.nextRefillAt ? (
            <>
              <div className="mt-4"><Countdown target={q.nextRefillAt} serverNow={q.serverNow} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{faDate(q.nextRefillAt, true)} — {fa(q.refillAmount)} پاسخ جدید خودکار اضافه می‌شه.</p>
            </>
          ) : <p className="mt-4 text-sm text-muted-foreground">شارژ دوره‌ای فعلاً غیرفعاله؛ از دعوت دوستات استفاده کن.</p>}
        </div>
      </div>
    </div>
  );
}
