import { tok } from '../lib/session';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Gift, Users, Hourglass, Award, Share2, UserPlus, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getReferrals, trackEvent, type GetReferralsOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { ShareButtons } from '../components/ShareButtons';
import { errMsg, fa, faDate, useMe } from '../lib/me';

type Recent = { id: string; status: 'done' | 'waiting'; reward: number; createdAt: string };

export default function Invite() {
  const { me } = useMe();
  const [d, setD] = useState<GetReferralsOutputType | null>(null);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  useEffect(() => { getReferrals({ token: tok() }).then(setD).catch((e) => toast.error(errMsg(e))); }, []);
  const q = me?.quota;
  const reward = d?.reward ?? q?.referralReward ?? 5;

  const copy = async (what: 'link' | 'code') => {
    if (!d) return;
    await navigator.clipboard.writeText(what === 'link' ? d.link : d.code);
    setCopied(what); toast.success(what === 'link' ? 'لینک کپی شد' : 'کد کپی شد'); setTimeout(() => setCopied(null), 1500);
    trackEvent({ token: tok(), event: 'referral_link_shared', meta: 'copy' }).catch(() => {});
  };
  const share = async () => {
    if (!d) return;
    if (navigator.share) { try { await navigator.share({ title: 'رو دست', text: 'جواب‌های رودستی بساز 😏', url: d.link }); } catch { /* cancelled */ } }
    else copy('link');
  };

  return (
    <div className="space-y-5 pt-2">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-soft overflow-hidden">
        <div className="relative">
          <img src="https://images.fillout.com/912168/hp1wine38g/generated-images/mQeoKybeGXUjqgxZ42eJzH/img_8S0SA5Vp8HuQ3jok.jpg" alt="" className="aspect-[16/8] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-primary backdrop-blur"><Gift className="size-3.5" />{fa(reward)} پاسخ هدیه برای هر دعوت</span>
        </div>
        <div className="-mt-6 space-y-4 px-5 pb-6 sm:px-7">
          <h1 className="relative font-display text-2xl sm:text-3xl">دوستاتو بیار، <span className="text-gradient">جواب هدیه بگیر</span></h1>
          <p className="text-sm leading-7 text-muted-foreground">هر دوستی که با لینکت بیاد و اولین جوابشو بسازه، {fa(reward)} پاسخ هدیه می‌گیری. هیچ سقفی هم نداره!</p>
          {q?.initialPhase && <p className="rounded-2xl border border-primary/20 bg-secondary/60 p-3 text-xs leading-6 text-secondary-foreground">هدیه‌های دعوت بعد از تموم شدن جواب‌های اولیه‌ت فعال می‌شن و تا اون موقع برات نگه داشته می‌شن.</p>}
          {!d ? <Skeleton className="h-28 rounded-2xl" /> : !d.enabled ? (
            <p className="text-sm text-muted-foreground">دعوت دوستان فعلاً غیرفعاله.</p>
          ) : (
            <>
              <div className="rounded-2xl border bg-background/80 p-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate px-2 text-left text-sm text-muted-foreground" dir="ltr">{d.link}</span>
                  <Button size="sm" variant="secondary" className="shrink-0 rounded-xl" onClick={() => copy('link')}>{copied === 'link' ? <Check className="size-4" /> : <Copy className="size-4" />}</Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
                <span className="text-sm text-muted-foreground">کد دعوت تو</span>
                <button onClick={() => copy('code')} className="inline-flex items-center gap-2 font-mono text-lg font-black tracking-[0.3em]" dir="ltr">{d.code}{copied === 'code' ? <Check className="size-4 text-accent" /> : <Copy className="size-4 text-muted-foreground" />}</button>
              </div>
              <Button onClick={share} className="h-12 w-full rounded-xl bg-gradient-brand text-base font-bold shadow-lg shadow-primary/25"><Share2 className="ml-2 size-4" />اشتراک‌گذاری لینک</Button>
              <ShareButtons link={d.link} />
            </>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Users} tone="primary" label="دعوت موفق" value={d?.successful} />
        <Stat icon={Hourglass} tone="amber" label="در انتظار" value={d?.waiting} />
        <Stat icon={Gift} tone="violet" label="هدیه‌ی در راه" value={d?.pendingRewards} />
        <Stat icon={Award} tone="accent" label="هدیه‌ی گرفته‌شده" value={d?.grantedRewards} />
      </div>

      <div className="card-soft p-5 sm:p-6">
        <h2 className="font-display text-lg">چطوری کار می‌کنه؟</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          <Step n={1} icon={Share2} t="لینک رو بفرست" s="برای دوستات توی تلگرام، واتس‌اپ یا هر جا." />
          <Step n={2} icon={UserPlus} t="دوستت ثبت‌نام کنه" s="با همون لینک وارد بشه و حساب بسازه." />
          <Step n={3} icon={Sparkles} t="هدیه بگیر" s={`با اولین جوابش ${fa(reward)} پاسخ برات میاد.`} />
        </ol>
      </div>

      <div className="card-soft p-5 sm:p-6">
        <h2 className="font-display text-lg">دعوت‌های اخیر</h2>
        {!d ? <Skeleton className="mt-4 h-16 rounded-2xl" /> : !(d.recent as Recent[])?.length ? (
          <p className="mt-4 rounded-2xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">هنوز کسی با لینکت نیومده. اولین نفر رو دعوت کن! 🎁</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {(d.recent as Recent[]).map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3">
                <span className="grid size-9 place-items-center rounded-full bg-background font-black text-muted-foreground">{fa(i + 1)}</span>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold">دوست شماره {fa((d.recent as Recent[]).length - i)}</div><div className="text-xs text-muted-foreground">{r.createdAt ? faDate(r.createdAt) : ''}</div></div>
                {r.status === 'done'
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent"><CheckCircle2 className="size-3.5" />+{fa(r.reward)}</span>
                  : <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600"><Clock className="size-3.5" />در انتظار</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const TONES = { primary: 'bg-primary/12 text-primary', amber: 'bg-amber-500/15 text-amber-600', violet: 'bg-fuchsia-500/12 text-fuchsia-600', accent: 'bg-accent/15 text-accent' };
function Stat({ icon: Icon, label, value, tone }: { icon: typeof Gift; label: string; value?: number; tone: keyof typeof TONES }) {
  return (
    <div className="card-soft min-w-0 p-4">
      <span className={`grid size-10 place-items-center rounded-xl ${TONES[tone]}`}><Icon className="size-5" /></span>
      <div className="mt-3 text-2xl font-black">{value === undefined ? '—' : fa(value)}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Step({ n, icon: Icon, t, s }: { n: number; icon: typeof Gift; t: string; s: string }) {
  return (
    <li className="relative rounded-2xl border border-border/60 bg-background/60 p-4">
      <span className="absolute left-3 top-3 font-display text-3xl text-primary/15">{fa(n)}</span>
      <Icon className="size-5 text-primary" /><div className="mt-2 font-bold">{t}</div><div className="text-xs leading-6 text-muted-foreground">{s}</div>
    </li>
  );
}
