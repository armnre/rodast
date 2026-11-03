import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { viewer, bad, notify, unnotify, isBlocked } from '../server/social';

export default createEndpoint({
  description: 'Like, bookmark, repost, delete or report a post',
  inputSchema: z.object({
    token: z.string(),
    postId: z.string(),
    action: z.enum(['like', 'unlike', 'bookmark', 'unbookmark', 'repost', 'unrepost', 'delete', 'report']),
    reason: z.string().optional(),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const { uid } = await viewer(input.token);
    const post = await zite.posts.findOne({ id: input.postId }).catch(() => null);
    if (!post) throw bad('این پست پیدا نشد.', 'NOT_FOUND');
    const author = post.authorId ?? '';
    const key = `${uid}:${post.id}`;
    const needsActive = ['like', 'bookmark', 'repost'].includes(input.action);
    if (needsActive && post.status !== 'Active') throw bad('این پست دیگه در دسترس نیست.', 'NOT_FOUND');
    if (needsActive && author !== uid && (await isBlocked(uid, author))) throw bad('امکان تعامل با این کاربر وجود نداره.', 'FORBIDDEN');

    switch (input.action) {
      case 'like':
        await zite.postLikes.bulkCreate({ records: [{ key, postId: post.id, userId: uid }], matchOn: ['key'] });
        await notify('Like', author, uid, post.id);
        break;
      case 'unlike': {
        const l = await zite.postLikes.findOne({ filters: { key } });
        if (l) await zite.postLikes.delete({ id: l.id });
        await unnotify('Like', author, uid, post.id);
        break;
      }
      case 'bookmark':
        await zite.bookmarks.bulkCreate({ records: [{ key, postId: post.id, userId: uid }], matchOn: ['key'] });
        break;
      case 'unbookmark': {
        const b = await zite.bookmarks.findOne({ filters: { key } });
        if (b) await zite.bookmarks.delete({ id: b.id });
        break;
      }
      case 'repost':
        if (post.kind === 'Repost') throw bad('بازنشرِ بازنشر ممکن نیست.');
        await zite.posts.bulkCreate({
          records: [{ clientKey: `rp:${key}`, authorId: uid, kind: 'Repost', refId: post.id, status: 'Active', body: '', media: '[]' }],
          matchOn: ['clientKey'],
        });
        await notify('Repost', author, uid, post.id);
        break;
      case 'unrepost': {
        const r = await zite.posts.findOne({ filters: { clientKey: `rp:${key}` } });
        if (r) await zite.posts.update({ id: r.id, record: { status: 'Deleted' } });
        await unnotify('Repost', author, uid, post.id);
        break;
      }
      case 'delete':
        if (author !== uid) throw bad('فقط پست‌های خودت رو می‌تونی حذف کنی.', 'FORBIDDEN');
        await zite.posts.update({ id: post.id, record: { status: 'Deleted' } });
        break;
      case 'report': {
        if (author === uid) throw bad('نمی‌تونی پست خودت رو گزارش کنی.');
        await zite.reports.bulkCreate({
          records: [{ key: `post:${key}`, reporterId: uid, targetType: 'Post', targetId: post.id, reason: (input.reason ?? 'نامشخص').slice(0, 300), status: 'Open' }],
          matchOn: ['key'],
        });
        const c = await zite.sql({
          query: `SELECT COUNT(*) AS c FROM "Reports" WHERE "targetType"='Post' AND "targetId"=$1 AND "status"='Open'`,
          params: [post.id],
        });
        if (Number(c.rows[0]?.c ?? 0) >= 3 && post.status === 'Active') await zite.posts.update({ id: post.id, record: { status: 'Under Review' } });
        break;
      }
    }
    return { ok: true };
  },
});
