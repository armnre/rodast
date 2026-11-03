import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, MessageCircle, FileX } from 'lucide-react';
import Composer from '../components/social/Composer';
import PostCard from '../components/social/PostCard';
import FeedList, { Empty, PostSkeleton } from '../components/social/FeedList';
import { useFeed } from '../lib/social';

export default function PostPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const main = useFeed({ mode: 'post', postId: id });
  const replies = useFeed({ mode: 'thread', postId: id });
  const post = main.posts[0];

  return (
    <div className="-mx-4 sm:mx-auto sm:max-w-xl">
      <div className="flex items-center gap-2 px-3 py-3">
        <button onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} className="grid size-10 place-items-center rounded-full hover:bg-muted" aria-label="بازگشت"><ArrowRight className="size-5" /></button>
        <h1 className="text-lg font-black">پست</h1>
      </div>
      {main.loading ? <PostSkeleton /> : !post || (post.status !== 'Active' && !post.mine) ? (
        <div className="py-16"><Empty icon={FileX} title="این پست در دسترس نیست" text="ممکنه حذف شده باشه یا دسترسی بهش نداشته باشی." /></div>
      ) : (
        <>
          {main.ancestors.map((a) => (
            <div key={a.id} className="relative">
              <span className="absolute right-[37px] top-16 bottom-0 w-0.5 bg-border" />
              <PostCard post={a} patch={main.patch} />
            </div>
          ))}
          <PostCard post={post} patch={main.patch} focus />
          <div className="border-b border-border/60 px-4 py-3">
            <Composer parentId={post.id} placeholder={`پاسخ به @${post.author.username}…`}
              onDone={(p) => { replies.setPosts((x) => [...x, p]); main.patch(post.id, (q) => ({ ...q, replies: q.replies + 1 })); }} />
          </div>
          <FeedList feed={replies} empty={<Empty icon={MessageCircle} title="هنوز پاسخی نیست" text="اولین جواب رو تو بده." />} />
        </>
      )}
    </div>
  );
}
