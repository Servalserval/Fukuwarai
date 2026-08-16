/* 笑福面 ─ front-end v2.1
 * 座標系：模型一律用「底圖像素座標」(face.json 的 width/height)，
 * 畫面上再乘 scale 換算，resize 時重排即可。
 * v2.1：推しマーク支援雙 emoji、介面 日本語/繁體中文/English 三語切換。
 */
'use strict';

/* 推しマーク清單：想換就改這裡（支援 1～2 個 emoji 的組合） */
const MARKS = ['🐧⚡', '🎹✨', '🌃', '🖋️', '🐚'];

const PROFILE_KEY = 'fukuwarai_profile';
const LANG_KEY = 'fukuwarai_lang';

/* ── 三語字串表 ───────────────────────────────────────── */
const LANGS = {
  ja: {
    htmlLang: 'ja',
    title: 'リグロス福笑い',
    lead: 'かおを えらんでください',
    leadGroup: 'メンバーをえらんでください',
    backToGroups: '← カテゴリー',
    register: 'なまえを登録する',
    ranking: 'ランキング',
    back: '← もどる',
    start: 'はじめる',
    open: 'オープン',
    retry: 'もういちど',
    chooseFace: 'かおをえらぶ',
    scoreLabel: 'とくてん',
    scoreUnit: '点',
    submitted: (rank, best, u) => `登録しました！ 第 ${rank} 位（ベスト ${best}${u}）`,
    submit: 'ランキングに登録',
    sending: '送信中…',
    submitFail: '登録に失敗しました。もう一度どうぞ。',
    noProfile: 'なまえが未登録です',
    asPlayer: (p) => `${p} として登録`,
    edit: 'へんこう',
    profileTitle: 'なまえの登録',
    nameLabel: 'なまえ（12文字まで）',
    namePh: 'なまえ',
    markLabel: '推しマーク',
    none: 'なし',
    profileNote: 'この端末に保存されます。次からは自動でこのなまえで登録されます。',
    save: '保存する',
    close: 'とじる',
    thisFace: 'この顔',
    sum: (label) => `${label} 合計`,
    grandTotal: '総合計',
    allTime: '全期間',
    today: '今日',
    boardTitle: 'ランキング',
    boardTitleFace: (label) => `ランキング ─ ${label}`,
    empty: 'まだ記録がありません。いちばんのりのチャンス！',
    loading: 'よみこみ中…',
    hintReady: '「はじめる」を押すと めかくしが おります',
    hintBlind: (n) => `パーツを かおの中へ スライド！（のこり ${n}）`,
    hintAllPlaced: 'ぜんぶ おいた！「オープン」で ごたいめん',
    hintDone: 'できあがり！ランキングに登録しよう',
    curtain: 'めかくし中',
    curtainLatin: false,
    artist: (a) => `絵：${a}`,
    facesUnit: (n) => `${n}面`,
    saveImg: '画像を保存',
    shareNative: '共有',
    copied: 'コピー済✓',
    shareText: (face, score, u) => `リグロス福笑いで${score}点のいい成績とった！ #リグロス福笑い`,
  },
  zh: {
    htmlLang: 'zh-Hant',
    title: 'Regloss 笑福面',
    lead: '選一張臉吧',
    leadGroup: '先選一個成員',
    backToGroups: '← 回分類',
    register: '登錄名字',
    ranking: '排行榜',
    back: '← 返回',
    start: '開始',
    open: '開幕',
    retry: '再玩一次',
    chooseFace: '換一張臉',
    scoreLabel: '得分',
    scoreUnit: '分',
    submitted: (rank, best, u) => `登錄完成！第 ${rank} 名（最佳 ${best}${u}）`,
    submit: '登錄到排行榜',
    sending: '送出中…',
    submitFail: '登錄失敗了，再試一次。',
    noProfile: '還沒登錄名字',
    asPlayer: (p) => `以 ${p} 的身分登錄`,
    edit: '更改',
    profileTitle: '登錄名字',
    nameLabel: '名字（最多 12 字）',
    namePh: '名字',
    markLabel: '推しマーク（應援標誌）',
    none: '無',
    profileNote: '會保存在這個裝置上，之後送分會自動使用這個名字。',
    save: '儲存',
    close: '關閉',
    thisFace: '這張臉',
    sum: (label) => `${label} 總分`,
    grandTotal: '全部總分',
    allTime: '全期間',
    today: '今天',
    boardTitle: '排行榜',
    boardTitleFace: (label) => `排行榜 ─ ${label}`,
    empty: '還沒有任何紀錄，搶頭香的機會！',
    loading: '載入中…',
    hintReady: '按「開始」，蒙眼布就會降下來',
    hintBlind: (n) => `把零件滑進臉裡！（剩 ${n} 個）`,
    hintAllPlaced: '全部放好了！按「開幕」見真章',
    hintDone: '完成！登錄到排行榜吧',
    curtain: '蒙眼中',
    curtainLatin: false,
    artist: (a) => `繪師：${a}`,
    facesUnit: (n) => `${n} 張`,
    saveImg: '儲存圖片',
    shareNative: '分享',
    copied: '已複製文案✓',
    shareText: (face, score, u) => `我在Regloss笑福面中取得了${score}分的好成績！ #リグロス福笑い`,
  },
  en: {
    htmlLang: 'en',
    title: 'Regloss Fukuwarai',
    lead: 'Pick a face',
    leadGroup: 'Pick a member',
    backToGroups: '← Categories',
    register: 'Set your name',
    ranking: 'Rankings',
    back: '← Back',
    start: 'Start',
    open: 'Open!',
    retry: 'Play again',
    chooseFace: 'Choose face',
    scoreLabel: 'SCORE',
    scoreUnit: ' pts',
    submitted: (rank, best, u) => `Submitted! Rank #${rank} (best ${best}${u})`,
    submit: 'Submit score',
    sending: 'Sending…',
    submitFail: 'Submit failed. Please try again.',
    noProfile: 'No name set yet',
    asPlayer: (p) => `Playing as ${p}`,
    edit: 'Edit',
    profileTitle: 'Your name',
    nameLabel: 'Name (up to 12 characters)',
    namePh: 'Name',
    markLabel: 'Oshi mark',
    none: 'None',
    profileNote: 'Saved on this device. Future scores will use this name automatically.',
    save: 'Save',
    close: 'Close',
    thisFace: 'This face',
    sum: (label) => `${label} total`,
    grandTotal: 'Grand total',
    allTime: 'All-time',
    today: 'Today',
    boardTitle: 'Rankings',
    boardTitleFace: (label) => `Rankings — ${label}`,
    empty: 'No scores yet — be the first!',
    loading: 'Loading…',
    hintReady: 'Press Start to drop the blindfold',
    hintBlind: (n) => `Slide the parts onto the face! (${n} left)`,
    hintAllPlaced: 'All placed! Hit Open to reveal',
    hintDone: 'Done! Submit your score',
    curtain: 'NO PEEKING',
    curtainLatin: true,
    artist: (a) => `Art: ${a}`,
    facesUnit: (n) => `${n} faces`,
    saveImg: 'Save image',
    shareNative: 'Share',
    copied: 'Copied!',
    shareText: (face, score, u) => `I scored ${score} points in Regloss Fukuwarai! #リグロス福笑い`,
  },
};

function detectLang() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch {}
  if (saved && LANGS[saved]) return saved;
  const nav = (navigator.language || 'ja').toLowerCase();
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('en')) return 'en';
  return 'ja';
}
let lang = detectLang();
const t = (key, ...args) => {
  const v = LANGS[lang][key];
  return typeof v === 'function' ? v(...args) : v;
};
/* faces.json 的 label 可以是字串（各語共用）或 {ja, zh, en} 物件 */
const L = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[lang] || v.ja || Object.values(v)[0] || '';
};

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
  shareUrl: null,
  sharePromise: null,
  canShareFiles: false,
  board: { type: 'total', key: '', scope: 'all', context: 'menu' },
  markSel: '',
  menuGroup: null,   // null = カテゴリー層；有值 = 該群組的顔列表
  defs: {},          // faceId -> face.json（選單預覽用快取）
};

/* ── 語言切換 ─────────────────────────────────────────── */
function setLang(l) {
  if (!LANGS[l]) return;
  lang = l;
  try { localStorage.setItem(LANG_KEY, l); } catch {}
  applyTexts();
  // 結果畫面切語言 → 分享卡用新語言重做（圖上的單位、卡片標題跟著換）
  if (state.phase === 'opened' || state.phase === 'done') {
    state.shareUrl = null;
    state.sharePromise = uploadShare();
  }
}
function renderLangRow() {
  for (const b of document.querySelectorAll('.lang-btn')) {
    b.classList.toggle('sel', b.dataset.lang === lang);
  }
}
for (const b of document.querySelectorAll('.lang-btn')) {
  b.addEventListener('click', () => setLang(b.dataset.lang));
}

/* 把目前語言套到整個畫面（含依 phase 而異的字） */
function applyTexts() {
  document.documentElement.lang = LANGS[lang].htmlLang;
  renderLangRow();

  $('title-text').textContent = t('title');
  document.title = t('title');
  document.querySelector('.title').classList.toggle('latin', lang !== 'ja');

  $('btn-menu-board').textContent = t('ranking');
  $('btn-board').textContent = t('ranking');
  $('btn-back').textContent = t('back');
  $('btn-retry').textContent = t('retry');
  $('btn-menu').textContent = t('chooseFace');
  $('btn-submit').textContent = t('submit');
  $('score-label-el').textContent = t('scoreLabel');
  $('score-unit-el').textContent = t('scoreUnit');
  $('btn-edit-profile').textContent = t('edit');
  $('btn-save-img').textContent = t('saveImg');
  $('btn-share-native').textContent = t('shareNative');

  $('profile-title').textContent = t('profileTitle');
  $('name-label').textContent = t('nameLabel');
  $('profile-name').placeholder = t('namePh');
  $('mark-label').textContent = t('markLabel');
  $('profile-note').textContent = t('profileNote');
  $('btn-profile-save').textContent = t('save');
  $('btn-profile-close').textContent = t('close');
  $('btn-board-close').textContent = t('close');
  $('board-loading').textContent = t('loading');
  $('board-empty').textContent = t('empty');

  const ct = document.querySelector('.curtain-text');
  ct.textContent = t('curtain');
  ct.classList.toggle('latin', !!LANGS[lang].curtainLatin);

  // phase 相關
  const btn = $('btn-main');
  btn.textContent = state.phase === 'blind' ? t('open') : t('start');
  if (state.phase === 'ready') setHint(t('hintReady'));
  else if (state.phase === 'blind') updateBlindProgress();
  else if (state.phase === 'opened' || state.phase === 'done') setHint(t('hintDone'));
  else setHint('');

  if (state.faceEntry && state.def) {
    $('face-title').textContent = `${L(state.faceEntry.label)}（${t('artist', state.def.artist)}）`;
  }
  const noneBtn = document.querySelector('.mark-btn.none');
  if (noneBtn) noneBtn.textContent = t('none');
  renderProfileUI();
  refreshMenu();
  if (!$('board-overlay').classList.contains('hidden')) renderBoardTabs();
}

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
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, mark })); } catch {}
  renderProfileUI();
}
function playerText(p) { return `${p.mark ? p.mark + ' ' : ''}${p.name}`; }

function renderProfileUI() {
  const p = loadProfile();
  $('profile-chip').textContent = p ? playerText(p) : t('register');
  $('player-as').textContent = p ? t('asPlayer', playerText(p)) : t('noProfile');
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
  noneBtn.textContent = t('none');
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
function partHitScore(dp, pl, diag, tol) {
  const d = Math.hypot(pl.x - dp.x, pl.y - dp.y) / diag;
  return Math.max(0, 1 - d / tol);
}

/* 可互換零件組：全排列取最佳配對（組很小，n<=6） */
function bestAssignScore(dps, pls, diag, tol) {
  const n = dps.length;
  const idx = [...Array(n).keys()];
  let best = 0;
  const walk = (k) => {
    if (k === n) {
      let s = 0;
      for (let i = 0; i < n; i++) s += partHitScore(dps[i], pls[idx[i]], diag, tol);
      if (s > best) best = s;
      return;
    }
    for (let i = k; i < n; i++) {
      [idx[k], idx[i]] = [idx[i], idx[k]];
      walk(k + 1);
      [idx[k], idx[i]] = [idx[i], idx[k]];
    }
  };
  walk(0);
  return best;
}

function computeScore(def, placements) {
  const diag = Math.hypot(def.width, def.height);
  const tol = (typeof def.tolerance === 'number' && def.tolerance > 0) ? def.tolerance : 0.22;
  let sum = 0;
  const groups = new Map();   // swap 群組：同群可互換，取最佳配對
  for (const dp of def.parts) {
    const pl = placements.get(dp.id);
    if (!pl) return null;
    if (dp.swap) {
      const g = groups.get(dp.swap) || { dps: [], pls: [] };
      g.dps.push(dp); g.pls.push(pl);
      groups.set(dp.swap, g);
    } else {
      sum += partHitScore(dp, pl, diag, tol);
    }
  }
  for (const g of groups.values()) sum += bestAssignScore(g.dps, g.pls, diag, tol);
  return Math.round((sum / def.parts.length) * 10000);
}

/* 圖層優先度：z 大的在上（預設 0），同 z 照 face.json 陣列順序 */
function zOrdered(defParts) {
  return defParts.map((p, i) => ({ p, i }))
    .sort((a, b) => ((a.p.z || 0) - (b.p.z || 0)) || (a.i - b.i))
    .map((o) => o.p);
}

const esc = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── 選單（兩層：カテゴリー → 顔）───────────────────── */
async function loadMenu() {
  const res = await fetch('faces.json');
  state.registry = await res.json();
  await Promise.all(state.registry.faces.map(async (f) => {
    try { state.defs[f.id] = await (await fetch(`${f.dir}/face.json`)).json(); } catch {}
  }));
  refreshMenu();
  renderProfileUI();
}

/* 選單卡片的完成臉預覽：底圖＋零件擺到正解位置（百分比定位，隨卡片縮放） */
function previewHTML(f) {
  const def = state.defs[f.id];
  if (!def) {
    return `<span class="pv-frame"><img class="pv-plain" src="${esc(f.dir)}/base.png" alt=""></span>`;
  }
  const fit = (def.width / def.height >= 0.75) ? 'width:100%' : 'height:100%';
  let html = `<span class="pv-frame"><span class="preview" style="aspect-ratio:${def.width}/${def.height};${fit}">` +
    `<img class="pv-base" src="${esc(f.dir)}/${esc(def.base)}" style="z-index:0" alt="">`;
  for (const p of zOrdered(def.parts)) {
    const l = ((p.x - p.w / 2) / def.width * 100).toFixed(2);
    const tp = ((p.y - p.h / 2) / def.height * 100).toFixed(2);
    const w = (p.w / def.width * 100).toFixed(2);
    const zi = (p.z || 0) < 0 ? -1 : 1;
    html += `<img src="${esc(f.dir)}/${esc(p.img)}" style="left:${l}%;top:${tp}%;width:${w}%;z-index:${zi}" alt="">`;
  }
  return html + '</span></span>';
}

function groupsOf() {
  const reg = state.registry || { faces: [] };
  const out = {};
  for (const f of reg.faces) {
    const key = f.id.split('/')[0];
    if (!out[key]) {
      const g = reg.groups && reg.groups[key];
      out[key] = {
        label: L(typeof g === 'string' ? g : (g && g.label)) || key,
        cover: (g && typeof g === 'object' && g.cover) || f.id,
        faces: [],
      };
    }
    out[key].faces.push(f);
  }
  return out;
}

function refreshMenu() {
  if (!state.registry) return;
  const grid = $('face-grid');
  grid.innerHTML = '';
  const gs = groupsOf();

  if (!state.menuGroup || !gs[state.menuGroup]) {
    // ── カテゴリー層
    state.menuGroup = null;
    $('menu-sub').classList.add('hidden');
    $('lead').textContent = t('leadGroup');
    for (const [key, g] of Object.entries(gs)) {
      const coverFace = state.registry.faces.find((f) => f.id === g.cover) || g.faces[0];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'face-card';
      card.innerHTML =
        previewHTML(coverFace) +
        `<span class="fc-label">${esc(g.label)}</span>` +
        `<span class="fc-artist">${esc(t('facesUnit', g.faces.length))}</span>`;
      card.addEventListener('click', () => { state.menuGroup = key; refreshMenu(); });
      grid.appendChild(card);
    }
  } else {
    // ── 顔層：如果顔的 label 跟群組同名（例：はじめ），主標改顯示繪師名
    const g = gs[state.menuGroup];
    $('menu-sub').classList.remove('hidden');
    $('btn-group-back').textContent = t('backToGroups');
    $('group-crumb').textContent = g.label;
    $('lead').textContent = t('lead');
    for (const f of g.faces) {
      const fLabel = L(f.label);
      const primary = fLabel === g.label ? f.artist : fLabel;
      const showChip = primary !== f.artist;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'face-card';
      card.innerHTML =
        previewHTML(f) +
        `<span class="fc-label">${esc(primary)}</span>` +
        (showChip ? `<span class="fc-artist"></span>` : '');
      if (showChip) card.querySelector('.fc-artist').textContent = t('artist', f.artist);
      card.addEventListener('click', () => startFace(f));
      grid.appendChild(card);
    }
  }
}
$('btn-group-back').addEventListener('click', () => { state.menuGroup = null; refreshMenu(); });

function showScreen(name) {
  screens.menu.classList.toggle('hidden', name !== 'menu');
  screens.game.classList.toggle('hidden', name !== 'game');
}

/* ── 進入遊戲 ─────────────────────────────────────────── */
async function startFace(entry) {
  state.faceEntry = entry;
  state.def = state.defs[entry.id] ||
    await (await fetch(`${entry.dir}/face.json`)).json();
  $('face-title').textContent = `${L(entry.label)}（${t('artist', state.def.artist)}）`;
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
    el.style.zIndex = String(12 + Math.max(-9, Math.min(15, dp.z || 0)));
    layer.appendChild(el);
    const rec = { def: dp, el, x: 0, y: 0, placed: false, home: { sx: 0, sy: 0 } };
    state.parts.set(dp.id, rec);
    attachDrag(rec);
  }
}

function resetRound() {
  state.phase = 'ready';
  state.lastScore = null;
  state.shareUrl = null;
  state.sharePromise = null;
  $('stage').classList.remove('blind', 'opened');
  $('panel-play').classList.remove('hidden');
  $('panel-result').classList.add('hidden');
  $('submit-msg').textContent = '';
  $('submit-msg').classList.remove('rank');
  $('btn-submit').disabled = false;
  const btn = $('btn-main');
  btn.textContent = t('start');
  btn.disabled = false;
  for (const rec of state.parts.values()) {
    rec.placed = false;
    rec.drag = false;
    rec.el.classList.remove('locked', 'dragging');
  }
  layout();
  setHint(t('hintReady'));
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

  const TRAY_MAX = 110; // 零件在 tray 的最大邊長(px)，超過自動縮小
  const cols = Math.min(3, state.def.parts.length);
  for (const rec of state.parts.values()) {
    rec.trayScale = Math.min(1, TRAY_MAX / (Math.max(rec.def.w, rec.def.h) * scale));
  }
  const rowHs = [];
  state.def.parts.forEach((p, i) => {
    const rec = state.parts.get(p.id);
    const r = Math.floor(i / cols);
    rowHs[r] = Math.max(rowHs[r] || 40, p.h * scale * rec.trayScale);
  });
  const tray = $('tray');
  tray.style.height = Math.round(rowHs.reduce((a, b) => a + b + 14, 10)) + 'px';

  const sRect = stage.getBoundingClientRect();
  const fRect = fb.getBoundingClientRect();
  state.faceRect = { x: fRect.left - sRect.left, y: fRect.top - sRect.top, w: fw, h: fh };
  const tRect = tray.getBoundingClientRect();
  const trayBox = { x: tRect.left - sRect.left, y: tRect.top - sRect.top, w: tRect.width, h: tRect.height };

  let accY = trayBox.y + 10;
  state.def.parts.forEach((p, i) => {
    const rec = state.parts.get(p.id);
    const c = i % cols, r = Math.floor(i / cols);
    if (c === 0 && r > 0) accY += rowHs[r - 1] + 14;
    rec.home.sx = trayBox.x + trayBox.w * (c + 0.5) / cols;
    rec.home.sy = accY + rowHs[r] / 2;
  });

  for (const rec of state.parts.values()) {
    applyPartSize(rec);
    if (rec.placed) {
      moveTo(rec, state.faceRect.x + rec.x * scale, state.faceRect.y + rec.y * scale);
    } else {
      moveTo(rec, rec.home.sx, rec.home.sy);
    }
  }
}

function applyPartSize(rec) {
  rec.vs = (rec.placed || rec.drag) ? 1 : (rec.trayScale || 1);
  rec.el.style.width = Math.round(rec.def.w * state.scale * rec.vs) + 'px';
}

function moveTo(rec, sx, sy) {
  const vs = rec.vs || 1;
  const w = rec.def.w * state.scale * vs, h = rec.def.h * state.scale * vs;
  rec.el.style.transform = `translate3d(${sx - w / 2}px, ${sy - h / 2}px, 0)`;
  rec.sx = sx; rec.sy = sy;
}

/* ── 拖曳 ─────────────────────────────────────────────── */
function attachDrag(rec) {
  const el = rec.el;
  let dragging = false, offX = 0, offY = 0;
  let lastX = 0, lastY = 0, rafId = 0;

  // 用最後的手指座標重算零件位置（pointermove 和自動捲動共用）
  const track = (cx, cy) => {
    const s = $('stage').getBoundingClientRect();
    let sx = cx - s.left - offX;
    let sy = cy - s.top - offY;
    sx = Math.max(8, Math.min(s.width - 8, sx));
    sy = Math.max(8, Math.min(s.height - 8, sy));
    moveTo(rec, sx, sy);
  };

  // 手指靠近螢幕上下邊緣時自動捲動頁面（零件在畫面外也拖得到臉）
  const EDGE = 90;
  const autoLoop = () => {
    if (!dragging) return;
    const vh = window.innerHeight;
    let dy = 0;
    if (lastY < EDGE) dy = -Math.ceil((EDGE - lastY) / 5);
    else if (lastY > vh - EDGE) dy = Math.ceil((lastY - (vh - EDGE)) / 5);
    if (dy !== 0) {
      window.scrollBy(0, dy);
      track(lastX, lastY);   // 捲動後零件跟著手指
    }
    rafId = requestAnimationFrame(autoLoop);
  };

  el.addEventListener('pointerdown', (e) => {
    if (state.phase !== 'blind' || rec.placed) return;
    dragging = true;
    rec.drag = true;
    applyPartSize(rec);
    moveTo(rec, rec.sx, rec.sy);
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    const s = $('stage').getBoundingClientRect();
    offX = (e.clientX - s.left) - rec.sx;
    offY = (e.clientY - s.top) - rec.sy;
    lastX = e.clientX; lastY = e.clientY;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(autoLoop);
    e.preventDefault();
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    lastX = e.clientX; lastY = e.clientY;
    track(lastX, lastY);
  });

  const finish = () => {
    if (!dragging) return;
    dragging = false;
    rec.drag = false;
    cancelAnimationFrame(rafId);
    el.classList.remove('dragging');
    const fr = state.faceRect;
    const inside = rec.sx >= fr.x && rec.sx <= fr.x + fr.w &&
                   rec.sy >= fr.y && rec.sy <= fr.y + fr.h;
    if (inside) {
      rec.placed = true;
      rec.x = (rec.sx - fr.x) / state.scale;
      rec.y = (rec.sy - fr.y) / state.scale;
      el.classList.add('locked');
      updateBlindProgress();
    } else {
      applyPartSize(rec);
      moveTo(rec, rec.home.sx, rec.home.sy);
    }
  };
  el.addEventListener('pointerup', finish);
  el.addEventListener('pointercancel', finish);
}

function updateBlindProgress() {
  const remain = [...state.parts.values()].filter(r => !r.placed).length;
  if (remain === 0) {
    $('btn-main').disabled = false;
    setHint(t('hintAllPlaced'));
  } else {
    setHint(t('hintBlind', remain));
  }
}

function setHint(txt) { $('hint').textContent = txt; }

/* ── 流程 ─────────────────────────────────────────────── */
$('btn-main').addEventListener('click', () => {
  const btn = $('btn-main');
  if (state.phase === 'ready') {
    state.phase = 'blind';
    $('stage').classList.add('blind');
    btn.textContent = t('open');
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
  state.shareUrl = null;
  state.sharePromise = uploadShare();
  renderProfileUI();
  setHint(t('hintDone'));
}

$('btn-submit').addEventListener('click', async () => {
  if (state.phase !== 'opened') return;
  const profile = loadProfile();
  if (!profile) { openProfile(); return; }
  const btn = $('btn-submit');
  btn.disabled = true;
  $('submit-msg').textContent = t('sending');
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
    state.lastScore = data.score;
    $('score-value').textContent = data.score;
    const msg = $('submit-msg');
    msg.textContent = t('submitted', data.rank, data.best, t('scoreUnit'));
    msg.classList.add('rank');
    openBoard('game', { top: data.top });
  } catch {
    btn.disabled = false;
    $('submit-msg').textContent = t('submitFail');
  }
});

$('btn-retry').addEventListener('click', resetRound);
$('btn-menu').addEventListener('click', () => { state.phase = 'menu'; showScreen('menu'); });
$('btn-back').addEventListener('click', () => { state.phase = 'menu'; showScreen('menu'); });

/* ── 存圖與分享 ──────────────────────────────────────── */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* 把「玩家擺出來的臉」＋分數＋名字畫成一張 PNG */
async function buildResultBlob() {
  const def = state.def;
  try { await document.fonts.ready; } catch {}
  const PAD = 48, FOOT = 240, CW = 1080;
  const scale = Math.min((CW - PAD * 2) / def.width, 900 / def.height);
  const fw = def.width * scale, fh = def.height * scale;
  const CH = Math.round(PAD + fh + FOOT);
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#f6f1e3';
  ctx.fillRect(0, 0, CW, CH);
  const fx = (CW - fw) / 2;
  roundRectPath(ctx, fx - 14, PAD - 14, fw + 28, fh + 28, 18);
  ctx.fillStyle = '#fffdf7'; ctx.fill();
  ctx.strokeStyle = '#e2d9c2'; ctx.lineWidth = 3; ctx.stroke();

  const drawPart = (dp) => {
    const rec = state.parts.get(dp.id);
    if (!rec || !rec.placed) return;
    ctx.drawImage(rec.el,
      fx + (rec.x - dp.w / 2) * scale, PAD + (rec.y - dp.h / 2) * scale,
      dp.w * scale, dp.h * scale);
  };
  const zparts = zOrdered(def.parts);
  for (const dp of zparts) if ((dp.z || 0) < 0) drawPart(dp);
  ctx.drawImage($('face-img'), fx, PAD, fw, fh);
  for (const dp of zparts) if ((dp.z || 0) >= 0) drawPart(dp);

  const cx = CW / 2;
  let y = PAD + fh + 66;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5c554d';
  ctx.font = '500 34px "Zen Maru Gothic", sans-serif';
  const profile = loadProfile();
  const who = profile ? `${playerText(profile)}　` : '';
  ctx.fillText(`${who}${L(state.faceEntry.label)}（${t('artist', state.def.artist)}）`, cx, y);

  y += 100;
  ctx.fillStyle = '#c73e3a';
  ctx.font = '400 104px "Yuji Syuku", serif';
  const sw = ctx.measureText(String(state.lastScore)).width;
  ctx.font = '400 46px "Yuji Syuku", serif';
  const uw = ctx.measureText(t('scoreUnit')).width;
  ctx.font = '400 104px "Yuji Syuku", serif';
  ctx.fillText(String(state.lastScore), cx - uw / 2, y);
  ctx.fillStyle = '#2b2622';
  ctx.font = '400 46px "Yuji Syuku", serif';
  ctx.fillText(t('scoreUnit'), cx + sw / 2 + 8, y);

  y += 58;
  ctx.fillStyle = '#c9a227';
  ctx.font = '400 34px "Yuji Syuku", serif';
  ctx.fillText(t('title'), cx, y);

  return new Promise((resolve) => cv.toBlob(resolve, 'image/png'));
}

/* 把結果圖上傳成分享卡（/s/<id> 帶 og:image，X/FB 會顯示大圖卡片）*/
async function uploadShare() {
  try {
    const blob = await buildResultBlob();
    if (!blob) return null;
    const q = new URLSearchParams({
      face: L(state.faceEntry.label),
      name: (loadProfile() || {}).name || '',
      score: String(state.lastScore),
      lang,
    });
    const res = await fetch(`/api/share?${q}`, {
      method: 'POST',
      headers: { 'content-type': 'image/png' },
      body: blob,
    });
    if (!res.ok) return null;
    const data = await res.json();
    state.shareUrl = data.url;
    return data.url;
  } catch { return null; }
}
async function ensureShareUrl() {
  if (state.shareUrl) return state.shareUrl;
  if (state.sharePromise) { try { await state.sharePromise; } catch {} }
  return state.shareUrl || location.origin;   // 上傳失敗就退回分享首頁網址
}

function shareMessage() {
  return t('shareText', L(state.faceEntry.label), state.lastScore, t('scoreUnit'));
}

$('btn-save-img').addEventListener('click', async () => {
  if (!state.def || state.lastScore == null) return;
  const blob = await buildResultBlob();
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fukuwarai_${state.faceEntry.id.replace('/', '_')}_${state.lastScore}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
});

$('btn-share-native').addEventListener('click', async () => {
  if (!state.def || state.lastScore == null) return;
  const blob = await buildResultBlob();
  if (!blob) return;
  const file = new File([blob], 'fukuwarai.png', { type: 'image/png' });
  try {
    await navigator.share({ files: [file], text: `${shareMessage()} ${await ensureShareUrl()}` });
  } catch {}
});

$('btn-share-x').addEventListener('click', async () => {
  if (state.lastScore == null) return;
  const w = window.open('about:blank', '_blank');
  const url = await ensureShareUrl();
  const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage())}&url=${encodeURIComponent(url)}`;
  if (w) w.location = u; else window.open(u, '_blank', 'noopener');
});

$('btn-share-fb').addEventListener('click', async () => {
  if (state.lastScore == null) return;
  // FB 不允許預填貼文文字（平台政策），改成自動複製文案讓使用者貼上
  const btn = $('btn-share-fb');
  try {
    await navigator.clipboard.writeText(shareMessage());
    const orig = btn.textContent;
    btn.textContent = t('copied');
    setTimeout(() => { btn.textContent = orig; }, 1800);
  } catch {}
  // 手機：facebook.com/sharer 會被 FB App 攔截跳首頁，改走原生分享（圖＋文可直接進 FB App）
  if (state.canShareFiles) {
    try {
      const blob = await buildResultBlob();
      const file = new File([blob], 'fukuwarai.png', { type: 'image/png' });
      await navigator.share({ files: [file], text: `${shareMessage()} ${await ensureShareUrl()}` });
    } catch {}
    return;
  }
  const w = window.open('about:blank', '_blank');
  const url = await ensureShareUrl();
  const u = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  if (w) w.location = u; else window.open(u, '_blank', 'noopener');
});

/* 支援帶圖的原生分享才顯示「共有」鈕 */
(function () {
  try {
    const f = new File([new Blob(['x'])], 't.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      state.canShareFiles = true;
      $('btn-share-native').classList.remove('hidden');
    }
  } catch {}
})();

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
    typeTabs.push({ t: 'face', k: state.faceEntry.id, label: t('thisFace') });
    typeTabs.push({ t: 'char', k: g, label: t('sum', (groupsOf()[g] || { label: g }).label) });
    typeTabs.push({ t: 'total', k: '', label: t('grandTotal') });
  } else {
    const gs = groupsOf();
    for (const key of Object.keys(gs)) typeTabs.push({ t: 'char', k: key, label: t('sum', gs[key].label) });
    typeTabs.push({ t: 'total', k: '', label: t('grandTotal') });
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
  for (const [scope, key] of [['all', 'allTime'], ['today', 'today']]) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tab' + (b.scope === scope ? ' sel' : '');
    el.textContent = t(key);
    el.addEventListener('click', () => { b.scope = scope; renderBoardTabs(); fetchBoard(); });
    st.appendChild(el);
  }
  $('board-title').textContent =
    b.type === 'face' && state.faceEntry
      ? t('boardTitleFace', L(state.faceEntry.label)) : t('boardTitle');
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
    const fc = (b.type !== 'face' && row.faces > 1) ? `<span class="fc">${esc(t('facesUnit', row.faces))}</span>` : '';
    li.innerHTML = `<span class="rk">${i + 1}</span>` +
      (b.type === 'face' ? miniHTML(row.parts) : '') +
      `${mk}<span class="nm">${esc(row.name)}</span>${fc}` +
      `<span class="sc">${esc(row.score)}${esc(t('scoreUnit'))}</span>`;
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
  const order = new Map(zOrdered(def.parts).map((p, i) => [p.id, i]));
  arr = arr.filter((x) => byId.has(x.id))
    .sort((a, b) => order.get(a.id) - order.get(b.id));
  let html = `<span class="mini"><img class="mini-base" src="${esc(dir)}/${esc(def.base)}" style="z-index:0" alt="">`;
  for (const p of arr) {
    const dp = byId.get(p.id);
    if (!dp) continue;
    const w = dp.w * s, h = dp.h * s;
    const left = (Number(p.x) * s - w / 2).toFixed(1);
    const top = (Number(p.y) * s - h / 2).toFixed(1);
    const zi = (dp.z || 0) < 0 ? -1 : 1;
    html += `<img src="${esc(dir)}/${esc(dp.img)}" style="width:${w.toFixed(1)}px;left:${left}px;top:${top}px;z-index:${zi}" alt="">`;
  }
  return html + '</span>';
}

/* ── init ─────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  if (state.phase !== 'menu' && state.def) layout();
});
applyTexts();
loadMenu();
