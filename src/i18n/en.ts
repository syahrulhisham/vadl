/**
 * English interface text (decision D5: English first; all text held in language
 * files so Malay can be added as `ms.ts` without code changes).
 */
export const en = {
  // Application
  'app.name': 'Virtual Actuator and Drives Laboratory',
  'app.shortName': 'VADL',
  'app.course': 'BELK 3423 Actuator and Drives',
  'app.badge': 'Design by Syahrul Hisham™',
  'app.skipToContent': 'Skip to main content',
  'app.disclaimer':
    'VADL is a simplified educational model. It does not replace physical laboratory work or industrial-grade simulation tools.',
  'app.privacy': 'Your data stays in this browser. Nothing is sent to a server.',
  'app.loading': 'Loading…',

  // Navigation
  'nav.label': 'Main navigation',
  'nav.menu': 'Menu',
  'nav.closeMenu': 'Close menu',
  'nav.welcome': 'Welcome',
  'nav.overview': 'Laboratory overview',
  'nav.modules': 'Laboratory modules',
  'nav.resources': 'Learning resources',
  'nav.activities': 'Experiment activities',
  'nav.assessment': 'Assessment centre',
  'nav.progress': 'Student progress',
  'nav.reports': 'Laboratory reports',

  // Welcome
  'welcome.title': 'Virtual Actuator and Drives Laboratory',
  'welcome.intro':
    'Interactive laboratories for investigating actuator and drive systems. Every value shown is computed from documented engineering equations.',
  'welcome.start': 'Browse the laboratories',
  'welcome.overview': 'Read the laboratory overview',
  'welcome.howTitle': 'How each laboratory works',
  'welcome.how1': 'Read the theory and the equations the simulation uses.',
  'welcome.how2': 'Set the operating parameters and run the simulation.',
  'welcome.how3': 'Record measurements and study the graphs.',
  'welcome.how4': 'Check your understanding and generate a laboratory report.',
  'welcome.statusTitle': 'Development status',
  'welcome.status':
    'Milestone 2: the dashboard, navigation and laboratory layout are in place. Laboratories become available milestone by milestone, starting with DC motor drives.',

  // Overview
  'overview.title': 'Laboratory overview',
  'overview.intro':
    'How the ten VADL laboratories relate to the BELK 3423 course: chapters, laboratory sessions and learning outcomes.',
  'overview.outcomesTitle': 'Course learning outcomes',
  'overview.outcomesProvisional':
    'Paraphrased from the 2026/2027 teaching plan. Provisional until confirmed by the lecturer.',
  'overview.lo1':
    'LO1 — Analyse the design of electrical and mechanical actuators and drives in motor-drive, pneumatic and hydraulic applications (C4).',
  'overview.lo2':
    'LO2 — Conduct experiments on DC and AC drives, pneumatic, hydraulic, electro-pneumatic and electrohydraulic systems (P4).',
  'overview.lo3':
    'LO3 — Present a group assignment on actuators and drives (A2). Not assessed in VADL.',
  'overview.mapTitle': 'Laboratories and course content',
  'overview.colModule': 'Laboratory',
  'overview.colCourse': 'Course chapter',
  'overview.colLab': 'Course laboratory',
  'overview.colMilestone': 'Built in',
  'overview.none': '—',
  'overview.milestone': 'Milestone {m}',
  'overview.modelTitle': 'About the simulations',
  'overview.model':
    'Each laboratory uses the simplest physical model that teaches its concept correctly, states its assumptions beside the simulation, and repeats them in the report.',

  // Modules list
  'modules.title': 'Laboratory modules',
  'modules.intro':
    'Ten laboratories, built one at a time. Each opens with the same seven-region layout.',
  'modules.listLabel': 'Laboratory modules',
  'modules.open': 'Open',

  // Module page
  'module.number': 'Module {n}',
  'module.status.planned': 'Planned · Milestone {m}',
  'module.status.in-development': 'In development',
  'module.status.available': 'Available',
  'module.backToList': 'All laboratory modules',
  'module.courseRef': 'Course reference: {ref}',
  'module.notFoundTitle': 'Laboratory not found',
  'module.notFound': 'There is no laboratory at this address.',

  // Seven regions (FR-02)
  'region.theory': 'Theory',
  'region.workspace': 'Simulation workspace',
  'region.controls': 'Parameter controls',
  'region.measurements': 'Measurements',
  'region.graphs': 'Graphs',
  'region.instructions': 'Experiment instructions',
  'region.assessment': 'Assessment',
  'region.placeholder': 'This region is filled when the laboratory is built in Milestone {m}.',
  'region.theoryHint':
    'Learning outcomes, theoretical background, equations and model assumptions.',
  'region.workspaceHint':
    'Interactive system diagram and animation, with start, pause, stop and reset.',
  'region.controlsHint': 'Operating parameters, each limited to a physically valid range.',
  'region.measurementsHint': 'Live values with units. A dash means no value has been produced yet.',
  'region.graphsHint': 'Time traces and characteristic curves with the operating point marked.',
  'region.instructionsHint': 'Step-by-step guided and independent experiments.',
  'region.assessmentHint': 'Questions with immediate feedback and explanations.',
  'region.sampleMeasurement': 'Example readout',

  // Other areas
  'resources.title': 'Learning resources',
  'resources.intro':
    'Theory summaries, equation sheets and symbol references for each laboratory. Added with each laboratory from Milestone 4.',
  'resources.symbolsTitle': 'Notation',
  'resources.symbols':
    'VADL uses the notation of the BELK 3423 lecture notes, for example Eg for back-emf, Kv·If for the machine constant and αa, αf for firing angles.',
  'activities.title': 'Experiment activities',
  'activities.intro':
    'Guided and independent experiments at beginner, intermediate and advanced levels. Added with each laboratory from Milestone 4.',
  'activities.levelsTitle': 'Learning levels',
  'activities.beginner': 'Beginner — identify components, terminology and operating principles.',
  'activities.intermediate':
    'Intermediate — operate simulations, change parameters, collect measurements and interpret graphs.',
  'activities.advanced':
    'Advanced — solve engineering problems, investigate behaviour and optimise operating parameters.',
  'assessment.title': 'Assessment centre',
  'assessment.intro':
    'Multiple-choice, calculation and troubleshooting questions with immediate feedback. First questions arrive with the DC motor laboratory in Milestone 4.',
  'assessment.purpose':
    'Scores are for self-study and formative feedback only. They are not official course marks.',
  'progress.title': 'Student progress',
  'progress.intro':
    'Activities completed, assessment scores and reports generated, per laboratory.',
  'progress.empty': 'No progress recorded yet. Progress appears once laboratories are available.',
  'reports.title': 'Laboratory reports',
  'reports.intro':
    'Reports are generated from the measurements you record and exported as PDF through the browser print dialog.',
  'reports.empty':
    'No reports yet. The first report template arrives with the DC motor laboratory in Milestone 4.',
  'reports.honesty':
    'Reports contain only values the simulation produced. VADL never invents results.',
  'notFound.title': 'Page not found',
  'notFound.body': 'The page you asked for does not exist.',
  'notFound.home': 'Go to the welcome page',
  comingIn: 'Coming in Milestone {m}',

  // Module titles and course references (docs/course-alignment.md §3)
  'module.m01.title': 'DC Motor Drives',
  'module.m02.title': 'AC Motor Drives',
  'module.m03.title': 'Power Converters',
  'module.m04.title': 'Stepper Motors',
  'module.m05.title': 'Servo Motors',
  'module.m06.title': 'Mechanical Transmission',
  'module.m07.title': 'Cam and Follower',
  'module.m08.title': 'Pneumatics',
  'module.m09.title': 'Electro-Pneumatics',
  'module.m10.title': 'Electrohydraulics',
  'module.m01.summary':
    'Separately excited, shunt and series motors; converter-fed drives; field and armature control.',
  'module.m02.summary':
    'Induction motor slip and torque; stator voltage, rotor resistance and frequency control.',
  'module.m03.summary': 'Controlled rectifiers, DC-DC choppers and inverters with their waveforms.',
  'module.m04.summary': 'Step angle, pulse rate, drive sequences and rotor position.',
  'module.m05.summary': 'Closed-loop position and speed control; encoders and resolvers.',
  'module.m06.summary':
    'Gear trains, belt and chain drives, pulley blocks; speed, torque and direction.',
  'module.m07.summary': 'Rise, dwell and return; displacement diagrams and follower types.',
  'module.m08.summary': 'Cylinders, directional control valves, logic valves and flow control.',
  'module.m09.summary': 'Push buttons, relays, solenoid valves, sensors and sequence circuits.',
  'module.m10.summary':
    'Pumps, relief valves, directional and flow control; hydraulic and electrohydraulic circuits.',
  'module.m01.chapter': 'Chapter 1, Parts I–III',
  'module.m02.chapter': 'Chapter 1, Part IV',
  'module.m03.chapter': 'Chapter 1, Part I',
  'module.m04.chapter': 'Chapter 2, Part I',
  'module.m05.chapter': 'Chapter 2, Part II',
  'module.m06.chapter': 'Chapter 3, Parts I–II',
  'module.m07.chapter': 'Chapter 3, Part I',
  'module.m08.chapter': 'Chapter 4, Parts I–II',
  'module.m09.chapter': 'Chapter 5',
  'module.m10.chapter': 'Chapter 6',
  'module.m01.lab': 'Lab 1 (converter-fed drives; see Power Converters)',
  'module.m03.lab': 'Lab 1 — Single-phase AC–DC converters',
  'module.m08.lab': 'Lab 2 — Pneumatics',
  'module.m09.lab': 'Lab 3 — Electro-pneumatics',
  'module.m10.lab': 'Labs 4 and 5 — Hydraulics and electrohydraulics',
} as const;

export type MessageKey = keyof typeof en;
