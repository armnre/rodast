import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { viewer, bad } from '../server/social';

export default createEndpoint({
  description: 'Returns a public profile with follow counts and relationship to the viewer',
  inputSchema: z.object({ token: z.string(), username: z.string() }),
  outputSchema: z.object({
    id: z.string(), displayName: z.string(), username: z.string(), avatar: z.string(), verified: z.boolean(), bio: z.string(), cover: z.string(), vibe: z.string(),
    joinedAt: z.string(), followers: z.number(), following: z.number(), posts: z.number(),
    isMe: z.boolean(), iFollow: z.boolean(), followsMe: z.boolean(), iBlocked: z.boolean(), blockedMe: z.boolean(),
  }),
  execute: async ({ input }) => {
    const { uid } = await viewer(input.token);
    const p = await zite.profiles.findOne({ filters: { username: input.username.toLowerCase() } });
    if (!p?.ownerId || p.status === 'Blocked') throw bad('کاربر پیدا نشد.', 'NOT_FOUND');
    const t = p.ownerId;
    const r = await zite.sql({
      query: `SELECT
        (SELECT COUNT(*) FROM "Follows" WHERE "followingId" = $1) AS followers,
        (SELECT COUNT(*) FROM "Follows" WHERE "followerId" = $1) AS following,
        (SELECT COUNT(*) FROM "Posts" WHERE "authorId" = $1 AND "status" = 'Active' AND "kind" IN ('Post','Quote')) AS posts,
        EXISTS (SELECT 1 FROM "Follows" WHERE "followerId" = $2 AND "followingId" = $1) AS "iFollow",
        EXISTS (SELECT 1 FROM "Follows" WHERE "followerId" = $1 AND "followingId" = $2) AS "followsMe",
        EXISTS (SELECT 1 FROM "Blocks" WHERE "blockerId" = $2 AND "blockedId" = $1) AS "iBlocked",
        EXISTS (SELECT 1 FROM "Blocks" WHERE "blockerId" = $1 AND "blockedId" = $2) AS "blockedMe"`,
      params: [t, uid],
    });
    const x = (r.rows[0] ?? {}) as Record<string, unknown>;
    const blockedMe = x.blockedMe === true;
    return {
      id: t, displayName: p.displayName ?? '', username: p.username ?? '', avatar: p.avatar ?? '', verified: p.isVerified === true,
      bio: blockedMe ? '' : p.bio ?? '', cover: blockedMe ? '' : p.cover ?? '', vibe: p.vibe ?? '',
      joinedAt: String(p.joinedAt ?? ''),
      followers: Number(x.followers ?? 0), following: Number(x.following ?? 0), posts: Number(x.posts ?? 0),
      isMe: t === uid, iFollow: x.iFollow === true, followsMe: x.followsMe === true, iBlocked: x.iBlocked === true, blockedMe,
    };
  },
});
