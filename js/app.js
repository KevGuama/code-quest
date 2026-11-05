/*
 * Young Engineers – The Code Quest
 * App: draws every screen and connects buttons to the quiz engine.
 * Student-typed text (their name) is only ever inserted with textContent,
 * never as HTML.
 */
(function () {
  'use strict';

  var Data = window.CodeQuestData;
  var Quiz = window.QuizEngine;
  var Art = window.CodeQuestArt;
  var MAX_TRIES = Quiz.MAX_ATTEMPTS;
  var LETTERS = ['A', 'B', 'C', 'D'];
  var RING_C = 2 * Math.PI * 80; // ring circumference (radius 80)

  var storage = getStorage();
  var engine = Quiz.create(Data.PAGES, storage);

  var screen = document.getElementById('screen');
  var topbar = document.getElementById('topbar');
  var confettiBox = document.getElementById('confetti');
  var live = document.createElement('div'); // screen-reader announcements
  live.className = 'sr-only';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);

  /* ───────────── helpers ───────────── */
  function getStorage() {
    try {
      var s = window.sessionStorage; // cleared when the tab closes: safe on shared school computers
      s.setItem('__cq_test', '1');
      s.removeItem('__cq_test');
      return s;
    } catch (e) {
      return null;
    }
  }

  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Tiny element builder. "html" is for trusted static SVG only.
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }

  function announce(text) {
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 30);
  }

  function countUp(el, to, ms, suffix) {
    suffix = suffix || '';
    if (reduceMotion() || to === 0) { el.textContent = to + suffix; return; }
    var steps = Math.max(1, Math.min(to, 40));
    var i = 0;
    var timer = setInterval(function () {
      i += 1;
      el.textContent = Math.round((to * i) / steps) + suffix;
      if (i >= steps) clearInterval(timer);
    }, ms / steps);
  }

  function showToast(text) {
    var t = h('div', { class: 'toast', role: 'status', text: text });
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('toast--out'); }, 3200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3700);
  }

  /* ───────────── celebrations ───────────── */
  var COLORS = ['#e0553a', '#ffc857', '#7fa3ab', '#6f6a94', '#a3b5a0', '#d9b78a', '#ffffff'];

  function confetti(count) {
    if (reduceMotion() || !confettiBox) return;
    var pieces = [];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i');
      var size = 6 + Math.random() * 8;
      p.style.left = Math.random() * 100 + '%';
      p.style.width = size + 'px';
      p.style.height = (Math.random() < 0.5 ? size : size * 0.45) + 'px';
      p.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      p.style.borderRadius = Math.random() < 0.3 ? '50%' : '2px';
      p.style.animationDuration = 1.8 + Math.random() * 1.8 + 's';
      p.style.animationDelay = Math.random() * 0.6 + 's';
      p.style.setProperty('--drift', Math.round((Math.random() - 0.5) * 220) + 'px');
      p.style.setProperty('--spin', Math.round(360 + Math.random() * 720) + 'deg');
      pieces.push(p);
      frag.appendChild(p);
    }
    confettiBox.appendChild(frag);
    setTimeout(function () {
      pieces.forEach(function (p) { if (p.parentNode) p.parentNode.removeChild(p); });
    }, 5000);
  }

  function launchRocket() {
    if (reduceMotion()) return;
    var r = h('div', { class: 'launch', html: Art.rocket() });
    document.body.appendChild(r);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 2500);
  }

  /* ───────────── top bar ───────────── */
  function renderTopbar(view) {
    if (view === 'welcome') {
      topbar.hidden = true;
      topbar.replaceChildren();
      return;
    }
    topbar.hidden = false;

    var steps = h('ol', { class: 'steps', 'aria-label': 'Quest progress' });
    engine.pages.forEach(function (p, i) {
      var done = engine.lockedCountOnPage(i) === p.questions.length && (i < engine.pageIndex || view !== 'quiz' || i < engine.pageIndex);
      if (view === 'final') done = true;
      if (i < engine.pageIndex) done = true;
      var current = i === engine.pageIndex && view !== 'final';
      var pct = view === 'final' || i < engine.pageIndex ? 100 : Math.round((engine.lockedCountOnPage(i) / p.questions.length) * 100);
      var li = h('li', {
        class: 'step' + (done ? ' is-done' : '') + (current ? ' is-current' : ''),
        'aria-current': current ? 'step' : null
      },
        h('div', { class: 'step__label' },
          h('span', { class: 'step__num', text: done ? '✓' : String(p.id) }),
          h('span', { class: 'step__title', text: 'Page ' + p.id })
        ),
        h('div', { class: 'step__bar', role: 'progressbar', 'aria-label': 'Page ' + p.id + ' progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) },
          h('span', { class: 'step__fill', style: 'width:' + pct + '%' })
        )
      );
      steps.appendChild(li);
    });

    var restartBtn = h('button', { type: 'button', class: 'btn btn--ghost', text: 'Restart', onclick: confirmRestart });
    topbar.replaceChildren(
      h('div', { class: 'topbar__inner' },
        h('div', { class: 'topbar__row' },
          h('div', { class: 'brand' },
            h('span', { html: Art.brandMark() }),
            h('span', { class: 'brand__text' }, 'YOUNG ENGINEERS', h('small', { text: 'THE CODE QUEST' }))
          ),
          h('span', { class: 'topbar__spacer' }),
          h('span', { class: 'chip-name', title: engine.name, text: engine.name }),
          view === 'final' ? null : restartBtn
        ),
        steps
      )
    );
  }

  function confirmRestart() {
    if (window.confirm('Start over from the beginning? Your progress so far will be cleared.')) {
      engine.restart();
      render({ focus: '[data-autofocus]' });
      window.scrollTo(0, 0);
    }
  }

  /* ───────────── welcome ───────────── */
  function buildWelcome() {
    var scene = h('div', { class: 'welcome__scene', 'aria-hidden': 'true' });
    scene.innerHTML =
      Art.gear('gear-a', '#d9b78a') +
      Art.gear('gear-b', '#7fa3ab') +
      Art.rocket() +
      Art.robot('happy') +
      Art.chip() +
      '<span class="star" style="left:6%;top:14px">✦</span>' +
      '<span class="star" style="left:88%;top:6px;animation-delay:.8s">✦</span>' +
      '<span class="star" style="left:34%;top:70px;animation-delay:1.4s">✧</span>' +
      '<span class="star" style="left:70%;top:90px;animation-delay:.3s">✧</span>';

    var input = h('input', {
      id: 'student-name', name: 'student-name', type: 'text', maxlength: '40',
      autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'go',
      placeholder: 'e.g. Wanjiru Kamau', 'aria-describedby': 'name-error', required: true
    });
    var error = h('p', { id: 'name-error', class: 'field-error', role: 'alert' });

    var form = h('form', { class: 'name-card', novalidate: true, onsubmit: onStart },
      h('label', { for: 'student-name', text: "What's your name, Engineer?" }),
      input,
      error,
      h('button', { type: 'submit', class: 'btn btn--block', text: "LET'S GO! 🚀" })
    );

    function onStart(ev) {
      ev.preventDefault();
      var res = engine.start(input.value);
      if (!res.ok) {
        error.textContent = res.error;
        input.setAttribute('aria-invalid', 'true');
        input.classList.remove('shake');
        void input.offsetWidth; // restart the shake animation
        input.classList.add('shake');
        input.focus();
        return;
      }
      render({ focus: '[data-autofocus]' });
      window.scrollTo(0, 0);
    }
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid')) {
        input.removeAttribute('aria-invalid');
        error.textContent = '';
      }
    });

    return h('section', { class: 'welcome', 'aria-labelledby': 'welcome-title' },
      scene,
      h('h1', { id: 'welcome-title', tabindex: '-1', 'data-autofocus': true },
        'WELCOME, ', h('span', { class: 'hl', text: 'YOUNG ENGINEER!' }), ' 🚀'),
      h('p', { class: 'welcome__lead', text: "Every great engineer starts with curiosity. Today, we're testing yours!" }),
      form,
      h('p', { class: 'welcome__tag', text: 'Think smart. Try again. Never stop learning.' }),
      h('p', { class: 'welcome__note', text: 'Your progress is saved while this tab stays open.' })
    );
  }

  /* ───────────── quiz question ───────────── */
  function buildQuiz() {
    var cur = engine.current();
    var q = cur.question;
    var page = cur.page;
    var s = engine.questionState(q.id);
    var locked = s.status !== 'open';
    var isLast = cur.qi === page.questions.length - 1;
    var fb = s.feedback;

    var head = h('div', { class: 'page-head' },
      h('div', { class: 'page-head__icon', 'aria-hidden': 'true', text: page.icon }),
      h('div', null,
        h('div', { class: 'page-head__section', text: 'Section ' + page.section + ' · ' + page.sectionTitle }),
        h('h2', { class: 'page-head__title', text: 'Page ' + page.id + ': ' + page.title })
      )
    );

    // options
    var opts = h('div', { class: 'options', role: 'radiogroup', 'aria-labelledby': 'q-prompt' });
    q.options.forEach(function (text, i) {
      var tried = s.tried.indexOf(i) !== -1;
      var isCorrectShown = locked && i === q.answer;
      var isSelected = !locked && s.selected === i;
      var cls = 'opt' + (q.optionsAreCode ? ' opt--code' : '');
      var mark = null;
      if (isCorrectShown) { cls += ' is-correct'; mark = '✓'; }
      else if (tried) { cls += ' is-tried'; mark = '✕'; }
      else if (isSelected) cls += ' is-selected';
      else if (locked) cls += ' is-dim';

      var label = LETTERS[i] + '. ' + text + (isCorrectShown ? ' (correct answer)' : tried ? ' (not this one)' : '');
      var btn = h('button', {
        type: 'button', class: cls, role: 'radio',
        'aria-checked': isSelected || isCorrectShown ? 'true' : 'false',
        'aria-label': label,
        disabled: locked || tried,
        'data-index': i,
        onclick: function () {
          if (engine.select(q.id, i)) render({ animate: false, focus: '.opt.is-selected' });
        }
      },
        h('span', { class: 'opt__badge', 'aria-hidden': 'true', text: LETTERS[i] }),
        h('span', { class: 'opt__text', 'aria-hidden': 'true', text: text }),
        h('span', { class: 'opt__mark', 'aria-hidden': 'true', text: mark })
      );
      opts.appendChild(btn);
    });

    // tries indicator
    var dots = h('span', { class: 'tries__dots', 'aria-hidden': 'true' });
    for (var d = 0; d < MAX_TRIES; d++) {
      var dc = 'tries__dot';
      if (d < s.attempts) dc += s.status === 'correct' && d === s.attempts - 1 ? ' is-won' : ' is-used';
      dots.appendChild(h('span', { class: dc }));
    }
    var triesText;
    if (s.status === 'correct') triesText = s.attempts === 1 ? 'Solved on your first try!' : 'Solved on try ' + s.attempts + ' of ' + MAX_TRIES;
    else if (s.status === 'revealed') triesText = 'No tries left';
    else triesText = 'Try ' + (s.attempts + 1) + ' of ' + MAX_TRIES;
    var tries = h('div', { class: 'tries' }, dots, h('span', { text: triesText }));

    // feedback
    var feedback = h('div', { class: 'feedback' }, buildFeedback(q, s, fb));

    // action button
    var action;
    if (locked) {
      action = h('button', {
        type: 'button', class: 'btn', 'data-autofocus-next': true,
        text: isLast ? 'See My Score 🏁' : 'Next Question →',
        onclick: function () {
          if (engine.next()) {
            render({ focus: engine.view === 'quiz' ? '[data-autofocus]' : '[data-autofocus]' });
            window.scrollTo(0, 0);
          }
        }
      });
    } else {
      action = h('button', {
        type: 'button', class: 'btn', text: 'Check Answer ✔', disabled: s.selected === null,
        onclick: function () { onCheck(q); }
      });
    }

    var card = h('section', { class: 'card', 'aria-labelledby': 'q-prompt' },
      h('div', { class: 'card__meta' },
        h('span', { class: 'concept', text: '🧠 ' + q.concept }),
        h('span', { class: 'qcount', text: 'Question ' + (cur.qi + 1) + ' of ' + page.questions.length })
      ),
      h('h3', { id: 'q-prompt', class: 'prompt', tabindex: '-1', 'data-autofocus': true, text: q.prompt }),
      q.code ? h('pre', { class: 'code', tabindex: '0', role: 'region', 'aria-label': 'Code example' }, h('code', { text: q.code })) : null,
      opts,
      tries,
      feedback,
      h('div', { class: 'actions' }, action)
    );

    return h('div', { class: 'quiz' }, head, card);
  }

  function buildFeedback(q, s, fb) {
    if (!fb) return null;
    if (fb.outcome === 'correct') {
      return h('div', { class: 'fb fb--good' },
        h('span', { html: Art.robot('party', 'wiggle') }),
        h('div', null,
          h('div', { class: 'fb__msg', text: fb.message }),
          h('span', { class: 'fb__label', text: 'Why it works' }),
          h('p', { text: fb.explanation })
        )
      );
    }
    if (fb.outcome === 'try-again') {
      return h('div', { class: 'fb fb--hint' },
        h('span', { html: Art.robot('think') }),
        h('div', null,
          h('div', { class: 'fb__msg', text: fb.message }),
          h('span', { class: 'fb__label', text: '💡 Hint' }),
          h('p', { text: fb.hint })
        )
      );
    }
    if (fb.outcome === 'revealed') {
      var answerText = q.options[q.answer];
      return h('div', { class: 'fb fb--reveal' },
        h('span', { html: Art.robot('happy') }),
        h('div', null,
          h('div', { class: 'fb__msg', text: fb.message }),
          h('p', { class: 'answer-line' },
            'The correct answer is ',
            q.optionsAreCode ? h('code', { text: answerText }) : '“' + answerText + '”'
          ),
          h('span', { class: 'fb__label', text: 'Why it is correct' }),
          h('p', { text: fb.explanation }),
          fb.whyWrong ? h('span', { class: 'fb__label', text: 'Why your last answer was not right' }) : null,
          fb.whyWrong ? h('p', { text: fb.whyWrong }) : null
        )
      );
    }
    return null;
  }

  function onCheck(q) {
    var res = engine.check(q.id);
    if (res.outcome === 'no-selection') {
      announce(res.message);
      return;
    }
    if (res.outcome === 'locked') {
      render({ animate: false });
      return;
    }
    var spoken = res.message + ' ' + (res.hint || res.explanation || '');
    if (res.outcome === 'revealed') spoken += ' The correct answer is ' + q.options[q.answer] + '.';
    announce(spoken);

    var focusSel = res.outcome === 'try-again' ? '.opt:not(:disabled)' : '[data-autofocus-next]';
    render({ animate: false, focus: focusSel });
    if (res.outcome === 'correct') {
      confetti(16);
      var good = screen.querySelector('.opt.is-correct');
      if (good) good.classList.add('pop');
    }
    var fbEl = screen.querySelector('.fb');
    if (fbEl && fbEl.scrollIntoView) fbEl.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  /* ───────────── page result ───────────── */
  function buildRing(score, max, level) {
    var ring = h('div', { class: 'ring ring--' + level, role: 'img', 'aria-label': 'Score: ' + score + ' out of ' + max },
      h('span', {
        html:
          '<svg viewBox="0 0 190 190" aria-hidden="true" focusable="false">' +
          '<circle class="ring__track" cx="95" cy="95" r="80"/>' +
          '<circle class="ring__value" cx="95" cy="95" r="80" stroke-dasharray="' + RING_C.toFixed(2) + '" stroke-dashoffset="' + RING_C.toFixed(2) + '" data-target="' + (RING_C * (1 - score / max)).toFixed(2) + '"/>' +
          '</svg>'
      }),
      h('div', { class: 'ring__num', 'aria-hidden': 'true' },
        h('div', null, h('b', { class: 'count', 'data-to': score, text: '0' }), h('small', { text: 'out of ' + max }))
      )
    );
    return ring;
  }

  function buildPageResult() {
    var idx = engine.pageIndex;
    var page = engine.pages[idx];
    var score = engine.pageScore(idx);
    var max = page.questions.length;
    var fb = Quiz.pageFeedback(score);
    var isLastPage = idx === engine.pages.length - 1;

    var mascot;
    if (fb.level === 'perfect') mascot = h('span', { class: 'result__mascot bounce', html: Art.rocket() });
    else if (fb.level === 'great') mascot = h('span', { class: 'result__mascot bounce', html: Art.robot('party') });
    else mascot = h('span', { class: 'result__mascot wiggle', html: Art.robot('happy') });

    var recap = h('ul', { class: 'recap', 'aria-label': 'Question recap' });
    page.questions.forEach(function (q) {
      var st = engine.questionState(q.id);
      var good = st.status === 'correct';
      recap.appendChild(h('li', null,
        h('span', { class: 'recap__icon', 'aria-hidden': 'true', text: good ? '✅' : '💡' }),
        h('span', { class: 'recap__concept', text: q.concept }),
        h('span', { class: 'recap__tag ' + (good ? 'recap__tag--good' : 'recap__tag--learn'), text: good ? (st.attempts === 1 ? 'First try!' : 'Try ' + st.attempts) : 'Review this one' })
      ));
    });

    var nextPage = engine.pages[idx + 1];
    var btnText = isLastPage ? 'See My Final Results 🏆' : 'Continue to Page ' + nextPage.id + ': ' + nextPage.title + ' →';

    return h('section', { class: 'result', 'aria-labelledby': 'result-title' },
      h('div', { class: 'page-head__section', text: 'Page ' + page.id + ' complete' }),
      h('div', { class: 'result__stage' }, buildRing(score, max, fb.level), mascot),
      h('h2', { id: 'result-title', class: fb.level === 'perfect' ? 'is-perfect' : '', tabindex: '-1', 'data-autofocus': true, text: fb.headline }),
      h('p', { class: 'result__sub', text: fb.sub }),
      recap,
      h('button', {
        type: 'button', class: 'btn', text: btnText,
        onclick: function () {
          if (engine.continueFromPageResult()) {
            render({ focus: '[data-autofocus]' });
            window.scrollTo(0, 0);
          }
        }
      })
    );
  }

  /* ───────────── final results ───────────── */
  function buildFinal() {
    var sum = engine.summary();
    var fb = Quiz.finalFeedback(sum.total, sum.max);
    var first = sum.name.split(' ')[0];

    var bars = h('ul', { class: 'pagebars', 'aria-label': 'Scores for each page' });
    sum.pages.forEach(function (p) {
      var pct = Math.round((p.score / p.max) * 100);
      bars.appendChild(h('li', null,
        h('div', { class: 'pagebars__top' },
          h('div', null,
            h('small', { text: 'SECTION ' + p.section }),
            'Page ' + p.id + ': ' + p.title
          ),
          h('span', { class: 'pagebars__score', text: p.score + '/' + p.max })
        ),
        h('div', { class: 'pagebars__bar', 'aria-hidden': 'true' }, h('span', { 'data-width': pct }))
      ));
    });

    var mascot = fb.level === 'keepgoing' || fb.level === 'ok' ? Art.robot('happy', 'wiggle') : fb.level === 'perfect' ? Art.rocket('bounce') : Art.robot('party', 'bounce');

    return h('section', { class: 'result', 'aria-labelledby': 'final-title' },
      h('div', { class: 'result__stage', style: 'max-width:150px' }, h('span', { html: mascot, style: 'display:block;width:96px' })),
      h('h2', { id: 'final-title', class: 'final__headline', tabindex: '-1', 'data-autofocus': true },
        'CONGRATULATIONS, ', h('span', { class: 'nm', text: sum.name.toUpperCase() }), '! 🎉'),
      h('p', { class: 'final__sub', text: "You've completed the Young Engineers Code Quest!" }),
      h('div', { class: 'final__stats' },
        h('div', { class: 'stat' }, h('b', { class: 'count', 'data-to': sum.total, text: '0' }), h('span', { text: 'out of ' + sum.max })),
        h('div', { class: 'stat' }, h('b', { class: 'count', 'data-to': sum.percent, 'data-suffix': '%', text: '0%' }), h('span', { text: 'overall' }))
      ),
      bars,
      h('div', { class: 'final__message', text: first + ', ' + fb.text.charAt(0).toLowerCase() + fb.text.slice(1) }),
      h('p', { class: 'final__note', text: '📌 Your results are shown on this screen only. They are not sent to your teacher yet, so take a screenshot to show them.' }),
      h('div', { class: 'final__btns' },
        h('button', { type: 'button', class: 'btn', text: 'Play again 🔁', onclick: function () { engine.restart(); render({ focus: '[data-autofocus]' }); window.scrollTo(0, 0); } })
      )
    );
  }

  /* ───────────── render ───────────── */
  function render(opts) {
    opts = opts || {};
    var view = engine.view;
    document.body.setAttribute('data-view', view);
    renderTopbar(view);

    var el;
    if (view === 'welcome') el = buildWelcome();
    else if (view === 'quiz') el = buildQuiz();
    else if (view === 'pageResult') el = buildPageResult();
    else el = buildFinal();

    if (opts.animate !== false) el.classList.add('screen-enter');
    screen.replaceChildren(el);

    if (opts.focus) {
      var target = screen.querySelector(opts.focus);
      if (target && target.focus) target.focus({ preventScroll: true });
    }

    if (view === 'pageResult' || view === 'final') animateResults(view, opts.celebrate !== false);
  }

  function animateResults(view, celebrate) {
    // number count-ups
    Array.prototype.forEach.call(screen.querySelectorAll('.count'), function (el) {
      countUp(el, Number(el.getAttribute('data-to')), 1100, el.getAttribute('data-suffix') || '');
    });
    // ring + bars grow after first paint
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var rv = screen.querySelector('.ring__value');
        if (rv) rv.style.strokeDashoffset = rv.getAttribute('data-target');
        Array.prototype.forEach.call(screen.querySelectorAll('.pagebars__bar span'), function (b) {
          b.style.width = b.getAttribute('data-width') + '%';
        });
      });
    });

    if (!celebrate) return;
    if (view === 'pageResult') {
      var score = engine.pageScore(engine.pageIndex);
      if (score === 4) { confetti(90); launchRocket(); }
      else if (score === 3) confetti(45);
      else if (score === 2) confetti(18);
    } else {
      var pct = engine.percent();
      if (pct === 100) { confetti(120); launchRocket(); }
      else if (pct >= 80) confetti(70);
      else if (pct >= 55) confetti(30);
    }
  }

  /* ───────────── start ───────────── */
  var restored = engine.view !== 'welcome';
  render({ animate: true, celebrate: false });
  if (restored) showToast('Welcome back, ' + engine.name.split(' ')[0] + '! We saved your place. 🚀');
})();
