import { tok, logout } from '../lib/session';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { updateProfile, deleteAccount } from 'zitejs/api';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@project/components/ui/alert-dialog';
import { errMsg, fa, faDate, useMe } from '../lib/me';

export default function Profile() {
  const { me, refresh } = useMe();
  const p = me?.profile;
  const nav = useNavigate();
  const [dn, setDn] = useState(p?.displayName ?? '');
  const [un, setUn] = useState(p?.username ?? '');
  const [busy, setBusy] = useState(false);
  if (!p) return null;

  const save = async () => {
    if (dn.trim().length < 2) return toast.error('نام نمایشی کوتاهه.');
    if (!/^[a-z0-9_]{3,20}$/.test(un)) return toast.error('نام کاربری فقط حروف انگلیسی کوچک، عدد و _ (۳ تا ۲۰).');
    setBusy(true);
    try { await updateProfile({ token: tok(),  displayName: dn, username: un }); await refresh(); toast.success('ذخیره شد'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const remove = async () => {
    try { await deleteAccount({ token: tok(),  confirm: true }); toast.success('حسابت حذف شد'); logout(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="card-soft p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center bg-gradient-brand shadow-lg shadow-primary/30 justify-center rounded-full bg-primary text-2xl font-black text-primary-foreground">{p.displayName.slice(0, 1)}</div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black">{p.displayName}</h1>
            <p className="truncate text-sm text-muted-foreground" dir="ltr">@{p.username}</p>
            <p className="text-xs text-muted-foreground">{me?.phone} · عضو از {p.joinedAt ? faDate(p.joinedAt) : ''}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
          <Box label="پاسخ باقی‌مانده" value={fa(me?.quota?.balance ?? 0)} />
          <Box label="جواب ساخته‌شده" value={fa(p.totalReplies)} />
          <Box label="وضعیت" value={p.status === 'Active' ? 'فعال' : 'غیرفعال'} />
        </div>
        <Button variant="outline" className="mt-4 w-full rounded-2xl" onClick={() => nav('/invite')}>دعوت دوستان</Button>
      </div>

      <div className="card-soft space-y-4 p-5 sm:p-6">
        <h2 className="font-black">تنظیمات حساب</h2>
        <div className="space-y-1.5"><Label>نام نمایشی</Label><Input value={dn} onChange={(e) => setDn(e.target.value)} className="h-11 rounded-xl" /></div>
        <div className="space-y-1.5"><Label>نام کاربری</Label><Input dir="ltr" value={un} onChange={(e) => setUn(e.target.value.toLowerCase())} className="h-11 rounded-xl text-left" /></div>
        <Button onClick={save} disabled={busy} className="h-11 w-full rounded-xl sm:w-auto">{busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}ذخیره</Button>
      </div>

      <div className="card-soft space-y-3 p-5 sm:p-6">
        <h2 className="font-black">نشست و حساب</h2>
        <Button variant="outline" className="w-full justify-start rounded-xl" onClick={() => logout()}><LogOut className="ml-2 h-4 w-4" />خروج از حساب</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline" className="w-full justify-start rounded-xl text-destructive">حذف حساب</Button></AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader><AlertDialogTitle>حسابت حذف بشه؟</AlertDialogTitle><AlertDialogDescription>تاریخچه و اطلاعات پروفایلت پاک می‌شه، اعتبارهات از بین می‌ره و این کار برگشت نداره.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="gap-2"><AlertDialogCancel>منصرف شدم</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">حذف کن</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl bg-muted/70 px-1.5 py-3"><div className="truncate text-lg font-black">{value}</div><div className="text-[11px] leading-4 text-muted-foreground">{label}</div></div>;
}
