// 全ページ共通の動き（layout.js が読み込む）
// 1. 各ページのキャッチコピー：ばらばらの文字が集まってそろう。マウスを近づけると文字がよける。押すともう一度ばらける
// 2. マウス・指に沿って走る光の線と、押した場所に散る光
// 3. マウスに付いてくる輪（マウスのときだけ）
// 4. ボタンがマウスに引き寄せられる、写真カードがマウスの方へ傾いて光る
// 5. 見出しが画面に入ると、光の線が走って現れる
// 動きを減らす設定の人には、どれも出さない
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

  function init() {
    catchphrases();
    trail();
    if (FINE) { ring(); magnets(); tilts(); }
    wipes();
  }

  /* ---------- 1. キャッチコピー ---------- */
  function catchphrases() {
    const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
    document.querySelectorAll('.page-hero h1, .page-hero .lead strong').forEach((el, n) => {
      if (el.dataset.fx) return;
      el.dataset.fx = '1';
      el.setAttribute('aria-label', el.textContent.trim());
      const chars = [];
      [...el.childNodes].forEach(node => {
        if (node.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        const words = seg ? [...seg.segment(node.textContent)].map(s => s.segment) : [...node.textContent];
        let prev = null;
        words.forEach(w => {
          // 句読点は前の語にくっつけて、行の頭に来ないようにする
          const punct = /^[、。，．！？!?」』）)ー〜]+$/.test(w) && prev;
          const ws = punct ? prev : document.createElement('span');
          prev = ws;
          ws.className = 'fx-w'; ws.setAttribute('aria-hidden', 'true');
          [...w].forEach(c => {
            const cs = document.createElement('span');
            cs.className = 'fx-c'; cs.textContent = c;
            ws.appendChild(cs); chars.push(cs);
          });
          frag.appendChild(ws);
        });
        node.replaceWith(frag);
      });
      const big = el.tagName === 'H1';
      const scatter = (spread, instant) => chars.forEach(c => {
        c.style.transition = instant ? 'none' : 'transform .45s cubic-bezier(.3,0,.2,1), opacity .3s';
        c.style.transitionDelay = '0s';
        c.style.transform = `translate(${rnd(-spread, spread)}px, ${rnd(-spread * .6, spread * .6)}px) rotate(${rnd(-80, 80)}deg) scale(${rnd(.6, 1.5)})`;
        c.style.opacity = instant ? '0' : '.85';
      });
      const gather = (base) => chars.forEach((c, i) => {
        c.style.transition = 'transform 1.3s cubic-bezier(.16,1,.3,1), opacity .7s ease';
        c.style.transitionDelay = (base + i * (big ? 28 : 12)) + 'ms';
        c.style.transform = ''; c.style.opacity = '';
      });
      const spread = Math.min(innerWidth, 1000) * (big ? .42 : .3);
      scatter(spread, true);
      // rAF ではなく setTimeout：裏のタブで開かれても、見出しが消えたままにならないように
      el.getBoundingClientRect();
      setTimeout(() => gather(big ? 120 : 600), 40);

      // 押すと、もう一度ばらけてそろう
      if (big) {
        el.classList.add('fx-play');
        el.addEventListener('click', () => { scatter(spread * .6, false); setTimeout(() => gather(0), 480); });
      }
      // マウスを近づけると、文字がよける
      if (FINE) {
        const zone = el.closest('.page-hero') || el;
        zone.addEventListener('pointermove', e => {
          chars.forEach(c => {
            const r = c.getBoundingClientRect();
            const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
            const d = Math.hypot(dx, dy), R = big ? 160 : 100;
            if (d > R) { c.style.translate = ''; return; }
            const k = (1 - d / R) * (big ? 34 : 16) / (d || 1);
            c.style.translate = `${(dx * k).toFixed(1)}px ${(dy * k).toFixed(1)}px`;
          });
        });
        zone.addEventListener('pointerleave', () => chars.forEach(c => { c.style.translate = ''; }));
      }
    });
  }

  /* ---------- 2. 光の線 ---------- */
  function trail() {
    const cv = document.createElement('canvas');
    cv.className = 'fx-trail'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let dpr = 1, W = 0, H = 0, running = false;
    const pts = [], sparks = [];
    const LIFE = 420;
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); addEventListener('resize', size);
    const kick = () => { if (!running) { running = true; requestAnimationFrame(draw); } };
    function add(x, y) {
      const last = pts[pts.length - 1];
      if (last && Math.hypot(x - last.x, y - last.y) < 3) return;
      pts.push({ x, y, t: performance.now() }); kick();
    }
    function burst(x, y) {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rnd(-.2, .2), v = rnd(2.5, 7);
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: performance.now(), red: i % 5 === 0 });
      }
      kick();
    }
    addEventListener('pointermove', e => { if (e.pointerType !== 'touch') add(e.clientX, e.clientY); }, { passive: true });
    addEventListener('touchmove', e => { const t = e.touches[0]; if (t) add(t.clientX, t.clientY); }, { passive: true });
    addEventListener('touchstart', e => { const t = e.touches[0]; if (t) { pts.length = 0; add(t.clientX, t.clientY); } }, { passive: true });
    addEventListener('pointerdown', e => burst(e.clientX, e.clientY), { passive: true });

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      if (pts.length > 1) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            const k = 1 - (now - b.t) / LIFE; // 新しいほど1
            if (k <= 0) continue;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            if (pass === 0) {
              ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(120,170,255,.9)';
              ctx.strokeStyle = `rgba(140,185,255,${(k * .55).toFixed(3)})`; ctx.lineWidth = 2 + k * 7;
            } else {
              ctx.shadowBlur = 0;
              ctx.strokeStyle = `rgba(255,255,255,${(k * .95).toFixed(3)})`; ctx.lineWidth = .8 + k * 2.2;
            }
            ctx.stroke();
          }
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i], k = 1 - (now - s.t) / 520;
        if (k <= 0) { sparks.splice(i, 1); continue; }
        const x2 = s.x + s.vx * 3, y2 = s.y + s.vy * 3;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(x2, y2);
        ctx.shadowBlur = 12; ctx.shadowColor = s.red ? 'rgba(223,3,46,.9)' : 'rgba(140,185,255,.9)';
        ctx.strokeStyle = s.red ? `rgba(255,60,90,${k})` : `rgba(255,255,255,${k})`;
        ctx.lineWidth = 1.6 * k + .4; ctx.stroke();
        s.x += s.vx; s.y += s.vy; s.vx *= .9; s.vy *= .9;
      }
      ctx.shadowBlur = 0;
      if (pts.length || sparks.length) requestAnimationFrame(draw);
      else { running = false; ctx.clearRect(0, 0, W, H); }
    }
  }

  /* ---------- 3. マウスに付いてくる輪 ---------- */
  function ring() {
    const r = document.createElement('div');
    r.className = 'fx-ring'; r.setAttribute('aria-hidden', 'true');
    document.body.appendChild(r);
    let x = -100, y = -100, tx = -100, ty = -100, on = false;
    const HOT = 'a, button, [role="tab"], input, select, textarea, label, summary, .fx-play';
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; x = tx; y = ty; r.classList.add('is-on'); }
      r.classList.toggle('is-hot', !!e.target.closest(HOT));
    }, { passive: true });
    document.addEventListener('pointerleave', () => { on = false; r.classList.remove('is-on'); });
    addEventListener('pointerdown', () => { r.classList.add('is-down'); });
    addEventListener('pointerup', () => { r.classList.remove('is-down'); });
    (function loop() {
      x += (tx - x) * .22; y += (ty - y) * .22;
      r.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 4. ボタンを引き寄せる・カードを傾ける ---------- */
  function magnets() {
    document.addEventListener('pointermove', e => {
      const b = e.target.closest('.btn-oc, .btn-ghost, .chip--go, .menu-btn, .btn-white');
      document.querySelectorAll('.fx-mag').forEach(m => { if (m !== b) { m.classList.remove('fx-mag'); m.style.translate = ''; } });
      if (!b) return;
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.classList.add('fx-mag');
      b.style.translate = `${(dx * .22).toFixed(1)}px ${(dy * .35).toFixed(1)}px`;
    }, { passive: true });
  }
  function tilts() {
    const SEL = '.panel, .entry, .dept-card, .news-card figure, .project .work-cover';
    document.addEventListener('pointerover', e => {
      const c = e.target.closest(SEL);
      if (!c || c.dataset.tilt) return;
      c.dataset.tilt = '1';
      c.classList.add('fx-tilt');
      const g = document.createElement('span'); g.className = 'fx-glare'; g.setAttribute('aria-hidden', 'true');
      c.appendChild(g);
      c.addEventListener('pointermove', ev => {
        const r = c.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        c.style.transform = `perspective(900px) rotateX(${((.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - .5) * 9).toFixed(2)}deg) translateZ(0)`;
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }

  /* ---------- 5. 見出しが光の線とともに現れる ---------- */
  function wipes() {
    if (!('IntersectionObserver' in window)) return;
    const hs = document.querySelectorAll('.sec-head h2, .reel-h h2, .cta-band h2');
    // 見出し自体は隠れていて判定できないので、外側の箱が画面に入ったかで判断する
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target); e.target.querySelector('.fx-wipe').classList.add('is-in');
    }), { rootMargin: '0px 0px -12% 0px' });
    hs.forEach(h => {
      // すでに画面に見えている見出しは隠さない
      if (h.getBoundingClientRect().top < innerHeight * .9) return;
      h.classList.add('fx-wipe'); io.observe(h.parentElement);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
