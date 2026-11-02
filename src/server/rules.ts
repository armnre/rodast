// Pure credit rules — no I/O, so they can be unit-tested.

export type Settings = {
  initialCredits: number;
  referralReward: number;
  dailyRefill: number;
  waitHours: number;
  referralCap: number;
  referralsEnabled: boolean;
  refillEnabled: boolean;
  aiBaseUrl: string;
  aiModel: string;
  aiTimeoutSec: number;
  aiMaxRetries: number;
  repliesPerRequest: number;
};

export const DEFAULT_SETTINGS: Settings = {
  initialCredits: 10,
  referralReward: 5,
  dailyRefill: 5,
  waitHours: 24,
  referralCap: 50,
  referralsEnabled: true,
  refillEnabled: true,
  aiBaseUrl: 'https://router.bynara.id/v1',
  aiModel: 'laguna-s-2.1,stepfun-3.7-flash,gpt-5.6-luna',
  aiTimeoutSec: 30,
  aiMaxRetries: 1,
  repliesPerRequest: 3,
};

export type QuotaState = {
  balance: number;
  initialExhausted: boolean;
  lastSuccessAt: string | null;
  hasPendingReferrals: boolean;
};

export type SyncAction =
  | { kind: 'markInitialExhausted' }
  | { kind: 'releasePendingReferrals' }
  | { kind: 'refill'; amount: number; cycleKey: string };

/** Decide what the quota engine should do right now. Order matters. */
export function planSync(s: QuotaState, cfg: Settings, now: Date): SyncAction[] {
  const actions: SyncAction[] = [];
  let exhausted = s.initialExhausted;
  let balance = s.balance;
  if (!exhausted && balance <= 0) {
    actions.push({ kind: 'markInitialExhausted' });
    exhausted = true;
  }
  if (exhausted && s.hasPendingReferrals) {
    actions.push({ kind: 'releasePendingReferrals' });
    return actions; // released credits make balance > 0, no refill this pass
  }
  if (exhausted && balance <= 0 && cfg.refillEnabled && s.lastSuccessAt) {
    const due = nextRefillAt(s.lastSuccessAt, cfg);
    if (now.getTime() >= due.getTime()) {
      actions.push({ kind: 'refill', amount: cfg.dailyRefill, cycleKey: s.lastSuccessAt });
      balance += cfg.dailyRefill;
    }
  }
  return actions;
}

export function nextRefillAt(lastSuccessAt: string, cfg: Settings): Date {
  return new Date(new Date(lastSuccessAt).getTime() + cfg.waitHours * 3600_000);
}

/** A referral reward is usable only once the initial grant is used up. */
export function referralRewardMode(inviterInitialExhausted: boolean): 'grant' | 'pending' {
  return inviterInitialExhausted ? 'grant' : 'pending';
}

export type QuotaStatus = 'INITIAL' | 'AVAILABLE' | 'WAITING' | 'REFERRAL_PENDING' | 'EXHAUSTED';

export function quotaStatus(s: QuotaState, cfg: Settings): QuotaStatus {
  if (!s.initialExhausted && s.balance > 0) return 'INITIAL';
  if (s.balance > 0) return 'AVAILABLE';
  if (s.hasPendingReferrals) return 'REFERRAL_PENDING';
  if (cfg.refillEnabled && s.lastSuccessAt) return 'WAITING';
  return 'EXHAUSTED';
}
