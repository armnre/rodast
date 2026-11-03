import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { viewer, hydrate, notBlocked, bad, type PostView } from '../server/social';

const PAGE = 20;

export default createEndpoint({
  description: 'Lists posts for a feed, profile tab, hashtag, search or a thread',
  inputSchema: z.object({
    token: z.string(),
    mode: z.enum(['following', 'foryou', 'latest', 'user', 'userReplies', 'userMedia', 'likes', 'bookmarks', 'hashtag', 'search', 'thread', 'post']),
    username: z.string().optional(),
    q: z.string().optional(),
    postId: z.string().optional(),
    offset: z.number().int().min(0).optional(),
  }),
  outputSchema: z.object({ posts: z.array(z.custom<PostView>()), ancestors: z.array(z.custom<PostView>()), hasMore: z.boolean() }),
  execute: async ({ input }) => {
    const { uid } = await viewer(input.token);
    const offset = input.offset ?? 0;
    const visible = `p."status" = 'Active' AND ${notBlocked('p."authorId"', '$1')}
      AND p."authorId" NOT IN (SELECT "ownerId" FROM "Profiles" WHERE "status" = 'Blocked')`;
    const top = `p."kind" IN ('Post','Quote','Repost')`;
    let where = '', order = 'p.created_at DESC';
    const params: unknown[] = [uid];
    const add = (v: unknown) => { params.push(v); return `$${params.length}`; };

    let targetId = '';
    if (input.mode === 'user' || input.mode === 'userReplies' || input.mode === 'userMedia' || input.mode === 'likes') {
      const prof = await zite.profiles.findOne({ filters: { username: (input.username ?? '').toLowerCase() } });
      if (!prof?.ownerId) throw bad('کاربر پیدا نشد.', 'NOT_FOUND');
      targetId = prof.ownerId;
    }

    switch (input.mode) {
      case 'latest': where = top; break;
      case 'following':
        where = `${top} AND (p."authorId" = $1 OR p."authorId" IN (SELECT "followingId" FROM "Follows" WHERE "followerId" = $1))`;
        break;
      case 'foryou':
        where = `p."kind" IN ('Post','Quote') AND p.created_at > now() - interval '21 days'`;
        order = `(
          1 + 2 * (SELECT COUNT(*) FROM "PostLikes" l WHERE l."postId" = p.id::text)
            + 3 * (SELECT COUNT(*) FROM "Posts" r WHERE r."parentId" = p.id::text AND r."status" = 'Active')
            + 3 * (SELECT COUNT(*) FROM "Posts" r WHERE r."refId" = p.id::text AND r."status" = 'Active')
            + CASE WHEN p."authorId" IN (SELECT "followingId" FROM "Follows" WHERE "followerId" = $1) THEN 6 ELSE 0 END
            + CASE WHEN EXISTS (SELECT 1 FROM "PostLikes" l JOIN "Posts" lp ON lp.id::text = l."postId"
                 WHERE l."userId" = $1 AND lp."authorId" = p."authorId") THEN 4 ELSE 0 END
          ) / power(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 + 2, 1.4) DESC, p.created_at DESC`;
        break;
      case 'user': where = `${top} AND p."authorId" = ${add(targetId)}`; break;
      case 'userReplies': where = `p."kind" = 'Reply' AND p."authorId" = ${add(targetId)}`; break;
      case 'userMedia': where = `p."kind" IN ('Post','Quote','Reply') AND p."authorId" = ${add(targetId)} AND p."media" LIKE '%"url"%'`; break;
      case 'likes':
        if (targetId !== uid) throw bad('پسندیده‌ها فقط برای خود کاربر قابل مشاهده‌ست.', 'FORBIDDEN');
        where = `p."kind" <> 'Repost' AND p.id::text IN (SELECT "postId" FROM "PostLikes" WHERE "userId" = $1)`;
        break;
      case 'bookmarks':
        where = `p."kind" <> 'Repost' AND p.id::text IN (SELECT "postId" FROM "Bookmarks" WHERE "userId" = $1)`;
        break;
      case 'hashtag': {
        const tag = (input.q ?? '').replace(/^#/, '').toLowerCase().trim();
        if (!tag) return { posts: [], ancestors: [], hasMore: false };
        where = `p."kind" <> 'Repost' AND p."hashtags" LIKE ${add(`% #${tag} %`)}`;
        break;
      }
      case 'search': {
        const q = (input.q ?? '').trim();
        if (q.length < 2) return { posts: [], ancestors: [], hasMore: false };
        where = `p."kind" <> 'Repost' AND p."body" ILIKE ${add(`%${q.replace(/[%_]/g, '')}%`)}`;
        break;
      }
      case 'thread':
        where = `p."kind" = 'Reply' AND p."parentId" = ${add(input.postId ?? '')}`;
        order = 'p.created_at ASC';
        break;
      case 'post': {
        const id = input.postId ?? '';
        const [post] = await hydrate([id], uid);
        if (!post) throw bad('این پست پیدا نشد.', 'NOT_FOUND');
        const ancestors: PostView[] = [];
        let pid = post.parentId;
        for (let i = 0; pid && i < 5; i++) {
          const [a] = await hydrate([pid], uid);
          if (!a) break;
          ancestors.unshift(a);
          pid = a.parentId;
        }
        return { posts: [post], ancestors, hasMore: false };
      }
    }

    const r = await zite.sql({
      query: `SELECT p.id FROM "Posts" p WHERE ${visible} AND ${where} ORDER BY ${order} LIMIT ${PAGE + 1} OFFSET ${offset}`,
      params,
    });
    const ids = (r.rows as { id: string }[]).map((x) => String(x.id));
    const posts = await hydrate(ids.slice(0, PAGE), uid);
    return { posts, ancestors: [], hasMore: ids.length > PAGE };
  },
});
