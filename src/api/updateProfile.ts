import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireProfile } from '../server/credits';
import { AVATARS, VIBES } from '../shared/avatars';

export default createEndpoint({
  description: 'Updates the signed-in user profile (name, username, avatar, bio, vibe)',
  inputSchema: z.object({
    token: z.string(), displayName: z.string(), username: z.string(),
    avatar: z.string().optional(), bio: z.string().optional(), vibe: z.string().optional(), cover: z.string().optional(),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const p = await requireProfile(session.ownerId);
    const displayName = input.displayName.trim().replace(/[<>]/g, '');
    const username = input.username.trim().toLowerCase();
    const bio = (input.bio ?? p.bio ?? '').trim().replace(/[<>]/g, '');
    if (displayName.length < 2 || displayName.length > 30) throw new ZiteError({ code: 'BAD_REQUEST', message: 'name', userFacingMessage: 'نام نمایشی باید بین ۲ تا ۳۰ حرف باشه.' });
    if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'username', userFacingMessage: 'نام کاربری فقط حروف انگلیسی کوچک، عدد و _ (۳ تا ۲۰ حرف).' });
    if (bio.length > 120) throw new ZiteError({ code: 'BAD_REQUEST', message: 'bio', userFacingMessage: 'بیو حداکثر ۱۲۰ حرف.' });
    const avatar = input.avatar !== undefined ? input.avatar : p.avatar ?? '';
    if (avatar && !AVATARS.some((a) => a.id === avatar)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'avatar', userFacingMessage: 'آواتار معتبر نیست.' });
    const vibe = input.vibe !== undefined ? input.vibe : p.vibe ?? '';
    if (vibe && !(VIBES as readonly string[]).includes(vibe)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'vibe', userFacingMessage: 'حال‌وهوا معتبر نیست.' });
    if (username !== p.username) {
      const other = await zite.profiles.findOne({ filters: { username } });
      if (other && other.id !== p.id) throw new ZiteError({ code: 'CONFLICT', message: 'taken', userFacingMessage: 'این نام کاربری قبلاً گرفته شده.' });
    }
    const cover = input.cover !== undefined ? input.cover : p.cover ?? '';
    if (cover && !/^https:\/\/(eu-)?uploads\.zite\.com\//.test(cover)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'cover', userFacingMessage: 'تصویر کاور معتبر نیست.' });
    await zite.profiles.update({ id: p.id, record: { displayName, username, avatar, bio, vibe, cover } });
    return { ok: true };
  },
});
