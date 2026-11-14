// 全ページ共通：見本の帯・ヘッダー（スマホ用メニュー付き）・フッター
// 各ページの <body data-page="..."> で、今いるメニューに印を付ける
(function () {
  const page = document.body.dataset.page || '';

  const MAIN = [
    ['departments', 'departments.html', '学科'],
    ['learning', 'learning.html', '学びのしくみ'],
    ['campus-life', 'campus-life.html', 'キャンパスライフ'],
    ['career', 'career.html', '就職・資格'],
    ['works', 'works.html', '作品'],
    ['admission', 'admission.html', '学費・入試'],
    ['access', 'access.html', 'アクセス']
  ];
  const DEPTS = [
    ['ict-design', '高度ICTデザイン学科'], ['information-system', '情報システム学科'],
    ['agri-foodtech', 'アグリ・フードテック学科'], ['game-creator', 'ゲームクリエイター学科'],
    ['creative-design', 'クリエイティブデザイン学科'], ['pop-culture', 'ポップカルチャー学科'],
    ['internet-video-creator', 'ネット動画クリエイター学科'], ['electro-communications', '電気通信学科']
  ];
  const SUB = [
    ['camera.html', 'カメラ体験'], ['news.html', 'お知らせ'], ['instructor.html', '講師紹介'], ['about.html', '学校概要・情報公開'],
    ['contact.html', '資料請求・お問い合わせ']
  ];
  const VISIT = [
    ['working-adult.html', '社会人の方へ'], ['graduate.html', '卒業生の方へ'],
    ['recruiting.html', '採用担当者の方へ'], ['recruitment.html', '職員採用']
  ];
  const INTL = [
    ['international-engineer.html', '国際エンジニア学科'], ['international.html', '外国人留学生キャリア形成促進プログラム'],
    ['japanese.html', '日本語学科'], ['application.html', '留学生対象入試']
  ];
  const isDept = DEPTS.some(d => d[0] === page);
  const cur = k => (k === page || (k === 'departments' && isDept)) ? ' aria-current="page"' : '';
  const links = arr => arr.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('');

  const note = `<div class="mihon-note">学校への提案用の見本です。写真・文章は今のサイトから借りています。確認が必要なところは「要確認」「仮」と表示しています。</div>`;

  const head = `<header class="site-head">
    <div class="wrap">
      <a class="logo" href="index.html" aria-label="CID 中央情報大学校 トップへ"><b>CID</b><span>中央情報大学校</span></a>
      <nav class="site-nav" aria-label="メインメニュー">${MAIN.map(([k, h, t]) => `<a href="${h}"${cur(k)}>${t}</a>`).join('')}</nav>
      <a class="btn-oc" href="open-campus.html"${cur('open-campus')}>オープンキャンパス予約</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="drawer"><span class="bars" aria-hidden="true"></span><span class="visually-hidden">メニューを開く</span></button>
    </div>
  </header>
  <div class="drawer" id="drawer" hidden>
    <div class="wrap">
      <ul class="drawer-main">${MAIN.map(([k, h, t]) => `<li><a href="${h}"${cur(k)}>${t}</a></li>`).join('')}</ul>
      <div class="drawer-cols">
        <div><p>学科</p><ul>${DEPTS.map(([k, t]) => `<li><a href="${k}.html"${cur(k)}>${t}</a></li>`).join('')}</ul></div>
        <div><p>ほかのページ</p><ul>${links(SUB)}${links(VISIT)}</ul></div>
        <div><p>留学生の方へ</p><ul>${links(INTL)}</ul></div>
      </div>
    </div>
  </div>`;

  const foot = `<footer class="site-foot">
    <div class="wrap">
      <div class="foot-top">
        <div>
          <p class="foot-logo"><b>CID</b> 中央情報大学校</p>
          <p>学校法人 有坂中央学園<br>〒370-0841 群馬県高崎市栄町13-2<br>高崎駅東口から徒歩3分<br>電話 027-324-8511（9:00〜17:00、土日祝を除く）</p>
          <a class="btn-oc" href="open-campus.html">オープンキャンパス予約</a>
        </div>
        <div><p class="foot-h">学科</p><ul>${DEPTS.map(([k, t]) => `<li><a href="${k}.html">${t}</a></li>`).join('')}</ul></div>
        <div><p class="foot-h">学校を知る</p><ul>${MAIN.slice(1).map(([, h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}${links(SUB)}</ul></div>
        <div><p class="foot-h">訪問者別</p><ul>${links(VISIT)}</ul><p class="foot-h">留学生の方へ</p><ul>${links(INTL)}</ul></div>
      </div>
      <p class="foot-copy">© 学校法人 有坂中央学園 CID 中央情報大学校　最終更新 2026年11月14日</p>
    </div>
  </footer>`;

  document.body.insertAdjacentHTML('afterbegin', note + head);
  document.body.insertAdjacentHTML('beforeend', foot);

  const btn = document.querySelector('.menu-btn'), drawer = document.getElementById('drawer');
  const set = open => {
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.visually-hidden').textContent = open ? 'メニューを閉じる' : 'メニューを開く';
    // 見本の帯がある分、ヘッダーの下端からメニューを出す
    if (open) drawer.style.top = Math.max(0, document.querySelector('.site-head').getBoundingClientRect().bottom) + 'px';
    drawer.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  };
  btn.addEventListener('click', () => set(drawer.hidden));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) { set(false); btn.focus(); } });
  drawer.addEventListener('click', e => { if (e.target.closest('a')) set(false); });

  // 全ページ共通の動き
  const fx = document.createElement('script');
  fx.src = (window.CID_ROOT || '') + 'js/fx.js?v=20261114';
  document.body.appendChild(fx);
})();
