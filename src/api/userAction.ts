import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { viewer, bad, notify, unnotify, isBlocked } from '../server/social';

export default createEndpoint({
  description: 'Follow, unfollow, block, unblock or report another user',
  inputSchema: z.object({
    token: z.string(),
    username: z.string(),
    action: z.enum(['follow', 'unfollow', 'block', 'unblock', 'report']),
    reason: z.string().optional(),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const { uid } = await viewer(input.token);
    const target = await zite.profiles.findOne({ filters: { username: input.username.toLowerCase() } });
    if (!target?.ownerId || target.status === 'Blocked') throw bad('کاربر پیدا نشد.', 'NOT_FOUND');
    const tid = target.ownerId;
    if (tid === uid) throw bad('این کار روی حساب خودت ممکن نیست.');
    const fkey = `${uid}>${tid}`;

    switch (input.action) {
      case 'follow':
        if (await isBlocked(uid, tid)) throw bad('امکان دنبال‌کردن این کاربر وجود نداره.', 'FORBIDDEN');
        await zite.follows.bulkCreate({ records: [{ key: fkey, followerId: uid, followingId: tid }], matchOn: ['key'] });
        await notify('Follow', tid, uid);
        break;
      case 'unfollow': {
        const f = await zite.follows.findOne({ filters: { key: fkey } });
        if (f) await zite.follows.delete({ id: f.id });
        await unnotify('Follow', tid, uid);
        break;
      }
      case 'block': {
        await zite.blocks.bulkCreate({ records: [{ key: fkey, blockerId: uid, blockedId: tid }], matchOn: ['key'] });
        // Blocking severs follows in both directions.
        for (const k of [fkey, `${tid}>${uid}`]) {
          const f = await zite.follows.findOne({ filters: { key: k } });
          if (f) await zite.follows.delete({ id: f.id });
        }
        break;
      }
      case 'unblock': {
        const b = await zite.blocks.findOne({ filters: { key: fkey } });
        if (b) await zite.blocks.delete({ id: b.id });
        break;
      }
      case 'report':
        await zite.reports.bulkCreate({
          records: [{ key: `user:${fkey}`, reporterId: uid, targetType: 'User', targetId: tid, reason: (input.reason ?? 'نامشخص').slice(0, 300), status: 'Open' }],
          matchOn: ['key'],
        });
        break;
    }
    return { ok: true };
  },
});
