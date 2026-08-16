-- 排行榜資料表（全新安裝用；已有資料的請跑 migrations/0002_profile_boards.sql）
CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  face_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  mark       TEXT,                -- 推しマーク（可空）
  score      INTEGER NOT NULL,
  parts      TEXT,                -- 落點 JSON（排行榜預覽用）
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scores_face_score ON scores (face_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created ON scores (created_at);
