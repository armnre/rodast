import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { viewer } from '../server/social';

export default createEndpoint({
  description: 'Lists notifications for the signed-in user, or just the unread count',
  inputSchema: z.object({ token: z.string(), countOnly: z.boolean().optional(), markRead: z.boolean().optional(), offset: z.number().int().min(0).optional() }),
  outputSchema: z.object({
    unread: z.number(),
    items: z.array(z.object({
      id: z.string(), kind: z.string(), postId: z.string(), postBody: z.string(), read: z.boolean(), createdAt: z.string(),
      actor: z.object({ displayName: z.string(), username: z.string(), avatar: z.string() }),
    })),
    hasMore: z.boolean(),
  }),
  execute: async ({ input }) => {
    const { uid } = await viewer(input.token);
    const c = await zite.sql({ query: `SELECT COUNT(*) AS c FROM "Notifications" WHERE "recipientId" = $1 AND "read" IS NOT TRUE`, params: [uid] });
    const unread = Number(c.rows[0]?.c ?? 0);
    if (input.countOnly) return { unread, items: [], hasMore: false };
    const off = input.offset ?? 0;
    const r = await zite.sql({
      query: `SELECT n.id, n."kind", n."postId", n."read", n.created_at AS "createdAt",
          a."displayName", a."username", a."avatar", LEFT(p."body", 140) AS "postBody"
        FROM "Notifications" n
        LEFT JOIN "Profiles" a ON a."ownerId" = n."actorId"
        LEFT JOIN "Posts" p ON p.id::text = n."postId"
        WHERE n."recipientId" = $1
        ORDER BY n.created_at DESC LIMIT 31 OFFSET ${off}`,
      params: [uid],
    });
    const rows = r.rows as Record<string, unknown>[];
    if (input.markRead && unread > 0) {
      const ids = rows.filter((x) => x.read !== true).map((x) => String(x.id));
      await Promise.all(ids.map((id) => zite.notifications.update({ id, record: { read: true } })));
    }
    return {
      unread: input.markRead ? 0 : unread,
      items: rows.slice(0, 30).map((x) => ({
        id: String(x.id), kind: String(x.kind), postId: String(x.postId ?? ''), postBody: String(x.postBody ?? ''),
        read: x.read === true, createdAt: String(x.createdAt ?? ''),
        actor: { displayName: String(x.displayName ?? 'کاربر'), username: String(x.username ?? ''), avatar: String(x.avatar ?? '') },
      })),
      hasMore: rows.length > 30,
    };
  },
});
