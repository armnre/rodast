import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/credits';

export default createEndpoint({
  description: 'Deletes the user\'s personal data and closes the account',
  inputSchema: z.object({ token: z.string(), confirm: z.literal(true) }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const uid = session.ownerId;
    const p = await requireProfile(uid);
    for (let i = 0; i < 50; i++) {
      const { records } = await zite.aiRequests.findAll({ filters: { ownerId: uid, hidden: false }, limit: 100 });
      if (!records.length) break;
      for (const r of records) await zite.aiRequests.update({ id: r.id, record: { hidden: true, inputText: '', repliesJson: '[]', preview: '' } });
    }
    // Keep a closed tombstone so the same account can't re-claim the initial grant.
    await zite.profiles.update({
      id: p.id,
      record: { displayName: 'حساب حذف‌شده', username: `deleted_${p.id.slice(0, 8)}`, status: 'Blocked', balance: 0, pendingReferralCredits: 0 },
    });
    await zite.auditLogs.create({ record: { actorId: uid, action: 'account_deleted', targetUserId: uid, details: '{}' } });
    return { ok: true };
  },
});
