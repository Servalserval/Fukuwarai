-- 分享卡：結果圖存 D1，/s/<id> 提供帶 og:image 的分享頁
-- 到 D1 Console 執行一次（正式那顆；有 dev 顆也要）
CREATE TABLE IF NOT EXISTS shares (
  id         TEXT PRIMARY KEY,
  face       TEXT NOT NULL,
  name       TEXT,
  score      INTEGER NOT NULL,
  png        BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shares_created ON shares (created_at);
