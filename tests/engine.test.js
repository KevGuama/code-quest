/* Engine v2 tests. Run: node tests/engine.test.js */
'use strict';
var E = require('../js/quiz-engine.js');
var Q = require('../js/questions.js');
var PAGES = Q.PAGES;

var passed = 0, failed = 0;
function ok(cond, label) { if (cond) passed++; else { failed++; console.log('  FAIL: ' + label); } }
function eq(a, b, label) { ok(JSON.stringify(a) === JSON.stringify(b), label + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function section(t) { console.log(t); }

function mem() { var d = {}; return { getItem: function (k) { return k in d ? d[k] : null; }, setItem: function (k, v) { d[k] = String(v); }, removeItem: function (k) { delete d[k]; }, _d: d }; }
var tokN = 0; function tok() { return 'token-' + (++tokN) + '-xxxxxxxx'; }
function fresh(storage) { return E.create(PAGES, storage || mem()); }
function start(eng, name, sitting, extra) { var o = { name: name || 'Amina Otieno', sitting: sitting || 1, token: tok() }; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); var r = eng.beginSitting(o); if (!r.ok) throw new Error(JSON.stringify(r)); return r; }
function wrongPick(q) { var a = E.answerList(q); for (var i = 0; i < q.options.length; i++) if (a.indexOf(i) === -1) return i; }
function wrongCombo(q, n) { // n-th distinct wrong selection
  var a = E.answerList(q), need = a.length, out = [];
  if (need === 1) { var w = []; for (var i = 0; i < 4; i++) if (i !== a[0]) w.push(i); return [w[n]]; }
  var combos = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]].filter(function (c) { return c.join() !== a.join(); });
  return combos[n];
}
function answerRight(eng, q) { E.answerList(q).forEach(function (i) { eng.select(q.id, i); }); return eng.check(q.id); }
function answerWrong(eng, q, n) { wrongCombo(q, n).forEach(function (i) { eng.select(q.id, i); }); return eng.check(q.id); }
// play one question to a given result: 1,2,3 = correct on that try, 0 = revealed
function play(eng, tries) {
  var q = eng.current().question, fb;
  if (tries === 0) { answerWrong(eng, q, 0); answerWrong(eng, q, 1); fb = answerWrong(eng, q, 2); }
  else { for (var i = 0; i < tries - 1; i++) answerWrong(eng, q, i); fb = answerRight(eng, q); }
  eng.next();
  return fb;
}
// play a whole sitting from a list of 20 results
function playAll(eng, results) {
  for (var p = 0; p < 4; p++) {
    for (var i = 0; i < 5; i++) play(eng, results[p * 5 + i]);
    eng.continueFromPageResult();
  }
}
function rep(n, v) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }

section('Question data');
eq(PAGES.length, 4, '4 pages');
PAGES.forEach(function (p, i) {
  eq(p.questions.length, 5, 'page ' + (i + 1) + ' has 5 questions');
  var last = p.questions[4];
  ok(last.type === 'multi', 'page ' + (i + 1) + ' Q5 is multi-select');
  ok(Array.isArray(last.answer) && last.answer.length === 2, 'page ' + (i + 1) + ' Q5 has two answers');
  ok(/Select TWO/.test(last.prompt), 'page ' + (i + 1) + ' Q5 says Select TWO');
  p.questions.slice(0, 4).forEach(function (q) { ok(q.type === 'single' && Number.isInteger(q.answer), q.id + ' single'); });
  p.questions.forEach(function (q) { ok(q.options.length === 4 && q.hints.length === 2 && q.explanation && q.whyWrong.length === 4, q.id + ' complete'); });
});
eq(fresh().questions.length, 20, '20 questions');
eq(fresh().maxH, 2000, 'max 20.00 points');

section('Messages');
eq(E.MESSAGES.success[1], 'WELL DONE! +1.00 POINTS! 🎉', 'success 1');
eq(E.MESSAGES.success[2], 'YOU GOT IT! +0.25 POINTS! 👏', 'success 2');
eq(E.MESSAGES.success[3], "THAT'S CORRECT! +0.10 POINTS! 💪", 'success 3');

section('Names');
ok(E.validateName('').ok === false && E.validateName('A').ok === false && E.validateName('R2D2').ok === false, 'bad names rejected');
eq(E.validateName("  Mary-Jane   O'Neil ").name, "Mary-Jane O'Neil", 'name normalised');
eq(E.nameKey('Wanjiru  Kamau'), E.nameKey('wanjiru kamau'), 'same key case/space');
eq(E.nameKey("O'Neil"), E.nameKey('ONeil'), 'apostrophe ignored in key');

section('Single-answer attempts and points');
(function () {
  var eng = fresh(); start(eng);
  var q = eng.current().question;
  var f1 = answerWrong(eng, q, 0);
  eq(f1.outcome, 'try-again', 'wrong 1 -> try again');
  eq(f1.message, E.MESSAGES.try1, 'try1 message');
  eq(f1.hint, q.hints[0], 'hint 1');
  var f2 = answerWrong(eng, q, 1);
  eq(f2.message, E.MESSAGES.try2, 'try2 message'); eq(f2.hint, q.hints[1], 'hint 2');
  var f3 = answerRight(eng, q);
  eq(f3.outcome, 'correct', 'third correct'); eq(f3.pointsH, 10, '0.10 on third');
  eq(f3.message, E.MESSAGES.success[3], 'third message'); eq(f3.explanation, q.explanation, 'explanation shown');
  eq(eng.check(q.id).outcome, 'locked', 'locked after correct');
  eq(eng.select(q.id, 0).reason, 'locked', 'cannot select after lock');
  eq(eng.totalH(), 10, 'no double scoring');
})();
[[1, 100, 'first'], [2, 25, 'second'], [3, 10, 'third'], [0, 0, 'revealed']].forEach(function (c) {
  var eng = fresh(); start(eng); var q = eng.current().question;
  var fb = play(eng, c[0]);
  eq(eng.questionState(q.id).pointsH, c[1], c[2] + ' = ' + c[1] + ' hundredths');
  if (c[0] === 0) { eq(fb.outcome, 'revealed', 'reveal outcome'); eq(fb.message, E.MESSAGES.revealed, 'reveal message'); ok(fb.explanation && fb.whyWrong.length >= 1, 'reveal explains'); eq(eng.questionState(q.id).attempts, 3, 'three attempts used'); }
});
(function () {
  var eng = fresh(); start(eng); var q = eng.current().question;
  eq(eng.check(q.id).outcome, 'no-selection', 'check with nothing selected is not an attempt');
  eq(eng.questionState(q.id).attempts, 0, 'no attempt consumed');
  var w = wrongCombo(q, 0)[0]; eng.select(q.id, w); eng.check(q.id);
  eq(eng.select(q.id, w).reason, 'tried', 'same wrong single option cannot be re-picked');
  eq(eng.questionState(q.id).attempts, 1, 'one attempt');
})();
(function () { // independent counters
  var eng = fresh(); start(eng);
  var q1 = eng.current().question; answerWrong(eng, q1, 0); answerRight(eng, q1); eng.next();
  var q2 = eng.current().question;
  eq(eng.questionState(q2.id).attempts, 0, 'next question starts at 0 attempts');
  eq(eng.next(), false, 'cannot skip an unanswered question');
})();

section('Multi-select');
(function () {
  var eng = fresh(); start(eng);
  for (var i = 0; i < 4; i++) play(eng, 1);
  var q = eng.current().question;
  eq(q.type, 'multi', 'fifth is multi');
  var a = E.answerList(q);
  eq(eng.select(q.id, 0).ok, true, 'select 1'); eng.select(q.id, 1);
  var third = [0, 1, 2, 3].filter(function (x) { return x > 1; })[0];
  eq(eng.select(q.id, third).reason, 'max', 'cannot select more than TWO');
  eng.select(q.id, 1); // deselect
  eq(eng.questionState(q.id).selected, [0], 'toggle off works');
  eng.select(q.id, 0); // deselect all
  eq(eng.check(q.id).outcome, 'no-selection', 'nothing selected');
  eng.select(q.id, a[0]);
  var wc = eng.check(q.id);
  eq(wc.outcome, 'wrong-count', 'one of two selected is not an attempt'); eq(eng.questionState(q.id).attempts, 0, 'no attempt consumed for wrong count');
  eng.select(q.id, a[1]);
  var ok1 = eng.check(q.id);
  eq(ok1.outcome, 'correct', 'exact combination correct'); eq(ok1.pointsH, 100, 'first try 1.00');
})();
(function () { // all-or-nothing: one right + one wrong gets nothing, no partial
  var eng = fresh(); start(eng);
  for (var i = 0; i < 4; i++) play(eng, 1);
  var q = eng.current().question, a = E.answerList(q), w = wrongPick(q);
  eng.select(q.id, a[0]); eng.select(q.id, w);
  var fb = eng.check(q.id);
  eq(fb.outcome, 'try-again', 'half-right is wrong'); eq(fb.hint, q.hints[0], 'hint shown');
  eq(eng.questionState(q.id).selected, [], 'selection cleared after a wrong attempt');
  eng.select(q.id, a[0]); eng.select(q.id, w);
  eq(eng.check(q.id).outcome, 'already-tried', 'same wrong combination not counted twice');
  eq(eng.questionState(q.id).attempts, 1, 'repeat did not use an attempt');
  answerWrong(eng, q, 1);
  var r = answerWrong(eng, q, 2);
  ok(r.outcome === 'revealed' || r.outcome === 'try-again', 'third wrong handled');
})();
(function () { // reveal on multi
  var eng = fresh(); start(eng);
  for (var i = 0; i < 4; i++) play(eng, 1);
  var q = eng.current().question;
  var f = play(eng, 0);
  eq(f.outcome, 'revealed', 'multi revealed after 3 failures');
  eq(eng.questionState(q.id).pointsH, 0, 'multi revealed = 0');
})();

section('Scoring and percentages');
(function () { // brief example: 4.25 / 3.00 / 4.10 / 5.00 = 16.35 = 81.75%
  // page1 4.25: 4 first-try (4.00) + 0.25 (second try) ; page2 3.00: 3 first-try + 2 revealed ;
  // page3 4.10: 4 first-try + 0.10 (third) ; page4 5.00
  var r = [].concat([1, 1, 1, 1, 2], [1, 1, 1, 0, 0], [1, 1, 1, 1, 3], [1, 1, 1, 1, 1]);
  var eng = fresh(); start(eng); playAll(eng, r);
  eq(eng.view, 'final', 'reaches final');
  var s = eng.summary(1);
  eq(s.pages.map(function (p) { return p.pointsH; }), [425, 300, 410, 500], 'page points');
  eq(s.pages.map(function (p) { return p.contributionX100; }), [2125, 1500, 2050, 2500], 'contributions 21.25/15/20.5/25');
  eq(s.totalH, 1635, 'total 16.35'); eq(s.percentX100, 8175, '81.75%');
  eq(E.fmtPercent(s.percentX100), '81.75', 'formatted 81.75'); eq(E.fmtPoints(s.totalH), '16.35', 'formatted 16.35');
  eq(s.counts, { first: 16, second: 1, third: 1, revealed: 2 }, 'attempt counts');
  eq(s.passed, true, '81.75 passes');
  eq(eng.status, 'completed', 'completed on pass'); eq(eng.canRetake(), false, 'no retake after pass');
})();
(function () { eq(fresh().pctX100(2000), 10000, '20/20 = 100%'); eq(fresh().pctX100(0), 0, '0%'); })();
(function () { var r = rep(20, 1); var eng = fresh(); start(eng); playAll(eng, r); eq(eng.summary(1).percentX100, 10000, 'perfect = 100.00'); eq(eng.summary(1).pages.map(function (p) { return p.contributionX100; }), [2500, 2500, 2500, 2500], 'each page max 25'); })();
(function () { var eng = fresh(); start(eng); playAll(eng, rep(20, 0)); eq(eng.summary(1).totalH, 0, 'all revealed = 0'); eq(eng.summary(1).counts.revealed, 20, '20 revealed'); })();

section('Pass threshold edge cases (75%)');
function sitWith(res) { var s = mem(); var eng = fresh(s); start(eng, 'Edge Case', 1); playAll(eng, res); return eng; }
(function () {
  // exactly 15.00 = 75.00% : 15 first-try + 5 revealed
  var e1 = sitWith([].concat(rep(15, 1), rep(5, 0)));
  eq(e1.summary(1).percentX100, 7500, 'exactly 75.00'); eq(e1.summary(1).passed, true, '75.00 passes'); eq(e1.canRetake(), false, 'no retake at 75.00');
  // 14.95 = 74.75%: 14 first + 1 at... use 14 first-try (14.00) + 3 second-try (0.75) + 3 revealed = 14.75 -> 73.75
  // 14.95 -> 74.75: 14 + 9 x 0.10 would need 9 questions; use 14 first + 1 third(0.10)... build exact: 14*1 + 3*0.25 + 2*0.10 = 14.95
  var res = [].concat(rep(14, 1), rep(3, 2), rep(2, 3), rep(1, 0));
  var e2 = sitWith(res);
  eq(e2.summary(1).totalH, 1495, '14.95 points'); eq(e2.summary(1).percentX100, 7475, '74.75%'); eq(e2.summary(1).passed, false, '74.75 does not pass');
  eq(e2.canRetake(), true, 'retake offered'); eq(e2.status, 'awaiting_retake', 'status awaiting_retake');
  // 74.95: 14.99 not reachable; closest below is 14.95->74.75; 14.90 etc. check 74.99 can't occur: grain is 0.05 pts
  // 15.00 - 0.05 impossible; confirm 1499 hundredths is below and 1500 is above via pctX100
  ok(e2.pctX100(1499) < 7500 && e2.pctX100(1500) === 7500, 'boundary arithmetic');
})();

section('Retake rules');
(function () {
  var store = mem(); var eng = fresh(store);
  start(eng, 'Low Scorer', 1); playAll(eng, [].concat(rep(10, 1), rep(10, 0)));
  eq(eng.summary(1).percentX100, 5000, 'sitting 1 = 50%'); eq(eng.canRetake(), true, 'retake offered once');
  eq(eng.beginSitting({ name: 'Low Scorer', sitting: 1, token: tok() }).code, 'already_sat', 'cannot redo sitting 1');
  var r2 = eng.beginSitting({ name: 'Low Scorer', sitting: 2, token: tok() }); eq(r2.ok, true, 'sitting 2 begins');
  eq(eng.sittingNumber, 2, 'sitting number 2');
  eq(eng.summary(1).totalH, 1000, 'first result preserved during retake');
  eq(eng.beginSitting({ name: 'Low Scorer', sitting: 2, token: tok() }).code, 'in_progress', 'cannot start a second sitting 2 while one is open');
  playAll(eng, rep(20, 1));
  eq(eng.status, 'completed', 'completed after sitting 2'); eq(eng.canRetake(), false, 'no third sitting');
  var cmp = eng.comparison();
  eq([cmp.firstX100, cmp.secondX100, cmp.diffX100, cmp.bestX100, cmp.bestSitting], [5000, 10000, 5000, 10000, 2], 'comparison');
  eq(E.fmtSignedPercent(cmp.diffX100), '+50.00', 'signed improvement');
  eq(eng.beginSitting({ name: 'Low Scorer', sitting: 2, token: tok() }).code, 'already_sat', 'sitting 2 cannot be repeated');
  eq(eng.beginSitting({ name: 'low  scorer', sitting: 1, token: tok() }).code, 'already_sat', 'case/space variants cannot restart');
  eq(eng.summary(1).totalH, 1000, 'first result still intact');
  // fresh engine on same storage = refresh / new tab
  var again = fresh(store);
  eq(again.view, 'welcome', 'completed student is not offered a greeting');
  eq(again.beginSitting({ name: 'Low Scorer', sitting: 2, token: tok() }).code, 'already_sat', 'third sitting blocked after refresh');
})();
(function () { // decline
  var eng = fresh(); start(eng, 'Slipping Student'); playAll(eng, rep(20, 1));
  eq(eng.beginSitting({ name: 'Slipping Student', sitting: 2, token: tok() }).code, 'passed', 'sitting 1 pass -> no retake');
  var e2 = fresh(); start(e2, 'Dropper'); playAll(e2, [].concat(rep(14, 1), rep(6, 0))); // 70%
  e2.beginSitting({ name: 'Dropper', sitting: 2, token: tok() }); playAll(e2, rep(20, 0));
  var c = e2.comparison(); eq([c.diffX100, c.bestX100, c.bestSitting], [-7000, 7000, 1], 'decline shown, best is first');
  eq(E.fmtSignedPercent(c.diffX100), '−70.00', 'decline formatted');
})();
(function () { // sitting 2 from server record on another device
  var eng = fresh();
  var r = eng.beginSitting({ name: 'Other Device', sitting: 2, token: tok(), firstSitting: { totalH: 1200, pageH: [300, 300, 300, 300] } });
  eq(r.ok, true, 'retake with server-reported first sitting');
  var blocked = fresh().beginSitting({ name: 'Passed Elsewhere', sitting: 2, token: tok(), firstSitting: { totalH: 1600, pageH: [400, 400, 400, 400] } });
  eq(blocked.code, 'passed', 'server first sitting >=75% blocks retake');
  eq(fresh().beginSitting({ name: 'No History', sitting: 2, token: tok() }).code, 'no_first_sitting', 'retake without first sitting rejected');
})();

section('Resume / persistence');
(function () {
  var store = mem(); var eng = fresh(store);
  start(eng, 'Halfway Hannah');
  play(eng, 1); play(eng, 2); play(eng, 0); // Q1..Q3 done
  var q4 = eng.current().question; answerWrong(eng, q4, 0); // 1 attempt used on Q4
  var before = { total: eng.totalH(), q: eng.qi, p: eng.pageIndex, att: eng.questionState(q4.id).attempts };
  var again = fresh(store); // tab closed and reopened
  eq(again.view, 'welcomeBack', 'welcome back shown');
  var g = again.greetingInfo(); eq([g.name, g.kind, g.sitting], ['Halfway Hannah', 'unfinished', 1], 'greeting info');
  again.resume(); eq(again.view, 'quiz', 'resume enters quiz');
  eq([again.totalH(), again.qi, again.pageIndex, again.questionState(q4.id).attempts], [before.total, before.q, before.p, before.att], 'score/position/attempts preserved');
  eq(again.questionState(q4.id).feedback.outcome, 'try-again', 'feedback restored');
  var f = answerWrong(again, q4, 1); eq(f.attempt, 2, 'attempt counter continues, not reset');
  // selection persists
  var again2 = fresh(store); again2.resume();
  eq(again2.questionState(q4.id).attempts, 2, 'attempts persisted after each action');
  again2.select(q4.id, E.answerList(q4)[0]);
  var again3 = fresh(store); again3.resume();
  eq(again3.questionState(q4.id).selected, [E.answerList(q4)[0]], 'selected answer persisted');
  // page result view persists
  var s2 = mem(); var e = fresh(s2); start(e, 'Page Peter'); for (var i = 0; i < 5; i++) play(e, 1);
  eq(e.view, 'pageResult', 'at page result'); var e2 = fresh(s2); e2.resume(); eq(e2.view, 'pageResult', 'page result resumes');
  // awaiting retake shows greeting
  var s3 = mem(); var e3 = fresh(s3); start(e3, 'Retake Rita'); playAll(e3, rep(20, 0));
  var e4 = fresh(s3); eq(e4.view, 'welcomeBack', 'awaiting-retake greets'); eq(e4.greetingInfo().kind, 'retake', 'kind retake');
  e4.resume(); eq(e4.view, 'final', 'resume shows final with retake offer');
  // Not you
  var e5 = fresh(s3); e5.dismissGreeting(); eq(e5.view, 'welcome', '"not you" returns to welcome');
  eq(fresh(s3).view, 'welcome', 'last student cleared');
  ok(e5.openProfile('Retake Rita'), 'profile reopened by name'); eq(e5.view, 'final', 'reopened profile at final');
})();
(function () { // damaged / tampered data
  var bad = mem(); bad.setItem(E.STORAGE_KEY, '{not json'); eq(fresh(bad).view, 'welcome', 'garbage JSON ignored');
  var s = mem(); var e = fresh(s); start(e, 'Tamper Tim'); play(e, 1);
  var d = JSON.parse(s.getItem(E.STORAGE_KEY)); var k = Object.keys(d.profiles)[0];
  d.profiles[k].current.q.p1q1.attempts = 7; s.setItem(E.STORAGE_KEY, JSON.stringify(d));
  eq(fresh(s).view, 'welcome', 'impossible attempts dropped');
  var d2 = JSON.parse(JSON.stringify(d)); d2.profiles[k].current.q.p1q1.attempts = 1; d2.profiles[k].current.q.p1q1.status = 'correct'; d2.profiles[k].current.page = 9; s.setItem(E.STORAGE_KEY, JSON.stringify(d2));
  eq(fresh(s).view, 'welcome', 'impossible page dropped');
  // points are never read from storage: edit them and they are recomputed
  var s2 = mem(); var e2 = fresh(s2); start(e2, 'Honest Hal'); playAll(e2, rep(20, 0));
  var dd = JSON.parse(s2.getItem(E.STORAGE_KEY)); var kk = Object.keys(dd.profiles)[0];
  dd.profiles[kk].sittings[1].totalH = 2000; dd.profiles[kk].sittings[1].questions.forEach(function (q) { q.pointsH = 100; });
  s2.setItem(E.STORAGE_KEY, JSON.stringify(dd));
  var e3 = fresh(s2); e3.openProfile('Honest Hal'); eq(e3.summary(1).totalH, 0, 'edited points ignored; recomputed from attempts');
  // no storage at all
  var ns = E.create(PAGES, null); start(ns, 'No Storage'); play(ns, 1); eq(ns.totalH(), 100, 'works without storage');
  var thrower = { getItem: function () { throw new Error('x'); }, setItem: function () { throw new Error('quota'); } };
  var te = E.create(PAGES, thrower); start(te, 'Throws'); play(te, 1); eq(te.totalH(), 100, 'works when storage throws'); eq(te.persistent, false, 'persistent flag false');
})();

section('Submission state & payload');
(function () {
  var eng = fresh(); start(eng, 'Payload Pat'); playAll(eng, [].concat(rep(18, 1), [2, 0]));
  var p = eng.submissionPayload(1);
  eq([p.name, p.sitting, p.questions.length], ['Payload Pat', 1, 20], 'payload basics');
  ok(typeof p.token === 'string' && p.token.length >= 8, 'payload has token');
  ok(!('pageH' in p) && p.questions.every(function (q) { return !('pointsH' in q); }), 'payload carries attempts, not trusted points');
  eq(eng.submitState(1).state, 'pending', 'starts pending');
  eng.updateSubmit(1, { state: 'failed', tries: 1, lastError: 'network' });
  eq(eng.submitState(1).state, 'failed', 'failed recorded');
  eq(eng.submissionPayload(2), null, 'no payload for unplayed sitting');
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
