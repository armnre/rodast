import { tok } from '../../lib/session';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminSettings, type AdminSettingsInputType } from 'zitejs/api';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Switch } from '@project/components/ui/switch';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { errMsg } from '../../lib/me';

type S = NonNullable<AdminSettingsInputType['update']>;
const NUMS: [keyof S, string][] = [
  ['initialCredits', 'اعتبار اولیه'], ['referralReward', 'پاداش هر دعوت'], ['dailyRefill', 'مقدار شارژ دوره‌ای'],
  ['waitHours', 'مدت انتظار (ساعت)'], ['referralCap', 'سقف دعوت‌های پاداش‌دار هر کاربر'],
  ['aiTimeoutSec', 'Timeout هوش مصنوعی (ثانیه)'], ['aiMaxRetries', 'تعداد Retry'], ['repliesPerRequest', 'تعداد جواب در هر درخواست'],
];

export default function AdminSettings() {
  const [s, setS] = useState<S | null>(null);
  const [keyOk, setKeyOk] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    adminSettings({ token: tok(), }).then((r) => { const { aiKeyConfigured, ...rest } = r as S & { aiKeyConfigured: boolean }; setS(rest); setKeyOk(aiKeyConfigured); })
      .catch((e) => toast.error(errMsg(e)));
  }, []);
  if (!s) return <Skeleton className="h-96 rounded-3xl" />;

  const save = async () => {
    setBusy(true);
    try { await adminSettings({ token: tok(),  update: s }); toast.success('تنظیمات ذخیره شد (فقط روی تراکنش‌های بعدی اثر داره)'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="card-soft space-y-6 p-5">
      <section className="space-y-3">
        <h3 className="font-black">سهمیه و دعوت</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {NUMS.slice(0, 5).map(([k, l]) => <NumField key={String(k)} label={l} value={s[k] as number} onChange={(v) => setS({ ...s, [k]: v })} />)}
        </div>
        <Toggle label="دعوت دوستان فعال" value={s.referralsEnabled} onChange={(v) => setS({ ...s, referralsEnabled: v })} />
        <Toggle label="شارژ دوره‌ای فعال" value={s.refillEnabled} onChange={(v) => setS({ ...s, refillEnabled: v })} />
      </section>
      <section className="space-y-3">
        <h3 className="font-black">هوش مصنوعی</h3>
        <p className={`text-sm ${keyOk ? 'text-primary' : 'text-destructive'}`}>کلید API: {keyOk ? 'تنظیم شده (فقط سمت سرور)' : 'تنظیم نشده — از Settings → Secrets مقدار ZITE_AI_API_KEY رو وارد کن'}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1"><Label>Provider Base URL</Label><Input dir="ltr" value={s.aiBaseUrl} onChange={(e) => setS({ ...s, aiBaseUrl: e.target.value })} /></div>
          <div className="space-y-1"><Label>مدل</Label><Input dir="ltr" value={s.aiModel} onChange={(e) => setS({ ...s, aiModel: e.target.value })} /></div>
          {NUMS.slice(5).map(([k, l]) => <NumField key={String(k)} label={l} value={s[k] as number} onChange={(v) => setS({ ...s, [k]: v })} />)}
        </div>
      </section>
      <Button onClick={save} disabled={busy} className="w-full rounded-2xl">ذخیره‌ی تنظیمات</Button>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <div className="space-y-1"><Label>{label}</Label><Input type="number" dir="ltr" value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>;
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center justify-between rounded-2xl bg-muted/60 p-3 text-sm">{label}<Switch checked={value} onCheckedChange={onChange} dir="ltr" /></label>;
}
