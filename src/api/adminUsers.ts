import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireAdmin } from '../server/credits';

export default createEndpoint({
  description: 'Admin: search and list users',
  inputSchema: z.object({ token: z.string(), search: z.string().optional(), offset: z.number().optional() }),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const adminUid = session.ownerId;
    await requireAdmin(adminUid);
    const s = input.search?.trim();
    const filters = s ? { username: { contains: s.toLowerCase() } } : {};
    const { records, hasMore } = await zite.profiles.findAll({
      filters, sort: [{ field: 'joinedAt', direction: 'desc' }], limit: 25, offset: input.offset ?? 0,
    });
    let list = records;
    if (s && !records.length) {
      const byName = await zite.profiles.findAll({ filters: { displayName: { contains: s } }, limit: 25 });
      list = byName.records;
    }
    return {
      hasMore,
      users: list.map((p) => ({
        id: p.id,
        userId: p.ownerId ?? '',
        displayName: p.displayName ?? '', username: p.username ?? '',
        balance: p.balance ?? 0, totalReplies: p.totalReplies ?? 0,
        status: p.status ?? 'Active', isAdmin: p.isAdmin === true,
        initialExhausted: p.initialExhausted === true, joinedAt: p.joinedAt ? String(p.joinedAt) : '',
      })),
    };
  },
});
