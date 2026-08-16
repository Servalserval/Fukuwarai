/* GET /api/shot/<id> — 分享卡的 PNG 本體
 * 注意：D1 的 BLOB 讀出來可能是「數字陣列」而非 ArrayBuffer（實測地雷），
 * 這裡統一正規化成 bytes 再回應。 */
'use strict';

export async function onRequestGet({ params, env }) {
  if (!env.DB) return new Response('no db', { status: 500 });
  const id = String(params.id || '');
  if (!/^[a-f0-9]{16}$/.test(id)) return new Response('bad id', { status: 400 });

  const row = await env.DB.prepare('SELECT png FROM shares WHERE id = ?1').bind(id).first();
  if (!row || row.png == null) return new Response('not found', { status: 404 });

  let body = row.png;
  if (Array.isArray(body)) {
    body = new Uint8Array(body);                       // D1 常見：number[]
  } else if (ArrayBuffer.isView(body)) {
    body = new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }                                                    // ArrayBuffer 則原樣可用

  return new Response(body, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
