/*
 * 나는 어떤 AI 유형? — 화면과 동작
 * 해시 주소로 화면을 전환합니다 (GitHub Pages 같은 정적 호스팅에서 새로고침해도 안전).
 *   #/            표지
 *   #/quiz        문항 진행
 *   #/result      내 결과
 *   #/result/XXXX 친구가 보낸 결과 링크 (XXXX = 유형 코드)
 *   #/types       유형 도감
 *   #/type/XXXX   유형 설명
 */
(function () {
  'use strict';

  var D = window.AIT_DATA;
  var AXES = D.AXES, STAGES = D.STAGES, FEEDBACK = D.STAGE_FEEDBACK;
  var QUESTIONS = D.QUESTIONS, TYPES = D.TYPES, BY_CODE = D.TYPES_BY_CODE;
  var TOTAL = QUESTIONS.length;            // 28
  var PER_STAGE = TOTAL / STAGES.length;   // 7
  var Q_BY_ID = {};
  QUESTIONS.forEach(function (q) { Q_BY_ID[q.id] = q; });

  var LETTER_NAME = {};
  AXES.forEach(function (ax) {
    LETTER_NAME[ax.left.k] = ax.left.name;
    LETTER_NAME[ax.right.k] = ax.right.name;
  });
  var LETTER_COLOR = {};
  AXES.forEach(function (ax) { LETTER_COLOR[ax.left.k] = ax.color; LETTER_COLOR[ax.right.k] = ax.color; });

  // 문항 화면의 마스코트 (스테이지마다 다른 모습)
  var STAGE_MASCOT = ['ETGW', 'DPVC', 'EPVW', 'DTGC'];

  var $app = document.getElementById('app');
  var $toast = document.getElementById('toast');

  var KEY_PROGRESS = 'ait-progress-v1';
  var KEY_RESULT = 'ait-result-v1';
  var KEY_FRIEND = 'ait-friend-v1';

  var state = { order: [], answers: {}, idx: 0 };
  var timers = [];

  // ───── 저장소 (막혀 있어도 동작하도록 try/catch) ─────
  function lsGet(store, key) {
    try { var v = store.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function lsSet(store, key, val) { try { store.setItem(key, JSON.stringify(val)); } catch (e) { /* 무시 */ } }
  function lsDel(store, key) { try { store.removeItem(key); } catch (e) { /* 무시 */ } }
  var local = (function () { try { return window.localStorage; } catch (e) { return null; } })() || { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
  var session = (function () { try { return window.sessionStorage; } catch (e) { return null; } })() || { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };

  function saveProgress() { lsSet(local, KEY_PROGRESS, { order: state.order, answers: state.answers, idx: state.idx }); }
  function loadProgress() {
    var p = lsGet(local, KEY_PROGRESS);
    if (!p || !Array.isArray(p.order) || p.order.length !== TOTAL || typeof p.answers !== 'object') return null;
    var ok = p.order.every(function (id) { return !!Q_BY_ID[id]; });
    return ok ? p : null;
  }
  function clearProgress() { lsDel(local, KEY_PROGRESS); }

  // ───── 유틸 ─────
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function clearTimers() { timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); timers = []; }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function mount(node) {
    clearTimers();
    var old = document.querySelector('.confetti');
    if (old) old.remove();
    $app.replaceChildren(node);
    window.scrollTo(0, 0);
    var h = node.querySelector('h1, h2, .bubble p');
    if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }
  }
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { $toast.classList.remove('show'); }, 2200);
  }
  function validCode(c) { return typeof c === 'string' && !!BY_CODE[c]; }
  function prefersReducedMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function baseUrl() { return location.origin + location.pathname; }

  // ───── 진행 / 채점 ─────
  function buildOrder() {
    var order = [];
    for (var s = 0; s < STAGES.length; s++) {
      var ids = QUESTIONS.filter(function (q) { return q.stage === s; }).map(function (q) { return q.id; });
      order = order.concat(shuffle(ids));
    }
    return order;
  }
  function startNew() {
    state.order = buildOrder();
    state.answers = {};
    state.idx = 0;
    clearProgress();
  }
  function answeredCount() { return Object.keys(state.answers).length; }

  function compute() {
    var counts = {};
    Object.keys(LETTER_NAME).forEach(function (k) { counts[k] = 0; });
    QUESTIONS.forEach(function (q) {
      var pick = state.answers[q.id];
      if (pick === 'A' || pick === 'B') counts[q[pick].s]++;
    });
    var code = AXES.map(function (ax) {
      return counts[ax.left.k] >= counts[ax.right.k] ? ax.left.k : ax.right.k;
    }).join('');
    return { code: code, counts: counts };
  }
  function strengthLabel(n) { return n >= 6 ? '확고함' : (n === 5 ? '꽤 뚜렷함' : '아슬아슬'); }

  function relation(mine, other) {
    if (mine === other) return { title: '쌍둥이 유형!', text: 'AI 쓰는 방식이 똑같아요. 꿀팁을 서로 교환해 보세요.' };
    var t = BY_CODE[mine];
    if (t.match === other) return { title: '찰떡 궁합!', text: '서로 부족한 부분을 채워 주는 조합이에요.' };
    if (t.rival === other) return { title: '상극!', text: '4개 축이 전부 달라요. 서로의 AI 사용법이 신기할 거예요.' };
    var same = 0;
    for (var i = 0; i < 4; i++) if (mine.charAt(i) === other.charAt(i)) same++;
    var text = same >= 3 ? '꽤 비슷한 AI 메이트예요.' : (same === 2 ? '반반 닮은 사이예요.' : '서로 다른 매력이 있어요.');
    return { title: same + '개 축이 같아요', text: text };
  }
  function matchNote(otherCode) {
    var o = otherCode.split('');
    var a = o[0] === 'E' ? '일단 시도해 보는 추진력' : '차근차근 설계하는 꼼꼼함';
    var c = o[2] === 'V' ? '한 번 더 확인하는 신중함' : '빠르게 믿고 가는 속도';
    return a + ' + ' + c + '이 내 빈틈을 채워 줘요.';
  }
  function rivalNote(otherCode) {
    var o = otherCode.split('');
    return (o[1] === 'T' ? '도구' : '파트너') + '로 ' + (o[3] === 'W' ? '일' : '놀이') + '에 쓰는 사람. 나와 정반대라 서로가 신기해요.';
  }

  // ───── 화면: 표지 ─────
  function viewCover() {
    var saved = loadProgress();
    var savedCount = saved ? Object.keys(saved.answers).length : 0;
    var hasSaved = saved && savedCount > 0 && savedCount < TOTAL;
    var friend = session.getItem(KEY_FRIEND);
    var friendType = validCode(friend) ? BY_CODE[friend] : null;

    var node = el(
      '<section class="screen cover">' +
        '<div class="cover-head">' +
          '<span class="pill">AI 사용 성향 테스트</span>' +
          (friendType ? '<div class="friend-banner">친구는 <b>' + friendType.nick + '</b> (' + friendType.code + ') 유형이래요. 나는 어떤 유형일까요?</div>' : '') +
          '<h1 class="title">나는 어떤<br><em>AI 유형</em>?</h1>' +
          '<p class="sub">28문항, 5분이면 끝나는<br>AI 사용 성향 테스트</p>' +
        '</div>' +
        '<div class="cover-art" id="coverArt">' + window.mascotSVG('EPGC') + '</div>' +
        '<div class="cover-actions">' +
          '<button class="btn primary" id="startBtn" type="button">테스트 시작하기</button>' +
          (hasSaved ? '<button class="btn ghost" id="resumeBtn" type="button">이어서 하기 (' + savedCount + ' / ' + TOTAL + ')</button>' : '') +
          '<a class="btn ghost" href="#/types">16가지 유형 미리보기</a>' +
          '<p class="notice">정답은 없어요. 평소 모습 그대로 골라 주세요.<br>답변은 서버로 보내지 않고 내 기기에만 저장돼요.</p>' +
        '</div>' +
      '</section>');
    mount(node);

    node.querySelector('#startBtn').addEventListener('click', function () {
      startNew();
      location.hash = '#/quiz';
    });
    var resume = node.querySelector('#resumeBtn');
    if (resume) resume.addEventListener('click', function () {
      state.order = saved.order; state.answers = saved.answers;
      state.idx = Math.min(savedCount, TOTAL - 1);
      location.hash = '#/quiz';
    });

    // 표지 캐릭터가 4축 파츠를 바꿔 가며 순환
    if (!prefersReducedMotion()) {
      var art = node.querySelector('#coverArt');
      var i = 0;
      var t = setInterval(function () {
        i = (i + 1) % TYPES.length;
        art.innerHTML = window.mascotSVG(TYPES[(i * 5) % TYPES.length].code);
      }, 1700);
      timers.push(t);
    }
  }

  // ───── 화면: 문항 ─────
  function ensureSession() {
    if (state.order.length !== TOTAL || state.idx >= TOTAL) {
      var p = loadProgress();
      var cnt = p ? Object.keys(p.answers).length : 0;
      if (p && cnt > 0 && cnt < TOTAL && state.order.length === 0) {
        state.order = p.order; state.answers = p.answers; state.idx = Math.min(cnt, TOTAL - 1);
      } else {
        startNew();
      }
    }
  }

  function viewQuiz() {
    ensureSession();
    var q = Q_BY_ID[state.order[state.idx]];
    var stage = q.stage;
    var ax = AXES[stage];
    var chosen = state.answers[q.id];

    var node = el(
      '<section class="screen quiz">' +
        '<header class="quiz-head">' +
          '<button class="icon-btn" id="backBtn" type="button" aria-label="이전 문항"' + (state.idx === 0 ? ' disabled' : '') + '>←</button>' +
          '<div class="stage-chip"><b style="background:' + ax.color + '">STAGE ' + (stage + 1) + '</b>' + STAGES[stage].name + '</div>' +
          '<div class="count" aria-label="진행 상황">' + (state.idx + 1) + ' / ' + TOTAL + '</div>' +
        '</header>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + TOTAL + '" aria-valuenow="' + state.idx + '"><i style="width:' + (state.idx / TOTAL * 100) + '%"></i></div>' +
        '<div class="ask">' +
          '<div class="mini">' + window.mascotSVG(STAGE_MASCOT[stage]) + '</div>' +
          '<div class="bubble"><p>' + q.text + '</p></div>' +
        '</div>' +
        '<div class="opts">' +
          '<button class="opt' + (chosen === 'A' ? ' selected' : '') + '" type="button" data-pick="A"><span class="badge">A</span><span>' + q.A.t + '</span></button>' +
          '<button class="opt' + (chosen === 'B' ? ' selected' : '') + '" type="button" data-pick="B"><span class="badge">B</span><span>' + q.B.t + '</span></button>' +
        '</div>' +
        '<p class="kbd-hint">키보드 A, B 키로도 고를 수 있어요 · ← 이전</p>' +
      '</section>');
    mount(node);

    // 진행 바가 이전 위치에서 차오르도록
    var fill = node.querySelector('.bar i');
    fill.style.width = (Math.max(state.idx - 1, 0) / TOTAL * 100) + '%';
    requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = (state.idx / TOTAL * 100) + '%'; }); });

    var locked = false;
    function pick(letter) {
      if (locked) return;
      locked = true;
      state.answers[q.id] = letter;
      node.querySelectorAll('.opt').forEach(function (b) { b.classList.toggle('selected', b.dataset.pick === letter); });
      state.idx++;
      saveProgress();
      later(function () {
        if (state.idx >= TOTAL) { viewStageClear(stage, true); }
        else if (state.idx % PER_STAGE === 0) { viewStageClear(stage, false); }
        else { viewQuiz(); }
      }, prefersReducedMotion() ? 0 : 280);
    }
    node.querySelectorAll('.opt').forEach(function (b) {
      b.addEventListener('click', function () { pick(b.dataset.pick); });
    });
    node.querySelector('#backBtn').addEventListener('click', function () {
      if (state.idx > 0 && !locked) { state.idx--; saveProgress(); viewQuiz(); }
    });
    viewQuiz.onKey = function (e) {
      if (locked) return;
      var k = e.key.toLowerCase();
      if (k === 'a' || k === '1') pick('A');
      else if (k === 'b' || k === '2') pick('B');
      else if (k === 'arrowleft' && state.idx > 0) { state.idx--; saveProgress(); viewQuiz(); }
    };
  }

  function confetti() {
    if (prefersReducedMotion()) return;
    var box = document.createElement('div');
    box.className = 'confetti';
    var cols = ['#6C5CE7', '#FF6FA5', '#2DD4BF', '#FF9F43', '#FFD84D'];
    for (var i = 0; i < 28; i++) {
      var s = document.createElement('span');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = cols[i % cols.length];
      s.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
      s.style.animationDelay = (Math.random() * .4) + 's';
      box.appendChild(s);
    }
    document.body.appendChild(box);
    later(function () { box.remove(); }, 3600);
  }

  function viewStageClear(stage, isLast) {
    viewQuiz.onKey = null;
    var ax = AXES[stage];
    var l = 0, r = 0;
    QUESTIONS.forEach(function (q) {
      if (q.stage !== stage) return;
      var p = state.answers[q.id];
      if (!p) return;
      if (q[p].s === ax.left.k) l++; else r++;
    });
    var win = l >= r ? ax.left.k : ax.right.k;
    var node = el(
      '<section class="screen clear">' +
        '<h2>STAGE ' + (stage + 1) + ' <span>CLEAR!</span></h2>' +
        '<div class="art">' + window.mascotSVG(STAGE_MASCOT[stage]) + '</div>' +
        '<p class="feedback">' + FEEDBACK[stage][win] + '</p>' +
        '<p class="next">' + (isLast ? '모든 스테이지 완료! 이제 결과를 확인해 볼까요?' : STAGES[stage].next) + '</p>' +
        '<button class="btn primary" id="nextBtn" type="button">' + (isLast ? '내 유형 확인하기' : '다음 스테이지로') + '</button>' +
      '</section>');
    mount(node);
    confetti();
    node.querySelector('#nextBtn').addEventListener('click', function () {
      if (isLast) finish(); else viewQuiz();
    });
  }

  // ───── 화면: 로딩 → 결과 ─────
  function finish() {
    var res = compute();
    lsSet(local, KEY_RESULT, res);
    clearProgress();
    state.order = []; state.answers = {}; state.idx = 0;

    var msgs = ['프롬프트 습관 스캔 중', 'AI와의 케미 계산 중', '유형 카드 인쇄 중'];
    var node = el(
      '<section class="screen loading">' +
        '<div class="art">' + window.mascotSVG('DTVW') + '</div>' +
        '<p><span id="loadMsg">' + msgs[0] + '</span><span class="dots"></span></p>' +
      '</section>');
    mount(node);
    var msgEl = node.querySelector('#loadMsg');
    var n = 0;
    var wait = prefersReducedMotion() ? 600 : 2400;
    var t = setInterval(function () { n = (n + 1) % msgs.length; msgEl.textContent = msgs[n]; }, 800);
    timers.push(t);
    later(function () { location.hash = '#/result'; }, wait);
  }

  function codeChips(code) {
    return '<div class="code" aria-label="유형 코드 ' + code.split('').join('-') + '">' +
      code.split('').map(function (k) { return '<span style="background:' + LETTER_COLOR[k] + '">' + k + '</span>'; }).join('') +
      '</div>';
  }

  function axisBars(counts) {
    return AXES.map(function (ax) {
      var l = counts[ax.left.k], r = counts[ax.right.k];
      var win = Math.max(l, r);
      var lw = l / PER_STAGE * 100;
      return '<div class="axis-row">' +
        '<div class="axis-top"><span>' + ax.name + '</span><small>' + strengthLabel(win) + '</small></div>' +
        '<div class="axis-bar" role="img" aria-label="' + ax.left.name + ' ' + l + ' 대 ' + ax.right.name + ' ' + r + '">' +
          '<i class="l' + (r === 0 || l === 0 ? ' full' : '') + '" style="width:' + lw + '%;background:' + ax.color + '"></i>' +
          '<i style="flex:1;background:repeating-linear-gradient(135deg,' + ax.color + ' 0 7px,rgba(255,255,255,.55) 7px 14px)"></i>' +
        '</div>' +
        '<div class="axis-nums"><span' + (l >= r ? ' class="win"' : '') + '>' + ax.left.name + ' <b>' + l + '</b></span><span' + (r > l ? ' class="win"' : '') + '><b>' + r + '</b> ' + ax.right.name + '</span></div>' +
      '</div>';
    }).join('');
  }

  function relCard(code, kind) {
    var t = BY_CODE[code];
    return '<a class="rel-card ' + kind + '" href="#/type/' + code + '">' +
      '<div class="m">' + window.mascotSVG(code) + '</div>' +
      '<div class="t"><small>' + (kind === 'match' ? '찰떡 궁합' : '상극') + ' · ' + code + '</small><b>' + t.nick + '</b>' +
      '<span>' + (kind === 'match' ? matchNote(code) : rivalNote(code)) + '</span></div></a>';
  }

  // mode: 'mine' | 'shared' | 'dex'
  function viewType(code, mode, counts) {
    var t = BY_CODE[code];
    var friend = session.getItem(KEY_FRIEND);
    var showCompare = mode === 'mine' && validCode(friend);
    var html = '<section class="screen result">';

    if (mode === 'dex') html += '<div class="topbar"><a class="back" href="#/types">← 유형 도감</a></div>';
    else html += '<div class="topbar"><span class="pill">나는 어떤 AI 유형?</span></div>';

    if (mode === 'shared') html += '<div class="banner">친구가 공유한 결과예요. 나는 어떤 유형일까요?</div>';

    html += '<div class="hero"><div class="flip"><div class="art">' + window.mascotSVG(code) + '</div></div>' +
      codeChips(code) + '<h1>' + t.nick + '</h1><p class="tagline">' + t.tagline + '</p></div>';

    if (mode === 'mine' && counts) {
      html += '<div class="panel"><h3><i></i>내 축별 성향</h3>' + axisBars(counts) + '</div>';
    }
    if (showCompare) {
      var rel = relation(code, friend);
      var ft = BY_CODE[friend];
      html += '<div class="panel compare"><h3><i></i>친구와 나의 궁합</h3>' +
        '<p>친구 <b>' + ft.nick + '</b> (' + friend + ') × 나 <b>' + t.nick + '</b> (' + code + ')</p>' +
        '<p class="big">' + rel.title + '</p><p>' + rel.text + '</p></div>';
    }

    html += '<div class="panel"><h3><i></i>이런 사람이에요</h3><ul>' + t.desc.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul></div>';
    html += '<div class="two">' +
      '<div class="panel"><h3><i style="background:var(--mint)"></i>이런 점이 강점이에요</h3><p>' + t.strength + '</p></div>' +
      '<div class="panel"><h3><i style="background:var(--orange)"></i>이런 점은 조심해요</h3><p>' + t.caution + '</p></div></div>';
    html += '<div class="panel"><h3><i style="background:var(--pink)"></i>AI 습관 꿀팁</h3><ul>' + t.tips.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul></div>';
    html += '<div class="rel">' + relCard(t.match, 'match') + relCard(t.rival, 'rival') + '</div>';

    html += '<div class="actions">';
    if (mode === 'mine') {
      html += '<button class="btn primary" id="saveBtn" type="button">결과 카드 저장하기</button>' +
        '<button class="btn" id="shareBtn" type="button">링크 공유하기</button>' +
        '<button class="btn ghost" id="retryBtn" type="button">다시 하기</button>' +
        '<a class="btn ghost small" href="#/types">16가지 유형 모두 보기</a>';
    } else if (mode === 'shared') {
      html += '<button class="btn primary" id="joinBtn" type="button">나도 테스트하기</button>' +
        '<a class="btn ghost small" href="#/types">16가지 유형 모두 보기</a>';
    } else {
      html += '<button class="btn primary" id="joinBtn" type="button">나도 테스트하기</button>' +
        '<a class="btn ghost small" href="#/types">유형 도감으로</a>';
    }
    html += '</div></section>';

    var node = el(html);
    mount(node);

    function on(id, fn) { var b = node.querySelector(id); if (b) b.addEventListener('click', fn); }
    on('#saveBtn', function () { saveCard(code, this); });
    on('#shareBtn', function () { shareLink(code); });
    on('#retryBtn', function () {
      session.removeItem(KEY_FRIEND);
      lsDel(local, KEY_RESULT);
      location.hash = '#/';
    });
    on('#joinBtn', function () {
      if (mode === 'shared') session.setItem(KEY_FRIEND, code);
      startNew();
      location.hash = '#/quiz';
    });
  }

  function viewResult() {
    var r = lsGet(local, KEY_RESULT);
    if (!r || !validCode(r.code) || !r.counts) { location.hash = '#/'; return; }
    viewType(r.code, 'mine', r.counts);
  }

  function viewTypes() {
    var cards = TYPES.map(function (t) {
      return '<a class="dex-card" href="#/type/' + t.code + '"><div class="m">' + window.mascotSVG(t.code) + '</div>' +
        '<small>' + t.code + '</small><b>' + t.nick + '</b></a>';
    }).join('');
    var node = el(
      '<section class="screen dex">' +
        '<div class="topbar"><a class="back" href="#/">← 처음으로</a></div>' +
        '<div class="dex-head"><h1>AI 유형 도감</h1><p>16가지 유형, 나는 어디에 들어갈까요?</p></div>' +
        '<div class="dex-grid">' + cards + '</div>' +
        '<button class="btn primary" id="goBtn" type="button">테스트 시작하기</button>' +
      '</section>');
    mount(node);
    node.querySelector('#goBtn').addEventListener('click', function () { startNew(); location.hash = '#/quiz'; });
  }

  // ───── 공유 ─────
  function shareLink(code) {
    var t = BY_CODE[code];
    var url = baseUrl() + '#/result/' + code;
    var text = '나는 ' + t.nick + ' (' + code + ')! 너는 어떤 AI 유형이야?';
    if (navigator.share) {
      navigator.share({ title: '나는 어떤 AI 유형?', text: text, url: url }).catch(function () { /* 사용자가 취소 */ });
      return;
    }
    copyText(text + '\n' + url);
  }
  function copyText(str) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = str; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      toast(ok ? '링크를 복사했어요!' : '복사하지 못했어요. 주소창의 링크를 직접 복사해 주세요.');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(str).then(function () { toast('링크를 복사했어요!'); }, fallback);
    } else { fallback(); }
  }

  // 결과 카드 이미지 (1080 x 1350)
  function wrapText(ctx, text, maxW) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else { cur = test; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function makeCard(code) {
    var t = BY_CODE[code];
    var FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
    var fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load('800 40px ' + FONT), document.fonts.load('900 40px ' + FONT)]).catch(function () {})
      : Promise.resolve();
    return fontsReady.then(function () {
      return new Promise(function (resolve, reject) {
        var svg = window.mascotSVG(code).replace('<svg ', '<svg width="660" height="720" ');
        var img = new Image();
        img.onload = function () {
          var W = 1080, H = 1350;
          var c = document.createElement('canvas'); c.width = W; c.height = H;
          var x = c.getContext('2d');
          x.fillStyle = '#F7F5FF'; x.fillRect(0, 0, W, H);
          x.fillStyle = '#E3DEFF';
          for (var gx = 20; gx < W; gx += 40) for (var gy = 20; gy < H; gy += 40) { x.beginPath(); x.arc(gx, gy, 3, 0, 7); x.fill(); }
          // 카드
          x.fillStyle = '#1F1B2E'; roundRect(x, 60, 76, 960, 1196, 56); x.fill();
          x.fillStyle = '#fff'; roundRect(x, 60, 60, 960, 1196, 56); x.fill();
          x.lineWidth = 8; x.strokeStyle = '#1F1B2E'; x.stroke();
          x.textAlign = 'center'; x.textBaseline = 'alphabetic';
          x.fillStyle = '#6C5CE7'; x.font = '800 40px ' + FONT; x.fillText('나는 어떤 AI 유형?', W / 2, 140);
          x.drawImage(img, W / 2 - 330, 160, 660, 720);
          // 코드 칩
          var chip = 96, gap = 16, startX = W / 2 - (chip * 4 + gap * 3) / 2;
          code.split('').forEach(function (k, i) {
            var cx = startX + i * (chip + gap);
            x.fillStyle = LETTER_COLOR[k]; roundRect(x, cx, 890, chip, chip, 26); x.fill();
            x.lineWidth = 6; x.strokeStyle = '#1F1B2E'; x.stroke();
            x.fillStyle = '#fff'; x.font = '800 54px ' + FONT; x.fillText(k, cx + chip / 2, 890 + 68);
          });
          x.fillStyle = '#1F1B2E'; x.font = '900 82px ' + FONT; x.fillText(t.nick, W / 2, 1100);
          x.fillStyle = '#5B5675'; x.font = '700 38px ' + FONT;
          wrapText(x, t.tagline, 820).slice(0, 2).forEach(function (ln, i) { x.fillText(ln, W / 2, 1164 + i * 50); });
          x.fillStyle = '#1F1B2E'; x.font = '800 32px ' + FONT;
          x.fillText(baseUrl().replace(/^https?:\/\//, '').replace(/index\.html$/, ''), W / 2, 1318);
          c.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error('이미지를 만들지 못했어요.')); }, 'image/png');
        };
        img.onerror = function () { reject(new Error('이미지를 불러오지 못했어요.')); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    });
  }
  function saveCard(code, btn) {
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = '카드 만드는 중...';
    makeCard(code).then(function (blob) {
      var file = null;
      try { file = new File([blob], 'ai-type-' + code + '.png', { type: 'image/png' }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        return navigator.share({ files: [file], title: '나는 어떤 AI 유형?' }).catch(function () {});
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'ai-type-' + code + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast('결과 카드를 저장했어요!');
    }).catch(function (e) { toast(e.message || '저장하지 못했어요.'); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  }

  // ───── 라우터 ─────
  function route() {
    viewQuiz.onKey = null;
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    var page = parts[0], arg = (parts[1] || '').toUpperCase();
    switch (page) {
      case 'quiz': return viewQuiz();
      case 'result':
        if (arg) { return validCode(arg) ? viewType(arg, 'shared') : viewCover(); }
        return viewResult();
      case 'types': return viewTypes();
      case 'type': return validCode(arg) ? viewType(arg, 'dex') : viewTypes();
      default: return viewCover();
    }
  }

  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (viewQuiz.onKey) viewQuiz.onKey(e);
  });
  route();
})();
