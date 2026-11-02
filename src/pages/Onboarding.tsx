import { tok, logout } from '../lib/session';
import { useState } from 'react';
import { z } from 'zod';
import { Link } from 'react-router-dom';

import { completeOnboarding } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Checkbox } from '@project/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { errMsg, REF_KEY, useMe } from '../lib/me';

const schema = z.object({
  displayName: z.string().trim().min(2, 'حداقل ۲ حرف').max(30, 'حداکثر ۳۰ حرف'),
  username: z.string().trim().regex(/^[a-z0-9_]{3,20}$/, 'فقط حروف انگلیسی کوچک، عدد و _ (۳ تا ۲۰)'),
  terms: z.literal(true, { errorMap: () => ({ message: 'پذیرش قوانین لازمه' }) }),
});

export default function Onboarding() {
  const { me, refresh } = useMe();
  const [v, setV] = useState({ displayName: '', username: '', terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const ref = localStorage.getItem(REF_KEY) ?? undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(v);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setErrors({}); setBusy(true); setServerErr('');
    try {
      await completeOnboarding({ token: tok(),  displayName: v.displayName, username: v.username.toLowerCase(), termsAccepted: true, referralCode: ref });
      localStorage.removeItem(REF_KEY);
      await refresh();
    } catch (err) { setServerErr(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="bg-blobs flex min-h-[100dvh] items-center justify-center p-5">
      <form onSubmit={submit} className="card-soft w-full max-w-sm space-y-5 p-6">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={64} />
          <h1 className="mt-3 text-2xl font-black">خوش اومدی!</h1>
          <p className="text-sm text-muted-foreground">حسابت با {me?.phone} تأیید شد. یه اسم انتخاب کن و ۱۰ جواب رایگانتو بگیر.</p>
          {ref && <p className="mt-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">با دعوت دوستت اومدی 🎉</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dn">نام نمایشی</Label>
          <Input id="dn" value={v.displayName} onChange={(e) => setV({ ...v, displayName: e.target.value })} placeholder="مثلاً سارا" className="h-12 rounded-xl" />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="un">نام کاربری</Label>
          <Input id="un" dir="ltr" value={v.username} onChange={(e) => setV({ ...v, username: e.target.value.toLowerCase() })} placeholder="sara_99" className="h-12 rounded-xl text-left" />
          {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={v.terms} onCheckedChange={(c) => setV({ ...v, terms: c === true })} className="mt-0.5" />
          <span><Link to="/terms" className="text-primary underline">قوانین و حریم خصوصی</Link> رو خوندم و قبول دارم.</span>
        </label>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
        {serverErr && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{serverErr}</p>}
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base font-bold">
          {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} بزن بریم
        </Button>
        <button type="button" onClick={() => logout()} className="w-full text-xs text-muted-foreground underline">خروج و ورود با ایمیل دیگه</button>
      </form>
    </div>
  );
}
