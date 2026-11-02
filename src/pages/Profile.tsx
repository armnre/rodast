import { tok, logout } from '../lib/session';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { updateProfile, deleteAccount } from 'zitejs/api';
import { toast } from 'sonner';
import { Loader2, LogOut, Gift, Sparkles, MessageSquareText, Coins, ChevronLeft, ShieldCheck, Trash2, FileText, Copy, Phone, CalendarDays, Shield } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Textarea } from '@project/components/ui/textarea';
import { Label } from '@project/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@project/components/ui/alert-dialog';
import { cn } from '@project/components/lib/utils';
import { errMsg, fa, faDate, useMe } from '../lib/me';
import AvatarImg from '../components/AvatarImg';
import AvatarPicker from '../components/AvatarPicker';
import { VIBES } from '../shared/avatars';

const LEVELS = [{ n: 0, t: 'تازه‌کار' }, { n: 10, t: 'حاضرجواب' }, { n: 50, t: 'استاد رودست' }, { n: 150, t: 'افسانه' }];

export default function Profile() {
  const { me, refresh } = useMe();
  const p = me?.profile;
  const nav = useNavigate();
  const [dn, setDn] = useState(p?.displayName ?? '');
  const [un, setUn] = useState(p?.username ?? '');
  const [bio, setBio] = useState(p?.bio ?? '');
  const [vibe, setVibe] = useState(p?.vibe ?? '');
  const [avatar, setAvatar] = useState(p?.avatar ?? '');
  const [busy, setBusy] = useState(false);
  if (!p) return null;

  const dirty = dn !== p.displayName || un !== p.username || bio !== (p.bio ?? '') || vibe !== (p.vibe ?? '') || avatar !== (p.avatar ?? '');
  const total = p.totalReplies as number;
  const lvlIdx = LEVELS.reduce((i, l, k) => (total >= l.n ? k : i), 0);
  const next = LEVELS[lvlIdx + 1];
  const pct = next ? Math.min(100, ((total - LEVELS[lvlIdx].n) / (next.n - LEVELS[lvlIdx].n)) * 100) : 100;

  const save = async () => {
    if (dn.trim().length < 2) return toast.error('نام نمایشی کوتاهه.');
    if (!/^[a-z0-9_]{3,20}$/.test(un)) return toast.error('نام کاربری فقط حروف انگلیسی کوچک، عدد و _ (۳ تا ۲۰).');
    setBusy(true);
    try { await updateProfile({ token: tok(), displayName: dn, username: un, bio, vibe, avatar }); await refresh(); toast.success('پروفایلت به‌روز شد ✨'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const remove = async () => {
    try { await deleteAccount({ token: tok(), confirm: true }); toast.success('حسابت حذف شد'); logout(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-5 pt-2">
      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-soft overflow-hidden">
        <div className="relative h-28 bg-gradient-brand sm:h-32">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_30%,white_0,transparent_40%),radial-gradient(circle_at_80%_80%,white_0,transparent_35%)]" />
          <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">{LEVELS[lvlIdx].t}</span>
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex items-end justify-between gap-3">
            <AvatarImg id={avatar} name={dn || p.displayName} className="size-24 shadow-xl" />
            {p.isAdmin && <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent"><Shield className="size-3.5" />ادمین</span>}
          </div>
          <h1 className="mt-3 truncate font-display text-2xl">{p.displayName}</h1>
          <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span dir="ltr">@{p.username}</span>
            {p.vibe && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{p.vibe}</span>}
          </div>
          {p.bio && <p className="mt-2 text-sm leading-7">{p.bio}</p>}

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <Stat icon={Coins} label="پاسخ باقی‌مانده" value={fa(me?.quota?.balance ?? 0)} />
            <Stat icon={MessageSquareText} label="جواب ساخته‌شده" value={fa(total)} />
            <Stat icon={ShieldCheck} label="وضعیت" value={p.status === 'Active' ? 'فعال' : 'غیرفعال'} />
          </div>

          <div className="mt-4 rounded-2xl bg-muted/60 p-3">
            <div className="flex items-center justify-between text-xs"><span className="font-bold">سطح: {LEVELS[lvlIdx].t}</span><span className="text-muted-foreground">{next ? `${fa(next.n - total)} جواب تا «${next.t}»` : 'به بالاترین سطح رسیدی 🔥'}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-brand" /></div>
          </div>
        </div>
      </motion.div>

      {/* Quick links */}
      <div className="card-soft divide-y divide-border/60 overflow-hidden">
        <Row icon={Gift} label="دعوت دوستان و هدیه گرفتن" onClick={() => nav('/invite')} />
        <Row icon={Sparkles} label="تاریخچه‌ی جواب‌ها" onClick={() => nav('/history')} />
        <Row icon={FileText} label="قوانین و حریم خصوصی" onClick={() => nav('/terms')} />
        {p.isAdmin && <Row icon={Shield} label="پنل مدیریت" onClick={() => nav('/admin')} />}
      </div>

      {/* Edit */}
      <div className="card-soft space-y-5 p-5 sm:p-6">
        <div><h2 className="font-display text-lg">ویرایش پروفایل</h2><p className="text-xs text-muted-foreground">یه آواتار انتخاب کن و خودتو معرفی کن.</p></div>
        <div className="space-y-2"><Label>آواتار</Label><AvatarPicker value={avatar} onChange={setAvatar} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>نام نمایشی</Label><Input value={dn} maxLength={30} onChange={(e) => setDn(e.target.value)} className="h-11 rounded-xl" /></div>
          <div className="space-y-1.5"><Label>نام کاربری</Label><Input dir="ltr" value={un} maxLength={20} onChange={(e) => setUn(e.target.value.toLowerCase())} className="h-11 rounded-xl text-left" /></div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between"><Label>بیو</Label><span className="text-xs text-muted-foreground">{fa(bio.length)}/۱۲۰</span></div>
          <Textarea value={bio} maxLength={120} rows={2} placeholder="مثلاً: همیشه یه جواب تو آستینم دارم 😏" onChange={(e) => setBio(e.target.value)} className="resize-none rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>حال‌وهوای تو</Label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button key={v} type="button" onClick={() => setVibe(vibe === v ? '' : v)}
                className={cn('rounded-full border px-4 py-1.5 text-sm font-bold transition', vibe === v ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'bg-background hover:border-primary/40')}>{v}</button>
            ))}
          </div>
        </div>
        <Button onClick={save} disabled={busy || !dirty} className="h-12 w-full rounded-xl bg-gradient-brand text-base font-bold shadow-lg shadow-primary/25">{busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}ذخیره‌ی تغییرات</Button>
      </div>

      {/* Account */}
      <div className="card-soft space-y-3 p-5 sm:p-6">
        <h2 className="font-display text-lg">اطلاعات حساب</h2>
        <Info icon={Phone} label="شماره موبایل" value={<span dir="ltr">{me?.phone}</span>} />
        <Info icon={CalendarDays} label="عضو از" value={p.joinedAt ? faDate(p.joinedAt) : '—'} />
        <Info icon={Gift} label="کد دعوت" value={<button className="inline-flex items-center gap-1 font-mono font-bold" dir="ltr" onClick={() => { navigator.clipboard.writeText(p.referralCode); toast.success('کد کپی شد'); }}>{p.referralCode}<Copy className="size-3.5" /></button>} />
        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => logout()}><LogOut className="ml-2 h-4 w-4" />خروج از حساب</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="h-11 rounded-xl text-destructive"><Trash2 className="ml-2 h-4 w-4" />حذف حساب</Button></AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader><AlertDialogTitle>حسابت حذف بشه؟</AlertDialogTitle><AlertDialogDescription>تاریخچه و اطلاعات پروفایلت پاک می‌شه، اعتبارهات از بین می‌ره و این کار برگشت نداره.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter className="gap-2"><AlertDialogCancel>منصرف شدم</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">حذف کن</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl border border-border/60 bg-background/70 px-2 py-3 text-center"><Icon className="mx-auto size-4 text-primary" /><div className="mt-1 truncate text-lg font-black">{value}</div><div className="text-[11px] leading-4 text-muted-foreground">{label}</div></div>;
}
function Row({ icon: Icon, label, onClick }: { icon: typeof Gift; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center gap-3 px-5 py-4 text-right transition hover:bg-muted/50"><span className="grid size-9 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-4" /></span><span className="flex-1 font-bold">{label}</span><ChevronLeft className="size-4 text-muted-foreground" /></button>;
}
function Info({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4" />{label}</span><span className="font-bold">{value}</span></div>;
}
