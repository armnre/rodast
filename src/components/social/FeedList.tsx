import { Loader2 } from 'lucide-react';
import { Skeleton } from '@project/components/ui/skeleton';
import PostCard from './PostCard';
import { useInView, type useFeed } from '../../lib/social';

export function PostSkeleton() {
  return (
    <div className="flex gap-3 border-b border-border/60 px-4 py-4">
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export default function FeedList({ feed, empty }: { feed: ReturnType<typeof useFeed>; empty: React.ReactNode }) {
  const sentinel = useInView(feed.loadMore, feed.more && !feed.loading);
  if (feed.loading && !feed.posts.length) return <div>{[0, 1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>;
  if (!feed.posts.length) return <div className="px-6 py-16 text-center">{empty}</div>;
  return (
    <div>
      {feed.posts.map((p) => <PostCard key={p.id} post={p} patch={feed.patch} />)}
      {feed.more && <div ref={sentinel} className="grid place-items-center py-6"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, children }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
      <div className="mb-2 grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary"><Icon className="size-8" /></div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}
