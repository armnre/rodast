import { zite } from 'zitejs/db';
import { ZiteError } from 'zitejs/backend';
import { requireSession } from './session';
import { requireProfile } from './credits';

export const POST_MAX = 500;
export const MEDIA_MAX = 4;

export async function viewer(token: string) {
  const s = await requireSession(token);
  const p = await requireProfile(s.ownerId);
  return { uid: s.ownerId, profile: p };
}

export const bad = (msg: string, code: 'BAD_REQUEST' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' = 'BAD_REQUEST') =>
  new ZiteError({ code, message: msg, userFacingMessage: msg });

/** SQL fragment: hides authors blocked in either direction from viewer ($V). */
export const notBlocked = (col: string, v: string) => `
  ${col} NOT IN (SELECT "blockedId" FROM "Blocks" WHERE "blockerId" = ${v})
  AND ${col} NOT IN (SELECT "blockerId" FROM "Blocks" WHERE "blockedId" = ${v})`;

export async function isBlocked(a: string, b: string) {
  const r = await zite.sql({
    query: `SELECT 1 FROM "Blocks" WHERE ("blockerId"=$1 AND "blockedId"=$2) OR ("blockerId"=$2 AND "blockedId"=$1) LIMIT 1`,
    params: [a, b],
  });
  return r.rows.length > 0;
}

export type Media = { url: string; type: 'image' | 'video' };

export function parseMedia(raw: unknown): Media[] {
  try {
    const arr = JSON.parse(String(raw || '[]'));
    return Array.isArray(arr) ? arr.filter((m) => m && typeof m.url === 'string') : [];
  } catch { return []; }
}

export function cleanMedia(list: Media[]): Media[] {
  if (list.length > MEDIA_MAX) throw bad(`حداکثر ${MEDIA_MAX} رسانه در هر پست.`);
  for (const m of list) {
    let host = '';
    try { host = new URL(m.url).host; } catch { /* invalid */ }
    if (!['uploads.zite.com', 'eu-uploads.zite.com'].includes(host)) throw bad('فایل رسانه معتبر نیست.');
    if (m.type !== 'image' && m.type !== 'video') throw bad('نوع رسانه معتبر نیست.');
  }
  if (list.filter((m) => m.type === 'video').length > 1) throw bad('فقط یک ویدئو در هر پست.');
  return list;
}

export const extractTags = (s: string) =>
  Array.from(new Set(Array.from(s.matchAll(/#([\p{L}\p{N}_]{1,40})/gu), (m) => m[1].toLowerCase()))).slice(0, 10);
export const extractMentions = (s: string) =>
  Array.from(new Set(Array.from(s.matchAll(/@([a-z0-9_]{3,20})/gi), (m) => m[1].toLowerCase()))).slice(0, 10);

export async function notify(kind: 'Like' | 'Reply' | 'Repost' | 'Quote' | 'Follow' | 'Mention', recipientId: string, actorId: string, postId = '') {
  if (!recipientId || recipientId === actorId) return;
  if (await isBlocked(recipientId, actorId)) return;
  await zite.notifications.bulkCreate({
    records: [{ key: `${kind}:${actorId}:${recipientId}:${postId}`, kind, recipientId, actorId, postId, read: false }],
    matchOn: ['key'],
  });
}

export async function unnotify(kind: string, recipientId: string, actorId: string, postId = '') {
  const n = await zite.notifications.findOne({ filters: { key: `${kind}:${actorId}:${recipientId}:${postId}` } });
  if (n) await zite.notifications.delete({ id: n.id });
}

/** Light abuse guard: max `n` posts per minute per author. */
export async function rateLimit(uid: string, n = 8) {
  const r = await zite.sql({
    query: `SELECT COUNT(*) AS c FROM "Posts" WHERE "authorId"=$1 AND created_at > now() - interval '1 minute' AND "kind" <> 'Repost'`,
    params: [uid],
  });
  if (Number(r.rows[0]?.c ?? 0) >= n) throw bad('یه کم آروم‌تر! چند ثانیه دیگه دوباره امتحان کن.');
}

export type PostView = {
  id: string; body: string; kind: string; parentId: string; refId: string; media: Media[]; status: string; createdAt: string;
  author: { id: string; displayName: string; username: string; avatar: string };
  likes: number; replies: number; reposts: number; liked: boolean; bookmarked: boolean; reposted: boolean; mine: boolean;
  ref: PostView | null; parentAuthor: string;
};

async function hydrateRaw(ids: string[], uid: string): Promise<PostView[]> {
  if (!ids.length) return [];
  const r = await zite.sql({
    query: `
      SELECT p.id, p."body", p."authorId", p."kind", p."parentId", p."refId", p."media", p."status", p.created_at AS "createdAt",
        a."displayName", a."username", a."avatar",
        (SELECT pa."username" FROM "Posts" pp JOIN "Profiles" pa ON pa."ownerId" = pp."authorId" WHERE pp.id::text = p."parentId" LIMIT 1) AS "parentAuthor",
        (SELECT COUNT(*) FROM "PostLikes" l WHERE l."postId" = p.id::text) AS "likeCount",
        (SELECT COUNT(*) FROM "Posts" r WHERE r."parentId" = p.id::text AND r."kind" = 'Reply' AND r."status" = 'Active') AS "replyCount",
        (SELECT COUNT(*) FROM "Posts" r WHERE r."refId" = p.id::text AND r."kind" IN ('Repost','Quote') AND r."status" = 'Active') AS "repostCount",
        EXISTS (SELECT 1 FROM "PostLikes" l WHERE l."postId" = p.id::text AND l."userId" = $2) AS "isLiked",
        EXISTS (SELECT 1 FROM "Bookmarks" b WHERE b."postId" = p.id::text AND b."userId" = $2) AS "isBookmarked",
        EXISTS (SELECT 1 FROM "Posts" r WHERE r."refId" = p.id::text AND r."kind" = 'Repost' AND r."status" = 'Active' AND r."authorId" = $2) AS "isReposted"
      FROM "Posts" p
      LEFT JOIN "Profiles" a ON a."ownerId" = p."authorId"
      WHERE p.id::text IN (SELECT jsonb_array_elements_text($1::jsonb))`,
    params: [JSON.stringify(ids), uid],
  });
  const map = new Map<string, PostView>();
  for (const x of r.rows as Record<string, unknown>[]) {
    const alive = x.status === 'Active' || (x.status === 'Under Review' && x.authorId === uid);
    map.set(String(x.id), {
      id: String(x.id), kind: String(x.kind ?? 'Post'), parentId: String(x.parentId ?? ''), refId: String(x.refId ?? ''),
      body: alive ? String(x.body ?? '') : '', media: alive ? parseMedia(x.media) : [], status: String(x.status ?? 'Active'),
      createdAt: String(x.createdAt ?? ''),
      author: { id: String(x.authorId ?? ''), displayName: String(x.displayName ?? 'کاربر'), username: String(x.username ?? ''), avatar: String(x.avatar ?? '') },
      likes: Number(x.likeCount ?? 0), replies: Number(x.replyCount ?? 0), reposts: Number(x.repostCount ?? 0),
      liked: x.isLiked === true, bookmarked: x.isBookmarked === true, reposted: x.isReposted === true, mine: x.authorId === uid,
      ref: null, parentAuthor: String(x.parentAuthor ?? ''),
    });
  }
  return ids.map((id) => map.get(id)).filter((p): p is PostView => !!p);
}

/** Loads posts in the given order, with the referenced (reposted/quoted) post embedded. */
export async function hydrate(ids: string[], uid: string): Promise<PostView[]> {
  const posts = await hydrateRaw(ids, uid);
  const refIds = Array.from(new Set(posts.map((p) => p.refId).filter(Boolean)));
  const refs = new Map((await hydrateRaw(refIds, uid)).map((p) => [p.id, p]));
  return posts.map((p) => ({ ...p, ref: p.refId ? refs.get(p.refId) ?? null : null }));
}
