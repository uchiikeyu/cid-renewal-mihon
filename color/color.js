// カラー版のトップだけで使う動き。cinema.js・labs.js の後に読み込む
(function () {
  const SPEC = ['#4A5CF0', '#00A0E9', '#22A33A', '#8040C0', '#F05A28', '#FF4C7D', '#F08C1E', '#1A9A8A'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ロゴはカラー版のトップへ戻る
  document.querySelectorAll('.logo').forEach(a => { a.href = 'color/'; });
  const note = document.querySelector('.mihon-note');
  if (note) note.textContent = '学校への提案用の見本（カラー版・トップのみ）です。写真・文章は今のサイトから借りています。';

  // 1. 文字のふちを8色に。文字を組み直したときも塗り直す
  const svg = document.getElementById('cinema-cover');
  const paint = () => svg.querySelectorAll('.o text').forEach((t, i) => {
    t.setAttribute('stroke', SPEC[i % 8]); t.setAttribute('stroke-width', '2');
  });
  new MutationObserver(paint).observe(svg, { childList: true });
  paint();

  // 文字の中の色は、スクロールで写真が全面に出るのに合わせて消える
  const hero = document.getElementById('cinema'), tint = document.getElementById('cinema-tint');
  // 丸い窓の位置を色の層に伝える（窓の中は本当の色）
  (function follow() {
    const c = svg.querySelector('.lens');
    if (c) { tint.style.setProperty('--lx', c.getAttribute('cx') + 'px'); tint.style.setProperty('--ly', c.getAttribute('cy') + 'px'); tint.style.setProperty('--lr', c.getAttribute('r') + 'px'); }
    requestAnimationFrame(follow);
  })();

  // 2. 8学科：画面の真ん中にある学科の色で、背景が染まる
  const reel = document.getElementById('people'), track = document.getElementById('track');
  let last = null;
  function onScroll() {
    const r = hero.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
    tint.style.opacity = (.9 * (1 - clamp((p - .2) / .45, 0, 1))).toFixed(3);
    const rr = reel.getBoundingClientRect();
    if (rr.top < innerHeight && rr.bottom > 0) {
      const mid = innerWidth / 2;
      let best = null, bd = 1e9;
      track.querySelectorAll('.panel').forEach(pn => {
        const b = pn.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid);
        if (d < bd) { bd = d; best = pn; }
      });
      if (best && best !== last) {
        if (last) last.classList.remove('is-center');
        // マウスがない端末では、真ん中の学科だけ本当の色の写真に戻す
        if (!matchMedia('(hover: hover)').matches) best.classList.add('is-center');
        reel.style.setProperty('--reel-c', best.style.getPropertyValue('--dc'));
        last = best;
      }
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // 3. ミニ体験：選んだ学科の色を、場面全体に
  const lab = document.getElementById('lab'), stage = document.getElementById('lab-stage');
  const syncLab = () => { const c = stage.style.getPropertyValue('--lc'); if (c) lab.style.setProperty('--lab-c', c); };
  new MutationObserver(syncLab).observe(stage, { attributes: true, attributeFilter: ['style'] });
  syncLab();
})();
