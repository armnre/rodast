import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/credits';

export default createEndpoint({
  description: 'Updates the display name and username of the signed-in user',
  inputSchema: z.object({ token: z.string(), displayName: z.string(), username: z.string() }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const uid = session.ownerId;
    const p = await requireProfile(uid);
    const displayName = input.displayName.trim().replace(/[<>]/g, '');
    const username = input.username.trim().toLowerCase();
    if (displayName.length < 2 || displayName.length > 30) throw new ZiteError({ code: 'BAD_REQUEST', message: 'name', userFacingMessage: 'نام نمایشی باید بین ۲ تا ۳۰ حرف باشه.' });
    if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'username', userFacingMessage: 'نام کاربری فقط حروف انگلیسی کوچک، عدد و _ (۳ تا ۲۰ حرف).' });
    if (username !== p.username) {
      const other = await zite.profiles.findOne({ filters: { username } });
      if (other && other.id !== p.id) throw new ZiteError({ code: 'CONFLICT', message: 'taken', userFacingMessage: 'این نام کاربری قبلاً گرفته شده.' });
    }
    await zite.profiles.update({ id: p.id, record: { displayName, username } });
    return { ok: true };
  },
});
