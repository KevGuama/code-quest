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
  var Results = window.CodeQuestResults;
  var MAX_TRIES = Quiz.MAX_ATTEMPTS;
  var LETTERS = ['A', 'B', 'C', 'D'];
  var RING_C = 2 * Math.PI * 80; // ring circumference (radius 80)

  var storage = getStorage();
  var engine = Quiz.create(Data.PAGES, storage);
  var busy = false;          // a request to the results server is in flight
  var submitting = {};       // sitting number -> true while its result is being sent
  var flash = null;          // one-off message shown on the next welcome / final screen

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
      var s = window.localStorage; // survives closing the tab, so a student can resume
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

  function countUp(el, to, ms, suffix, dec) {
    suffix = suffix || '';
    dec = dec || 0;
    if (reduceMotion() || to === 0) { el.textContent = to.toFixed(dec) + suffix; return; }
    var steps = 30;
    var i = 0;
    var timer = setInterval(function () {
      i += 1;
      el.textContent = (i >= steps ? to : (to * i) / steps).toFixed(dec) + suffix;
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
    if (view === 'welcome' || view === 'welcomeBack') {
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

    topbar.replaceChildren(
      h('div', { class: 'topbar__inner' },
        h('div', { class: 'topbar__row' },
          h('div', { class: 'brand' },
            h('span', { html: Art.brandMark() }),
            h('span', { class: 'brand__text' }, 'YOUNG ENGINEERS', h('small', { text: 'THE CODE QUEST' }))
          ),
          h('span', { class: 'topbar__spacer' }),
          h('span', { class: 'chip-name', title: engine.name, text: engine.name })
        ),
        steps
      )
    );
  }

  /* ───────────── talking to the results server ───────────── */
  function friendlyError(res) {
    if (res.network) return "We couldn't reach the results server, so your quest can't start yet. Check your internet connection and try again.";
    return res.error || 'Something went wrong. Please try again.';
  }

  // Register a sitting with the server (this is what enforces the two-sitting limit), then start it here.
  function beginRemote(name, sitting, ui) {
    if (busy) return;
    busy = true;
    ui.busy(true);
    var token = Results.newToken();
    Results.begin(name, sitting, token).then(function (res) {
      busy = false;
      ui.busy(false);
      var practice = res.code === 'unconfigured';
      if (!res.ok && !practice) {
        // the server may know about finished sittings this browser has lost (cleared storage, another device)
        if ((res.code === 'already_sat' || res.code === 'passed') && res.existing && (res.existing.sitting1 || res.existing.sitting2) && engine.importServerResults(name, res.existing)) {
          flash = 'Your results from earlier were found, so we loaded them. 📋';
          render({ focus: '[data-autofocus]', celebrate: false });
          window.scrollTo(0, 0);
          return;
        }
        ui.error(friendlyError(res));
        return;
      }
      var r = engine.beginSitting({ name: name, sitting: sitting, token: token, firstSitting: res.existing && res.existing.sitting1 });
      if (!r.ok) { ui.error(r.error); return; }
      render({ focus: '[data-autofocus]' });
      window.scrollTo(0, 0);
    });
  }

  function sendResult(sittingNo) {
    if (submitting[sittingNo]) return;
    var payload = engine.submissionPayload(sittingNo);
    var st = engine.submitState(sittingNo);
    if (!payload || !st || st.state === 'sent') return;
    if (!Results.configured()) { engine.updateSubmit(sittingNo, { state: 'unconfigured' }); refreshSubmitPanel(); return; }
    submitting[sittingNo] = true;
    engine.updateSubmit(sittingNo, { state: 'sending', tries: st.tries + 1 });
    refreshSubmitPanel();
    Results.submit(payload).then(function (res) {
      submitting[sittingNo] = false;
      if (res.ok) engine.updateSubmit(sittingNo, { state: 'sent', lastError: null, message: res.duplicate ? 'Already saved earlier.' : null });
      else if (res.network) engine.updateSubmit(sittingNo, { state: 'failed', lastError: res.error || 'network', message: null });
      else engine.updateSubmit(sittingNo, { state: 'rejected', lastError: res.code || 'rejected', message: res.error || null });
      refreshSubmitPanel();
    });
  }

  function buildSubmitPanel() {
    var n = engine.sittingNumber;
    var st = engine.submitState(n);
    var el = h('div', { id: 'submit-panel', class: 'submit', role: 'status' });
    if (!st) return el;
    var sum = engine.summary(n);
    if (sum && sum.fromServer) return el; // loaded from the server: already saved there
    if (submitting[n] || st.state === 'sending' || st.state === 'pending') {
      el.className += ' submit--busy';
      el.textContent = '⏳ Saving your result for your teacher…';
    } else if (st.state === 'sent') {
      el.className += ' submit--ok';
      el.textContent = '✅ Your result has been saved for your teacher.';
    } else if (st.state === 'unconfigured') {
      el.className += ' submit--warn';
      el.textContent = '📌 Practice mode: this copy of the quest is not connected to a results sheet, so your result was NOT sent. Take a screenshot to show your teacher.';
    } else if (st.state === 'rejected') {
      el.className += ' submit--bad';
      el.appendChild(h('div', { text: '⚠️ Your result could not be saved: ' + (st.message || 'the server refused it') + ' Please tell your teacher.' }));
    } else {
      el.className += ' submit--bad';
      el.appendChild(h('div', { text: "⚠️ We couldn't save your result yet. Your score is safe on this device." }));
      el.appendChild(h('button', { type: 'button', class: 'btn btn--ghost btn--small', text: 'TRY AGAIN', onclick: function () { sendResult(n); } }));
    }
    return el;
  }

  function refreshSubmitPanel() {
    var old = document.getElementById('submit-panel');
    if (old && engine.view === 'final') { var fresh = buildSubmitPanel(); old.replaceWith(fresh); announce(fresh.textContent); }
  }

  /* ───────────── welcome ───────────── */
  function sceneEl() {
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
    return scene;
  }

  function buildWelcome() {
    var input = h('input', {
      id: 'student-name', name: 'student-name', type: 'text', maxlength: '40',
      autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'go',
      placeholder: 'e.g. Wanjiru Kamau', 'aria-describedby': 'name-error', required: true
    });
    var error = h('p', { id: 'name-error', class: 'field-error', role: 'alert', text: flash && flash.error ? flash.error : '' });
    var go = h('button', { type: 'submit', class: 'btn btn--block', text: "LET'S GO! 🚀" });

    var form = h('form', { class: 'name-card', novalidate: true, onsubmit: onStart },
      h('label', { for: 'student-name', text: "What's your name, Engineer?" }),
      input,
      error,
      go
    );

    function fail(msg) {
      error.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      input.classList.remove('shake');
      void input.offsetWidth; // restart the shake animation
      input.classList.add('shake');
      input.focus();
    }
    var ui = {
      error: fail,
      busy: function (on) { go.disabled = on; go.textContent = on ? 'CHECKING… ⏳' : "LET'S GO! 🚀"; input.readOnly = on; }
    };

    function onStart(ev) {
      ev.preventDefault();
      if (busy) return;
      var v = Quiz.validateName(input.value);
      if (!v.ok) { fail(v.error); return; }
      if (engine.profileFor(v.name)) { // this device already knows this student
        engine.openProfile(v.name);
        flash = null;
        render({ focus: '[data-autofocus]', celebrate: false });
        window.scrollTo(0, 0);
        return;
      }
      beginRemote(v.name, 1, ui);
    }
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid')) {
        input.removeAttribute('aria-invalid');
        error.textContent = '';
      }
    });

    var note = Results.configured()
      ? 'Your progress is saved on this device, so you can close the tab and come back.'
      : 'Practice mode: your progress is saved on this device, but results are not sent to a teacher.';

    return h('section', { class: 'welcome', 'aria-labelledby': 'welcome-title' },
      sceneEl(),
      h('h1', { id: 'welcome-title', tabindex: '-1', 'data-autofocus': true },
        'WELCOME, ', h('span', { class: 'hl', text: 'YOUNG ENGINEER!' }), ' 🚀'),
      h('p', { class: 'welcome__lead', text: "Every great engineer starts with curiosity. Today, we're testing yours!" }),
      form,
      h('p', { class: 'welcome__tag', text: 'Think smart. Try again. Never stop learning.' }),
      h('p', { class: 'welcome__note', text: note })
    );
  }

  function buildWelcomeBack() {
    var g = engine.greetingInfo();
    var retake = g.kind === 'retake';
    var msg = h('p', { class: 'field-error', role: 'alert' });
    var buttons = [];
    var resumeBtn = h('button', {
      type: 'button', class: 'btn btn--block', 'data-autofocus': true,
      text: retake ? 'SEE MY RESULT' : 'RESUME TEST',
      onclick: function () { engine.resume(); render({ focus: '[data-autofocus]', celebrate: false }); window.scrollTo(0, 0); }
    });
    buttons.push(resumeBtn);
    if (retake) {
      var rb = h('button', { type: 'button', class: 'btn btn--block btn--teal', text: 'START FINAL RETAKE 🚀' });
      rb.addEventListener('click', function () {
        engine.resume();
        beginRemote(engine.name, 2, {
          error: function (m) { engine.dismissGreeting(); flash = { error: m }; render({ animate: false }); },
          busy: function (on) { rb.disabled = on; resumeBtn.disabled = on; rb.textContent = on ? 'CHECKING… ⏳' : 'START FINAL RETAKE 🚀'; }
        });
      });
      buttons.push(rb);
    }
    // START NEW TEST is deliberately not offered for an unfinished sitting: it is the same sitting, not a new one.
    var notYou = h('button', { type: 'button', class: 'linkbtn', text: 'Not ' + g.name.split(' ')[0] + '? Switch student', onclick: function () { engine.dismissGreeting(); render({ focus: '[data-autofocus]' }); } });

    return h('section', { class: 'welcome', 'aria-labelledby': 'welcome-title' },
      sceneEl(),
      h('h1', { id: 'welcome-title', tabindex: '-1' }, 'WELCOME BACK, ', h('span', { class: 'hl', text: g.name.toUpperCase() }), '! 👋'),
      h('p', { class: 'welcome__lead', text: retake
        ? 'You finished your first Code Quest and you have one final retake available. Would you like to see your result or start the retake?'
        : 'Looks like you have an unfinished Code Quest. Would you like to continue where you left off?' }),
      h('div', { class: 'name-card choice-card' }, buttons, msg),
      h('p', { class: 'welcome__note' }, notYou)
    );
  }

  /* ───────────── quiz question ───────────── */
  function listAnswers(q, idxs) {
    return idxs.map(function (i) { return LETTERS[i] + '. ' + q.options[i]; }).join('  +  ');
  }

  function buildQuiz() {
    var cur = engine.current();
    var q = cur.question;
    var page = cur.page;
    var s = engine.questionState(q.id);
    var locked = s.status !== 'open';
    var isLast = cur.qi === page.questions.length - 1;
    var fb = s.feedback;
    var multi = Quiz.isMulti(q);
    var need = Quiz.needCount(q);
    var answers = Quiz.answerList(q);
    var wrongPicked = fb && fb.outcome === 'revealed' ? fb.wrongPicked : [];

    var head = h('div', { class: 'page-head' },
      h('div', { class: 'page-head__icon', 'aria-hidden': 'true', text: page.icon }),
      h('div', null,
        h('div', { class: 'page-head__section', text: (cur.sitting === 2 ? 'FINAL RETAKE · ' : '') + 'Section ' + page.section + ' · ' + page.sectionTitle }),
        h('h2', { class: 'page-head__title', text: 'Page ' + page.id + ': ' + page.title })
      )
    );

    // options
    var opts = h('div', { class: 'options' + (multi ? ' options--multi' : ''), role: multi ? 'group' : 'radiogroup', 'aria-labelledby': 'q-prompt' });
    q.options.forEach(function (text, i) {
      var tried = !multi && s.tried.indexOf(String(i)) !== -1;
      var isCorrectShown = locked && answers.indexOf(i) !== -1;
      var isSelected = !locked && s.selected.indexOf(i) !== -1;
      var wasWrong = multi && locked && wrongPicked.indexOf(i) !== -1;
      var cls = 'opt' + (q.optionsAreCode ? ' opt--code' : '') + (multi ? ' opt--multi' : '');
      var mark = null;
      if (isCorrectShown) { cls += ' is-correct'; mark = '✓'; }
      else if (tried || wasWrong) { cls += ' is-tried'; mark = '✕'; }
      else if (isSelected) { cls += ' is-selected'; if (multi) mark = '✓'; }
      else if (locked) cls += ' is-dim';

      var label = LETTERS[i] + '. ' + text + (isCorrectShown ? ' (correct answer)' : tried || wasWrong ? ' (not this one)' : '');
      var btn = h('button', {
        type: 'button', class: cls, role: multi ? 'checkbox' : 'radio',
        'aria-checked': isSelected || isCorrectShown ? 'true' : 'false',
        'aria-label': label,
        disabled: locked || tried,
        'data-index': i,
        onclick: function () {
          var r = engine.select(q.id, i);
          if (r.ok) render({ animate: false, focus: '.opt[data-index="' + i + '"]' });
          else if (r.reason === 'max') { var m = 'You can only pick ' + need + '. Tap one to un-pick it first.'; announce(m); showToast(m); }
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
    if (s.status === 'correct') triesText = (s.attempts === 1 ? 'Solved on your first try!' : 'Solved on try ' + s.attempts + ' of ' + MAX_TRIES) + ' · +' + Quiz.fmtPoints(s.pointsH) + ' pts';
    else if (s.status === 'revealed') triesText = 'No tries left · +0.00 pts';
    else triesText = 'Try ' + (s.attempts + 1) + ' of ' + MAX_TRIES + ' · worth ' + Quiz.fmtPoints(s.worthH) + ' pt' + (s.worthH === 100 ? '' : 's');
    var tries = h('div', { class: 'tries' }, dots, h('span', { text: triesText }));

    var pickNote = multi && !locked
      ? h('p', { class: 'pick-note', 'aria-live': 'polite', text: 'Select exactly ' + need + ' answers · ' + s.selected.length + ' of ' + need + ' picked' })
      : null;

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
            render({ focus: '[data-autofocus]' });
            window.scrollTo(0, 0);
          }
        }
      });
    } else {
      action = h('button', {
        type: 'button', class: 'btn', text: 'Check Answer ✔', disabled: s.selected.length !== need,
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
      pickNote,
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
      var multi = Quiz.isMulti(q);
      var answers = Quiz.answerList(q);
      var parts = answers.map(function (i) { return q.optionsAreCode ? h('code', { text: q.options[i] }) : '“' + q.options[i] + '”'; });
      var line = [multi ? 'The correct answers are ' : 'The correct answer is '];
      parts.forEach(function (p, k) { if (k) line.push(' and '); line.push(p); });
      return h('div', { class: 'fb fb--reveal' },
        h('span', { html: Art.robot('happy') }),
        h('div', null,
          h('div', { class: 'fb__msg', text: fb.message }),
          h('p', { class: 'answer-line' }, line),
          h('span', { class: 'fb__label', text: 'Why it is correct' }),
          h('p', { text: fb.explanation }),
          fb.whyWrong && fb.whyWrong.length ? h('span', { class: 'fb__label', text: multi ? 'Why your last picks were not right' : 'Why your last answer was not right' }) : null,
          fb.whyWrong && fb.whyWrong.length ? fb.whyWrong.map(function (t) { return h('p', { text: t }); }) : null
        )
      );
    }
    return null;
  }

  function onCheck(q) {
    var res = engine.check(q.id);
    if (res.outcome === 'no-selection' || res.outcome === 'wrong-count' || res.outcome === 'already-tried') {
      announce(res.message);
      showToast(res.message);
      render({ animate: false });
      return;
    }
    if (res.outcome === 'locked') {
      render({ animate: false });
      return;
    }
    var spoken = res.message + ' ' + (res.hint || res.explanation || '');
    if (res.outcome === 'revealed') spoken += ' The correct answer is ' + listAnswers(q, Quiz.answerList(q)) + '.';
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
  function buildRing(pointsH, maxH, level) {
    var score = pointsH / 100, max = maxH / 100;
    var ring = h('div', { class: 'ring ring--' + level, role: 'img', 'aria-label': 'Score: ' + Quiz.fmtPoints(pointsH) + ' out of ' + max },
      h('span', {
        html:
          '<svg viewBox="0 0 190 190" aria-hidden="true" focusable="false">' +
          '<circle class="ring__track" cx="95" cy="95" r="80"/>' +
          '<circle class="ring__value" cx="95" cy="95" r="80" stroke-dasharray="' + RING_C.toFixed(2) + '" stroke-dashoffset="' + RING_C.toFixed(2) + '" data-target="' + (RING_C * (1 - score / max)).toFixed(2) + '"/>' +
          '</svg>'
      }),
      h('div', { class: 'ring__num', 'aria-hidden': 'true' },
        h('div', null, h('b', { class: 'count', 'data-to': score, 'data-dec': 2, text: '0.00' }), h('small', { text: 'out of ' + max }))
      )
    );
    return ring;
  }

  function buildPageResult() {
    var idx = engine.pageIndex;
    var page = engine.pages[idx];
    var pH = engine.pageH(idx);
    var maxH = engine.pageMaxH[idx];
    var fb = Quiz.pageFeedback(pH, maxH);
    var isLastPage = idx === engine.pages.length - 1;

    var mascot;
    if (fb.level === 'perfect') mascot = h('span', { class: 'result__mascot bounce', html: Art.rocket() });
    else if (fb.level === 'great') mascot = h('span', { class: 'result__mascot bounce', html: Art.robot('party') });
    else mascot = h('span', { class: 'result__mascot wiggle', html: Art.robot('happy') });

    var recap = h('ul', { class: 'recap', 'aria-label': 'Question recap' });
    page.questions.forEach(function (q) {
      var st = engine.questionState(q.id);
      var good = st.status === 'correct';
      var tag = good ? (st.attempts === 1 ? 'First try! ' : 'Try ' + st.attempts + ' · ') + '+' + Quiz.fmtPoints(st.pointsH) : 'Review this one · +0.00';
      recap.appendChild(h('li', null,
        h('span', { class: 'recap__icon', 'aria-hidden': 'true', text: good ? '✅' : '💡' }),
        h('span', { class: 'recap__concept', text: q.concept }),
        h('span', { class: 'recap__tag ' + (good ? 'recap__tag--good' : 'recap__tag--learn'), text: tag })
      ));
    });

    var nextPage = engine.pages[idx + 1];
    var btnText = isLastPage ? 'See My Final Results 🏆' : 'Continue to Page ' + nextPage.id + ': ' + nextPage.title + ' →';

    return h('section', { class: 'result', 'aria-labelledby': 'result-title' },
      h('div', { class: 'page-head__section', text: 'Page ' + page.id + ' complete' }),
      h('div', { class: 'result__stage' }, buildRing(pH, maxH, fb.level), mascot),
      h('h2', { id: 'result-title', class: fb.level === 'perfect' ? 'is-perfect' : '', tabindex: '-1', 'data-autofocus': true, text: fb.headline }),
      h('p', { class: 'result__sub', text: fb.sub }),
      h('p', { class: 'contrib' },
        h('b', { text: Quiz.fmtPercent(engine.pctX100(pH)) + '%' }),
        ' of ' + Quiz.fmtPercent(engine.pctX100(maxH)) + '% · ' + Quiz.fmtPoints(pH) + ' / ' + (maxH / 100) + ' points'),
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
    var n = engine.sittingNumber;
    var sum = engine.summary(n);
    var cmp = engine.comparison();
    var first = engine.name.split(' ')[0];
    var pctText = Quiz.fmtPercent(sum.percentX100);
    var fb = Quiz.finalFeedback(sum.percentX100);
    var canRetake = engine.canRetake();

    var bars = h('ul', { class: 'pagebars', 'aria-label': 'Scores for each page' });
    sum.pages.forEach(function (p) {
      var pct = Math.round((p.pointsH / p.maxH) * 100);
      bars.appendChild(h('li', null,
        h('div', { class: 'pagebars__top' },
          h('div', null,
            h('small', { text: 'SECTION ' + p.section }),
            'Page ' + p.id + ': ' + p.title
          ),
          h('span', { class: 'pagebars__score', text: Quiz.fmtPoints(p.pointsH) + '/' + (p.maxH / 100) })
        ),
        h('div', { class: 'pagebars__sub', text: Quiz.fmtPercent(p.contributionX100) + '% of ' + Quiz.fmtPercent(p.contributionMaxX100) + '%' }),
        h('div', { class: 'pagebars__bar', 'aria-hidden': 'true' }, h('span', { 'data-width': pct }))
      ));
    });

    var mascot = fb.level === 'keepgoing' || fb.level === 'ok' ? Art.robot('happy', 'wiggle') : fb.level === 'perfect' ? Art.rocket('bounce') : Art.robot('party', 'bounce');

    var headline;
    if (canRetake) headline = h('h2', { id: 'final-title', class: 'final__headline', tabindex: '-1', 'data-autofocus': true, text: "YOUR JOURNEY ISN'T OVER! 🚀" });
    else headline = h('h2', { id: 'final-title', class: 'final__headline', tabindex: '-1', 'data-autofocus': true },
      'CONGRATULATIONS, ', h('span', { class: 'nm', text: engine.name.toUpperCase() }), '! 🎉');

    var subText = canRetake ? "You've completed your first challenge."
      : n === 2 ? "You've completed your final sitting of the Young Engineers Code Quest!"
      : "You reached the goal. Your assessment is complete, and no retake is needed.";

    var stats = h('div', { class: 'final__stats' },
      h('div', { class: 'stat' }, h('b', { class: 'count', 'data-to': sum.totalH / 100, 'data-dec': 2, text: '0.00' }), h('span', { text: 'out of ' + (sum.maxH / 100) })),
      h('div', { class: 'stat' }, h('b', { class: 'count', 'data-to': sum.percentX100 / 100, 'data-dec': 2, 'data-suffix': '%', text: '0.00%' }), h('span', { text: 'overall' }))
    );

    var counts = sum.counts ? h('p', { class: 'final__counts', text:
      '🥇 ' + sum.counts.first + ' first try  ·  🥈 ' + sum.counts.second + ' second  ·  🥉 ' + sum.counts.third + ' third  ·  🔍 ' + sum.counts.revealed + ' revealed' }) : null;

    var extra = null;
    if (canRetake) {
      var msg = h('p', { class: 'field-error', role: 'alert' });
      var btn = h('button', { type: 'button', class: 'btn btn--block', text: 'START FINAL RETAKE 🚀' });
      btn.addEventListener('click', function () {
        beginRemote(engine.name, 2, {
          error: function (m) { msg.textContent = m; },
          busy: function (on) { btn.disabled = on; btn.textContent = on ? 'CHECKING… ⏳' : 'START FINAL RETAKE 🚀'; if (on) msg.textContent = ''; }
        });
      });
      extra = h('div', { class: 'retake-card' },
        h('p', null, 'You scored ', h('b', { text: pctText + '%' }), '.'),
        h('p', { text: "You have one more opportunity to improve your score. Review what you've learned and give it another shot!" }),
        h('p', { class: 'retake-card__final', text: '⚠️ This is your FINAL attempt. After it, your assessment is complete and your first result stays on record.' }),
        btn, msg);
    } else if (cmp) {
      var improved = cmp.diffX100 > 0, same = cmp.diffX100 === 0;
      extra = h('div', { class: 'compare', 'aria-label': 'Comparison of your two sittings' },
        h('div', { class: 'compare__row' }, h('span', { text: 'First attempt' }), h('b', { text: Quiz.fmtPercent(cmp.firstX100) + '%' })),
        h('div', { class: 'compare__row' }, h('span', { text: 'Final retake' }), h('b', { text: Quiz.fmtPercent(cmp.secondX100) + '%' })),
        h('div', { class: 'compare__row compare__row--diff ' + (improved ? 'is-up' : same ? '' : 'is-down') },
          h('span', { text: improved ? 'Improvement' : same ? 'Difference' : 'Change' }),
          h('b', { text: Quiz.fmtSignedPercent(cmp.diffX100) + ' percentage points' + (improved ? '!' : '') })),
        h('div', { class: 'compare__row compare__row--best' }, h('span', { text: 'Best score' }), h('b', { text: Quiz.fmtPercent(cmp.bestX100) + '% (sitting ' + cmp.bestSitting + ')' }))
      );
    }

    var message;
    if (canRetake) message = null;
    else if (cmp) message = cmp.diffX100 > 0
      ? "You've demonstrated persistence and growth. Keep engineering!"
      : cmp.diffX100 === 0 ? 'You scored the same both times. You kept going and finished both sittings, and that takes persistence. Keep engineering!'
      : 'Your first sitting was your best, and that is the score that counts. Every attempt teaches you something. Keep engineering!';
    else message = first + ', ' + fb.text.charAt(0).toLowerCase() + fb.text.slice(1);

    var switchBtn = h('button', { type: 'button', class: 'linkbtn', text: 'Not ' + first + '? Switch student', onclick: function () { engine.dismissGreeting(); render({ focus: '[data-autofocus]' }); window.scrollTo(0, 0); } });

    var flashEl = flash && typeof flash === 'string' ? h('p', { class: 'final__note', text: flash }) : null;
    flash = null;

    return h('section', { class: 'result', 'aria-labelledby': 'final-title' },
      h('div', { class: 'page-head__section', text: 'Sitting ' + n + ' of 2 · ' + (canRetake ? 'Final retake available' : 'Assessment complete') }),
      h('div', { class: 'result__stage', style: 'max-width:150px' }, h('span', { html: mascot, style: 'display:block;width:96px' })),
      headline,
      h('p', { class: 'final__sub', text: subText }),
      stats,
      counts,
      bars,
      extra,
      message ? h('div', { class: 'final__message', text: message }) : null,
      flashEl,
      buildSubmitPanel(),
      h('div', { class: 'final__btns' }, switchBtn)
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
    else if (view === 'welcomeBack') el = buildWelcomeBack();
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
    if (view === 'final') {
      var st = engine.submitState(engine.sittingNumber);
      var sum = engine.summary(engine.sittingNumber);
      if (st && !(sum && sum.fromServer) && (st.state === 'pending' || st.state === 'sending')) sendResult(engine.sittingNumber);
    }
  }

  function animateResults(view, celebrate) {
    // number count-ups
    Array.prototype.forEach.call(screen.querySelectorAll('.count'), function (el) {
      countUp(el, Number(el.getAttribute('data-to')), 1100, el.getAttribute('data-suffix') || '', Number(el.getAttribute('data-dec')) || 0);
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
      var lvl = Quiz.pageFeedback(engine.pageH(engine.pageIndex), engine.pageMaxH[engine.pageIndex]).level;
      if (lvl === 'perfect') { confetti(90); launchRocket(); }
      else if (lvl === 'great') confetti(45);
      else if (lvl === 'good') confetti(18);
    } else {
      var pct = engine.summary(engine.sittingNumber).percentX100 / 100;
      if (pct === 100) { confetti(120); launchRocket(); }
      else if (pct >= 80) confetti(70);
      else if (pct >= 55) confetti(30);
    }
  }

  /* ───────────── keep several tabs in step, and retry sending after reconnecting ───────────── */
  function syncFromStorage() {
    var typing = document.activeElement && document.activeElement.id === 'student-name';
    var before = engine.view + ':' + engine.key + ':' + engine.qi + ':' + engine.pageIndex;
    engine.reload();
    var after = engine.view + ':' + engine.key + ':' + engine.qi + ':' + engine.pageIndex;
    if (before !== after && !typing && !busy) render({ animate: false, celebrate: false });
  }
  window.addEventListener('storage', function (e) { if (e.key === Quiz.STORAGE_KEY) syncFromStorage(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) syncFromStorage(); });
  window.addEventListener('online', function () {
    if (engine.view !== 'final') return;
    var st = engine.submitState(engine.sittingNumber);
    if (st && st.state === 'failed') sendResult(engine.sittingNumber);
  });

  /* ───────────── start ───────────── */
  render({ animate: true, celebrate: false });
})();
