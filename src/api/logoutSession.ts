import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { optionalSession } from '../server/session';

export default createEndpoint({
  description: 'Ends the current mobile sign-in session',
  inputSchema: z.object({ token: z.string() }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const s = await optionalSession(input.token);
    if (s) await zite.sessions.update({ id: s.id, record: { revoked: true } });
    return { ok: true };
  },
});
