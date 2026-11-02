import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { audit, getSettings, requireAdmin } from '../server/credits';

const schema = z.object({
  initialCredits: z.number(),
  referralReward: z.number(),
  dailyRefill: z.number(),
  waitHours: z.number(),
  referralCap: z.number(),
  referralsEnabled: z.boolean(),
  refillEnabled: z.boolean(),
  aiBaseUrl: z.string(),
  aiModel: z.string(),
  aiTimeoutSec: z.number(),
  aiMaxRetries: z.number(),
  repliesPerRequest: z.number(),
});

export default createEndpoint({
  description: 'Admin: read or update quota and AI settings',
  inputSchema: z.object({ token: z.string(), update: schema.optional() }),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const adminUid = session.ownerId;
    await requireAdmin(adminUid);
    const cur = await getSettings();
    if (input.update) {
      const u = input.update;
      const ok = u.initialCredits >= 0 && u.initialCredits <= 100 && u.referralReward >= 0 && u.referralReward <= 100
        && u.dailyRefill >= 0 && u.dailyRefill <= 100 && u.waitHours >= 0.1 && u.waitHours <= 720 && u.referralCap >= 0
        && u.aiTimeoutSec >= 5 && u.aiTimeoutSec <= 120 && u.aiMaxRetries >= 0 && u.aiMaxRetries <= 3
        && u.repliesPerRequest >= 1 && u.repliesPerRequest <= 5 && /^https:\/\/\S+$/.test(u.aiBaseUrl) && u.aiModel.trim().length > 0;
      if (!ok) throw new ZiteError({ code: 'BAD_REQUEST', message: 'invalid', userFacingMessage: 'یکی از مقادیر خارج از محدوده‌ست.' });
      const { id, ...before } = cur;
      await zite.systemSettings.update({ id, record: { ...u, aiModel: u.aiModel.trim() } });
      await audit(adminUid, 'settings_updated', undefined, { before, after: u });
      return { ...u, aiKeyConfigured: !!process.env.ZITE_AI_API_KEY };
    }
    const { id: _id, ...rest } = cur;
    return { ...rest, aiKeyConfigured: !!process.env.ZITE_AI_API_KEY };
  },
});
