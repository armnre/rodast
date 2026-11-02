import { tok } from '../../lib/session';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { adminUsers, type AdminUsersOutputType } from 'zitejs/api';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { errMsg, fa, faDate } from '../../lib/me';
import AdminUserSheet from './AdminUserSheet';

type U = AdminUsersOutputType['users'][0];

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [q] = useDebounce(search, 350);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AdminUsersOutputType | null>(null);
  const [sel, setSel] = useState<U | null>(null);

  const load = () => adminUsers({ token: tok(),  search: q || undefined, offset: page * 25 }).then(setData).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { setData(null); load(); }, [q, page]); // eslint-disable-line

  return (
    <div className="space-y-3">
      <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="جست‌وجو با نام کاربری یا نام" className="h-11 rounded-xl pr-9" />
      </div>
      <div className="card-soft divide-y overflow-hidden">
        {!data ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="m-3 h-12" />) : data.users.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">کاربری پیدا نشد.</p>
        ) : data.users.map((u) => (
          <button key={u.id} onClick={() => setSel(u)} className="flex w-full items-center justify-between gap-3 p-4 text-right hover:bg-muted/50">
            <div className="min-w-0">
              <div className="font-bold">{u.displayName} {u.isAdmin && <span className="text-xs text-primary">(مدیر)</span>}</div>
              <div className="text-xs text-muted-foreground"><span dir="ltr">@{u.username}</span> · {faDate(u.joinedAt)}</div>
            </div>
            <div className="text-left text-xs">
              <div>موجودی: <b>{fa(u.balance)}</b></div>
              <div className={u.status === 'Blocked' ? 'text-destructive' : 'text-muted-foreground'}>{u.status === 'Blocked' ? 'مسدود' : `${fa(u.totalReplies)} جواب`}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>قبلی</Button>
        <span className="text-sm text-muted-foreground">صفحه {fa(page + 1)}</span>
        <Button variant="outline" size="sm" disabled={!data?.hasMore} onClick={() => setPage(page + 1)}>بعدی</Button>
      </div>
      <AdminUserSheet user={sel} onClose={() => setSel(null)} onChanged={load} />
    </div>
  );
}
