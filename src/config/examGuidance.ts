export interface ExamFocusArea {
  label: string;
  text: string;
}

export interface ExamFaqItem {
  question: string;
  answer: string;
}

export interface ExamPlatformNote {
  telegramNote?: string;
  discordNote?: string;
  dualTelegramNote?: string;
  dualDiscordNote?: string;
}

export interface ExamGuidance {
  focusAreas: ExamFocusArea[];
  faqs: ExamFaqItem[];
  platformNote?: ExamPlatformNote;
}

export const examGuidanceMap: Record<string, ExamGuidance> = {
  sat: {
    focusAreas: [
      { label: 'Digital SAT Desmos Shortcuts', text: 'Working through quantitative problems using built-in Desmos graphing calculator functions and speed shortcuts.' },
      { label: 'Reading & Writing Logic', text: 'Analyzing text structure, transitions, cross-text connections, and standard English conventions.' },
      { label: 'Bluebook Practice Debriefs', text: 'Reviewing official College Board Bluebook adaptive mock tests to identify recurring timing issues.' },
      { label: 'Peer Study Accountability', text: 'Daily check-ins and shared practice goals to maintain steady progress ahead of upcoming SAT test dates.' },
    ],
    platformNote: {
      dualTelegramNote: 'Best for daily math quiz polls, quick grammar practice questions, and test date notification updates directly on your phone.',
      dualDiscordNote: 'Best for live Desmos calculator screen-sharing sessions, timed mock test rooms, and voice study lounges.',
    },
    faqs: [
      { question: 'How do SAT study groups help with the Digital SAT?', answer: 'Members share Desmos calculator techniques, review official Bluebook test questions, and exchange pacing strategies for the adaptive digital format.' },
      { question: 'How can I find an SAT study partner?', answer: 'Join an active group and post your target test date, target score range, and timezone to find peers taking the same test cycle.' },
      { question: 'Are SAT Telegram and Discord groups safe?', answer: 'Public communities are useful for peer practice. Never share personal account credentials and avoid any claims of leaked test questions.' },
      { question: 'How often are SAT listings verified?', answer: 'Our automated validation system tests SAT group invite URLs regularly to identify and remove dead or inactive links.' },
    ],
  },
  gre: {
    focusAreas: [
      { label: 'Vocabulary & Sentence Equivalence', text: 'Reviewing high-frequency academic words, context clues, and secondary definitions in Sentence Equivalence questions.' },
      { label: 'Quantitative Comparison Shortcuts', text: 'Dissecting QC problems using number properties, estimation, and algebraic simplification.' },
      { label: 'Reading Comprehension Arguments', text: 'Breaking down assumption, strengthen/weaken, and inference questions in dense academic passages.' },
      { label: 'Analytical Writing Brainstorming', text: 'Peer discussions on developing compelling examples and structured outlines for the Issue task.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels and discussion groups are popular for daily vocabulary drills, quantitative comparison trick discussions, and peer partner matching.',
    },
    faqs: [
      { question: 'What is the best way to practice GRE vocabulary in study groups?', answer: 'Many GRE channels run daily vocabulary drills and sentence completion drills that reinforce word roots and contextual usage.' },
      { question: 'Can I find a GRE quantitative study partner?', answer: 'Yes. Students frequently pair up to work through challenging geometry, probability, and quantitative comparison problem sets.' },
      { question: 'Are GRE study groups free to join?', answer: 'All public GRE communities listed on StudyGroupsHub are free to join via direct platform invite links.' },
      { question: 'How often are GRE group links tested?', answer: 'Our automated link checking pipeline tests GRE community links regularly to ensure they remain active and accessible.' },
    ],
  },
  gmat: {
    focusAreas: [
      { label: 'Data Insights Problem Solving', text: 'Collaborative practice on Multi-Source Reasoning, Table Analysis, and Two-Part Analysis question formats.' },
      { label: 'Data Sufficiency Logic', text: 'Dissecting statements independently and identifying value vs. yes/no sufficiency patterns.' },
      { label: 'Critical Reasoning Dissection', text: 'Identifying argument conclusions, implicit assumptions, and flaws in logic under timed conditions.' },
      { label: 'B-School Prep Check-ins', text: 'Sharing study schedules and test-taking pacing strategies tailored to the GMAT Focus Edition format.' },
    ],
    platformNote: {
      dualTelegramNote: 'Best for daily Data Insights practice questions, formula review notes, and mobile application discussions.',
      dualDiscordNote: 'Best for structured topic channels, timed problem-solving sprints, and business school applicant discussion rooms.',
    },
    faqs: [
      { question: 'How do study groups help with the GMAT Focus Edition?', answer: 'Communities focus on Data Insights problem types, Data Sufficiency elimination techniques, and Section Order pacing.' },
      { question: 'How can I find a study partner for business school prep?', answer: 'Introduce yourself in active GMAT channels with your target score and planned exam window to connect with fellow applicants.' },
      { question: 'Are GMAT study channels safe to use?', answer: 'Public discussion channels are safe for practice problems and strategy. Never purchase unauthorized materials or test question dumps.' },
      { question: 'How are GMAT community listings maintained?', answer: 'We regularly test invite links and verify that listed communities maintain a clear focus on official GMAT preparation.' },
    ],
  },
  jee: {
    focusAreas: [
      { label: 'Advanced Physics & Mechanics', text: 'Working through multi-concept problems in rotational motion, electrodynamics, and modern physics.' },
      { label: 'Organic Chemistry Synthesis', text: 'Reviewing reaction mechanisms, named reactions, and multi-step organic conversion pathways.' },
      { label: 'Past Year Question (PYQ) Solutions', text: 'Detailed step-by-step solutions and speed shortcuts for JEE Main and JEE Advanced past papers.' },
      { label: 'Mock Test Score Analysis', text: 'Debriefing full-length mock exams, analyzing negative marking patterns, and managing examination stamina.' },
    ],
    platformNote: {
      telegramNote: 'Telegram study channels provide Kota faculty revision notes, complex PYQ solutions, and daily physics/chemistry numerical problem sets.',
    },
    faqs: [
      { question: 'How do JEE study groups help with Main and Advanced preparation?', answer: 'Channels provide peer explanations for difficult PYQs, discuss problem-solving shortcuts, and share revision summaries for Physics, Chemistry, and Math.' },
      { question: 'Can I find serious JEE study partners in these channels?', answer: 'Yes. Candidates testing in the current cycle frequently form small accountability groups for daily question targets.' },
      { question: 'Are JEE Telegram channels free to join?', answer: 'All listed JEE study communities are public and free to join via standard Telegram invite links.' },
      { question: 'How often are JEE community links verified?', answer: 'Our validation system checks JEE invite links on an ongoing basis to ensure group access remains active and publicly reachable.' },
    ],
  },
  neet: {
    focusAreas: [
      { label: 'NCERT Line-by-Line Biology', text: 'Collaborative review of NCERT textbook diagrams, summary points, and high-yield biological facts.' },
      { label: 'Physics Numerical Problem Solving', text: 'Practicing formula application, dimensional analysis, and speed calculation shortcuts for NEET Physics.' },
      { label: 'Chemistry Reaction Mechanisms', text: 'Breaking down Physical Chemistry formulas, Inorganic NCERT tables, and Organic reaction schemes.' },
      { label: 'Full-Length Mock Debriefs', text: 'Discussing full 720-mark mock test errors, question selection strategy, and time management.' },
    ],
    platformNote: {
      dualTelegramNote: 'Best for daily NCERT Biology chapter polls, high-yield diagram notes, and quick doubt discussions.',
      dualDiscordNote: 'Best for peer voice channels, screen-sharing complex Physics/Chemistry problems, and group study sessions.',
    },
    faqs: [
      { question: 'How do NEET study groups assist with NCERT revision?', answer: 'Members share daily chapter-wise quizzes, point out easily overlooked NCERT lines, and discuss confusing biological terminology.' },
      { question: 'How can I find a NEET study partner for daily practice?', answer: 'Post in active NEET groups with your daily revision goals (e.g. 100 MCQs/day) to pair with a dedicated study buddy.' },
      { question: 'Are NEET study channels safe and legitimate?', answer: 'Public groups are helpful for peer problem-solving. Always avoid channels that claim to offer leaked papers or unauthorized answer keys.' },
      { question: 'How are NEET group links checked?', answer: 'We automatically verify invite links to confirm they lead to active channels and exclude groups that violate academic integrity.' },
    ],
  },
  gate: {
    focusAreas: [
      { label: 'Core Technical Engineering Concepts', text: 'Deep dives into branch-specific subjects across CS, ECE, EE, ME, and Civil Engineering blueprints.' },
      { label: 'Engineering Mathematics & Aptitude', text: 'Step-by-step solutions for Linear Algebra, Calculus, Differential Equations, and Numerical Methods.' },
      { label: 'Virtual Calculator Pacing', text: 'Practicing calculation efficiency using virtual calculator constraints and Numerical Answer Type (NAT) precision.' },
      { label: 'PYQ Subject-Wise Analysis', text: 'Analyzing 20-year past GATE questions to identify core recurring conceptual themes and edge cases.' },
    ],
    platformNote: {
      telegramNote: 'Telegram engineering channels share branch-specific formula sheets, technical concept discussions, and past GATE question walkthroughs.',
    },
    faqs: [
      { question: 'How do GATE study groups support different engineering disciplines?', answer: 'Groups organize discussion around specific branch syllabi (such as CS, ECE, or Mechanical) and share step-by-step solutions for NAT questions.' },
      { question: 'How can I find a GATE study buddy in my branch?', answer: 'Join branch-focused discussion threads and post your subject schedule to coordinate revision and problem-solving.' },
      { question: 'Are GATE Telegram groups free to join?', answer: 'Yes. All listed GATE communities are public and free to join without registration fees.' },
      { question: 'How often are GATE listings tested for link validity?', answer: 'Our automated validation suite checks invite URLs regularly to detect invalid or broken community links.' },
    ],
  },
  upsc: {
    focusAreas: [
      { label: 'GS Papers I–IV Conceptual Clarity', text: 'Structured discussion around Indian Polity, History, Geography, Economy, Environment, and Ethics.' },
      { label: 'Daily Editorial & Current Affairs', text: 'Analyzing major national newspaper editorials and summarizing key policy developments for Mains and Prelims.' },
      { label: 'Mains Answer Writing Peer Review', text: 'Exchanging structured answers with introductions, body diagrams, and balanced conclusions for peer critique.' },
      { label: 'Prelims CSAT & MCQ Strategy', text: 'Practicing elimination techniques for UPSC Prelims multiple-choice questions and CSAT reasoning.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels are widely used for daily newspaper editorial summaries, Prelims MCQ practice, and Mains answer writing frameworks.',
    },
    faqs: [
      { question: 'How do UPSC study groups help with Mains answer writing?', answer: 'Aspirants regularly share daily answer frameworks, critique structure and presentation, and exchange model points based on syllabus topics.' },
      { question: 'How can I find a serious UPSC accountability partner?', answer: 'Introduce yourself in active discussion channels with your optional subject, attempt year, and daily study targets.' },
      { question: 'Are UPSC Telegram groups safe for study preparation?', answer: 'Public groups provide useful peer exchange. Never purchase unauthorized material or engage with commercial coaching spam.' },
      { question: 'How often are UPSC community links checked?', answer: 'We regularly test invite links to ensure listed UPSC channels remain active and publicly accessible.' },
    ],
  },
  ielts: {
    focusAreas: [
      { label: 'Speaking Partner Practice', text: 'Pairing with peer candidates for live voice practice covering Part 1, Part 2 cue cards, and Part 3 abstract discussions.' },
      { label: 'Academic Writing Task Review', text: 'Peer feedback on Task 1 data reports and Task 2 argumentative essays evaluating Lexical Resource and Cohesion.' },
      { label: 'Daily Vocabulary & Listening Drills', text: 'Regular drills covering topic-specific vocabulary, spelling checks, and listening section tips.' },
      { label: 'Cambridge IELTS Test Debriefs', text: 'Discussing reading passage logic, True/False/Not Given questions, and official scoring band descriptors.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels and groups are ideal for daily vocabulary drills, Cambridge test score breakdowns, audio pronunciation tips, and connecting with global speaking partners.',
    },
    faqs: [
      { question: 'How do I find an IELTS speaking partner in these groups?', answer: 'Join an active IELTS group and post your current band score, target band (e.g. 7.5+), timezone, and available practice hours to connect with partners.' },
      { question: 'Can I get peer feedback on IELTS Writing Task 2 essays?', answer: 'Many discussion channels have dedicated writing threads where members review essay structure, task response, and grammar accuracy.' },
      { question: 'Are IELTS Telegram channels free to join?', answer: 'Yes. All listed IELTS communities are public and free to join via direct platform links.' },
      { question: 'How often are IELTS group invite links verified?', answer: 'Our validation system tests IELTS invite links on an ongoing basis to ensure they remain active and free of spam conversions.' },
    ],
  },
  toefl: {
    focusAreas: [
      { label: 'Integrated Speaking 45s/60s Drills', text: 'Practicing timed speaking responses summarizing campus situations and academic lecture excerpts.' },
      { label: 'Academic Listening Note-Taking', text: 'Exchanging note-taking strategies for multi-minute professor lectures and conversational audio clips.' },
      { label: 'Writing for an Academic Discussion', text: 'Peer review for the new TOEFL Writing for an Academic Discussion task focusing on concise, relevant arguments.' },
      { label: 'Reading Passage Logic & Vocabulary', text: 'Breaking down rhetorical purpose, factual information, and sentence insertion questions.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels provide regular listening lecture excerpts, speaking prompt timers, and vocabulary drills convenient for mobile review.',
    },
    faqs: [
      { question: 'How can TOEFL study groups improve speaking scores?', answer: 'Groups enable timed speaking drills that simulate the 45-second and 60-second test response windows and help build delivery fluency.' },
      { question: 'How do I find a TOEFL study partner?', answer: 'Post in active TOEFL channels with your test date, current English level, and desired speaking/writing practice schedule.' },
      { question: 'Are these TOEFL communities safe to use?', answer: 'Public groups are suitable for study practice. Avoid sharing personal information and do not purchase unauthorized test materials.' },
      { question: 'How are TOEFL study group links maintained?', answer: 'We automatically check invite URLs to confirm that channels remain publicly reachable and focused on TOEFL prep.' },
    ],
  },
  usmle: {
    focusAreas: [
      { label: 'Multi-Step Clinical Vignette Analysis', text: 'Dissecting patient presentation details, lab findings, and high-yield diagnostic algorithms.' },
      { label: 'High-Yield Pathology & Pharmacology', text: 'Collaborative review of First Aid concepts, mechanism of action charts, and adverse effect profiles.' },
      { label: 'Step 1 & Step 2 CK Question Strategies', text: 'Reviewing question-bank thought processes, eliminating distractor options, and managing pacing.' },
      { label: 'Ethical & Medical Board Compliance', text: 'Strict adherence to academic integrity and medical licensing examination non-disclosure rules.' },
    ],
    platformNote: {
      telegramNote: 'Telegram groups offer high-yield medical question polls, clinical vignette summaries, and dedicated partner matching for Step 1 and Step 2 CK.',
    },
    faqs: [
      { question: 'How do USMLE study groups approach clinical question discussions?', answer: 'Members break down anonymized case concepts, review physiological mechanisms, and discuss the clinical reasoning behind correct answers.' },
      { question: 'How can I find a USMLE study partner for my eligibility period?', answer: 'Post in active USMLE groups with your target Step (Step 1 or Step 2 CK), dedicated study phase, and preferred daily discussion time.' },
      { question: 'Are USMLE study groups safe and compliant with board policies?', answer: 'Public groups are appropriate for discussing medical concepts and study methods. We strictly exclude channels that share recalled exam questions.' },
      { question: 'How often are USMLE community links tested?', answer: 'Our validation system tests USMLE links regularly to detect broken invites and maintain up-to-date directory listings.' },
    ],
  },
  nclex: {
    focusAreas: [
      { label: 'Next Gen NCLEX (NGN) Case Studies', text: 'Reviewing 6-question clinical judgment case studies focusing on recognize cues, analyze cues, and generate solutions.' },
      { label: 'Select All That Apply (SATA) Strategies', text: 'Practicing true/false conversion techniques for multiple-response and matrix question types.' },
      { label: 'Prioritization, Delegation & Safety', text: 'Applying ABCs, Maslow hierarchy, and nursing scope-of-practice principles to scenario questions.' },
      { label: 'Pharmacology Mnemonics & Nursing Interventions', text: 'Sharing memory aids for critical medication classifications, toxicity signs, and nursing assessments.' },
    ],
    platformNote: {
      telegramNote: 'Telegram study channels deliver daily Next Gen NCLEX (NGN) clinical judgment case questions, SATA elimination drills, and pharmacology mnemonics.',
    },
    faqs: [
      { question: 'How do NCLEX study groups help with Next Generation NCLEX (NGN) questions?', answer: 'Groups review clinical judgment measurement models, discuss case study scoring rules, and practice multi-response questions together.' },
      { question: 'How can I connect with an NCLEX study partner?', answer: 'Introduce yourself in active nursing channels with your target test date and preferred study resources to coordinate daily reviews.' },
      { question: 'Are NCLEX Telegram study groups free?', answer: 'Yes. All listed NCLEX study communities are public and free to join via standard platform invite links.' },
      { question: 'How are NCLEX study group listings checked?', answer: 'Our automated system validates community invite links regularly to ensure they remain accessible and compliant with safety guidelines.' },
    ],
  },
  lsat: {
    focusAreas: [
      { label: 'Logical Reasoning Premise-Conclusion Mapping', text: 'Dissecting argument structures, identifying unstated assumptions, and recognizing formal logical flaws.' },
      { label: 'Reading Comprehension Passage Structure', text: 'Tracking author viewpoint, passage tone, competing theories, and comparative passage relationships.' },
      { label: 'Timed 35-Minute Section Strategy', text: 'Managing section pacing, question flagging strategies, and eliminating attractive wrong answers.' },
      { label: 'Law School Admissions Debriefs', text: 'Peer accountability on study schedules, blind review methods, and test-day mental readiness.' },
    ],
    platformNote: {
      dualTelegramNote: 'Best for daily logical flaw identification drills, reading passage discussions, and law school admission updates.',
      dualDiscordNote: 'Best for timed 35-minute section practice rooms, blind review study groups, and voice discussions.',
    },
    faqs: [
      { question: 'How do LSAT study groups help with Logical Reasoning?', answer: 'Members explain the formal logic behind difficult flaw, strengthen/weaken, and necessary assumption questions during blind review sessions.' },
      { question: 'Can I find an LSAT study partner for timed section reviews?', answer: 'Yes. Applicants frequently pair up on Discord and Telegram to complete timed 35-minute sections followed by question-by-question analysis.' },
      { question: 'Are LSAT study communities free to join?', answer: 'All listed LSAT study groups are public and free to join using the provided invite links.' },
      { question: 'How often are LSAT group links verified?', answer: 'We regularly test invite URLs to confirm that LSAT communities remain active and publicly reachable.' },
    ],
  },
  cfa: {
    focusAreas: [
      { label: 'Financial Statement Analysis & Adjustments', text: 'Working through revenue recognition rules, lease accounting, pension obligations, and intercorporate investments.' },
      { label: 'Fixed Income & Equity Valuation Models', text: 'Practicing duration/convexity calculations, yield curve analysis, and discounted cash flow modeling.' },
      { label: 'Ethics & Professional Standards', text: 'Reviewing CFA Institute Code of Ethics and Standards of Professional Conduct case scenarios.' },
      { label: 'Level-Specific Revision Check-ins', text: 'Structured study check-ins aligning preparation milestones with upcoming exam windows.' },
    ],
    platformNote: {
      telegramNote: 'Telegram study groups offer topic-by-topic discussions for Financial Statement Analysis, formula sheets, and study check-ins for upcoming exam windows.',
    },
    faqs: [
      { question: 'How do CFA study groups approach Ethics case studies?', answer: 'Candidates discuss nuanced ethical dilemmas and practice applying CFA Institute Code and Standards to practical business scenarios.' },
      { question: 'How can I find a CFA study partner for my exam level?', answer: 'Post in active CFA channels with your exam Level (I, II, or III), exam window (e.g. May or November), and target study topics.' },
      { question: 'Are CFA study channels compliant with institute policies?', answer: 'Public groups provide peer support and syllabus discussions. Channels that share recalled questions or unauthorized mocks are strictly excluded.' },
      { question: 'How are CFA community links verified?', answer: 'Our validation pipeline tests CFA community invite links on an ongoing basis to ensure they remain active and accessible.' },
    ],
  },
  cpa: {
    focusAreas: [
      { label: 'FAR Financial Accounting Standards', text: 'Deep dives into GAAP vs IFRS differences, consolidation accounting, government accounting, and leases.' },
      { label: 'REG Taxation & Business Law', text: 'Reviewing individual and corporate tax provisions, basis calculations, and circular 230 ethical rules.' },
      { label: 'AUD Assertions & Audit Procedures', text: 'Evaluating internal control frameworks, audit evidence, reporting modifications, and PCAOB standards.' },
      { label: 'Task-Based Simulation (TBS) Strategy', text: 'Collaborative review of multi-tab simulations, research questions, and financial statement reconciliations.' },
    ],
    platformNote: {
      telegramNote: 'Telegram communities share CPA evolution syllabus updates, FAR/REG simulation strategies, and peer study accountability check-ins.',
    },
    faqs: [
      { question: 'How do CPA study groups help with Task-Based Simulations (TBS)?', answer: 'Members share strategies for navigating multi-tab exhibits, calculating reconciling entries, and researching authoritative literature.' },
      { question: 'How can I find a study partner for specific CPA sections?', answer: 'Post in CPA study channels with the specific section you are currently taking (FAR, AUD, REG, or Discipline) and your test window.' },
      { question: 'Are CPA study communities free to join?', answer: 'Yes. All listed CPA communities are public and free to join via standard platform invite links.' },
      { question: 'How often are CPA group links checked?', answer: 'Our automated validation suite regularly verifies invite links to ensure listed CPA groups remain active and available.' },
    ],
  },
  cissp: {
    focusAreas: [
      { label: '8 Security Domains Integration', text: 'Connecting concepts across Security and Risk Management, Asset Security, Security Architecture, and Software Development Security.' },
      { label: 'Manager-Mindset Decision Making', text: 'Practicing the "think like a manager" perspective focusing on governance, risk mitigation, and business impact over purely technical fixes.' },
      { label: 'Scenario-Based Question Analysis', text: 'Dissecting multi-sentence scenario questions to identify the root business requirement and primary security objective.' },
      { label: 'Adaptive Exam (CAT) Preparation Pacing', text: 'Sharing study schedules and strategies for managing the Computerized Adaptive Testing format.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels share 8-domain concept summaries, manager-mindset question breakdowns, and (ISC)² exam tips.',
    },
    faqs: [
      { question: 'How do CISSP study groups develop the manager decision-making mindset?', answer: 'Members analyze complex scenario questions to identify governance and risk priorities rather than choosing immediate technical workarounds.' },
      { question: 'How can I find a CISSP study partner for domain review?', answer: 'Join active CISSP discussion groups and coordinate with peers reviewing the same (ISC)² Common Body of Knowledge domains.' },
      { question: 'Are CISSP study groups compliant with (ISC)² policies?', answer: 'Public groups are meant for studying the Common Body of Knowledge. Channels advertising actual exam dumps or recalled questions are strictly rejected.' },
      { question: 'How are CISSP community listings verified?', answer: 'We automatically test invite URLs to confirm that listed CISSP study groups remain active and focused on legitimate certification prep.' },
    ],
  },
};
