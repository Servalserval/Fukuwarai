# 笑福面（ふくわらい）

拖零件、蒙眼放臉、開幕揭曉的網頁遊戲。純前端 + Cloudflare Pages Functions（D1 排行榜）。

## 目錄結構

```
public/                 ← 靜態網站（Pages 的輸出目錄）
  index.html / style.css / app.js
  faces.json            ← 臉的總登錄表（含キャラ群組顯示名）
  face/<キャラ>/<絵師>/  ← 一張臉一個資料夾（キャラ = example / hajime / kanade…）
    face.json           ← 這張臉的描述（零件、正解座標）
    base.png            ← 臉底圖
    *.png               ← 各零件（去背 PNG）
functions/api/score.js  ← 排行榜 API
schema.sql              ← D1 資料表（全新安裝用）
migrations/             ← 既有 DB 的升級 SQL
tools/gen_sample_faces.py  ← 產示範臉的腳本（換成真圖後可刪）
```

## 快速開始

```bash
npx wrangler d1 create fukuwarai        # id 貼進 wrangler.toml（或用 Dashboard 建）
# 建表：D1 Console 貼 schema.sql，或：
npx wrangler d1 execute fukuwarai --file=schema.sql --local
npx wrangler d1 execute fukuwarai --file=schema.sql --remote
npx wrangler pages dev public           # 本機 http://localhost:8788
npx wrangler pages deploy public        # 或 git push 由 Pages 自動部署
```

> 帶 `functions/` 的專案要用 `wrangler pages deploy` 或 Git 整合部署，
> Dashboard 拖資料夾上傳不會編譯 Functions。

## 玩家プロフィール（なまえ＋推しマーク）

- 選單畫面左上的按鈕可登錄なまえ（12 字內）＋推しマーク，存在瀏覽器 `localStorage`
  （key: `fukuwarai_profile`），之後送分自動帶這組身分，不再每次輸入。
- 推しマーク清單在 `public/app.js` 最上面的 `MARKS` 陣列，想換成各キャラ的
  正式マーク直接改那個陣列即可（emoji 最多 4 個 code point，伺服器端會再裁一次）。
- 排行榜以「なまえ＋マーク」當同一位玩家；同名不同マーク視為不同人。

## 排行榜

三種榜 × 兩種期間，全部走 `GET /api/score`：

| type | key | 意義 |
|---|---|---|
| `face` | `example/okame` | 單一張臉。同玩家只取**最高分**那筆，回傳含落點 `parts` 給預覽用 |
| `char` | `example` | キャラ合計：該資料夾下每張臉先取玩家最高分，再**加總** |
| `total` | —— | 總合計：所有臉的最高分加總 |

`scope=all`（全期間，預設）或 `scope=today`（當天）。「當天」的日界線時區在
`functions/api/score.js` 的 `DAY_TZ` 常數，預設 `'+9 hours'`（日本時間），
要改台灣時間就換 `'+8 hours'`。

單張臉滿分 10000，所以合計榜上限 = 10000 × 該範圍的臉數。

臉的榜每列有迷你笑福面預覽（用該筆成績存的落點重現）；合計榜是跨臉加總，
沒有單一落點可畫，所以只列分數＋參與臉數。

`POST /api/score`：`{name, mark, faceId, parts}`。分數一律由伺服器讀
`face.json` 重算（防灌分），並回傳全期間去重後的名次。

## 加一張新臉

1. 開資料夾 `public/face/<キャラ>/<絵師>/`（例：`face/hajime/azuma/`），
   放 `base.png` 和各零件的去背 PNG
2. 寫同資料夾的 `face.json`：

```json
{
  "label": "はじめ",
  "artist": "azuma",
  "base": "base.png",
  "width": 768,          // base.png 的原始像素尺寸
  "height": 1024,
  "tolerance": 0.22,     // 容錯半徑（佔對角線比例），越小越嚴
  "parts": [
    { "id": "eye_l", "label": "め・左", "img": "eye_l.png",
      "w": 120, "h": 80,          // 零件圖原始尺寸
      "x": 289, "y": 560,         // 正解「中心點」在 base.png 上的像素座標
      "z": 1 }                    // 圖層優先度：大的在上；不寫 = 0，同值照陣列順序
  ]
}
```

3. 在 `public/faces.json` 登錄一筆，キャラ第一次出現時順便在 `groups`
   加顯示名和封面（選單第一層那張卡要用哪張臉的底圖）。
   `label`（臉名、群組名）可以是**字串**（各語言共用）或
   **`{"ja": "...", "zh": "...", "en": "..."}` 物件**（介面切語言時跟著換）：

```json
{
  "groups": {
    "example": { "label": "サンプル", "cover": "example/okame" },
    "hajime":  { "label": "はじめ",   "cover": "hajime/meru" }
  },
  "faces": [
    { "id": "hajime/meru", "label": "はじめ", "artist": "メル", "dir": "face/hajime/meru" }
  ]
}
```

選單是兩層：先選カテゴリー（群組卡用 `cover` 指定的底圖），進去才是各張臉。
臉層的卡片標題規則：`label` 跟群組名相同時（同一角色多位繪師的情況），
主標自動改顯示**繪師名**；不同時照顯示 `label`＋繪師小標。

完工——キャラ合計榜會自動出現「はじめ 合計」分頁。`id` 限定
`英數/_-` 的「キャラ/絵師」兩段式，API 端有 regex 擋 path traversal。

## 既有 DB 升級（v1 → v2）

到 D1 Console（正式那顆；有 dev 顆也要）貼 `migrations/0002_profile_boards.sql`
執行一次：加 `mark`、`parts` 欄位＋時間索引。舊資料照常保留，只是沒有
マーク和預覽。

## 分享卡（X/FB 帶圖）

「オープン」後結果圖會背景上傳到 `/api/share`（存進 D1 的 `shares` 表），
X/FB 按鈕分享的是 `/s/<id>` 這個網址——頁面帶 `og:image`，平台會渲染成
大圖卡片。60 天以上的舊分享卡會在新增時自動清除。第一次啟用要跑
`migrations/0003_shares.sql`。

## 防灌分的機制與極限

- 前端只送落點座標，`/api/score` 自己抓 `face.json` 重算距離與分數才寫入
- faceId 白名單（必須在 faces.json）、零件齊全不重複、座標範圍、名字截 12 字、
  マーク裁 4 code point
- 極限：有心人仍可寫程式 POST「完美座標」。要擋這層可加
  [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)（免費）
  或對同 IP 做頻率限制（KV 記次數）。休閒用途通常不必。

## 分數公式

每個零件：`d = 落點與正解的距離 / 底圖對角線`，得分 `max(0, 1 - d/tolerance)`；
全部平均 × 10000 取整。公式在 `public/app.js` 與 `functions/api/score.js`
各有一份（顯示用 / 計分用），改的時候兩邊要同步。
