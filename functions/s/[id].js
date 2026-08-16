/* GET /s/<id> — 分享頁：X/FB 抓 og:image 生成大圖卡片；人打開看到結果圖＋回遊戲按鈕 */
'use strict';

const esc = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestGet({ params, env, request }) {
  const id = String(params.id || '');
  if (!/^[a-f0-9]{16}$/.test(id) || !env.DB) return Response.redirect(new URL('/', request.url), 302);
  const row = await env.DB
    .prepare('SELECT face, name, score FROM shares WHERE id = ?1').bind(id).first();
  if (!row) return Response.redirect(new URL('/', request.url), 302);

  const origin = new URL(request.url).origin;
  const img = `${origin}/api/shot/${id}`;
  const who = row.name ? `${row.name}：` : '';
  const brag = `${who}「${row.face}」${row.score}点！`;
  const desc = 'めかくしで かおをつくる ふくわらいゲーム ─ リグロス福笑い';
  const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(brag)} ─ リグロス福笑い</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="リグロス福笑い">
<meta property="og:title" content="${esc(brag)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(`${origin}/s/${id}`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(img)}">
<style>
body{margin:0;min-height:100dvh;background:#1e3a5f;color:#f6f1e3;
  font-family:sans-serif;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:20px;padding:24px}
img{max-width:min(92vw,560px);border-radius:14px;box-shadow:0 14px 30px rgba(0,0,0,.4)}
a{background:#c73e3a;color:#f6f1e3;text-decoration:none;
  padding:13px 40px;border-radius:999px;font-weight:700;letter-spacing:.15em}
</style></head><body>
<img src="${esc(img)}" alt="${esc(brag)}">
<a href="/">リグロス福笑いであそぶ →</a>
</body></html>`;
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });
}
