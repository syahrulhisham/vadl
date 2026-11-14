/**
 * English interface text (decision D5: English first; all text held in language
 * files so Malay can be added as `ms.ts` without code changes).
 */
export const en = {
  'app.name': 'Virtual Actuator and Drives Laboratory',
  'app.shortName': 'VADL',
  'app.course': 'BELK 3423 Actuator and Drives',
  'app.badge': 'Design by Syahrul Hisham™',
  'home.heading': 'Laboratory modules',
  'home.intro':
    'Interactive laboratories for investigating actuator and drive systems. Every value shown is computed from documented engineering equations.',
  'home.notice':
    'Development build (Milestone 1): project structure only. Laboratories become available milestone by milestone.',
  'home.disclaimer':
    'VADL is a simplified educational model. It does not replace physical laboratory work or industrial-grade simulation tools.',
  'module.number': 'Module {n}',
  'module.status.planned': 'Planned · Milestone {m}',
  'module.status.in-development': 'In development',
  'module.status.available': 'Available',
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
} as const;

export type MessageKey = keyof typeof en;
