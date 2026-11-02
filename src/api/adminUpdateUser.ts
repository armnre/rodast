import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { applyLedger, audit, requireAdmin } from '../server/credits';

export default createEndpoint({
  description: 'Admin: block/unblock a user or adjust their credits with a reason',
  inputSchema: z.object({ token: z.string(),
    profileId: z.string(),
    action: z.enum(['block', 'unblock', 'adjust']),
    amount: z.number().optional(),
    reason: z.string(),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const adminUid = session.ownerId;
    const admin = await requireAdmin(adminUid);
    const reason = input.reason.trim();
    if (reason.length < 3) throw new ZiteError({ code: 'BAD_REQUEST', message: 'reason', userFacingMessage: 'دلیل رو بنویس.' });
    const p = await zite.profiles.findOne({ id: input.profileId });
    if (!p) throw new ZiteError({ code: 'NOT_FOUND', message: 'nf' });
    const uid = p.ownerId ?? '';
    if (input.action === 'adjust') {
      const amt = Math.trunc(input.amount ?? 0);
      if (!amt || Math.abs(amt) > 1000) throw new ZiteError({ code: 'BAD_REQUEST', message: 'amt', userFacingMessage: 'مقدار نامعتبره.' });
      await applyLedger(uid, 'ADMIN_ADJUSTMENT', amt, `admin:${admin.id}:${crypto.randomUUID()}`, `اصلاح مدیر: ${reason.slice(0, 120)}`);
    } else {
      if (p.id === admin.id) throw new ZiteError({ code: 'BAD_REQUEST', message: 'self', userFacingMessage: 'نمی‌تونی خودت رو مسدود کنی.' });
      await zite.profiles.update({ id: p.id, record: { status: input.action === 'block' ? 'Blocked' : 'Active' } });
    }
    await audit(adminUid, `user_${input.action}`, uid, { amount: input.amount, reason });
    return { ok: true };
  },
});
