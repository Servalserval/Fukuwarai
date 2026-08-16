/* GET /api/shot/<id> — 分享卡的 PNG 本體 */
'use strict';
export async function onRequestGet({ params, env }) {
  if (!env.DB) return new Response('no db', { status: 500 });
  const id = String(params.id || '');
  if (!/^[a-f0-9]{16}$/.test(id)) return new Response('bad id', { status: 400 });
  const row = await env.DB.prepare('SELECT png FROM shares WHERE id = ?1').bind(id).first();
  if (!row) return new Response('not found', { status: 404 });
  return new Response(row.png, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
