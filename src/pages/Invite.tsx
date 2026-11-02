import { tok } from '../lib/session';
import { useEffect, useState } from 'react';
import { Copy, Check, Gift, Users, Hourglass, Award } from 'lucide-react';
import { toast } from 'sonner';
import { getReferrals, trackEvent, type GetReferralsOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { ShareButtons } from '../components/ShareButtons';
import { errMsg, fa, useMe } from '../lib/me';
import { GiftArt } from '../components/Art';

export default function Invite() {
  const { me } = useMe();
  const [d, setD] = useState<GetReferralsOutputType | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { getReferrals({ token: tok(), }).then(setD).catch((e) => toast.error(errMsg(e))); }, []);
  const q = me?.quota;

  const copy = async () => {
    if (!d) return;
    await navigator.clipboard.writeText(d.link);
    setCopied(true); toast.success('لینک کپی شد'); setTimeout(() => setCopied(false), 1500);
    trackEvent({ token: tok(),  event: 'referral_link_shared', meta: 'copy' }).catch(() => {});
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="card-soft overflow-hidden p-5 text-center sm:p-6 md:p-8 md:text-right">
        <GiftArt className="mx-auto h-32 w-32 sm:h-40 sm:w-40" />
        <h1 className="mt-3 text-xl font-black sm:text-2xl">دوستاتو بیار، جواب هدیه بگیر</h1>
        <p className="mt-1 text-muted-foreground">
          هر دوستی که با لینکت ثبت‌نام کنه و اولین جوابشو بسازه، {fa(d?.reward ?? q?.referralReward ?? 5)} پاسخ هدیه برای تو.
        </p>
        {q?.initialPhase && <p className="mt-3 rounded-2xl bg-secondary/70 p-3 text-sm text-secondary-foreground">هدیه‌های دعوت بعد از تموم شدن ۱۰ جواب اولیه‌ت فعال می‌شن و تا اون موقع نگه داشته می‌شن.</p>}
        {!d ? <Skeleton className="mt-5 h-14 rounded-2xl" /> : !d.enabled ? (
          <p className="mt-5 text-sm text-muted-foreground">دعوت دوستان فعلاً غیرفعاله.</p>
        ) : (
          <>
            <div className="mt-5 flex min-w-0 items-center gap-2 rounded-2xl border bg-background p-2">
              <span className="min-w-0 flex-1 truncate px-2 text-left text-sm" dir="ltr">{d.link}</span>
              <Button className="shrink-0 rounded-xl" onClick={copy}>{copied ? <Check className="ml-1 h-4 w-4" /> : <Copy className="ml-1 h-4 w-4" />}کپی لینک</Button>
            </div>
            <ShareButtons link={d.link} />
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Users} label="دعوت موفق" value={d?.successful} />
        <Stat icon={Hourglass} label="در انتظار" value={d?.waiting} />
        <Stat icon={Gift} label="هدیه‌ی در راه" value={d?.pendingRewards} />
        <Stat icon={Award} label="هدیه‌ی گرفته‌شده" value={d?.grantedRewards} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value?: number }) {
  return (
    <div className="card-soft min-w-0 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-2xl font-black">{value === undefined ? '—' : fa(value)}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
