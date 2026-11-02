import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/credits';

export default createEndpoint({
  description: 'Lists the signed-in user\'s past successful replies',
  inputSchema: z.object({ token: z.string(), offset: z.number().optional() }),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const uid = session.ownerId;
    await requireProfile(uid);
    const { records, hasMore } = await zite.aiRequests.findAll({
      filters: { ownerId: uid, status: 'Success', hidden: false },
      sort: [{ field: 'createdAt', direction: 'desc' }],
      limit: 20,
      offset: input.offset ?? 0,
    });
    return {
      hasMore,
      items: records.map((r) => ({
        id: r.id,
        text: r.inputText ?? '',
        situation: r.situation ?? '',
        tone: r.tone ?? '',
        replies: JSON.parse(r.repliesJson || '[]') as string[],
        createdAt: r.createdAt ? String(r.createdAt) : '',
      })),
    };
  },
});
