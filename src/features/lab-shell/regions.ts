/** The seven regions every laboratory presents (FR-02), in reading order. */
export const LAB_REGIONS = [
  'theory',
  'workspace',
  'controls',
  'measurements',
  'graphs',
  'instructions',
  'assessment',
] as const;

export type LabRegion = (typeof LAB_REGIONS)[number];
