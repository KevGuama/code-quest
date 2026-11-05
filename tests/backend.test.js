/* Backend tests against the real Apps Script file + mock Google services. Run: node tests/backend.test.js */
'use strict';
var H = require('./gas-harness.js');
var E = require('../js/quiz-engine.js');

var passed = 0, failed = 0;
function ok(c, l) { if (c) passed++; else { failed++; console.log('  FAIL: ' + l); } }
function eq(a, b, l) { ok(JSON.stringify(a) === JSON.stringify(b), l + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }

var n = 0; function tok() { return 'tok' + (++n) + '-abcdefgh'; }
function qs(results) { // results: 20 numbers 1/2/3/0
  var out = [], i = 0;
  for (var p = 1; p <= 4; p++) for (var q = 1; q <= 5; q++) { var r = results[i++]; out.push({ id: 'p' + p + 'q' + q, page: p, concept: 'Concept ' + q, type: q === 5 ? 'multi' : 'single', attempts: r === 0 ? 3 : r, status: r === 0 ? 'revealed' : 'correct' }); }
  return out;
}
function rep(k, v) { var a = []; for (var i = 0; i < k; i++) a.push(v); return a; }
function hundredths(results) { return results.reduce(function (s, r) { return s + (r === 1 ? 100 : r === 2 ? 25 : r === 3 ? 10 : 0); }, 0); }
function begin(be, name, sitting, token) { return be.post({ action: 'begin', name: name, sitting: sitting, token: token }); }
function submit(be, name, sitting, token, results, extra) { var b = { action: 'submit', name: name, sitting: sitting, token: token, questions: qs(results), clientTotalH: hundredths(results) }; if (extra) Object.keys(extra).forEach(function (k) { b[k] = extra[k]; }); return be.post(b); }

console.log('Health and bad input');
(function () {
  var be = H.createBackend();
  eq(be.get().ok, true, 'GET health');
  ok(JSON.stringify(be.get()).indexOf('Student') === -1, 'GET leaks no data');
  eq(be.post('not json').code, 'bad_json', 'bad json');
  eq(be.post({ action: 'nope' }).code, 'bad_action', 'bad action');
  eq(be.post({ action: 'begin', name: '', sitting: 1, token: tok() }).code, 'bad_name', 'empty name');
  eq(be.post({ action: 'begin', name: '=HYPERLINK("x")', sitting: 1, token: tok() }).code, 'bad_name', 'formula-looking name rejected');
  eq(begin(be, 'Amina', 3, tok()).code, 'bad_sitting', 'sitting 3 rejected');
  eq(begin(be, 'Amina', 1, 'short').code, 'bad_token', 'short token rejected');
  eq(be.post('x'.repeat(30000)).code, 'too_large', 'oversize rejected');
  eq(be.table('Sittings').length, 1, 'rejected requests registered nothing');
})();

console.log('Sitting 1, then sitting 2 appended');
(function () {
  var be = H.createBackend();
  var t1 = tok(), t2 = tok();
  var r1 = [].concat(rep(10, 1), rep(10, 0)); // 10.00 = 50%
  eq(begin(be, 'Student A', 1, t1).ok, true, 'begin 1');
  var s1 = submit(be, 'Student A', 1, t1, r1);
  eq([s1.ok, s1.duplicate, s1.result.totalH, s1.result.percentX100], [true, false, 1000, 5000], 'submit 1 scored by server');
  var res = be.table('Assessment Results');
  eq(res.length, 2, 'header + one row');
  var row = res[1];
  eq([row[1], row[2], row[3], row[12], row[13]], ['Student A', t1, 1, 10, 50], 'row: name/session/sitting/raw/% ');
  eq([row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11]], [5, 25, 5, 25, 0, 0, 0, 0], 'page scores and contributions');
  eq([row[14], row[15], row[16], row[17], row[18], row[19], row[20]], [10, 0, 0, 10, 'Completed', 'Retake eligible', 'yes'], 'counts, status, outcome');
  eq(be.table('Question Performance').length, 21, '20 question rows');

  eq(begin(be, 'student  a', 1, tok()).code, 'already_sat', 'same name, other spelling, cannot redo sitting 1');
  var b2 = begin(be, 'Student A', 2, t2);
  eq(b2.ok, true, 'begin 2'); eq(b2.existing.sitting1.totalH, 1000, 'begin 2 returns first result');
  var r2 = [].concat(rep(16, 1), rep(4, 2)); // 17.00 = 85%
  var s2 = submit(be, 'Student A', 2, t2, r2);
  eq([s2.ok, s2.result.percentX100], [true, 8500], 'submit 2');
  var res2 = be.table('Assessment Results');
  eq(res2.length, 3, 'sitting 2 appended as a NEW row');
  eq([res2[1][3], res2[1][12], res2[2][3], res2[2][12]], [1, 10, 2, 17], 'both sittings intact');
  eq(res2[2][19], 'Reached 75%', 'outcome sitting 2');
  eq(begin(be, 'Student A', 2, tok()).code, 'already_sat', 'third sitting blocked (sitting 2 again)');
  eq(begin(be, 'Student A', 1, tok()).code, 'already_sat', 'sitting 1 again blocked');
  eq(be.table('Question Performance').length, 41, 'question rows for both sittings');
})();

console.log('75% rule on the server');
(function () {
  var be = H.createBackend(); var t = tok();
  begin(be, 'Passer', 1, t); submit(be, 'Passer', 1, t, rep(20, 1));
  var r = begin(be, 'Passer', 2, tok()); eq(r.code, 'passed', '100% cannot retake');
  var be2 = H.createBackend(); var t3 = tok();
  begin(be2, 'Edge', 1, t3); submit(be2, 'Edge', 1, t3, [].concat(rep(15, 1), rep(5, 0))); // exactly 75
  eq(begin(be2, 'Edge', 2, tok()).code, 'passed', 'exactly 75.00% cannot retake');
  var be3 = H.createBackend(); var t4 = tok();
  begin(be3, 'Close', 1, t4); var s = submit(be3, 'Close', 1, t4, [].concat(rep(14, 1), rep(3, 2), rep(2, 3), rep(1, 0))); // 14.95 = 74.75
  eq(s.result.percentX100, 7475, '74.75%');
  eq(begin(be3, 'Close', 2, tok()).ok, true, '74.75% can retake');
  eq(begin(be3, 'Nobody', 2, tok()).code, 'no_first_sitting', 'retake without sitting 1 rejected');
})();

console.log('Duplicates and retries');
(function () {
  var be = H.createBackend(); var t = tok();
  begin(be, 'Dupe Dan', 1, t);
  var a = submit(be, 'Dupe Dan', 1, t, rep(20, 1)); var b = submit(be, 'Dupe Dan', 1, t, rep(20, 1));
  eq([a.duplicate, b.ok, b.duplicate], [false, true, true], 'second send is a harmless duplicate');
  eq(b.result.totalH, 2000, 'duplicate returns stored result');
  eq(be.table('Assessment Results').length, 2, 'only one result row');
  eq(be.table('Question Performance').length, 21, 'only 20 question rows');
  // a duplicate with different (forged) scores still returns the stored result
  var c = submit(be, 'Dupe Dan', 1, t, rep(20, 0)); eq(c.result.totalH, 2000, 'resend with other data does not change stored result');
  // begin is idempotent for the same token (resume / retry)
  var be2 = H.createBackend(); var t2 = tok();
  eq(begin(be2, 'Retry Rae', 1, t2).ok, true, 'begin'); var again = begin(be2, 'Retry Rae', 1, t2);
  eq([again.ok, again.resumed], [true, true], 'begin retry with same token ok');
  eq(be2.table('Sittings').length, 2, 'no duplicate registry row');
})();

console.log('Stolen / cleared storage scenarios');
(function () {
  var be = H.createBackend(); var t = tok();
  begin(be, 'Cleared Cal', 1, t);
  eq(begin(be, 'Cleared Cal', 1, tok()).code, 'in_progress_elsewhere', 'new token while one is open is blocked');
  eq(submit(be, 'Cleared Cal', 1, tok(), rep(20, 1)).code, 'token_mismatch', 'submit with wrong token rejected');
  eq(submit(be, 'Never Started', 1, tok(), rep(20, 1)).code, 'not_registered', 'submit without begin rejected (fail closed)');
  eq(be.table('Assessment Results').length, 1, 'nothing written by rejected submits');
  // teacher resets the abandoned sitting
  var sh = be.sheets['Sittings']; var i = sh.rows.findIndex(function (r) { return r[1] === 'Cleared Cal'; }); sh.rows[i][4] = 'reset';
  eq(begin(be, 'Cleared Cal', 1, tok()).ok, true, 'after teacher reset a fresh sitting 1 can start');
})();

console.log('Server-side validation of answers');
(function () {
  var be = H.createBackend(); var t = tok(); begin(be, 'Val Vera', 1, t);
  var base = qs(rep(20, 1));
  function sub(list, extra) { var b = { action: 'submit', name: 'Val Vera', sitting: 1, token: t, questions: list }; if (extra) Object.keys(extra).forEach(function (k) { b[k] = extra[k]; }); return be.post(b); }
  eq(sub(base.slice(0, 19)).code, 'bad_questions', 'too few');
  eq(sub(base.concat([base[0]])).code, 'bad_questions', 'too many');
  var dupe = base.slice(); dupe[3] = Object.assign({}, dupe[0]); eq(sub(dupe).code, 'bad_questions', 'duplicate id');
  var unk = base.slice(); unk[0] = Object.assign({}, unk[0], { id: 'p9q9' }); eq(sub(unk).code, 'bad_questions', 'unknown id');
  var att = base.slice(); att[0] = Object.assign({}, att[0], { attempts: 4 }); eq(sub(att).code, 'bad_questions', 'attempts 4');
  var att0 = base.slice(); att0[0] = Object.assign({}, att0[0], { attempts: 0 }); eq(sub(att0).code, 'bad_questions', 'attempts 0');
  var rev = base.slice(); rev[0] = Object.assign({}, rev[0], { status: 'revealed', attempts: 1 }); eq(sub(rev).code, 'bad_questions', 'revealed needs 3 attempts');
  var st = base.slice(); st[0] = Object.assign({}, st[0], { status: 'open' }); eq(sub(st).code, 'bad_questions', 'open question');
  eq(sub('nope').code, 'bad_questions', 'questions not an array');
  eq(be.table('Assessment Results').length, 1, 'nothing written by invalid submits');
  // server ignores a client-claimed score
  var forged = sub(qs(rep(20, 0)), { clientTotalH: 2000 });
  eq([forged.ok, forged.result.totalH, forged.clientScoreMatched], [true, 0, false], 'server computes its own score; mismatch flagged');
  eq(be.table('Assessment Results')[1][20].indexOf('NO'), 0, 'mismatch recorded in the sheet');
  // injection: concept with a formula is dropped
  var be2 = H.createBackend(); var t2 = tok(); begin(be2, 'Inject Ian', 1, t2);
  var l = qs(rep(20, 1)); l[0].concept = '=IMPORTXML("http://x")';
  be2.post({ action: 'submit', name: 'Inject Ian', sitting: 1, token: t2, questions: l });
  eq(be2.table('Question Performance')[1][6], '', 'formula-like concept blanked');
})();

console.log('Roster');
(function () {
  var be = H.createBackend();
  eq(begin(be, 'Anyone Goes', 1, tok()).ok, true, 'empty roster allows anyone');
  be.sheets['Roster'].rows.push(['Wanjiru Kamau']); be.sheets['Roster'].rows.push(["Brian O'Connor"]);
  eq(begin(be, 'Stranger Danger', 1, tok()).code, 'not_on_roster', 'not on roster rejected');
  eq(begin(be, 'wanjiru  KAMAU', 1, tok()).ok, true, 'roster match ignores case/spacing');
  eq(begin(be, 'Brian OConnor', 1, tok()).ok, true, 'roster apostrophe tolerant');
})();

console.log('Failure handling (server errors never leave a half-saved sitting)');
(function () {
  var failQ = true;
  var be = H.createBackend({ failOnWrite: function (name) { return failQ && name === 'Question Performance'; } });
  var t = tok(); begin(be, 'Flaky Fay', 1, t);
  var r = submit(be, 'Flaky Fay', 1, t, rep(20, 1));
  eq([r.ok, r.code], [false, 'server_error'], 'write failure reported');
  var reg = be.table('Sittings').filter(function (x) { return x[1] === 'Flaky Fay'; })[0];
  eq(reg[4], 'started', 'sitting still "started" so the student can resend');
  failQ = false;
  var ok2 = submit(be, 'Flaky Fay', 1, t, rep(20, 1));
  eq(ok2.ok, true, 'resend succeeds');
  eq(be.table('Sittings').filter(function (x) { return x[1] === 'Flaky Fay'; })[0][4], 'completed', 'now completed');
  eq(be.table('Assessment Results').length, 2, 'half-failed submit then resend leaves exactly ONE result row');
  eq(be.table('Question Performance').length, 21, 'and exactly 20 question rows');
  ok(be.log.errors.length >= 1, 'error was logged server-side');
  eq(be.log.locks > 0 && true, true, 'lock used');
})();

console.log('Class Summary');
(function () {
  var be = H.createBackend();
  [['A One', rep(20, 1)], ['B Two', [].concat(rep(10, 1), rep(10, 0))]].forEach(function (s) { var t = tok(); begin(be, s[0], 1, t); submit(be, s[0], 1, t, s[1]); });
  var t = tok(); begin(be, 'B Two', 2, t); submit(be, 'B Two', 2, t, rep(20, 1));
  var sum = be.table('Class Summary'); var flat = sum.map(function (r) { return r.join('|'); }).join('\n');
  ok(/Students with results\|2/.test(flat), 'two students');
  ok(/Sittings recorded\|3/.test(flat), 'three sittings');
  ok(/Students who retook\|1/.test(flat), 'one retook');
  ok(/of whom improved\|1/.test(flat), 'one improved');
  ok(/Average % \(sitting 1\)\|75/.test(flat), 'average sitting-1 = 75');
  ok(/p3q1\|3/.test(flat), 'question table present');
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
