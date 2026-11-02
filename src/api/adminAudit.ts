import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { audit, getSettings, grantReferral, requireAdmin } from '../server/credits';

export default createEndpoint({
  description: 'Admin: audit log, referrals awaiting review, and review decisions',
  inputSchema: z.object({ token: z.string(),
    decide: z.object({ referralId: z.string(), approve: z.boolean() }).optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const adminUid = session.ownerId;
    await requireAdmin(adminUid);
    if (input.decide) {
      const r = await zite.referrals.findOne({ id: input.decide.referralId });
      if (!r || r.status !== 'Review') throw new ZiteError({ code: 'NOT_FOUND', message: 'nf', userFacingMessage: 'این دعوت در انتظار بررسی نیست.' });
      const inviterId = r.inviterId ?? '';
      if (input.decide.approve) await grantReferral(r.id, inviterId, await getSettings());
      else await zite.referrals.update({ id: r.id, record: { status: 'Rejected', rewardStatus: 'None', note: 'rejected by admin' } });
      await audit(adminUid, input.decide.approve ? 'referral_approved' : 'referral_rejected', inviterId, { referralId: r.id });
    }
    const [logs, review] = await Promise.all([
      zite.auditLogs.findAll({ sort: [{ field: 'createdAt', direction: 'desc' }], limit: 100 }),
      zite.referrals.findAll({ filters: { status: 'Review' }, limit: 100 }),
    ]);
    return {
      logs: logs.records.map((l) => ({
        id: l.id, action: l.action ?? '', target: l.targetUserId ?? '', details: l.details ?? '',
        actor: l.actorId ?? '', createdAt: l.createdAt ? String(l.createdAt) : '',
      })),
      review: review.records.map((r) => ({ id: r.id, code: r.code ?? '', note: r.note ?? '', createdAt: r.createdAt ? String(r.createdAt) : '' })),
    };
  },
});
