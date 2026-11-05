# Young Engineers · The Code Quest 🚀
**Phase 1.5: assessment engine + Google Sheets results** · Grade 7 · West Nairobi School

An interactive coding adventure that students open from one shared link. They enter their name, work through
**4 pages × 5 questions** (the fifth on every page is a *select TWO* question), earn points by how quickly they get
each answer right, and finish with a results screen. Results are saved to a Google Sheet for the teacher.

> **Status (please read):**
> - The 20 questions are still **temporary demonstration questions** (see [`TEACHER_NOTES.md`](TEACHER_NOTES.md)).
> - The app, scoring, resume and retake logic are covered by automated tests (below).
> - The Google Apps Script backend has been tested **only against a simulated spreadsheet** on the developer's
>   machine. It has **not** been run on real Google servers yet. Do the 10-minute live check in
>   [section 4](#4-check-it-works-live-do-this-before-students-use-it) before relying on it.
> - Until you set `API_URL`, the app runs in **practice mode**: it works, but nothing is sent anywhere, and it says so on screen.

---

## What is in the box

```text
code-quest/
├── index.html                  The page students open
├── css/style.css               Design system (unchanged look; new rules appended at the end)
├── js/
│   ├── config.js               ← put your Apps Script URL here (API_URL)
│   ├── questions.js            ← the 20 questions. Edit this file to change content
│   ├── quiz-engine.js          Rules: attempts, points, multi-select, resume, two sittings
│   ├── results.js              Sends results to the Apps Script web app (no fake success)
│   ├── art.js                  Illustrations (inline SVG)
│   └── app.js                  Draws the screens and connects the buttons
├── backend/google-apps-script.js   ← paste into Google Apps Script
├── tests/
│   ├── engine.test.js          183 checks: scoring, attempts, multi-select, resume, retake rules
│   ├── backend.test.js         76 checks: the real Apps Script file on a simulated sheet
│   ├── e2e.test.js             100 checks in a real headless browser (app + backend together)
│   └── gas-harness.js          Runs the Apps Script file against an in-memory fake of Google Sheets
├── tools/
│   ├── dev-server.js           Local test server (never deployed)
│   ├── live-backend-check.js   Checks YOUR deployed web app for real
│   └── export-question-bank.js Rebuilds QUESTION_BANK.md from questions.js
├── QUESTION_BANK.md            Every question, answer, hint and explanation, for review
├── TEACHER_NOTES.md            Curriculum flags and operating notes
└── README.md
```

No frameworks, no build step, no external fonts or scripts. The only network request is the one to your Apps Script URL.

---

## How it behaves

### Questions and points
| Moment | What happens |
|---|---|
| Single-answer | Pick one option, **Check Answer**. A wrong option is struck out and cannot be picked again. |
| Select TWO | The question says how many to pick; a counter shows "1 of 2 picked"; a third pick is refused; **Check Answer** unlocks only at exactly 2. **All-or-nothing**: one right + one wrong is simply wrong. The same wrong pair is not counted twice. |
| Correct, try 1 | "WELL DONE! +1.00 POINTS! 🎉" |
| Correct, try 2 | "YOU GOT IT! +0.25 POINTS! 👏" |
| Correct, try 3 | "THAT'S CORRECT! +0.10 POINTS! 💪" |
| Wrong, tries 1 and 2 | The existing hints (hint 1, then hint 2) |
| Wrong, try 3 | Answer revealed with the full explanation, **+0.00**. |
| Always | Question locks after it is finished; each question has its own attempt counter. |

### Percentages
Each page has 5 questions = 5.00 points = **25%** of the final result. Page contribution = (page points ÷ 5) × 25;
overall % = the four contributions added up. Example from the brief: 4.25 + 3.00 + 4.10 + 5.00 = 16.35 / 20 = **81.75%**.
Points are stored as whole hundredths internally, so nothing is rounded until display and floating-point error cannot creep in.
(The tests include exactly this example.)

### Resume
Progress is saved to `localStorage` after every click: name, page, question, selected options, attempts, finished
questions, points, status and sitting number. Reopening the link shows
**"WELCOME BACK, NAME! 👋 … Would you like to continue where you left off?"** with **RESUME TEST**. Attempt counters are never reset.
There is no Restart button. **START NEW TEST is intentionally not offered for an unfinished sitting**: that would be the same
sitting, not a new one, and offering it would defeat the limit. A student who finished sitting 1 below 75% is offered
**START FINAL RETAKE** instead. *"Not NAME? Switch student"* is there for shared computers (it deletes nothing).

### Two sittings, 75% rule
| Sitting 1 result | What happens |
|---|---|
| 75.00% or above | Congratulations. Assessment completed. No retake. |
| Below 75% | **"YOUR JOURNEY ISN'T OVER! 🚀"**, one **START FINAL RETAKE** button, clearly marked final. First result stays on record. |
| After sitting 2 | Both results, improvement (or decline), best score; completed. No third sitting. |

Scores move in steps of 0.05%, so the closest score under 75 is 74.95%.

### Where the limit is really enforced
Browser storage can be cleared, so the limit is **also enforced on the server**. A sitting is *registered* with the
Apps Script before the student sees the first question. The server refuses a second sitting 1, a retake after ≥75%, a
second retake, and a retake that overlaps one already in progress, even from another browser, a new tab, or after clearing storage.
If the server cannot be reached when a student tries to start, **the quest does not start** (fail closed).
If it drops *during* a quest, the student keeps going and the result is sent afterwards (retry button, plus automatic retry when back online).

**What this does not stop** (be honest with yourself about these):
1. Identification is the typed name. Use the **Roster** tab (section 3) to restrict to your class list.
2. Scores come from the student's browser. The server validates the data and computes points itself, but cannot see real clicks.
3. A student who abandons a sitting and clears their browser is locked out until you set that row to `reset` in the **Sittings** tab.

---

## 1. Try it on your computer
Practice mode needs no setup: double-click `index.html`. (Practice mode: limit enforced only on this browser, nothing sent.)

To see the **whole thing including the backend** on your computer (needs Node 18+ and Playwright for the browser tests only):
```bash
node tools/dev-server.js 8123       # app + the real Apps Script file on a simulated sheet
# open http://127.0.0.1:8123/
```

## 2. Publish on GitHub Pages (free)
1. Create a **public** repository, e.g. `code-quest`. Upload everything so `index.html` is at the top level.
2. **Settings → Pages → Deploy from a branch → main → / (root) → Save.**
3. After 1–2 minutes your link is `https://YOUR-USERNAME.github.io/code-quest/`.
4. Updating: edit/upload files and commit; hard-refresh (Ctrl+Shift+R) to see changes.
   Avoid changing questions while students are mid-quest.

The repository is public, so it must hold **no secrets**. It does not: `API_URL` is a public web-app address
that can only run the script's two actions, and the spreadsheet itself is never shared.

## 3. Connect the results sheet (Google Apps Script)
1. Create a new Google Sheet (e.g. "Code Quest Results"). It will hold all student data; **keep it private** (only you and teachers).
2. In the sheet: **Extensions → Apps Script**. Delete the sample code, paste in the whole of `backend/google-apps-script.js`, **Save**.
3. In the editor's function dropdown choose **`setup`** and click **Run**. Approve the permissions (it only needs this spreadsheet).
   You should now see tabs: **Assessment Results**, **Question Performance**, **Class Summary**, **Sittings**, **Roster**.
4. **Deploy → New deployment → ⚙ Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone** (students do not log in; the URL can only run `begin`/`submit`, it exposes no sheet access)
   - **Deploy**, then copy the **Web app URL** (ends in `/exec`).
5. In `js/config.js` set `API_URL: 'https://script.google.com/macros/s/…/exec'`, commit and push.
6. **After any later change to the script:** Deploy → *Manage deployments* → ✏ edit → Version: **New version** → Deploy. (The URL stays the same. Saving alone does not update the live web app.)

**Roster (strongly recommended):** type the exact student names, one per row from row 2, in the **Roster** tab.
Matching ignores capital letters, extra spaces and apostrophes/hyphens. With a roster, only listed names can start.
Leave it empty to allow anyone.

**Resetting an abandoned sitting:** *Sittings* tab → change that row's **Status** from `started` to `reset`.
To allow a completed sitting to be sat again (use sparingly), set its Status to `void`. Its results stay in the other tabs.

### What the sheets contain
- **Assessment Results**: one **new row per sitting** (Sitting 2 never overwrites Sitting 1): timestamp, name, session id, sitting, page 1–4 raw score and % contribution, overall raw (/20) and %, counts of 1st/2nd/3rd-attempt correct and revealed, completion status, outcome, and whether the server's score matched the browser's.
- **Question Performance**: one row per question per sitting (attempts used, result, points, concept).
- **Class Summary**: rebuilt after every submission: students, average %, best %, how many retook/improved, and every question ranked hardest-first.
- **Sittings**: the registry that enforces the limit (editable by you).

## 4. Check it works live (do this before students use it)
The automated tests use a simulated sheet. To prove it on real Google servers:
```bash
node tools/live-backend-check.js "https://script.google.com/macros/s/…/exec"
```
It creates a fake student "Zz Livecheck …", submits sitting 1, tries a duplicate, tries sitting 1 again, and starts sitting 2,
printing ok/FAIL for each. Then open the sheet, confirm the rows, and delete them.
Then do one real walk-through yourself in the published site on a phone and a computer, and check the sheet.
Browsers talk to Apps Script cross-origin; this works in current browsers when the request is sent as `text/plain`
(which `js/results.js` does) but **has not yet been confirmed from GitHub Pages**. Step 4 is where you will find out.

## Changing the questions
Everything students read is in **`js/questions.js`**. Each question has `type` (`'single'` or `'multi'`), `prompt`,
optional `code`, four `options`, `answer` (an index, or for `'multi'` an array like `[1, 3]`), two `hints`, an
`explanation` and a `whyWrong` note per option (use `''` for correct ones). Keep **five questions per page**, **four options**,
and make the fifth a `'multi'` with two answers and "Select TWO correct answers." in the prompt, because the tests check this.
The backend knows the question ids `p1q1`…`p4q5`; if you change the number of pages or questions, update `CFG` in the script too.
Then run `node tools/export-question-bank.js` to refresh `QUESTION_BANK.md`.

## Testing
```bash
node tests/engine.test.js     # 183 checks
node tests/backend.test.js    # 76 checks
node tests/e2e.test.js        # 100 checks; needs Playwright + Chromium
```
Result at time of delivery: **183/183, 76/76, 100/100**. The e2e suite covers: 5 questions per page, multi-select, exact
messages, hints, three attempts, revealed answers, points and page/overall percentages (including the 81.75% example),
close-tab-and-resume with attempts preserved, the 75% rule from both sides, exactly one retake, no third sitting after
refresh / new browser / cleared storage, parallel retake refused, sitting 1 row then appended sitting 2 row, duplicate
submission, failed network (at start and at finish), timeout, practice mode never claiming success, and a 360px phone.

### Manual checklist (5 minutes, on a real phone)
- [ ] Select-TWO question: a third pick is refused, Check unlocks only at two picks
- [ ] Close the tab mid-quest, reopen: "WELCOME BACK" → RESUME TEST → same question, same try number
- [ ] No Restart button anywhere
- [ ] Final screen: points out of 20, %, four pages with "x% of 25.00%", and "Your result has been saved"
- [ ] Spreadsheet gained one row in Assessment Results and 20 in Question Performance
- [ ] Switch off Wi-Fi at the final screen: "couldn't save", then TRY AGAIN after reconnecting saves exactly one row
- [ ] Phone sideways still looks right
