/* /api/score ─ 排行榜 API（Cloudflare Pages Functions + D1）
 *
 * 防灌分設計：前端「只送每個零件的落點座標」，分數一律由這裡
 * 讀取該臉的 face.json 重新計算後才寫進 D1，client 端算的分數只是顯示用。
 *
 * GET  /api/score?face=<faceId>          -> { top: [{name, score, created_at}] }
 * POST /api/score {name, faceId, parts}  -> { ok, score, rank, top }
 */
'use strict';

const FACE_RE = /^[a-z0-9_-]+\/[a-z0-9_-]+$/i; // face/<角色>/<繪師>，順便擋 path traversal
const TOP_N = 10;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
const err = (status, message) => json({ error: message }, status);

function cleanName(v) {
  if (typeof v !== 'string') return '';
  const s = v.replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ');
  return [...s].slice(0, 12).join('');
}

/* 分數公式（要跟 public/app.js 的 computeScore 保持一致） */
function computeScore(def, parts) {
  if (!Array.isArray(parts) || !def || !Array.isArray(def.parts) || def.parts.length === 0) return null;
  if (parts.length !== def.parts.length) return null;
  const W = Number(def.width), H = Number(def.height);
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return null;

  const map = new Map();
  for (const p of parts) {
    if (!p || typeof p.id !== 'string' || map.has(p.id)) return null;
    const x = Number(p.x), y = Number(p.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x < -W * 0.25 || x > W * 1.25 || y < -H * 0.25 || y > H * 1.25) return null;
    map.set(p.id, { x, y });
  }

  const diag = Math.hypot(W, H);
  const tol = (typeof def.tolerance === 'number' && def.tolerance > 0) ? def.tolerance : 0.22;
  let sum = 0;
  for (const dp of def.parts) {
    const pl = map.get(dp.id);
    if (!pl) return null; // 缺零件或 id 不符
    const d = Math.hypot(pl.x - dp.x, pl.y - dp.y) / diag;
    sum += Math.max(0, 1 - d / tol);
  }
  return Math.round((sum / def.parts.length) * 10000);
}

async function loadFaceDef(origin, faceId) {
  const regRes = await fetch(`${origin}/faces.json`);
  if (!regRes.ok) return null;
  const registry = await regRes.json();
  const entry = (registry.faces || []).find((f) => f.id === faceId);
  if (!entry) return null; // faceId 白名單：不在 faces.json 就拒絕
  const defRes = await fetch(`${origin}/${entry.dir}/face.json`);
  if (!defRes.ok) return null;
  return defRes.json();
}

async function topList(db, faceId) {
  const { results } = await db
    .prepare('SELECT name, score, created_at FROM scores WHERE face_id = ?1 ORDER BY score DESC, id ASC LIMIT ?2')
    .bind(faceId, TOP_N)
    .all();
  return results;
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return err(500, 'D1 binding "DB" not configured');
  const face = new URL(request.url).searchParams.get('face') || '';
  if (!FACE_RE.test(face)) return err(400, 'bad face id');
  return json({ top: await topList(env.DB, face) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return err(500, 'D1 binding "DB" not configured');

  let body;
  try { body = await request.json(); } catch { return err(400, 'invalid json'); }

  const name = cleanName(body.name);
  if (!name) return err(400, 'name required (1-12 chars)');

  const faceId = String(body.faceId || '');
  if (!FACE_RE.test(faceId)) return err(400, 'bad face id');

  const origin = new URL(request.url).origin;
  const def = await loadFaceDef(origin, faceId);
  if (!def) return err(404, 'unknown face');

  const score = computeScore(def, body.parts);
  if (score === null) return err(400, 'bad placements');

  await env.DB
    .prepare('INSERT INTO scores (face_id, name, score) VALUES (?1, ?2, ?3)')
    .bind(faceId, name, score)
    .run();

  const rank = await env.DB
    .prepare('SELECT COUNT(*) + 1 AS r FROM scores WHERE face_id = ?1 AND score > ?2')
    .bind(faceId, score)
    .first('r');

  return json({ ok: true, score, rank, top: await topList(env.DB, faceId) });
}
