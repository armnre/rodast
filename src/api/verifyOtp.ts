import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { normalizePhone, ownerIdFor, randomToken, sha256, SESSION_DAYS } from '../server/session';
import { track } from '../server/credits';

export default createEndpoint({
  description: 'Verifies a mobile one-time code and opens a session',
  inputSchema: z.object({ phone: z.string(), code: z.string() }),
  outputSchema: z.object({ token: z.string(), phone: z.string() }),
  execute: async ({ input }) => {
    const phone = normalizePhone(input.phone);
    const code = input.code.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).trim();
    if (!phone || !/^\d{5}$/.test(code)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'bad', userFacingMessage: 'کد ۵ رقمی رو کامل وارد کن.' });

    const otp = (await zite.otpCodes.findAll({ filters: { phone, used: false }, sort: [{ field: 'createdAt', direction: 'desc' }], limit: 1 })).records[0];
    if (!otp || (otp.expiresAt && new Date(String(otp.expiresAt)).getTime() < Date.now())) {
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'expired', userFacingMessage: 'کد منقضی شده، یه کد جدید بگیر.' });
    }
    const attempts = (otp.attempts ?? 0) + 1;
    if (otp.code !== code) {
      await zite.otpCodes.update({ id: otp.id, record: { attempts, used: attempts >= 5 } });
      throw new ZiteError({
        code: 'BAD_REQUEST', message: 'wrong',
        userFacingMessage: attempts >= 5 ? 'تلاش‌ها زیاد شد، یه کد جدید بگیر.' : `کد اشتباهه. ${5 - attempts} بار دیگه فرصت داری.`,
      });
    }
    await zite.otpCodes.update({ id: otp.id, record: { used: true, attempts } });

    const token = randomToken();
    const ownerId = ownerIdFor(phone);
    await zite.sessions.create({
      record: { token: await sha256(token), ownerId, phone, revoked: false, expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString() },
    });
    await track('phone_verified', ownerId, 'otp');
    return { token, phone };
  },
});
