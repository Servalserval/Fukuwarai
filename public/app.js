/* 笑福面 ─ front-end
 * 座標系：模型一律用「底圖像素座標」(face.json 的 width/height)，
 * 畫面上再乘 scale 換算，resize 時重排即可。
 */
'use strict';

const $ = (id) => document.getElementById(id);
const screens = { menu: $('screen-menu'), game: $('screen-game') };

const state = {
  registry: null,
  faceEntry: null,   // faces.json 的那一筆
  def: null,         // face.json
  phase: 'menu',     // menu | ready | blind | opened | done
  scale: 1,
  faceRect: null,    // face-box 相對 #stage 的位置
  parts: new Map(),  // id -> {def, el, x, y(底圖座標，placed 時有效), placed, home:{sx,sy 螢幕座標}}
  lastScore: null,
};

/* ── 分數公式（要跟 functions/api/score.js 保持一致）────── */
function computeScore(def, placements) {
  const diag = Math.hypot(def.width, def.height);
  const tol = (typeof def.tolerance === 'number' && def.tolerance > 0) ? def.tolerance : 0.22;
  let sum = 0;
  for (const dp of def.parts) {
    const pl = placements.get(dp.id);
    if (!pl) return null;
    const d = Math.hypot(pl.x - dp.x, pl.y - dp.y) / diag;
    sum += Math.max(0, 1 - d / tol);
  }
  return Math.round((sum / def.parts.length) * 10000);
}

const esc = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── 選單 ─────────────────────────────────────────────── */
async function loadMenu() {
  const res = await fetch('faces.json');
  state.registry = await res.json();
  const grid = $('face-grid');
  grid.innerHTML = '';
  for (const f of state.registry.faces) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'face-card';
    card.innerHTML =
      `<img src="${esc(f.dir)}/base.png" alt="">` +
      `<span class="fc-label">${esc(f.label)}</span>` +
      `<span class="fc-artist">絵：${esc(f.artist)}</span>`;
    card.addEventListener('click', () => startFace(f));
    grid.appendChild(card);
  }
}

function showScreen(name) {
  screens.menu.classList.toggle('hidden', name !== 'menu');
  screens.game.classList.toggle('hidden', name !== 'game');
}

/* ── 進入遊戲 ─────────────────────────────────────────── */
async function startFace(entry) {
  state.faceEntry = entry;
  const res = await fetch(`${entry.dir}/face.json`);
  state.def = await res.json();
  $('face-title').textContent = `${state.def.label}（絵：${state.def.artist}）`;
  $('face-img').src = `${entry.dir}/${state.def.base}`;
  buildParts();
  showScreen('game');
  resetRound();
}

function buildParts() {
  const layer = $('parts-layer');
  layer.innerHTML = '';
  state.parts.clear();
  for (const dp of state.def.parts) {
    const el = document.createElement('img');
    el.className = 'part';
    el.src = `${state.faceEntry.dir}/${dp.img}`;
    el.alt = dp.label || dp.id;
    el.draggable = false;
    layer.appendChild(el);
    const rec = { def: dp, el, x: 0, y: 0, placed: false, home: { sx: 0, sy: 0 } };
    state.parts.set(dp.id, rec);
    attachDrag(rec);
  }
}

function resetRound() {
  state.phase = 'ready';
  state.lastScore = null;
  $('stage').classList.remove('blind', 'opened');
  $('panel-play').classList.remove('hidden');
  $('panel-result').classList.add('hidden');
  $('submit-msg').textContent = '';
  $('submit-msg').classList.remove('rank');
  $('btn-submit').disabled = false;
  $('name-input').disabled = false;
  const btn = $('btn-main');
  btn.textContent = 'はじめる';
  btn.disabled = false;
  for (const rec of state.parts.values()) {
    rec.placed = false;
    rec.el.classList.remove('locked', 'dragging');
  }
  layout(true);
  setHint('「はじめる」を押すと めかくしが おります');
}

/* ── 版面計算 ─────────────────────────────────────────── */
function layout(rehome) {
  const stage = $('stage');
  const stageW = stage.clientWidth - 20;              // padding 10*2
  const maxH = Math.min(window.innerHeight * 0.52, 560);
  const scale = Math.min(stageW / state.def.width, maxH / state.def.height);
  state.scale = scale;

  const fb = $('face-box');
  const fw = Math.round(state.def.width * scale);
  const fh = Math.round(state.def.height * scale);
  fb.style.width = fw + 'px';
  fb.style.height = fh + 'px';

  // tray 高度：兩排零件的估計高
  const maxPartH = Math.max(...state.def.parts.map(p => p.h)) * scale;
  const rows = Math.ceil(state.def.parts.length / 3);
  const tray = $('tray');
  tray.style.height = Math.round(rows * (maxPartH + 14) + 10) + 'px';

  // face-box / tray 相對 stage 的框
  const sRect = stage.getBoundingClientRect();
  const fRect = fb.getBoundingClientRect();
  state.faceRect = {
    x: fRect.left - sRect.left, y: fRect.top - sRect.top, w: fw, h: fh,
  };
  const tRect = tray.getBoundingClientRect();
  const trayBox = { x: tRect.left - sRect.left, y: tRect.top - sRect.top, w: tRect.width, h: tRect.height };

  // home 位置（tray 內排格子）
  const ids = state.def.parts.map(p => p.id);
  const cols = Math.min(3, ids.length);
  ids.forEach((id, i) => {
    const rec = state.parts.get(id);
    const c = i % cols, r = Math.floor(i / cols);
    rec.home.sx = trayBox.x + trayBox.w * (c + 0.5) / cols;
    rec.home.sy = trayBox.y + (maxPartH / 2 + 10) + r * (maxPartH + 14);
    rec.el.style.width = Math.round(rec.def.w * scale) + 'px';
  });

  // 依模型重畫
  for (const rec of state.parts.values()) {
    if (rec.placed) {
      moveTo(rec, state.faceRect.x + rec.x * scale, state.faceRect.y + rec.y * scale);
    } else {
      moveTo(rec, rec.home.sx, rec.home.sy);
    }
  }
}

function moveTo(rec, sx, sy) {
  const w = rec.def.w * state.scale, h = rec.def.h * state.scale;
  rec.el.style.transform = `translate(${sx - w / 2}px, ${sy - h / 2}px)`;
  rec.sx = sx; rec.sy = sy;
}

/* ── 拖曳 ─────────────────────────────────────────────── */
function attachDrag(rec) {
  const el = rec.el;
  let dragging = false, offX = 0, offY = 0;

  el.addEventListener('pointerdown', (e) => {
    if (state.phase !== 'blind' || rec.placed) return;
    dragging = true;
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    const s = $('stage').getBoundingClientRect();
    offX = (e.clientX - s.left) - rec.sx;
    offY = (e.clientY - s.top) - rec.sy;
    e.preventDefault();
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const stage = $('stage');
    const s = stage.getBoundingClientRect();
    let sx = e.clientX - s.left - offX;
    let sy = e.clientY - s.top - offY;
    sx = Math.max(8, Math.min(s.width - 8, sx));
    sy = Math.max(8, Math.min(s.height - 8, sy));
    moveTo(rec, sx, sy);
  });

  const finish = (e) => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    const fr = state.faceRect;
    const inside = rec.sx >= fr.x && rec.sx <= fr.x + fr.w &&
                   rec.sy >= fr.y && rec.sy <= fr.y + fr.h;
    if (inside) {
      rec.placed = true;
      rec.x = (rec.sx - fr.x) / state.scale;   // 底圖座標
      rec.y = (rec.sy - fr.y) / state.scale;
      el.classList.add('locked');
      updateBlindProgress();
    } else {
      moveTo(rec, rec.home.sx, rec.home.sy);   // 彈回 tray
    }
  };
  el.addEventListener('pointerup', finish);
  el.addEventListener('pointercancel', finish);
}

function updateBlindProgress() {
  const remain = [...state.parts.values()].filter(r => !r.placed).length;
  if (remain === 0) {
    $('btn-main').disabled = false;
    setHint('ぜんぶ おいた！「オープン」で ごたいめん');
  } else {
    setHint(`パーツを かおの中へ スライド！（のこり ${remain}）`);
  }
}

function setHint(t) { $('hint').textContent = t; }

/* ── 流程 ─────────────────────────────────────────────── */
$('btn-main').addEventListener('click', () => {
  const btn = $('btn-main');
  if (state.phase === 'ready') {
    state.phase = 'blind';
    $('stage').classList.add('blind');
    btn.textContent = 'オープン';
    btn.disabled = true;
    updateBlindProgress();
  } else if (state.phase === 'blind') {
    openCurtain();
  }
});

function openCurtain() {
  state.phase = 'opened';
  $('stage').classList.remove('blind');
  $('stage').classList.add('opened');
  const placements = new Map();
  for (const [id, rec] of state.parts) placements.set(id, { x: rec.x, y: rec.y });
  state.lastScore = computeScore(state.def, placements);
  $('score-value').textContent = state.lastScore;
  $('panel-play').classList.add('hidden');
  $('panel-result').classList.remove('hidden');
  setHint('できあがり！なまえを入れて ランキングに登録しよう');
}

$('submit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (state.phase !== 'opened') return;
  const name = $('name-input').value.trim();
  if (!name) return;
  const btn = $('btn-submit');
  btn.disabled = true;
  $('submit-msg').textContent = '送信中…';
  try {
    const body = {
      name,
      faceId: state.faceEntry.id,
      parts: [...state.parts.values()].map(r => ({ id: r.def.id, x: r.x, y: r.y })),
    };
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'error');
    state.phase = 'done';
    $('name-input').disabled = true;
    $('score-value').textContent = data.score;
    const msg = $('submit-msg');
    msg.textContent = `登録しました！ 第 ${data.rank} 位`;
    msg.classList.add('rank');
    showBoard(data.top, name, data.score);
  } catch (err) {
    btn.disabled = false;
    $('submit-msg').textContent = '登録に失敗しました。もう一度どうぞ。';
  }
});

$('btn-retry').addEventListener('click', resetRound);
$('btn-menu').addEventListener('click', () => { state.phase = 'menu'; showScreen('menu'); });
$('btn-back').addEventListener('click', () => { state.phase = 'menu'; showScreen('menu'); });

/* ── 排行榜 ───────────────────────────────────────────── */
$('btn-board').addEventListener('click', async () => {
  try {
    const res = await fetch(`/api/score?face=${encodeURIComponent(state.faceEntry.id)}`);
    const data = await res.json();
    showBoard(data.top);
  } catch { showBoard([]); }
});
$('btn-board-close').addEventListener('click', () => $('board-overlay').classList.add('hidden'));
$('board-overlay').addEventListener('click', (e) => {
  if (e.target === $('board-overlay')) $('board-overlay').classList.add('hidden');
});

function showBoard(top, mineName, mineScore) {
  $('board-title').textContent = `ランキング ─ ${state.def ? state.def.label : ''}`;
  const list = $('board-list');
  list.innerHTML = '';
  let marked = false;
  (top || []).forEach((row, i) => {
    const li = document.createElement('li');
    if (!marked && mineName != null && row.name === mineName && row.score === mineScore) {
      li.classList.add('mine'); marked = true;
    }
    li.innerHTML = `<span class="rk">${i + 1}</span>` +
                   `<span class="nm">${esc(row.name)}</span>` +
                   `<span class="sc">${esc(row.score)}点</span>`;
    list.appendChild(li);
  });
  $('board-empty').classList.toggle('hidden', (top || []).length > 0);
  $('board-overlay').classList.remove('hidden');
}

/* ── init ─────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  if (state.phase !== 'menu' && state.def) layout(false);
});
loadMenu();
