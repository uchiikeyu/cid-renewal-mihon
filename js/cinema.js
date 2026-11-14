// トップページ：見出しの文字の形に写真をくり抜く最初の画面と、9学科の横に流れる写真
// 使う人：index.html だけ。depts-data.js の後に読み込む
(function () {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => 1 - Math.pow(1 - t, 4);
  const $ = id => document.getElementById(id);
  document.body.classList.add('top-page');

  /* ---------- 写真のスライド（学生が写っている写真） ---------- */
  const SHOTS = ['img_jan.jpg', 'img_features5.jpg', 'top_image01f_sp.jpg', 'img_about1.jpg', 'img_features4.jpg', 'img_jul.jpg'];
  const slides = $('cinema-slides');
  SHOTS.forEach((f, i) => { const im = new Image(); im.src = CID.img(f); im.alt = ''; if (i === 0) im.className = 'on'; slides.appendChild(im); });
  let si = 0;
  if (!RM) setInterval(() => {
    const ims = slides.children; ims[si].classList.remove('on');
    si = (si + 1) % ims.length; ims[si].classList.add('on');
  }, 4200);

  /* ---------- 文字のくり抜き ---------- */
  const svg = $('cinema-cover'), pin = $('cinema-pin'), hero = $('cinema');
  const head = document.querySelector('.site-head'), note = document.querySelector('.mihon-note');
  const reveal = $('cinema-reveal'), foot = document.querySelector('.cinema-foot'), scrollHint = document.querySelector('.cinema-scroll');
  let W = 0, H = 0, chars = [], glyphs, outline, shade, lens;
  const st = { lx: 0, ly: 0, tx: 0, ty: 0, r: 0, user: 0, scattered: false, built: 0, p: 0 };
  let anim = { from: 1, to: 0, t0: 0 }; // 1 = ばらばら、0 = そろう

  function build() {
    W = pin.clientWidth; H = pin.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const wide = W / H > 1.05, tall = W / H < .75;
    const lines = wide ? ['未来をツクル', '人になる。'] : tall ? ['未来を', 'ツクル', '人に', 'なる。'] : ['未来を', 'ツクル', '人になる。'];
    const mx = Math.max(16, W * .05);
    const per = wide ? 6 : tall ? 3 : 5;
    const fs = Math.floor(Math.min((W - mx * 2) / per, (H * (wide ? .64 : .66)) / lines.length / 1.06));
    const lh = fs * 1.06, top = (H - lh * lines.length) / 2;
    svg.innerHTML = `<defs>
      <radialGradient id="cinema-lg"><stop offset="55%" stop-color="#000"/><stop offset="100%" stop-color="#fff"/></radialGradient>
      <mask id="cinema-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
        <rect width="${W}" height="${H}" fill="#fff"/><g class="g" fill="#000"></g><circle class="lens" r="0" fill="url(#cinema-lg)"/>
      </mask></defs>
      <rect class="shade" width="${W}" height="${H}" fill="#081330" mask="url(#cinema-cut)"/>
      <g class="o" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1"></g>`;
    glyphs = svg.querySelector('.g'); outline = svg.querySelector('.o'); shade = svg.querySelector('.shade'); lens = svg.querySelector('.lens');
    chars = [];
    lines.forEach((ln, li) => [...ln].forEach((c, ci) => {
      const x = mx + ci * fs * .98, y = top + li * lh + fs * .88;
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('font-size', fs);
      t.setAttribute('font-weight', '900'); t.setAttribute('font-family', '"Zen Kaku Gothic New", sans-serif');
      t.textContent = c;
      const o = t.cloneNode(true);
      glyphs.appendChild(t); outline.appendChild(o);
      chars.push({ t, o, cx: x + fs / 2, cy: y - fs * .4, sx: 0, sy: 0, sr: 0 });
    }));
    scatterTargets(.9);
    st.built = performance.now();
    if (!st.tx) { st.tx = st.lx = W * .68; st.ty = st.ly = H * .5; }
  }
  function scatterTargets(k) { chars.forEach(ch => { ch.sx = (Math.random() - .5) * W * k; ch.sy = (Math.random() - .5) * H * k * .85; ch.sr = (Math.random() - .5) * 110; }); }
  const mixAt = now => anim.from + (anim.to - anim.from) * ease(clamp((now - anim.t0) / 1300, 0, 1));

  const btn = $('cinema-scatter');
  btn.onclick = () => {
    st.scattered = !st.scattered;
    if (st.scattered) scatterTargets(.8);
    const now = performance.now();
    anim = { from: mixAt(now), to: st.scattered ? 1 : 0, t0: now };
    btn.textContent = st.scattered ? '文字をそろえる' : '文字をばらす';
  };

  // なぞった場所に丸い窓があく
  const aim = e => { const r = pin.getBoundingClientRect(); st.tx = e.clientX - r.left; st.ty = e.clientY - r.top; st.user = performance.now(); };
  pin.addEventListener('pointermove', aim);
  pin.addEventListener('pointerdown', aim);

  function frame(now) {
    // 触っていない間は、窓がゆっくり動き回る
    if (now - st.user > 2500) { const t = now / 1000; st.tx = W * (.5 + .32 * Math.sin(t * .45)); st.ty = H * (.5 + .26 * Math.sin(t * .7 + 1)); }
    st.lx += (st.tx - st.lx) * .12; st.ly += (st.ty - st.ly) * .12;
    const p = st.p;
    const target = Math.min(W, H) * (W < 600 ? .3 : .17) * (1 + p * 4);
    st.r += (target - st.r) * .1;
    lens.setAttribute('cx', st.lx.toFixed(1)); lens.setAttribute('cy', st.ly.toFixed(1)); lens.setAttribute('r', Math.max(0, st.r).toFixed(1));

    // 読み込み直後に文字がそろう
    const intro = RM ? 1 : ease(clamp((now - st.built) / 1600, 0, 1));
    const mix = Math.max(1 - intro, mixAt(now));
    chars.forEach((ch, i) => {
      const k = RM ? 0 : clamp(mix * (1 + (i % 4) * .08), 0, 1);
      const tr = `translate(${(ch.sx * k).toFixed(1)} ${(ch.sy * k).toFixed(1)}) rotate(${(ch.sr * k).toFixed(1)} ${ch.cx} ${ch.cy})`;
      ch.t.setAttribute('transform', tr); ch.o.setAttribute('transform', tr);
    });
    // スクロールすると文字が広がり、写真が全面に出る
    const z = 1 + ease(clamp((p - .05) / .7, 0, 1)) * 1.6, ox = W / 2, oy = H / 2;
    const gt = `translate(${ox} ${oy}) scale(${z.toFixed(3)}) translate(${-ox} ${-oy})`;
    glyphs.setAttribute('transform', gt); outline.setAttribute('transform', gt);
    const fade = 1 - clamp((p - .2) / .45, 0, 1);
    shade.setAttribute('opacity', fade.toFixed(3)); outline.setAttribute('opacity', fade.toFixed(3));
    reveal.style.opacity = clamp((p - .55) / .25, 0, 1).toFixed(3);
    foot.style.opacity = (1 - clamp(p / .2, 0, 1)).toFixed(3);
    scrollHint.style.opacity = (1 - clamp(p / .15, 0, 1)).toFixed(3);
    requestAnimationFrame(frame);
  }

  (document.fonts ? document.fonts.load('900 100px "Zen Kaku Gothic New"', '未来をツクル人になる。') : Promise.resolve())
    .catch(() => {}).then(() => { build(); requestAnimationFrame(frame); });

  /* ---------- 9つの学科：PCでは縦スクロールで横に流す ---------- */
  const PH = CID.PEOPLE_PHOTO;
  const track = $('track'), people = $('people'), prog = $('track-prog');
  track.innerHTML = CID.DEPT_ORDER.map(k => { const d = CID.DEPTS[k];
    return `<a class="panel" href="${k}.html" style="--dc:${d.color};--dc-ink:${CID.ink(d.color)}"><img src="${CID.img(PH[k] || d.photos[0])}" alt="" loading="lazy"><div class="c"><span class="y">${d.years}</span><h3>${d.name}</h3><p class="k">${d.catch}</p><span class="go">学科を見る</span></div></a>`; }).join('');
  const wideQ = matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  let span = 0;
  function setupScrub() {
    if (wideQ.matches) {
      people.classList.add('scrub');
      span = Math.max(0, track.scrollWidth - innerWidth);
      people.style.setProperty('--ph', (innerHeight + span) + 'px');
    } else { people.classList.remove('scrub'); track.style.transform = ''; }
    scrub();
  }
  function scrub() {
    if (!people.classList.contains('scrub')) return;
    const r = people.getBoundingClientRect();
    const k = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    track.style.transform = `translate3d(${(-span * k).toFixed(1)}px,0,0)`;
    prog.style.width = (12 + k * 88) + '%';
  }
  track.addEventListener('scroll', () => { const m = track.scrollWidth - track.clientWidth; prog.style.width = (12 + (m ? track.scrollLeft / m : 0) * 88) + '%'; }, { passive: true });
  const step = dir => track.scrollBy({ left: dir * (track.querySelector('.panel').offsetWidth + 16), behavior: 'smooth' });
  $('track-prev').onclick = () => step(-1);
  $('track-next').onclick = () => step(1);
  if (wideQ.addEventListener) wideQ.addEventListener('change', setupScrub);

  function onScroll() {
    const r = hero.getBoundingClientRect();
    st.p = RM ? 0 : clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    head.classList.toggle('is-solid', r.bottom < 90);
    // 見本の帯がスクロールで消えるまでは、その下にヘッダーを置く
    head.style.top = Math.max(0, note.offsetHeight - scrollY) + 'px';
    scrub();
  }
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => {
    if (Math.abs(pin.clientWidth - W) > 40 || Math.abs(pin.clientHeight - H) > 160) build();
    setupScrub(); onScroll();
  }, 200); });
  addEventListener('load', setupScrub);
  addEventListener('scroll', onScroll, { passive: true });
  setupScrub(); onScroll();

  /* ---------- 保護者向けの数字が数えあがる ---------- */
  if (!RM && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, n = +el.dataset.count, t0 = performance.now();
      (function tick(t) { const k = ease(clamp((t - t0) / 1400, 0, 1)); el.textContent = Math.round(n * k); if (k < 1) requestAnimationFrame(tick); })(t0);
    }), { threshold: .6 });
    document.querySelectorAll('[data-count]').forEach(el => { el.textContent = '0'; io.observe(el); });
  }
})();
