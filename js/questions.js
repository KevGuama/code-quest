/*
 * Young Engineers – The Code Quest
 * Question bank (demonstration questions, refined with the PictoBlox → Python bridge)
 *
 * Page 3 starts from PictoBlox's Tobi.say() before Python's print(); Page 4 starts from
 * Tobi.input() before Python's input(). The Tobi code follows the class screenshots exactly
 * (capital T, Tobi = Sprite('Tobi')). Final teacher approval is still pending.
 * To change a question, edit it here – no other file needs to change.
 *
 * Each question has (5 per page, 4 pages = 20 questions; the 5th on every page is 'multi'):
 *   id           unique id, e.g. "p1q1"
 *   concept      short label shown on the question card
 *   prompt       the question text
 *   code         (optional) a short code snippet shown under the prompt
 *   optionsAreCode (optional) true = show the answer options in code font
 *   type         'single' (pick one) or 'multi' (pick several, all-or-nothing)
 *   options      exactly 4 answer choices
 *   answer       single: index (0-3) of the correct option
 *                multi:  array of the correct indexes, e.g. [0, 2]. The student is told
 *                        how many to pick, and must choose exactly that combination
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
          type: 'single',
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
          type: 'single',
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
          type: 'single',
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
          type: 'single',
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
        },
        {
          id: 'p1q5',
          type: 'multi',
          concept: 'Data Types',
          prompt: 'Which of the following are data types? Select TWO correct answers.',
          options: [
            'Integer',
            'Pseudo-code',
            'String',
            'Syntax'
          ],
          answer: [0, 2],
          hints: [
            'Look at the last bubble on the Introduction to Programming slide. It is all about Data Types. What two examples does it show?',
            'One data type is for numbers and one is for words (text). The other two options are different ideas from the same lesson, but they are not types of data.'
          ],
          explanation:
            'Integer and string are data types. An integer is a whole number, and a string is text (like words) written inside quotation marks. Pseudo-code is a way of planning, and syntax is the set of rules for writing code. Neither of those is a type of data.',
          whyWrong: [
            '',
            "Pseudo-code is a planning tool written in plain words. It isn't a kind of data.",
            '',
            "Syntax is the set of rules for writing code. It isn't a kind of data."
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
          type: 'single',
          concept: 'Starting Up',
          prompt:
            'A computer is switched on. Before the operating system loads, a built-in system performs important start-up checks and wakes up the hardware. Which part of the roadmap is responsible for this?',
          options: [
            'The bootloader',
            'The operating system',
            'BIOS/UEFI',
            'An application such as Spotify'
          ],
          answer: 2,
          hints: [
            'Look at the roadmap from left to right. Which step happens first, before anything else can start?',
            'The roadmap\'s first step checks that the hardware (like the memory and keyboard) is working. Which step is that?'
          ],
          explanation:
            'BIOS/UEFI is the first step on the roadmap. When the computer powers on, it runs POST (the Power-On Self-Test) to check that important hardware is working and gets it ready, before anything else starts.',
          whyWrong: [
            'The bootloader comes after the start-up checks. Its job is to load the operating system, not to test the hardware.',
            'The operating system (like Windows 11) only starts later, after the computer has finished its start-up checks.',
            '',
            'Applications can only run after the computer has started. The start-up checks happen at the very beginning.'
          ]
        },
        {
          id: 'p2q2',
          type: 'single',
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
          type: 'single',
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
          type: 'single',
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
        },
        {
          id: 'p2q5',
          type: 'multi',
          concept: 'Roadmap Order',
          prompt:
            'Think about the Computer Software Roadmap. Which of these happen BEFORE the operating system is loaded? Select TWO correct answers.',
          options: [
            'You open Chrome to browse the internet',
            'BIOS/UEFI runs POST to check the hardware',
            'You launch Minecraft and start playing',
            'The bootloader gets ready to load the operating system'
          ],
          answer: [1, 3],
          hints: [
            'Think about the order of the roadmap, from left to right. The operating system is the third step.',
            'Only the steps to the LEFT of Operating System happen before it. Which two options match those steps?'
          ],
          explanation:
            'BIOS/UEFI (running POST) and the bootloader are the first two steps on the roadmap, so both happen before the operating system is loaded. Chrome and Minecraft are applications, and applications can only run after the operating system is up and running.',
          whyWrong: [
            'Chrome is an application. Applications come after the operating system on the roadmap, because they need it to run.',
            '',
            'Minecraft is a game, which is an application. It can only start after the operating system has loaded.',
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
          type: 'single',
          concept: 'PictoBlox Code',
          prompt:
            'In PictoBlox you used Python mode to program Tobi. Look at this code. What does Tobi.say("Hello 7B !!!", 10) do?',
          code: 'Tobi = Sprite(\'Tobi\')\nTobi.say("Hello 7B !!!", 10)',
          options: [
            'Tobi asks the user to type their name',
            'Tobi moves 10 steps across the Stage',
            'Tobi shows the message "Hello 7B !!!" in a speech bubble on the Stage',
            'Tobi hides from the Stage'
          ],
          answer: 2,
          hints: [
            'Think back to your PictoBlox lesson. Tobi is the sprite on the Stage. Read the message inside the brackets: what is Tobi being told to do with it?',
            'The word say is a big clue. The number 10 after the message is a number of seconds.'
          ],
          explanation:
            'Tobi.say() lets Tobi communicate: the message inside the brackets appears in a speech bubble on the Stage. The number 10 after the message is how many seconds it is shown, just like in your class notes. This is PictoBlox code for the Tobi sprite. Next, you will see how Python does a similar job.',
          whyWrong: [
            'Asking the user a question is a different instruction, Tobi.input(). You will meet it on Page 4.',
            'The 10 is a number of seconds, not steps. Moving Tobi needs a different instruction.',
            '',
            'Tobi.say() makes Tobi speak. It does not hide him.'
          ]
        },
        {
          id: 'p3q2',
          type: 'single',
          concept: 'PictoBlox to Python',
          prompt:
            'Here is the same message written in PictoBlox and in Python. What do these two instructions have in common?',
          code: 'Tobi.say("Hello 7B !!!", 10)\nprint("Hello 7B !!!")',
          options: [
            'Both store the message in a variable',
            'Both display the message Hello 7B !!!',
            'Both are built-in Python functions',
            'Both ask the user to type an answer'
          ],
          answer: 1,
          hints: [
            'Look at the words inside the brackets of each line. Is the message the same?',
            'Think about what each line does with that message. Does either line save something, or ask the user for something?'
          ],
          explanation:
            'Both instructions display a message. Tobi.say() shows it in a speech bubble on the Stage in PictoBlox, and Python\'s print() shows it as text (in PictoBlox, in the Terminal at the bottom). They do a similar job, but they are not the same instruction: Tobi.say() belongs to PictoBlox and the Tobi sprite, while print() is built into Python itself. Notice too that print() shows the words inside the quotation marks, but not the quotation marks. What you already know about Tobi.say() is a great start for learning print()!',
          whyWrong: [
            'Neither line saves the message anywhere. Both just show it.',
            '',
            'print() is built into Python, but Tobi.say() belongs to PictoBlox and the Tobi sprite. They are similar, but they are not the same kind of instruction.',
            'Asking for an answer is the job of an input instruction, which you will meet later. These two lines only show a message.'
          ]
        },
        {
          id: 'p3q3',
          type: 'single',
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
          id: 'p3q4',
          type: 'single',
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
        },
        {
          id: 'p3q5',
          type: 'multi',
          concept: 'Integers & Strings',
          prompt: 'Which of these are strings? Select TWO correct answers.',
          optionsAreCode: true,
          options: [
            '"Robot"',
            '42',
            '100',
            '"42"'
          ],
          answer: [0, 3],
          hints: [
            'In Python, a string is text. Look for how Python marks text.',
            'Anything inside quotation marks is a string, even if it looks like a number. Which two options have quotation marks?'
          ],
          explanation:
            '"Robot" and "42" are strings because they are inside quotation marks. Even though "42" looks like a number, the quotation marks make it a string. The numbers 42 and 100 with no quotation marks are integers (whole numbers).',
          whyWrong: [
            '',
            'A number with no quotation marks is an integer (a whole number), not a string.',
            'A number with no quotation marks is an integer (a whole number), not a string.',
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
          type: 'single',
          concept: 'PictoBlox Input',
          prompt:
            'Back in PictoBlox, you also used Tobi.input(). Look at this code. What does Tobi.input("What\'s your name !!!") do?',
          code: 'Tobi = Sprite(\'Tobi\')\nTobi.input("What\'s your name !!!")',
          options: [
            'Tobi tells the user his own name',
            'Tobi shows the message and ignores anything the user types',
            'Tobi asks the question and waits for the user to type an answer',
            'Tobi moves to a new place on the Stage'
          ],
          answer: 2,
          hints: [
            'The word input means information going IN to the program. Who is giving that information?',
            'Look at the message inside the brackets. Is it a statement, or a question for the user to answer?'
          ],
          explanation:
            'Tobi.input() lets Tobi ask the user a question and wait for their answer. In your class example, Tobi asked "What\'s your name !!!" and a box appeared on the Stage for typing. This is how a program can receive information from the person using it. Python has a comparable tool, which you will see next.',
          whyWrong: [
            'Tobi.input() asks the user something. It does not tell them about Tobi.',
            'Showing a message without taking an answer is closer to Tobi.say(). Tobi.input() waits for the answer.',
            '',
            'Moving Tobi needs different instructions. Tobi.input() is about receiving an answer from the user.'
          ]
        },
        {
          id: 'p4q2',
          type: 'single',
          concept: 'Python Input',
          prompt:
            'Python has a comparable tool called input(). A student runs this line. What does it do?',
          code: 'name = input("What is your name? ")',
          options: [
            'It prints What is your name? and then the program ends',
            'It asks the user What is your name?, waits for them to type, and stores their answer in name',
            'It stores the words What is your name? inside name',
            'It checks whether the user has a name'
          ],
          answer: 1,
          hints: [
            'Compare it with Tobi.input(): it also asks the user something. This time, look to the left of the = sign. Where does the answer go?',
            'The = sign puts a value into a variable. Here, the value is whatever the user types.'
          ],
          explanation:
            'input() asks the question inside the brackets, waits for the user to type an answer, and hands that answer back. In name = input(...), the answer is stored in the variable name, so the program can use it later, for example with print(name). Tobi.input() and Python\'s input() have a similar purpose: receiving information from the user. But Tobi.input() belongs to PictoBlox and the Tobi sprite, while input() is built into Python. They are comparable, not identical.',
          whyWrong: [
            'input() does more than show the words. It also waits for the user to type an answer.',
            '',
            'The words in the brackets are only the question shown to the user. What gets stored in name is the answer the user types.',
            'input() does not check anything. It simply receives whatever the user types.'
          ]
        },
        {
          id: 'p4q3',
          type: 'single',
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
          id: 'p4q4',
          type: 'single',
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
        },
        {
          id: 'p4q5',
          type: 'multi',
          concept: 'Predict the Output',
          prompt: 'Look at the code. Which TWO of these lines would display 10 on the screen? Select TWO correct answers.',
          code: 'a = 4\nb = 6',
          optionsAreCode: true,
          options: [
            'print(a)',
            'print(a + b)',
            'print(10)',
            'print("a + b")'
          ],
          answer: [1, 2],
          hints: [
            'First work out what each line would show. What values are stored in a and b?',
            'a is 4 and b is 6, so a + b is 10. Does anything inside quotation marks get worked out, or is it just shown as text?'
          ],
          explanation:
            'print(a + b) adds the integers 4 and 6 to get 10, and print(10) displays 10 directly. print(a) would display 4, and print("a + b") would display the text a + b because it is inside quotation marks.',
          whyWrong: [
            'print(a) shows the value of a, which is 4, not 10.',
            '',
            '',
            'The quotation marks turn a + b into text, so the screen would show: a + b'
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
