/* 笑福面 ─ front-end v2
 * 座標系：模型一律用「底圖像素座標」(face.json 的 width/height)，
 * 畫面上再乘 scale 換算，resize 時重排即可。
 * v2：本機プロフィール（なまえ＋推しマーク）、排行榜預覽、
 *     當天榜／キャラ合計榜／総合計榜。
 */
'use strict';

/* 推しマーク清單：想換就改這裡（會顯示在登録画面跟排行榜） */
const MARKS = ['🐧','🎹','⚡','✨','🌃','🖋️','🐚'];

const PROFILE_KEY = 'fukuwarai_profile';

const $ = (id) => document.getElementById(id);
const screens = { menu: $('screen-menu'), game: $('screen-game') };

const state = {
  registry: null,
  faceEntry: null,   // faces.json 的那一筆
  def: null,         // face.json
  phase: 'menu',     // menu | ready | blind | opened | done
  scale: 1,
  faceRect: null,
  parts: new Map(),  // id -> {def, el, x, y(底圖座標), placed, home:{sx,sy}}
  lastScore: null,
  board: { type: 'total', key: '', scope: 'all', context: 'menu' },
  markSel: '',       // 登録画面暫存的マーク
};

/* ── プロフィール（localStorage）─────────────────────── */
function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (p && typeof p.name === 'string' && p.name.trim()) {
      return { name: p.name.trim(), mark: typeof p.mark === 'string' ? p.mark : '' };
    }
  } catch {}
  return null;
}
function saveProfile(name, mark) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, mark }));
  renderProfileUI();
}
function playerText(p) { return `${p.mark ? p.mark + ' ' : ''}${p.name}`; }

function renderProfileUI() {
  const p = loadProfile();
  $('profile-chip').textContent = p ? playerText(p) : 'なまえを登録する';
  $('player-as').textContent = p ? `${playerText(p)} として登録` : 'なまえが未登録です';
}

function openProfile() {
  const p = loadProfile();
  $('profile-name').value = p ? p.name : '';
  state.markSel = p ? p.mark : '';
  const grid = $('mark-grid');
  grid.innerHTML = '';
  const noneBtn = document.createElement('button');
  noneBtn.type = 'button';
  noneBtn.className = 'mark-btn none' + (state.markSel === '' ? ' sel' : '');
  noneBtn.textContent = 'なし';
  noneBtn.addEventListener('click', () => { state.markSel = ''; syncMarkSel(); });
  grid.appendChild(noneBtn);
  for (const m of MARKS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mark-btn' + (state.markSel === m ? ' sel' : '');
    b.textContent = m;
    b.dataset.mark = m;
    b.addEventListener('click', () => { state.markSel = m; syncMarkSel(); });
    grid.appendChild(b);
  }
  $('profile-overlay').classList.remove('hidden');
  if (!p) $('profile-name').focus();
}
function syncMarkSel() {
  for (const b of $('mark-grid').children) {
    b.classList.toggle('sel', (b.dataset.mark || '') === state.markSel);
  }
}
$('profile-chip').addEventListener('click', openProfile);
$('btn-edit-profile').addEventListener('click', openProfile);
$('btn-profile-close').addEventListener('click', () => $('profile-overlay').classList.add('hidden'));
$('profile-overlay').addEventListener('click', (e) => {
  if (e.target === $('profile-overlay')) $('profile-overlay').classList.add('hidden');
});
$('btn-profile-save').addEventListener('click', () => {
  const name = $('profile-name').value.trim().slice(0, 12);
  if (!name) { $('profile-name').focus(); return; }
  saveProfile(name, state.markSel);
  $('profile-overlay').classList.add('hidden');
});

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
  renderProfileUI();
}

function groupsOf() {
  const reg = state.registry || { faces: [] };
  const g = {};
  for (const f of reg.faces) {
    const key = f.id.split('/')[0];
    g[key] = (reg.groups && reg.groups[key]) || key;
  }
  return g; // {example: 'サンプル', hajime: 'はじめ', ...}
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
  const btn = $('btn-main');
  btn.textContent = 'はじめる';
  btn.disabled = false;
  for (const rec of state.parts.values()) {
    rec.placed = false;
    rec.el.classList.remove('locked', 'dragging');
  }
  layout();
  setHint('「はじめる」を押すと めかくしが おります');
}

/* ── 版面計算 ─────────────────────────────────────────── */
function layout() {
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

  // tray 高度：估兩排零件
  const maxPartH = Math.max(...state.def.parts.map(p => p.h)) * scale;
  const rows = Math.ceil(state.def.parts.length / 3);
  const tray = $('tray');
  tray.style.height = Math.round(rows * (maxPartH + 14) + 10) + 'px';

  const sRect = stage.getBoundingClientRect();
  const fRect = fb.getBoundingClientRect();
  state.faceRect = { x: fRect.left - sRect.left, y: fRect.top - sRect.top, w: fw, h: fh };
  const tRect = tray.getBoundingClientRect();
  const trayBox = { x: tRect.left - sRect.left, y: tRect.top - sRect.top, w: tRect.width, h: tRect.height };

  const ids = state.def.parts.map(p => p.id);
  const cols = Math.min(3, ids.length);
  ids.forEach((id, i) => {
    const rec = state.parts.get(id);
    const c = i % cols, r = Math.floor(i / cols);
    rec.home.sx = trayBox.x + trayBox.w * (c + 0.5) / cols;
    rec.home.sy = trayBox.y + (maxPartH / 2 + 10) + r * (maxPartH + 14);
    rec.el.style.width = Math.round(rec.def.w * scale) + 'px';
  });

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
    const s = $('stage').getBoundingClientRect();
    let sx = e.clientX - s.left - offX;
    let sy = e.clientY - s.top - offY;
    sx = Math.max(8, Math.min(s.width - 8, sx));
    sy = Math.max(8, Math.min(s.height - 8, sy));
    moveTo(rec, sx, sy);
  });

  const finish = () => {
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
  renderProfileUI();
  setHint('できあがり！ランキングに登録しよう');
}

$('btn-submit').addEventListener('click', async () => {
  if (state.phase !== 'opened') return;
  const profile = loadProfile();
  if (!profile) { openProfile(); return; }
  const btn = $('btn-submit');
  btn.disabled = true;
  $('submit-msg').textContent = '送信中…';
  try {
    const body = {
      name: profile.name,
      mark: profile.mark || null,
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
    $('score-value').textContent = data.score;
    const msg = $('submit-msg');
    msg.textContent = `登録しました！ 第 ${data.rank} 位（ベスト ${data.best} 点）`;
    msg.classList.add('rank');
    openBoard('game', { top: data.top });
  } catch {
    btn.disabled = false;
    $('submit-msg').textContent = '登録に失敗しました。もう一度どうぞ。';
  }
});

$('btn-retry').addEventListener('click', resetRound);
$('btn-menu').addEventListener('click', () => { state.phase = 'menu'; showScreen('menu'); });
$('btn-back').addEventListener('click', () => { state.phase = 'menu'; showScreen('menu'); });

/* ── 排行榜 ───────────────────────────────────────────── */
$('btn-board').addEventListener('click', () => openBoard('game'));
$('btn-menu-board').addEventListener('click', () => openBoard('menu'));
$('btn-board-close').addEventListener('click', () => $('board-overlay').classList.add('hidden'));
$('board-overlay').addEventListener('click', (e) => {
  if (e.target === $('board-overlay')) $('board-overlay').classList.add('hidden');
});

/* context: 'game' = 有「この顔」分頁；'menu' = 只有合計類 */
function openBoard(context, preset) {
  const b = state.board;
  b.context = context;
  b.scope = 'all';
  if (context === 'game') {
    b.type = 'face';
    b.key = state.faceEntry.id;
  } else {
    b.type = 'total';
    b.key = '';
  }
  renderBoardTabs();
  $('board-overlay').classList.remove('hidden');
  if (preset && preset.top) renderBoardList(preset.top);
  else fetchBoard();
}

function renderBoardTabs() {
  const b = state.board;
  const typeTabs = [];
  if (b.context === 'game') {
    const g = state.faceEntry.id.split('/')[0];
    typeTabs.push({ t: 'face', k: state.faceEntry.id, label: 'この顔' });
    typeTabs.push({ t: 'char', k: g, label: `${groupsOf()[g] || g} 合計` });
    typeTabs.push({ t: 'total', k: '', label: '総合計' });
  } else {
    const gs = groupsOf();
    for (const key of Object.keys(gs)) typeTabs.push({ t: 'char', k: key, label: `${gs[key]} 合計` });
    typeTabs.push({ t: 'total', k: '', label: '総合計' });
  }
  const tt = $('board-type-tabs');
  tt.innerHTML = '';
  for (const tab of typeTabs) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tab' + (b.type === tab.t && b.key === tab.k ? ' sel' : '');
    el.textContent = tab.label;
    el.addEventListener('click', () => { b.type = tab.t; b.key = tab.k; renderBoardTabs(); fetchBoard(); });
    tt.appendChild(el);
  }
  const st = $('board-scope-tabs');
  st.innerHTML = '';
  for (const [scope, label] of [['all', '全期間'], ['today', '今日']]) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tab' + (b.scope === scope ? ' sel' : '');
    el.textContent = label;
    el.addEventListener('click', () => { b.scope = scope; renderBoardTabs(); fetchBoard(); });
    st.appendChild(el);
  }
  const b2 = state.board;
  $('board-title').textContent =
    b2.type === 'face' ? `ランキング ─ ${state.def ? state.def.label : ''}` : 'ランキング';
}

async function fetchBoard() {
  const b = state.board;
  $('board-list').innerHTML = '';
  $('board-empty').classList.add('hidden');
  $('board-loading').classList.remove('hidden');
  try {
    const q = new URLSearchParams({ type: b.type, scope: b.scope });
    if (b.key) q.set('key', b.key);
    const res = await fetch(`/api/score?${q}`);
    const data = await res.json();
    renderBoardList(data.top || []);
  } catch {
    renderBoardList([]);
  }
}

function renderBoardList(top) {
  $('board-loading').classList.add('hidden');
  const b = state.board;
  const profile = loadProfile();
  const list = $('board-list');
  list.innerHTML = '';
  let marked = false;
  top.forEach((row, i) => {
    const li = document.createElement('li');
    if (!marked && profile && row.name === profile.name && (row.mark || '') === (profile.mark || '')) {
      li.classList.add('mine'); marked = true;
    }
    const mk = row.mark ? `<span class="mk">${esc(row.mark)}</span>` : '';
    const fc = (b.type !== 'face' && row.faces > 1) ? `<span class="fc">${row.faces}面</span>` : '';
    li.innerHTML = `<span class="rk">${i + 1}</span>` +
      (b.type === 'face' ? miniHTML(row.parts) : '') +
      `${mk}<span class="nm">${esc(row.name)}</span>${fc}` +
      `<span class="sc">${esc(row.score)}点</span>`;
    list.appendChild(li);
  });
  $('board-empty').classList.toggle('hidden', top.length > 0);
}

/* 排行榜的迷你笑福面預覽（用目前這張臉的素材＋該筆成績存的落點） */
function miniHTML(partsJson) {
  const def = state.def, dir = state.faceEntry && state.faceEntry.dir;
  if (!def || !dir || !partsJson) return '<span class="mini"></span>';
  let arr;
  try { arr = JSON.parse(partsJson); } catch { return '<span class="mini"></span>'; }
  if (!Array.isArray(arr)) return '<span class="mini"></span>';
  const W = 46, s = W / def.width;
  const byId = new Map(def.parts.map(p => [p.id, p]));
  let html = `<span class="mini"><img class="mini-base" src="${esc(dir)}/${esc(def.base)}" alt="">`;
  for (const p of arr) {
    const dp = byId.get(p.id);
    if (!dp) continue;
    const w = dp.w * s, h = dp.h * s;
    const left = (Number(p.x) * s - w / 2).toFixed(1);
    const top = (Number(p.y) * s - h / 2).toFixed(1);
    html += `<img src="${esc(dir)}/${esc(dp.img)}" style="width:${w.toFixed(1)}px;left:${left}px;top:${top}px" alt="">`;
  }
  return html + '</span>';
}

/* ── init ─────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  if (state.phase !== 'menu' && state.def) layout();
});
loadMenu();
