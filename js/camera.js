// カメラ体験：カメラの映像から体の33か所を読み取り、手をかざして選び、体で遊ぶ
// 読み取りは lib/mediapipe（Google MediaPipe・Apache-2.0）を使い、すべてこの端末の中で行う。映像は保存も送信もしない
// カメラがない・使わない人は「マウス・指」で、手の代わりに操作できる
const ROOT = window.CID_ROOT || '';
const SPEC = ['#4A5CF0', '#00A0E9', '#22A33A', '#8040C0', '#F05A28', '#FF4C7D', '#F08C1E', '#1A9A8A'];
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

const cam = $('cam'), video = $('cam-video'), cv = $('cam-canvas'), ctx = cv.getContext('2d');
const say = $('cam-say'), stat = $('cam-stat');
const P = { start: $('cam-start'), menu: $('cam-menu'), quiz: $('cam-quiz'), result: $('cam-result') };
let W = 0, H = 0, dpr = 1;

// 骨格のつなぎ方（MediaPipe の33点）
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [15, 19], [16, 20]];

// ---------- 5つの体験の一覧（下の説明カードとメニューで共用） ----------
const GAMES = [
  { id: 'avatar', title: 'なりきり光の人型', dept: 'ゲームクリエイター学科', slug: 'game-creator', color: '#8040C0', desc: '体の動きに合わせて、光でできた人型が同じ動きをします。お題の3つのポーズに挑戦。VTuberやゲームのモーションキャプチャと同じ考え方です。' },
  { id: 'drone', title: '手でドローンを飛ばす', dept: '高度ICTデザイン学科', slug: 'ict-design', color: '#4A5CF0', desc: '上げた手の位置にドローンがついてきます。光の輪を6つくぐるまでのタイムを競います。' },
  { id: 'brush', title: '光の筆で空中に描く', dept: 'クリエイティブデザイン学科', slug: 'creative-design', color: '#F05A28', desc: '手を肩より上に上げると、指先が光の筆になります。色は8学科の色に移り変わります。' },
  { id: 'quiz', title: '体で答える学科診断', dept: '8つの学科', slug: 'departments', color: '#00A0E9', desc: '左右どちらかの答えに手をかざして、5つの質問に答えます。合いそうな学科が分かります。' },
  { id: 'letters', title: '文字をつかまえて組み立てる', dept: 'CID 中央情報大学校', slug: 'index', color: '#FF4C7D', desc: '画面を漂う「未来をツクル人になる。」の文字に手で触れると、元の場所に戻ります。全部そろえるまでのタイムを競います。' }
];
$('cam-cards').innerHTML = GAMES.map(g => `<div class="cam-card" style="--c:${g.color}"><h3>${g.title}</h3><p>${g.desc}</p><a href="${g.slug}.html">${g.dept}</a></div>`).join('');
$('cam-grid').innerHTML = GAMES.map(g => `<button type="button" class="cam-btn" data-game="${g.id}" style="--c:${g.color}"><b>${g.title}</b><small>${g.dept}</small></button>`).join('');

// ---------- 画面の大きさ ----------
function size() {
  const r = cam.getBoundingClientRect();
  W = r.width; H = r.height; dpr = Math.min(1.5, devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(size).observe(cam); size();

// ---------- 入力：カメラ（骨格）か、マウス・指 ----------
let mode = 'none';          // 'camera' | 'pointer'
let landmarker = null, lastVT = -1;
let pose = null;            // 画面座標の33点 [{x,y,v}] か null
let seenAt = 0;             // 最後に人が映っていた時刻
const ptr = { x: 0, y: 0, in: false, down: false };

// 映像の座標（0〜1）を、画面の座標に変える。映像は左右反転・画面いっぱいに切り抜いて表示している
function toStage(lm) {
  const vw = video.videoWidth || 1280, vh = video.videoHeight || 720;
  const s = Math.max(W / vw, H / vh), dw = vw * s, dh = vh * s;
  return { x: (W - dw) / 2 + (1 - lm.x) * dw, y: (H - dh) / 2 + lm.y * dh, v: lm.visibility ?? 1 };
}

async function loadModel() {
  const mp = await import(ROOT + 'lib/mediapipe/vision_bundle.mjs');
  const fs = await mp.FilesetResolver.forVisionTasks(new URL(ROOT + 'lib/mediapipe/wasm', location.href).href);
  const opt = d => ({ baseOptions: { modelAssetPath: new URL(ROOT + 'lib/mediapipe/pose_landmarker_lite.task', location.href).href, delegate: d }, runningMode: 'VIDEO', numPoses: 2, minPoseDetectionConfidence: .5, minTrackingConfidence: .5 });
  try { return await mp.PoseLandmarker.createFromOptions(fs, opt('GPU')); }
  catch (e) { return await mp.PoseLandmarker.createFromOptions(fs, opt('CPU')); }
}

$('cam-go').onclick = async () => {
  const err = $('cam-err'), btn = $('cam-go');
  err.textContent = ''; btn.disabled = true; btn.textContent = '準備しています…';
  // カメラと読み取りの部品は同時に準備し、失敗したほうを案内する
  const camP = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ? navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
    : Promise.reject(Object.assign(new Error('no media'), { name: 'NotFoundError' }));
  const [c, m] = await Promise.allSettled([camP, landmarker ? Promise.resolve(landmarker) : loadModel()]);
  if (c.status === 'fulfilled' && m.status === 'fulfilled') {
    try {
      video.srcObject = c.value; await video.play();
      landmarker = m.value; mode = 'camera'; cam.classList.add('has-video');
      P.start.hidden = true; go('attract');
      return;
    } catch (e) { /* 下の案内へ */ }
  }
  if (c.status === 'fulfilled') c.value.getTracks().forEach(t => t.stop());
  if (m.status === 'fulfilled') landmarker = m.value;
  btn.disabled = false; btn.textContent = 'カメラを起動する';
  const e = c.status === 'rejected' ? c.reason : null;
  err.textContent = !e ? '読み取りの部品を読み込めませんでした。ページを開き直すか、「カメラなしで試す」をお試しください。'
    : e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'カメラの使用が許可されませんでした。アドレス欄の左のマークから許可できます。「カメラなしで試す」でも遊べます。'
      : e.name === 'NotReadableError' ? 'カメラをほかのアプリが使っています。そのアプリを閉じてから、もう一度押してください。'
        : 'カメラが見つかりませんでした。「カメラなしで試す」でも遊べます。';
};
$('cam-pointer').onclick = () => { mode = 'pointer'; P.start.hidden = true; go('menu'); };
addEventListener('pagehide', () => { const s = video.srcObject; if (s) s.getTracks().forEach(t => t.stop()); });

cam.addEventListener('pointermove', e => { const r = cam.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = true; });
cam.addEventListener('pointerdown', e => { const r = cam.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = true; ptr.down = true; });
addEventListener('pointerup', () => { ptr.down = false; });
cam.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') ptr.in = false; });

// マウス・指のときの、仮の体（片手がポインターについてくる）
function fakePose() {
  const cx = W / 2, sh = Math.min(W * .07, H * .085), top = H * .16;
  const p = [];
  const set = (i, x, y) => { p[i] = { x, y, v: 1 }; };
  for (let i = 0; i < 33; i++) set(i, cx, top);
  set(0, cx, top + sh * .5); set(7, cx - sh * .35, top + sh * .45); set(8, cx + sh * .35, top + sh * .45);
  const sy = top + sh * 1.6, hy = sy + sh * 2.4;
  set(11, cx + sh, sy); set(12, cx - sh, sy); set(23, cx + sh * .6, hy); set(24, cx - sh * .6, hy);
  set(25, cx + sh * .7, hy + sh * 1.6); set(26, cx - sh * .7, hy + sh * 1.6); set(27, cx + sh * .75, hy + sh * 3.1); set(28, cx - sh * .75, hy + sh * 3.1);
  set(31, cx + sh * 1, hy + sh * 3.3); set(32, cx - sh * 1, hy + sh * 3.3);
  set(14, cx - sh * 1.3, sy + sh * 1.3); set(16, cx - sh * 1.4, sy + sh * 2.5); set(20, cx - sh * 1.45, sy + sh * 2.8);
  const hx = ptr.in ? ptr.x : cx + sh * 2.2, hyy = ptr.in ? ptr.y : sy + sh * 2;
  set(15, hx, hyy); set(19, hx, hyy - 6);
  set(13, (p[11].x + hx) / 2 + sh * .4, (p[11].y + hyy) / 2 + sh * .3);
  return p;
}

// 画面に映る人のうち、一番大きく映っている人（一番手前）を選ぶ
let smooth = null;
function readPose(now) {
  if (mode === 'pointer') { pose = fakePose(); seenAt = now; return; }
  if (!landmarker || video.readyState < 2) return;
  if (video.currentTime === lastVT) return;
  lastVT = video.currentTime;
  const r = landmarker.detectForVideo(video, now);
  let best = null, bw = 0;
  (r.landmarks || []).forEach(l => { const w = Math.abs(l[11].x - l[12].x); if (w > bw) { bw = w; best = l; } });
  if (!best) { pose = null; smooth = null; return; }
  const pts = best.map(toStage);
  smooth = smooth ? pts.map((p, i) => ({ x: smooth[i].x + (p.x - smooth[i].x) * .6, y: smooth[i].y + (p.y - smooth[i].y) * .6, v: p.v })) : pts;
  pose = smooth; seenAt = now;
}
// 手の位置（指先が見えていれば指先、なければ手首）
function hands() {
  if (mode === 'pointer') return ptr.in ? [{ x: ptr.x, y: ptr.y, side: 'p' }] : [];
  if (!pose) return [];
  const out = [];
  [[19, 15, 11, 'L'], [20, 16, 12, 'R']].forEach(([f, w, s, side]) => {
    const p = pose[f].v > .4 ? pose[f] : pose[w];
    if (p.v > .35) out.push({ x: p.x, y: p.y, side, raised: p.y < pose[s].y });
  });
  return out;
}
const bodyScale = () => pose ? Math.max(30, dist(pose[11], pose[12])) : 80;

// ---------- 手をかざして押すボタン ----------
const dwell = new Map(); // ボタン -> たまった秒数
function dwellButtons(dt, hs) {
  const btns = [...cam.querySelectorAll('.cam-panel:not([hidden]) .cam-btn')];
  const cr = cam.getBoundingClientRect();
  btns.forEach(b => {
    const r = b.getBoundingClientRect();
    const on = hs.some(h => h.x >= r.left - cr.left && h.x <= r.right - cr.left && h.y >= r.top - cr.top && h.y <= r.bottom - cr.top);
    let t = dwell.get(b) || 0;
    t = on ? t + dt : Math.max(0, t - dt * 2);
    b.classList.toggle('is-hover', on);
    // マウスは押せばよいので、かざして選ぶのはカメラのときだけ
    if (mode === 'pointer') t = 0;
    const need = b.classList.contains('cam-ans') ? 1.0 : 1.3;
    b.style.setProperty('--p', clamp(t / need, 0, 1).toFixed(3));
    if (t >= need) { t = 0; b.click(); }
    dwell.set(b, t);
  });
}

// ---------- 描画の部品 ----------
function glowLine(a, b, w, color, alpha = 1) {
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = w * 1.5;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}
function dot(p, r, color, alpha = 1) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = r * 3;
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}
// 読み取った骨格（点と線）。k は表示する点の割合（演出用）
function skeleton(p, k = 1, alpha = .9) {
  const n = Math.ceil(33 * k);
  BONES.forEach(([a, b], i) => { if (a < n && b < n && p[a].v > .3 && p[b].v > .3) glowLine(p[a], p[b], 2, 'rgba(255,255,255,.75)', alpha * .8); });
  for (let i = 0; i < n; i++) if (p[i].v > .3) dot(p[i], i === 0 ? 5 : 3.5, SPEC[i % 8], alpha);
}
function handCursor(h, t) {
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowColor = '#9DBEF0'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(h.x, h.y, 18, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(h.x, h.y, 26 + Math.sin(t * 6) * 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * .5); ctx.stroke();
  ctx.shadowBlur = 0;
  dot(h, 4, '#fff');
}

// ---------- 場面の切り替え ----------
let scene = 'idle', sceneT = 0, game = null, G = null;
const booth = () => document.fullscreenElement === cam;
function showPanel(name) { Object.entries(P).forEach(([k, el]) => { el.hidden = k !== name; }); }
function go(s, arg) {
  scene = s; sceneT = 0; say.textContent = '';
  cam.classList.toggle('is-dim', s === 'play' && !!game && (arg || game.id) === 'avatar');
  cam.classList.toggle('is-touch', mode === 'pointer' && s === 'play');
  $('cam-back').hidden = !(s === 'play' || s === 'result');
  if (s === 'attract') { showPanel(null); say.textContent = 'カメラの前に立ってください'; }
  if (s === 'scan') { showPanel(null); }
  if (s === 'menu') { showPanel('menu'); game = null; }
  if (s === 'play') { showPanel(null); G = {}; game = GAMES.find(g => g.id === arg) || game; PLAY[game.id].start(G); }
  if (s === 'result') {
    showPanel('result');
    $('cam-r-k').textContent = arg.kicker; $('cam-r-big').textContent = arg.big; $('cam-r-text').textContent = arg.text;
    const a = $('cam-r-link'); a.href = (arg.slug || game.slug) + '.html'; a.textContent = arg.linkText || (game.dept + 'を見る');
    a.style.setProperty('--c', arg.color || game.color);
  }
}
$('cam-grid').addEventListener('click', e => { const b = e.target.closest('[data-game]'); if (b) go('play', b.dataset.game); });
P.result.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; b.dataset.act === 'again' ? go('play', game.id) : go('menu'); });
$('cam-back').onclick = () => go('menu');
$('cam-full').onclick = () => { if (booth()) document.exitFullscreen(); else if (cam.requestFullscreen) cam.requestFullscreen(); };
document.addEventListener('fullscreenchange', () => { $('cam-full').textContent = booth() ? '全画面を終える' : '全画面で展示する'; setTimeout(size, 50); });

// ---------- 起動の演出：読み取られていると分かる3秒 ----------
const SCAN_LINES = ['人物を検出しました', '骨格 33点を読み取っています', '体を認識しました'];
function drawScan(t) {
  const k = clamp(t / 1.4, 0, 1);
  if (pose) skeleton(pose, k, 1);
  // 上から下へ走る読み取りの線
  const y = (t / 1.6 % 1) * H;
  const g = ctx.createLinearGradient(0, y - 60, 0, y + 4);
  g.addColorStop(0, 'rgba(0,160,233,0)'); g.addColorStop(1, 'rgba(120,200,255,.55)');
  ctx.fillStyle = g; ctx.fillRect(0, y - 60, W, 64);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, y, W, 2);
  // 体のまわりの枠
  if (pose) {
    const xs = pose.filter(p => p.v > .3).map(p => p.x), ys = pose.filter(p => p.v > .3).map(p => p.y);
    const x0 = Math.min(...xs) - 30, x1 = Math.max(...xs) + 30, y0 = Math.min(...ys) - 50, y1 = Math.max(...ys) + 20;
    ctx.strokeStyle = 'rgba(157,190,240,.9)'; ctx.lineWidth = 2; const c = 22;
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, yy, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x + c * sx, yy); ctx.lineTo(x, yy); ctx.lineTo(x, yy + c * sy); ctx.stroke(); });
  }
  say.textContent = SCAN_LINES[Math.min(2, Math.floor(t / 1))];
}

// ---------- 体験 ----------
const PLAY = {};
const finish = r => go('result', r);
const timer = (t, limit) => Math.max(0, limit - t).toFixed(0);

// C. なりきり光の人型：お題の3ポーズ
PLAY.avatar = {
  POSES: [
    ['両手を頭の上に上げよう', p => p[15].y < p[0].y && p[16].y < p[0].y],
    ['両手を横に広げて「T」の字', p => Math.abs(p[15].y - p[11].y) < bodyScale() * .45 && Math.abs(p[16].y - p[12].y) < bodyScale() * .45 && dist(p[15], p[16]) > bodyScale() * 2.6],
    ['片手を上、片手を下に', p => (p[15].y < p[0].y && p[16].y > p[24].y) || (p[16].y < p[0].y && p[15].y > p[23].y)]
  ],
  start(g) { g.i = 0; g.hold = 0; g.trail = []; g.parts = []; g.done = 0; g.flash = 0; },
  frame(g, t, dt) {
    const LIMIT = 45;
    if (pose) {
      g.trail.push(pose.map(p => ({ ...p }))); if (g.trail.length > 7) g.trail.shift();
      const s = bodyScale();
      // 残像
      g.trail.forEach((tp, k) => { if (k < g.trail.length - 1) BONES.forEach(([a, b], i) => glowLine(tp[a], tp[b], s * .16, SPEC[i % 8], .08 + k * .03)); });
      // 光の人型
      BONES.forEach(([a, b], i) => { if (pose[a].v > .3 && pose[b].v > .3) glowLine(pose[a], pose[b], s * .2, SPEC[i % 8], .95); });
      const hr = Math.max(dist(pose[7], pose[8]) * .75, s * .28);
      ctx.lineWidth = s * .08; ctx.strokeStyle = '#fff'; ctx.shadowColor = '#9DBEF0'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(pose[0].x, pose[0].y, hr, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      // 手を速く動かすと光の粒が散る
      [15, 16].forEach(i => {
        const prev = g.trail[g.trail.length - 2];
        if (prev && dist(prev[i], pose[i]) > s * .12) for (let n = 0; n < 3; n++) g.parts.push({ x: pose[i].x, y: pose[i].y, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, life: 1, c: SPEC[(Math.random() * 8) | 0] });
      });
      // お題のポーズ
      if (g.i < 3) {
        const [txt, ok] = this.POSES[g.i];
        say.textContent = `${g.i + 1}/3　${txt}`;
        g.hold = ok(pose) ? g.hold + dt : 0;
        if (g.hold > .6) {
          g.i++; g.hold = 0; g.flash = 1;
          for (let n = 0; n < 60; n++) g.parts.push({ x: pose[0].x, y: pose[0].y + s, vx: (Math.random() - .5) * 18, vy: (Math.random() - .5) * 18, life: 1, c: SPEC[n % 8] });
          if (g.i === 3) g.done = t;
        }
      } else say.textContent = 'クリア！ 自由に動いてみよう';
    } else say.textContent = 'カメラの前に、全身が映るように立ってください';
    g.parts = g.parts.filter(p => (p.life -= dt * 1.4) > 0);
    g.parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .15; dot(p, 3, p.c, p.life); });
    if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash * .25})`; ctx.fillRect(0, 0, W, H); g.flash -= dt * 2; }
    stat.textContent = `のこり ${timer(t, LIMIT)} 秒`;
    if ((g.done && t - g.done > 6) || t > LIMIT) finish({ kicker: 'なりきり光の人型', big: g.i === 3 ? `${g.done.toFixed(1)}秒` : `${g.i} / 3`, text: g.i === 3 ? '3つのポーズをクリアしました。体の動きでキャラクターを動かすのは、ゲームやVTuberで使われるモーションキャプチャの考え方です。' : 'もう一度挑戦してみよう。体の動きでキャラクターを動かすのは、モーションキャプチャの考え方です。' });
  }
};

// D. 手でドローンを飛ばす
PLAY.drone = {
  start(g) { g.d = { x: W / 2, y: H * .7 }; g.n = 0; g.gate = this.next(g); g.in = 0; g.parts = []; },
  next(g) { const m = Math.min(W, H); let p; do { p = { x: W * (.15 + Math.random() * .7), y: H * (.22 + Math.random() * .58) }; } while (g.gate && dist(p, g.gate) < m * .35); return p; },
  frame(g, t, dt) {
    const GATES = 6, LIMIT = 60;
    const hs = hands(); const h = hs.sort((a, b) => a.y - b.y)[0];
    // 画面の速さ（fps）に関係なく同じ速さでついてくる
    const f = 1 - Math.pow(.82, dt * 60);
    if (h) { g.d.x += (h.x - g.d.x) * f; g.d.y += (h.y - g.d.y) * f; say.textContent = `光の輪をくぐろう　${g.n} / ${GATES}`; }
    else say.textContent = '手を上げると、ドローンが手についてきます';
    const R = Math.min(W, H) * .1, c = SPEC[g.n % 8];
    // 光の輪
    ctx.lineWidth = 8; ctx.strokeStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.ellipse(g.gate.x, g.gate.y, R, R * 1.05, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.globalAlpha = .15 + .1 * Math.sin(t * 6); ctx.fillStyle = c; ctx.fill(); ctx.globalAlpha = 1;
    if (dist(g.d, g.gate) < R * .55) {
      g.in += dt;
      if (g.in > .15) { for (let n = 0; n < 40; n++) g.parts.push({ x: g.gate.x, y: g.gate.y, vx: (Math.random() - .5) * 14, vy: (Math.random() - .5) * 14, life: 1, c }); g.n++; g.in = 0; g.gate = this.next(g); }
    } else g.in = 0;
    // ドローン
    const s = Math.min(W, H) * .045, d = g.d, spin = t * 40;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * .22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(d.x - s, d.y - s); ctx.lineTo(d.x + s, d.y + s); ctx.moveTo(d.x + s, d.y - s); ctx.lineTo(d.x - s, d.y + s); ctx.stroke();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
      dot({ x: d.x + a * s, y: d.y + b * s }, s * .42, '#DF032E');
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(d.x + a * s, d.y + b * s, s * .7, s * .18, spin * (a * b), 0, Math.PI * 2); ctx.stroke();
    });
    dot(d, s * .35, '#fff');
    g.parts = g.parts.filter(p => (p.life -= dt * 1.5) > 0);
    g.parts.forEach(p => { p.x += p.vx; p.y += p.vy; dot(p, 3, p.c, p.life); });
    stat.textContent = `${t.toFixed(1)} 秒`;
    if (g.n >= GATES) finish({ kicker: '手でドローンを飛ばす', big: `${t.toFixed(1)}秒`, text: '光の輪を6つくぐりました。ドローンを思いどおりに飛ばすには、位置の読み取りと、なめらかに追いかける計算が欠かせません。' });
    else if (t > LIMIT) finish({ kicker: '手でドローンを飛ばす', big: `${g.n} / ${GATES}`, text: '時間切れ。手をゆっくり動かすと、ドローンも落ち着いてついてきます。' });
  }
};

// B. 光の筆
PLAY.brush = {
  start(g) { g.strokes = []; g.cur = null; g.k = 0; g.clear = 0; },
  frame(g, t, dt) {
    const LIMIT = 30;
    let pen = null;
    if (mode === 'pointer') { if (ptr.down && ptr.in) pen = { x: ptr.x, y: ptr.y }; }
    else { const h = hands().filter(h => h.raised).sort((a, b) => a.y - b.y)[0]; if (h) pen = h; }
    // 両手を頭の上に1秒上げると全部消える
    if (pose && mode === 'camera' && pose[15].y < pose[0].y && pose[16].y < pose[0].y) { g.clear += dt; if (g.clear > 1) { g.strokes = []; g.clear = 0; } } else g.clear = 0;
    if (pen) {
      if (!g.cur) { g.cur = []; g.strokes.push(g.cur); }
      const last = g.cur[g.cur.length - 1];
      if (!last || dist(last, pen) > 3) { g.k += 1; g.cur.push({ x: pen.x, y: pen.y, c: SPEC[Math.floor(g.k / 14) % 8] }); }
    } else g.cur = null;
    g.redraw = () => g.strokes.forEach(st => { for (let i = 1; i < st.length; i++) glowLine(st[i - 1], st[i], 7, st[i].c, .95); });
    g.redraw();
    if (pen) dot(pen, 8, '#fff');
    say.textContent = mode === 'pointer' ? '押したまま動かすと描けます' : '手を肩より上に上げると描けます（両手を頭の上で全部消す）';
    stat.textContent = `のこり ${timer(t, LIMIT)} 秒`;
    if (t > LIMIT) { g.keep = true; finish({ kicker: '光の筆', big: '作品完成', text: '線の色は、8つの学科の色に移り変わります。写真に撮って残してください。' }); }
  }
};

// A. 体で答える学科診断（2択×5問）
const QUIZ = [
  ['作るなら、どっち？', ['画面の中のもの（ゲーム・アプリ・動画）', { 'game-creator': 2, 'information-system': 1, 'internet-video-creator': 1, 'ict-design': 1 }], ['手でさわれるもの（機械・料理・作品）', { 'electro-communications': 2, 'agri-foodtech': 2, 'creative-design': 1 }]],
  ['「すごい！」と言われたいのは？', ['作ったものが動いたとき', { 'information-system': 2, 'ict-design': 2, 'game-creator': 1, 'electro-communications': 1 }], ['見た目をかっこよく仕上げたとき', { 'creative-design': 2, 'pop-culture': 2, 'internet-video-creator': 1 }]],
  ['好きなのは、どっち？', ['キャラクター・アニメ・ゲーム', { 'pop-culture': 2, 'game-creator': 2 }], ['SNSのトレンド・ニュース', { 'internet-video-creator': 2, 'ict-design': 1, 'information-system': 1 }]],
  ['グループで作るなら、どの役？', ['しくみを考えて組み立てる', { 'information-system': 2, 'ict-design': 1, 'electro-communications': 1 }], ['アイデアを出して形にする', { 'creative-design': 1, 'internet-video-creator': 1, 'game-creator': 1, 'agri-foodtech': 1, 'pop-culture': 1 }]],
  ['気になるのは、どっち？', ['AI・ロボット・ドローン', { 'ict-design': 2, 'information-system': 1 }], ['食べもの・農業・エネルギー', { 'agri-foodtech': 2, 'electro-communications': 2 }]]
];
PLAY.quiz = {
  start(g) { g.i = 0; g.score = {}; this.show(g); P.quiz.hidden = false; },
  show(g) {
    const q = QUIZ[g.i];
    $('cam-quiz-n').textContent = `質問 ${g.i + 1} / ${QUIZ.length}`;
    $('cam-quiz-q').textContent = q[0];
    P.quiz.querySelectorAll('.cam-ans').forEach((b, k) => { b.textContent = q[k + 1][0]; b.style.setProperty('--c', SPEC[(g.i * 2 + k) % 8]); dwell.set(b, 0); });
  },
  answer(g, k) {
    const add = QUIZ[g.i][k + 1][1];
    for (const s in add) g.score[s] = (g.score[s] || 0) + add[s];
    g.i++;
    if (g.i < QUIZ.length) return this.show(g);
    P.quiz.hidden = true;
    const order = (window.CID && CID.DEPT_ORDER) || Object.keys(g.score);
    const top = order.map(s => [s, g.score[s] || 0]).sort((a, b) => b[1] - a[1])[0][0];
    const d = (window.CID && CID.DEPTS && CID.DEPTS[top]) || { name: top, catch: '', color: '#fff' };
    finish({ kicker: 'あなたに合いそうな学科', big: d.name, text: d.catch, slug: top, linkText: d.name + 'を見る', color: d.color });
  },
  frame(g) { say.textContent = mode === 'pointer' ? '答えを押してください' : '答えのほうに手をかざしてください'; stat.textContent = ''; }
};
P.quiz.addEventListener('click', e => { const b = e.target.closest('.cam-ans'); if (b && game && game.id === 'quiz') PLAY.quiz.answer(G, +b.dataset.a); });

// E. 文字をつかまえて組み立てる
PLAY.letters = {
  start(g) {
    const txt = [...'未来をツクル人になる。'], m = Math.min(W, H);
    g.r = m * .055; g.t0 = 0;
    const slotW = Math.min(W * .9 / txt.length, g.r * 2.3), x0 = (W - slotW * txt.length) / 2 + slotW / 2;
    g.ls = txt.map((c, i) => ({ c, home: { x: x0 + i * slotW, y: H * .2 }, x: W * (.1 + Math.random() * .8), y: H * (.4 + Math.random() * .45), vx: (Math.random() - .5) * 2.2, vy: (Math.random() - .5) * 2.2, done: false, fly: 0 }));
  },
  frame(g, t, dt) {
    const LIMIT = 60, hs = hands();
    g.ls.forEach((l, i) => {
      // 元の場所の枠
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; ctx.strokeRect(l.home.x - g.r * .9, l.home.y - g.r * .9, g.r * 1.8, g.r * 1.8);
      if (l.done) { l.fly = Math.min(1, l.fly + dt * 3); l.x += (l.home.x - l.x) * .25; l.y += (l.home.y - l.y) * .25; }
      else {
        l.x += l.vx; l.y += l.vy;
        if (l.x < g.r || l.x > W - g.r) l.vx *= -1;
        if (l.y < H * .34 || l.y > H - g.r) l.vy *= -1;
        if (hs.some(h => dist(h, l) < g.r * 1.3)) l.done = true;
        ctx.globalAlpha = .9; ctx.fillStyle = 'rgba(8,19,48,.55)'; ctx.strokeStyle = SPEC[i % 8]; ctx.lineWidth = 3; ctx.shadowColor = SPEC[i % 8]; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(l.x, l.y, g.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      ctx.fillStyle = l.done ? SPEC[i % 8] : '#fff'; ctx.font = `900 ${g.r * 1.15}px "Zen Kaku Gothic New", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (l.done) { ctx.shadowColor = SPEC[i % 8]; ctx.shadowBlur = 16; }
      ctx.fillText(l.c, l.x, l.y); ctx.shadowBlur = 0;
    });
    const left = g.ls.filter(l => !l.done).length;
    say.textContent = left ? `文字に手で触れよう　のこり ${left} 文字` : '完成！';
    stat.textContent = `${t.toFixed(1)} 秒`;
    if (!left && !g.t0) g.t0 = t;
    if (g.t0 && t - g.t0 > 1.5) finish({ kicker: '文字をつかまえて組み立てる', big: `${g.t0.toFixed(1)}秒`, text: '「未来をツクル人になる。」は、CIDのキャッチコピーです。', slug: 'index', linkText: 'CIDのトップへ', color: '#FF4C7D' });
    else if (t > LIMIT) finish({ kicker: '文字をつかまえて組み立てる', big: `${11 - left} / 11`, text: '時間切れ。両手を大きく動かすと、たくさんの文字に届きます。', slug: 'index', linkText: 'CIDのトップへ', color: '#FF4C7D' });
  }
};

// ---------- 毎フレームの処理 ----------
let prev = performance.now(), fpsN = 0, fpsT = 0, fps = 0;
function step(now) {
  const dt = clamp((now - prev) / 1000, 0, .1); prev = now; sceneT += dt;
  fpsN++; fpsT += dt; if (fpsT > 1) { fps = fpsN; fpsN = 0; fpsT = 0; }
  readPose(now);
  ctx.clearRect(0, 0, W, H);
  // 光の筆の結果画面では、描いた絵を残す
  if (scene === 'result' && G && G.keep && G.redraw) G.redraw();
  const hs = hands();

  if (scene === 'attract') {
    if (pose && now - seenAt < 200) { if (sceneT > .4) go('scan'); }
    else sceneT = 0;
  } else if (scene === 'scan') {
    drawScan(sceneT);
    if (sceneT > 3) go('menu');
  } else if (scene === 'menu') {
    if (pose && mode === 'camera') skeleton(pose, 1, .55);
    say.textContent = mode === 'camera' ? '' : '';
  } else if (scene === 'play') {
    if (pose && mode === 'camera' && game.id !== 'avatar') skeleton(pose, 1, .35);
    PLAY[game.id].frame(G, sceneT, dt);
  } else if (scene === 'result') {
    if (pose && mode === 'camera' && !(G && G.keep)) skeleton(pose, 1, .35);
    if (booth() && sceneT > 15) go('menu');
  }
  if (scene === 'menu' || scene === 'result' || (scene === 'play' && game && game.id === 'quiz')) { dwellButtons(dt, hs); if (mode === 'camera') hs.forEach(h => handCursor(h, now / 1000)); }

  // 展示中、人がいなくなったら最初に戻る
  if (mode === 'camera' && booth() && scene !== 'attract' && scene !== 'idle' && now - seenAt > 6000) go('attract');
  if (mode === 'camera' && scene !== 'play') stat.textContent = `骨格 ${pose ? 33 : 0}点　${fps} fps`;
}
function loop(now) { step(now); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
// 動作確認用（ブラウザの開発者ツールから今の状態を見られる）
window.CID_CAM = { get scene() { return scene; }, get G() { return G; }, get game() { return game && game.id; }, go,
  // カメラの代わりに、用意した映像で読み取りを試す
  async useStream(stream) { landmarker = landmarker || await loadModel(); video.srcObject = stream; await video.play(); mode = 'camera'; cam.classList.add('has-video'); P.start.hidden = true; go('attract'); },
  get pose() { return pose; },
  // 時間を進めて1コマずつ動かす（自動の動作確認用）
  run(sec, fps = 30, each) { let t = performance.now(); for (let i = 0; i < sec * fps; i++) { t += 1000 / fps; if (each) each(i); step(t); } return scene; } };
