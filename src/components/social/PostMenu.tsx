import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Trash2, Flag, Ban, Link2, Sparkles, Bookmark, BookmarkX } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@project/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import { postAction, userAction } from 'zitejs/api';
import { tok } from '../../lib/session';
import { onErr, runAction, type Post } from '../../lib/social';

const REASONS = ['هرزنامه یا تبلیغ', 'توهین یا آزار', 'محتوای نامناسب', 'اطلاعات نادرست', 'سایر'];

export default function PostMenu({ post, patch }: { post: Post; patch: (id: string, fn: (p: Post) => Post | null) => void }) {
  const nav = useNavigate();
  const [confirm, setConfirm] = useState<'delete' | 'block' | 'report' | null>(null);

  const share = async () => {
    const url = `${location.origin}/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: 'رو دست' });
      else { await navigator.clipboard.writeText(url); toast.success('لینک کپی شد'); }
    } catch { /* cancelled */ }
  };

  const doDelete = async () => {
    try { await postAction({ token: tok(), postId: post.id, action: 'delete' }); patch(post.id, () => null); toast.success('پست حذف شد'); }
    catch (e) { onErr(e); }
  };
  const doBlock = async () => {
    try { await userAction({ token: tok(), username: post.author.username, action: 'block' }); toast.success(`@${post.author.username} مسدود شد`); patch(post.id, () => null); }
    catch (e) { onErr(e); }
  };
  const doReport = async (reason: string) => {
    setConfirm(null);
    try { await postAction({ token: tok(), postId: post.id, action: 'report', reason }); toast.success('گزارشت ثبت شد، ممنون که کمک می‌کنی.'); }
    catch (e) { onErr(e); }
  };

  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button aria-label="گزینه‌ها" className="-m-2 rounded-full p-2 text-muted-foreground transition hover:bg-muted active:scale-90">
            <MoreHorizontal className="size-[18px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => nav(`/reply?text=${encodeURIComponent(post.body.slice(0, 400))}`)}>
            <Sparkles className="text-primary" /> جوابشو بده با هوش مصنوعی
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runAction(post, post.bookmarked ? 'unbookmark' : 'bookmark', patch)}>
            {post.bookmarked ? <BookmarkX /> : <Bookmark />} {post.bookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={share}><Link2 /> کپی / اشتراک لینک</DropdownMenuItem>
          <DropdownMenuSeparator />
          {post.mine ? (
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm('delete')}><Trash2 /> حذف پست</DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setConfirm('report')}><Flag /> گزارش پست</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm('block')}><Ban /> مسدود کردن @{post.author.username}</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm === 'delete' || confirm === 'block'} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'delete' ? 'این پست حذف بشه؟' : `@${post.author.username} مسدود بشه؟`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'delete' ? 'بعد از حذف، پست از پروفایل و فیدها برداشته می‌شه.' : 'دیگه پست‌هاش رو نمی‌بینی و نمی‌تونه باهات تعامل کنه. دنبال‌کردن دوطرفه هم قطع می‌شه.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>بی‌خیال</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirm === 'delete' ? doDelete : doBlock}>
              {confirm === 'delete' ? 'حذف' : 'مسدود کن'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirm === 'report'} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>دلیل گزارش چیه؟</AlertDialogTitle>
            <AlertDialogDescription>گزارش‌ها ناشناس بررسی می‌شن.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            {REASONS.map((r) => (
              <button key={r} onClick={() => doReport(r)} className="rounded-xl border border-border px-4 py-3 text-right text-sm font-medium transition hover:bg-muted active:scale-[0.98]">{r}</button>
            ))}
          </div>
          <AlertDialogFooter><AlertDialogCancel>بی‌خیال</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
