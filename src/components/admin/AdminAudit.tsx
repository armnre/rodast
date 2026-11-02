import { tok } from '../../lib/session';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminAudit, type AdminAuditOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { errMsg, faDate } from '../../lib/me';

export default function AdminAudit() {
  const [d, setD] = useState<AdminAuditOutputType | null>(null);
  useEffect(() => { adminAudit({ token: tok(), }).then(setD).catch((e) => toast.error(errMsg(e))); }, []);
  const decide = async (referralId: string, approve: boolean) => {
    try { setD(await adminAudit({ token: tok(),  decide: { referralId, approve } })); toast.success(approve ? 'تأیید شد' : 'رد شد'); }
    catch (e) { toast.error(errMsg(e)); }
  };
  if (!d) return <Skeleton className="h-64 rounded-3xl" />;
  return (
    <div className="space-y-4">
      <div className="card-soft p-4">
        <h3 className="font-black">دعوت‌های مشکوک (بررسی دستی)</h3>
        {d.review.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">موردی نیست.</p> : d.review.map((r) => (
          <div key={r.id} className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-muted/60 p-3 text-sm">
            <span>کد <b dir="ltr">{r.code}</b> · {r.note} · {faDate(r.createdAt, true)}</span>
            <div className="flex gap-2"><Button size="sm" onClick={() => decide(r.id, true)}>تأیید</Button><Button size="sm" variant="outline" onClick={() => decide(r.id, false)}>رد</Button></div>
          </div>
        ))}
      </div>
      <div className="card-soft p-4">
        <h3 className="font-black">Audit Log</h3>
        <ul className="mt-2 divide-y text-sm">
          {d.logs.map((l) => (
            <li key={l.id} className="py-2.5">
              <div className="flex justify-between"><b dir="ltr">{l.action}</b><span className="text-xs text-muted-foreground">{faDate(l.createdAt, true)}</span></div>
              <div className="break-all text-xs text-muted-foreground" dir="ltr">target: {l.target || '—'} · {l.details}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
