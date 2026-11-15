/** The seven-region module layout (FR-02). */
export { LabShell, type LabShellProps } from './LabShell';
export { LAB_REGIONS, type LabRegion } from './regions';
export {
  ActivitiesList,
  OutcomesList,
  RecordPanel,
  RunControls,
  SelectField,
  TheoryBlock,
  type RunControlsProps,
} from './LabParts';
export { REAL_TIME_PLAYBACK, selectClass } from './labConstants';
export { useLabRecords } from './useLabRecords';
export type { ActivityContent, LabOutcome } from './labContent';
