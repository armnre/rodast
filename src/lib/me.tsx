import { tok, handleAuthError } from './session';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe, type GetMeOutputType } from 'zitejs/api';

type MeCtx = { me: GetMeOutputType | null; loading: boolean; refresh: () => Promise<void>; setQuota: (q: Quota) => void };
export type Quota = {
  balance: number; status: string; initialPhase: boolean; pendingReferralCredits: number;
  nextRefillAt: string | null; refillAmount: number; referralReward: number; referralsEnabled: boolean; serverNow: string;
};

const Ctx = createContext<MeCtx>({ me: null, loading: true, refresh: async () => {}, setQuota: () => {} });

export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<GetMeOutputType | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setMe(await getMe({ token: tok(), })); }
    catch (e) { if (!handleAuthError(e)) throw e; }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const setQuota = (q: Quota) => setMe((m) => (m && m.onboarded ? ({ ...m, quota: q } as GetMeOutputType) : m));
  return <Ctx.Provider value={{ me, loading, refresh, setQuota }}>{children}</Ctx.Provider>;
}

export const useMe = () => useContext(Ctx);

export const fa = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export const faDate = (iso: string, withTime = false) =>
  iso ? new Intl.DateTimeFormat('fa-IR', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(iso)) : '';

export const errMsg = (e: unknown) => {
  const x = e as { userFacingMessage?: string; message?: string };
  return x?.userFacingMessage || 'مشکلی پیش اومد، دوباره امتحان کن.';
};

export const REF_KEY = 'rodast_ref';
