/*
 * Young Engineers – The Code Quest
 * Quiz engine v2: all the rules. No DOM code lives here, so it is tested on its own in Node.
 *
 *  - single-answer and multiple-select questions (all-or-nothing)
 *  - three attempts per question, attempt-based points (1.00 / 0.25 / 0.10 / 0.00)
 *  - exact scoring: every point value is stored as whole HUNDREDTHS of a point ("H"),
 *    so 0.25 + 0.10 + 1.00 can never drift through floating-point error
 *  - page contribution out of 25%, overall percentage out of 100%
 *  - progress saved to localStorage after every interaction (resume)
 *  - up to two sittings per student; a retake is only possible below 75%
 *
 * IMPORTANT: browser storage can be cleared by a student. The two-sitting limit is therefore
 * ALSO enforced by the Google Apps Script backend (see backend/google-apps-script.js).
 * The checks in this file are the first line of defence and keep the interface honest.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_KEY = 'youngEngineers.codeQuest.v2';
  var STATE_VERSION = 2;
  var MAX_ATTEMPTS = 3;
  var MAX_SITTINGS = 2;
  var PASS_PERCENT = 75;
  var H = 100; // hundredths of a point per point
  var POINTS_H = { 1: 100, 2: 25, 3: 10 }; // points by the attempt on which the answer was first correct
  var PAGE_VIEWS = ['quiz', 'pageResult', 'final'];
  var STATUSES = ['in_progress', 'awaiting_retake', 'completed'];
  var SUBMIT_STATES = ['pending', 'sending', 'sent', 'failed', 'rejected', 'unconfigured'];

  var MESSAGES = {
    try1: 'Not quite! Give it another try. 💡',
    try2: "Almost there! Think carefully. You've got this!",
    success: {
      1: 'WELL DONE! +1.00 POINTS! 🎉',
      2: 'YOU GOT IT! +0.25 POINTS! 👏',
      3: "THAT'S CORRECT! +0.10 POINTS! 💪"
    },
    revealed: "That was a tricky one! Here's the answer so you'll know it next time. 🔍",
    noSelection: 'Pick an answer first, then press Check Answer.',
    alreadyTried: 'You already tried that answer. Try a different one!'
  };

  /* ───────────── names ───────────── */
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

  // The identity of a student: the same on this device and on the server.
  // "Wanjiru  Kamau", "wanjiru kamau" and "WANJIRU KAMAU" are the same student.
  function nameKey(name) {
    return String(name == null ? '' : name)
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[’'.]/g, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ───────────── number formatting (all values arrive as integers) ───────────── */
  function fmtPoints(h) { return (h / H).toFixed(2); }
  function fmtPercent(x100) { return (x100 / 100).toFixed(2); }
  function fmtSignedPercent(x100) { return (x100 > 0 ? '+' : x100 < 0 ? '−' : '') + (Math.abs(x100) / 100).toFixed(2); }

  /* ───────────── question helpers ───────────── */
  function isMulti(q) { return q.type === 'multi'; }
  function answerList(q) {
    return (Array.isArray(q.answer) ? q.answer.slice() : [q.answer]).sort(function (a, b) { return a - b; });
  }
  function needCount(q) { return answerList(q).length; }
  function comboOf(list) { return list.slice().sort(function (a, b) { return a - b; }).join(','); }

  function pointsFor(s) { return s.status === 'correct' ? POINTS_H[s.attempts] || 0 : 0; }

  function pageFeedback(pointsH, maxH) {
    if (pointsH >= maxH) return { level: 'perfect', headline: 'YEAHHH!! PERFECT SCORE! 🥳', sub: 'You got every single one on your first try. Incredible!' };
    if (pointsH * 100 >= 75 * maxH) return { level: 'great', headline: "Amazing work! You're getting there!", sub: 'So close to perfect. Nice!' };
    if (pointsH * 100 >= 50 * maxH) return { level: 'good', headline: 'Good effort! Keep learning.', sub: 'You are making progress. Every try teaches you something.' };
    return { level: 'keepgoing', headline: "Don't give up. Every great programmer makes mistakes!", sub: 'Mistakes are how engineers learn. On to the next page!' };
  }

  function finalFeedback(percentX100) {
    var p = percentX100 / 100;
    if (percentX100 >= 10000) return { level: 'perfect', text: 'A flawless run! Mission control wants to hire you.' };
    if (p >= 80) return { level: 'great', text: 'Outstanding work! You really understand how programming fits together.' };
    if (p >= PASS_PERCENT) return { level: 'great', text: 'Great work! You reached the goal and you know your stuff.' };
    if (p >= 55) return { level: 'good', text: "Strong effort! You know a lot already, and you're getting better with every try." };
    if (p >= 30) return { level: 'ok', text: 'Good progress! Look back at the questions you needed hints for, then try again to beat your score.' };
    return { level: 'keepgoing', text: 'Every great engineer starts somewhere. You finished the whole quest, and that takes courage. Keep going and watch your score grow!' };
  }

  /* ───────────── engine ───────────── */
  function create(pages, storage) {
    var questions = [];
    pages.forEach(function (p) { p.questions.forEach(function (q) { questions.push(q); }); });
    var byId = {};
    var pageOf = {};
    pages.forEach(function (p, i) { p.questions.forEach(function (q) { byId[q.id] = q; pageOf[q.id] = i; }); });
    var maxH = questions.length * H;
    var pageMaxH = pages.map(function (p) { return p.questions.length * H; });

    function pctX100(h) { return Math.round((h * 10000) / maxH); } // hundredths of a percent, integer
    function isPassH(totalH) { return totalH * 100 >= PASS_PERCENT * maxH; }

    var storageOk = !!storage;
    var store = loadStore();
    var activeKey = null;
    var greeting = false;
    initFromStore();

    /* ── persistence ── */
    function emptyStore() { return { version: STATE_VERSION, lastKey: null, profiles: {} }; }

    function loadStore() {
      var parsed = null;
      try { parsed = storage ? JSON.parse(storage.getItem(STORAGE_KEY) || 'null') : null; } catch (e) { parsed = null; }
      var s = emptyStore();
      if (!parsed || parsed.version !== STATE_VERSION || !parsed.profiles || typeof parsed.profiles !== 'object') return s;
      Object.keys(parsed.profiles).forEach(function (key) {
        var p = sanitizeProfile(parsed.profiles[key], key);
        if (p) s.profiles[key] = p;
      });
      s.lastKey = parsed.lastKey && s.profiles[parsed.lastKey] ? parsed.lastKey : null;
      return s;
    }

    function save() {
      try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (e) { storageOk = false; }
    }

    function initFromStore() {
      var p = store.lastKey && store.profiles[store.lastKey];
      if (p && (p.status === 'in_progress' || p.status === 'awaiting_retake')) {
        activeKey = store.lastKey;
        greeting = true;
      } else {
        activeKey = null;
        greeting = false;
      }
    }

    function isInt(n, lo, hi) { return Number.isInteger(n) && n >= lo && n <= hi; }

    function sanitizeQuestionState(s) {
      if (!s || typeof s !== 'object') return null;
      if (!isInt(s.attempts, 0, MAX_ATTEMPTS)) return null;
      if (['open', 'correct', 'revealed'].indexOf(s.status) === -1) return null;
      if (!Array.isArray(s.selected) || !s.selected.every(function (n) { return isInt(n, 0, 3); })) return null;
      if (!Array.isArray(s.tried) || !s.tried.every(function (t) { return typeof t === 'string' && /^[0-3](,[0-3]){0,3}$/.test(t); })) return null;
      if (s.status === 'correct' && !isInt(s.attempts, 1, MAX_ATTEMPTS)) return null;
      if (s.status === 'revealed' && s.attempts !== MAX_ATTEMPTS) return null;
      return { attempts: s.attempts, status: s.status, selected: s.selected.slice(), tried: s.tried.slice(), feedback: s.feedback && typeof s.feedback === 'object' ? s.feedback : null };
    }

    function sanitizeCurrent(c) {
      if (!c || typeof c !== 'object') return null;
      if (!isInt(c.sitting, 1, MAX_SITTINGS) || typeof c.token !== 'string' || c.token.length < 8) return null;
      if (!isInt(c.page, 0, pages.length - 1) || !isInt(c.qi, 0, pages[c.page].questions.length - 1)) return null;
      if (!c.q || typeof c.q !== 'object') return null;
      var q = {};
      var ids = Object.keys(c.q);
      for (var i = 0; i < ids.length; i++) {
        if (!byId[ids[i]]) return null;
        var s = sanitizeQuestionState(c.q[ids[i]]);
        if (!s) return null;
        q[ids[i]] = s;
      }
      return { sitting: c.sitting, token: c.token, startedAt: Number(c.startedAt) || Date.now(), page: c.page, qi: c.qi, q: q };
    }

    function sanitizeRecord(r) {
      if (!r || typeof r !== 'object' || !isInt(r.sitting, 1, MAX_SITTINGS)) return null;
      var rec = { sitting: r.sitting, token: typeof r.token === 'string' ? r.token : null, startedAt: Number(r.startedAt) || null, completedAt: Number(r.completedAt) || null, fromServer: !!r.fromServer };
      if (Array.isArray(r.questions) && r.questions.length) {
        var qs = [];
        for (var i = 0; i < r.questions.length; i++) {
          var x = r.questions[i];
          if (!x || !byId[x.id] || !isInt(x.attempts, 1, MAX_ATTEMPTS) || ['correct', 'revealed'].indexOf(x.status) === -1) return null;
          if (x.status === 'revealed' && x.attempts !== MAX_ATTEMPTS) return null;
          qs.push({ id: x.id, page: pageOf[x.id] + 1, concept: byId[x.id].concept, type: byId[x.id].type || 'single', attempts: x.attempts, status: x.status, pointsH: pointsFor(x) });
        }
        rec.questions = qs;
        recomputeTotals(rec);
      } else {
        // a sitting known only from the server (e.g. a first sitting finished on another device)
        if (!isInt(r.totalH, 0, maxH) || !Array.isArray(r.pageH) || r.pageH.length !== pages.length) return null;
        rec.questions = [];
        rec.totalH = r.totalH;
        rec.pageH = r.pageH.map(function (n) { return isInt(n, 0, maxH) ? n : 0; });
      }
      var sub = r.submit && typeof r.submit === 'object' ? r.submit : {};
      rec.submit = {
        state: SUBMIT_STATES.indexOf(sub.state) !== -1 ? (sub.state === 'sending' ? 'pending' : sub.state) : 'pending',
        tries: isInt(sub.tries, 0, 1000) ? sub.tries : 0,
        lastError: typeof sub.lastError === 'string' ? sub.lastError.slice(0, 200) : null,
        message: typeof sub.message === 'string' ? sub.message.slice(0, 300) : null
      };
      return rec;
    }

    function recomputeTotals(rec) {
      var pageH = pages.map(function () { return 0; });
      rec.questions.forEach(function (x) { pageH[x.page - 1] += x.pointsH; });
      rec.pageH = pageH;
      rec.totalH = pageH.reduce(function (a, b) { return a + b; }, 0);
    }

    function sanitizeProfile(p, key) {
      if (!p || typeof p !== 'object') return null;
      var v = validateName(p.name);
      if (!v.ok || nameKey(v.name) !== key) return null;
      if (STATUSES.indexOf(p.status) === -1 || PAGE_VIEWS.indexOf(p.view) === -1) return null;
      var out = { name: v.name, key: key, status: p.status, view: p.view, sitting: isInt(p.sitting, 1, MAX_SITTINGS) ? p.sitting : 1, sittings: {}, current: null, updatedAt: Number(p.updatedAt) || Date.now() };
      [1, 2].forEach(function (n) {
        if (p.sittings && p.sittings[n]) {
          var rec = sanitizeRecord(p.sittings[n]);
          if (!rec || rec.sitting !== n) out.sittings[n] = null; else out.sittings[n] = rec;
        }
      });
      if (p.current) {
        out.current = sanitizeCurrent(p.current);
        if (!out.current) return null;
      }
      // keep the status consistent with what is actually stored
      if (out.current) {
        out.status = 'in_progress';
        if (out.view === 'final') out.view = 'quiz';
        out.sitting = out.current.sitting;
      } else {
        var last = out.sittings[2] || out.sittings[1];
        if (!last) return null;
        out.view = 'final';
        out.sitting = last.sitting;
        out.status = out.sittings[2] || isPassH(out.sittings[1].totalH) ? 'completed' : 'awaiting_retake';
      }
      return out;
    }

    function newProfile(name, key) {
      return { name: name, key: key, status: 'in_progress', view: 'quiz', sitting: 1, sittings: {}, current: null, updatedAt: Date.now() };
    }

    /* ── accessors ── */
    function profile() { return activeKey ? store.profiles[activeKey] : null; }
    function cur() { var p = profile(); return p ? p.current : null; }
    function touch(p) { p.updatedAt = Date.now(); save(); }
    function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }

    function qstate(id) {
      var c = cur();
      if (!c) throw new Error('No sitting is in progress');
      if (!c.q[id]) c.q[id] = { attempts: 0, status: 'open', selected: [], tried: [], feedback: null };
      return c.q[id];
    }

    function viewNow() {
      if (!activeKey) return 'welcome';
      if (greeting) return 'welcomeBack';
      return profile().view;
    }

    /* ── people on this device ── */
    function profileFor(name) {
      var v = validateName(name);
      if (!v.ok) return null;
      return clone(store.profiles[nameKey(v.name)] || null);
    }

    function openProfile(name) {
      var v = validateName(name);
      if (!v.ok) return false;
      var key = nameKey(v.name);
      if (!store.profiles[key]) return false;
      activeKey = key;
      greeting = false;
      store.lastKey = key;
      save();
      return true;
    }

    function greetingInfo() {
      var p = profile();
      if (!p || !greeting) return null;
      return {
        name: p.name,
        key: p.key,
        kind: p.status === 'awaiting_retake' ? 'retake' : 'unfinished',
        sitting: p.sitting,
        firstPercentX100: p.sittings[1] ? pctX100(p.sittings[1].totalH) : null
      };
    }

    function resume() { greeting = false; return true; }

    // "Not you?" on a shared computer: switch student. Nothing is deleted.
    function dismissGreeting() {
      greeting = false;
      activeKey = null;
      store.lastKey = null;
      save();
    }

    /* ── starting a sitting ── */
    // Sitting 1: for a brand-new student. Sitting 2: the single permitted retake.
    // firstSitting (optional) = { totalH, pageH } from the server, when sitting 1 was done on another device.
    function beginSitting(opts) {
      opts = opts || {};
      var v = validateName(opts.name);
      if (!v.ok) return { ok: false, code: 'bad_name', error: v.error };
      var key = nameKey(v.name);
      var n = opts.sitting;
      var token = opts.token;
      if (typeof token !== 'string' || token.length < 8) return { ok: false, code: 'bad_token', error: 'Missing sitting id.' };
      if (n !== 1 && n !== 2) return { ok: false, code: 'bad_sitting', error: 'Sitting must be 1 or 2.' };

      var p = store.profiles[key];
      if (p && p.current) return { ok: false, code: 'in_progress', error: 'A sitting is already in progress for this student.' };

      if (n === 1) {
        if (p && (p.sittings[1] || p.sittings[2])) return { ok: false, code: 'already_sat', error: 'Sitting 1 has already been completed.' };
        p = newProfile(v.name, key);
      } else {
        if (!p) p = newProfile(v.name, key);
        if (!p.sittings[1] && opts.firstSitting) {
          var injected = sanitizeRecord({ sitting: 1, fromServer: true, totalH: opts.firstSitting.totalH, pageH: opts.firstSitting.pageH, submit: { state: 'sent' } });
          if (injected) p.sittings[1] = injected;
        }
        if (!p.sittings[1]) return { ok: false, code: 'no_first_sitting', error: 'The first sitting must be completed before a retake.' };
        if (p.sittings[2]) return { ok: false, code: 'already_sat', error: 'Both sittings have already been used.' };
        if (isPassH(p.sittings[1].totalH)) return { ok: false, code: 'passed', error: 'A retake is only available below ' + PASS_PERCENT + '%.' };
      }
      p.current = { sitting: n, token: token, startedAt: Date.now(), page: 0, qi: 0, q: {} };
      p.sitting = n;
      p.status = 'in_progress';
      p.view = 'quiz';
      store.profiles[key] = p;
      store.lastKey = key;
      activeKey = key;
      greeting = false;
      touch(p);
      return { ok: true };
    }

    // The server knows this student already has finished sitting(s) (e.g. browser storage was cleared, or the
    // sitting was done on another device). Rebuild a local profile from the server's record. No sitting starts.
    function importServerResults(name, info) {
      var v = validateName(name);
      if (!v.ok || !info) return false;
      var key = nameKey(v.name);
      var p = store.profiles[key];
      if (p && p.current) return false;
      if (!p) p = newProfile(v.name, key);
      [1, 2].forEach(function (n) {
        var r = info['sitting' + n];
        if (r && !p.sittings[n]) {
          var rec = sanitizeRecord({ sitting: n, fromServer: true, totalH: r.totalH, pageH: r.pageH, submit: { state: 'sent' } });
          if (rec) p.sittings[n] = rec;
        }
      });
      var last = p.sittings[2] || p.sittings[1];
      if (!last) return false;
      p.current = null;
      p.view = 'final';
      p.sitting = last.sitting;
      p.status = p.sittings[2] || (p.sittings[1] && isPassH(p.sittings[1].totalH)) ? 'completed' : 'awaiting_retake';
      store.profiles[key] = p;
      store.lastKey = key;
      activeKey = key;
      greeting = false;
      touch(p);
      return true;
    }

    function canRetake(p) {
      p = p || profile();
      return !!(p && p.sittings[1] && !p.sittings[2] && !p.current && !isPassH(p.sittings[1].totalH));
    }

    /* ── answering ── */
    function current() {
      var c = cur();
      var page = pages[c.page];
      return { sitting: c.sitting, pageIndex: c.page, page: page, qi: c.qi, question: page.questions[c.qi] };
    }

    function select(qid, idx) {
      var q = byId[qid];
      if (!q || !cur()) return { ok: false, reason: 'unknown' };
      var s = qstate(qid);
      if (s.status !== 'open') return { ok: false, reason: 'locked' };
      if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) return { ok: false, reason: 'invalid' };
      if (!isMulti(q)) {
        if (s.tried.indexOf(String(idx)) !== -1) return { ok: false, reason: 'tried' };
        s.selected = [idx];
      } else {
        var at = s.selected.indexOf(idx);
        if (at !== -1) s.selected.splice(at, 1);
        else if (s.selected.length >= needCount(q)) return { ok: false, reason: 'max' };
        else s.selected.push(idx);
      }
      touch(profile());
      return { ok: true };
    }

    function check(qid) {
      var q = byId[qid];
      if (!q) throw new Error('Unknown question: ' + qid);
      var s = qstate(qid);
      if (s.status !== 'open') return { outcome: 'locked' };
      var need = needCount(q);
      if (s.selected.length === 0) return { outcome: 'no-selection', message: MESSAGES.noSelection };
      if (s.selected.length !== need) return { outcome: 'wrong-count', message: 'Select exactly ' + need + ' answer' + (need === 1 ? '' : 's') + ', then press Check Answer.' };

      var picked = s.selected.slice().sort(function (a, b) { return a - b; });
      var combo = comboOf(picked);
      if (s.tried.indexOf(combo) !== -1) return { outcome: 'already-tried', message: MESSAGES.alreadyTried };

      s.attempts += 1;
      var answers = answerList(q);
      var fb;
      if (combo === comboOf(answers)) {
        s.status = 'correct';
        var pts = POINTS_H[s.attempts];
        fb = { outcome: 'correct', attempt: s.attempts, pointsH: pts, message: MESSAGES.success[s.attempts], explanation: q.explanation };
      } else {
        s.tried.push(combo);
        s.selected = [];
        if (s.attempts >= MAX_ATTEMPTS) {
          s.status = 'revealed';
          var wrongPicked = picked.filter(function (i) { return answers.indexOf(i) === -1; });
          var missed = answers.filter(function (i) { return picked.indexOf(i) === -1; });
          fb = {
            outcome: 'revealed',
            attempt: s.attempts,
            pointsH: 0,
            message: MESSAGES.revealed,
            picked: picked,
            wrongPicked: wrongPicked,
            missed: missed,
            explanation: q.explanation,
            whyWrong: wrongPicked.map(function (i) { return q.whyWrong[i]; }).filter(Boolean)
          };
        } else {
          fb = { outcome: 'try-again', attempt: s.attempts, message: s.attempts === 1 ? MESSAGES.try1 : MESSAGES.try2, hint: q.hints[s.attempts - 1] };
        }
      }
      s.feedback = fb;
      touch(profile());
      return fb;
    }

    function isLocked(id) { return qstate(id).status !== 'open'; }

    function questionState(id) {
      var c = cur();
      var s = c && c.q[id] ? c.q[id] : { attempts: 0, status: 'open', selected: [], tried: [], feedback: null };
      var out = clone(s);
      out.pointsH = pointsFor(s);
      // for the interface: what is the question worth right now?
      out.worthH = s.status === 'open' ? POINTS_H[s.attempts + 1] || 0 : out.pointsH;
      return out;
    }

    /* ── navigation ── */
    function next() {
      var p = profile();
      if (!p || p.view !== 'quiz' || !p.current) return false;
      var q = current().question;
      if (!isLocked(q.id)) return false;
      var c = p.current;
      if (c.qi + 1 >= pages[c.page].questions.length) p.view = 'pageResult';
      else c.qi += 1;
      touch(p);
      return true;
    }

    function continueFromPageResult() {
      var p = profile();
      if (!p || p.view !== 'pageResult' || !p.current) return false;
      var c = p.current;
      if (c.page < pages.length - 1) {
        c.page += 1;
        c.qi = 0;
        p.view = 'quiz';
      } else {
        finishSitting(p);
      }
      touch(p);
      return true;
    }

    function finishSitting(p) {
      var c = p.current;
      var rec = { sitting: c.sitting, token: c.token, startedAt: c.startedAt, completedAt: Date.now(), questions: [], submit: { state: 'pending', tries: 0, lastError: null, message: null } };
      questions.forEach(function (q) {
        var s = c.q[q.id];
        rec.questions.push({ id: q.id, page: pageOf[q.id] + 1, concept: q.concept, type: q.type || 'single', attempts: s.attempts, status: s.status, pointsH: pointsFor(s) });
      });
      recomputeTotals(rec);
      p.sittings[c.sitting] = rec;
      p.current = null;
      p.view = 'final';
      p.sitting = c.sitting;
      p.status = c.sitting === MAX_SITTINGS || isPassH(rec.totalH) ? 'completed' : 'awaiting_retake';
    }

    /* ── scoring ── */
    function pageH(i) {
      var c = cur();
      if (!c) return 0;
      return pages[i].questions.reduce(function (sum, q) { return sum + (c.q[q.id] ? pointsFor(c.q[q.id]) : 0); }, 0);
    }
    function totalH() { var t = 0; for (var i = 0; i < pages.length; i++) t += pageH(i); return t; }
    function lockedCountOnPage(i) {
      var c = cur();
      if (!c) return 0;
      return pages[i].questions.filter(function (q) { return c.q[q.id] && c.q[q.id].status !== 'open'; }).length;
    }

    // Summary of a finished sitting (1 or 2) – pure data for the results screens
    function summary(sittingNo) {
      var p = profile();
      var rec = p && p.sittings[sittingNo];
      if (!rec) return null;
      return summarizeRecord(rec);
    }

    function summarizeRecord(rec) {
      var counts = null;
      var wrong = null;
      if (rec.questions && rec.questions.length) {
        counts = { first: 0, second: 0, third: 0, revealed: 0 };
        wrong = 0;
        rec.questions.forEach(function (x) {
          if (x.status === 'revealed') counts.revealed += 1;
          else if (x.attempts === 1) counts.first += 1;
          else if (x.attempts === 2) counts.second += 1;
          else counts.third += 1;
          wrong += x.attempts - (x.status === 'correct' ? 1 : 0);
        });
      }
      return {
        sitting: rec.sitting,
        totalH: rec.totalH,
        maxH: maxH,
        percentX100: pctX100(rec.totalH),
        passed: isPassH(rec.totalH),
        pages: pages.map(function (pg, i) {
          return { id: pg.id, title: pg.title, section: pg.section, pointsH: rec.pageH[i], maxH: pageMaxH[i], contributionX100: pctX100(rec.pageH[i]), contributionMaxX100: pctX100(pageMaxH[i]) };
        }),
        counts: counts,
        wrongAttempts: wrong,
        questions: rec.questions.map(function (x) { return clone(x); }),
        fromServer: !!rec.fromServer
      };
    }

    function comparison() {
      var p = profile();
      if (!p || !p.sittings[1] || !p.sittings[2]) return null;
      var a = pctX100(p.sittings[1].totalH);
      var b = pctX100(p.sittings[2].totalH);
      return {
        firstX100: a,
        secondX100: b,
        diffX100: b - a,
        bestX100: Math.max(a, b),
        bestSitting: b > a ? 2 : 1,
        firstRawH: p.sittings[1].totalH,
        secondRawH: p.sittings[2].totalH
      };
    }

    /* ── sending results ── */
    function submissionPayload(sittingNo) {
      var p = profile();
      var rec = p && p.sittings[sittingNo];
      if (!rec || !rec.token || !rec.questions.length) return null;
      return {
        name: p.name,
        sitting: rec.sitting,
        token: rec.token,
        questions: rec.questions.map(function (x) { return { id: x.id, page: x.page, concept: x.concept, type: x.type, attempts: x.attempts, status: x.status }; }),
        clientTotalH: rec.totalH
      };
    }

    function submitState(sittingNo) {
      var p = profile();
      var rec = p && p.sittings[sittingNo];
      return rec ? clone(rec.submit) : null;
    }

    function updateSubmit(sittingNo, patch) {
      var p = profile();
      var rec = p && p.sittings[sittingNo];
      if (!rec) return false;
      Object.keys(patch).forEach(function (k) { rec.submit[k] = patch[k]; });
      if (SUBMIT_STATES.indexOf(rec.submit.state) === -1) rec.submit.state = 'pending';
      touch(p);
      return true;
    }

    // Another browser tab changed the saved data: pick it up.
    function reload() {
      var keep = activeKey;
      var wasGreeting = greeting;
      store = loadStore();
      if (keep && store.profiles[keep]) { activeKey = keep; greeting = wasGreeting; }
      else initFromStore();
    }

    return {
      get view() { return viewNow(); },
      get name() { var p = profile(); return p ? p.name : ''; },
      get key() { return activeKey; },
      get sittingNumber() { var p = profile(); return p ? p.sitting : 0; },
      get status() { var p = profile(); return p ? p.status : null; },
      get pageIndex() { var c = cur(); return c ? c.page : (profile() ? pages.length - 1 : 0); },
      get qi() { var c = cur(); return c ? c.qi : 0; },
      get persistent() { return storageOk; },
      pages: pages,
      questions: questions,
      maxH: maxH,
      pageMaxH: pageMaxH,
      profileFor: profileFor,
      openProfile: openProfile,
      greetingInfo: greetingInfo,
      resume: resume,
      dismissGreeting: dismissGreeting,
      beginSitting: beginSitting,
      importServerResults: importServerResults,
      canRetake: function () { return canRetake(); },
      current: current,
      select: select,
      check: check,
      isLocked: isLocked,
      questionState: questionState,
      next: next,
      continueFromPageResult: continueFromPageResult,
      pageH: pageH,
      totalH: totalH,
      lockedCountOnPage: lockedCountOnPage,
      pctX100: pctX100,
      summary: summary,
      comparison: comparison,
      submissionPayload: submissionPayload,
      submitState: submitState,
      updateSubmit: updateSubmit,
      reload: reload,
      snapshot: function () { return clone(store); }
    };
  }

  return {
    create: create,
    validateName: validateName,
    nameKey: nameKey,
    pageFeedback: pageFeedback,
    finalFeedback: finalFeedback,
    fmtPoints: fmtPoints,
    fmtPercent: fmtPercent,
    fmtSignedPercent: fmtSignedPercent,
    isMulti: isMulti,
    answerList: answerList,
    needCount: needCount,
    pointsFor: pointsFor,
    MESSAGES: MESSAGES,
    POINTS_H: POINTS_H,
    MAX_ATTEMPTS: MAX_ATTEMPTS,
    MAX_SITTINGS: MAX_SITTINGS,
    PASS_PERCENT: PASS_PERCENT,
    STORAGE_KEY: STORAGE_KEY
  };
});
