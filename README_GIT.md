# ── 開工：確認在 dev ──────────────────
git checkout dev

# ...改 code...

# ── 推上 dev 測試 ─────────────────────
git add -A
git commit -m "寫你改了什麼"
git push
# → 幾十秒後 dev.fukuwarai-eov.pages.dev 自動更新
# → 開網址玩一輪驗證

# 沒問題？繼續往下。有問題？留在 dev 繼續改→commit→push，
# 重複到好為止（dev 髒沒關係）

# ── 合進 main 上正式 ──────────────────
git checkout main
git merge dev
git push
# → mkj-game-club.todoroki-hajime.com 更新

# ── 回 dev 準備下一輪 ─────────────────
git checkout dev

cd ~/fukuwarai/fukuwarai && unzip -o ~/fukuwarai-fbshare.zip -d /tmp/ && bash /tmp/fukuwarai-fbshare/apply.sh .

git add *
git commit -m "Fix the problem that all cards are gone"
git push