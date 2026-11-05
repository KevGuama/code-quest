/*
 * Engine + question-bank tests. Run with:  node tests/engine.test.js
 * No dependencies needed.
 */
'use strict';
const assert = require('assert');
const QuizEngine = require('../js/quiz-engine.js');
const { PAGES, QUESTIONS } = require('../js/questions.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { console.error('  ✘ ' + name + '\n      ' + e.message); process.exitCode = 1; }
}

function memoryStorage() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data
  };
}

function newEngine(storage) {
  return QuizEngine.create(PAGES, storage || memoryStorage());
}

function wrongIndexes(q) {
  return q.options.map((_, i) => i).filter((i) => i !== q.answer);
}

console.log('\nQuestion bank');
test('there are 4 pages with 4 questions each (16 total)', () => {
  assert.strictEqual(PAGES.length, 4);
  PAGES.forEach((p) => assert.strictEqual(p.questions.length, 4));
  assert.strictEqual(QUESTIONS.length, 16);
});
test('question ids are unique', () => {
  assert.strictEqual(new Set(QUESTIONS.map((q) => q.id)).size, 16);
});
test('every question has 4 options, a valid answer, 2 hints, an explanation', () => {
  QUESTIONS.forEach((q) => {
    assert.strictEqual(q.options.length, 4, q.id + ' options');
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, q.id + ' answer');
    assert.strictEqual(q.hints.length, 2, q.id + ' hints');
    assert.ok(q.hints.every((h) => h.length > 10), q.id + ' hint text');
    assert.ok(q.explanation.length > 20, q.id + ' explanation');
    assert.ok(q.concept && q.prompt, q.id + ' concept/prompt');
  });
});
test('every wrong option has a "why wrong" note; the correct one has none', () => {
  QUESTIONS.forEach((q) => {
    assert.strictEqual(q.whyWrong.length, 4, q.id);
    q.whyWrong.forEach((w, i) => {
      if (i === q.answer) assert.strictEqual(w, '', q.id + ' correct option should be empty');
      else assert.ok(w.length > 10, q.id + ' option ' + i + ' missing explanation');
    });
  });
});
test('options within a question are unique', () => {
  QUESTIONS.forEach((q) => assert.strictEqual(new Set(q.options).size, 4, q.id));
});
test('correct answers are not always in the same position', () => {
  const positions = new Set(QUESTIONS.map((q) => q.answer));
  assert.ok(positions.size >= 3, 'answer positions: ' + [...positions]);
});
test('hints do not give the answer away word-for-word', () => {
  QUESTIONS.forEach((q) => {
    q.hints.forEach((h) => assert.ok(!h.includes(q.options[q.answer]), q.id + ' hint contains the full answer'));
  });
});

console.log('\nName validation');
test('empty / whitespace names are rejected', () => {
  assert.strictEqual(QuizEngine.validateName('').ok, false);
  assert.strictEqual(QuizEngine.validateName('    ').ok, false);
  assert.strictEqual(QuizEngine.validateName(null).ok, false);
  assert.strictEqual(QuizEngine.validateName(undefined).ok, false);
});
test('too short / too long / symbols / digits are rejected', () => {
  assert.strictEqual(QuizEngine.validateName('A').ok, false);
  assert.strictEqual(QuizEngine.validateName('x'.repeat(41)).ok, false);
  assert.strictEqual(QuizEngine.validateName('<script>').ok, false);
  assert.strictEqual(QuizEngine.validateName('R2D2').ok, false);
  assert.strictEqual(QuizEngine.validateName('=SUM(A1)').ok, false);
});
test('real names are accepted and tidied', () => {
  assert.strictEqual(QuizEngine.validateName('  Wanjiru   Kamau ').name, 'Wanjiru Kamau');
  assert.strictEqual(QuizEngine.validateName("Ng'ang'a").ok, true);
  assert.strictEqual(QuizEngine.validateName('Mary-Jane O’Brien').ok, true);
  assert.strictEqual(QuizEngine.validateName('Zoë Müller').ok, true);
});
test('start() refuses an invalid name and stays on the welcome view', () => {
  const e = newEngine();
  const r = e.start('   ');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(e.view, 'welcome');
});
test('start() accepts a valid name and moves to the quiz', () => {
  const e = newEngine();
  const r = e.start('Kelvin Guama');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(e.view, 'quiz');
  assert.strictEqual(e.name, 'Kelvin Guama');
});

console.log('\nAnswer checking');
test('check without a selection does not use up an attempt', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  const r = e.check(q.id);
  assert.strictEqual(r.outcome, 'no-selection');
  assert.strictEqual(e.questionState(q.id).attempts, 0);
});
test('a correct answer on the first try scores 1 and shows the exact message', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  e.select(q.id, q.answer);
  const r = e.check(q.id);
  assert.strictEqual(r.outcome, 'correct');
  assert.strictEqual(r.message, 'CORRECT! WELL DONE! ✅');
  assert.strictEqual(e.pageScore(0), 1);
  assert.strictEqual(e.questionState(q.id).status, 'correct');
});
test('attempt 1 wrong → exact message + hint 1, nothing revealed', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  e.select(q.id, wrongIndexes(q)[0]);
  const r = e.check(q.id);
  assert.strictEqual(r.outcome, 'try-again');
  assert.strictEqual(r.message, 'Not quite! Give it another try. 💡');
  assert.strictEqual(r.hint, q.hints[0]);
  assert.strictEqual(r.attempt, 1);
  assert.strictEqual(e.isLocked(q.id), false);
  assert.strictEqual(e.pageScore(0), 0);
});
test('attempt 2 wrong → exact message + hint 2', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  const w = wrongIndexes(q);
  e.select(q.id, w[0]); e.check(q.id);
  e.select(q.id, w[1]);
  const r = e.check(q.id);
  assert.strictEqual(r.outcome, 'try-again');
  assert.strictEqual(r.message, "Almost there! Think carefully. You've got this!");
  assert.strictEqual(r.hint, q.hints[1]);
  assert.strictEqual(r.attempt, 2);
  assert.strictEqual(e.isLocked(q.id), false);
});
test('attempt 3 wrong → answer revealed, why-wrong given, NO point, question locked', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  const w = wrongIndexes(q);
  e.select(q.id, w[0]); e.check(q.id);
  e.select(q.id, w[1]); e.check(q.id);
  e.select(q.id, w[2]);
  const r = e.check(q.id);
  assert.strictEqual(r.outcome, 'revealed');
  assert.strictEqual(r.wrongIndex, w[2]);
  assert.strictEqual(r.whyWrong, q.whyWrong[w[2]]);
  assert.strictEqual(r.explanation, q.explanation);
  assert.strictEqual(e.isLocked(q.id), true);
  assert.strictEqual(e.pageScore(0), 0);
  assert.strictEqual(e.questionState(q.id).status, 'revealed');
});
test('correct on attempt 2 and 3 still scores exactly 1 point', () => {
  [1, 2].forEach((wrongCount) => {
    const e = newEngine(); e.start('Test Kid');
    const q = e.current().question;
    const w = wrongIndexes(q);
    for (let i = 0; i < wrongCount; i++) { e.select(q.id, w[i]); e.check(q.id); }
    e.select(q.id, q.answer);
    assert.strictEqual(e.check(q.id).outcome, 'correct');
    assert.strictEqual(e.pageScore(0), 1);
    assert.strictEqual(e.questionState(q.id).attempts, wrongCount + 1);
  });
});
test('a wrong option that was already tried cannot be picked again', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  const w = wrongIndexes(q);
  e.select(q.id, w[0]); e.check(q.id);
  assert.strictEqual(e.select(q.id, w[0]), false);
  assert.strictEqual(e.select(q.id, w[1]), true);
});
test('a locked (correct) question cannot be scored twice or changed', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  e.select(q.id, q.answer); e.check(q.id);
  for (let i = 0; i < 5; i++) {
    assert.strictEqual(e.select(q.id, q.answer), false);
    assert.strictEqual(e.check(q.id).outcome, 'locked');
  }
  assert.strictEqual(e.pageScore(0), 1);
  assert.strictEqual(e.totalScore(), 1);
  assert.strictEqual(e.questionState(q.id).attempts, 1);
});
test('a revealed question cannot be answered afterwards to earn a point', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  wrongIndexes(q).forEach((i) => { e.select(q.id, i); e.check(q.id); });
  assert.strictEqual(e.isLocked(q.id), true);
  assert.strictEqual(e.select(q.id, q.answer), false);
  assert.strictEqual(e.check(q.id).outcome, 'locked');
  assert.strictEqual(e.totalScore(), 0);
});
test('invalid option indexes are ignored', () => {
  const e = newEngine(); e.start('Test Kid');
  const q = e.current().question;
  [-1, 4, 99, 1.5, '1', null, undefined].forEach((bad) => assert.strictEqual(e.select(q.id, bad), false));
});
test('attempt counters are independent per question', () => {
  const e = newEngine(); e.start('Test Kid');
  const [q1, q2] = e.pages[0].questions;
  e.select(q1.id, wrongIndexes(q1)[0]); e.check(q1.id);
  e.select(q1.id, wrongIndexes(q1)[1]); e.check(q1.id);
  assert.strictEqual(e.questionState(q1.id).attempts, 2);
  assert.strictEqual(e.questionState(q2.id).attempts, 0);
  // the next question starts at attempt 1 with the attempt-1 message
  e.select(q1.id, q1.answer); e.check(q1.id); e.next();
  e.select(q2.id, wrongIndexes(q2)[0]);
  assert.strictEqual(e.check(q2.id).message, 'Not quite! Give it another try. 💡');
});

console.log('\nNavigation & scoring');
test('next() is blocked until the current question is locked', () => {
  const e = newEngine(); e.start('Test Kid');
  assert.strictEqual(e.next(), false);
  assert.strictEqual(e.qi, 0);
  const q = e.current().question;
  e.select(q.id, q.answer); e.check(q.id);
  assert.strictEqual(e.next(), true);
  assert.strictEqual(e.qi, 1);
});

// Helper: answer a page with a chosen number of correct answers (rest are revealed)
function playPage(e, correctCount) {
  for (let i = 0; i < 4; i++) {
    const q = e.current().question;
    if (i < correctCount) { e.select(q.id, q.answer); }
    else { wrongIndexes(q).slice(0, 2).forEach((w) => { e.select(q.id, w); e.check(q.id); }); e.select(q.id, wrongIndexes(q)[2]); }
    e.check(q.id);
    e.next();
  }
}

test('finishing a page shows the page result with the right score', () => {
  const e = newEngine(); e.start('Test Kid');
  playPage(e, 3);
  assert.strictEqual(e.view, 'pageResult');
  assert.strictEqual(e.pageScore(0), 3);
});
test('continue moves page 1 → 2 → 3 → 4 → final', () => {
  const e = newEngine(); e.start('Test Kid');
  const seen = [];
  for (let p = 0; p < 4; p++) {
    seen.push(e.pageIndex);
    playPage(e, 4);
    assert.strictEqual(e.view, 'pageResult');
    assert.strictEqual(e.continueFromPageResult(), true);
  }
  assert.deepStrictEqual(seen, [0, 1, 2, 3]);
  assert.strictEqual(e.view, 'final');
  assert.strictEqual(e.continueFromPageResult(), false);
});
test('a perfect run scores 16/16 = 100%', () => {
  const e = newEngine(); e.start('Test Kid');
  for (let p = 0; p < 4; p++) { playPage(e, 4); e.continueFromPageResult(); }
  assert.strictEqual(e.totalScore(), 16);
  assert.strictEqual(e.maxScore(), 16);
  assert.strictEqual(e.percent(), 100);
  const s = e.summary();
  assert.strictEqual(s.wrongAttempts, 0);
  assert.strictEqual(s.revealedCount, 0);
});
test('mixed run: per-page scores, total, percent, attempts and reveals are all consistent', () => {
  const e = newEngine(); e.start('Test Kid');
  const plan = [4, 3, 2, 0];
  plan.forEach((n) => { playPage(e, n); e.continueFromPageResult(); });
  const s = e.summary();
  assert.deepStrictEqual(s.pages.map((p) => p.score), plan);
  assert.strictEqual(s.total, 9);
  assert.strictEqual(s.percent, 56);
  assert.strictEqual(s.revealedCount, 7);
  assert.strictEqual(s.wrongAttempts, 21);
  assert.strictEqual(s.totalAttempts, 9 + 21);
  assert.strictEqual(s.name, 'Test Kid');
});
test('a zero-score run is 0/16 with every answer revealed', () => {
  const e = newEngine(); e.start('Test Kid');
  for (let p = 0; p < 4; p++) { playPage(e, 0); e.continueFromPageResult(); }
  assert.strictEqual(e.totalScore(), 0);
  assert.strictEqual(e.percent(), 0);
  assert.strictEqual(e.summary().revealedCount, 16);
});
test('the student name is kept through to the final summary', () => {
  const e = newEngine(); e.start('  Amani   Otieno ');
  for (let p = 0; p < 4; p++) { playPage(e, 2); e.continueFromPageResult(); }
  assert.strictEqual(e.name, 'Amani Otieno');
  assert.strictEqual(e.summary().name, 'Amani Otieno');
});

console.log('\nEncouraging messages');
test('page feedback matches the brief', () => {
  assert.strictEqual(QuizEngine.pageFeedback(4).headline, 'YEAHHH!! PERFECT SCORE! 🥳');
  assert.strictEqual(QuizEngine.pageFeedback(3).headline, "Amazing work! You're getting there!");
  assert.strictEqual(QuizEngine.pageFeedback(2).headline, 'Good effort! Keep learning.');
  assert.strictEqual(QuizEngine.pageFeedback(1).headline, "Don't give up. Every great programmer makes mistakes!");
  assert.strictEqual(QuizEngine.pageFeedback(0).headline, "Don't give up. Every great programmer makes mistakes!");
  assert.deepStrictEqual([4, 3, 2, 1, 0].map((n) => QuizEngine.pageFeedback(n).level),
    ['perfect', 'great', 'good', 'keepgoing', 'keepgoing']);
});
test('final feedback has a message for every score from 0 to 16', () => {
  for (let s = 0; s <= 16; s++) assert.ok(QuizEngine.finalFeedback(s, 16).text.length > 10);
  assert.strictEqual(QuizEngine.finalFeedback(16, 16).level, 'perfect');
});

console.log('\nSaving and refresh');
test('progress survives a "page refresh" (new engine, same storage)', () => {
  const storage = memoryStorage();
  const a = QuizEngine.create(PAGES, storage);
  a.start('Test Kid');
  const q1 = a.current().question;
  a.select(q1.id, q1.answer); a.check(q1.id); a.next();
  const q2 = a.current().question;
  a.select(q2.id, wrongIndexes(q2)[0]); a.check(q2.id);

  const b = QuizEngine.create(PAGES, storage); // simulates reload
  assert.strictEqual(b.view, 'quiz');
  assert.strictEqual(b.name, 'Test Kid');
  assert.strictEqual(b.qi, 1);
  assert.strictEqual(b.pageScore(0), 1);
  assert.strictEqual(b.questionState(q2.id).attempts, 1);
  assert.strictEqual(b.questionState(q2.id).feedback.hint, q2.hints[0]);
});
test('refreshing does NOT reset the attempt counter (no free retries)', () => {
  const storage = memoryStorage();
  const a = QuizEngine.create(PAGES, storage); a.start('Test Kid');
  const q = a.current().question;
  const w = wrongIndexes(q);
  a.select(q.id, w[0]); a.check(q.id);
  a.select(q.id, w[1]); a.check(q.id);
  const b = QuizEngine.create(PAGES, storage);
  b.select(q.id, w[2]);
  assert.strictEqual(b.check(q.id).outcome, 'revealed');
});
test('a locked question stays locked after a refresh', () => {
  const storage = memoryStorage();
  const a = QuizEngine.create(PAGES, storage); a.start('Test Kid');
  const q = a.current().question;
  a.select(q.id, q.answer); a.check(q.id);
  const b = QuizEngine.create(PAGES, storage);
  assert.strictEqual(b.check(q.id).outcome, 'locked');
  assert.strictEqual(b.totalScore(), 1);
});
test('the final results screen survives a refresh', () => {
  const storage = memoryStorage();
  const a = QuizEngine.create(PAGES, storage); a.start('Test Kid');
  for (let p = 0; p < 4; p++) { playPage(a, 3); a.continueFromPageResult(); }
  const b = QuizEngine.create(PAGES, storage);
  assert.strictEqual(b.view, 'final');
  assert.strictEqual(b.totalScore(), 12);
});
test('restart clears everything and removes saved data', () => {
  const storage = memoryStorage();
  const a = QuizEngine.create(PAGES, storage); a.start('Test Kid');
  playPage(a, 4);
  a.restart();
  assert.strictEqual(a.view, 'welcome');
  assert.strictEqual(a.name, '');
  assert.strictEqual(a.totalScore(), 0);
  assert.strictEqual(storage.getItem(QuizEngine.STORAGE_KEY), null);
  const b = QuizEngine.create(PAGES, storage);
  assert.strictEqual(b.view, 'welcome');
});
test('after restart a student can start fresh with a new name', () => {
  const a = newEngine(); a.start('First Kid'); playPage(a, 4); a.restart();
  assert.strictEqual(a.start('Second Kid').ok, true);
  assert.strictEqual(a.totalScore(), 0);
  assert.strictEqual(a.name, 'Second Kid');
  assert.strictEqual(a.pageIndex, 0);
  assert.strictEqual(a.qi, 0);
});
test('corrupted or tampered saved data is ignored safely', () => {
  const bad = [
    'not json',
    '{"version":1,"view":"quiz","name":"","page":0,"qi":0,"q":{}}',
    '{"version":1,"view":"quiz","name":"Kid","page":9,"qi":0,"q":{}}',
    '{"version":1,"view":"hacked","name":"Kid","page":0,"qi":0,"q":{}}',
    '{"version":1,"view":"quiz","name":"Kid","page":0,"qi":0,"q":{"nope":{"attempts":1,"status":"open","tried":[]}}}',
    '{"version":1,"view":"quiz","name":"Kid","page":0,"qi":0,"q":{"p1q1":{"attempts":99,"status":"open","tried":[]}}}',
    '{"version":0,"view":"quiz","name":"Kid","page":0,"qi":0,"q":{}}',
    'null'
  ];
  bad.forEach((raw) => {
    const storage = memoryStorage();
    storage.setItem(QuizEngine.STORAGE_KEY, raw);
    const e = QuizEngine.create(PAGES, storage);
    assert.strictEqual(e.view, 'welcome', raw);
  });
});
test('the engine still works when storage is unavailable or throws', () => {
  const broken = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); }
  };
  const e = QuizEngine.create(PAGES, broken);
  assert.strictEqual(e.start('Test Kid').ok, true);
  const q = e.current().question;
  e.select(q.id, q.answer);
  assert.strictEqual(e.check(q.id).outcome, 'correct');
  e.restart();
  assert.strictEqual(QuizEngine.create(PAGES, null).view, 'welcome');
});

console.log('\n' + passed + ' checks passed' + (process.exitCode ? ' — SOME FAILED' : ' — all good ✔') + '\n');
