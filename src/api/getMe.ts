import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint } from 'zitejs/backend';
import { findProfile, getSettings, quotaView, serializeProfile } from '../server/credits';

export default createEndpoint({
  description: 'Returns the signed-in user profile and up-to-date credit status',
  inputSchema: z.object({ token: z.string(),}),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const uid = session.ownerId;
    const existing = await findProfile(uid);
    if (!existing) return { onboarded: false as const, profile: null, quota: null, phone: session.phone };
    if (existing.status === 'Blocked') {
      return { onboarded: true as const, blocked: true, profile: serializeProfile(existing), quota: null, phone: session.phone };
    }
    const cfg = await getSettings();
    const { profile, quota } = await quotaView(uid, cfg);
    return { onboarded: true as const, blocked: false, profile: serializeProfile(profile), quota, phone: session.phone };
  },
});
