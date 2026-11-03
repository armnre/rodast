import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { socialFeed } from 'zitejs/api';
import Composer from '../components/social/Composer';
import PostCard from '../components/social/PostCard';
import { PostSkeleton } from '../components/social/FeedList';
import { tok } from '../lib/session';
import { onErr, type Post } from '../lib/social';
import { toast } from 'sonner';

export default function Compose() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const reply = sp.get('reply') ?? undefined, quote = sp.get('quote') ?? undefined;
  const targetId = reply || quote;
  const [target, setTarget] = useState<Post | null>(null);
  const [loading, setLoading] = useState(!!targetId);

  useEffect(() => {
    if (!targetId) return;
    socialFeed({ token: tok(), mode: 'post', postId: targetId })
      .then((r) => setTarget(r.posts[0] ?? null)).catch(onErr).finally(() => setLoading(false));
  }, [targetId]);

  return (
    <div className="-mx-4 sm:mx-auto sm:max-w-xl">
      <div className="flex items-center gap-2 px-3 py-3">
        <button onClick={() => nav(-1)} className="grid size-10 place-items-center rounded-full hover:bg-muted" aria-label="بازگشت"><ArrowRight className="size-5" /></button>
        <h1 className="text-lg font-black">{reply ? 'پاسخ' : quote ? 'نقل‌قول' : 'پست تازه'}</h1>
      </div>
      {loading && <PostSkeleton />}
      {reply && target && <div className="pointer-events-none opacity-90"><PostCard post={target} patch={() => {}} focus /></div>}
      <div className="card-soft mx-3 mt-3 rounded-3xl p-4">
        <Composer autoFocus parentId={reply} quoteId={quote}
          placeholder={reply ? 'پاسخت رو بنویس…' : quote ? 'نظرت درباره‌ش چیه؟' : undefined}
          onDone={(p) => { toast.success(reply ? 'پاسخت منتشر شد' : 'منتشر شد 🎉'); nav(reply ? `/post/${reply}` : `/post/${p.id}`, { replace: true }); }} />
        {quote && target && <div className="mt-2 opacity-90"><PostCard post={target} patch={() => {}} focus /></div>}
      </div>
    </div>
  );
}
