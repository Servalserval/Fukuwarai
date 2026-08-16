-- 排行榜資料表（wrangler d1 execute fukuwarai --file=schema.sql）
CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  face_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  score      INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scores_face_score ON scores (face_id, score DESC);
