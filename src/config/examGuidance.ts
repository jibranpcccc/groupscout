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
      { label: 'Digital SAT Desmos Shortcuts', text: 'When studying for the math module, look for groups practicing built-in Desmos graphing calculator functions and speed shortcuts.' },
      { label: 'Reading & Writing Logic', text: 'Focus revision on text structure, logical transitions, cross-text connections, and standard English grammar conventions.' },
      { label: 'Bluebook Practice Debriefs', text: 'Prioritize reviewing official College Board Bluebook adaptive mock tests to identify pacing gaps across modules.' },
      { label: 'Peer Study Accountability', text: 'Establish regular check-ins and shared practice milestones to maintain consistent progress before test day.' },
    ],
    platformNote: {
      dualTelegramNote: 'Telegram channels are useful for mobile practice polls, quick grammar revision questions, and test date updates.',
      dualDiscordNote: 'Discord servers offer voice study rooms, screen-sharing for problem walkthroughs, and timed mock test sessions.',
    },
    faqs: [
      { question: 'How can an SAT study group help with the Digital SAT?', answer: 'Joining a peer group allows you to discuss Desmos calculator methods, review official Bluebook practice questions, and compare pacing strategies for adaptive modules.' },
      { question: 'How do I find a compatible SAT study partner?', answer: 'Look for peers taking the same test date and time zone, and establish shared weekly practice targets for math and reading/writing.' },
      { question: 'What safety practices should I follow in SAT groups?', answer: 'Participate in peer discussions but never share personal account credentials or engage with services offering questionable test advantages.' },
      { question: 'Does StudyGroupsHub charge to access SAT group links?', answer: 'Browsing and accessing public Digital SAT study group links on StudyGroupsHub is completely free.' },
    ],
  },
  gre: {
    focusAreas: [
      { label: 'Vocabulary & Context Clues', text: 'Focus on high-frequency academic roots, context clues, and secondary meanings for Text Completion and Sentence Equivalence.' },
      { label: 'Quantitative Comparison Shortcuts', text: 'Practice dissecting QC problems using number properties, estimation, and algebraic simplification.' },
      { label: 'Reading Comprehension Arguments', text: 'Analyze assumption, strengthen/weaken, and inference questions in dense academic passages.' },
      { label: 'Analytical Writing Outlines', text: 'Brainstorm structured outlines and compelling real-world examples for the Issue task.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels and groups are well-suited for mobile vocabulary review, math problem discussions, and finding study partners.',
    },
    faqs: [
      { question: 'How should I use study groups for GRE vocabulary preparation?', answer: 'Look for communities where members discuss word roots, nuance differences between synonyms, and contextual usage in practice questions.' },
      { question: 'How do I find a GRE quantitative study partner?', answer: 'Post your target test date and preferred focus topics (e.g. data interpretation or probability) in active groups to coordinate joint problem sets.' },
      { question: 'Does StudyGroupsHub charge for accessing GRE communities?', answer: 'StudyGroupsHub never charges fees to explore or join listed GRE Telegram channels.' },
      { question: 'How are GRE community links validated?', answer: 'We run regular automated checks on public invite links to verify accessibility and remove dead or redirected URLs.' },
    ],
  },
  gmat: {
    focusAreas: [
      { label: 'Data Insights Problem Solving', text: 'Emphasize collaborative practice on Multi-Source Reasoning, Table Analysis, and Two-Part Analysis question formats.' },
      { label: 'Data Sufficiency Logic', text: 'Dissect statements independently to recognize value versus yes/no sufficiency patterns without over-calculating.' },
      { label: 'Critical Reasoning Dissection', text: 'Identify argument conclusions, underlying assumptions, and logical fallacies under strict timed conditions.' },
      { label: 'B-School Prep Check-ins', text: 'Maintain structured study schedules and section pacing tailored to the GMAT Focus Edition.' },
    ],
    platformNote: {
      dualTelegramNote: 'Telegram groups offer quick mobile access to practice questions, formula notes, and admissions discussions.',
      dualDiscordNote: 'Discord servers offer organized subject channels, voice study rooms, and timed sprint sessions.',
    },
    faqs: [
      { question: 'How can peer groups help with the GMAT Focus Edition?', answer: 'Connecting with fellow applicants helps you compare Data Insights approaches, refine Data Sufficiency logic, and benchmark sectional pacing.' },
      { question: 'How do I find a business school prep partner?', answer: 'Share your target score, application round, and weekly study schedule in active communities to coordinate mock review sessions.' },
      { question: 'What should I look for when choosing a GMAT group?', answer: 'Choose communities focused on official practice questions and conceptual reasoning, and avoid groups that promote unauthorized material.' },
      { question: 'Are public GMAT community links free to open on StudyGroupsHub?', answer: 'All public GMAT Focus Edition community invite links on StudyGroupsHub can be opened without cost or subscription.' },
    ],
  },
  jee: {
    focusAreas: [
      { label: 'Advanced Physics & Mechanics', text: 'Prioritize multi-concept problem solving in rotational motion, electrodynamics, and modern physics.' },
      { label: 'Organic Chemistry Synthesis', text: 'Focus on reaction mechanisms, named organic conversions, and reagent specificity.' },
      { label: 'Past Year Question (PYQ) Solutions', text: 'Review step-by-step solutions and speed shortcuts for JEE Main and Advanced past papers.' },
      { label: 'Mock Test Score Analysis', text: 'Analyze full-length mock exam errors, identify negative marking patterns, and build test-taking stamina.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels are commonly used for sharing formula sheets, PYQ walkthroughs, and daily physics/chemistry problem discussions.',
    },
    faqs: [
      { question: 'How can JEE study groups assist with Main and Advanced prep?', answer: 'Groups can offer peer explanations for challenging PYQs, different problem-solving perspectives, and shared revision notes for Physics, Chemistry, and Math.' },
      { question: 'How do I find serious JEE study partners?', answer: 'Engage in discussion threads by sharing your daily question targets and coordinating timed problem-solving blocks with peers.' },
      { question: 'Does StudyGroupsHub charge to access JEE group links?', answer: 'You can explore and join public JEE Main and Advanced study channels on StudyGroupsHub with zero directory fees.' },
      { question: 'How does StudyGroupsHub check JEE community listings?', answer: 'Our validation pipeline regularly checks public invite URLs to confirm link validity and screens for academic integrity standards.' },
    ],
  },
  neet: {
    focusAreas: [
      { label: 'NCERT Line-by-Line Biology', text: 'Focus on thorough review of NCERT textbook diagrams, summary boxes, and high-yield biological facts.' },
      { label: 'Physics Numerical Problem Solving', text: 'Practice direct formula application, unit conversions, and calculation shortcuts for NEET Physics.' },
      { label: 'Chemistry Reaction Mechanisms', text: 'Master Physical Chemistry formulas, Inorganic NCERT trends, and Organic reaction pathways.' },
      { label: 'Full-Length Mock Debriefs', text: 'Analyze 720-mark mock test errors, question selection choices, and timing across all three subjects.' },
    ],
    platformNote: {
      dualTelegramNote: 'Telegram is convenient for daily NCERT Biology chapter polls, high-yield diagram notes, and quick doubt discussions.',
      dualDiscordNote: 'Discord provides peer voice rooms, screen-sharing for Physics/Chemistry problems, and structured study sessions.',
    },
    faqs: [
      { question: 'What should I look for in a NEET study group for NCERT revision?', answer: 'When evaluating a NEET study group, look for chapter-wise discussion, NCERT revision, and useful peer problem solving.' },
      { question: 'How can I find a dedicated NEET study partner?', answer: 'Post your daily question goals (e.g. 100 MCQs per day) and study hours in active groups to connect with an accountability partner.' },
      { question: 'What safety rules should I keep in mind for NEET channels?', answer: 'Focus on peer doubt solving and conceptual review. Channels exhibiting evidence of leaked test papers or illicit answer keys are permanently excluded.' },
      { question: 'Does StudyGroupsHub charge fees to access NEET links?', answer: 'StudyGroupsHub provides free access to public NEET Biology, Physics, and Chemistry community links without paywalls.' },
    ],
  },
  gate: {
    focusAreas: [
      { label: 'Core Technical Engineering Concepts', text: 'Focus on branch-specific syllabus blueprints across CS, ECE, EE, ME, and Civil Engineering.' },
      { label: 'Engineering Mathematics & Aptitude', text: 'Practice step-by-step solutions for Linear Algebra, Calculus, Differential Equations, and Probability.' },
      { label: 'Virtual Calculator Pacing', text: 'Build speed and precision using virtual calculator constraints for Numerical Answer Type (NAT) questions.' },
      { label: 'PYQ Subject-Wise Analysis', text: 'Analyze multi-year past GATE questions to identify core conceptual patterns and edge cases.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels are widely used for sharing technical formula sheets, subject notes, and past GATE question solutions.',
    },
    faqs: [
      { question: 'How can engineering candidates benefit from GATE study groups?', answer: 'Joining branch-specific groups allows you to discuss complex NAT problem solutions, exchange formula summaries, and clarify engineering concepts.' },
      { question: 'How do I connect with a study partner in my engineering branch?', answer: 'Participate in branch-specific discussion threads and post your subject study plan to find peers targeting the same exam cycle.' },
      { question: 'Does StudyGroupsHub charge to access GATE group links?', answer: 'Accessing public GATE engineering study groups through StudyGroupsHub is completely free for all branches.' },
      { question: 'How are GATE group invite links checked?', answer: 'Our validation suite periodically verifies invite links to detect inactive URLs and maintain directory quality.' },
    ],
  },
  upsc: {
    focusAreas: [
      { label: 'GS Papers I–IV Conceptual Clarity', text: 'Emphasize structured understanding across Polity, History, Geography, Economy, Environment, and Ethics.' },
      { label: 'Daily Editorial & Current Affairs', text: 'Analyze national newspaper editorials and summarize key policy developments for Mains and Prelims.' },
      { label: 'Mains Answer Writing Peer Review', text: 'Practice structured answers with concise introductions, relevant diagrams, and balanced conclusions.' },
      { label: 'Prelims CSAT & MCQ Strategy', text: 'Refine elimination techniques for General Studies MCQs and practice CSAT analytical reasoning.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels are commonly used for editorial summaries, syllabus notes, and Mains answer writing discussions.',
    },
    faqs: [
      { question: 'How can peer groups assist with UPSC Mains answer writing?', answer: 'Look for communities where aspirants exchange answer structures, critique presentation frameworks, and discuss model points on syllabus topics.' },
      { question: 'How do I find a serious UPSC study accountability partner?', answer: 'Introduce yourself in active discussion channels with your optional subject, target attempt year, and daily study commitments.' },
      { question: 'What precautions should I take in public UPSC groups?', answer: 'Use groups for peer study and schedule accountability, and avoid engaging with commercial promotional spam or unverified claims.' },
      { question: 'Does StudyGroupsHub charge for accessing UPSC group links?', answer: 'There are no charges to discover and connect with public UPSC CSE study channels on StudyGroupsHub.' },
    ],
  },
  ielts: {
    focusAreas: [
      { label: 'Speaking Partner Practice', text: 'Pair with peer candidates for live voice practice covering Part 1 interview, Part 2 cue cards, and Part 3 discussion questions.' },
      { label: 'Academic Writing Task Review', text: 'Evaluate Task 1 report structure and Task 2 essay arguments against Lexical Resource and Cohesion descriptors.' },
      { label: 'Daily Vocabulary & Listening Drills', text: 'Review topic-specific academic vocabulary, spelling precision, and listening section strategies.' },
      { label: 'Cambridge Practice Test Debriefs', text: 'Discuss reading passage logic, True/False/Not Given distinctions, and official scoring band criteria.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels and groups are well-suited for vocabulary practice, pronunciation tips, and connecting with international speaking partners.',
    },
    faqs: [
      { question: 'How can I find an IELTS speaking practice partner?', answer: 'Post in active discussion groups with your target band score, current level, time zone, and preferred practice schedule to connect with peers.' },
      { question: 'Can I get useful feedback on IELTS Writing Task 2 essays in study groups?', answer: 'If writing feedback matters to you, check whether the community has active Task 1 or Task 2 discussion threads before joining.' },
      { question: 'Does StudyGroupsHub charge to access IELTS study groups?', answer: 'Finding speaking partners and opening public IELTS preparation channels on StudyGroupsHub involves no fees.' },
      { question: 'How often are IELTS community links checked?', answer: 'We regularly test invite links through our automated verification pipeline to detect and remove broken or expired links.' },
    ],
  },
  toefl: {
    focusAreas: [
      { label: 'Integrated Speaking Timed Drills', text: 'Practice timed speaking responses synthesizing campus situations and academic lecture excerpts.' },
      { label: 'Academic Listening Note-Taking', text: 'Refine structured note-taking methods for multi-minute professor lectures and campus conversations.' },
      { label: 'Writing for an Academic Discussion', text: 'Focus peer review on the TOEFL Academic Discussion task, emphasizing clear reasoning and concise phrasing.' },
      { label: 'Reading Passage Logic & Vocabulary', text: 'Practice rhetorical purpose, factual information, and sentence insertion question types.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels offer convenient mobile access to listening audio clips, speaking timers, and academic vocabulary drills.',
    },
    faqs: [
      { question: 'How do study groups help with TOEFL speaking preparation?', answer: 'Peer groups allow you to practice structured speaking responses within the 45-second and 60-second test limits and receive peer feedback.' },
      { question: 'How do I find a TOEFL study partner?', answer: 'Share your test date, target score requirements, and daily practice availability in active TOEFL channels to connect with peers.' },
      { question: 'What safety guidelines apply to TOEFL study groups?', answer: 'Use groups for practice and strategy discussions. We reject or flag listings when public evidence indicates promotion of unauthorized test materials.' },
      { question: 'Does StudyGroupsHub charge for opening TOEFL group links?', answer: 'StudyGroupsHub offers open access to public TOEFL iBT study channels without registration or browsing fees.' },
    ],
  },
  usmle: {
    focusAreas: [
      { label: 'Multi-Step Clinical Vignette Analysis', text: 'Dissect patient presentation clues, laboratory findings, and high-yield diagnostic algorithms.' },
      { label: 'High-Yield Pathology & Pharmacology', text: 'Review core medical concepts, mechanisms of action, and drug adverse effect profiles.' },
      { label: 'Step 1 & Step 2 CK Question Strategies', text: 'Refine question-bank thought processes, distractor elimination, and block pacing.' },
      { label: 'Medical Board Policy Adherence', text: 'Maintain strict compliance with academic integrity and medical licensing examination guidelines.' },
    ],
    platformNote: {
      telegramNote: 'Telegram groups offer high-yield medical question polls, clinical vignette reviews, and partner matching for Step 1 and Step 2 CK.',
    },
    faqs: [
      { question: 'How can medical students best utilize USMLE study groups?', answer: 'Use peer groups to discuss underlying physiological mechanisms, clinical reasoning pathways, and study scheduling methods.' },
      { question: 'How do I find a USMLE study partner for my dedicated prep period?', answer: 'Post in active groups with your target Step, dedicated study phase, and preferred daily discussion times to find a compatible partner.' },
      { question: 'How does StudyGroupsHub maintain compliance with exam integrity policies?', answer: 'We strictly reject or remove any medical prep channels where public evidence shows sharing of recalled USMLE Step questions or board violations.' },
      { question: 'Does StudyGroupsHub charge for access to USMLE links?', answer: 'Opening verified public USMLE Step 1 and Step 2 CK community links on StudyGroupsHub is completely free of charge.' },
    ],
  },
  nclex: {
    focusAreas: [
      { label: 'Next Gen NCLEX (NGN) Case Studies', text: 'Focus on 6-question clinical judgment case studies: recognizing cues, analyzing cues, and prioritizing hypotheses.' },
      { label: 'Select All That Apply (SATA) Strategies', text: 'Practice systematic true/false evaluation for multiple-response and matrix question types.' },
      { label: 'Prioritization, Delegation & Safety', text: 'Apply ABCs, Maslow hierarchy, and nursing scope-of-practice principles to clinical scenarios.' },
      { label: 'Pharmacology Mnemonics & Nursing Interventions', text: 'Review high-alert medication classifications, toxicity signs, and key nursing assessments.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels are commonly used for clinical case reviews, SATA question practice, and pharmacology mnemonics on mobile.',
    },
    faqs: [
      { question: 'How do study groups help with Next Generation NCLEX (NGN) prep?', answer: 'Studying in a group helps you discuss clinical judgment case studies, compare question analysis frameworks, and practice SATA questions.' },
      { question: 'How can I connect with an NCLEX study partner?', answer: 'Introduce yourself in active nursing channels with your target exam window and preferred study resources to coordinate joint review.' },
      { question: 'Does StudyGroupsHub charge to access NCLEX study groups?', answer: 'Nursing candidates can freely access all public NCLEX-RN and PN group links listed on StudyGroupsHub.' },
      { question: 'How are NCLEX study group listings validated?', answer: 'Our automated validation system tests invite links regularly to confirm link availability and filter out non-functional URLs.' },
    ],
  },
  lsat: {
    focusAreas: [
      { label: 'Logical Reasoning Premise-Conclusion Mapping', text: 'Dissect argument structures, identify implicit assumptions, and classify common logical flaws.' },
      { label: 'Reading Comprehension Passage Structure', text: 'Track author perspective, passage structure, competing viewpoints, and comparative text relationships.' },
      { label: 'Timed 35-Minute Section Strategy', text: 'Refine sectional pacing, question flagging approaches, and elimination of attractive wrong answers.' },
      { label: 'Blind Review Accountability', text: 'Maintain disciplined study schedules and thorough blind review routines before test day.' },
    ],
    platformNote: {
      dualTelegramNote: 'Telegram groups offer quick mobile access to logical flaw drills, passage discussions, and admissions updates.',
      dualDiscordNote: 'Discord servers provide timed section practice rooms, blind review study groups, and voice discussion channels.',
    },
    faqs: [
      { question: 'How can LSAT study groups support Logical Reasoning preparation?', answer: 'Reviewing difficult flaw, strengthen/weaken, and assumption questions with peers helps you articulate the underlying formal logic during blind review.' },
      { question: 'How do I find a partner for timed LSAT section practice?', answer: 'Look for applicants targeting the same test date and coordinate timed 35-minute sections followed by question-by-question analysis.' },
      { question: 'Does StudyGroupsHub charge for accessing LSAT group links?', answer: 'There are zero platform charges to access public LSAT Logical Reasoning and Reading Comp study group links on StudyGroupsHub.' },
      { question: 'How does StudyGroupsHub check LSAT community listings?', answer: 'We regularly test invite links to verify that listed LSAT communities remain active and accessible.' },
    ],
  },
  cfa: {
    focusAreas: [
      { label: 'Financial Statement Analysis & Adjustments', text: 'Focus on revenue recognition principles, lease accounting, pension obligations, and intercorporate investments.' },
      { label: 'Fixed Income & Equity Valuation Models', text: 'Practice duration/convexity calculations, yield curve analysis, and cash flow valuation models.' },
      { label: 'Ethics & Professional Standards', text: 'Review CFA Institute Code of Ethics and Standards of Professional Conduct case scenarios thoroughly.' },
      { label: 'Level-Specific Revision Milestones', text: 'Structure study plans aligning topic weighting with upcoming exam windows.' },
    ],
    platformNote: {
      telegramNote: 'Telegram study groups provide convenient access to topic-by-topic discussions, formula sheets, and study schedule check-ins.',
    },
    faqs: [
      { question: 'How should candidates use study groups for CFA Ethics review?', answer: 'Discussing practical case scenarios with peers helps clarify the application of the CFA Institute Code and Standards in complex business situations.' },
      { question: 'How do I find a CFA study partner for my exam level?', answer: 'Post in active CFA channels with your exam level (I, II, or III), target exam window, and current study topic to find peers.' },
      { question: 'What integrity standards apply to CFA study channels?', answer: 'CFA study channels must focus on syllabus concepts and ethics; listings with evidence of sharing live exam questions or unauthorized mocks are promptly excluded.' },
      { question: 'Does StudyGroupsHub charge fees to access CFA group links?', answer: 'StudyGroupsHub provides open, free access to public CFA Level I, II, and III study group invite links.' },
    ],
  },
  cpa: {
    focusAreas: [
      { label: 'FAR Financial Accounting Standards', text: 'Prioritize GAAP vs IFRS differences, consolidation accounting, government accounting, and lease standards.' },
      { label: 'REG Taxation & Business Law', text: 'Review individual and corporate tax provisions, property basis calculations, and professional conduct rules.' },
      { label: 'AUD Assertions & Audit Procedures', text: 'Master internal control frameworks, audit evidence standards, report modifications, and PCAOB guidelines.' },
      { label: 'Task-Based Simulation (TBS) Strategy', text: 'Practice multi-tab document review, authoritative literature research, and journal entry reconciliations.' },
    ],
    platformNote: {
      telegramNote: 'Telegram communities are useful for CPA Evolution syllabus updates, simulation discussions, and study schedule check-ins.',
    },
    faqs: [
      { question: 'How can peer groups help with CPA Task-Based Simulations (TBS)?', answer: 'Discussing simulation approaches with fellow candidates helps you navigate multi-tab exhibits, calculate reconciling entries, and practice research techniques.' },
      { question: 'How do I find a study partner for specific CPA exam sections?', answer: 'Share the specific section you are currently studying (FAR, AUD, REG, or Discipline) and your target test window in active study channels.' },
      { question: 'Does StudyGroupsHub charge to open CPA group links?', answer: 'Candidates can browse and open public CPA FAR, AUD, REG, and Discipline group links on StudyGroupsHub at no cost.' },
      { question: 'How are CPA group invite links checked?', answer: 'Our automated validation suite regularly verifies invite links to ensure listed CPA groups remain active and reachable.' },
    ],
  },
  cissp: {
    focusAreas: [
      { label: '8 Security Domains Integration', text: 'Connect concepts across Security and Risk Management, Asset Security, Security Architecture, and Software Development Security.' },
      { label: 'Manager-Mindset Decision Making', text: 'Practice evaluating governance, risk management, and business impact rather than purely technical fixes.' },
      { label: 'Scenario-Based Question Analysis', text: 'Dissect scenario questions to isolate the core business requirement and primary security objective.' },
      { label: 'Adaptive Exam (CAT) Preparation Pacing', text: 'Structure study schedules and time management strategies for the Computerized Adaptive Testing format.' },
    ],
    platformNote: {
      telegramNote: 'Telegram channels are convenient for reviewing 8-domain concept summaries, manager-mindset question breakdowns, and certification tips.',
    },
    faqs: [
      { question: 'How do study groups help develop the CISSP manager mindset?', answer: 'Analyzing complex scenario questions with peers helps you prioritize risk mitigation and business alignment over technical workarounds.' },
      { question: 'How can I find a CISSP study partner for domain review?', answer: 'Join active discussion groups and connect with professionals reviewing the same (ISC)² Common Body of Knowledge domains.' },
      { question: 'What safety policies apply to CISSP study communities?', answer: 'In compliance with (ISC)² standards, any cybersecurity group showing public evidence of braindumps or leaked exam items is immediately removed from the directory.' },
      { question: 'Does StudyGroupsHub charge to access CISSP community links?', answer: 'Accessing public (ISC)² CISSP certification study channels on StudyGroupsHub requires no payment or subscription.' },
    ],
  },
};
