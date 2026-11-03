import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { viewer, notBlocked } from '../server/social';

const User = z.object({ id: z.string(), displayName: z.string(), username: z.string(), avatar: z.string(), bio: z.string(), followers: z.number(), iFollow: z.boolean() });

export default createEndpoint({
  description: 'Explore: user search, trending hashtags and suggested people',
  inputSchema: z.object({ token: z.string(), q: z.string().optional() }),
  outputSchema: z.object({ users: z.array(User), trends: z.array(z.object({ tag: z.string(), count: z.number() })) }),
  execute: async ({ input }) => {
    const { uid } = await viewer(input.token);
    const q = (input.q ?? '').trim().replace(/^@/, '').replace(/[%_]/g, '');
    const userSql = `
      SELECT a."ownerId" AS id, a."displayName", a."username", a."avatar", a."bio",
        (SELECT COUNT(*) FROM "Follows" f WHERE f."followingId" = a."ownerId") AS followers,
        EXISTS (SELECT 1 FROM "Follows" f WHERE f."followerId" = $1 AND f."followingId" = a."ownerId") AS "iFollow"
      FROM "Profiles" a
      WHERE a."status" = 'Active' AND a."ownerId" <> $1 AND a."username" IS NOT NULL AND a."username" NOT LIKE 'deleted\\_%'
        AND ${notBlocked('a."ownerId"', '$1')}
        ${q ? `AND (a."username" ILIKE $2 OR a."displayName" ILIKE $2)` : `AND a."ownerId" NOT IN (SELECT "followingId" FROM "Follows" WHERE "followerId" = $1)`}
      ORDER BY followers DESC, a.created_at DESC
      LIMIT ${q ? 20 : 8}`;
    const users = await zite.sql({ query: userSql, params: q ? [uid, `%${q}%`] : [uid] });

    const trends = q ? { rows: [] } : await zite.sql({
      query: `SELECT t.tag, COUNT(*) AS count FROM "Posts" p,
          LATERAL regexp_split_to_table(trim(p."hashtags"), '\\s+') AS t(tag)
        WHERE p."status" = 'Active' AND p."hashtags" <> '' AND p.created_at > now() - interval '7 days'
        GROUP BY t.tag ORDER BY count DESC LIMIT 10`,
    });

    return {
      users: (users.rows as Record<string, unknown>[]).map((u) => ({
        id: String(u.id), displayName: String(u.displayName ?? ''), username: String(u.username ?? ''), avatar: String(u.avatar ?? ''),
        bio: String(u.bio ?? ''), followers: Number(u.followers ?? 0), iFollow: u.iFollow === true,
      })),
      trends: (trends.rows as Record<string, unknown>[]).filter((t) => String(t.tag).startsWith('#'))
        .map((t) => ({ tag: String(t.tag).slice(1), count: Number(t.count) })),
    };
  },
});
