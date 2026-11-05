/*
 * Young Engineers – The Code Quest
 * Quiz engine: all the rules (names, attempts, locking, scoring, saving).
 * No DOM code lives here, so it can be tested on its own in Node.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_KEY = 'youngEngineers.codeQuest.phase1';
  var MAX_ATTEMPTS = 3;
  var STATE_VERSION = 1;

  var MESSAGES = {
    correct: 'CORRECT! WELL DONE! ✅',
    try1: 'Not quite! Give it another try. 💡',
    try2: "Almost there! Think carefully. You've got this!",
    revealed: "That was a tricky one! Here's the answer so you'll know it next time. 🔍",
    noSelection: 'Pick an answer first, then press Check Answer.'
  };

  /* ───────────── Name validation ───────────── */
  function validateName(raw) {
    var name = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
    if (!name) return { ok: false, error: "Please type your name so we know who's coding!" };
    if (name.length < 2) return { ok: false, error: 'Your name needs at least 2 letters.' };
    if (name.length > 40) return { ok: false, error: 'Please keep your name under 40 characters.' };
    if (!/^\p{L}[\p{L}\p{M}'’.\- ]*$/u.test(name)) {
      return { ok: false, error: 'Please use letters only (spaces, hyphens and apostrophes are fine).' };
    }
    return { ok: true, name: name };
  }

  /* ───────────── Encouraging messages ───────────── */
  function pageFeedback(score) {
    if (score >= 4) return { level: 'perfect', headline: 'YEAHHH!! PERFECT SCORE! 🥳', sub: 'You got every single one. Incredible!' };
    if (score === 3) return { level: 'great', headline: "Amazing work! You're getting there!", sub: 'Just one away from perfect. Nice!' };
    if (score === 2) return { level: 'good', headline: 'Good effort! Keep learning.', sub: 'You are halfway there. Every try teaches you something.' };
    return { level: 'keepgoing', headline: "Don't give up. Every great programmer makes mistakes!", sub: 'Mistakes are how engineers learn. On to the next page!' };
  }

  function finalFeedback(score, max) {
    var pct = max ? score / max : 0;
    if (score === max) return { level: 'perfect', text: 'A flawless run! Mission control wants to hire you.' };
    if (pct >= 0.8) return { level: 'great', text: 'Outstanding work! You really understand how programming fits together.' };
    if (pct >= 0.55) return { level: 'good', text: "Strong effort! You know a lot already, and you're getting better with every try." };
    if (pct >= 0.3) return { level: 'ok', text: 'Good progress! Look back at the questions you needed hints for, and try again to beat your score.' };
    return { level: 'keepgoing', text: 'Every great engineer starts somewhere. You finished the whole quest, and that takes courage. Try again and watch your score grow!' };
  }

  /* ───────────── Engine ───────────── */
  function create(pages, storage) {
    var questions = [];
    pages.forEach(function (p) { p.questions.forEach(function (q) { questions.push(q); }); });
    var byId = {};
    questions.forEach(function (q) { byId[q.id] = q; });
    var VIEWS = ['welcome', 'quiz', 'pageResult', 'final'];

    var state = load() || fresh();

    function fresh() {
      return { version: STATE_VERSION, name: '', view: 'welcome', page: 0, qi: 0, q: {}, finishedAt: null };
    }

    function save() {
      try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: keep going in memory */ }
    }

    function clearSaved() {
      try { if (storage) storage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    }

    function load() {
      var parsed;
      try { parsed = storage && JSON.parse(storage.getItem(STORAGE_KEY) || 'null'); } catch (e) { return null; }
      if (!parsed || parsed.version !== STATE_VERSION) return null;
      if (VIEWS.indexOf(parsed.view) === -1) return null;
      if (parsed.view === 'welcome') return null;
      if (!validateName(parsed.name).ok) return null;
      if (!Number.isInteger(parsed.page) || parsed.page < 0 || parsed.page >= pages.length) return null;
      if (!Number.isInteger(parsed.qi) || parsed.qi < 0 || parsed.qi > 3) return null;
      if (!parsed.q || typeof parsed.q !== 'object') return null;
      var ids = Object.keys(parsed.q);
      for (var i = 0; i < ids.length; i++) {
        var s = parsed.q[ids[i]];
        if (!byId[ids[i]] || !s) return null;
        if (!Number.isInteger(s.attempts) || s.attempts < 0 || s.attempts > MAX_ATTEMPTS) return null;
        if (['open', 'correct', 'revealed'].indexOf(s.status) === -1) return null;
        if (!Array.isArray(s.tried)) return null;
      }
      return parsed;
    }

    function qstate(id) {
      if (!state.q[id]) state.q[id] = { attempts: 0, status: 'open', selected: null, tried: [], feedback: null };
      return state.q[id];
    }

    function isLocked(id) { return qstate(id).status !== 'open'; }

    function snapshot() { return JSON.parse(JSON.stringify(state)); }

    function questionState(id) { return JSON.parse(JSON.stringify(qstate(id))); }

    function current() {
      var page = pages[state.page];
      return { pageIndex: state.page, page: page, qi: state.qi, question: page.questions[state.qi] };
    }

    /* ── actions ── */
    function start(rawName) {
      var v = validateName(rawName);
      if (!v.ok) return v;
      state = fresh();
      state.name = v.name;
      state.view = 'quiz';
      save();
      return { ok: true, name: v.name };
    }

    function select(qid, idx) {
      var q = byId[qid];
      if (!q) return false;
      var s = qstate(qid);
      if (s.status !== 'open') return false;
      if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) return false;
      if (s.tried.indexOf(idx) !== -1) return false;
      s.selected = idx;
      save();
      return true;
    }

    function check(qid) {
      var q = byId[qid];
      if (!q) throw new Error('Unknown question: ' + qid);
      var s = qstate(qid);
      if (s.status !== 'open') return { outcome: 'locked' };
      if (s.selected === null) return { outcome: 'no-selection', message: MESSAGES.noSelection };

      s.attempts += 1;
      var picked = s.selected;
      var fb;

      if (picked === q.answer) {
        s.status = 'correct';
        fb = { outcome: 'correct', message: MESSAGES.correct, explanation: q.explanation };
      } else {
        s.tried.push(picked);
        s.selected = null;
        if (s.attempts >= MAX_ATTEMPTS) {
          s.status = 'revealed';
          fb = {
            outcome: 'revealed',
            message: MESSAGES.revealed,
            wrongIndex: picked,
            explanation: q.explanation,
            whyWrong: q.whyWrong[picked]
          };
        } else {
          fb = {
            outcome: 'try-again',
            attempt: s.attempts,
            message: s.attempts === 1 ? MESSAGES.try1 : MESSAGES.try2,
            hint: q.hints[s.attempts - 1]
          };
        }
      }
      s.feedback = fb;
      save();
      return fb;
    }

    function next() {
      if (state.view !== 'quiz') return false;
      var q = current().question;
      if (!isLocked(q.id)) return false;
      state.qi += 1;
      if (state.qi >= pages[state.page].questions.length) {
        state.qi = pages[state.page].questions.length - 1;
        state.view = 'pageResult';
      }
      save();
      return true;
    }

    function continueFromPageResult() {
      if (state.view !== 'pageResult') return false;
      if (state.page >= pages.length - 1) {
        state.view = 'final';
        state.finishedAt = Date.now();
      } else {
        state.page += 1;
        state.qi = 0;
        state.view = 'quiz';
      }
      save();
      return true;
    }

    function restart() {
      state = fresh();
      clearSaved();
    }

    /* ── scoring ── */
    function pageScore(pageIndex) {
      return pages[pageIndex].questions.filter(function (q) { return qstate(q.id).status === 'correct'; }).length;
    }

    function totalScore() {
      var t = 0;
      for (var i = 0; i < pages.length; i++) t += pageScore(i);
      return t;
    }

    function maxScore() { return questions.length; }

    function percent() { return Math.round((totalScore() / maxScore()) * 100); }

    function lockedCountOnPage(pageIndex) {
      return pages[pageIndex].questions.filter(function (q) { return qstate(q.id).status !== 'open'; }).length;
    }

    function summary() {
      var attempts = 0, wrong = 0, revealed = [];
      questions.forEach(function (q) {
        var s = qstate(q.id);
        attempts += s.attempts;
        wrong += s.attempts - (s.status === 'correct' ? 1 : 0);
        if (s.status === 'revealed') revealed.push(q.id);
      });
      return {
        name: state.name,
        total: totalScore(),
        max: maxScore(),
        percent: percent(),
        pages: pages.map(function (p, i) {
          return { id: p.id, title: p.title, section: p.section, score: pageScore(i), max: p.questions.length };
        }),
        totalAttempts: attempts,
        wrongAttempts: wrong,
        correctCount: totalScore(),
        revealedIds: revealed,
        revealedCount: revealed.length
      };
    }

    return {
      get view() { return state.view; },
      get name() { return state.name; },
      get pageIndex() { return state.page; },
      get qi() { return state.qi; },
      pages: pages,
      questions: questions,
      snapshot: snapshot,
      questionState: questionState,
      isLocked: isLocked,
      current: current,
      start: start,
      select: select,
      check: check,
      next: next,
      continueFromPageResult: continueFromPageResult,
      restart: restart,
      pageScore: pageScore,
      totalScore: totalScore,
      maxScore: maxScore,
      percent: percent,
      lockedCountOnPage: lockedCountOnPage,
      summary: summary
    };
  }

  return {
    create: create,
    validateName: validateName,
    pageFeedback: pageFeedback,
    finalFeedback: finalFeedback,
    MESSAGES: MESSAGES,
    MAX_ATTEMPTS: MAX_ATTEMPTS,
    STORAGE_KEY: STORAGE_KEY
  };
});
