/*
 * End-to-end tests in a real (headless) browser, against the real app and the REAL Apps Script file
 * running on a mock spreadsheet. Run:  node tests/e2e.test.js
 * Needs Playwright with Chromium. Not needed by teachers, only by whoever maintains the project.
 */
'use strict';
var pw = require('playwright');
var Server = require('../tools/dev-server.js');

var PORT = 8131, PRACTICE_PORT = 8132;
var BASE = 'http://127.0.0.1:' + PORT + '/';
var passed = 0, failed = 0;
function ok(c, l) { if (c) passed++; else { failed++; console.log('  FAIL: ' + l); } }
function eq(a, b, l) { ok(JSON.stringify(a) === JSON.stringify(b), l + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function admin(p, port) { return fetch('http://127.0.0.1:' + (port || PORT) + '/__admin/' + p).then(function (r) { return r.json(); }); }

var browser;
async function newStudent(viewport, port) {
  var ctx = await browser.newContext({ viewport: viewport || { width: 1000, height: 900 }, reducedMotion: 'reduce' });
  var page = await ctx.newPage();
  await page.goto('http://127.0.0.1:' + (port || PORT) + '/');
  return { ctx: ctx, page: page };
}
async function text(page, sel) { return (await page.locator(sel).first().textContent() || '').trim(); }
async function start(page, name) {
  await page.fill('#student-name', name);
  await page.click('button[type=submit]');
  await page.waitForSelector('#q-prompt');
}
async function qinfo(page) {
  return page.evaluate(function () {
    var t = document.getElementById('q-prompt').textContent;
    var c = document.querySelector('.card pre.code code');
    var code = c ? c.textContent : null;
    var P = window.CodeQuestData.PAGES;
    for (var i = 0; i < P.length; i++) for (var j = 0; j < P[i].questions.length; j++) { var q = P[i].questions[j]; if (q.prompt === t && (q.code || null) === code) return q; }
  });
}
function answers(q) { return Array.isArray(q.answer) ? q.answer : [q.answer]; }
function wrongSet(q, n) {
  if (q.type !== 'multi') { var w = [0, 1, 2, 3].filter(function (i) { return i !== q.answer; }); return [w[n]]; }
  var c = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]].filter(function (x) { return x.join() !== q.answer.slice().sort().join(); }); return c[n];
}
async function pick(page, idxs) { for (var i = 0; i < idxs.length; i++) await page.click('.opt[data-index="' + idxs[i] + '"]'); }
async function check(page) { await page.click('button:has-text("Check Answer")'); }
// play current question: tries = 1,2,3 correct on that try; 0 = revealed. Returns feedback message.
async function playQ(page, tries) {
  var q = await qinfo(page), n = tries === 0 ? 3 : tries - 1;
  for (var k = 0; k < n; k++) { await pick(page, wrongSet(q, k)); await check(page); }
  if (tries !== 0) { await pick(page, answers(q)); await check(page); }
  else if (n === 3) { /* three wrong already done */ }
  return text(page, '.fb__msg');
}
async function nextQ(page) { await page.click('[data-autofocus-next]'); }
async function playSitting(page, results) {
  for (var p = 0; p < 4; p++) {
    for (var i = 0; i < 5; i++) {
      await playQ(page, results[p * 5 + i]);
      await nextQ(page);
    }
    if (p < 3) await page.waitForSelector('#result-title'); else await page.waitForSelector('#result-title');
    await page.click('.result .btn');
  }
  await page.waitForSelector('#final-title');
}
function rep(n, v) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }
async function noHScroll(page) { return page.evaluate(function () { return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1; }); }
async function results(port) { return (await admin('state', port)).results; }

(async function main() {
  var s1 = await Server.start(PORT);
  var s2 = await Server.start(PRACTICE_PORT, { practice: true });
  browser = await pw.chromium.launch();
  try {

  console.log('Welcome, names, structure');
  var A = await newStudent();
  eq(await text(A.page, 'h1'), 'WELCOME, YOUNG ENGINEER! 🚀', 'welcome heading');
  await A.page.click('button[type=submit]');
  ok((await text(A.page, '#name-error')).length > 0, 'empty name shows error');
  eq(await A.page.locator('button:has-text("Restart")').count(), 0, 'no Restart button on welcome');
  await start(A.page, 'Amina Otieno');
  eq(await A.page.locator('button:has-text("Restart")').count(), 0, 'no Restart button in quiz');
  eq(await text(A.page, '.qcount'), 'Question 1 of 5', 'five questions per page');
  ok((await text(A.page, '.tries')).indexOf('worth 1.00 pt') !== -1, 'points shown: worth 1.00 pt');
  var reg = (await admin('state')).sittings; eq(reg.length, 2, 'sitting registered on the server before the quiz started');

  console.log('Scoring messages in the UI');
  eq(await playQ(A.page, 1), 'WELL DONE! +1.00 POINTS! 🎉', 'first try message');
  ok((await text(A.page, '.fb')).indexOf('Why it works') !== -1, 'explanation shown after correct');
  eq(await A.page.locator('.opt:not(:disabled)').count(), 0, 'options locked after correct');
  await nextQ(A.page);
  eq(await playQ(A.page, 2), 'YOU GOT IT! +0.25 POINTS! 👏', 'second try message');
  await nextQ(A.page);
  eq(await playQ(A.page, 3), "THAT'S CORRECT! +0.10 POINTS! 💪", 'third try message');
  await nextQ(A.page);
  // a hint after wrong 1
  var q4 = await qinfo(A.page);
  await pick(A.page, wrongSet(q4, 0)); await check(A.page);
  eq(await text(A.page, '.fb__msg'), 'Not quite! Give it another try. 💡', 'try 1 message'); ok((await text(A.page, '.fb')).indexOf(q4.hints[0]) !== -1, 'hint 1 shown');
  ok((await text(A.page, '.tries')).indexOf('worth 0.25 pt') !== -1, 'worth drops to 0.25');
  await pick(A.page, wrongSet(q4, 1)); await check(A.page);
  eq(await text(A.page, '.fb__msg'), "Almost there! Think carefully. You've got this!", 'try 2 message');
  await pick(A.page, wrongSet(q4, 2)); await check(A.page);
  eq(await text(A.page, '.fb__msg'), "That was a tricky one! Here's the answer so you'll know it next time. 🔍", 'revealed message');
  ok((await text(A.page, '.fb')).indexOf('Why it is correct') !== -1, 'full explanation on reveal');
  eq(await A.page.locator('.opt.is-correct').count(), 1, 'correct option highlighted on reveal');

  console.log('Multi-select in the UI');
  await nextQ(A.page);
  var q5 = await qinfo(A.page);
  eq(q5.type, 'multi', 'Q5 multi'); ok(/Select TWO/.test(await text(A.page, '#q-prompt')), 'prompt says Select TWO');
  ok((await text(A.page, '.pick-note')).indexOf('0 of 2') !== -1, 'counter 0 of 2');
  eq(await A.page.locator('button:has-text("Check Answer")').isDisabled(), true, 'check disabled with nothing');
  await pick(A.page, [0]); eq(await A.page.locator('button:has-text("Check Answer")').isDisabled(), true, 'check disabled with 1 of 2');
  await pick(A.page, [1]); await pick(A.page, [2]);
  eq(await A.page.locator('.opt.is-selected').count(), 2, 'third pick refused (still two selected)');
  await A.page.click('.opt[data-index="1"]'); eq(await A.page.locator('.opt.is-selected').count(), 1, 'toggle off works');
  await A.page.click('.opt[data-index="0"]'); // deselect 0
  await pick(A.page, answers(q5)); await check(A.page);
  eq(await text(A.page, '.fb__msg'), 'WELL DONE! +1.00 POINTS! 🎉', 'multi correct first try');
  await nextQ(A.page);
  await A.page.waitForSelector('#result-title');
  // 1.00 + 0.25 + 0.10 + 0 + 1.00 = 2.35
  eq(await text(A.page, '.ring__num b'), '2.35', 'page ring shows 2.35');
  ok((await text(A.page, '.contrib')).indexOf('11.75%') !== -1 && (await text(A.page, '.contrib')).indexOf('of 25.00%') !== -1, 'page contribution 11.75% of 25.00%');
  ok((await text(A.page, '.recap')).indexOf('+0.25') !== -1, 'recap shows points');

  console.log('Resume');
  await A.page.click('.result .btn'); // to page 2, question 1
  await A.page.waitForSelector('#q-prompt');
  var q = await qinfo(A.page); await pick(A.page, wrongSet(q, 0)); await check(A.page); // 1 attempt used on P2Q1
  await A.page.close();
  var A2 = await A.ctx.newPage(); await A2.goto(BASE);
  eq(await text(A2, 'h1'), 'WELCOME BACK, AMINA OTIENO! 👋', 'welcome back heading');
  ok((await text(A2, '.welcome__lead')).indexOf('Looks like you have an unfinished Code Quest. Would you like to continue where you left off?') === 0, 'welcome back text');
  eq(await A2.locator('button:has-text("RESUME TEST")').count(), 1, 'RESUME TEST present');
  eq(await A2.locator('button:has-text("START NEW TEST")').count(), 0, 'START NEW TEST not offered mid-sitting');
  await A2.click('button:has-text("RESUME TEST")');
  await A2.waitForSelector('#q-prompt');
  eq(await text(A2, '.qcount'), 'Question 1 of 5', 'resumed on same question'); eq((await text(A2, '.page-head__title')).indexOf('Page 2'), 0, 'resumed on page 2');
  ok((await text(A2, '.tries')).indexOf('Try 2 of 3') !== -1, 'attempt counter NOT reset (try 2 of 3)');
  ok((await text(A2, '.fb')).indexOf(q.hints[0]) !== -1, 'hint restored');
  eq(await A2.locator('.opt.is-tried').count(), 1, 'tried option still struck out');
  // refresh also keeps place
  await A2.reload(); eq(await text(A2, 'h1'), 'WELCOME BACK, AMINA OTIENO! 👋', 'refresh shows welcome back again');
  await A2.click('button:has-text("RESUME TEST")'); await A2.waitForSelector('#q-prompt');
  ok((await text(A2, '.tries')).indexOf('Try 2 of 3') !== -1, 'still try 2 after refresh');
  // typing the same name on the welcome screen also resumes (does not restart)
  await A.ctx.close();

  console.log('Passing student (>= 75%): no retake');
  var P = await newStudent(); await start(P.page, 'Pass Peter');
  await playSitting(P.page, rep(20, 1));
  eq(await text(P.page, '#final-title'), 'CONGRATULATIONS, PASS PETER! 🎉', 'congratulations');
  eq(await text(P.page, '.stat:nth-child(1) b'), '20.00', 'raw 20.00'); eq(await text(P.page, '.stat:nth-child(2) b'), '100.00%', '100.00%');
  eq(await P.page.locator('button:has-text("RETAKE")').count(), 0, 'no retake offered at 100%');
  await P.page.waitForSelector('.submit--ok'); ok(true, 'saved status shown');
  var rr = await results(); eq(rr.length, 2, 'one result row on server'); eq([rr[1][1], rr[1][3], rr[1][12], rr[1][13]], ['Pass Peter', 1, 20, 100], 'server row correct');
  eq(await P.page.locator('button:has-text("Play again")').count(), 0, 'no Play again button');
  // new tab / refresh / cleared storage cannot start another sitting
  await P.page.reload(); await P.page.waitForSelector('#student-name');
  var P2 = await newStudent(); // fresh storage = cleared storage
  await P2.page.fill('#student-name', 'pass  peter'); await P2.page.click('button[type=submit]');
  await P2.page.waitForSelector('#final-title');
  ok(true, 'cleared-storage student is shown their stored result, not a new quiz');
  eq(await P2.page.locator('button:has-text("RETAKE")').count(), 0, 'still no retake after clearing storage');
  eq((await admin('state')).sittings.length, 3, 'no new sitting registered (header + Amina in progress + Peter)');
  await P.ctx.close(); await P2.ctx.close();

  console.log('Failing student (< 75%): exactly one retake');
  await admin('reset');
  var F = await newStudent(); await start(F.page, 'Fail Faith');
  var r1 = [].concat(rep(10, 1), rep(10, 0)); // 50%
  await playSitting(F.page, r1);
  eq(await text(F.page, '#final-title'), "YOUR JOURNEY ISN'T OVER! 🚀", 'journey message');
  ok((await text(F.page, '.retake-card')).indexOf('You scored 50.00%.') !== -1, 'shows score');
  ok((await text(F.page, '.retake-card')).indexOf('FINAL attempt') !== -1, 'says final attempt');
  eq(await F.page.locator('button:has-text("START FINAL RETAKE")').count(), 1, 'exactly one START FINAL RETAKE');
  eq(await F.page.locator('button:has-text("Restart")').count(), 0, 'no restart');
  await F.page.waitForSelector('.submit--ok');
  // close tab and reopen: greeted, offered result/retake (no unfinished test)
  var Fp = await F.ctx.newPage(); await Fp.goto(BASE);
  eq(await text(Fp, 'h1'), 'WELCOME BACK, FAIL FAITH! 👋', 'greeting for awaiting-retake student');
  eq(await Fp.locator('button:has-text("START FINAL RETAKE")').count(), 1, 'retake offered on return');
  await Fp.close();
  // cleared storage: server recognises the student, loads first result, still exactly one retake
  var F2 = await newStudent(); await F2.page.fill('#student-name', 'Fail Faith'); await F2.page.click('button[type=submit]');
  await F2.page.waitForSelector('#final-title');
  eq(await text(F2.page, '#final-title'), "YOUR JOURNEY ISN'T OVER! 🚀", 'server restored first result after cleared storage');
  eq(await F2.page.locator('button:has-text("START FINAL RETAKE")').count(), 1, 'retake still offered');
  eq((await admin('state')).sittings.length, 2, 'cleared storage did not register a new sitting 1');
  await F2.ctx.close();
  // start the retake
  await F.page.click('button:has-text("START FINAL RETAKE")'); await F.page.waitForSelector('#q-prompt');
  ok((await text(F.page, '.page-head__section')).indexOf('FINAL RETAKE') === 0, 'retake labelled in quiz');
  eq((await admin('state')).sittings.length, 3, 'sitting 2 registered');
  // abandon mid-retake, come back: resume (counter kept), cannot start another
  await playQ(F.page, 1); await nextQ(F.page);
  await F.page.reload(); await F.page.waitForSelector('h1');
  eq(await text(F.page, 'h1'), 'WELCOME BACK, FAIL FAITH! 👋', 'greeted mid-retake'); eq(await F.page.locator('button:has-text("START NEW TEST")').count(), 0, 'no new test mid-retake');
  await F.page.click('button:has-text("RESUME TEST")'); await F.page.waitForSelector('#q-prompt');
  eq(await text(F.page, '.qcount'), 'Question 2 of 5', 'retake resumed at Q2');
  // a second browser (cleared storage) cannot start a parallel sitting 2: server says in progress elsewhere
  var F3 = await newStudent(); await F3.page.fill('#student-name', 'Fail Faith'); await F3.page.click('button[type=submit]');
  await F3.page.waitForSelector('#final-title');
  await F3.page.click('button:has-text("START FINAL RETAKE")'); await F3.page.waitForSelector('.retake-card .field-error:not(:empty)');
  ok((await text(F3.page, '.retake-card .field-error')).indexOf('another device') !== -1, 'parallel retake refused with a clear reason');
  eq(await F3.page.locator('#q-prompt').count(), 0, 'parallel retake did not start');
  await F3.ctx.close();
  // finish retake: 17.00 = 85%
  await playQ(F.page, 1).catch(function () {}); // Q2 of page1 (already at Q2)
  await nextQ(F.page);
  for (var i = 2; i < 5; i++) { await playQ(F.page, 1); await nextQ(F.page); }
  await F.page.waitForSelector('#result-title'); await F.page.click('.result .btn');
  for (var p = 1; p < 4; p++) { for (var k = 0; k < 5; k++) { await playQ(F.page, k === 4 && p === 3 ? 0 : 1); await nextQ(F.page); } await F.page.waitForSelector('#result-title'); await F.page.click('.result .btn'); }
  await F.page.waitForSelector('#final-title');
  eq(await text(F.page, '#final-title'), 'CONGRATULATIONS, FAIL FAITH! 🎉', 'final congratulations');
  var cmpTxt = await text(F.page, '.compare'); ok(cmpTxt.indexOf('50.00%') !== -1 && cmpTxt.indexOf('95.00%') !== -1, 'comparison shows first and second');
  ok(cmpTxt.indexOf('+45.00 percentage points!') !== -1, 'improvement +45.00'); ok(/Best score.*95\.00% \(sitting 2\)/.test(cmpTxt), 'best score');
  eq(await F.page.locator('button:has-text("RETAKE")').count(), 0, 'no third sitting offered');
  await F.page.waitForSelector('.submit--ok');
  var rows = await results(); eq(rows.length, 3, 'sitting 2 appended as a new row'); eq([rows[1][3], rows[1][12], rows[2][3], rows[2][12]], [1, 10, 2, 19], 'both sittings intact on server');
  // third sitting impossible, even with cleared storage
  var F4 = await newStudent(); await F4.page.fill('#student-name', 'fail faith'); await F4.page.click('button[type=submit]'); await F4.page.waitForSelector('#final-title');
  eq(await F4.page.locator('button:has-text("RETAKE")').count(), 0, 'no third sitting after clearing storage'); ok((await text(F4.page, '.compare')).indexOf('45.00') !== -1, 'comparison restored from server');
  eq((await admin('state')).sittings.length, 3, 'still only two sittings registered'); await F4.ctx.close();
  eq(await F.page.evaluate(function () { return JSON.parse(localStorage.getItem('youngEngineers.codeQuest.v2')).profiles['fail faith'].sittings['1'].pageH.length; }), 4, 'first result preserved locally');
  await F.ctx.close();

  console.log('Network failure and duplicate protection');
  await admin('reset');
  var N = await newStudent(); await admin('fail?mode=network');
  await N.page.fill('#student-name', 'Net Nina'); await N.page.click('button[type=submit]');
  await N.page.waitForSelector('#name-error:not(:empty)');
  ok((await text(N.page, '#name-error')).indexOf("couldn't reach the results server") !== -1, 'begin fails closed with a friendly message');
  eq(await N.page.locator('#q-prompt').count(), 0, 'quest did not start without the server');
  await admin('fail?mode=off'); await N.page.click('button[type=submit]'); await N.page.waitForSelector('#q-prompt');
  await admin('fail?mode=network'); // network drops during the quest
  await playSitting(N.page, rep(20, 1));
  await N.page.waitForSelector('.submit--bad'); ok((await text(N.page, '.submit')).indexOf("couldn't save your result") !== -1, 'failed save shown');
  eq((await results()).length, 1, 'nothing on server while down');
  await admin('fail?mode=500'); await N.page.click('button:has-text("TRY AGAIN")'); await N.page.waitForSelector('.submit--bad button');
  eq(await text(N.page, '.final__stats .stat b'), '20.00', 'score still on screen after failures');
  await admin('fail?mode=off');
  await N.page.click('button:has-text("TRY AGAIN")'); await N.page.waitForSelector('.submit--ok');
  eq((await results()).length, 2, 'saved after reconnecting: exactly one row');
  // simulate a duplicate: reload the final screen and force another send from the same data
  await N.page.reload(); await N.page.fill('#student-name', 'Net Nina'); await N.page.click('button[type=submit]'); await N.page.waitForSelector('#final-title');
  var dup = await N.page.evaluate(function (url) {
    var s = JSON.parse(localStorage.getItem('youngEngineers.codeQuest.v2')); var p = s.profiles['net nina']; var r = p.sittings['1'];
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'submit', name: p.name, sitting: 1, token: r.token, questions: r.questions }) }).then(function (x) { return x.json(); });
  }, 'http://127.0.0.1:' + PORT + '/exec');
  eq([dup.ok, dup.duplicate], [true, true], 'duplicate submission acknowledged');
  eq((await results()).length, 2, 'duplicate wrote nothing'); eq((await admin('state')).questions.length, 21, 'no duplicate question rows');
  await N.ctx.close();

  console.log('Slow server / timeout');
  await admin('reset'); await admin('fail?mode=slow');
  var T = await newStudent(); await T.page.fill('#student-name', 'Slow Sam'); await T.page.click('button[type=submit]');
  await T.page.waitForSelector('#name-error:not(:empty)', { timeout: 8000 });
  ok(/took too long|couldn't reach/.test(await text(T.page, '#name-error')), 'timeout handled'); await admin('fail?mode=off'); await T.ctx.close();

  console.log('Practice mode (no backend configured): honest, no fake success');
  var Pr = await newStudent(null, PRACTICE_PORT);
  ok((await text(Pr.page, '.welcome__note')).indexOf('Practice mode') === 0, 'practice note on welcome');
  await start(Pr.page, 'Practice Pat'); await playSitting(Pr.page, rep(20, 1));
  await Pr.page.waitForSelector('.submit--warn'); ok((await text(Pr.page, '.submit')).indexOf('NOT sent') !== -1, 'says results were NOT sent');
  eq(await Pr.page.locator('.submit--ok').count(), 0, 'never claims saved'); await Pr.ctx.close();

  console.log('Mobile (360px)');
  await admin('reset');
  var M = await newStudent({ width: 360, height: 740 }); eq(await noHScroll(M.page), true, 'welcome fits');
  await start(M.page, 'Mobile Mo'); eq(await noHScroll(M.page), true, 'quiz fits');
  for (var z = 0; z < 4; z++) { await playQ(M.page, 1); await nextQ(M.page); }
  eq(await noHScroll(M.page), true, 'multi-select question fits');
  var box = await M.page.locator('.opt').first().boundingBox(); ok(box.height >= 44, 'option tap target >= 44px (' + Math.round(box.height) + ')');
  var qm = await qinfo(M.page); await pick(M.page, answers(qm)); var cb = await M.page.locator('button:has-text("Check Answer")').boundingBox(); ok(cb.height >= 44 && cb.x >= 0 && cb.x + cb.width <= 360, 'check button usable');
  await check(M.page); await nextQ(M.page); await M.page.waitForSelector('#result-title'); eq(await noHScroll(M.page), true, 'page result fits');
  await M.page.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + '/m-result.png' : '/dev/null' }).catch(function () {});
  await M.page.click('.result .btn');
  for (var pp = 1; pp < 4; pp++) { for (var kk = 0; kk < 5; kk++) { await playQ(M.page, 1); await nextQ(M.page); } await M.page.waitForSelector('#result-title'); await M.page.click('.result .btn'); }
  await M.page.waitForSelector('#final-title'); eq(await noHScroll(M.page), true, 'final fits');
  await M.ctx.close();

  } catch (e) { failed++; console.log('  CRASH: ' + (e && e.stack || e)); }
  await browser.close(); s1.close(); s2.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
