import { tok } from '../../lib/session';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminUserDetail, adminUpdateUser, type AdminUserDetailOutputType, type AdminUsersOutputType } from 'zitejs/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@project/components/ui/sheet';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { errMsg, fa, faDate } from '../../lib/me';

type U = AdminUsersOutputType['users'][0];

export default function AdminUserSheet({ user, onClose, onChanged }: { user: U | null; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<AdminUserDetailOutputType | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => user && adminUserDetail({ token: tok(),  profileId: user.id }).then(setD).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { setD(null); setAmount(''); setReason(''); load(); }, [user?.id]); // eslint-disable-line

  const act = async (action: 'block' | 'unblock' | 'adjust') => {
    if (!user) return;
    if (reason.trim().length < 3) return toast.error('دلیل رو بنویس (برای Audit Log).');
    const n = Number(amount);
    if (action === 'adjust' && (!Number.isInteger(n) || n === 0)) return toast.error('مقدار عدد صحیح غیر صفر باشه (مثلاً ۵ یا -۲).');
    setBusy(true);
    try {
      await adminUpdateUser({ token: tok(),  profileId: user.id, action, amount: action === 'adjust' ? n : undefined, reason });
      toast.success('انجام شد'); setAmount(''); setReason(''); onChanged(); load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md" dir="rtl">
        <SheetHeader><SheetTitle className="text-right">{user?.displayName} <span className="text-sm font-normal text-muted-foreground" dir="ltr">@{user?.username}</span></SheetTitle></SheetHeader>
        {!d ? <Skeleton className="mt-6 h-40" /> : (
          <div className="mt-4 space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-3">
              <span>موبایل:</span><span dir="ltr" className="truncate">{d.email}</span>
              <span>موجودی:</span><b>{fa(user?.balance ?? 0)}</b>
              <span>سهمیه‌ی اولیه:</span><span>{user?.initialExhausted ? 'تمام‌شده' : 'فعال'}</span>
              <span>هدیه‌ی معلق:</span><span>{fa(d.pendingReferralCredits)}</span>
              <span>آخرین جواب:</span><span>{d.lastSuccessAt ? faDate(d.lastSuccessAt, true) : '—'}</span>
              <span>کد دعوت:</span><span dir="ltr">{d.referralCode}</span>
              <span>وضعیت:</span><span>{user?.status === 'Blocked' ? 'مسدود' : 'فعال'}</span>
            </div>
            <div className="space-y-2 rounded-2xl border p-3">
              <b>اقدام مدیر</b>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="دلیل (الزامی)" />
              <div className="flex gap-2">
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثلاً 5 یا -2" dir="ltr" />
                <Button disabled={busy} onClick={() => act('adjust')}>اصلاح اعتبار</Button>
              </div>
              {user?.status === 'Blocked'
                ? <Button variant="outline" className="w-full" disabled={busy} onClick={() => act('unblock')}>رفع مسدودیت</Button>
                : <Button variant="outline" className="w-full text-destructive" disabled={busy} onClick={() => act('block')}>مسدودسازی</Button>}
            </div>
            <div>
              <b>تاریخچه‌ی اعتبار</b>
              <ul className="mt-2 divide-y rounded-2xl border">
                {d.transactions.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2 p-2.5">
                    <div><div className="text-xs font-bold" dir="ltr">{t.type}</div><div className="text-xs text-muted-foreground">{t.description} · {faDate(t.createdAt, true)}</div></div>
                    <div className="text-left"><b className={t.amount < 0 ? 'text-destructive' : 'text-primary'} dir="ltr">{t.amount > 0 ? '+' : ''}{t.amount}</b><div className="text-[11px] text-muted-foreground">→ {fa(t.balanceAfter)}</div></div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <b>تاریخچه‌ی دعوت</b>
              {d.referrals.length === 0 ? <p className="text-muted-foreground">—</p> : (
                <ul className="mt-2 space-y-1">{d.referrals.map((r) => <li key={r.id} className="text-xs">{r.role === 'inviter' ? 'دعوت‌کننده' : 'دعوت‌شده'} · {r.status} · {r.rewardStatus} {r.note && `(${r.note})`} · {faDate(r.createdAt)}</li>)}</ul>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
