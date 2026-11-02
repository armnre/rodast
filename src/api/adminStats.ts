import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireAdmin } from '../server/credits';

export default createEndpoint({
  description: 'Admin: key product metrics',
  inputSchema: z.object({ token: z.string(),}),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const adminUid = session.ownerId;
    await requireAdmin(adminUid);
    const q = async (query: string) => (await zite.sql({ query })).rows[0] ?? {};
    const [users, ai, refs, credits, events] = await Promise.all([
      q(`SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE "joinedAt" > NOW() - INTERVAL '7 days')::int AS new7,
                COUNT(*) FILTER (WHERE "lastSuccessAt" > NOW() - INTERVAL '1 day')::int AS dau,
                COUNT(*) FILTER (WHERE "lastSuccessAt" > NOW() - INTERVAL '7 days')::int AS wau,
                COUNT(*) FILTER (WHERE "status" = 'Blocked')::int AS blocked,
                COUNT(*) FILTER (WHERE "initialExhausted" = true)::int AS exhausted,
                COUNT(*) FILTER (WHERE "totalReplies" > 0)::int AS activated,
                COUNT(*) FILTER (WHERE "totalReplies" > 1)::int AS repeat
         FROM "Profiles"`),
      q(`SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE "status" = 'Success')::int AS success,
                COUNT(*) FILTER (WHERE "status" = 'Failed')::int AS failed,
                COALESCE(SUM("tokensUsed"),0)::int AS tokens,
                COALESCE(AVG("durationMs") FILTER (WHERE "status" = 'Success'),0)::int AS avg_ms
         FROM "AiRequests"`),
      q(`SELECT COUNT(*) FILTER (WHERE "status" = 'Completed')::int AS completed,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE "status" = 'Review')::int AS review
         FROM "Referrals"`),
      q(`SELECT COALESCE(SUM("amount") FILTER (WHERE "amount" > 0),0)::int AS granted,
                COALESCE(-SUM("amount") FILTER (WHERE "type" = 'AI_USAGE'),0)::int AS used
         FROM "CreditTransactions"`),
      q(`SELECT COUNT(*) FILTER (WHERE "event" = 'reply_copied')::int AS copies,
                COUNT(*) FILTER (WHERE "event" = 'signup_started')::int AS signup_started,
                COUNT(*) FILTER (WHERE "event" = 'pwa_installed')::int AS installs
         FROM "AnalyticsEvents"`),
    ]);
    const daily = await zite.sql({
      query: `SELECT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'MM-DD') AS day,
                     COUNT(*) FILTER (WHERE "status" = 'Success')::int AS success,
                     COUNT(*) FILTER (WHERE "status" = 'Failed')::int AS failed
              FROM "AiRequests" WHERE "createdAt" > NOW() - INTERVAL '14 days'
              GROUP BY 1 ORDER BY 1`,
    });
    const errors = await zite.sql({
      query: `SELECT "errorCode" AS code, COUNT(*)::int AS n FROM "AiRequests"
              WHERE "status" = 'Failed' AND "createdAt" > NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 2 DESC`,
    });
    return { users, ai, refs, credits, events, daily: daily.rows, errors: errors.rows };
  },
});
