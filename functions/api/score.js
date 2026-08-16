/* /api/score ─ 排行榜 API v2（Cloudflare Pages Functions + D1）
 *
 * 防灌分：前端只送每個零件的落點座標，分數由這裡讀 face.json 重算後才寫入。
 * v2 新增：mark（推しマーク）、parts（落點 JSON，給排行榜預覽用）、
 *          當天榜（scope=today）、キャラ合計榜（type=char）、總合計榜（type=total）。
 *
 * GET  /api/score?type=face&key=example/okame&scope=all|today
 *        -> { top:[{name,mark,score,parts,created_at}] }   ← 同一玩家只取最高分那筆
 * GET  /api/score?type=char&key=example&scope=all|today
 *        -> { top:[{name,mark,score,faces}] }              ← 每張臉取玩家最高分後加總
 * GET  /api/score?type=total&scope=all|today
 *        -> { top:[{name,mark,score,faces}] }
 * POST /api/score {name, mark, faceId, parts}
 *        -> { ok, score, best, rank, top }                 ← rank = 這張臉全期間、以玩家最高分去重後的名次
 */
'use strict';

const FACE_RE = /^[a-z0-9_-]+\/[a-z0-9_-]+$/i; // face/<キャラ>/<絵師>，順便擋 path traversal
const GROUP_RE = /^[a-z0-9_-]+$/i;
const TOP_N = 10;

/* 「今日」的日界線時區。日本時間 '+9 hours'；想改台灣時間就換 '+8 hours' */
const DAY_TZ = '+9 hours';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
const err = (status, message) => json({ error: message }, status);

const dayCond = (scope) =>
  scope === 'today' ? `AND date(created_at, '${DAY_TZ}') = date('now', '${DAY_TZ}')` : '';

function cleanName(v) {
  if (typeof v !== 'string') return '';
  const s = v.replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ');
  return [...s].slice(0, 12).join('');
}

function cleanMark(v) {
  if (typeof v !== 'string') return null;
  const s = [...v.replace(/[\u0000-\u001f\u007f\s]/g, '')];
  if (!s.length) return null;
  return s.slice(0, 4).join(''); // emoji 組合最多 4 個 code point
}

/* 分數公式（要跟 public/app.js 的 computeScore 保持一致）。
 * 回傳 {score, placements}；不合法回 null。每張臉滿分 10000。 */
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
    map.set(p.id, { x: Math.round(x), y: Math.round(y) });
  }

  const diag = Math.hypot(W, H);
  const tol = (typeof def.tolerance === 'number' && def.tolerance > 0) ? def.tolerance : 0.22;
  let sum = 0;
  const placements = [];
  for (const dp of def.parts) {
    const pl = map.get(dp.id);
    if (!pl) return null; // 缺零件或 id 不符
    const d = Math.hypot(pl.x - dp.x, pl.y - dp.y) / diag;
    sum += Math.max(0, 1 - d / tol);
    placements.push({ id: dp.id, x: pl.x, y: pl.y });
  }
  return { score: Math.round((sum / def.parts.length) * 10000), placements };
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

/* 這張臉的榜：同一玩家（name+mark）只留最高分那一筆，帶 parts 給預覽 */
async function faceTop(db, faceId, scope) {
  const sql = `
    SELECT name, mark, score, parts, created_at FROM (
      SELECT name, mark, score, parts, created_at,
             ROW_NUMBER() OVER (PARTITION BY name, mark ORDER BY score DESC, id ASC) AS rn
      FROM scores WHERE face_id = ?1 ${dayCond(scope)}
    ) WHERE rn = 1
    ORDER BY score DESC, created_at ASC LIMIT ${TOP_N}`;
  const { results } = await db.prepare(sql).bind(faceId).all();
  return results;
}

/* 合計榜：每張臉先取玩家最高分，再加總。likePattern 為 null = 全部臉（總合計） */
async function aggTop(db, likePattern, scope) {
  const where = likePattern ? 'WHERE face_id LIKE ?1' : 'WHERE 1 = 1';
  const sql = `
    SELECT name, mark, SUM(best) AS score, COUNT(*) AS faces FROM (
      SELECT name, mark, face_id, MAX(score) AS best
      FROM scores ${where} ${dayCond(scope)}
      GROUP BY name, mark, face_id
    )
    GROUP BY name, mark
    ORDER BY score DESC LIMIT ${TOP_N}`;
  const stmt = db.prepare(sql);
  const { results } = await (likePattern ? stmt.bind(likePattern) : stmt).all();
  return results;
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return err(500, 'D1 binding "DB" not configured');
  const u = new URL(request.url);

  const scope = u.searchParams.get('scope') === 'today' ? 'today' : 'all';
  let type = u.searchParams.get('type') || 'face';
  let key = u.searchParams.get('key') || '';
  if (u.searchParams.get('face')) { type = 'face'; key = u.searchParams.get('face'); } // 舊參數相容

  if (type === 'face') {
    if (!FACE_RE.test(key)) return err(400, 'bad face id');
    return json({ top: await faceTop(env.DB, key, scope) });
  }
  if (type === 'char') {
    if (!GROUP_RE.test(key)) return err(400, 'bad group');
    return json({ top: await aggTop(env.DB, `${key}/%`, scope) });
  }
  if (type === 'total') {
    return json({ top: await aggTop(env.DB, null, scope) });
  }
  return err(400, 'bad type');
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return err(500, 'D1 binding "DB" not configured');

  let body;
  try { body = await request.json(); } catch { return err(400, 'invalid json'); }

  const name = cleanName(body.name);
  if (!name) return err(400, 'name required (1-12 chars)');
  const mark = cleanMark(body.mark);

  const faceId = String(body.faceId || '');
  if (!FACE_RE.test(faceId)) return err(400, 'bad face id');

  const origin = new URL(request.url).origin;
  const def = await loadFaceDef(origin, faceId);
  if (!def) return err(404, 'unknown face');

  const result = computeScore(def, body.parts);
  if (result === null) return err(400, 'bad placements');

  await env.DB
    .prepare('INSERT INTO scores (face_id, name, mark, score, parts) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(faceId, name, mark, result.score, JSON.stringify(result.placements))
    .run();

  // 這位玩家在這張臉的最高分（可能是以前那次更高）
  const best = await env.DB
    .prepare('SELECT MAX(score) AS b FROM scores WHERE face_id = ?1 AND name = ?2 AND mark IS ?3')
    .bind(faceId, name, mark)
    .first('b');

  // 名次 = 最高分比我高的玩家數 + 1（全期間、每人取最高分）
  const better = await env.DB
    .prepare(`SELECT COUNT(*) AS c FROM (
                SELECT MAX(score) AS b FROM scores WHERE face_id = ?1 GROUP BY name, mark
              ) WHERE b > ?2`)
    .bind(faceId, best)
    .first('c');

  return json({
    ok: true,
    score: result.score,
    best,
    rank: better + 1,
    top: await faceTop(env.DB, faceId, 'all'),
  });
}
