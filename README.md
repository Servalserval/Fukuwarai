# 笑福面（ふくわらい）

拖零件、蒙眼放臉、開幕揭曉的網頁遊戲。純前端 + Cloudflare Pages Functions（D1 排行榜）。

## 目錄結構

```
public/                 ← 靜態網站（Pages 的輸出目錄）
  index.html
  style.css
  app.js
  faces.json            ← 臉的總登錄表
  face/<角色>/<繪師>/    ← 一張臉一個資料夾
    face.json           ← 這張臉的描述（零件、正解座標）
    base.png            ← 臉底圖
    *.png               ← 各零件（去背 PNG）
functions/api/score.js  ← 排行榜 API（GET 榜單 / POST 送成績）
schema.sql              ← D1 資料表
wrangler.toml
tools/gen_sample_faces.py  ← 產示範臉的腳本（換成真圖後可刪）
```

## 快速開始

```bash
# 1. 建 D1，把回傳的 database_id 貼進 wrangler.toml
npx wrangler d1 create fukuwarai

# 2. 建表（--local 給本機開發、--remote 給線上）
npx wrangler d1 execute fukuwarai --file=schema.sql --local
npx wrangler d1 execute fukuwarai --file=schema.sql --remote

# 3. 本機開發（含 Functions + 本機模擬 D1）
npx wrangler pages dev public
#    → http://localhost:8788

# 4. 部署
npx wrangler pages deploy public
```

> 注意：帶 `functions/` 的專案要用 `wrangler pages deploy` 或 Git 整合部署，
> Dashboard 直接拖資料夾上傳不會編譯 Functions。

## dev / 正式 兩條線（一個 repo、一個 Pages 專案就夠）

Pages 內建 Preview Deployments：

- **Production branch**（預設 `main`）→ 部署到正式網址
- **其他任何 branch**（例如 `dev`）→ 每次 push 自動部署到
  `https://dev.<專案名>.pages.dev`（branch 別名固定）+ 每個 commit 各有一個網址

流程：

```bash
git checkout dev && git push        # → dev.<專案名>.pages.dev 自動更新
git checkout main && git merge dev && git push   # → 正式站更新
```

用 wrangler 直接上傳也一樣：`--branch=dev` 就是 preview、`--branch=main` 就是正式。

**讓 dev 用另一顆 DB**（測試分數不弄髒正式排行榜）：
Dashboard → 專案 → Settings → Bindings，Production 綁 `fukuwarai`、
Preview 綁 `fukuwarai-dev`（先 `npx wrangler d1 create fukuwarai-dev` 並跑 schema）。
或解開 `wrangler.toml` 裡 `[env.preview]` 的註解。

## 加一張新臉

1. 開資料夾 `public/face/<角色>/<繪師>/`，放 `base.png` 和各零件的去背 PNG
2. 寫同資料夾的 `face.json`：

```json
{
  "label": "アニキ",
  "artist": "azuma",
  "base": "base.png",
  "width": 768,          // base.png 的原始像素尺寸
  "height": 1024,
  "tolerance": 0.22,     // 容錯半徑（佔對角線比例），越小越嚴
  "parts": [
    { "id": "eye_l", "label": "め・左", "img": "eye_l.png",
      "w": 120, "h": 80,          // 零件圖原始尺寸
      "x": 289, "y": 560 }        // 正解「中心點」在 base.png 上的像素座標
  ]
}
```

3. 在 `public/faces.json` 登錄一筆：

```json
{ "id": "aniki/azuma", "label": "アニキ", "artist": "azuma", "dir": "face/aniki/azuma" }
```

完工。座標用任何繪圖軟體打開 base.png 量中心點即可；`id` 只允許
`英數/_-` 兩段式（`角色/繪師`），API 端有用 regex 擋 path traversal。

## 防灌分的機制與極限

- 前端**只送每個零件的落點座標**，`/api/score` 會自己抓該臉的 `face.json`
  重算距離與分數才寫入 D1 —— 改 client 端 JS 的分數變數沒有用。
- 伺服器端另外驗：faceId 白名單（必須在 faces.json 裡）、零件 id 齊全不重複、
  座標在合理範圍、名字去控制字元並截 12 字。
- **極限**：有心人仍可寫程式直接 POST「完美座標」拿滿分。要擋到這層，
  可再加 [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
  （免費）驗證每次送分，或對同 IP 做頻率限制（KV 記次數）。休閒用途通常不必。

## 分數公式

每個零件：`d = 落點與正解的距離 / 底圖對角線`，得分 `max(0, 1 - d/tolerance)`；
全部平均 × 10000 取整，滿分 10000。公式在 `public/app.js` 與
`functions/api/score.js` 各有一份（顯示用 / 計分用），改的時候兩邊要同步。
