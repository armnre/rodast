import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Removes one item (or all items) from the user\'s reply history',
  inputSchema: z.object({ token: z.string(), id: z.string().optional(), all: z.boolean().optional() }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const uid = session.ownerId;
    const wipe = { hidden: true, inputText: '', repliesJson: '[]', preview: '' };
    if (input.all) {
      for (let i = 0; i < 20; i++) {
        const { records } = await zite.aiRequests.findAll({ filters: { ownerId: uid, hidden: false }, limit: 100 });
        if (!records.length) break;
        for (const r of records) await zite.aiRequests.update({ id: r.id, record: wipe });
      }
      return { ok: true };
    }
    if (!input.id) throw new ZiteError({ code: 'BAD_REQUEST', message: 'id' });
    const r = await zite.aiRequests.findOne({ id: input.id });
    const owner = r ? r.ownerId : null;
    if (!r || owner !== uid) throw new ZiteError({ code: 'NOT_FOUND', message: 'nf' });
    await zite.aiRequests.update({ id: r.id, record: wipe });
    return { ok: true };
  },
});
