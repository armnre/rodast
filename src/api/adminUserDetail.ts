import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireAdmin } from '../server/credits';

export default createEndpoint({
  description: 'Admin: one user\'s credit ledger and referrals',
  inputSchema: z.object({ token: z.string(), profileId: z.string() }),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const adminUid = session.ownerId;
    await requireAdmin(adminUid);
    const p = await zite.profiles.findOne({ id: input.profileId });
    if (!p) throw new ZiteError({ code: 'NOT_FOUND', message: 'nf' });
    const uid = p.ownerId ?? '';
    const [tx, asInviter, asInvitee] = await Promise.all([
      zite.creditTransactions.findAll({ filters: { ownerId: uid }, sort: [{ field: 'createdAt', direction: 'desc' }], limit: 100 }),
      zite.referrals.findAll({ filters: { inviterId: uid }, sort: [{ field: 'createdAt', direction: 'desc' }], limit: 100 }),
      zite.referrals.findAll({ filters: { inviteeId: uid }, limit: 5 }),
      Promise.resolve(null),
    ]);
    return {
      email: p.phone ?? '',
      phone: p.phone ?? '',
      pendingReferralCredits: p.pendingReferralCredits ?? 0,
      lastSuccessAt: p.lastSuccessAt ? String(p.lastSuccessAt) : null,
      referralCode: p.referralCode ?? '',
      transactions: tx.records.map((t) => ({
        id: t.id, type: t.type ?? '', amount: t.amount ?? 0, balanceAfter: t.balanceAfter ?? 0,
        description: t.description ?? '', createdAt: t.createdAt ? String(t.createdAt) : '',
      })),
      referrals: [...asInviter.records, ...asInvitee.records].map((r) => ({
        id: r.id, role: asInviter.records.includes(r) ? 'inviter' : 'invitee', status: r.status ?? '',
        rewardStatus: r.rewardStatus ?? '', note: r.note ?? '', createdAt: r.createdAt ? String(r.createdAt) : '',
      })),
    };
  },
});
