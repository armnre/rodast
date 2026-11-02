import { tok } from '../../lib/session';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { adminStats, type AdminStatsOutputType } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';
import { toast } from 'sonner';
import { errMsg, fa } from '../../lib/me';

type R = Record<string, number>;
const pct = (a: number, b: number) => (b ? `${fa(Math.round((a / b) * 100))}٪` : '—');

export default function AdminDashboard() {
  const [d, setD] = useState<AdminStatsOutputType | null>(null);
  useEffect(() => { adminStats({ token: tok(), }).then(setD).catch((e) => toast.error(errMsg(e))); }, []);
  if (!d) return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  const u = d.users as R, ai = d.ai as R, refs = d.refs as R, cr = d.credits as R, ev = d.events as R;
  const cards: [string, string | number][] = [
    ['کل کاربران', u.total], ['کاربران جدید (۷ روز)', u.new7], ['فعال امروز', u.dau], ['فعال هفته', u.wau],
    ['درخواست‌های AI', ai.total], ['پاسخ موفق', ai.success], ['خطا', ai.failed], ['مصرف توکن', ai.tokens],
    ['دعوت موفق', refs.completed], ['در انتظار بررسی', refs.review], ['اعتبار توزیع‌شده', cr.granted], ['اعتبار مصرف‌شده', cr.used],
    ['تبدیل به اولین جواب', pct(u.activated, u.total)], ['استفاده‌ی تکراری', pct(u.repeat, u.activated)],
    ['نرخ کپی', pct(ev.copies, ai.success)], ['نرخ اتمام سهمیه', pct(u.exhausted, u.total)],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="card-soft p-4"><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 text-2xl font-black">{typeof v === 'number' ? fa(v ?? 0) : v}</div></div>
        ))}
      </div>
      <div className="card-soft p-4">
        <h3 className="mb-3 font-bold">درخواست‌ها در ۱۴ روز اخیر</h3>
        <div className="h-60" dir="ltr">
          <ResponsiveContainer>
            <BarChart data={d.daily as R[]}>
              <XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip />
              <Bar dataKey="success" stackId="a" fill="hsl(var(--chart-1))" name="موفق" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failed" stackId="a" fill="hsl(var(--chart-2))" name="خطا" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card-soft p-4">
        <h3 className="font-bold">خطاهای AI (۷ روز)</h3>
        {(d.errors as { code: string; n: number }[]).length === 0 ? <p className="mt-2 text-sm text-muted-foreground">خطایی نبوده 🎉</p> : (
          <ul className="mt-2 space-y-1 text-sm">{(d.errors as { code: string; n: number }[]).map((e) => <li key={e.code} className="flex justify-between"><span dir="ltr">{e.code || 'UNKNOWN'}</span><b>{fa(e.n)}</b></li>)}</ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">میانگین زمان پاسخ: {fa(ai.avg_ms ?? 0)} میلی‌ثانیه</p>
      </div>
    </div>
  );
}
