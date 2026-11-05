/*
 * LIVE check of your DEPLOYED Google Apps Script web app. This is the only test that proves the integration
 * works on Google's servers. Run it yourself after deploying:
 *
 *     node tools/live-backend-check.js "https://script.google.com/macros/s/XXXX/exec"
 *
 * It uses a made-up student called "Zz Livecheck <random letters>". It adds a few rows to your sheet
 * (one Sitting 1 result and 20 question rows, plus one registry row). Delete those rows afterwards.
 * It does NOT touch real students' rows. Needs Node 18+ and internet access.
 */
'use strict';
var url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) { console.error('Usage: node tools/live-backend-check.js "https://script.google.com/macros/s/.../exec"'); process.exit(2); }

var letters = 'abcdefghijklmnopqrstuvwxyz', rnd = ''; for (var i = 0; i < 6; i++) rnd += letters[Math.floor(Math.random() * 26)];
var name = 'Zz Livecheck ' + rnd, token = require('crypto').randomUUID();
var passed = 0, failed = 0;
function ok(c, l, extra) { if (c) { passed++; console.log('  ok   ' + l); } else { failed++; console.log('  FAIL ' + l + (extra ? '  ' + JSON.stringify(extra) : '')); } }

async function post(b) {
  var r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(b), redirect: 'follow' });
  var t = await r.text();
  try { return JSON.parse(t); } catch (e) { return { ok: false, code: 'not_json', raw: t.slice(0, 200) }; }
}
function qs() { var o = []; for (var p = 1; p <= 4; p++) for (var q = 1; q <= 5; q++) o.push({ id: 'p' + p + 'q' + q, page: p, concept: 'Live check', type: q === 5 ? 'multi' : 'single', attempts: 2, status: 'correct' }); return o; }

(async function () {
  console.log('Checking ' + url + '\nTest student: ' + name);
  var g = await (await fetch(url, { redirect: 'follow' })).json().catch(function () { return null; });
  ok(g && g.ok === true && g.service === 'code-quest-results', 'GET health check answers', g);
  var bad = await post({ action: 'begin', name: '', sitting: 1, token: token }); ok(bad.ok === false && bad.code === 'bad_name', 'invalid name is refused', bad);
  var sub0 = await post({ action: 'submit', name: name, sitting: 1, token: token, questions: qs() }); ok(sub0.ok === false && sub0.code === 'not_registered', 'submit before begin is refused', sub0);
  var b = await post({ action: 'begin', name: name, sitting: 1, token: token }); ok(b.ok === true, 'begin sitting 1', b);
  var s = await post({ action: 'submit', name: name, sitting: 1, token: token, questions: qs(), clientTotalH: 500 }); ok(s.ok === true && s.duplicate === false, 'submit sitting 1', s);
  ok(s.result && s.result.totalH === 500 && s.result.percentX100 === 2500, 'server scored it: 5.00 points = 25.00%', s.result);
  var d = await post({ action: 'submit', name: name, sitting: 1, token: token, questions: qs(), clientTotalH: 500 }); ok(d.ok === true && d.duplicate === true, 'sending it again is a harmless duplicate', d);
  var again = await post({ action: 'begin', name: name.toUpperCase(), sitting: 1, token: require('crypto').randomUUID() }); ok(again.ok === false && again.code === 'already_sat', 'sitting 1 cannot be started again', again);
  var b2 = await post({ action: 'begin', name: name, sitting: 2, token: require('crypto').randomUUID() }); ok(b2.ok === true, 'sitting 2 allowed (25% is below 75%)', b2);
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  console.log('Now open the spreadsheet and confirm: one new row in "Assessment Results" for "' + name + '" (Sitting 1, 5, 25%, ...),\n20 rows in "Question Performance", and two rows in "Sittings". Then delete those rows.');
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error('Could not complete the check:', e.message); process.exit(1); });
