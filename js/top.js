// トップ：学生の1日・卒業制作の展示室
window.CID = window.CID || {};

// 作品カードの表紙（画像の代わりに、作品ごとの図柄をCSSで描く）
CID.cover = function (kind) {
  const c = {
    arm: 'radial-gradient(circle at 30% 45%, #DF032E 0 9%, transparent 10%), radial-gradient(circle at 30% 45%, transparent 0 18%, rgba(255,255,255,.5) 19% 20%, transparent 21%), linear-gradient(115deg, transparent 45%, #8FB4E8 45% 49%, transparent 49%), linear-gradient(160deg, #102A58, #23467F)',
    walk: 'repeating-linear-gradient(90deg, rgba(143,180,232,.25) 0 2px, transparent 2px 28px), radial-gradient(ellipse at 50% 85%, #3CCB7F 0 22%, transparent 23%), linear-gradient(180deg, #0E2550, #1B3E78)',
    badge: 'radial-gradient(circle at 35% 50%, #F7D14C 0 17%, #fff 17% 19%, transparent 19%), radial-gradient(circle at 62% 42%, #DF032E 0 14%, #fff 14% 16%, transparent 16%), radial-gradient(circle at 70% 70%, #8FB4E8 0 11%, #fff 11% 13%, transparent 13%), #1A3566',
    bento: 'linear-gradient(90deg, transparent 49%, rgba(255,255,255,.6) 49% 51%, transparent 51%), linear-gradient(0deg, transparent 49%, rgba(255,255,255,.6) 49% 51%, transparent 51%), linear-gradient(135deg, #2E7D5B, #1B4F3A)',
    game: 'linear-gradient(0deg, #2B4A82 0 22%, transparent 22%), linear-gradient(0deg, transparent 40%, #3D6BB3 40% 46%, transparent 46%), radial-gradient(circle at 30% 70%, #F7D14C 0 6%, transparent 7%), linear-gradient(180deg, #0B1E45, #2A2160)',
    anime: 'radial-gradient(circle at 70% 35%, #FFD9E4 0 18%, transparent 19%), conic-gradient(from 200deg at 70% 35%, #FF5C78, #8FB4E8, #F7D14C, #FF5C78)',
    poster: 'linear-gradient(90deg, #F7D14C 0 38%, transparent 38%), linear-gradient(0deg, #DF032E 0 30%, transparent 30%), #FFFFFF',
    light: 'radial-gradient(circle at 50% 40%, #FFD34D 0 10%, rgba(255,211,77,.35) 10% 26%, transparent 27%), repeating-linear-gradient(0deg, rgba(143,180,232,.2) 0 2px, transparent 2px 20px), #0A1B3D'
  };
  return c[kind] || c.arm;
};

// ---------- 学生の1日 ----------
(function () {
  const list = document.getElementById('day-list');
  if (!list) return;
  const side = document.getElementById('day-side');
  const now = document.getElementById('day-now'), label = document.getElementById('day-now-label');
  const hh = document.getElementById('hand-h'), mm = document.getElementById('hand-m');
  const who = document.getElementById('day-who');

  // 時計の目盛り
  const ticks = document.getElementById('clock-ticks');
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ticks.insertAdjacentHTML('beforeend', `<line x1="${100 + Math.sin(a) * 80}" y1="${100 - Math.cos(a) * 80}" x2="${100 + Math.sin(a) * 88}" y2="${100 - Math.cos(a) * 88}"/>`);
  }

  const SKY = {
    '7:40': '#2C5A9E', '9:20': '#2F6DB5', '11:00': '#3478C4', '12:30': '#3A80C9', '13:20': '#3474B8',
    '15:00': '#3B5E9E', '16:40': '#8A4B6B', '18:30': '#3A2E5E', '21:00': '#16224A'
  };

  // 時間割は情報システム学科1年次の例（今のサイト）をもとにした。ほかの学科は仮。
  const DAYS = {
    '情報システム学科': [
      ['7:40', '電車で通学', '高崎駅から歩いて学校へ。電車の中で基本情報技術者試験の過去問を1問。', '通学'],
      ['9:20', 'アプリケーション開発', '1・2限は続けて同じ授業。チームで小さな業務アプリを作っていきます。', '1・2限'],
      ['11:00', 'アプリケーション開発（続き）', '画面の動きを先生に見てもらい、直すところを決めます。', '1・2限'],
      ['12:30', '昼休み', '学食か、教室で友だちと。午後の実習に向けてノートPCの充電を確認。', '昼休み'],
      ['13:20', '組み込みシステム実習', 'センサーとモーターをプログラムで動かす実習。思った通りに動くと教室が少しざわつきます。', '3・4限'],
      ['15:00', '組み込みシステム実習（続き）', '動かなかった原因を、配線とプログラムの両方から探します。', '3・4限'],
      ['16:40', '放課後の資格対策', '空き教室で基本情報の勉強会。分からないところは先生に聞けます。', '放課後'],
      ['18:30', 'アルバイト', '「学びながら働く」。IT関係のアルバイトを紹介してもらう学生もいます。', '放課後'],
      ['21:00', '自分の制作', '作りかけのWebアプリに機能を1つ追加して、今日はおしまい。', '夜']
    ],
    'ゲームクリエイター学科': [
      ['7:40', '電車で通学', '移動中は気になっているゲームのレベルデザインを観察。', '通学'],
      ['9:20', 'ゲームプログラミング', 'キャラクターの移動とジャンプを作ります。', '1・2限'],
      ['11:00', 'ゲームプログラミング（続き）', 'ジャンプの「気持ちよさ」を数値で調整します。', '1・2限'],
      ['12:30', '昼休み', 'みんなで新作ゲームの話。', '昼休み'],
      ['13:20', 'ゲームグラフィック', '自分のゲームで使うキャラクターのドット絵を描きます。', '3・4限'],
      ['15:00', 'チーム制作の打ち合わせ', 'プログラム・グラフィック・企画の担当で進み具合を確認。', '3・4限'],
      ['16:40', 'テストプレイ', '友だちに遊んでもらい、つまずいた場所をメモします。', '放課後'],
      ['18:30', 'アルバイト', 'アルバイトの日。', '放課後'],
      ['21:00', '自分の制作', 'テストプレイのメモを見ながら、ステージを1つ作り直します。', '夜']
    ],
    '電気通信学科': [
      ['7:40', '電車で通学', '朝は工具の点検から。', '通学'],
      ['9:20', '電気理論', 'オームの法則から、家の配線に流れる電気を計算します。', '1・2限'],
      ['11:00', '電気理論（続き）', '第二種電気工事士の筆記試験の問題に挑戦。', '1・2限'],
      ['12:30', '昼休み', '', '昼休み'],
      ['13:20', '配線実習', '実物のケーブルとスイッチで、決められた時間内に配線を完成させます。', '3・4限'],
      ['15:00', '配線実習（続き）', '先生がチェック。ねじの締め方ひとつで合否が変わります。', '3・4限'],
      ['16:40', '技能試験の練習', '試験と同じ課題を、時間を計って繰り返します。', '放課後'],
      ['18:30', 'アルバイト', 'アルバイトの日。', '放課後'],
      ['21:00', '復習', '今日まちがえた配線を図に描いて確認。', '夜']
    ]
  };
  DAYS['電気通信学科'][3][2] = '午後の実習に備えて、しっかり食べておきます。';

  let current = '情報システム学科';
  Object.keys(DAYS).forEach(k => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = k.replace('学科', '');
    b.setAttribute('aria-pressed', String(k === current));
    b.onclick = () => {
      current = k;
      who.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
      render(true);
    };
    who.appendChild(b);
  });

  let io;
  function setTime(t, text) {
    const [H, M] = t.split(':').map(Number);
    hh.style.transform = `rotate(${(H % 12 + M / 60) * 30}deg)`;
    mm.style.transform = `rotate(${M * 6}deg)`;
    now.textContent = t;
    label.textContent = text;
    side.style.setProperty('--sky-now', SKY[t]);
    side.style.backgroundColor = SKY[t];
  }
  function render(keep) {
    const active = keep ? list.querySelector('.is-now') : null;
    const idx = active ? [...list.children].indexOf(active) : 0;
    list.innerHTML = DAYS[current].map(([t, h, p, tag], i) =>
      `<li class="day-item${i === idx ? ' is-now' : ''}" data-t="${t}" data-h="${h}"><time>${t}</time><div><h3>${h}</h3><p>${p}</p><span class="tag">${tag}</span></div></li>`).join('');
    const a = DAYS[current][idx];
    setTime(a[0], a[1]);
    if (io) io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      list.querySelectorAll('.is-now').forEach(x => x.classList.remove('is-now'));
      e.target.classList.add('is-now');
      setTime(e.target.dataset.t, e.target.dataset.h);
    }), { rootMargin: '-45% 0px -50% 0px' });
    list.querySelectorAll('.day-item').forEach(li => io.observe(li));
  }
  render(false);
})();

// ---------- 卒業制作の展示室 ----------
(function () {
  const g = document.getElementById('gallery');
  if (!g) return;
  const WORKS = [
    ['arm', '視線で動く「第3の腕」', '情報システム学科', 'スマートグラスで視線を読み取り、ロボットアームを「3本目の腕」として操作するシステム。'],
    ['walk', '歩くだけで姿勢を診断するシステム', '情報システム学科', 'カメラの前を歩くだけで、AIが姿勢のくせを解析して点数にし、改善のアドバイスを出します。センサーは使いません。'],
    ['badge', '缶バッジの受注システム', '情報システム学科', '株式会社文真堂書店からの依頼で開発。缶バッジ用の画像集めに手間がかかっていた作業を、システムで解決しました。'],
    ['bento', '弁当の発注システム', '情報システム学科', '県内の建設会社からの依頼で開発。手作業で起きていた注文ミスが減り、時間も大きく短縮できました。'],
    ['game', '2Dアクションゲーム', 'ゲームクリエイター学科', '作品名・内容は実際の卒業制作に差し替えます。', true],
    ['anime', '短編アニメーション', 'ポップカルチャー学科', '作品名・内容は実際の卒業制作に差し替えます。', true],
    ['poster', '商店街のポスター', 'クリエイティブデザイン学科', '作品名・内容は実際の卒業制作に差し替えます。', true],
    ['light', '照明の自動制御盤', '電気通信学科', '作品名・内容は実際の卒業制作に差し替えます。', true]
  ];
  WORKS.forEach(([k, t, d, text, tmp]) => {
    const b = document.createElement('button');
    b.className = 'work';
    b.type = 'button';
    b.innerHTML = `<div class="work-cover" style="background:${CID.cover(k)}"></div><div class="work-body"><h3>${t}${tmp ? '<span class="tmp">仮</span>' : ''}</h3><small>${d}</small></div>`;
    b.onclick = () => open(k, t, d, text);
    g.appendChild(b);
  });
  g.insertAdjacentHTML('beforeend', `<div class="work work--expo"><h3>CID EXPO 2027</h3><p>2027年2月27日（土）10:00〜17:00<br>Gメッセ群馬<br>入場無料。卒業制作を一般公開します。</p></div>`);

  const dlg = document.getElementById('work-dlg');
  function open(k, t, d, text) {
    document.getElementById('dlg-cover').style.background = CID.cover(k);
    document.getElementById('dlg-title').textContent = t;
    document.getElementById('dlg-text').textContent = `${d}｜${text}`;
    dlg.showModal();
  }
  document.getElementById('dlg-close').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  // マウスでつかんで横に動かす
  let sx = 0, sl = 0, down = false, moved = false;
  g.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = false; sx = e.clientX; sl = g.scrollLeft;
  });
  addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 5) { moved = true; g.classList.add('is-drag'); }
    if (moved) g.scrollLeft = sl - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    setTimeout(() => g.classList.remove('is-drag'), 0);
  });
})();
