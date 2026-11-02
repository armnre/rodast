import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { normalizePhone } from '../server/session';
import { track } from '../server/credits';

const RESEND_SEC = 60;

export default createEndpoint({
  description: 'Sends a demo one-time code for mobile sign-in (code is shown on screen in demo mode)',
  inputSchema: z.object({ phone: z.string() }),
  outputSchema: z.object({ phone: z.string(), demoCode: z.string(), resendIn: z.number(), expiresIn: z.number() }),
  execute: async ({ input }) => {
    const phone = normalizePhone(input.phone);
    if (!phone) throw new ZiteError({ code: 'BAD_REQUEST', message: 'phone', userFacingMessage: 'شماره موبایل درست نیست. مثل ۰۹۱۲۳۴۵۶۷۸۹' });

    const { records: recent } = await zite.otpCodes.findAll({ filters: { phone }, sort: [{ field: 'createdAt', direction: 'desc' }], limit: 6 });
    const last = recent[0];
    if (last?.createdAt) {
      const age = (Date.now() - new Date(String(last.createdAt)).getTime()) / 1000;
      if (age < RESEND_SEC) {
        throw new ZiteError({ code: 'RATE_LIMITED', message: 'wait', userFacingMessage: `${Math.ceil(RESEND_SEC - age)} ثانیه دیگه می‌تونی دوباره کد بگیری.` });
      }
    }
    const hourAgo = Date.now() - 3600_000;
    if (recent.filter((r) => r.createdAt && new Date(String(r.createdAt)).getTime() > hourAgo).length >= 5) {
      throw new ZiteError({ code: 'RATE_LIMITED', message: 'hourly', userFacingMessage: 'تعداد درخواست کد زیاد شد؛ یه ساعت دیگه امتحان کن.' });
    }
    for (const r of recent) if (r.used !== true) await zite.otpCodes.update({ id: r.id, record: { used: true } });

    const a = new Uint32Array(1); crypto.getRandomValues(a);
    const code = String(10000 + (a[0] % 90000));
    await zite.otpCodes.create({ record: { phone, code, expiresAt: new Date(Date.now() + 120_000).toISOString(), attempts: 0, used: false } });
    await track('otp_requested');
    // DEMO: no SMS provider is connected yet, so the code is returned to show on screen.
    return { phone, demoCode: code, resendIn: RESEND_SEC, expiresIn: 120 };
  },
});
