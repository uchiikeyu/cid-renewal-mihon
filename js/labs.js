// 学科ひと口体験（トップ）と、学科ページでも使う部品
window.CID = window.CID || {};

// ---- パスワードが破られるまでの時間（目安） ----
// 1秒に100億回試せる攻撃者を想定した、総当たりの単純な見積もり
CID.pwEstimate = function (pw) {
  const common = ['password', 'password1', '123456', '12345678', '123456789', 'qwerty', 'abc123', '111111',
    'iloveyou', 'admin', 'letmein', '1234', '0000', '000000', 'pass', 'test'];
  const checks = {
    len: pw.length >= 12,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw)
  };
  if (!pw) return { sec: 0, label: '', score: 0, checks };
  let cs = 0;
  if (checks.lower) cs += 26;
  if (checks.upper) cs += 26;
  if (checks.digit) cs += 10;
  if (/[!-/:-@[-`{-~ ]/.test(pw)) cs += 33;
  if (/[^\x00-\x7F]/.test(pw)) cs += 100;
  let sec = Math.pow(cs, pw.length) / 2 / 1e10;
  let why = '';
  if (common.includes(pw.toLowerCase()) || /^(.)\1+$/.test(pw)) { sec = 0; why = 'よく使われるパスワードの一覧に入っています。'; }
  // 「単語＋数字」の形は、辞書を使った攻撃で先に試される
  else if (/^[A-Za-z]{2,12}[0-9]{1,4}$/.test(pw) && sec > 5) { sec = 5; why = '「単語＋数字」の形は、辞書を使った攻撃で真っ先に試されます。'; }
  const score = sec <= 1 ? 2 : Math.min(100, Math.log10(sec) / 12 * 100);
  return { sec, label: CID.formatSec(sec), score, checks, why };
};
CID.formatSec = function (s) {
  if (s < 1) return '一瞬（1秒未満）';
  if (s < 60) return `約${Math.round(s)}秒`;
  if (s < 3600) return `約${Math.round(s / 60)}分`;
  if (s < 86400) return `約${Math.round(s / 3600)}時間`;
  const y = s / 31536000;
  if (y < 1) return `約${Math.round(s / 86400)}日`;
  if (y < 1e4) return `約${Math.round(y).toLocaleString()}年`;
  if (y < 1e8) return `約${Math.round(y / 1e4).toLocaleString()}万年`;
  return '1億年以上';
};

(function () {
  const tabs = document.getElementById('lab-tabs');
  const stage = document.getElementById('lab-stage');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h = (tag, attrs = {}, html = '') => {
    const e = document.createElement(tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (html) e.innerHTML = html;
    return e;
  };
  let cleanup = null;

  const DEPTS = [
    {
      name: '高度ICTデザイン学科', yrs: '4年制', short: 'AI・XR・ロボット・ゲームなど10専攻',
      q: 'ドローンをゴールまで飛ばす命令を並べよう',
      sub: '矢印で命令を並べて「飛ばす」。しま模様の壁にぶつかると止まります。',
      after: '<b>ロボット・ドローン専攻</b>では、こうした命令を実際の機体に書き込んで飛ばします。',
      play: playDrone
    },
    {
      name: '情報システム学科', yrs: '2年制', short: 'AI・ネットワーク・デジタルテクノロジー',
      q: 'そのパスワード、何秒で破られる？',
      sub: 'いつも使っている形に似たパスワードを入れてみてください（本物は入れないでください）。',
      after: '<b>ネットワークセキュリティ専攻</b>では、守る側の技術をLinuxや実機で学びます。',
      play: playPassword
    },
    {
      name: 'アグリ・フードテック学科', yrs: '2年制・2026年新設', short: '農業・食品とITをかけ合わせる',
      q: 'トマトがよく育つ環境を探そう',
      sub: '温度・水・光を決めて、1週間ずつ時間を進めます。',
      after: '畑にセンサーを置けば、温度や水分を<b>数字で見て判断</b>できます。勘に頼らない農業と食品づくりを学ぶ学科です。',
      play: playPlant
    },
    {
      name: 'ゲームクリエイター学科', yrs: '3年制・2026年新設', short: 'プログラム・グラフィック・ディレクション',
      q: '当たり判定の大きさを変えて、弾を撃ってみよう',
      sub: '赤い点線が「当たり判定」です。見た目と同じ大きさで、本当にいいでしょうか。',
      after: '多くのゲームは当たり判定を見た目より少し小さくして、遊ぶ人が<b>理不尽だと感じない</b>ように作られています。',
      play: playHitbox
    },
    {
      name: 'クリエイティブデザイン学科', yrs: '2年制', short: 'グラフィック・Web・プロダクト',
      q: '読みやすいポスターの色を選ぼう',
      sub: '背景と文字の色を組み合わせると、読みやすさを数字で判定します。',
      after: '色の組み合わせには<b>読みやすさの基準</b>があります。感覚だけでなく、根拠を持って色を決める力を学びます。',
      play: playPoster
    },
    {
      name: 'ポップカルチャー学科', yrs: '2年制', short: 'アニメ・3DCG・マンガ・イラスト',
      q: '12×12マスで、キャラクターの顔を描こう',
      sub: '色を選んでマスをなぞります。右の小さな絵が、実際の大きさです。',
      after: '少ないマスで「誰だか分かる」形を探すのは、<b>キャラクターデザインの基本</b>です。',
      play: playPixel
    },
    {
      name: 'ネット動画クリエイター学科', yrs: '2年制', short: '配信・Webマーケティング・動画制作',
      q: 'スマホの一覧で目に入るサムネイルを作ろう',
      sub: '文字の大きさ・位置・縁取りを変えると、右の一覧での見え方が変わります。',
      after: '再生数はサムネイルで大きく変わります。<b>見てもらうための設計</b>を、数字を見ながら学びます。',
      play: playThumb
    },
    {
      name: '電気通信学科', yrs: '1・2年制', short: '電気工事士・電気主任技術者',
      q: '片方のスイッチだけで、電球が点く配線は？',
      sub: '配線のしかたを選んで、スイッチを押してみてください。',
      after: '配線のしくみは、<b>第二種電気工事士</b>の試験でも問われる基本です。実技で本物の配線もします。',
      play: playCircuit
    }
  ];

  const SLUGS = ['ict-design', 'information-system', 'agri-foodtech', 'game-creator', 'creative-design', 'pop-culture', 'internet-video-creator', 'electro-communications'];
  DEPTS.forEach((d, k) => { d.slug = SLUGS[k]; });
  CID.LAB = DEPTS;
  CID.plays = { drone: playDrone, password: playPassword, plant: playPlant, hitbox: playHitbox, poster: playPoster, pixel: playPixel, thumb: playThumb, circuit: playCircuit };

  if (tabs && stage) {
    // 8学科を写真タイルで並べる。選んだ学科だけ色が付き、学科の色で光る
    const info = k => (window.CID.DEPTS && CID.DEPTS[DEPTS[k].slug]) || {};
    const photo = k => CID.img ? CID.img((CID.PEOPLE_PHOTO || {})[DEPTS[k].slug] || (info(k).photos || [])[0]) : '';
    DEPTS.forEach((d, i) => {
      const b = h('button', { role: 'tab', class: 'lab-tab', id: 'labtab-' + i, 'aria-selected': 'false', tabindex: '-1', 'aria-controls': 'lab-stage', style: `--lc:${info(i).color || '#DF032E'}` },
        `<img src="${photo(i)}" alt="" loading="lazy"><span><b>${d.name}</b><small>${d.yrs}</small></span>`);
      b.addEventListener('click', () => select(i));
      tabs.appendChild(b);
    });
    tabs.addEventListener('keydown', e => {
      const list = [...tabs.children];
      const cur = list.findIndex(t => t.getAttribute('aria-selected') === 'true');
      let n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (cur + 1) % list.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (cur - 1 + list.length) % list.length;
      if (n !== null) { e.preventDefault(); select(n); list[n].focus(); }
    });

    let current = -1, busy = false;
    function render(i) {
      if (cleanup) { cleanup(); cleanup = null; }
      const d = DEPTS[i];
      stage.style.setProperty('--lc', info(i).color || '#DF032E');
      stage.setAttribute('aria-labelledby', 'labtab-' + i);
      stage.innerHTML = `
        <div class="lab-info">
          <img class="lab-photo" src="${photo(i)}" alt="">
          <div class="lab-info-in">
            <p class="lab-dept">${d.name}<small>${d.yrs}　${d.short}</small></p>
            <h3 class="lab-q">${d.q}</h3>
            <p class="lab-sub">${d.sub}</p>
          </div>
        </div>
        <div class="lab-main"><div class="lab-play"></div><p class="lab-result" aria-live="polite"></p></div>
        <div class="lab-after"><p>${d.after}</p><div class="links"><a class="btn-ghost" href="${d.slug}.html">${d.name}を見る</a><a class="btn-oc" href="open-campus.html">体験授業を予約する</a></div></div>
        <div class="lab-wipe" aria-hidden="true"></div>`;
      cleanup = d.play(stage.querySelector('.lab-play'), stage.querySelector('.lab-result')) || null;
    }
    function select(i) {
      if (i === current || busy) return;
      [...tabs.children].forEach((t, k) => {
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.tabIndex = k === i ? 0 : -1;
      });
      const first = current < 0;
      current = i;
      if (first || reduce || !stage.animate) { render(i); return; }
      // 学科の色が横切ってから、次の体験に切り替わる
      busy = true;
      const wipe = stage.querySelector('.lab-wipe');
      wipe.style.background = info(i).color || '#DF032E';
      const ease = 'cubic-bezier(.7,0,.25,1)';
      wipe.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 320, easing: ease, fill: 'forwards' }).onfinish = () => {
        render(i);
        const w2 = stage.querySelector('.lab-wipe');
        w2.style.background = info(i).color || '#DF032E';
        w2.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 0 100%)' }], { duration: 420, easing: ease, fill: 'forwards' }).onfinish = () => { busy = false; };
        stage.querySelectorAll('.lab-photo, .lab-info-in > *').forEach((el, k) => el.animate(
          [{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }],
          { duration: 700, delay: 160 + k * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
      };
    }
    select(0);
  }

  // ---------- 高度ICT：ドローン ----------
  function playDrone(root, out) {
    const W = new Set(['0,2', '1,2', '3,1', '3,3', '4,2', '1,0']);
    const start = [0, 4], goal = [4, 0];
    let cmds = [], running = false;
    root.innerHTML = `<div class="split"><div class="drone-grid"></div><div style="display:flex;flex-direction:column;gap:12px">
      <div class="ctl-row" aria-label="命令を追加">
        <button class="chip" data-d="0,-1">↑ 上へ</button><button class="chip" data-d="0,1">↓ 下へ</button>
        <button class="chip" data-d="-1,0">← 左へ</button><button class="chip" data-d="1,0">→ 右へ</button></div>
      <div class="cmd-list" aria-label="並べた命令"></div>
      <div class="ctl-row"><button class="chip chip--go" data-run>飛ばす</button><button class="chip" data-undo>1つ消す</button><button class="chip" data-clear>全部消す</button></div>
      <p class="note">命令は12個まで。左下がスタート、赤い枠がゴールです。</p></div></div>`;
    const grid = root.querySelector('.drone-grid');
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      grid.appendChild(h('div', { class: 'cell' + (W.has(c + ',' + r) ? ' wall' : '') + (c === goal[0] && r === goal[1] ? ' goal' : '') }));
    }
    const drone = h('div', { class: 'drone' }, '<svg viewBox="0 0 40 40" aria-hidden="true"><g stroke="#fff" stroke-width="3"><line x1="8" y1="8" x2="32" y2="32"/><line x1="32" y1="8" x2="8" y2="32"/></g><g fill="#DF032E"><circle cx="8" cy="8" r="6"/><circle cx="32" cy="8" r="6"/><circle cx="8" cy="32" r="6"/><circle cx="32" cy="32" r="6"/></g><circle cx="20" cy="20" r="6" fill="#fff"/></svg>');
    grid.appendChild(drone);
    const list = root.querySelector('.cmd-list');
    const pos = p => { drone.style.transform = `translate(${p[0] * 100}%, ${p[1] * 100}%)`; };
    pos(start);
    const arrow = { '0,-1': '↑', '0,1': '↓', '-1,0': '←', '1,0': '→' };
    const draw = () => { list.innerHTML = cmds.map(c => `<span>${arrow[c]}</span>`).join('') || '<span style="background:none;opacity:.6">ここに命令が並びます</span>'; };
    draw();
    root.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (!running && cmds.length < 12) { cmds.push(b.dataset.d); draw(); } });
    root.querySelector('[data-undo]').onclick = () => { if (!running) { cmds.pop(); draw(); } };
    root.querySelector('[data-clear]').onclick = () => { if (!running) { cmds = []; draw(); pos(start); out.textContent = ''; } };
    root.querySelector('[data-run]').onclick = async () => {
      if (running || !cmds.length) return;
      running = true; out.textContent = '';
      let p = [...start]; pos(p);
      const spans = list.querySelectorAll('span');
      for (let i = 0; i < cmds.length; i++) {
        await wait(reduce ? 60 : 380);
        spans.forEach((s, k) => s.classList.toggle('on', k === i));
        const [dx, dy] = cmds[i].split(',').map(Number);
        const n = [p[0] + dx, p[1] + dy];
        if (n[0] < 0 || n[0] > 4 || n[1] < 0 || n[1] > 4 || W.has(n.join(','))) {
          out.textContent = `${i + 1}個目の命令でぶつかりました。並べ方を直してみましょう。`;
          running = false; return;
        }
        p = n; pos(p);
        if (p[0] === goal[0] && p[1] === goal[1]) {
          await wait(300);
          out.textContent = `ゴール！ ${i + 1}個の命令で到着しました。` + (i + 1 > 8 ? 'もっと少ない命令でも行けます。' : 'いちばん短い道です。');
          running = false; return;
        }
      }
      out.textContent = '命令が終わっても、まだゴールに着いていません。';
      running = false;
    };
  }

  // ---------- 情報システム：パスワード ----------
  function playPassword(root, out) {
    root.innerHTML = `<label class="visually-hidden" for="lab-pw">パスワードを入れる</label>
      <input class="field" id="lab-pw" type="text" autocomplete="off" spellcheck="false" placeholder="例：sakura2008">
      <div class="meter" aria-hidden="true"><i></i></div>
      <p class="note">入れた文字はこのページの中で計算するだけで、どこにも送られません。1秒に100億回試せる攻撃を想定した目安です。</p>`;
    const inp = root.querySelector('input'), bar = root.querySelector('.meter i');
    const upd = () => {
      const r = CID.pwEstimate(inp.value);
      bar.style.width = r.score + '%';
      bar.style.backgroundColor = r.score < 40 ? '#DF032E' : r.score < 75 ? '#F7B733' : '#3CCB7F';
      out.textContent = inp.value ? `破られるまで：${r.label}　${r.why}` : '';
    };
    inp.addEventListener('input', upd);
  }

  // ---------- アグリ：トマトを育てる ----------
  function playPlant(root, out) {
    let day = 0, grow = 0;
    root.innerHTML = `<div class="plant-box"><svg class="plant-svg" viewBox="0 0 200 220" aria-label="トマトの苗"></svg>
      <div style="display:flex;flex-direction:column;gap:10px">
        <label class="slider">温度<input type="range" min="0" max="40" value="12" data-k="t"><output></output></label>
        <label class="slider">水やり<input type="range" min="0" max="100" value="20" data-k="w"><output></output></label>
        <label class="slider">日当たり<input type="range" min="0" max="100" value="30" data-k="l"><output></output></label>
        <div class="ctl-row"><button class="chip chip--go" data-next>1週間すすめる</button><button class="chip" data-reset>植え直す</button></div>
        <p class="note" data-day>0日目</p></div></div>`;
    const svg = root.querySelector('svg');
    const val = k => +root.querySelector(`[data-k="${k}"]`).value;
    const units = { t: '℃', w: '%', l: '%' };
    const factors = () => {
      const g = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
      return { t: g(val('t'), 24, 6), w: g(val('w'), 65, 18), l: Math.min(1, val('l') / 80) };
    };
    const score = () => { const f = factors(); return f.t * f.w * f.l; };
    function draw() {
      const s = score();
      const leaf = `hsl(${60 + s * 70}, ${45 + s * 20}%, ${42 + s * 6}%)`;
      const H = 20 + grow * 150;
      let g = `<rect x="40" y="196" width="120" height="20" rx="4" fill="#5A3A22"/><path d="M100 196 V ${196 - H}" stroke="${leaf}" stroke-width="6" stroke-linecap="round"/>`;
      const n = Math.floor(grow * 6) + 1;
      for (let i = 0; i < n; i++) {
        const y = 190 - (i + 1) * H / (n + 1), side = i % 2 ? 1 : -1;
        g += `<ellipse cx="${100 + side * 22}" cy="${y}" rx="20" ry="9" fill="${leaf}" transform="rotate(${side * -25} ${100 + side * 22} ${y})"/>`;
      }
      if (grow > 0.65) {
        const k = Math.round((grow - 0.6) * 10);
        for (let i = 0; i < k; i++) g += `<circle cx="${100 + (i % 2 ? 16 : -16)}" cy="${196 - H * 0.45 - i * 18}" r="11" fill="#E53935"/>`;
      }
      svg.innerHTML = g;
      root.querySelectorAll('.slider').forEach(l => { const i = l.querySelector('input'); l.querySelector('output').textContent = i.value + units[i.dataset.k]; });
      root.querySelector('[data-day]').textContent = day + '日目';
    }
    root.querySelectorAll('input').forEach(i => i.addEventListener('input', draw));
    root.querySelector('[data-next]').onclick = () => {
      if (day >= 70) { out.textContent = '収穫の時期です。植え直して、別の条件も試してみましょう。'; return; }
      day += 7;
      const s = score();
      grow = Math.min(1, grow + s * 0.14);
      const f = factors();
      const worst = Object.entries(f).sort((a, b) => a[1] - b[1])[0][0];
      const hints = {
        t: val('t') < 24 ? '寒すぎて、なかなか伸びません。' : '暑すぎて、ぐったりしています。',
        w: val('w') < 65 ? '水が足りず、葉が黄色くなってきました。' : '水が多すぎて、根が弱っています。',
        l: '光が足りず、ひょろひょろです。'
      };
      out.textContent = s > 0.7 ? (grow > 0.65 ? '実がつきました！ いい環境です。' : 'すくすく育っています。') : hints[worst];
      draw();
    };
    root.querySelector('[data-reset]').onclick = () => { day = 0; grow = 0; out.textContent = ''; draw(); };
    draw();
  }

  // ---------- ゲーム：当たり判定 ----------
  function playHitbox(root, out) {
    root.innerHTML = `<canvas class="hit-canvas" width="560" height="280" aria-label="キャラクターと弾"></canvas>
      <label class="slider">当たり判定<input type="range" min="50" max="130" value="100"><output></output></label>
      <div class="ctl-row"><button class="chip chip--go">弾を撃つ</button></div>`;
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
    const sl = root.querySelector('input'), o = root.querySelector('output');
    const G = 230, CX = 200, SW = 60, SH = 80, BY = G - SH - 6, R = 8;
    let bx = null, hit = false, raf = 0;
    function draw() {
      const s = sl.value / 100;
      o.textContent = sl.value + '%';
      ctx.clearRect(0, 0, 560, 280);
      ctx.fillStyle = '#163061'; ctx.fillRect(0, G, 560, 50);
      // キャラクター
      ctx.fillStyle = hit ? '#FF5C78' : '#8FB4E8';
      ctx.beginPath(); ctx.roundRect(CX - SW / 2, G - SH, SW, SH, 22); ctx.fill();
      ctx.fillStyle = '#0A1B3D'; ctx.fillRect(CX - 14, G - SH + 24, 8, 12); ctx.fillRect(CX + 6, G - SH + 24, 8, 12);
      // 当たり判定
      const hw = SW * s, hh = SH * s;
      ctx.setLineDash([6, 5]); ctx.strokeStyle = '#DF032E'; ctx.lineWidth = 2;
      ctx.strokeRect(CX - hw / 2, G - hh, hw, hh); ctx.setLineDash([]);
      if (bx !== null) { ctx.fillStyle = '#FFD34D'; ctx.beginPath(); ctx.arc(bx, BY, R, 0, 7); ctx.fill(); }
    }
    function fire() {
      cancelAnimationFrame(raf);
      bx = 580; hit = false; out.textContent = '';
      const s = sl.value / 100, hw = SW * s, hh = SH * s;
      const step = () => {
        bx -= reduce ? 40 : 7;
        if (!hit && bx - R < CX + hw / 2 && bx + R > CX - hw / 2 && BY + R > G - hh) {
          hit = true;
          out.textContent = s >= 1 ? '当たった！ 見た目はかすっただけなのに…これは悔しい。' : '当たった！ 当たり判定がかなり大きいようです。';
        }
        draw();
        if (bx > -20) raf = requestAnimationFrame(step);
        else { bx = null; draw(); if (!hit) out.textContent = 'ギリギリよけた！ 遊ぶ人は「うまくよけた」と感じます。'; }
      };
      step();
    }
    sl.addEventListener('input', () => { hit = false; draw(); });
    root.querySelector('.chip--go').onclick = fire;
    draw();
    return () => cancelAnimationFrame(raf);
  }

  // ---------- デザイン：ポスターの配色 ----------
  function playPoster(root, out) {
    const C = [['紺', '#0A1B3D'], ['白', '#FFFFFF'], ['黄', '#F7D14C'], ['赤', '#DF032E'], ['水色', '#8FB4E8'], ['緑', '#2E7D5B']];
    let bg = '#F7D14C', fg = '#FFFFFF';
    root.innerHTML = `<div class="poster-wrap"><div class="poster"><b>オープン<br>キャンパス</b><small>12月12日（土）10:00〜12:30<br>中央情報大学校</small></div>
      <div class="poster-ctl"><div><p class="note">背景の色</p><div class="palette" data-g="bg"></div></div>
      <div><p class="note">文字の色</p><div class="palette" data-g="fg"></div></div>
      <div class="meter" aria-hidden="true"><i></i></div></div></div>`;
    const poster = root.querySelector('.poster'), bar = root.querySelector('.meter i');
    ['bg', 'fg'].forEach(g => {
      const pal = root.querySelector(`[data-g="${g}"]`);
      C.forEach(([n, c]) => {
        const b = h('button', { class: 'swatch', style: `background:${c}`, 'aria-label': n, 'aria-pressed': 'false' });
        b.onclick = () => { if (g === 'bg') bg = c; else fg = c; upd(); };
        pal.appendChild(b);
      });
    });
    const lum = hex => {
      const v = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    function upd() {
      poster.style.background = bg; poster.style.color = fg;
      root.querySelectorAll('[data-g]').forEach(p => p.querySelectorAll('.swatch').forEach((s, i) =>
        s.setAttribute('aria-pressed', String(C[i][1] === (p.dataset.g === 'bg' ? bg : fg)))));
      const [a, b] = [lum(bg), lum(fg)].sort((x, y) => y - x);
      const r = (a + 0.05) / (b + 0.05);
      bar.style.width = Math.min(100, r / 12 * 100) + '%';
      bar.style.backgroundColor = r >= 4.5 ? '#3CCB7F' : r >= 3 ? '#F7B733' : '#DF032E';
      const v = bg === fg ? '同じ色です。文字が消えてしまいました。'
        : r >= 7 ? 'とても読みやすい組み合わせです。' : r >= 4.5 ? '読みやすい組み合わせです。'
          : r >= 3 ? '大きな文字ならなんとか読めます。' : '遠くからは読みにくい組み合わせです。';
      out.textContent = `コントラスト比 ${r.toFixed(1)}：${v}`;
    }
    upd();
  }

  // ---------- ポップカルチャー：ドット絵 ----------
  function playPixel(root, out) {
    const P = ['#FFFFFF', '#F2C6A0', '#3B2A20', '#DF032E', '#5AA0FF', '#0A1B3D'];
    const N = 12;
    let color = P[2], down = false, cells = Array(N * N).fill(P[5]);
    root.innerHTML = `<div class="pixel-wrap"><div class="pixel-grid" aria-label="12×12のマス"></div>
      <div style="display:flex;flex-direction:column;gap:14px"><div class="palette"></div>
      <div class="ctl-row"><button class="chip" data-sample>お手本を出す</button><button class="chip" data-clear>全部消す</button></div>
      <div><p class="note">実際の大きさ</p><canvas class="pixel-mini" width="12" height="12"></canvas></div></div></div>`;
    const grid = root.querySelector('.pixel-grid'), mini = root.querySelector('canvas').getContext('2d');
    const els = cells.map((c, i) => { const e = h('i', { 'data-i': i }); grid.appendChild(e); return e; });
    const pal = root.querySelector('.palette');
    P.forEach((c, i) => {
      const b = h('button', { class: 'swatch', style: `background:${c}`, 'aria-label': i === 5 ? '消しゴム' : '色' + (i + 1), 'aria-pressed': String(c === color) });
      b.onclick = () => { color = c; pal.querySelectorAll('.swatch').forEach(s => s.setAttribute('aria-pressed', String(s === b))); };
      pal.appendChild(b);
    });
    const render = () => {
      els.forEach((e, i) => e.style.background = cells[i]);
      cells.forEach((c, i) => { mini.fillStyle = c; mini.fillRect(i % N, Math.floor(i / N), 1, 1); });
      const used = cells.filter(c => c !== P[5]).length;
      out.textContent = used ? `${used}マス使いました。少ないマスで表情を出せるか試してみましょう。` : '';
    };
    const paint = e => {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      if (t && t.parentNode === grid) { cells[+t.dataset.i] = color; render(); }
    };
    grid.addEventListener('pointerdown', e => { down = true; grid.setPointerCapture(e.pointerId); paint(e); });
    grid.addEventListener('pointermove', e => { if (down) paint(e); });
    grid.addEventListener('pointerup', () => down = false);
    grid.addEventListener('pointercancel', () => down = false);
    root.querySelector('[data-clear]').onclick = () => { cells.fill(P[5]); render(); };
    root.querySelector('[data-sample]').onclick = () => {
      const m = [
        '....2222....', '..22222222..', '.2222222222.', '.2111111112.', '.1111111111.', '.1121111211.',
        '.1121111211.', '.1111111111.', '.1311111131.', '..11133111..', '...111111...', '....0000....'];
      m.forEach((row, y) => [...row].forEach((ch, x) => { cells[y * N + x] = ch === '.' ? P[5] : P[+ch]; }));
      render();
    };
    render();
  }

  // ---------- ネット動画：サムネイル ----------
  function playThumb(root, out) {
    let size = 9, posi = 'bottom', edge = false, long = true;
    root.innerHTML = `<div class="thumb-wrap"><div class="thumb"><p class="thumb-title"></p></div>
      <div class="thumb-feed" aria-label="スマホの一覧での見え方"></div></div>
      <label class="slider">文字の大きさ<input type="range" min="6" max="20" value="9"><output></output></label>
      <div class="ctl-row" role="group" aria-label="文字の位置"><button class="chip" data-p="top">上</button><button class="chip" data-p="center">中央</button><button class="chip" data-p="bottom">下</button>
      <button class="chip" data-edge aria-pressed="false">縁取り</button><button class="chip" data-long aria-pressed="false">短いタイトルにする</button></div>
      <div class="meter" aria-hidden="true"><i></i></div>`;
    const t = root.querySelector('.thumb'), title = t.querySelector('.thumb-title'), feed = root.querySelector('.thumb-feed');
    const sl = root.querySelector('input'), bar = root.querySelector('.meter i');
    function upd() {
      const txt = long ? '専門学校の1日に密着してみたら想像以上に忙しかった件について' : '専門学生の1日';
      title.textContent = txt;
      title.style.fontSize = (size / 100 * t.clientWidth || 30) + 'px';
      title.style.top = posi === 'top' ? '6%' : posi === 'center' ? '50%' : 'auto';
      title.style.bottom = posi === 'bottom' ? '6%' : 'auto';
      title.style.transform = posi === 'center' ? 'translateY(-50%)' : 'none';
      title.style.webkitTextStroke = edge ? '0' : '';
      title.style.textShadow = edge ? '0 0 4px #000, 0 0 4px #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' : 'none';
      root.querySelector('output').textContent = size;
      root.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === posi)));
      root.querySelector('[data-edge]').setAttribute('aria-pressed', String(edge));
      root.querySelector('[data-long]').setAttribute('aria-pressed', String(!long));
      // 一覧での見え方（自分のサムネを小さく）
      feed.innerHTML = '';
      [0, 1, 2].forEach(k => {
        const row = h('div', { class: 'row' });
        const m = h('div', { class: 'mini' });
        if (k === 1) {
          const c = t.cloneNode(true);
          c.style.width = '360px'; c.style.transform = `scale(${96 / 360})`; c.style.transformOrigin = '0 0'; c.style.position = 'absolute';
          m.appendChild(c);
          row.append(m, Object.assign(document.createElement('span'), { textContent: 'あなたの動画' }));
        } else row.append(m, Object.assign(document.createElement('span'), { textContent: 'ほかの動画' }));
        feed.appendChild(row);
      });
      const s = Math.min(1, size / 16) * 50 + (edge ? 25 : 0) + (long ? 0 : 25) - (posi === 'bottom' ? 8 : 0);
      bar.style.width = Math.max(5, s) + '%';
      bar.style.backgroundColor = s >= 75 ? '#3CCB7F' : s >= 45 ? '#F7B733' : '#DF032E';
      out.textContent = s >= 75 ? '小さな一覧でも、ひと目で内容が分かります。'
        : long ? 'タイトルが長くて、小さい画面では読み切れません。' : !edge ? '背景に文字がまぎれています。縁取りを試してみましょう。' : 'もう少し文字を大きくできそうです。';
    }
    sl.addEventListener('input', () => { size = +sl.value; upd(); });
    root.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { posi = b.dataset.p; upd(); });
    root.querySelector('[data-edge]').onclick = () => { edge = !edge; upd(); };
    root.querySelector('[data-long]').onclick = () => { long = !long; upd(); };
    upd();
    const ro = new ResizeObserver(upd); ro.observe(t);
    return () => ro.disconnect();
  }

  // ---------- 電気通信：回路 ----------
  function playCircuit(root, out) {
    let mode = 'series', a = false, b = false;
    root.innerHTML = `<div class="ctl-row" role="group" aria-label="配線のしかた"><button class="chip" data-m="series">直列につなぐ</button><button class="chip" data-m="parallel">並列につなぐ</button></div>
      <svg class="circuit" viewBox="0 0 480 240" role="img" aria-label="電池・スイッチ2つ・電球の回路"></svg>
      <p class="note">スイッチ（白い棒）を押すと、入れたり切ったりできます。</p>`;
    const svg = root.querySelector('svg');
    const sw = (id, x, y, on) => `<g class="sw" tabindex="0" role="button" aria-label="スイッチ${id === 'a' ? 'A' : 'B'}（${on ? '入' : '切'}）" data-sw="${id}">
      <rect x="${x - 6}" y="${y - 34}" width="72" height="48" fill="transparent" stroke="transparent" rx="6"/>
      <circle cx="${x}" cy="${y}" r="5" fill="#fff"/><circle cx="${x + 60}" cy="${y}" r="5" fill="#fff"/>
      <line x1="${x}" y1="${y}" x2="${x + 60}" y2="${on ? y : y - 26}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <text x="${x + 30}" y="${y + 26}" fill="#8FB4E8" font-size="14" text-anchor="middle">${id === 'a' ? 'A' : 'B'}</text></g>`;
    function draw() {
      const lit = mode === 'series' ? a && b : a || b;
      const L = lit ? ' live' : '';
      let wires;
      if (mode === 'series') {
        wires = `<path class="wire${L}" d="M40 80 V40 H140 M200 40 H260 M320 40 H440 V100 M440 140 V200 H40 V160"/>` + sw('a', 140, 40, a) + sw('b', 260, 40, b);
      } else {
        wires = `<path class="wire${L}" d="M40 80 V40 H180 M240 40 H360 M100 40 V120 H180 M240 120 H360 V40 M360 40 H440 V100 M440 140 V200 H40 V160"/>` + sw('a', 180, 40, a) + sw('b', 180, 120, b);
      }
      svg.innerHTML = wires +
        `<line x1="22" y1="80" x2="58" y2="80" stroke="#fff" stroke-width="4"/><line x1="30" y1="160" x2="50" y2="160" stroke="#fff" stroke-width="8"/>
         <line x1="40" y1="80" x2="40" y2="160" stroke="transparent"/><text x="64" y="125" fill="#8FB4E8" font-size="14">電池</text>
         ${lit ? '<circle cx="440" cy="120" r="40" fill="rgba(255,211,77,.25)"/>' : ''}
         <circle cx="440" cy="120" r="20" fill="${lit ? '#FFD34D' : 'transparent'}" stroke="#fff" stroke-width="3"/>
         <path d="M428 128 L436 112 L444 128 L452 112" stroke="${lit ? '#7A5A00' : '#8FB4E8'}" stroke-width="2" fill="none"/>`;
      svg.querySelectorAll('.sw').forEach(g => {
        const t = () => { if (g.dataset.sw === 'a') a = !a; else b = !b; draw(); svg.querySelector(`[data-sw="${g.dataset.sw}"]`).focus(); };
        g.addEventListener('click', t);
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
      });
      root.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.m === mode)));
      const one = a !== b;
      out.textContent = mode === 'parallel' && one && lit ? '正解！ 並列なら、どちらか片方のスイッチで電球が点きます。'
        : mode === 'series' && one ? '直列だと、両方入れないと点きません。'
          : lit ? '点きました。片方だけでも点くか試してみましょう。' : '';
    }
    root.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { mode = x.dataset.m; a = b = false; draw(); });
    draw();
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
})();
