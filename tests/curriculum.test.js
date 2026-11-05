/* Curriculum checks for the PictoBlox → Python bridge. Run: node tests/curriculum.test.js */
'use strict';
var fs = require('fs');
var PAGES = require('../js/questions.js').PAGES;
var passed = 0, failed = 0;
function ok(c, l) { if (c) passed++; else { failed++; console.log('  FAIL: ' + l); } }
var all = []; PAGES.forEach(function (p) { p.questions.forEach(function (q) { q.page = p.id; all.push(q); }); });
function flat(q) { return [q.concept, q.prompt, q.code || '', q.options.join(' | '), q.hints.join(' '), q.explanation, q.whyWrong.join(' ')].join(' ¦ '); }
function byId(id) { return all.filter(function (q) { return q.id === id; })[0]; }
function pos(re) { for (var i = 0; i < all.length; i++) if (re.test((all[i].code || '') + ' ' + all[i].prompt)) return i; return -1; }

console.log('1. Structure');
ok(PAGES.length === 4 && PAGES.every(function (p) { return p.questions.length === 5; }), 'four pages, five questions each');
ok(all.length === 20, '20 questions');
ok(PAGES.every(function (p) { return p.questions[4].type === 'multi' && p.questions[4].answer.length === 2 && /Select TWO correct answers/.test(p.questions[4].prompt); }), 'fifth question on every page is "Select TWO"');
ok(PAGES.every(function (p) { return p.questions.slice(0, 4).every(function (q) { return q.type === 'single'; }); }), 'first four are single-answer');
ok(all.every(function (q) { return q.hints.length === 2 && q.explanation && q.options.length === 4 && q.whyWrong.length === 4; }), 'every question has 2 hints, an explanation, 4 options, 4 why-wrong notes');
ok(all.every(function (q) { var a = [].concat(q.answer); return q.options.every(function (o, i) { return (a.indexOf(i) === -1) === (q.whyWrong[i] !== ''); }); }), 'why-wrong notes are blank only for correct answers');

console.log('2. Existing questions retained');
var v1 = fs.readFileSync(__dirname + '/../js/questions.js', 'utf8');
var KEEP = ['What is an algorithm?', 'What is the job of the bootloader?', 'Which of these is an operating system?', 'Look at this line of Python. What is score?',
  'Only one of these lines is written with correct Python syntax. Which one?', 'Which of these are strings? Select TWO correct answers.',
  'This program should display Sam, but Python shows an error. What is the mistake?', 'Which TWO of these lines would display 10 on the screen?'];
KEEP.forEach(function (t) { ok(v1.indexOf(t) !== -1, 'retained: ' + t); });
ok(byId('p4q3').code === 'name = "Alex"\nprint(name)', 'print(name) prediction retained (now p4q3)');
ok(byId('p4q4').code.indexOf('print(myname)') !== -1, 'spot-the-mistake print() question retained');
ok(/a = 4\nb = 6/.test(byId('p4q5').code), 'print(a + b) multi-select retained');
ok(/score = 10/.test(byId('p3q3').code), 'variables question retained');
ok(byId('p3q5').concept === 'Integers & Strings', 'integers & strings multi-select retained');

console.log('3. BIOS question no longer gives itself away');
var b = byId('p2q1');
ok(!/BIOS|UEFI|POST/i.test(b.concept + ' ' + b.prompt), 'chip and prompt do not name BIOS / UEFI / POST');
ok(/switched on/.test(b.prompt) && /Before the operating system loads/.test(b.prompt), 'uses the start-up scenario');
ok(b.options[b.answer] === 'BIOS/UEFI' && b.options.length === 4, 'BIOS/UEFI is still the (hidden) correct answer among 4 plausible options');
ok(b.answer !== 0, 'correct answer no longer first');

console.log('4/5. PictoBlox before Python');
var iSay = pos(/Tobi\.say\(/), iPrint = pos(/(^|\n)print\(/), iTobiIn = pos(/Tobi\.input\(/), iIn = pos(/= input\(/);
ok(iSay >= 0 && iSay < all.indexOf(byId('p3q2')) + 1 && all[iSay].id === 'p3q1', 'Tobi.say() is introduced first, as p3q1');
ok(iSay < pos(/print\("Hello, Engineer|print\("Hi"/) || pos(/print\("Hello, Engineer/) === -1, 'Tobi.say() comes before any Python print() question on Page 3');
ok(all.indexOf(byId('p3q2')) > iSay && /print\(/.test(byId('p3q2').code), 'p3q2 then connects it to print()');
ok(all[iTobiIn].id === 'p4q1' && all[iIn].id === 'p4q2' && iTobiIn < iIn, 'Tobi.input() (p4q1) comes before Python input() (p4q2)');
ok(byId('p4q2').code === 'name = input("What is your name? ")', 'Python input example matches the brief');
ok(byId('p3q2').code === 'Tobi.say("Hello 7B !!!", 10)\nprint("Hello 7B !!!")', 'say/print pair uses the class message');

console.log('   Syntax follows the class screenshots (capital T) and nothing is invented');
var allText = all.map(flat).join('\n');
ok(!/tobi\.(say|input)/.test(allText), 'no lowercase tobi.say / tobi.input anywhere');
var calls = (allText.match(/Tobi\.\w+/g) || []).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort();
ok(JSON.stringify(calls) === JSON.stringify(['Tobi.input', 'Tobi.say']), 'only Tobi.say and Tobi.input are used (found: ' + calls.join(', ') + ')');
ok(/Sprite\('Tobi'\)/.test(byId('p3q1').code) && /Sprite\('Tobi'\)/.test(byId('p4q1').code), 'examples create Tobi with Sprite(\'Tobi\') as in class');
console.log('   Tobi functions are not presented as standard Python');
ok(/not the same instruction|belongs to PictoBlox/.test(byId('p3q2').explanation), 'p3q2 explains print() is Python, Tobi.say() is PictoBlox');
ok(/comparable, not identical/.test(byId('p4q2').explanation) && /belongs to PictoBlox/.test(byId('p4q2').explanation), 'p4q2 explains input() vs Tobi.input()');
ok(!/Tobi\.\w+\(\) (is|are) (a )?(built-in|standard) Python/i.test(allText), 'no text calls a Tobi function a built-in Python function');
ok(byId('p3q2').whyWrong[2].indexOf('belongs to PictoBlox') !== -1, 'the "both are built-in Python functions" trap is explained');

console.log('Mission wiring');
var app = fs.readFileSync(__dirname + '/../js/app.js', 'utf8');
ok(app.indexOf('YOUR NEXT MISSION: TRY IT IN PICTOBLOX! 🤖') !== -1, 'mission heading present exactly');
ok(app.indexOf("You've tested your programming knowledge. Now it's time to put it into action!") !== -1, 'supporting message exact');
ok(app.indexOf("REAL ENGINEERS DON'T JUST ANSWER QUESTIONS. THEY EXPERIMENT, BUILD AND DISCOVER. SEE YOU IN THE NEXT CLASS! 🚀") !== -1, 'closing message exact');
ok(fs.existsSync(__dirname + '/../assets/images/pictoblox-code.png') && fs.existsSync(__dirname + '/../assets/images/pictoblox-run.png'), 'both supplied screenshots are in assets/images');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
