import { z } from 'zod';
import { requireSession } from '../server/session';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { applyLedger, completeReferral, getSettings, quotaView, requireProfile, syncQuota, track } from '../server/credits';
import { NaraRouterProvider, AIError } from '../server/ai';
import { generateReplies as runAI } from '../server/replyService';
import { SITUATIONS, TONES, RELATIONSHIPS, LENGTHS, MAX_INPUT } from '../shared/options';

const ids = (l: readonly { id: string }[]) => l.map((x) => x.id);

export default createEndpoint({
  description: 'Generates reply suggestions and charges one credit only on success',
  inputSchema: z.object({ token: z.string(),
    text: z.string(),
    situation: z.string(),
    tone: z.string(),
    relationship: z.string().optional(),
    length: z.string(),
    idempotencyKey: z.string(),
    isRegenerate: z.boolean().optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ input }) => {
    const session = await requireSession(input.token);
    const uid = session.ownerId;
    const text = input.text.trim();
    if (text.length < 2 || text.length > MAX_INPUT) throw new ZiteError({ code: 'BAD_REQUEST', message: 'len', userFacingMessage: `متن باید بین ۲ تا ${MAX_INPUT} حرف باشه.` });
    if (!ids(SITUATIONS).includes(input.situation) || !ids(TONES).includes(input.tone) || !ids(LENGTHS).includes(input.length)
      || (input.relationship && !ids(RELATIONSHIPS).includes(input.relationship))) {
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'opts', userFacingMessage: 'گزینه‌ها معتبر نیستن.' });
    }
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(input.idempotencyKey)) throw new ZiteError({ code: 'BAD_REQUEST', message: 'key' });
    const key = `${uid}:${input.idempotencyKey}`;

    // A retried request returns the original result and never charges twice.
    const prior = await zite.aiRequests.findOne({ filters: { idempotencyKey: key } });
    if (prior?.status === 'Success') {
      const cfg = await getSettings();
      const { quota } = await quotaView(uid, cfg);
      return { requestId: prior.id, replies: JSON.parse(prior.repliesJson || '[]') as string[], tone: prior.tone, quota };
    }
    if (prior?.status === 'Processing') throw new ZiteError({ code: 'CONFLICT', message: 'busy', userFacingMessage: 'درخواست قبلی هنوز در حال انجامه.' });

    const cfg = await getSettings();
    const profile = await syncQuota(uid, cfg);
    if ((profile.balance ?? 0) < 1) throw new ZiteError({ code: 'FORBIDDEN', message: 'no credit', userFacingMessage: 'فعلاً جوابی نمونده!' });

    // One in-flight generation per user, so parallel requests can't spend the same credit.
    const recentCutoff = new Date(Date.now() - (cfg.aiTimeoutSec * (cfg.aiMaxRetries + 1) + 15) * 1000).toISOString();
    const inflight = await zite.aiRequests.findOne({ filters: { ownerId: uid, status: 'Processing', createdAt: { gt: recentCutoff } } });
    if (inflight) throw new ZiteError({ code: 'CONFLICT', message: 'busy', userFacingMessage: 'یه درخواست دیگه در حال انجامه، چند ثانیه صبر کن.' });

    const req = await zite.aiRequests.create({
      record: {
        ownerId: uid, preview: text.slice(0, 60), inputText: text, situation: input.situation, tone: input.tone,
        relationship: input.relationship, length: input.length, status: 'Processing', idempotencyKey: key, model: cfg.aiModel, hidden: false,
      },
    });
    const { records: sameKey } = await zite.aiRequests.findAll({ filters: { idempotencyKey: key }, sort: [{ field: 'createdAt', direction: 'asc' }], limit: 3 });
    if (sameKey[0] && sameKey[0].id !== req.id) {
      await zite.aiRequests.delete({ id: req.id });
      throw new ZiteError({ code: 'CONFLICT', message: 'dup', userFacingMessage: 'درخواست تکراری بود.' });
    }

    const started = Date.now();
    const provider = new NaraRouterProvider({
      baseUrl: cfg.aiBaseUrl, apiKey: process.env.ZITE_AI_API_KEY ?? '', model: cfg.aiModel,
      timeoutMs: cfg.aiTimeoutSec * 1000, maxRetries: cfg.aiMaxRetries,
    });
    let result: { replies: string[]; tokens: number; model: string };
    try {
      result = await runAI(provider, { text, situation: input.situation, tone: input.tone, relationship: input.relationship, length: input.length }, cfg.repliesPerRequest);
    } catch (e) {
      const kind = e instanceof AIError ? e.kind : 'PROVIDER';
      await zite.aiRequests.update({ id: req.id, record: { status: 'Failed', errorCode: kind, durationMs: Date.now() - started } });
      console.error('ai failed', kind);
      throw new ZiteError({
        code: 'INTERNAL_ERROR', message: `ai ${kind}`,
        userFacingMessage: kind === 'TIMEOUT' ? 'جواب دیر رسید. دوباره امتحان کن؛ اعتباری کم نشد.'
          : kind === 'CREDITS' || kind === 'CONFIG' ? 'سرویس هوش مصنوعی موقتاً در دسترس نیست. کمی بعد امتحان کن؛ اعتباری کم نشد.'
          : 'ساختن جواب نشد. دوباره امتحان کن؛ اعتباری کم نشد.',
      });
    }

    await applyLedger(uid, 'AI_USAGE', -1, `use:${req.id}`, input.isRegenerate ? 'تولید مجدد' : 'تولید جواب', { requestId: req.id });
    const now = new Date().toISOString();
    const fresh = await requireProfile(uid);
    const firstReply = (fresh.totalReplies ?? 0) === 0;
    await zite.profiles.update({ id: fresh.id, record: { lastSuccessAt: now, totalReplies: (fresh.totalReplies ?? 0) + 1 } });
    await zite.aiRequests.update({
      id: req.id,
      record: { status: 'Success', repliesJson: JSON.stringify(result.replies), tokensUsed: result.tokens, model: result.model, durationMs: Date.now() - started },
    });
    await track(input.isRegenerate ? 'reply_regenerated' : 'reply_generated', uid, `${input.situation}/${input.tone}`);
    if (firstReply) {
      await track('first_reply_generated', uid);
      await completeReferral(uid, cfg);
    }
    const { quota } = await quotaView(uid, cfg);
    return { requestId: req.id, replies: result.replies, tone: input.tone, quota };
  },
});
