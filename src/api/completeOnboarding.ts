import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { applyLedger, findProfile, getSettings, track } from '../server/credits';

const USERNAME = /^[a-z0-9_]{3,20}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

export default createEndpoint({
  description: 'Creates the profile for a newly verified user and grants initial credits',
  inputSchema: z.object({ token: z.string(),
    displayName: z.string(),
    username: z.string(),
    termsAccepted: z.boolean(),
    referralCode: z.string().optional(),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const uid = session.ownerId;
    const displayName = input.displayName.trim().replace(/[<>]/g, '');
    const username = input.username.trim().toLowerCase();
    if (displayName.length < 2 || displayName.length > 30) throw new ZiteError({ code: 'BAD_REQUEST', message: 'name', userFacingMessage: 'نام نمایشی باید بین ۲ تا ۳۰ حرف باشه.' });
    if (!USERNAME.test(username)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'username', userFacingMessage: 'نام کاربری فقط حروف انگلیسی کوچک، عدد و _ (۳ تا ۲۰ حرف).' });
    if (!input.termsAccepted) throw new ZiteError({ code: 'BAD_REQUEST', message: 'terms', userFacingMessage: 'باید قوانین رو بپذیری.' });

    if (await findProfile(uid)) return { ok: true };
    if (await zite.profiles.findOne({ filters: { username } })) {
      throw new ZiteError({ code: 'CONFLICT', message: 'taken', userFacingMessage: 'این نام کاربری قبلاً گرفته شده.' });
    }

    let code = newCode();
    while (await zite.profiles.findOne({ filters: { referralCode: code } })) code = newCode();

    const cfg = await getSettings();
    const refCode = input.referralCode?.trim().toUpperCase();
    const inviter = refCode && /^[A-Z0-9]{6}$/.test(refCode) ? await zite.profiles.findOne({ filters: { referralCode: refCode } }) : undefined;
    const inviterId = inviter ? inviter.ownerId : undefined;

    // Demo bootstrap: the first mobile-verified user becomes the admin.
    const admins = (await zite.profiles.findAll({ filters: { isAdmin: true }, limit: 200 })).records.filter((p) => !!p.ownerId);
    await zite.profiles.create({
      record: {
        ownerId: uid, phone: session.phone, displayName, username, referralCode: code,
        balance: 0, initialExhausted: false, pendingReferralCredits: 0, totalReplies: 0,
        status: 'Active', isAdmin: admins.length === 0, termsAccepted: true, creditVersion: 0,
        referredByCode: inviterId && inviterId !== uid ? refCode : undefined,
      },
    });
    // Guard against a double submit creating two profiles.
    const { records: mine } = await zite.profiles.findAll({ filters: { ownerId: uid }, sort: [{ field: 'joinedAt', direction: 'asc' }], limit: 5 });
    for (const extra of mine.slice(1)) await zite.profiles.delete({ id: extra.id });

    await applyLedger(uid, 'INITIAL_GRANT', cfg.initialCredits, `init:${uid}`, 'سهمیه‌ی اولیه');

    if (inviterId && inviterId !== uid && cfg.referralsEnabled) {
      const already = await zite.referrals.findOne({ filters: { inviteeId: uid } });
      if (!already) {
        await zite.referrals.create({ record: { code: refCode, inviterId, inviteeId: uid, status: 'Signed Up', rewardStatus: 'None' } });
        await track('referral_signup', uid);
      }
    }
    await track('signup_completed', uid);
    await track('phone_verified', uid, 'email');
    return { ok: true };
  },
});
