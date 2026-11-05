/**
 * Young Engineers – The Code Quest · results backend (Google Apps Script)
 *
 * Paste this whole file into the Apps Script project that is attached to your results spreadsheet
 * (Extensions → Apps Script), run setup() once, then deploy as a Web app. See README.md.
 *
 * What it does
 *  - begin:  registers a sitting BEFORE the student starts (this is what enforces the two-sitting limit,
 *            because the registry lives here, not in the student's browser).
 *  - submit: validates a finished sitting, works out the score ITSELF from the attempt data, and appends
 *            a NEW row to "Assessment Results" plus one row per question to "Question Performance".
 *  - duplicates: re-sending the same sitting is safe; it returns the stored result and writes nothing twice.
 *  - Class Summary is rebuilt after every submission.
 *
 * Honest limits (also in README.md)
 *  - The server cannot see which options a student clicked, only the attempt data the page reports.
 *    A determined student could forge a submission. This protects against accidents, refreshes, cleared
 *    storage and new tabs, not against a student writing their own HTTP requests.
 *  - A student is identified by the NAME they type. For real enforcement fill in the "Roster" tab so only
 *    listed names can start, and so two students cannot collide on one name.
 *
 * No credentials live in the web page. The script runs as YOU and the spreadsheet is never public.
 */

/* ───────────── configuration ───────────── */
var CFG = {
  SHEETS: {
    RESULTS: 'Assessment Results',
    QUESTIONS: 'Question Performance',
    SUMMARY: 'Class Summary',
    SITTINGS: 'Sittings',
    ROSTER: 'Roster'
  },
  PAGES: 4,
  QUESTIONS_PER_PAGE: 5,
  MAX_SITTINGS: 2,
  PASS_PERCENT: 75,
  POINTS_H: { 1: 100, 2: 25, 3: 10 }, // hundredths of a point by attempt on which it was first correct
  H: 100,
  MAX_BODY_CHARS: 20000,
  LOCK_WAIT_MS: 20000
};

var RESULT_HEADERS = [
  'Timestamp', 'Student Name', 'Session ID', 'Sitting',
  'Page 1 Score (/5)', 'Page 1 Contribution (/25%)',
  'Page 2 Score (/5)', 'Page 2 Contribution (/25%)',
  'Page 3 Score (/5)', 'Page 3 Contribution (/25%)',
  'Page 4 Score (/5)', 'Page 4 Contribution (/25%)',
  'Overall Raw (/20)', 'Overall %',
  '1st-Attempt Correct', '2nd-Attempt Correct', '3rd-Attempt Correct', 'Answers Revealed',
  'Completion Status', 'Outcome', 'Client Score Matched'
];
var QUESTION_HEADERS = ['Timestamp', 'Student Name', 'Session ID', 'Sitting', 'Page', 'Question ID', 'Concept', 'Type', 'Attempts Used', 'Result', 'Points'];
var SITTING_HEADERS = ['Key', 'Student Name', 'Sitting', 'Session ID', 'Status', 'Started At', 'Completed At', 'Total (hundredths)', 'Page Totals (JSON)'];
var ROSTER_HEADERS = ['Student Name (leave this tab empty to allow anyone)'];

/* ───────────── HTTP entry points ───────────── */
function doGet() {
  // Health check only. Never returns any student data.
  return json_({ ok: true, service: 'code-quest-results', version: 2 });
}

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents;
    if (!raw) return json_(fail_('bad_request', 'Empty request.'));
    if (raw.length > CFG.MAX_BODY_CHARS) return json_(fail_('too_large', 'Request too large.'));
    var body;
    try { body = JSON.parse(raw); } catch (err) { return json_(fail_('bad_json', 'Request was not valid JSON.')); }
    if (!body || typeof body !== 'object') return json_(fail_('bad_request', 'Invalid request.'));

    var lock = LockService.getScriptLock();
    try { lock.waitLock(CFG.LOCK_WAIT_MS); }
    catch (err) { return json_(fail_('busy', 'The server is busy. Please try again in a moment.')); }
    try {
      if (body.action === 'begin') return json_(begin_(body));
      if (body.action === 'submit') return json_(submit_(body));
      return json_(fail_('bad_action', 'Unknown action.'));
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    return json_(fail_('server_error', 'Something went wrong on the server. Nothing was lost on your device. Please try again.'));
  }
}

/* ───────────── begin ───────────── */
function begin_(b) {
  var v = validateCommon_(b);
  if (!v.ok) return v;
  var key = v.key, name = v.name, sitting = v.sitting, token = v.token;

  var ss = ss_();
  var roster = rosterKeys_(ss);
  if (roster && !roster[key]) return fail_('not_on_roster', 'This name is not on the class list. Please check the spelling or ask your teacher.');

  var sheet = ensureSheet_(ss, CFG.SHEETS.SITTINGS, SITTING_HEADERS);
  var rows = sittingRows_(sheet, key);
  var active = function (n) { return rows.filter(function (r) { return r.sitting === n && (r.status === 'started' || r.status === 'completed'); })[0]; };
  var s1 = active(1), s2 = active(2);
  var existing = {
    sitting1: s1 && s1.status === 'completed' ? publicSitting_(s1) : null,
    sitting2: s2 && s2.status === 'completed' ? publicSitting_(s2) : null
  };

  if (sitting === 1) {
    if (s1) {
      if (s1.status === 'started' && s1.token === token) return { ok: true, sitting: 1, resumed: true, existing: existing };
      if (s1.status === 'started') return fail_('in_progress_elsewhere', 'A first sitting for this name was already started on another device or browser. Please ask your teacher to reset it.', { existing: existing });
      return fail_('already_sat', 'The first sitting has already been completed.', { existing: existing });
    }
    appendSitting_(sheet, key, name, 1, token);
    return { ok: true, sitting: 1, existing: existing };
  }

  // sitting 2
  if (!s1 || s1.status !== 'completed') return fail_('no_first_sitting', 'The first sitting has to be completed before a retake.', { existing: existing });
  if (isPass_(s1.totalH)) return fail_('passed', 'A retake is only available below ' + CFG.PASS_PERCENT + '%.', { existing: existing });
  if (s2) {
    if (s2.status === 'started' && s2.token === token) return { ok: true, sitting: 2, resumed: true, existing: existing };
    if (s2.status === 'started') return fail_('in_progress_elsewhere', 'The retake for this name was already started on another device or browser. Please ask your teacher to reset it.', { existing: existing });
    return fail_('already_sat', 'Both sittings have already been used.', { existing: existing });
  }
  appendSitting_(sheet, key, name, 2, token);
  return { ok: true, sitting: 2, existing: existing };
}

/* ───────────── submit ───────────── */
function submit_(b) {
  var v = validateCommon_(b);
  if (!v.ok) return v;
  var key = v.key, name = v.name, sitting = v.sitting, token = v.token;

  var calc = scoreQuestions_(b.questions);
  if (!calc.ok) return calc;

  var ss = ss_();
  var sSheet = ensureSheet_(ss, CFG.SHEETS.SITTINGS, SITTING_HEADERS);
  var rows = sittingRows_(sSheet, key);
  var mine = rows.filter(function (r) { return r.sitting === sitting && (r.status === 'started' || r.status === 'completed'); })[0];

  if (!mine) return fail_('not_registered', 'This sitting was not registered before it started, so it cannot be saved. Please tell your teacher.');
  if (mine.token !== token) return fail_('token_mismatch', 'This sitting does not match the one that was started. Please tell your teacher.');
  if (mine.status === 'completed') {
    // duplicate: same sitting sent again. Safe, writes nothing.
    return { ok: true, duplicate: true, sitting: sitting, result: publicSitting_(mine) };
  }
  if (sitting === 2) {
    var first = rows.filter(function (r) { return r.sitting === 1 && r.status === 'completed'; })[0];
    if (!first) return fail_('no_first_sitting', 'The first sitting has to be completed before a retake.');
    if (isPass_(first.totalH)) return fail_('passed', 'A retake is only available below ' + CFG.PASS_PERCENT + '%.');
  }

  var now = new Date();
  var rSheet = ensureSheet_(ss, CFG.SHEETS.RESULTS, RESULT_HEADERS);
  var qSheet = ensureSheet_(ss, CFG.SHEETS.QUESTIONS, QUESTION_HEADERS);

  var pct = pctX100_(calc.totalH);
  var outcome = isPass_(calc.totalH) ? 'Reached ' + CFG.PASS_PERCENT + '%' : (sitting >= CFG.MAX_SITTINGS ? 'Final sitting used' : 'Retake eligible');
  var matched = b.clientTotalH === calc.totalH ? 'yes' : 'NO (client sent ' + safeNumber_(b.clientTotalH) + ')';

  var row = [now, name, token, sitting];
  for (var p = 0; p < CFG.PAGES; p++) { row.push(calc.pageH[p] / CFG.H); row.push(pctX100_(calc.pageH[p]) / 100); }
  row.push(calc.totalH / CFG.H, pct / 100, calc.counts.first, calc.counts.second, calc.counts.third, calc.counts.revealed, 'Completed', outcome, matched);
  // Idempotent writes: if an earlier attempt failed half-way, rows already written for this session id are not repeated.
  if (!hasToken_(rSheet, token)) rSheet.appendRow(row);

  var qRows = calc.items.map(function (it) {
    return [now, name, token, sitting, it.page, it.id, it.concept, it.type, it.attempts, it.status === 'revealed' ? 'Revealed' : 'Correct on try ' + it.attempts, it.pointsH / CFG.H];
  });
  if (!hasToken_(qSheet, token)) qSheet.getRange(qSheet.getLastRow() + 1, 1, qRows.length, QUESTION_HEADERS.length).setValues(qRows);

  // mark the registry LAST: a failure above leaves the sitting 'started', so the student can resend safely
  var line = mine.rowIndex;
  sSheet.getRange(line, 5, 1, 5).setValues([['completed', mine.startedAt, now, calc.totalH, JSON.stringify(calc.pageH)]]);

  try { rebuildSummary_(ss); } catch (err) { console.error('summary: ' + (err && err.stack ? err.stack : err)); }

  return {
    ok: true,
    duplicate: false,
    sitting: sitting,
    result: { sitting: sitting, totalH: calc.totalH, pageH: calc.pageH, percentX100: pct, counts: calc.counts },
    clientScoreMatched: b.clientTotalH === calc.totalH
  };
}

/* ───────────── validation ───────────── */
function validateCommon_(b) {
  var nm = validateName_(b.name);
  if (!nm.ok) return fail_('bad_name', nm.error);
  var sitting = b.sitting;
  if (sitting !== 1 && sitting !== 2) return fail_('bad_sitting', 'Sitting must be 1 or 2.');
  var token = b.token;
  if (typeof token !== 'string' || !/^[A-Za-z0-9\-_]{8,80}$/.test(token)) return fail_('bad_token', 'Missing or invalid sitting id.');
  return { ok: true, name: nm.name, key: nameKey_(nm.name), sitting: sitting, token: token };
}

function validateName_(raw) {
  var name = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 40) return { ok: false, error: 'Name must be 2 to 40 characters.' };
  if (!/^\p{L}[\p{L}\p{M}'’.\- ]*$/u.test(name)) return { ok: false, error: 'Name contains characters that are not allowed.' };
  return { ok: true, name: name };
}

// MUST stay identical to QuizEngine.nameKey in js/quiz-engine.js
function nameKey_(name) {
  return String(name == null ? '' : name).normalize('NFKC').toLowerCase().replace(/[’'.]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

function questionIds_() {
  var ids = [];
  for (var p = 1; p <= CFG.PAGES; p++) for (var q = 1; q <= CFG.QUESTIONS_PER_PAGE; q++) ids.push({ id: 'p' + p + 'q' + q, page: p, type: q === CFG.QUESTIONS_PER_PAGE ? 'multi' : 'single' });
  return ids;
}

// The server works the points out itself from attempts + status. A "points" field from the client is never trusted.
function scoreQuestions_(list) {
  var bank = questionIds_();
  if (!Array.isArray(list) || list.length !== bank.length) return fail_('bad_questions', 'Expected ' + bank.length + ' answered questions.');
  var byId = {};
  for (var i = 0; i < list.length; i++) {
    var x = list[i];
    if (!x || typeof x !== 'object' || typeof x.id !== 'string') return fail_('bad_questions', 'Malformed question entry.');
    if (byId[x.id]) return fail_('bad_questions', 'Duplicate question ' + x.id + '.');
    byId[x.id] = x;
  }
  var pageH = [], items = [], totalH = 0;
  for (var p = 0; p < CFG.PAGES; p++) pageH.push(0);
  var counts = { first: 0, second: 0, third: 0, revealed: 0 };
  for (var k = 0; k < bank.length; k++) {
    var def = bank[k], q = byId[def.id];
    if (!q) return fail_('bad_questions', 'Missing question ' + def.id + '.');
    if (!(q.attempts === 1 || q.attempts === 2 || q.attempts === 3)) return fail_('bad_questions', 'Invalid attempts for ' + def.id + '.');
    if (q.status !== 'correct' && q.status !== 'revealed') return fail_('bad_questions', 'Invalid status for ' + def.id + '.');
    if (q.status === 'revealed' && q.attempts !== 3) return fail_('bad_questions', 'A revealed answer needs three attempts (' + def.id + ').');
    var pts = q.status === 'correct' ? CFG.POINTS_H[q.attempts] : 0;
    if (q.status === 'revealed') counts.revealed++; else if (q.attempts === 1) counts.first++; else if (q.attempts === 2) counts.second++; else counts.third++;
    pageH[def.page - 1] += pts;
    totalH += pts;
    items.push({ id: def.id, page: def.page, type: def.type, attempts: q.attempts, status: q.status, pointsH: pts, concept: cleanConcept_(q.concept) });
  }
  return { ok: true, pageH: pageH, totalH: totalH, counts: counts, items: items };
}

function cleanConcept_(c) {
  c = String(c == null ? '' : c).trim();
  return /^[A-Za-z0-9 &'\-]{1,40}$/.test(c) ? c : '';
}

function safeNumber_(n) { return typeof n === 'number' && isFinite(n) ? n : 'n/a'; }
function maxH_() { return CFG.PAGES * CFG.QUESTIONS_PER_PAGE * CFG.H; }
function pctX100_(h) { return Math.round((h * 10000) / maxH_()); }
function isPass_(h) { return h * 100 >= CFG.PASS_PERCENT * maxH_(); }

/* ───────────── sheet helpers ───────────── */
function ss_() {
  var s = SpreadsheetApp.getActiveSpreadsheet();
  if (s) return s;
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('No spreadsheet: bind this script to a sheet or set the SPREADSHEET_ID script property.');
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (headers && sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}

// true when any data row already carries this session id (column C)
function hasToken_(sheet, token) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var col = sheet.getRange(2, 3, last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) if (String(col[i][0]) === token) return true;
  return false;
}

function sittingRows_(sheet, key) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var vals = sheet.getRange(2, 1, last - 1, SITTING_HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var r = vals[i];
    if (String(r[0]) !== key) continue;
    var pageH = [];
    try { pageH = r[8] ? JSON.parse(r[8]) : []; } catch (e) { pageH = []; }
    out.push({ rowIndex: i + 2, key: key, name: r[1], sitting: Number(r[2]), token: String(r[3]), status: String(r[4]), startedAt: r[5], completedAt: r[6], totalH: Number(r[7]) || 0, pageH: pageH });
  }
  return out;
}

function appendSitting_(sheet, key, name, sitting, token) {
  sheet.appendRow([key, name, sitting, token, 'started', new Date(), '', '', '']);
}

function publicSitting_(r) {
  return { sitting: r.sitting, totalH: r.totalH, pageH: r.pageH, percentX100: pctX100_(r.totalH) };
}

function rosterKeys_(ss) {
  var sh = ss.getSheetByName(CFG.SHEETS.ROSTER);
  if (!sh || sh.getLastRow() < 2) return null; // empty roster = anyone may take part
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  var map = {}, any = false;
  for (var i = 0; i < vals.length; i++) {
    var k = nameKey_(vals[i][0]);
    if (k) { map[k] = true; any = true; }
  }
  return any ? map : null;
}

/* ───────────── Class Summary ───────────── */
function rebuildSummary_(ss) {
  var rSheet = ensureSheet_(ss, CFG.SHEETS.RESULTS, RESULT_HEADERS);
  var qSheet = ensureSheet_(ss, CFG.SHEETS.QUESTIONS, QUESTION_HEADERS);
  var out = ensureSheet_(ss, CFG.SHEETS.SUMMARY, null);

  var results = rSheet.getLastRow() > 1 ? rSheet.getRange(2, 1, rSheet.getLastRow() - 1, RESULT_HEADERS.length).getValues() : [];
  var qs = qSheet.getLastRow() > 1 ? qSheet.getRange(2, 1, qSheet.getLastRow() - 1, QUESTION_HEADERS.length).getValues() : [];

  var students = {};
  results.forEach(function (r) {
    var k = nameKey_(r[1]);
    var s = students[k] || (students[k] = { name: r[1], p1: null, p2: null });
    var pct = Number(r[13]);
    if (Number(r[3]) === 1) s.p1 = pct; else s.p2 = pct;
  });
  var list = Object.keys(students).map(function (k) { return students[k]; });
  var avg = function (arr) { return arr.length ? Math.round(arr.reduce(function (a, b) { return a + b; }, 0) / arr.length * 100) / 100 : ''; };
  var firsts = list.filter(function (s) { return s.p1 !== null; }).map(function (s) { return s.p1; });
  var bests = list.map(function (s) { return Math.max(s.p1 === null ? 0 : s.p1, s.p2 === null ? 0 : s.p2); });
  var retook = list.filter(function (s) { return s.p2 !== null; });
  var improved = retook.filter(function (s) { return s.p2 > s.p1; }).length;

  var stats = {};
  qs.forEach(function (r) {
    var id = String(r[5]);
    var s = stats[id] || (stats[id] = { id: id, page: r[4], concept: r[6], n: 0, first: 0, revealed: 0, pts: 0 });
    s.n++; if (Number(r[8]) === 1 && String(r[9]) !== 'Revealed') s.first++; if (String(r[9]) === 'Revealed') s.revealed++; s.pts += Number(r[10]) || 0;
  });
  var qList = Object.keys(stats).map(function (k) { return stats[k]; }).sort(function (a, b) {
    return (a.first / a.n) - (b.first / b.n) || a.id.localeCompare(b.id);
  });

  var rows = [];
  rows.push(['CLASS SUMMARY (rebuilt automatically after every submission)', '', '', '', '', '']);
  rows.push(['Last updated', new Date(), '', '', '', '']);
  rows.push(['', '', '', '', '', '']);
  rows.push(['Students with results', list.length, '', '', '', '']);
  rows.push(['Sittings recorded', results.length, '', '', '', '']);
  rows.push(['Average % (sitting 1)', avg(firsts), '', '', '', '']);
  rows.push(['Average of each student\'s best %', avg(bests), '', '', '', '']);
  rows.push(['Students at or above ' + CFG.PASS_PERCENT + '% on their best sitting', bests.filter(function (b) { return b >= CFG.PASS_PERCENT; }).length, '', '', '', '']);
  rows.push(['Students who retook', retook.length, '', '', '', '']);
  rows.push(['  of whom improved', improved, '', '', '', '']);
  rows.push(['', '', '', '', '', '']);
  rows.push(['QUESTIONS, hardest first', '', '', '', '', '']);
  rows.push(['Question', 'Page', 'Concept', 'Times answered', 'Correct on 1st try %', 'Answer revealed (count)']);
  qList.forEach(function (s) { rows.push([s.id, s.page, s.concept, s.n, Math.round(s.first / s.n * 10000) / 100, s.revealed]); });

  out.clearContents();
  out.getRange(1, 1, rows.length, 6).setValues(rows);
  out.getRange(1, 1, 1, 1).setFontWeight('bold');
}

/* ───────────── responses ───────────── */
function fail_(code, error, extra) {
  var o = { ok: false, code: code, error: error };
  if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
  return o;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ───────────── one-time setup (run from the Apps Script editor) ───────────── */
function setup() {
  var ss = ss_();
  ensureSheet_(ss, CFG.SHEETS.RESULTS, RESULT_HEADERS);
  ensureSheet_(ss, CFG.SHEETS.QUESTIONS, QUESTION_HEADERS);
  ensureSheet_(ss, CFG.SHEETS.SUMMARY, null);
  ensureSheet_(ss, CFG.SHEETS.SITTINGS, SITTING_HEADERS);
  ensureSheet_(ss, CFG.SHEETS.ROSTER, ROSTER_HEADERS);
  rebuildSummary_(ss);
  console.log('Setup complete. Now deploy as a Web app (see README).');
}
