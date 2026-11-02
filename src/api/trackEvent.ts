import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { track } from '../server/credits';
import { optionalSession } from '../server/session';

const ALLOWED = ['signup_started', 'reply_copied', 'referral_link_shared', 'pwa_installed'] as const;

export default createEndpoint({
  description: 'Records a client-side product analytics event (no message content)',
  inputSchema: z.object({ token: z.string().optional(), event: z.string(), meta: z.string().optional() }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const session = await optionalSession(input.token);
    if (!(ALLOWED as readonly string[]).includes(input.event)) return { ok: false };
    await track(input.event, session?.ownerId, input.meta?.replace(/[^a-z0-9_\-/]/gi, '').slice(0, 40));
    return { ok: true };
  },
});
