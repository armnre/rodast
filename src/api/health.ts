import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Health check for the app and database',
  inputSchema: z.object({}),
  outputSchema: z.object({ ok: z.boolean(), db: z.boolean(), ai: z.boolean(), time: z.string() }),
  execute: async () => {
    let db = false;
    try { await zite.systemSettings.findAll({ limit: 1 }); db = true; } catch { db = false; }
    return { ok: db, db, ai: !!process.env.ZITE_AI_API_KEY, time: new Date().toISOString() };
  },
});
