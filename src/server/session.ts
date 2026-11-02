import { zite } from 'zitejs/db';
import { ZiteError } from 'zitejs/backend';

export const SESSION_DAYS = 30;

const toLatin = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

/** Normalises Iranian mobile numbers to 09xxxxxxxxx, or null when invalid. */
export function normalizePhone(raw: string): string | null {
  let p = toLatin(raw).replace(/[\s\-()]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  else if (p.startsWith('9') && p.length === 10) p = '0' + p;
  return /^09\d{9}$/.test(p) ? p : null;
}

export const ownerIdFor = (phone: string) => `ph_${phone}`;

export function randomToken(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function optionalSession(token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const s = await zite.sessions.findOne({ filters: { token: await sha256(token) } });
  if (!s || s.revoked === true || !s.ownerId || !s.phone) return null;
  if (s.expiresAt && new Date(String(s.expiresAt)).getTime() < Date.now()) return null;
  return { id: s.id, ownerId: s.ownerId, phone: s.phone };
}

export async function requireSession(token?: string) {
  const s = await optionalSession(token);
  if (!s) throw new ZiteError({ code: 'UNAUTHORIZED', message: 'no session', userFacingMessage: 'نشستت تموم شده، دوباره وارد شو.' });
  return s;
}
