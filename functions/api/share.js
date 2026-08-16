/* POST /api/share?face=..&name=..&score=..（body = PNG）
 * 存進 D1，回 { id, url }；/s/<id> 是帶 og:image 的分享頁。
 * 60 天以上的舊分享會在新增時順手清掉。 */
'use strict';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
const err = (s, m) => json({ error: m }, s);

const clean = (v, max) => {
  if (typeof v !== 'string') return '';
  return [...v.replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, max).join('');
};

export async function onRequestPost({ request, env }) {
  if (!env.DB) return err(500, 'D1 binding "DB" not configured');

  const buf = await request.arrayBuffer();
  if (buf.byteLength < 100 || buf.byteLength > 1500000) return err(400, 'bad size');
  const m = new Uint8Array(buf, 0, 8);
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!magic.every((b, i) => m[i] === b)) return err(400, 'not a png');

  const u = new URL(request.url);
  const face = clean(u.searchParams.get('face') || '', 40);
  const name = clean(u.searchParams.get('name') || '', 12);
  const score = Number(u.searchParams.get('score'));
  if (!face || !Number.isInteger(score) || score < 0 || score > 10000) return err(400, 'bad meta');

  const id = [...crypto.getRandomValues(new Uint8Array(8))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');

  await env.DB.prepare("DELETE FROM shares WHERE created_at < datetime('now', '-60 day')").run();
  await env.DB
    .prepare('INSERT INTO shares (id, face, name, score, png) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(id, face, name || null, score, buf)
    .run();

  const origin = new URL(request.url).origin;
  return json({ id, url: `${origin}/s/${id}` });
}
