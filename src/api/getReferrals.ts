import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { getSettings, requireProfile } from '../server/credits';

export default createEndpoint({
  description: 'Returns the signed-in user\'s referral link and invite stats',
  inputSchema: z.object({ token: z.string(),}),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const uid = session.ownerId;
    const p = await requireProfile(uid);
    const cfg = await getSettings();
    const { records } = await zite.referrals.findAll({
      filters: { inviterId: uid }, sort: [{ field: 'createdAt', direction: 'desc' }], limit: 500,
    });
    const completed = records.filter((r) => r.status === 'Completed');
    return {
      code: p.referralCode ?? '',
      link: `${process.env.ZITE_APP_URL}/join/${p.referralCode}`,
      enabled: cfg.referralsEnabled,
      reward: cfg.referralReward,
      successful: completed.length,
      waiting: records.filter((r) => r.status === 'Signed Up' || r.status === 'Review').length,
      pendingRewards: records.filter((r) => r.rewardStatus === 'Pending').reduce((s, r) => s + (r.rewardAmount ?? 0), 0),
      grantedRewards: records.filter((r) => r.rewardStatus === 'Granted').reduce((s, r) => s + (r.rewardAmount ?? 0), 0),
    };
  },
});
