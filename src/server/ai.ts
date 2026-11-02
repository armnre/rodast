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
        let msg = raw.slice(0, 200);
        try { msg = JSON.parse(raw)?.error?.message ?? msg; } catch { /* keep raw */ }
        return { ok: false as const, status: res.status, msg };
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
        console.error('[nararouter]', model, r.status, r.msg);

        if (r.status === 402) { last = new AIError('CREDITS', r.msg); break; }
        if (r.status === 401 || r.status === 403) throw new AIError('CONFIG', r.msg);
        if (r.status === 400 || r.status === 404 || r.status === 422) {
          if (jsonMode) { jsonMode = false; attempt--; continue; } // retry once without JSON mode
          last = new AIError('PROVIDER', r.msg);
          break; // model rejects us — try next model
        }
        last = r.status === -1 ? new AIError('TIMEOUT', 'timeout') : new AIError(r.status === 0 && r.msg === 'empty' ? 'INVALID' : 'PROVIDER', r.msg);
        if (attempt < this.cfg.maxRetries) await new Promise((ok) => setTimeout(ok, 500 * 2 ** attempt));
      }
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
