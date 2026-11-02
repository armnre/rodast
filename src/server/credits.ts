import { zite } from 'zitejs/db';
import { ZiteError } from 'zitejs/backend';
import { DEFAULT_SETTINGS, planSync, quotaStatus, nextRefillAt, referralRewardMode, type Settings } from './rules';

type Profile = NonNullable<Awaited<ReturnType<typeof zite.profiles.findOne>>>;
type TxType = 'INITIAL_GRANT' | 'AI_USAGE' | 'REFERRAL_REWARD' | 'DAILY_REFILL' | 'ADMIN_ADJUSTMENT' | 'REFUND';

const num = (v: unknown, d = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : d);
const bool = (v: unknown, d: boolean) => (v === null || v === undefined ? d : v === true || v === 'true');

export async function getSettings(): Promise<Settings & { id: string }> {
  const { records } = await zite.systemSettings.findAll({ limit: 1 });
  let r = records[0];
  if (!r) {
    r = await zite.systemSettings.create({ record: { name: 'default', ...DEFAULT_SETTINGS } });
  }
  const d = DEFAULT_SETTINGS;
  return {
    id: r.id,
    initialCredits: num(r.initialCredits, d.initialCredits),
    referralReward: num(r.referralReward, d.referralReward),
    dailyRefill: num(r.dailyRefill, d.dailyRefill),
    waitHours: num(r.waitHours, d.waitHours),
    referralCap: num(r.referralCap, d.referralCap),
    referralsEnabled: bool(r.referralsEnabled, d.referralsEnabled),
    refillEnabled: bool(r.refillEnabled, d.refillEnabled),
    aiBaseUrl: r.aiBaseUrl || d.aiBaseUrl,
    aiModel: r.aiModel || d.aiModel,
    aiTimeoutSec: num(r.aiTimeoutSec, d.aiTimeoutSec),
    aiMaxRetries: num(r.aiMaxRetries, d.aiMaxRetries),
    repliesPerRequest: Math.min(5, Math.max(1, num(r.repliesPerRequest, d.repliesPerRequest))),
  };
}

export async function findProfile(userId: string) {
  return zite.profiles.findOne({ filters: { ownerId: userId } });
}

export async function requireProfile(userId: string): Promise<Profile> {
  const p = await findProfile(userId);
  if (!p) throw new ZiteError({ code: 'NOT_FOUND', message: 'no profile', userFacingMessage: 'اول ثبت‌نامت رو کامل کن.' });
  if (p.status === 'Blocked') throw new ZiteError({ code: 'FORBIDDEN', message: 'blocked', userFacingMessage: 'حسابت غیرفعال شده.' });
  return p;
}

export async function requireAdmin(userId: string): Promise<Profile> {
  const p = await findProfile(userId);
  if (!p || p.isAdmin !== true || p.status === 'Blocked') {
    throw new ZiteError({ code: 'FORBIDDEN', message: 'not admin', userFacingMessage: 'دسترسی نداری.' });
  }
  return p;
}

/**
 * The only way balance changes. Idempotent on `key`: a repeated key is a no-op.
 * Writes the ledger row first (claiming the key), then the balance.
 */
export async function applyLedger(
  userId: string,
  type: TxType,
  amount: number,
  key: string,
  description: string,
  extra: { requestId?: string; referralId?: string } = {},
): Promise<{ applied: boolean; balance: number }> {
  const existing = await zite.creditTransactions.findOne({ filters: { idempotencyKey: key } });
  const fresh = await findProfile(userId);
  if (!fresh) throw new Error('profile missing');
  if (existing) return { applied: false, balance: num(fresh.balance) };
  const next = num(fresh.balance) + amount;
  if (next < 0) throw new ZiteError({ code: 'BAD_REQUEST', message: 'negative balance', userFacingMessage: 'اعتبار کافی نداری.' });
  await zite.creditTransactions.create({
    record: { ownerId: userId, type, amount, balanceAfter: next, idempotencyKey: key, description, ...extra },
  });
  // Re-check: if a concurrent writer claimed the same key, only the earliest row counts.
  const { records: dupes } = await zite.creditTransactions.findAll({
    filters: { idempotencyKey: key }, sort: [{ field: 'createdAt', direction: 'asc' }], limit: 5,
  });
  if (dupes.length > 1) {
    for (const d of dupes.slice(1)) await zite.creditTransactions.delete({ id: d.id });
    const again = await findProfile(userId);
    return { applied: false, balance: num(again?.balance) };
  }
  await zite.profiles.update({
    id: fresh.id,
    record: { balance: next, creditVersion: num(fresh.creditVersion) + 1 },
  });
  return { applied: true, balance: next };
}

export async function track(event: string, userId?: string, meta?: string) {
  try {
    await zite.analyticsEvents.create({ record: { event, ownerId: userId, meta: meta?.slice(0, 200) } });
  } catch { /* analytics must never break the product */ }
}

async function pendingReferrals(userId: string) {
  const { records } = await zite.referrals.findAll({ filters: { inviterId: userId, rewardStatus: 'Pending' }, limit: 200 });
  return records;
}

/** Bring the quota up to date (initial exhaustion, pending rewards, 24h refill). */
export async function syncQuota(userId: string, cfg: Settings) {
  let p = await requireProfile(userId);
  const pend = await pendingReferrals(userId);
  const actions = planSync(
    { balance: num(p.balance), initialExhausted: p.initialExhausted === true, lastSuccessAt: p.lastSuccessAt ? String(p.lastSuccessAt) : null, hasPendingReferrals: pend.length > 0 },
    cfg, new Date(),
  );
  for (const a of actions) {
    if (a.kind === 'markInitialExhausted') {
      await zite.profiles.update({ id: p.id, record: { initialExhausted: true } });
      await track('credit_exhausted', userId);
    } else if (a.kind === 'releasePendingReferrals') {
      for (const r of pend) {
        const amt = num(r.rewardAmount, cfg.referralReward);
        await applyLedger(userId, 'REFERRAL_REWARD', amt, `ref:${r.id}`, 'پاداش دعوت (آزاد شده)', { referralId: r.id });
        await zite.referrals.update({ id: r.id, record: { rewardStatus: 'Granted' } });
        await track('referral_reward_granted', userId);
      }
      const fresh = await findProfile(userId);
      if (fresh) await zite.profiles.update({ id: fresh.id, record: { pendingReferralCredits: 0 } });
    } else if (a.kind === 'refill') {
      const res = await applyLedger(userId, 'DAILY_REFILL', a.amount, `refill:${userId}:${a.cycleKey}`, 'شارژ دوره‌ای');
      if (res.applied) {
        await zite.profiles.update({ id: p.id, record: { lastRefillAt: new Date().toISOString() } });
        await track('daily_refill_granted', userId);
      }
    }
  }
  p = (await findProfile(userId))!;
  return p;
}

export async function quotaView(userId: string, cfg: Settings) {
  const p = await syncQuota(userId, cfg);
  const pend = await pendingReferrals(userId);
  const state = {
    balance: num(p.balance),
    initialExhausted: p.initialExhausted === true,
    lastSuccessAt: p.lastSuccessAt ? String(p.lastSuccessAt) : null,
    hasPendingReferrals: pend.length > 0,
  };
  const status = quotaStatus(state, cfg);
  return {
    profile: p,
    quota: {
      balance: state.balance,
      status,
      initialPhase: !state.initialExhausted,
      pendingReferralCredits: pend.reduce((s, r) => s + num(r.rewardAmount, cfg.referralReward), 0),
      nextRefillAt: state.balance <= 0 && state.initialExhausted && cfg.refillEnabled && state.lastSuccessAt
        ? nextRefillAt(state.lastSuccessAt, cfg).toISOString() : null,
      refillAmount: cfg.dailyRefill,
      referralReward: cfg.referralReward,
      referralsEnabled: cfg.referralsEnabled,
      serverNow: new Date().toISOString(),
    },
  };
}

/** Called after the invitee's first successful reply. */
export async function completeReferral(inviteeId: string, cfg: Settings) {
  const ref = await zite.referrals.findOne({ filters: { inviteeId: inviteeId, status: 'Signed Up' } });
  if (!ref) return;
  const inviterId = ref.inviterId;
  if (!inviterId || inviterId === inviteeId || !cfg.referralsEnabled) {
    await zite.referrals.update({ id: ref.id, record: { status: 'Rejected', rewardStatus: 'None', note: 'invalid or disabled' } });
    return;
  }
  const inviter = await findProfile(inviterId);
  if (!inviter || inviter.status === 'Blocked') {
    await zite.referrals.update({ id: ref.id, record: { status: 'Rejected', rewardStatus: 'None', note: 'inviter unavailable' } });
    return;
  }
  const { records: mine } = await zite.referrals.findAll({ filters: { inviterId: inviterId }, limit: 2000 });
  const total = mine.filter((r) => r.rewardStatus === 'Granted' || r.rewardStatus === 'Pending').length;
  const dayAgo = Date.now() - 86400_000;
  const recent = mine.filter((r) => r.completedAt && new Date(String(r.completedAt)).getTime() > dayAgo).length;
  const now = new Date().toISOString();
  if (total >= cfg.referralCap) {
    await zite.referrals.update({ id: ref.id, record: { status: 'Completed', rewardStatus: 'Capped', completedAt: now } });
    return;
  }
  if (recent >= 5) {
    // Unusual burst — hold for manual review instead of auto-rewarding.
    await zite.referrals.update({ id: ref.id, record: { status: 'Review', rewardStatus: 'None', rewardAmount: cfg.referralReward, completedAt: now, note: 'burst' } });
    return;
  }
  await grantReferral(ref.id, inviterId, cfg, now);
  await track('referral_completed', inviteeId);
}

export async function grantReferral(refId: string, inviterId: string, cfg: Settings, now = new Date().toISOString()) {
  const inviter = await findProfile(inviterId);
  if (!inviter) return;
  const mode = referralRewardMode(inviter.initialExhausted === true);
  if (mode === 'grant') {
    await zite.referrals.update({ id: refId, record: { status: 'Completed', rewardStatus: 'Granted', rewardAmount: cfg.referralReward, completedAt: now } });
    await applyLedger(inviterId, 'REFERRAL_REWARD', cfg.referralReward, `ref:${refId}`, 'پاداش دعوت', { referralId: refId });
    await track('referral_reward_granted', inviterId);
  } else {
    await zite.referrals.update({ id: refId, record: { status: 'Completed', rewardStatus: 'Pending', rewardAmount: cfg.referralReward, completedAt: now } });
    await zite.profiles.update({ id: inviter.id, record: { pendingReferralCredits: num(inviter.pendingReferralCredits) + cfg.referralReward } });
  }
}

export async function audit(actorId: string, action: string, targetUserId: string | undefined, details: unknown) {
  await zite.auditLogs.create({ record: { actorId: actorId, action, targetUserId, details: JSON.stringify(details) } });
}

export function serializeProfile(p: Profile) {
  return {
    displayName: p.displayName ?? '',
    username: p.username ?? '',
    referralCode: p.referralCode ?? '',
    totalReplies: num(p.totalReplies),
    status: p.status ?? 'Active',
    isAdmin: p.isAdmin === true,
    joinedAt: p.joinedAt ? String(p.joinedAt) : null,
  };
}
