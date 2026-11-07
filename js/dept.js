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
    flow: { title: 'コードを書かずに、作業を自動化しよう', fn: playFlow }
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

  html += `<section class="cta-band"><div class="wrap"><div><h2>本物の実習を、体験授業で。</h2><p>オープンキャンパスでは、${d.name}の授業を先生や在校生と一緒に体験できます。</p></div>
    <a class="btn-white" href="open-campus.html">日程を見て予約する</a></div></section>
    <section class="sec"><div class="wrap"><div class="sec-head"><h2>ほかの学科も見る</h2></div>
    <div class="dept-grid">${CID.DEPT_ORDER.filter(k => k !== slug).map(k => {
      const o = CID.DEPTS[k];
      return `<a class="dept-card cut" href="${k}.html" style="--dept:${o.color}"><figure>${img(o.photos[0], '')}</figure><div class="in"><span class="yrs">${o.years}</span><h3>${o.name}</h3></div></a>`;
    }).join('')}</div>
    <p style="margin-top:28px"><a class="btn-ghost" href="admission.html#fee">この学科の学費を見る</a></p></div></section>`;

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
})();
