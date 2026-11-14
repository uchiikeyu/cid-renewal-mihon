// 学科ページ：<body data-dept="..."> の学科を depts-data.js から組み立てる
(function () {
  const slug = document.body.dataset.dept;
  const d = CID.DEPTS[slug];
  const root = document.getElementById('dept');
  if (!d || !root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const img = (f, alt = '') => `<img class="photo" src="${CID.img(f)}" alt="${alt}" loading="lazy">`;
  document.documentElement.style.setProperty('--dept', d.color);
  document.title = `${d.name}｜CID 中央情報大学校（作り直し見本）`;
  const lab = CID.LAB[d.lab];
  const MAJOR_PLAYS = {
    code: { title: 'プログラムを正しい順に並べよう', fn: playCode },
    mail: { title: 'あやしいメールを見つけよう', fn: playMail },
    flow: { title: 'コードを書かずに、作業を自動化しよう', fn: playFlow },
    views: { title: '三面図から、正しい部品を選ぼう', fn: playViews },
    anomaly: { title: '衛星のデータから、おかしな所を見つけよう', fn: playAnomaly }
  };

  let html = `
  <section class="page-hero">
    <div class="wrap">
      <div>
        <p class="crumb"><a href="index.html">トップ</a>　／　<a href="departments.html">学科</a>　／　${d.name}</p>
        <p class="dept-chip" style="margin-top:14px"><i aria-hidden="true"></i>${d.years}${d.tags.map(t => '　' + t).join('')}</p>
        <h1>${d.name}</h1>
        <span class="bar" aria-hidden="true"></span>
        <p class="lead"><strong style="color:var(--white);font-family:var(--f-head);font-size:var(--t-l);display:block;margin-bottom:8px">${d.catch}</strong>${d.lead}</p>
      </div>
      <figure class="cut">${img(d.photos[0], d.name + 'の授業風景')}</figure>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="hook cut" id="hook">
        <div class="hook-head"><h2><span class="touch-dot" aria-hidden="true"></span>${lab.q}</h2><p>${lab.sub}</p></div>
        <div class="lab-play" id="hook-play"></div>
        <p class="lab-result" id="hook-result" aria-live="polite"></p>
        <div class="lab-after"><p>${lab.after}</p><div class="links"><a class="btn-oc" href="open-campus.html">本物を体験授業で</a></div></div>
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head"><h2>この学科の特長</h2></div>
      <ul class="link-list" style="margin-bottom:32px">${d.points.map(p => `<li><a href="#majors" style="pointer-events:none">${p}</a></li>`).join('')}</ul>
      <div class="photo-row">${d.photos.map(f => `<figure class="cut">${img(f, d.name + 'の様子')}</figure>`).join('')}</div>
      ${d.extra ? `<div class="split-2" style="margin-top:48px">${d.extra.map(([h, t]) => `<div><h3 style="font-size:var(--t-l)">${h}</h3><p style="color:var(--sky);margin-top:8px">${t}</p></div>`).join('')}</div>` : ''}
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head"><h2>目指せる仕事</h2>
        <p class="how"><span class="touch-dot" aria-hidden="true"></span>カードを押すと、どんな仕事か分かります。</p></div>
      <div class="jobs">${d.jobs.map(([n, t]) => `<button class="job" type="button" aria-pressed="false"><span class="f cut"><b>${n}</b><small>押して見る</small></span><span class="b cut"><b>${n}</b>${t}</span></button>`).join('')}</div>
    </div>
  </section>

  <section class="sec" id="majors" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head"><h2>${d.majors.length}つの専攻</h2></div>
      ${d.majors.length > 4
        ? `<ul class="link-list">${d.majors.map(([n, t]) => `<li><details><summary style="cursor:pointer;padding:18px 0;font-family:var(--f-head);font-weight:700">${n}</summary><p style="color:var(--sky);padding:0 0 18px;max-width:42rem">${t}</p></details></li>`).join('')}</ul>`
        : `<div class="majors-tabs" role="tablist" aria-label="専攻" id="major-tabs"></div><div id="major-panel" role="tabpanel"></div>`}
    </div>
  </section>`;

  if (d.timetable || d.stats) {
    html += `<section class="sec sec--light"><div class="wrap">`;
    if (d.stats) {
      html += `<div class="sec-head"><h2>資格の実績</h2></div><div class="facts" style="margin-bottom:56px">${d.stats.map(([n, u, t]) =>
        `<div class="fact"><div class="num">${n}<small>${u}</small></div><p>${t}</p></div>`).join('')}</div>`;
    }
    if (d.timetable) {
      const T = ['9:20〜10:50', '11:00〜12:30', '13:20〜14:50', '15:00〜16:30'];
      html += `<div class="tt-scroll"><table class="tt"><caption>時間割（${d.timetable.label}）</caption>
        <thead><tr><th scope="col">時限</th><th scope="col">月</th><th scope="col">火</th><th scope="col">水</th><th scope="col">木</th><th scope="col">金</th></tr></thead>
        <tbody>${d.timetable.rows.map((r, i) => `<tr><th scope="row">${i + 1}　${T[i]}</th>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="note-block">今のサイトの時間割をそのまま載せています。空いているコマは、選択科目やインターンシップに使えます（<a href="learning.html">学びのしくみ</a>）。</p>`;
    }
    html += `</div></section>`;
  }

  if (d.projects) {
    html += `<section class="sec"><div class="wrap"><div class="sec-head"><h2>学生がつくったもの</h2></div>
      <div class="projects">${d.projects.map(([f, t, x]) => `<article class="project"><div class="work-cover cut">${img(f, t)}</div><h3>${t}</h3><p>${x}</p></article>`).join('')}</div>
      <p style="margin-top:32px"><a class="btn-ghost" href="works.html">ほかの学科の作品も見る</a></p></div></section>`;
  }

  if (d.voice) {
    const v = d.voice;
    html += `<section class="sec sec--light"><div class="wrap"><div class="sec-head"><h2>卒業生の声</h2></div>
      <div class="grad"${v.photo ? '' : ' style="grid-template-columns:1fr"'}>${v.photo ? `<figure class="cut">${img(v.photo, '卒業生')}</figure>` : ''}
      <div><blockquote>${v.quote}</blockquote><p>${v.text}</p><cite>${d.name} ${v.who}<br>※ 今のサイトの卒業生メッセージを短くまとめたもの。名前・写真の掲載は許可を確認します。</cite></div></div></div></section>`;
  }

  // カメラ体験への入口（学科に関係する体験を案内する）
  const CAM = { 'ict-design': '手でドローンを飛ばす', 'game-creator': 'なりきり光の人型', 'creative-design': '光の筆で空中に描く', 'pop-culture': 'なりきり光の人型', 'internet-video-creator': 'なりきり光の人型' };
  html += `<section class="sec" style="padding-top:0"><div class="wrap"><a class="cam-entry" href="camera.html"><span><b>${CAM[slug] ? `カメラ体験「${CAM[slug]}」` : 'カメラ体験「体で答える学科診断」'}</b><small>カメラの前に立って、体の動きで操作します。映像は保存も送信もしません。</small></span><span class="btn-oc">カメラ体験へ</span></a></div></section>`;
  html += `<section class="cta-band"><div class="wrap"><div><h2>本物の実習を、体験授業で。</h2><p>オープンキャンパスでは、${d.name}の授業を先生や在校生と一緒に体験できます。</p></div>
    <a class="btn-white" href="open-campus.html">日程を見て予約する</a></div></section>
    <section class="sec"><div class="wrap"><div class="sec-head"><h2>ほかの学科も見る</h2></div>
    <div class="dept-grid">${CID.DEPT_ORDER.filter(k => k !== slug).map(k => {
      const o = CID.DEPTS[k];
      return `<a class="dept-card cut" href="${k}.html" style="--dept:${o.color}"><figure>${img(o.photos[0], '')}</figure><div class="in"><span class="yrs">${o.years}</span><h3>${o.name}</h3></div></a>`;
    }).join('')}</div>
    <p style="margin-top:28px">${d.feeNote ? `<span style="color:var(--sky)">${d.feeNote}</span>` : '<a class="btn-ghost" href="admission.html#fee">この学科の学費を見る</a>'}</p></div></section>`;

  root.innerHTML = html;

  // 入口の体験
  CID.plays[d.play](document.getElementById('hook-play'), document.getElementById('hook-result'));

  // 仕事カード
  root.querySelectorAll('.job').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));

  // 専攻（4つ以下はタブ。情報システム学科は専攻ごとの体験つき）
  const tabs = document.getElementById('major-tabs'), panel = document.getElementById('major-panel');
  if (tabs) {
    d.majors.forEach(([n], i) => {
      const b = document.createElement('button');
      b.className = 'chip'; b.setAttribute('role', 'tab'); b.id = 'mtab-' + i; b.textContent = n;
      b.onclick = () => show(i);
      tabs.appendChild(b);
    });
    tabs.addEventListener('keydown', e => {
      const list = [...tabs.children], cur = list.findIndex(t => t.getAttribute('aria-selected') === 'true');
      const N = list.length;
      const n = e.key === 'ArrowRight' ? (cur + 1) % N : e.key === 'ArrowLeft' ? (cur + N - 1) % N : null;
      if (n !== null) { show(n); list[n].focus(); }
    });
    const show = i => {
      [...tabs.children].forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === i)); t.setAttribute('aria-pressed', String(k === i)); t.tabIndex = k === i ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', 'mtab-' + i);
      const [n, t, play] = d.majors[i];
      const P = play && MAJOR_PLAYS[play];
      panel.innerHTML = `<div class="major"${P ? '' : ' style="grid-template-columns:1fr"'}><div><h3>${n}</h3><p class="desc" style="max-width:40rem">${t}</p></div>` +
        (P ? `<div class="major-play cut"><h4><span class="touch-dot" aria-hidden="true"></span>${P.title}</h4><div class="play"></div><p class="lab-result" aria-live="polite"></p></div>` : '') + `</div>`;
      if (P) P.fn(panel.querySelector('.play'), panel.querySelector('.lab-result'));
    };
    show(0);
  }

  // ---------- 専攻ごとの体験（情報システム学科） ----------
  function playCode(root, out) {
    const L = ['names = ["佐藤", "鈴木", "高橋"]', 'for name in names:', '    print(name + "さん、ようこそ")', 'print("全部で", len(names), "人")'];
    const shuffled = [2, 0, 3, 1];
    let order = [];
    root.innerHTML = `<p class="note">押した順に、下のプログラムに入ります。</p><div class="code-lines" data-src></div>
      <div class="code-out" data-prog aria-label="組み立てたプログラム" style="color:#CFE0FF"></div>
      <div class="ctl-row"><button class="chip chip--go" data-run>実行する</button><button class="chip" data-reset>やり直す</button></div>
      <div class="code-out" data-out aria-label="実行結果"></div>`;
    const src = root.querySelector('[data-src]'), prog = root.querySelector('[data-prog]'), res = root.querySelector('[data-out]');
    function draw() {
      src.innerHTML = '';
      shuffled.forEach(i => {
        const b = document.createElement('button');
        b.className = 'code-line'; b.textContent = L[i]; b.disabled = order.includes(i);
        b.onclick = () => { order.push(i); draw(); };
        src.appendChild(b);
      });
      prog.textContent = order.map(i => L[i]).join('\n') || '（ここにプログラムができます）';
    }
    function run() {
      if (order.length < 4) return '4行すべて並べてから実行しましょう。';
      const lines = []; let defined = false;
      for (let k = 0; k < 4; k++) {
        const i = order[k];
        if (i === 0) defined = true;
        if (i === 1) {
          if (!defined) return { err: "NameError: name 'names' is not defined", hint: '「names」を作る前に使おうとしています。' };
          if (order[k + 1] !== 2) return { err: 'IndentationError: expected an indented block', hint: '「for」の次の行は、字下げした行でなければいけません。' };
          lines.push('佐藤さん、ようこそ', '鈴木さん、ようこそ', '高橋さん、ようこそ'); k++;
        }
        if (i === 2) return { err: 'IndentationError: unexpected indent', hint: '字下げした行が、forの外に出てしまっています。' };
        if (i === 3) {
          if (!defined) return { err: "NameError: name 'names' is not defined", hint: '人数を数える前に、名前の一覧を作りましょう。' };
          lines.push('全部で 3 人');
        }
      }
      return { ok: lines.join('\n') };
    }
    root.querySelector('[data-run]').onclick = () => {
      const r = run();
      if (typeof r === 'string') { out.textContent = r; return; }
      res.style.color = r.ok ? '#9FE3B5' : '#FF8FA3';
      res.textContent = r.ok || r.err;
      out.textContent = r.ok ? '動きました！ 順番ひとつで、プログラムは動いたり止まったりします。' : r.hint;
    };
    root.querySelector('[data-reset]').onclick = () => { order = []; res.textContent = ''; out.textContent = ''; draw(); };
    draw();
  }

  function playMail(root, out) {
    const M = [
      { from: 'ショッピング会員サポート', addr: 'support@shop-account-security.xyz', sub: '【重要】アカウントを停止しました。24時間以内に確認してください', bad: true, why: '差出人のアドレスが公式らしくない上に、「24時間以内」と急がせています。' },
      { from: '中央情報大学校 教務', addr: 'kyomu@chuo.ac.jp', sub: '後期の時間割を掲示板に載せました', bad: false },
      { from: '宅配便 お届け案内', addr: 'info@takuhai-saihaitatsu.top', sub: 'お荷物をお届けできませんでした。こちらから再配達を', bad: true, why: '宅配会社を名乗るのに見慣れないアドレス。リンクを押させようとしています。' }
    ];
    root.innerHTML = `<p class="note">あやしいと思うメールを、すべて選んでから「判定する」を押してください。</p><div class="code-lines" data-box></div>
      <div class="ctl-row"><button class="chip chip--go" data-judge>判定する</button><button class="chip" data-reset>やり直す</button></div>`;
    const box = root.querySelector('[data-box]'), picked = new Set();
    M.forEach((m, i) => {
      const b = document.createElement('button');
      b.className = 'mail'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<b>${m.sub}</b><span>${m.from}　&lt;${m.addr}&gt;</span>`;
      b.onclick = () => { picked.has(i) ? picked.delete(i) : picked.add(i); b.classList.toggle('is-picked', picked.has(i)); b.setAttribute('aria-pressed', String(picked.has(i))); };
      box.appendChild(b);
    });
    root.querySelector('[data-judge]').onclick = () => {
      let right = 0;
      [...box.children].forEach((b, i) => {
        if (picked.has(i) === M[i].bad) right++;
        b.classList.toggle('is-right', M[i].bad);
        b.classList.toggle('is-wrong', picked.has(i) && !M[i].bad);
      });
      out.textContent = right === 3 ? '全問正解！ ' + M.filter(m => m.bad).map(m => m.why).join(' ')
        : `${right}/3 正解。緑の枠があやしいメールです。差出人のアドレスと、急がせる言葉に注目しましょう。`;
    };
    root.querySelector('[data-reset]').onclick = () => { picked.clear(); out.textContent = ''; [...box.children].forEach(b => { b.className = 'mail'; b.setAttribute('aria-pressed', 'false'); }); };
  }

  function playFlow(root, out) {
    const opts = {
      t: ['オープンキャンパスの申込フォームが送られたら', '毎朝9時になったら', 'メールが届いたら'],
      a: ['参加者の名簿に1行追加する', 'ファイルを全部消す', '何もしない'],
      b: ['担当の先生にチャットで知らせる', '全校生徒にメールを送る', '名簿を印刷する']
    };
    const sel = k => `<select data-k="${k}">${opts[k].map((o, i) => `<option value="${i}">${o}</option>`).join('')}</select>`;
    root.innerHTML = `<p class="note">お題：申し込みがあったら、名簿に追加して、担当の先生に知らせたい。</p>
      <div class="flow"><label>きっかけ${sel('t')}</label><label>やること1${sel('a')}</label><label>やること2${sel('b')}</label></div>
      <div class="ctl-row"><button class="chip chip--go" data-run>動かしてみる</button></div>
      <div class="flow-run" aria-hidden="true"><span>きっかけ</span>›<span>やること1</span>›<span>やること2</span></div>`;
    ['t', 'a', 'b'].forEach((k, i) => { root.querySelector(`[data-k="${k}"]`).value = String([1, 2, 1][i]); });
    const steps = root.querySelectorAll('.flow-run span');
    root.querySelector('[data-run]').onclick = async () => {
      const v = ['t', 'a', 'b'].map(k => +root.querySelector(`[data-k="${k}"]`).value);
      out.textContent = '';
      for (let i = 0; i < 3; i++) { steps.forEach((s, k) => s.classList.toggle('on', k === i)); await wait(450); }
      steps.forEach(s => s.classList.remove('on'));
      out.textContent = v.every(x => x === 0) ? '完成！ 申し込みのたびに、名簿と連絡が自動で済みます。コードは1行も書いていません。'
        : v[1] === 1 ? '大変！ ファイルが消えてしまいます。自動化は、まちがえると被害も自動で広がります。'
          : v[2] === 1 ? '全校生徒に通知が飛んでしまいました。知らせる相手を見直しましょう。'
            : 'お題の通りには動いていません。きっかけとやることを見直しましょう。';
    };
  }

  // ---------- 専攻ごとの体験（スペーステックエンジニア学科） ----------
  // 宇宙プロダクト専攻：三面図（正面・上・右）から、正しい立体を選ぶ。立体は小さな立方体の組み合わせ
  function playViews(root, out) {
    const V = (s) => s.split(' ').map(t => t.split(',').map(Number)); // "x,y,z x,y,z ..."
    const QS = [
      { name: 'L字の金具', ok: V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,0,1 1,0,1 2,0,1'),
        ng: [V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,1,1 1,1,1 2,1,1'), V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,0,1 1,0,1')] },
      { name: '段のある台座', ok: V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,2,0 1,2,0 2,2,0 0,0,1 1,0,1 0,1,1 1,1,1 0,0,2'),
        ng: [V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,2,0 1,2,0 2,2,0 0,0,1 1,0,1 0,1,1 1,1,1 1,1,2'), V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,2,0 1,2,0 2,2,0 1,1,1 2,1,1 1,2,1 2,2,1 2,2,2')] },
      { name: 'みぞのある部品', ok: V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,0,1 0,1,1 2,0,1 2,1,1'),
        ng: [V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,0,1 1,0,1 2,0,1 0,1,1 2,1,1'), V('0,0,0 1,0,0 2,0,0 0,1,0 1,1,0 2,1,0 0,0,1 0,1,1 2,0,1')] }
    ];
    // 立体を、斜め上から見た絵（等角図）にする
    function iso(vox, size = 22) {
      const c = Math.cos(Math.PI / 6) * size, sn = Math.sin(Math.PI / 6) * size;
      const P = (x, y, z) => [(x - y) * c, (x + y) * sn - z * size];
      const order = vox.slice().sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]) || a[2] - b[2]);
      let g = '';
      const xs = [], ys = [];
      const poly = (pts, fill) => { pts.forEach(([x, y]) => { xs.push(x); ys.push(y); }); g += `<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="#081330" stroke-width="1.2" stroke-linejoin="round"/>`; };
      order.forEach(([x, y, z]) => {
        poly([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], '#E9EEF7');   // 上の面
        poly([P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], '#AFC0DC'); // 手前の面
        poly([P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)], '#7D93BC'); // 右の面
      });
      const x0 = Math.min(...xs) - 6, y0 = Math.min(...ys) - 6, w = Math.max(...xs) - x0 + 6, h = Math.max(...ys) - y0 + 6;
      return `<svg viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" width="150" height="120" aria-hidden="true">${g}</svg>`;
    }
    // 三面図：正面（左右×高さ）、上（左右×奥行き）、右（奥行き×高さ）
    const proj = (vox, f) => new Set(vox.map(f));
    const VIEWS = [['正面', v => `${v[0]},${2 - v[2]}`], ['上', v => `${v[0]},${v[1]}`], ['右', v => `${2 - v[1]},${2 - v[2]}`]];
    const key = vox => VIEWS.map(([, f]) => [...proj(vox, f)].sort().join(';')).join('|');
    function views(vox) {
      return VIEWS.map(([label, f]) => {
        const set = proj(vox, f);
        let cells = '';
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells += `<rect x="${c * 20 + 2}" y="${r * 20 + 2}" width="18" height="18" fill="${set.has(`${c},${r}`) ? '#F2B705' : 'rgba(255,255,255,.06)'}"/>`;
        return `<figure class="tv"><svg viewBox="0 0 62 62" width="78" height="78" aria-hidden="true">${cells}</svg><figcaption>${label}</figcaption></figure>`;
      }).join('');
    }
    let qi = 0, score = 0;
    function draw() {
      const q = QS[qi];
      const opts = [{ v: q.ok, ok: true }, ...q.ng.map(v => ({ v, ok: false }))].sort(() => Math.random() - .5);
      root.innerHTML = `<p class="note">問題 ${qi + 1} / ${QS.length}　${q.name}の三面図です。黄色は、その方向から見たときに部品が見える所です。</p>
        <div class="tv-row">${views(q.ok)}</div>
        <div class="ctl-row tv-opts">${opts.map((o, i) => `<button class="chip tv-opt" type="button" data-i="${i}" aria-label="立体 ${i + 1}">${iso(o.v)}</button>`).join('')}</div>`;
      root.querySelectorAll('.tv-opt').forEach(b => b.onclick = () => {
        const o = opts[+b.dataset.i];
        if (o.ok) score++;
        root.querySelectorAll('.tv-opt').forEach((x, i) => { x.disabled = true; x.style.borderColor = opts[i].ok ? '#3CCB7F' : (x === b ? '#DF032E' : ''); });
        const diff = VIEWS.filter(([, f]) => [...proj(o.v, f)].sort().join() !== [...proj(q.ok, f)].sort().join()).map(([l]) => l);
        out.textContent = o.ok ? '正解！ 3つの方向から見た形が、すべて一致しています。' : `ちがいます。この立体は「${diff.join('」「')}」から見た形が合いません。`;
        setTimeout(() => {
          qi++;
          if (qi < QS.length) { out.textContent = ''; draw(); return; }
          root.innerHTML = '<div class="ctl-row"><button class="chip" type="button" data-again>もう一度</button></div>';
          root.querySelector('[data-again]').onclick = () => { qi = 0; score = 0; out.textContent = ''; draw(); };
          out.textContent = `${QS.length}問中 ${score}問 正解。図面から立体を思い描く力は、CADで部品を設計するときの基本です。`;
        }, 1900);
      });
    }
    // まちがいの立体が、三面図のどこかで必ず正解と違うことを確かめておく
    QS.forEach(q => q.ng.forEach(v => { if (key(v) === key(q.ok)) console.warn('三面図が同じになる問題があります:', q.name); }));
    draw();
  }

  // 宇宙データ専攻：衛星から届いたデータのグラフで、おかしな所を押す
  function playAnomaly(root, out) {
    const N = 240; // 24時間ぶん（6分おき）
    const ROUNDS = [
      { title: '電池の温度（℃）', base: 20, amp: 8, kind: 'spike', hint: '一瞬だけ、ありえないほど高くなった所があります。' },
      { title: '通信機の電圧（V）', base: 12, amp: 1.2, kind: 'drop', hint: '値が0のまま動かない所があります。センサーの故障かもしれません。' },
      { title: '本体の温度（℃）', base: 18, amp: 5, kind: 'drift', hint: '途中から、少しずつ上がり続けています。ヒーターの不具合かもしれません。' }
    ];
    let ri = 0, score = 0;
    function data(r) {
      const v = [], at = 60 + Math.floor(Math.random() * 120);
      for (let i = 0; i < N; i++) {
        let y = r.base + r.amp * Math.sin(i / 15 * Math.PI * 2) + (Math.random() - .5) * r.amp * .25;
        if (r.kind === 'spike' && (i === at || i === at + 1)) y += r.amp * 2.6;
        if (r.kind === 'drop' && i >= at && i < at + 7) y = 0;
        if (r.kind === 'drift' && i >= at) y += (i - at) * r.amp * .045;
        v.push(y);
      }
      const win = r.kind === 'drift' ? [at - 6, at + 45] : [at - 4, at + (r.kind === 'drop' ? 10 : 5)];
      return { v, at, win };
    }
    function draw() {
      const r = ROUNDS[ri], d = data(r);
      const min = Math.min(...d.v), max = Math.max(...d.v), W = 480, H = 160;
      const pts = d.v.map((y, i) => `${(i / (N - 1) * W).toFixed(1)},${(H - 14 - (y - min) / (max - min || 1) * (H - 24)).toFixed(1)}`).join(' ');
      root.innerHTML = `<p class="note">問題 ${ri + 1} / ${ROUNDS.length}　${r.title}。地球を1周するたびに、昼と夜で値が上下します。いつもと違う所を押してください。</p>
        <svg class="an-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${r.title}のグラフ">
          ${[0, 6, 12, 18, 24].map(hh => `<line x1="${hh / 24 * W}" y1="0" x2="${hh / 24 * W}" y2="${H}" stroke="#fff" stroke-opacity=".08"/><text x="${Math.min(W - 22, hh / 24 * W + 3)}" y="${H - 3}" fill="#9DBEF0" font-size="10">${hh}時</text>`).join('')}
          <rect data-mark x="0" y="0" width="0" height="${H}" fill="#3CCB7F" opacity="0"/>
          <polyline points="${pts}" fill="none" stroke="#F2B705" stroke-width="1.6"/>
          <line data-cur x1="-10" y1="0" x2="-10" y2="${H}" stroke="#fff" stroke-dasharray="3 3"/>
        </svg>`;
      const svg = root.querySelector('svg'), mark = root.querySelector('[data-mark]'), cur = root.querySelector('[data-cur]');
      let done = false;
      svg.addEventListener('pointermove', e => { if (done) return; const b = svg.getBoundingClientRect(); const x = (e.clientX - b.left) / b.width * W; cur.setAttribute('x1', x); cur.setAttribute('x2', x); });
      svg.addEventListener('click', e => {
        if (done) return;
        const b = svg.getBoundingClientRect(), i = Math.round((e.clientX - b.left) / b.width * (N - 1));
        const ok = i >= d.win[0] && i <= d.win[1];
        done = true; if (ok) score++;
        mark.setAttribute('x', d.win[0] / (N - 1) * W); mark.setAttribute('width', (d.win[1] - d.win[0]) / (N - 1) * W); mark.setAttribute('opacity', '.28');
        out.textContent = ok ? `正解！ ${r.hint}` : `緑の所が異常です。${r.hint}`;
        setTimeout(() => {
          ri++;
          if (ri < ROUNDS.length) { out.textContent = ''; draw(); return; }
          root.innerHTML = '<div class="ctl-row"><button class="chip" type="button" data-again>もう一度</button></div>';
          root.querySelector('[data-again]').onclick = () => { ri = 0; score = 0; out.textContent = ''; draw(); };
          out.textContent = `${ROUNDS.length}問中 ${score}問 正解。衛星から届く大量のデータから異常を見つけるのは、データ分析とAIの大切な仕事です。`;
        }, 2600);
      });
    }
    draw();
  }
})();
