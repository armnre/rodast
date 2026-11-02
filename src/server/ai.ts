// AI provider abstraction. Business logic only talks to `AIProvider`.

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type AIResult = { text: string; tokens: number };
export interface AIProvider {
  complete(messages: ChatMessage[]): Promise<AIResult>;
}

export class AIError extends Error {
  constructor(public kind: 'TIMEOUT' | 'PROVIDER' | 'INVALID' | 'CONFIG', message: string) {
    super(message);
  }
}

/** OpenAI-compatible adapter used for NaraRouter. */
export class NaraRouterProvider implements AIProvider {
  constructor(private cfg: { baseUrl: string; apiKey: string; model: string; timeoutMs: number; maxRetries: number }) {}

  async complete(messages: ChatMessage[]): Promise<AIResult> {
    if (!this.cfg.apiKey) throw new AIError('CONFIG', 'missing api key');
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.cfg.maxRetries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
      try {
        const res = await fetch(`${this.cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.cfg.apiKey}` },
          body: JSON.stringify({
            model: this.cfg.model,
            messages,
            temperature: 0.95,
            response_format: { type: 'json_object' },
          }),
        });
        if (!res.ok) {
          // 4xx (except 429) won't fix itself — don't retry.
          lastErr = new AIError('PROVIDER', `status ${res.status}`);
          if (res.status < 500 && res.status !== 429) throw lastErr;
          continue;
        }
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
        const text = data.choices?.[0]?.message?.content;
        if (!text) { lastErr = new AIError('INVALID', 'empty'); continue; }
        return { text, tokens: data.usage?.total_tokens ?? 0 };
      } catch (e) {
        if (e instanceof AIError && e.kind === 'PROVIDER' && !String(e.message).match(/status (5|429)/)) throw e;
        lastErr = (e as Error)?.name === 'AbortError' ? new AIError('TIMEOUT', 'timeout') : e;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr instanceof AIError ? lastErr : new AIError('PROVIDER', 'failed');
  }
}
