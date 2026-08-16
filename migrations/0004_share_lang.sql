-- 分享卡記錄玩家語言（卡片標題跟著語言走）
-- D1 Console 執行一次（正式那顆；有 dev 顆也要）。沒跑之前分享照常運作，只是標題先用日文。
ALTER TABLE shares ADD COLUMN lang TEXT;
