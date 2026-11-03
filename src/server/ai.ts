import { zite } from 'zitejs/db';
// AI provider abstraction. Business logic only talks to `AIProvider`.

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type AIResult = { text: string; tokens: number; model: string };
export interface AIProvider {
  complete(messages: ChatMessage[]): Promise<AIResult>;
}

export class AIError extends Error {
  constructor(public kind: 'TIMEOUT' | 'PROVIDER' | 'INVALID' | 'CONFIG' | 'CREDITS', message: string) {
    super(message);
  }
}

type Cfg = { baseUrl: string; apiKey: string; model: string; timeoutMs: number; maxRetries: number };

/**
 * NaraRouter adapter (OpenAI-compatible `/v1/chat/completions`).
 * - `model` may be a comma-separated fallback chain, e.g. "laguna-s-2.1,stepfun-3.7-flash".
 * - Asks for JSON mode first; if the model rejects the parameter (400) it retries once without it.
 * - Retries 429/5xx/timeouts with exponential backoff; 402 (no credit) skips to the next model.
 */
export class NaraRouterProvider implements AIProvider {
  constructor(private cfg: Cfg) {}

  private get models() {
    return this.cfg.model.split(',').map((m) => m.trim()).filter(Boolean);
  }

  private async call(model: string, messages: ChatMessage[], jsonMode: boolean) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
    try {
      const res = await fetch(`${this.cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.cfg.apiKey}` },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.95,
          top_p: 0.95,
          max_tokens: 900,
          stream: false,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
      const raw = await res.text();
      if (!res.ok) {
        // Stable envelope: { error: { type, message, request_id } } — switch on `type`, never the message.
        let msg = raw.slice(0, 200), type = '', requestId = '';
        try {
          const err = JSON.parse(raw)?.error ?? {};
          msg = err.message ?? msg; type = err.type ?? ''; requestId = err.request_id ?? '';
        } catch { /* non-JSON (e.g. CDN error page) */ }
        return { ok: false as const, status: res.status, type, requestId, msg };
      }
      const data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) return { ok: false as const, status: 0, msg: 'empty' };
      return { ok: true as const, text, tokens: data.usage?.total_tokens ?? 0 };
    } catch (e) {
      return { ok: false as const, status: (e as Error)?.name === 'AbortError' ? -1 : 0, msg: String(e) };
    } finally {
      clearTimeout(timer);
    }
  }

  async complete(messages: ChatMessage[]): Promise<AIResult> {
    if (!this.cfg.apiKey) throw new AIError('CONFIG', 'missing api key');
    if (!this.models.length) throw new AIError('CONFIG', 'missing model');
    let last: AIError = new AIError('PROVIDER', 'failed');

    for (const model of this.models) {
      let jsonMode = true;
      for (let attempt = 0; attempt <= this.cfg.maxRetries; attempt++) {
        const r = await this.call(model, messages, jsonMode);
        if (r.ok) return { text: r.text, tokens: r.tokens, model };
        const type = 'type' in r ? r.type : '';
        console.error('[nararouter]', model, r.status, type, 'requestId' in r ? r.requestId : '', r.msg);

        if (r.status === 402) { last = new AIError('CREDITS', r.msg); break; } // no balance → next model
        if (type === 'unauthorized' || r.status === 401) throw new AIError('CONFIG', r.msg); // bad key: no model will work
        if (type === 'forbidden' || r.status === 403) { last = new AIError('CONFIG', r.msg); break; } // plan lacks model → next
        if (type === 'not_found' || r.status === 404) { last = new AIError('CONFIG', r.msg); break; } // unknown alias → next
        if (type === 'validation_error' || r.status === 400 || r.status === 413 || r.status === 415 || r.status === 422) {
          // Safety rejections are terminal ("rejected locally") — but the only optional param we send is JSON mode,
          // so drop it once, then move to the next model (docs: "route the session to a different model").
          if (jsonMode) { jsonMode = false; attempt--; continue; }
          last = new AIError('PROVIDER', r.msg);
          break;
        }
        // rate_limited (429) is per model tier → other tiers may still work, so move on instead of hammering.
        if (type === 'rate_limited' || r.status === 429) { last = new AIError('PROVIDER', r.msg); break; }
        // service_unavailable / internal_error / timeout / network → retry with backoff below.
        last = r.status === -1 ? new AIError('TIMEOUT', 'timeout') : new AIError(r.status === 0 && r.msg === 'empty' ? 'INVALID' : 'PROVIDER', r.msg);
        if (attempt < this.cfg.maxRetries) await new Promise((ok) => setTimeout(ok, 500 * 2 ** attempt));
      }
    }
    throw last;
  }
}

/** Built-in Zite AI via a database AI field (no external key). */
export class ZiteAIProvider implements AIProvider {
  constructor(private timeoutMs = 60000) {}
  async complete(messages: ChatMessage[]): Promise<AIResult> {
    const prompt = messages.map((m) => (m.role === 'system' ? m.content : `---\n${m.content}`)).join('\n\n')
      + '\n\nفقط و فقط JSON خروجی بده، بدون هیچ متن اضافه.';
    const created = (await zite.aiJobs.create({ record: { prompt } })) as unknown as { id?: string; record?: { id: string } };
    const id = created.id ?? created.record?.id ?? '';
    const end = Date.now() + this.timeoutMs;
    try {
      while (Date.now() < end) {
        await new Promise((ok) => setTimeout(ok, 1200));
        const got = (await zite.aiJobs.findOne({ id })) as unknown as { output?: string; record?: { output?: string } };
        const out = (got?.output ?? got?.record?.output ?? '').trim();
        if (out) return { text: out, tokens: 0, model: 'zite-ai' };
      }
      throw new AIError('TIMEOUT', 'zite ai timeout');
    } finally {
      zite.aiJobs.delete({ id }).catch(() => {});
    }
  }
}

/** Tries each provider in order; returns the first success. */
export class ChainProvider implements AIProvider {
  constructor(private providers: AIProvider[]) {}
  async complete(messages: ChatMessage[]): Promise<AIResult> {
    let last: unknown = new AIError('PROVIDER', 'failed');
    for (const p of this.providers) {
      try { return await p.complete(messages); } catch (e) { last = e; }
    }
    throw last;
  }
}

/** Pulls the first JSON object out of a model reply (handles ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const t = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/gi, '').trim();
  try { return JSON.parse(t); } catch { /* fallthrough */ }
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s >= 0 && e > s) return JSON.parse(t.slice(s, e + 1));
  throw new Error('no json');
}
