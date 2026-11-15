/** Constants shared by laboratory components. */
export const selectClass =
  'mt-1 block min-h-touch w-full rounded-md border border-navy-200 bg-white px-2 text-navy-900 disabled:opacity-60';

/** Standard playback choices for real-time machine laboratories (label is a language key). */
export const REAL_TIME_PLAYBACK = [
  { value: 1, label: 'run.realTime' },
  { value: 0.5, label: 'run.half' },
  { value: 0.1, label: 'run.tenth' },
] as const;
