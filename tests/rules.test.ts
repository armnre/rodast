// Quota rule tests. Run: node --experimental-strip-types apps/app/tests/rules.test.ts
import assert from 'node:assert/strict';
import { planSync, quotaStatus, referralRewardMode, DEFAULT_SETTINGS as cfg } from '../src/server/rules.ts';

const now = new Date('2026-11-02T14:00:00Z');
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
let passed = 0;
const t = (name: string, fn: () => void) => { fn(); passed++; console.log('✓', name); };

t('A: 7 of 10 initial left → no refill, no release', () => {
  const a = planSync({ balance: 7, initialExhausted: false, lastSuccessAt: hoursAgo(48), hasPendingReferrals: true }, cfg, now);
  assert.deepEqual(a, []);
  assert.equal(quotaStatus({ balance: 7, initialExhausted: false, lastSuccessAt: null, hasPendingReferrals: false }, cfg), 'INITIAL');
});

t('B: initial used up → marked exhausted, waits 24h from last success', () => {
  const a = planSync({ balance: 0, initialExhausted: false, lastSuccessAt: hoursAgo(1), hasPendingReferrals: false }, cfg, now);
  assert.deepEqual(a, [{ kind: 'markInitialExhausted' }]);
  assert.equal(quotaStatus({ balance: 0, initialExhausted: true, lastSuccessAt: hoursAgo(1), hasPendingReferrals: false }, cfg), 'WAITING');
});

t('C: referral credits available → no extra refill stacked', () => {
  const a = planSync({ balance: 5, initialExhausted: true, lastSuccessAt: hoursAgo(30), hasPendingReferrals: false }, cfg, now);
  assert.deepEqual(a, []);
});

t('D: balance 0 and 24h passed → refill 5, keyed by cycle', () => {
  const last = hoursAgo(24);
  const a = planSync({ balance: 0, initialExhausted: true, lastSuccessAt: last, hasPendingReferrals: false }, cfg, now);
  assert.deepEqual(a, [{ kind: 'refill', amount: 5, cycleKey: last }]);
});

t('D2: 23h59m → no early refill', () => {
  const a = planSync({ balance: 0, initialExhausted: true, lastSuccessAt: hoursAgo(23.99), hasPendingReferrals: false }, cfg, now);
  assert.deepEqual(a, []);
});

t('E: pending referrals stay pending during initial phase, release after', () => {
  assert.equal(referralRewardMode(false), 'pending');
  assert.equal(referralRewardMode(true), 'grant');
  const during = planSync({ balance: 1, initialExhausted: false, lastSuccessAt: hoursAgo(1), hasPendingReferrals: true }, cfg, now);
  assert.deepEqual(during, []);
  const after = planSync({ balance: 0, initialExhausted: false, lastSuccessAt: hoursAgo(1), hasPendingReferrals: true }, cfg, now);
  assert.deepEqual(after, [{ kind: 'markInitialExhausted' }, { kind: 'releasePendingReferrals' }]);
});

t('Refill disabled → never refills', () => {
  const a = planSync({ balance: 0, initialExhausted: true, lastSuccessAt: hoursAgo(100), hasPendingReferrals: false }, { ...cfg, refillEnabled: false }, now);
  assert.deepEqual(a, []);
});

t('Same cycle yields same idempotency key (no double refill)', () => {
  const s = { balance: 0, initialExhausted: true, lastSuccessAt: hoursAgo(25), hasPendingReferrals: false };
  const k1 = planSync(s, cfg, now)[0], k2 = planSync(s, cfg, new Date(now.getTime() + 60000))[0];
  assert.deepEqual(k1, k2);
});

console.log(`\n${passed} tests passed`);
