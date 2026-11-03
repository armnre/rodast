import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import {
  viewer, bad, cleanMedia, extractTags, extractMentions, notify, rateLimit, isBlocked, hydrate, POST_MAX, type PostView,
} from '../server/social';

export default createEndpoint({
  description: 'Publishes a post, reply or quote (with optional media)',
  inputSchema: z.object({
    token: z.string(),
    body: z.string(),
    media: z.array(z.object({ url: z.string(), type: z.enum(['image', 'video']) })).default([]),
    parentId: z.string().optional(),
    quoteId: z.string().optional(),
    clientKey: z.string().min(8).max(64),
  }),
  outputSchema: z.object({ post: z.custom<PostView>() }),
  execute: async ({ input }) => {
    const { uid } = await viewer(input.token);
    const body = input.body.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    const media = cleanMedia(input.media ?? []);
    if ([...body].length > POST_MAX) throw bad(`متن پست حداکثر ${POST_MAX} کاراکتره.`);
    if (!body && media.length === 0) throw bad('پست خالیه! یه چیزی بنویس یا عکس/ویدئو بذار.');

    // Idempotent on clientKey: a retried submit returns the same post.
    const dup = await zite.posts.findOne({ filters: { clientKey: `${uid}:${input.clientKey}` } });
    if (dup) return { post: (await hydrate([dup.id], uid))[0] };
    await rateLimit(uid);

    let kind: 'Post' | 'Reply' | 'Quote' = 'Post';
    let target: { id: string; authorId?: string } | null = null;
    const targetId = input.parentId || input.quoteId;
    if (targetId) {
      const t = await zite.posts.findOne({ id: targetId }).catch(() => null);
      if (!t || t.status !== 'Active') throw bad('این پست دیگه در دسترس نیست.', 'NOT_FOUND');
      if (t.authorId && (await isBlocked(uid, t.authorId))) throw bad('امکان تعامل با این کاربر وجود نداره.', 'FORBIDDEN');
      target = { id: t.id, authorId: t.authorId };
      kind = input.parentId ? 'Reply' : 'Quote';
    }

    const tags = extractTags(body);
    const created = await zite.posts.create({
      record: {
        body, authorId: uid, kind, status: 'Active',
        parentId: kind === 'Reply' ? target!.id : '', refId: kind === 'Quote' ? target!.id : '',
        media: JSON.stringify(media), hashtags: tags.length ? ` ${tags.map((t) => '#' + t).join(' ')} ` : '',
        clientKey: `${uid}:${input.clientKey}`,
      },
    });

    if (target?.authorId) await notify(kind === 'Reply' ? 'Reply' : 'Quote', target.authorId, uid, created.id);
    const mentions = extractMentions(body);
    if (mentions.length) {
      const { records } = await zite.profiles.findAll({ filters: { username: { in: mentions } } as never, limit: 10 });
      for (const m of records) if (m.ownerId) await notify('Mention', m.ownerId, uid, created.id);
    }
    return { post: (await hydrate([created.id], uid))[0] };
  },
});
