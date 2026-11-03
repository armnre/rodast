import { tok, logout } from '../lib/session';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { deleteAccount } from 'zitejs/api';
import { toast } from 'sonner';
import { LogOut, Gift, Sparkles, ChevronLeft, Trash2, FileText, Copy, Phone, CalendarDays, Shield, Bookmark, PenLine, ExternalLink, Crown } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@project/components/ui/alert-dialog';
import { errMsg, fa, faDate, useMe } from '../lib/me';
import AvatarImg from '../components/AvatarImg';
import VerifiedBadge from '../components/VerifiedBadge';
import ProfileEditSheet from '../components/ProfileEditSheet';

const LEVELS = [{ n: 0, t: 'تازه‌کار' }, { n: 10, t: 'حاضرجواب' }, { n: 50, t: 'استاد رودست' }, { n: 150, t: 'افسانه' }];

export default function Profile() {
  const { me } = useMe();
  const p = me?.profile;
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  if (!p) return null;

  const total = Number(p.totalReplies ?? 0);
  const lvl = LEVELS.reduce((i, l, k) => (total >= l.n ? k : i), 0);
  const next = LEVELS[lvl + 1];
  const pct = next ? Math.min(100, ((total - LEVELS[lvl].n) / (next.n - LEVELS[lvl].n)) * 100) : 100;
  const remove = async () => {
    try { await deleteAccount({ token: tok(), confirm: true }); toast.success('حسابت حذف شد'); logout(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-6 pt-3">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_20px_60px_-30px_rgb(120_40_30/0.35)]">
        <div className="relative h-32 bg-gradient-brand sm:h-40">
          {p.cover && <img src={p.cover} alt="" className="absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {p.premium && <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-xs font-bold text-white backdrop-blur-md"><Crown className="size-3.5 text-amber-300" />پریمیوم</span>}
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-12 flex items-end justify-between">
            <AvatarImg id={p.avatar} name={p.displayName} className="size-24 ring-4 ring-card shadow-xl" />
            <Button onClick={() => setEditing(true)} variant="outline" className="mb-1 h-9 rounded-full px-4 font-bold"><PenLine className="ml-1.5 size-4" />ویرایش</Button>
          </div>
          <h1 className="mt-3 flex items-center gap-1.5 text-2xl font-black">
            <span className="truncate">{p.displayName}</span><VerifiedBadge show={p.verified} className="size-6" />
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span dir="ltr">@{p.username}</span>
            {p.vibe && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">{p.vibe}</span>}
            {p.isAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent"><Shield className="size-3" />ادمین</span>}
          </div>
          {p.bio && <p className="mt-3 text-[15px] leading-7">{p.bio}</p>}

          <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-border/70 rounded-2xl bg-muted/50 py-3 text-center">
            <Stat label="اعتبار" value={fa(me?.quota?.balance ?? 0)} />
            <Stat label="جواب ساخته" value={fa(total)} />
            <Stat label="سطح" value={LEVELS[lvl].t} />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{LEVELS[lvl].t}</span><span>{next ? `${fa(next.n - total)} جواب تا «${next.t}»` : 'بالاترین سطح 🔥'}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-brand" /></div>
          </div>
          <Button onClick={() => nav(`/u/${p.username}`)} variant="ghost" className="mt-4 h-10 w-full rounded-xl text-sm font-bold text-primary"><ExternalLink className="ml-1.5 size-4" />دیدن پروفایل عمومی</Button>
        </div>
      </motion.section>

      <Group title="فعالیت">
        <Row icon={Sparkles} label="تاریخچه‌ی جواب‌ها" onClick={() => nav('/history')} />
        <Row icon={Bookmark} label="ذخیره‌شده‌ها" onClick={() => nav('/bookmarks')} />
        <Row icon={Gift} label="دعوت دوستان" hint="اعتبار هدیه" onClick={() => nav('/invite')} />
      </Group>

      <Group title="حساب">
        <Info icon={Phone} label="موبایل" value={<span dir="ltr">{me?.phone}</span>} />
        <Info icon={CalendarDays} label="عضو از" value={p.joinedAt ? faDate(p.joinedAt) : '—'} />
        <button className="w-full" onClick={() => { navigator.clipboard.writeText(p.referralCode); toast.success('کد دعوت کپی شد'); }}>
          <Info icon={Copy} label="کد دعوت" value={<span className="font-mono" dir="ltr">{p.referralCode}</span>} />
        </button>
        {p.isAdmin && <Row icon={Shield} label="پنل مدیریت" onClick={() => nav('/admin')} />}
        <Row icon={FileText} label="قوانین و حریم خصوصی" onClick={() => nav('/terms')} />
      </Group>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 rounded-2xl" onClick={() => logout()}><LogOut className="ml-2 size-4" />خروج</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" className="h-11 rounded-2xl text-destructive"><Trash2 className="ml-2 size-4" />حذف حساب</Button></AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader><AlertDialogTitle>حسابت حذف بشه؟</AlertDialogTitle><AlertDialogDescription>تاریخچه و اطلاعات پروفایلت پاک می‌شه و این کار برگشت نداره.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="gap-2"><AlertDialogCancel>منصرف شدم</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">حذف کن</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ProfileEditSheet open={editing} onOpenChange={setEditing} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 px-2"><div className="truncate text-lg font-black">{value}</div><div className="text-[11px] text-muted-foreground">{label}</div></div>;
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-2 text-xs font-bold text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border/60 overflow-hidden rounded-3xl border border-border/60 bg-card">{children}</div>
    </section>
  );
}
function Row({ icon: Icon, label, hint, onClick }: { icon: typeof Gift; label: string; hint?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition hover:bg-muted/40 active:bg-muted/60">
      <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-[18px]" /></span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ChevronLeft className="size-4 text-muted-foreground" />
    </button>
  );
}
function Info({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 text-sm">
      <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-[18px]" /></span>
      <span className="flex-1 text-right text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
