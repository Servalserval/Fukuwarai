-- v2 遷移：加 mark（推しマーク）與 parts（落點 JSON）欄位＋時間索引
-- 到 D1 Console 貼上執行「一次」就好（重複跑會報 duplicate column，無害但不用跑第二次）。
-- 正式那顆（fukuwarai）要跑；如果有 dev 顆（fukuwarai-dev）也要跑。
ALTER TABLE scores ADD COLUMN mark TEXT;
ALTER TABLE scores ADD COLUMN parts TEXT;
CREATE INDEX IF NOT EXISTS idx_scores_created ON scores (created_at);
