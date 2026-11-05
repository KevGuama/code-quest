# Young Engineers · The Code Quest 🚀
**Phase 1: functional interactive learning experience** · Grade 7 · West Nairobi School

An interactive coding adventure that students open from one shared link. They enter their name, work through
**4 pages × 4 questions**, get hints and feedback with up to three tries per question, see an animated score after each
page, and finish with a results screen.

> **Phase 1 status (please read):** the 16 questions are **temporary demonstration questions** built to test the
> engine. Student results are **not collected or sent anywhere yet**. Everything stays in the student's browser tab.
> Central results collection (Google Sheets) and the teacher dashboard are planned for **Phase 2**.
> Statements on the lesson slides that need your review are listed in [`TEACHER_NOTES.md`](TEACHER_NOTES.md).

---

## What is in the box

```text
code-quest/
├── index.html               The page students open
├── css/style.css            Design system (colours, cards, animations, responsive rules)
├── js/
│   ├── questions.js         ← the 16 questions. Edit this file to change content
│   ├── quiz-engine.js       Rules: names, 3 attempts, locking, scoring, saving progress
│   ├── art.js               Rocket / robot / gear / chip illustrations (inline SVG)
│   └── app.js               Draws the screens and connects the buttons
├── assets/images/favicon.svg
├── tests/
│   ├── engine.test.js       Automated tests for the rules (run with Node)
│   └── ui-test.html         Automated click-through of the real app (runs in any browser)
├── tools/export-question-bank.js   Rebuilds QUESTION_BANK.md from questions.js
├── QUESTION_BANK.md         Every question, answer, hint and explanation, readable for review
├── TEACHER_NOTES.md         Curriculum flags and things to confirm for Phase 2
└── README.md
```

No frameworks, no build step, no external fonts or scripts. It makes **no network requests**, so it works on school
networks that block outside sites.

## How it behaves

| Moment | What happens |
|---|---|
| Welcome | Name is required (2–40 letters; spaces, hyphens, apostrophes allowed). Empty or odd names show a friendly error. |
| Wrong, try 1 | "Not quite! Give it another try. 💡" + hint 1. The wrong option is struck out and can't be picked again. |
| Wrong, try 2 | "Almost there! Think carefully. You've got this!" + hint 2 |
| Wrong, try 3 | The answer is revealed with why it is correct and why their last pick wasn't. **No point is awarded.** |
| Correct | "CORRECT! WELL DONE! ✅" + explanation. The question locks, so it can't be scored twice. |
| End of page | Animated score ring, headline for 4/4, 3/4, 2/4 or 0–1/4, a recap of each question, confetti that scales with the score (a rocket launches for 4/4). |
| End of quest | "CONGRATULATIONS, NAME! 🎉", score out of 16, percentage, per-page bars, personal message, Play again. |
| Refresh | Position, attempts and locked answers are kept, so refreshing doesn't give free retries. |
| Restart | Top-bar **Restart** (with a confirmation) or **Play again** clears everything. |

**Privacy on shared computers:** progress is kept in `sessionStorage`, which is wiped when the tab or browser is
closed, so the next student never sees the previous student's name or progress. The name field is also left empty after a restart.

Accessibility: keyboard friendly, visible focus, screen-reader announcements for feedback, colour is never the only
signal (✓ / ✕ marks and strike-through too), and animations switch off for people who have "reduce motion" turned on.

---

## Try it on your computer (30 seconds)

Double-click `index.html`. It opens in your browser and works as it is.

To test on your **phone** before publishing, put the phone on the same Wi-Fi and run this from the project folder:

```bash
python3 -m http.server 8000
```

then open `http://YOUR-COMPUTER-IP:8000` on the phone (find the IP with `ipconfig` on Windows or `ifconfig` / `ip a` on Mac/Linux).

---

## Publish on GitHub Pages (free)

You need a free GitHub account. The repository must be **public** for free Pages. That is fine here: the site
contains no student data (the only "secret" is the quiz answers, see `TEACHER_NOTES.md`).

### 1. Create the repository
1. Sign in at github.com and click **+ → New repository**.
2. Name it, for example `code-quest`. Choose **Public**. Leave "Add a README" **unticked**. Click **Create repository**.

### 2. Upload the files
**Option A: in the browser (easiest)**
1. On the empty repository page click **uploading an existing file**.
2. Open the `code-quest` folder on your computer, select **everything inside it** (`index.html`, `css`, `js`, `assets`, `tests`, `tools`, the `.md` files) and drag it into the browser window.
   Dragging whole folders keeps their structure.
3. Make sure `index.html` ends up at the **top level** of the repository, not inside an extra `code-quest/` folder. If it is nested, the link will have an extra folder in it.
4. Scroll down and click **Commit changes**.

**Option B: with Git**
```bash
cd code-quest
git init -b main
git add .
git commit -m "Code Quest phase 1"
git remote add origin https://github.com/YOUR-USERNAME/code-quest.git
git push -u origin main
```

### 3. Turn on GitHub Pages
1. In the repository click **Settings → Pages** (left sidebar).
2. Under **Build and deployment → Source** choose **Deploy from a branch**.
3. Under **Branch** choose **main** and folder **/ (root)**, then click **Save**.

### 4. Get the public link
Wait one to two minutes and refresh the **Pages** settings screen. A banner says *"Your site is live at …"*:

```text
https://YOUR-USERNAME.github.io/code-quest/
```

That single link is what you share with students. No login is needed.

### 5. Test on a phone and a computer
- Open the link on your phone (or scan a QR code made from the link) and on a computer.
- Walk through the checklist below. Try getting one question wrong three times, and refresh the page halfway.
- Turn the phone sideways to check the layout.

### 6. Update the app after making changes
- **In the browser:** open the file in the repository, click the ✏️ pencil, edit, and **Commit changes**.
  Or use **Add file → Upload files** to replace files.
- **With Git:** `git add . && git commit -m "Update questions" && git push`.
- The site refreshes in about a minute. If you still see the old version, do a hard refresh
  (**Ctrl+Shift+R** / **Cmd+Shift+R**), or on a phone, close the tab and reopen the link.
- Anyone already mid-quest keeps their saved progress until they close the tab, so avoid changing questions while students are using it.

> The `tests/` folder is harmless to publish. If you would rather students not see it, delete it from the repository.

---

## Changing the questions

Everything students read is in **`js/questions.js`**. Each question has a prompt, an optional code snippet, four options,
the index of the correct one (`answer`: 0 = A, 1 = B, 2 = C, 3 = D), two hints, an explanation and a "why wrong" note
for each wrong option. Keep **four questions per page** and **exactly four options**, because the automated tests check this.
After editing, run `node tools/export-question-bank.js` to refresh `QUESTION_BANK.md`.

---

## Testing

### Automated
```bash
node tests/engine.test.js
```
40 checks on the rules and question data: name validation, all three attempts and their exact messages, reveals earning
no point, locked questions can't be re-scored, independent counters, page/total scores, refresh persistence, tampered
saved data, restart.

For the click-through test, serve the folder (`python3 -m http.server 8000`) and open
`http://localhost:8000/tests/ui-test.html` (or `…/tests/ui-test.html` on your published site).
It runs the **real app** in a frame and checks 24 behaviours: welcome wording, name validation, selection states, all
three attempts, exact messages, all 16 questions loading, every page-score headline (4/4 to 0/4), celebration levels, the
final screen, refresh, restart, progress bars, no horizontal scrolling, no dead buttons. Add `?w=360` to test at phone width.

Result at the time of delivery: **40/40 engine checks and 24/24 UI tests passed** at both 1000px and 360px wide, in headless Chrome.

### Manual checklist (about 5 minutes)
- [ ] Welcome: "LET'S GO!" with an empty name shows an error and does not continue
- [ ] Your name appears in the top bar on every page and in capitals on the final screen
- [ ] Pick an answer → **Check Answer** switches on; pick another → selection moves
- [ ] Get one wrong 3 times → answer revealed, no point, **Next** appears
- [ ] Get one right → green message, options lock, tapping them does nothing
- [ ] Finish a page → score ring counts up, correct headline, **Continue** goes to the next page
- [ ] Pages 1–2 say Section A, pages 3–4 say Section B
- [ ] Refresh mid-question → same question, same attempts, name kept
- [ ] **Restart** (top bar) asks first, then returns to the welcome screen with an empty name
- [ ] Final screen shows score /16, %, four page bars, and the note that results are not sent to the teacher
- [ ] Looks right on a phone (portrait and landscape) and on a computer

## Not in Phase 1 (planned for Phase 2)
- Replace the temporary questions with the teacher-approved set
- Google Apps Script + Google Sheets results collection (with duplicate-submission protection and graceful offline handling)
- Teacher-only dashboard (search, class average, most-missed questions, export)
