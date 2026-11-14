// カラー版だけで使う動き。各ページの最後に読み込む（build_color.py が差し込む）
(function () {
  const SPEC = ['#4A5CF0', '#00A0E9', '#22A33A', '#8040C0', '#F05A28', '#FF4C7D', '#F08C1E', '#1A9A8A', '#F2B705'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const note = document.querySelector('.mihon-note');
  if (note) note.textContent = '学校への提案用の見本（カラー版）です。写真・文章は今のサイトから借りています。確認が必要なところは「要確認」「仮」と表示しています。';

  // 学科ページは dept.js が題名を付け直すので、カラー版と分かるように直す
  if (!document.title.includes('カラー版')) document.title = document.title.replace('（作り直し見本）', '（作り直し見本・カラー版）');

  // ---------- トップ：最初の画面 ----------
  const svg = document.getElementById('cinema-cover'), tint = document.getElementById('cinema-tint');
  if (svg && tint) {
    // 文字のふちを8色に。文字を組み直したときも塗り直す
    const paint = () => svg.querySelectorAll('.o text').forEach((t, i) => {
      t.setAttribute('stroke', SPEC[i % SPEC.length]); t.setAttribute('stroke-width', '2');
    });
    new MutationObserver(paint).observe(svg, { childList: true });
    paint();
    // なぞった丸い窓の中だけは、本当の色の写真
    (function follow() {
      const c = svg.querySelector('.lens');
      if (c) { tint.style.setProperty('--lx', c.getAttribute('cx') + 'px'); tint.style.setProperty('--ly', c.getAttribute('cy') + 'px'); tint.style.setProperty('--lr', c.getAttribute('r') + 'px'); }
      requestAnimationFrame(follow);
    })();
  }

  // ---------- トップ：9学科は、画面の真ん中にある学科の色で背景が染まる ----------
  const hero = document.getElementById('cinema'), reel = document.getElementById('people'), track = document.getElementById('track');
  let last = null;
  function onScroll() {
    if (hero && tint) {
      const r = hero.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
      tint.style.opacity = (.9 * (1 - clamp((p - .2) / .45, 0, 1))).toFixed(3);
    }
    if (reel && track) {
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
  }
  if (hero || reel) {
    addEventListener('scroll', onScroll, { passive: true });
    if (track) track.addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();
  }

  // ---------- トップ：ミニ体験は、選んだ学科の色を場面全体に ----------
  const lab = document.getElementById('lab'), stage = document.getElementById('lab-stage');
  if (lab && stage) {
    const syncLab = () => { const c = stage.style.getPropertyValue('--lc'); if (c) lab.style.setProperty('--lab-c', c); };
    new MutationObserver(syncLab).observe(stage, { attributes: true, attributeFilter: ['style'] });
    syncLab();
  }

  // ---------- 下層ページ：カードや一覧に、9学科の色を順に割り当てる ----------
  const SEL = '.oc-list .oc, .news-card, .work, .project, .link-list li, .steps li, .split-2 > div, .people > *, .facts > .fact';
  const cycle = () => {
    const seen = new Map();
    document.querySelectorAll(SEL).forEach(el => {
      const k = el.parentElement; const i = seen.get(k) || 0; seen.set(k, i + 1);
      if (!el.style.getPropertyValue('--ac')) el.style.setProperty('--ac', SPEC[i % SPEC.length]);
    });
  };
  cycle();
  // 後から組み立てられる部品（学科ページ・作品一覧など）にも
  let t; new MutationObserver(() => { clearTimeout(t); t = setTimeout(cycle, 50); }).observe(document.body, { childList: true, subtree: true });
})();
