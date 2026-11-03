import { useNavigate, Link } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Share, Quote, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@project/components/ui/dropdown-menu';
import { cn } from '@project/components/lib/utils';
import AvatarImg from '../AvatarImg';
import RichText from './RichText';
import MediaGrid from './MediaGrid';
import PostMenu from './PostMenu';
import { compact, runAction, timeAgo, type Post } from '../../lib/social';

type Patch = (id: string, fn: (p: Post) => Post | null) => void;

function Embedded({ post }: { post: NonNullable<Post['ref']> }) {
  const nav = useNavigate();
  if (post.status !== 'Active' && !post.mine) {
    return <div className="mt-3 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">این پست دیگه در دسترس نیست.</div>;
  }
  return (
    <div role="link" onClick={(e) => { e.stopPropagation(); nav(`/post/${post.id}`); }}
      className="mt-3 cursor-pointer rounded-2xl border border-border/80 p-3 transition hover:bg-muted/40">
      <div className="flex items-center gap-2 text-sm">
        <AvatarImg id={post.author.avatar} name={post.author.displayName} className="size-5 ring-0" />
        <span className="font-bold">{post.author.displayName}</span>
        <span className="text-muted-foreground" dir="ltr">@{post.author.username}</span>
      </div>
      {post.body && <RichText text={post.body} className="mt-1.5 line-clamp-4 whitespace-pre-wrap break-anywhere text-[15px] leading-7" />}
      <MediaGrid media={post.media.slice(0, 1)} />
    </div>
  );
}

function Action({ icon: Icon, n, active, color, onClick, label }: {
  icon: typeof Heart; n?: number; active?: boolean; color: string; onClick: (e: React.MouseEvent) => void; label: string;
}) {
  return (
    <button aria-label={label} onClick={(e) => { e.stopPropagation(); onClick(e); }}
      className={cn('group flex items-center gap-1.5 text-[13px] tabular-nums transition', active ? color : 'text-muted-foreground')}>
      <motion.span whileTap={{ scale: 0.75 }} className={cn('grid size-8 place-items-center rounded-full transition group-hover:bg-muted')}>
        <Icon className={cn('size-[18px]', active && Icon === Heart && 'fill-current')} strokeWidth={active ? 2.4 : 1.9} />
      </motion.span>
      {n ? compact(n) : ''}
    </button>
  );
}

export default function PostCard({ post: item, patch, focus }: { post: Post; patch: Patch; focus?: boolean }) {
  const nav = useNavigate();
  const isRepost = item.kind === 'Repost';
  const post = isRepost && item.ref ? (item.ref as Post) : item;
  if (isRepost && (!item.ref || item.ref.status !== 'Active')) return null;

  const share = async () => {
    const url = `${location.origin}/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: 'رو دست' });
      else { await navigator.clipboard.writeText(url); toast.success('لینک کپی شد'); }
    } catch { /* cancelled */ }
  };

  return (
    <article onClick={() => !focus && nav(`/post/${post.id}`)}
      className={cn('border-b border-border/60 px-4 py-3.5 transition', !focus && 'cursor-pointer hover:bg-muted/25')}>
      {isRepost && (
        <div className="mb-1.5 flex items-center gap-1.5 pr-8 text-[13px] font-semibold text-muted-foreground">
          <Repeat className="size-3.5" /> {item.mine ? 'تو' : item.author.displayName} بازنشر کرد
        </div>
      )}
      <div className="flex gap-3">
        <Link to={`/u/${post.author.username}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
          <AvatarImg id={post.author.avatar} name={post.author.displayName} className="size-11 ring-2" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[15px]">
            <Link to={`/u/${post.author.username}`} onClick={(e) => e.stopPropagation()} className="truncate font-bold hover:underline">{post.author.displayName}</Link>
            <span className="truncate text-muted-foreground" dir="ltr">@{post.author.username}</span>
            <span className="text-muted-foreground">·</span>
            <time className="shrink-0 text-[13px] text-muted-foreground" dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
            <div className="mr-auto"><PostMenu post={post} patch={patch} /></div>
          </div>
          {post.kind === 'Reply' && post.parentAuthor && (
            <div className="text-[13px] text-muted-foreground">در پاسخ به <Link onClick={(e) => e.stopPropagation()} to={`/u/${post.parentAuthor}`} className="text-primary" dir="ltr">@{post.parentAuthor}</Link></div>
          )}
          {post.status === 'Under Review' && <div className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">در حال بررسی — فعلاً فقط خودت می‌بینی</div>}
          {post.body && <RichText text={post.body} className={cn('mt-0.5 whitespace-pre-wrap break-anywhere leading-7', focus ? 'text-[18px] leading-8' : 'text-[15px]')} />}
          <MediaGrid media={post.media} />
          {post.kind === 'Quote' && post.ref && <Embedded post={post.ref} />}
          <div className="-mr-2 mt-1.5 flex max-w-md items-center justify-between">
            <Action icon={MessageCircle} label="پاسخ" n={post.replies} color="text-sky-600" onClick={() => nav(`/compose?reply=${post.id}`)} />
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button aria-label="بازنشر" className={cn('group flex items-center gap-1.5 text-[13px] tabular-nums', post.reposted ? 'text-accent' : 'text-muted-foreground')}>
                  <span className="grid size-8 place-items-center rounded-full transition group-hover:bg-muted"><Repeat2 className="size-[19px]" strokeWidth={post.reposted ? 2.4 : 1.9} /></span>
                  {post.reposts ? compact(post.reposts) : ''}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-2xl" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => runAction(post, post.reposted ? 'unrepost' : 'repost', patch)}>
                  <Repeat2 /> {post.reposted ? 'لغو بازنشر' : 'بازنشر'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav(`/compose?quote=${post.id}`)}><Quote /> نقل‌قول با نظر</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Action icon={Heart} label="پسند" n={post.likes} active={post.liked} color="text-primary" onClick={() => runAction(post, post.liked ? 'unlike' : 'like', patch)} />
            <Action icon={Share} label="اشتراک" color="" onClick={share} />
          </div>
        </div>
      </div>
    </article>
  );
}
