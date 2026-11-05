# Teacher review notes · Code Quest (Phase 1)

These notes cover (1) statements on the two lesson slides that look technically ambiguous or inaccurate,
(2) places where the temporary questions go beyond what the slides show, and (3) wording choices made by
the developer. **Nothing on the slides has been silently changed.** Where a slide statement is questionable,
no question asks students to learn it as fact.

The full list of temporary questions, answers, hints and explanations is in `QUESTION_BANK.md`.

---

## 1. Slide statements to review

### Slide 2 · "Bios/UEFI: Powered by C-mos battery"  ⚠ most important
- **Concern:** This can leave students thinking the BIOS/UEFI *runs on* the CMOS battery.
- **What is accurate:** The BIOS/UEFI firmware is a program stored on a chip on the motherboard, and it runs on
  the computer's normal power. The small coin-cell battery (often a CR2032) only keeps the **clock** and the
  **saved BIOS/UEFI settings** (kept in a small amount of CMOS memory) alive while the computer is switched off or unplugged.
- **Suggested wording:** "Its settings and the clock are kept alive by the CMOS battery."
- **In the quiz:** No question uses this statement.

### Slide 2 · "Bios/UEFI: Stored in ROM"
- **Concern:** Simplified. Older machines did use ROM, but modern motherboards store the firmware in rewritable
  flash memory (that is why a BIOS/UEFI can be "updated" or "flashed").
- **Suggested wording:** "Stored in a memory chip on the motherboard that keeps its contents without power."
- **In the quiz:** No question uses this statement.

### Slide 2 · "Responsible for POSTING"
- Correct. The slide never defines POST. The quiz spells it out for students as **Power-On Self-Test**
  (a check that important hardware is working). This expansion is an addition, not slide text. Please confirm you are happy with it.

### Slide 2 · "Boot loader: Responsible to booting/Loading O.S"
- Correct as a simplification. The quiz writes it as one word, "bootloader".

### Slide 2 · "Operating System: Windows os – win 11, 10"
- Correct, but it lists only Windows. Consider also showing macOS, Linux and Android so students do not think
  "operating system" means "Windows". (Windows 10 also reached end of support in October 2025, which is
  harmless as an example but worth knowing.)
- The quiz question asks which item is an operating system and uses Windows 11 as the answer, as on the slide.

### Slide 2 · "Software/Application: Spotify, Chrome, Games – Fortnite, Minecraft"
- Correct. Chrome is a web browser, an application. Games are also applications, so "Games" as its own line is fine.

### Slide 2 · "Programing" and "Launch"
- "Programing" is spelled with one *m* on the slide (the quiz uses "programming").
- The **Launch** box shows placeholder emoji and no text, so it is unclear what students should learn from it.
  No question tests "Launch". One explanation says software is "launched for people to use", which is the
  developer's wording, not the slide's. Please tell me what you want Launch to teach (for example releasing finished software to users).

### Slide 1 · "Data Types: Numbers (integers), Strings (words)"
- **Concern:** Simplified. A string is any **text** in quotation marks (letters, digits, symbols, spaces), not only "words".
  "Numbers" also includes decimals (floats) in Python.
- **In the quiz:** Integer is taught as "a whole number" and string as "text in quotation marks", with the point
  that `"12"` in quotes is a string even though it looks like a number. This is accurate and consistent with the
  slide, but it goes slightly beyond "words". Decimals and booleans are **not** tested.

### Slide 1 · "Algorithm – What?", "Syntax – Why??", "Functions – What are they??", "Pseudo-code"
- These are prompts, not definitions. The quiz uses standard beginner definitions:
  algorithm = step-by-step instructions; pseudo-code = plain-language plan, not runnable; syntax = the rules for writing code;
  function = named, reusable block of code. Please confirm these match how you taught them.

---

## 2. Temporary questions that go beyond the slides

Section B (the Python pages) was requested by the brief, but the slides do not show any Python. These ideas appear in the questions and
should be checked against what has actually been taught:

| Idea | Where used |
|---|---|
| `print()` and that quotation marks are not displayed | `p3q1`, `p3q4`, `p4q1`–`p4q3` |
| Variables and the `=` sign | `p3q2`, `p3q3`, `p4q1`, `p4q2`, `p4q4` |
| Integers vs strings by looking at quotation marks | `p3q3`, `p4q2` |
| `+` adding two integers | `p4q2` |
| `def` (defining a function) and calling `greet()` | `p4q3` |
| Variable names must match exactly (spot the mistake) | `p4q4` |

If `def` has not been taught yet, `p4q3` should be replaced in Phase 2.

---

## 3. Other things to confirm before the real assessment

- **Answers are visible in the page source.** The quiz runs entirely in the browser, so a curious student can open
  the developer tools and find the answers in `js/questions.js`. For the same reason, **scores are calculated in the
  student's browser and reported to the results sheet**. The backend re-checks the data and works out the points itself,
  but it cannot see which buttons a student really pressed. If a score will be formally graded, treat the sheet as
  a record of what the quiz reported, not as tamper-proof evidence.
- **Students are identified by the name they type.** Two students with the same name collide, and a student can type a
  classmate's name. Fill in the **Roster** tab (see README) so only listed names can start; that closes both gaps.
- **Shared computers:** progress is now kept in `localStorage`, so it survives closing the browser. The next student
  on the same computer sees "Not NAME? Switch student", and typing a different name starts a clean quest. If a student
  walks away mid-quest on a school PC, anyone typing that name resumes it, so students should only use their own names.
- **Abandoned sittings:** a sitting is registered on the server when it starts. If a student starts and then loses
  the device or clears the browser before finishing, they cannot start a second one by themselves. Open the **Sittings**
  tab and change that row's Status from `started` to `reset`. They can then start again.
- **Questions are still demonstration placeholders** (4 pages × 5; the fifth on each page is "select TWO").
- **Option order is fixed** (the correct answer is not always in the same position, but the order is the same for every student).
- **Mascot name:** the robot is unnamed in the app; you may want to give it a Young Engineers name.
