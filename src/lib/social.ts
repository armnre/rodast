import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { socialFeed, postAction, type SocialFeedInputType, type SocialFeedOutputType } from 'zitejs/api';
import { tok, handleAuthError } from './session';
import { errMsg, fa } from './me';

export type Post = SocialFeedOutputType['posts'][number];
export type FeedQuery = Omit<SocialFeedInputType, 'token' | 'offset'>;

export const POST_MAX = 500;

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'همین الان';
  if (s < 3600) return `${fa(Math.floor(s / 60))} دقیقه`;
  if (s < 86400) return `${fa(Math.floor(s / 3600))} ساعت`;
  if (s < 604800) return `${fa(Math.floor(s / 86400))} روز`;
  return new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export const compact = (n: number) => (n >= 1000 ? `${fa((n / 1000).toFixed(n >= 10000 ? 0 : 1))}هزار` : fa(n));

export function onErr(e: unknown) {
  if (!handleAuthError(e)) toast.error(errMsg(e));
}

/** Paged feed with infinite scroll and local post patching. */
export function useFeed(query: FeedQuery | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [ancestors, setAncestors] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const busy = useRef(false);
  const key = JSON.stringify(query);

  const load = useCallback(async (offset: number) => {
    if (!query || busy.current) return;
    busy.current = true;
    if (offset === 0) setLoading(true);
    try {
      const r = await socialFeed({ token: tok(), ...query, offset });
      setPosts((p) => (offset === 0 ? r.posts : [...p, ...r.posts.filter((x) => !p.some((y) => y.id === x.id))]));
      setAncestors(r.ancestors);
      setMore(r.hasMore);
    } catch (e) { onErr(e); }
    finally { busy.current = false; setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { setPosts([]); load(0); }, [load]);

  const patch = useCallback((id: string, fn: (p: Post) => Post | null) => {
    const apply = (list: Post[]) => list.flatMap((p) => {
      let next: Post | null = p;
      if (p.id === id) next = fn(p);
      if (next && next.ref && next.ref.id === id) next = { ...next, ref: fn(next.ref) as Post['ref'] };
      return next ? [next] : [];
    });
    setPosts(apply);
    setAncestors(apply);
  }, []);

  return { posts, ancestors, loading, more, loadMore: () => load(posts.length), reload: () => load(0), patch, setPosts };
}

/** Optimistic post action with rollback. */
export async function runAction(post: Post, action: 'like' | 'unlike' | 'bookmark' | 'unbookmark' | 'repost' | 'unrepost',
  patch: (id: string, fn: (p: Post) => Post | null) => void) {
  const delta: Record<string, (p: Post) => Post> = {
    like: (p) => ({ ...p, liked: true, likes: p.likes + 1 }),
    unlike: (p) => ({ ...p, liked: false, likes: Math.max(0, p.likes - 1) }),
    bookmark: (p) => ({ ...p, bookmarked: true }),
    unbookmark: (p) => ({ ...p, bookmarked: false }),
    repost: (p) => ({ ...p, reposted: true, reposts: p.reposts + 1 }),
    unrepost: (p) => ({ ...p, reposted: false, reposts: Math.max(0, p.reposts - 1) }),
  };
  const undo: Record<string, string> = { like: 'unlike', unlike: 'like', bookmark: 'unbookmark', unbookmark: 'bookmark', repost: 'unrepost', unrepost: 'repost' };
  patch(post.id, delta[action]);
  try {
    await postAction({ token: tok(), postId: post.id, action });
    if (action === 'bookmark') toast.success('ذخیره شد');
    if (action === 'repost') toast.success('بازنشر شد');
  } catch (e) {
    patch(post.id, delta[undo[action]]);
    onErr(e);
  }
}

export function useInView(cb: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) cb(); }, { rootMargin: '600px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [cb, enabled]);
  return ref;
}

export const newKey = () => crypto.randomUUID().replace(/-/g, '');
