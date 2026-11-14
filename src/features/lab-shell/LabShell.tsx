import type { ReactNode } from 'react';
import { MeasurementDisplay, Panel } from '@/design-system';
import { t } from '@/i18n';
import type { ModuleSummary } from '@/modules/types';
import { LAB_REGIONS, type LabRegion } from './regions';

/** Grid placement at ≥ 1024 px. Below that the regions stack in reading order. */
const SPAN: Record<LabRegion, string> = {
  theory: 'lg:col-span-1',
  workspace: 'lg:col-span-2',
  controls: 'lg:col-span-1',
  measurements: 'lg:col-span-2',
  instructions: 'lg:col-span-1',
  graphs: 'lg:col-span-2',
  assessment: 'lg:col-span-3',
};

export interface LabShellProps {
  readonly module: ModuleSummary;
  /**
   * Content for each region. Regions without content show a placeholder that
   * states which milestone fills them. Milestone 4 onward supplies content.
   */
  readonly regions?: Partial<Record<LabRegion, ReactNode>>;
}

function Placeholder({
  region,
  milestone,
}: {
  readonly region: LabRegion;
  readonly milestone: number;
}) {
  return (
    <div className="space-y-2 text-sm">
      <p>{t(`region.${region}Hint`)}</p>
      <p className="text-navy-600">{t('region.placeholder', { m: milestone })}</p>
      {region === 'measurements' ? (
        <div className="max-w-xs">
          <MeasurementDisplay label={t('region.sampleMeasurement')} value={null} unit="" />
        </div>
      ) : null}
    </div>
  );
}

/**
 * The standard laboratory layout. Every module page renders this, so the
 * layout is identical across the ten laboratories (master instruction §6).
 */
export function LabShell({ module, regions = {} }: LabShellProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" data-testid="lab-shell">
      {LAB_REGIONS.map((region) => (
        <div key={region} className={SPAN[region]} data-region={region}>
          <Panel
            title={t(`region.${region}`)}
            tone={regions[region] ? 'plain' : 'info'}
            className="h-full"
          >
            {regions[region] ?? <Placeholder region={region} milestone={module.milestone} />}
          </Panel>
        </div>
      ))}
    </div>
  );
}
