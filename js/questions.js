/*
 * Young Engineers – The Code Quest
 * Question bank (Phase 1: TEMPORARY demonstration questions)
 *
 * These questions exist to test the engine. In Phase 2 they will be replaced
 * with the teacher-approved questions. To change a question, edit it here –
 * no other file needs to change.
 *
 * Each question has:
 *   id           unique id, e.g. "p1q1"
 *   concept      short label shown on the question card
 *   prompt       the question text
 *   code         (optional) a short code snippet shown under the prompt
 *   optionsAreCode (optional) true = show the answer options in code font
 *   options      exactly 4 answer choices
 *   answer       index (0-3) of the correct option
 *   hints        two hints: shown after wrong attempt 1 and wrong attempt 2
 *   explanation  why the correct answer is right
 *   whyWrong     one entry per option: why that option is wrong ('' for the correct one)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CodeQuestData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PAGES = [
    /* ───────────── SECTION A · PAGE 1 ───────────── */
    {
      id: 1,
      section: 'A',
      sectionTitle: 'Computer Science Fundamentals',
      title: 'Introduction to Programming',
      icon: '🧩',
      questions: [
        {
          id: 'p1q1',
          concept: 'Algorithms',
          prompt: 'What is an algorithm?',
          options: [
            'A secret code that only computers can read',
            'A step-by-step set of instructions for solving a problem',
            'A mistake that makes a program crash',
            'A small picture shown on a computer screen'
          ],
          answer: 1,
          hints: [
            'Think about a recipe, or the steps you follow to brush your teeth. What do they have in common?',
            'An algorithm is all about steps done in a certain order. Which option talks about steps?'
          ],
          explanation:
            'An algorithm is a step-by-step set of instructions to solve a problem or complete a task, like a recipe for making chapati. Programmers plan the algorithm first, then turn it into code.',
          whyWrong: [
            "Algorithms aren't secret codes. Anyone can read one. They are just clear steps written in order.",
            '',
            'A mistake in a program is called a bug. An algorithm is the plan of steps, not the mistake.',
            'Pictures on a screen are graphics. An algorithm is about steps, not pictures.'
          ]
        },
        {
          id: 'p1q2',
          concept: 'Pseudo-code',
          prompt: 'What is pseudo-code, and why is it useful?',
          options: [
            'Plain, human-friendly steps that help us plan a program before writing real code',
            'A special Python command that makes programs run faster',
            'The secret language computers use to talk to each other',
            'A tool that finds and fixes mistakes automatically'
          ],
          answer: 0,
          hints: [
            "The word 'pseudo' means 'not real'. So is pseudo-code real code that a computer runs?",
            'Engineers plan before they build. Which option is about planning the steps in simple words?'
          ],
          explanation:
            "Pseudo-code is a way of writing the steps of a program in simple, everyday language. It isn't real code, so a computer can't run it, but it helps programmers plan their thinking before they write the real thing.",
          whyWrong: [
            '',
            "Pseudo-code isn't a command, and it can't be run. It's a planning tool written in everyday words.",
            "Computers don't use pseudo-code. It is written for people to read, not for computers.",
            "Pseudo-code doesn't fix anything by itself. It helps us think through the steps clearly."
          ]
        },
        {
          id: 'p1q3',
          concept: 'Syntax',
          prompt: 'In programming, what does syntax mean?',
          options: [
            'How fast a program runs',
            'The answer a program shows on the screen',
            'The rules for how code must be written so the computer can understand it',
            'A picture that explains the code'
          ],
          answer: 2,
          hints: [
            'Think about grammar in English. Grammar has rules for building a sentence. What could be the "grammar" of a coding language?',
            'If you break the rules (like forgetting a bracket), the computer gets confused. Which option is about those rules?'
          ],
          explanation:
            'Syntax is the set of rules for how code must be written in a programming language. Just like grammar helps people understand a sentence, correct syntax helps the computer understand your code. One missing bracket or quote can break a whole program!',
          whyWrong: [
            'Speed is a different idea. Syntax is about how the code is written, not how fast it runs.',
            "That is the program's output. Syntax is about the way the code itself is written.",
            '',
            "Pictures can help us understand code, but syntax isn't a picture. It's the set of rules the code must follow."
          ]
        },
        {
          id: 'p1q4',
          concept: 'Functions',
          prompt: 'What is a function, and why do programmers use them?',
          options: [
            'A type of data, like a number or a word',
            'A rule that tells you where to put brackets',
            'A part of the computer that stores files',
            'A named block of code that does a job and can be used again and again'
          ],
          answer: 3,
          hints: [
            'Think of a function like a button on a microwave: press it and a job gets done. You can press it as many times as you like.',
            'Programmers do not like writing the same thing twice. Which option mentions using something again and again?'
          ],
          explanation:
            "A function is a named block of code that does a particular job. Once you've written it, you can use it again and again instead of repeating the same code. That saves time and keeps programs tidy.",
          whyWrong: [
            'Numbers and words are data types. A function is something different: it does a job.',
            'Those are syntax rules. A function is a block of code that does a job.',
            "Storing files is a job for the computer's storage, not a function in code.",
            ''
          ]
        }
      ]
    },

    /* ───────────── SECTION A · PAGE 2 ───────────── */
    {
      id: 2,
      section: 'A',
      sectionTitle: 'Computer Science Fundamentals',
      title: 'Computer Software Roadmap',
      icon: '🗺️',
      questions: [
        {
          id: 'p2q1',
          concept: 'BIOS/UEFI & POST',
          prompt:
            'You press the power button on a computer. Which part of the roadmap starts first and is responsible for POSTing (the Power-On Self-Test that checks the hardware)?',
          options: [
            'BIOS/UEFI',
            'Bootloader',
            'Operating System',
            'Applications such as Spotify'
          ],
          answer: 0,
          hints: [
            'Look at the roadmap from left to right. POSTing is written under the very first step.',
            'The first thing a computer does is check that its hardware is working. Which step comes first on the roadmap?'
          ],
          explanation:
            'BIOS/UEFI is the first step on the roadmap. When the computer powers on, it runs POST (the Power-On Self-Test) to check that important hardware is working before anything else starts.',
          whyWrong: [
            '',
            "The bootloader comes after BIOS/UEFI. Its job is to load the operating system, not to test the hardware.",
            'The operating system (like Windows 11) only starts later, after the computer has finished its start-up checks.',
            'Applications can only run after the computer has started. POST happens at the very beginning.'
          ]
        },
        {
          id: 'p2q2',
          concept: 'Bootloader',
          prompt: 'What is the job of the bootloader?',
          options: [
            'To check that the keyboard and memory are working',
            'To let you play games like Minecraft',
            'To start up (load) the operating system',
            'To write code in Python'
          ],
          answer: 2,
          hints: [
            'Look at the roadmap: the bootloader sits right before the Operating System. Why might it need to be there?',
            "'Boot' means to start up and 'loader' means something that loads. What does it load?"
          ],
          explanation:
            'The bootloader is responsible for booting, which means loading the operating system (like Windows 11) so the computer can start working. BIOS/UEFI wakes the hardware up first, then the bootloader gets the operating system started.',
          whyWrong: [
            "That is POST, which is done by BIOS/UEFI. The bootloader's job comes next.",
            'Games are applications. They run after the operating system is already loaded.',
            '',
            "Writing code is programming, a later step on the roadmap. The bootloader's job is to get the operating system started."
          ]
        },
        {
          id: 'p2q3',
          concept: 'Operating System',
          prompt: 'Which of these is an operating system?',
          options: [
            'Spotify',
            'Windows 11',
            'Google Chrome',
            'Minecraft'
          ],
          answer: 1,
          hints: [
            'The roadmap lists some examples under "Operating System". Which one of these four appears there?',
            'The operating system is the main software that runs the whole computer. The other three are things you open and use on top of it.'
          ],
          explanation:
            'Windows 11 (and Windows 10) are operating systems. The operating system runs the computer and lets applications like Spotify, Chrome and Minecraft work.',
          whyWrong: [
            'Spotify is an application (software) for playing music. It needs an operating system to run on.',
            '',
            'Chrome is an application for browsing the internet. It runs on top of an operating system.',
            'Minecraft is a game, which is an application. It needs an operating system to run.'
          ]
        },
        {
          id: 'p2q4',
          concept: 'Applications & Programming',
          prompt:
            'Spotify, Chrome and Minecraft are all software applications. How do we build software like these?',
          options: [
            'By pressing the power button',
            'By running POST',
            'By restarting the operating system',
            'By programming: writing code that tells the computer what to do'
          ],
          answer: 3,
          hints: [
            "Look at the second-to-last step on the roadmap. It says 'How we build'.",
            'Programmers write instructions in a language such as Python. What is the name of that activity?'
          ],
          explanation:
            'We build software through programming: writing code made of clear instructions for the computer. Programs like Spotify, Chrome and Minecraft all began as code written by programmers, and then they were launched for people to use!',
          whyWrong: [
            "The power button starts the computer. It doesn't create software.",
            "POST is the hardware check at start-up. It doesn't create software.",
            "Restarting only starts the computer again. It doesn't create anything new.",
            ''
          ]
        }
      ]
    },

    /* ───────────── SECTION B · PAGE 3 ───────────── */
    {
      id: 3,
      section: 'B',
      sectionTitle: 'Python Coding Challenges',
      title: 'Python Fundamentals',
      icon: '🐍',
      questions: [
        {
          id: 'p3q1',
          concept: 'print()',
          prompt: 'What will this Python program display on the screen?',
          code: 'print("Hello, Engineer!")',
          optionsAreCode: true,
          options: [
            'print("Hello, Engineer!")',
            '"Hello, Engineer!"',
            'Hello, Engineer!',
            'Nothing, there is an error'
          ],
          answer: 2,
          hints: [
            'print() shows on the screen whatever you put inside its brackets.',
            'The quotation marks mark where the text starts and stops. Does print() show the quote marks as well?'
          ],
          explanation:
            'print() displays text on the screen. Python shows the words inside the quotation marks, but not the quotation marks themselves, so we see: Hello, Engineer!',
          whyWrong: [
            'That is the code itself. print() shows what is inside the brackets, not the word print.',
            "The quotation marks tell Python where the text starts and stops, but they aren't shown on the screen.",
            '',
            'The code is written correctly (the brackets and quotes match), so Python runs it without any problem.'
          ]
        },
        {
          id: 'p3q2',
          concept: 'Variables',
          prompt: 'Look at this line of Python. What is score?',
          code: 'score = 10',
          options: [
            'A variable: a name that stores the value 10',
            'A string: a word in quotation marks',
            'A function that prints 10',
            'A syntax mistake'
          ],
          answer: 0,
          hints: [
            'Think of a labelled box. The label is score. What goes inside the box?',
            'The = sign puts a value into a name so we can use it later. What do we call a name that stores a value?'
          ],
          explanation:
            'score is a variable. A variable is a name that stores a value. The line score = 10 puts the value 10 into the variable called score, so we can use it later.',
          whyWrong: [
            '',
            'A string is text inside quotation marks. Here the 10 has no quotes, and score is a name, not text.',
            'A function would have brackets, like score(). Here, score is just storing a value.',
            'This line is perfectly correct Python! It follows the syntax rules.'
          ]
        },
        {
          id: 'p3q3',
          concept: 'Integers & Strings',
          prompt: 'Which line stores an integer (a whole number) in a variable?',
          optionsAreCode: true,
          options: [
            'age = "12"',
            'age = 12',
            'age = "twelve"',
            'age = twelve'
          ],
          answer: 1,
          hints: [
            'An integer is a whole number like 7, 12 or 100.',
            'Strings (words) go inside quotation marks. Which line has a number with no quotation marks?'
          ],
          explanation:
            'age = 12 stores an integer: a whole number written with no quotation marks. In Python, anything inside quotation marks is a string, even if it looks like a number.',
          whyWrong: [
            'The quotation marks turn 12 into a string (text), not an integer.',
            '',
            '"twelve" inside quotation marks is a string (a word). An integer is a number written with digits and no quotes.',
            "Without quotation marks, Python thinks twelve is the name of a variable. It isn't a number written with digits."
          ]
        },
        {
          id: 'p3q4',
          concept: 'Python Syntax',
          prompt: 'Only one of these lines is written with correct Python syntax. Which one?',
          optionsAreCode: true,
          options: [
            'print("Hi"',
            'print "Hi")',
            'print(Hi")',
            'print("Hi")'
          ],
          answer: 3,
          hints: [
            'Check the brackets. For every ( there must be a ).',
            'Check the quotation marks too. They also come in pairs: one at the start of the text and one at the end.'
          ],
          explanation:
            'print("Hi") follows the syntax rules: the brackets and the quotation marks all come in matching pairs. The other lines each break one of those rules, so Python would show an error.',
          whyWrong: [
            'The closing bracket ) is missing. Every opening bracket needs a partner.',
            'The opening bracket ( is missing before "Hi".',
            'The opening quotation mark is missing before Hi. Quotation marks must come in pairs.',
            ''
          ]
        }
      ]
    },

    /* ───────────── SECTION B · PAGE 4 ───────────── */
    {
      id: 4,
      section: 'B',
      sectionTitle: 'Python Coding Challenges',
      title: 'Think Like a Programmer',
      icon: '🤖',
      questions: [
        {
          id: 'p4q1',
          concept: 'Predict the Output',
          prompt: 'What does this program display?',
          code: 'name = "Alex"\nprint(name)',
          optionsAreCode: true,
          options: [
            'Alex',
            'name',
            '"Alex"',
            'print(name)'
          ],
          answer: 0,
          hints: [
            'First, what value is stored in the variable name?',
            'print(name) has no quotation marks, so Python prints the value stored inside name.'
          ],
          explanation:
            'The variable name stores "Alex". Then print(name) displays the value inside the variable, so the screen shows: Alex',
          whyWrong: [
            '',
            "print(name) has no quotation marks, so Python looks inside the variable called name. It doesn't print the word name.",
            'The quotation marks only mark the text in the code. They are not displayed.',
            "That is the code itself. The program displays the result of the code, not the code."
          ]
        },
        {
          id: 'p4q2',
          concept: 'Integers & Output',
          prompt: 'What does this program display?',
          code: 'a = 5\nb = 3\nprint(a + b)',
          optionsAreCode: true,
          options: [
            'a + b',
            '53',
            '8',
            '15'
          ],
          answer: 2,
          hints: [
            'Both 5 and 3 are integers: numbers without quotation marks.',
            'The + sign between two integers adds them together, just like in maths.'
          ],
          explanation:
            'a stores 5 and b stores 3. Because they are integers, a + b adds them to get 8, and print() displays: 8',
          whyWrong: [
            "Python works out the answer using the values. It doesn't print the letters.",
            '53 would happen if 5 and 3 were strings (words) stuck together. Here they are integers, so Python adds them.',
            '',
            '15 is 5 × 3. The + sign adds; it does not multiply.'
          ]
        },
        {
          id: 'p4q3',
          concept: 'Functions',
          prompt: 'What does this program display?',
          code: 'def greet():\n    print("Hello!")\n\ngreet()',
          optionsAreCode: true,
          options: [
            'def greet():',
            'Hello!',
            'greet()',
            'Nothing at all'
          ],
          answer: 1,
          hints: [
            'The first two lines build a function called greet. Look at the last line: what does it do?',
            'Writing greet() runs (calls) the function. What does the code inside the function do?'
          ],
          explanation:
            'The first two lines define a function named greet that prints a message. The last line, greet(), calls the function, so the code inside it runs and the screen shows: Hello!',
          whyWrong: [
            "That line builds (defines) the function. It's not what gets displayed.",
            '',
            'The last line calls the function, which means it runs the code inside it. It does not print the name greet().',
            'The function is used on the last line (greet()), so the code inside it does run.'
          ]
        },
        {
          id: 'p4q4',
          concept: 'Spot the Mistake',
          prompt: 'This program should display Sam, but Python shows an error. What is the mistake?',
          code: 'my_name = "Sam"\nprint(myname)',
          options: [
            '"Sam" should not have quotation marks',
            'print should start with a capital P',
            'The = sign should be removed',
            'The variable is called my_name, but print uses myname'
          ],
          answer: 3,
          hints: [
            'Compare line 1 and line 2 very carefully, letter by letter.',
            'Look at the variable name on line 1. Is it spelled exactly the same inside the print() brackets?'
          ],
          explanation:
            'The variable is created as my_name (with an underscore), but print(myname) uses a different name. Python cannot find myname, so it shows an error. Variable names must match exactly. The fix is print(my_name).',
          whyWrong: [
            'The quotation marks are correct. Sam is a string (a word), so it needs them.',
            "Python's print is written in lowercase, just like it is here.",
            'The = sign is how we store a value in a variable, so we need it.',
            ''
          ]
        }
      ]
    }
  ];

  const QUESTIONS = PAGES.reduce(function (all, page) {
    return all.concat(page.questions);
  }, []);

  return { PAGES: PAGES, QUESTIONS: QUESTIONS };
});
