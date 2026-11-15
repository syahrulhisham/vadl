import { useMemo, useState } from 'react';
import { Button, colors, LinkButton, MeasurementDisplay, NumberControl } from '@/design-system';
import { AssessmentPanel } from '@/features/assessment';
import {
  CharacteristicChart,
  ChartFigure,
  timeUnitFor,
  TimeTraceChart,
  toTimeRows,
  type SeriesSpec,
} from '@/features/graphs';
import {
  ActivitiesList,
  LabShell,
  OutcomesList,
  RecordPanel,
  RunControls,
  SelectField,
  TheoryBlock,
  useLabRecords,
} from '@/features/lab-shell';
import { useSimulation } from '@/hooks';
import { t } from '@/i18n';
import {
  converterCharacteristic,
  converterPeriod,
  converterPeriodTrace,
  converterStats,
  DCDC_KINDS,
  degToRad,
  INVERTER_KINDS,
  isControlled,
  PC_LIMITS,
  powerConverterModel,
  radToDeg,
  RECTIFIER_KINDS,
  type ConverterFamily,
  type DcDcKind,
  type InverterKind,
  type Issue,
  type PowerConverterParams,
  type RectifierKind,
} from '@/sim-core';
import { M03_ACTIVITIES, M03_LABELS as L, M03_OUTCOMES, M03_THEORY } from './content.en';
import { ConverterDiagram } from './ConverterDiagram';
import { M03_QUESTIONS } from './questions';
import { M03_RESULT_COLUMNS, numericParameters } from './results';

export const M03_ID = 'm03-power-converters';
const CYCLES = [
  { value: 0.5, label: L.playback.half },
  { value: 1, label: L.playback.one },
  { value: 5, label: L.playback.five },
];
const LAB1_SUPPLY = [120, 220, 240];
const LAB1_ALPHA = [0, 30, 60, 90, 120, 150, 180];
const V = colors.navy[700];
const V2 = colors.lightblue[400];

function seriesFor(p: PowerConverterParams) {
  const v: SeriesSpec[] = [];
  const i: SeriesSpec[] = [];
  const g: SeriesSpec[] = [{ key: 'gate', label: 'Gate', unit: '1 = on', color: V }];
  if (p.family === 'rectifier') {
    v.push(
      { key: 'vSupply', label: 'Supply vs', unit: 'V', color: V2 },
      { key: 'vOut', label: 'Output vo', unit: 'V', color: V },
    );
    i.push({ key: 'iOut', label: 'Load io', unit: 'A', color: V });
    if (p.rectifier !== 'three-phase-bridge-l')
      i.push({ key: 'iSupply', label: 'Supply is', unit: 'A', color: V2 });
  } else if (p.family === 'dcdc') {
    v.push(
      { key: 'vSupply', label: 'Input Vs', unit: 'V', color: V2 },
      { key: 'vOut', label: 'Output Vo', unit: 'V', color: V },
    );
    i.push({ key: 'iInductor', label: 'Inductor iL', unit: 'A', color: V });
  } else {
    v.push({
      key: 'vOut',
      label: p.inverter.startsWith('three') ? 'Line voltage vab' : 'Output vo',
      unit: 'V',
      color: V,
    });
    i.push({ key: 'iOut', label: 'Load io', unit: 'A', color: V });
    if (p.inverter !== 'single-square' && p.inverter !== 'three-six-step') {
      g.unshift(
        { key: 'carrier', label: 'Carrier', unit: 'pu', color: V2 },
        { key: 'reference', label: 'Reference', unit: 'pu', color: colors.navy[400] },
      );
    }
  }
  return { v, i, g };
}

/** M03 Power Converters laboratory: all seven regions (FR-02). */
export default function PowerConverterLab() {
  const sim = useSimulation(powerConverterModel, {
    timeScale: converterPeriod(powerConverterModel.defaults),
    recorderCapacity: 6000,
  });
  const lab = useLabRecords(M03_ID);
  const [cycles, setCycles] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = sim.params;
  const out = sim.outputs;
  const lim = PC_LIMITS;
  const period = converterPeriod(p);
  const tu = timeUnitFor(2 * period);

  function set<K extends keyof PowerConverterParams>(key: K, value: PowerConverterParams[K]) {
    const next = { ...p, [key]: value };
    const found = sim.setParams(next);
    setIssues(
      found.filter(
        (i) => i.severity === 'error' || i.parameter === key || i.severity === 'warning',
      ),
    );
    if (!found.some((i) => i.severity === 'error'))
      sim.setTimeScale(cycles * converterPeriod(next));
  }

  function changeCycles(v: number) {
    setCycles(v);
    sim.setTimeScale(v * period);
  }

  const series = seriesFor(p);
  const periodTrace = useMemo(() => converterPeriodTrace(p, 400), [p]);
  const vRows = toTimeRows(periodTrace, series.v, tu.scale, 2000);
  const iRows = toTimeRows(periodTrace, series.i, tu.scale, 2000);
  const gRows = toTimeRows(periodTrace, series.g, tu.scale, 2000);

  const scopeStart = Math.max(0, sim.time - 2 * period);
  const scopeTrace = sim.trace.filter((s) => s.t >= scopeStart);
  const scopeRows = toTimeRows(scopeTrace, series.v, tu.scale);

  const controlled = p.family === 'rectifier' && isControlled(p.rectifier);
  const characteristic = useMemo(() => {
    if (p.family === 'rectifier') {
      if (isControlled(p.rectifier)) {
        return {
          curve: Array.from({ length: 37 }, (_, k) => ({
            x: k * 5,
            y: converterCharacteristic(p, degToRad(k * 5)),
          })),
          x: radToDeg(p.alpha),
          xLabel: 'Firing angle α (°)',
          yLabel: 'Vavg (V)',
        };
      }
      return {
        curve: Array.from({ length: 11 }, (_, k) => ({
          x: k * 50,
          y: converterStats({ ...p, supplyRms: k * 50 || 1 }).vAverage,
        })),
        x: p.supplyRms,
        xLabel: 'Supply voltage (V rms)',
        yLabel: 'Vavg (V)',
      };
    }
    if (p.family === 'dcdc') {
      return {
        curve: Array.from({ length: 19 }, (_, k) => ({
          x: 0.05 * (k + 1),
          y: converterCharacteristic(p, 0.05 * (k + 1)),
        })),
        x: p.duty,
        xLabel: 'Duty cycle D',
        yLabel: 'Vo (V)',
      };
    }
    return {
      curve: Array.from({ length: 20 }, (_, k) => ({
        x: 0.05 * (k + 1),
        y: converterCharacteristic(p, 0.05 * (k + 1)),
      })),
      x: p.modulationIndex,
      xLabel: 'Modulation index ma',
      yLabel: 'V1 (V rms)',
    };
  }, [p]);
  const opY = p.family === 'inverter' ? out.vFundamentalClosedForm : out.vAverage;

  const m = L.measurements;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M03_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={5}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M03_THEORY.intro}</p>
              <OutcomesList outcomes={M03_OUTCOMES} />
              <TheoryBlock title={M03_THEORY.rectifierTitle} items={M03_THEORY.rectifier} mono />
              <TheoryBlock title={M03_THEORY.dcdcTitle} items={M03_THEORY.dcdc} mono collapsible />
              <TheoryBlock
                title={M03_THEORY.inverterTitle}
                items={M03_THEORY.inverter}
                collapsible
              />
              <TheoryBlock title={M03_THEORY.labTitle} collapsible>
                <p className="mt-1">{M03_THEORY.lab}</p>
              </TheoryBlock>
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={powerConverterModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <ConverterDiagram params={p} outputs={out} />
              <ChartFigure
                title={L.scope}
                description={L.scopeDesc}
                columns={[
                  { key: 't', label: `t (${tu.unit})` },
                  ...series.v.map((s) => ({ key: s.key, label: `${s.label} (${s.unit})` })),
                ]}
                rows={scopeRows}
                testId="scope-chart"
              >
                <TimeTraceChart
                  rows={scopeRows}
                  series={series.v}
                  timeUnit={tu.unit}
                  yLabel="v (V)"
                  xMin={scopeStart * tu.scale}
                  xMax={Math.max(2 * period, sim.time) * tu.scale}
                  height={200}
                />
              </ChartFigure>
              <RunControls
                status={sim.status}
                lagging={sim.lagging}
                onStart={sim.start}
                onPause={sim.pause}
                onStop={sim.stop}
                onReset={sim.reset}
                playback={cycles}
                playbackOptions={CYCLES}
                onPlayback={changeCycles}
              />
            </div>
          ),

          controls: (
            <div className="space-y-4">
              <SelectField<ConverterFamily>
                label={L.family}
                value={p.family}
                options={(['rectifier', 'dcdc', 'inverter'] as const).map((f) => ({
                  value: f,
                  label: L.families[f],
                }))}
                onChange={(v) => set('family', v)}
              />
              {p.family === 'rectifier' ? (
                <>
                  <SelectField<RectifierKind>
                    label={L.circuit}
                    value={p.rectifier}
                    options={RECTIFIER_KINDS.map((k) => ({ value: k, label: L.rectifiers[k] }))}
                    onChange={(v) => set('rectifier', v)}
                  />
                  <fieldset>
                    <legend className="text-sm font-medium text-navy-800">{L.lab1Supply}</legend>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {LAB1_SUPPLY.map((v) => (
                        <Button
                          key={v}
                          variant={p.supplyRms === v ? 'primary' : 'secondary'}
                          onClick={() => set('supplyRms', v)}
                        >
                          {v} V
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                  <NumberControl
                    label={L.supplyRms}
                    value={p.supplyRms}
                    min={lim.supplyRms.min}
                    max={lim.supplyRms.max}
                    step={1}
                    unit="V"
                    onChange={(v) => set('supplyRms', v)}
                  />
                  {controlled ? (
                    <>
                      <fieldset>
                        <legend className="text-sm font-medium text-navy-800">{L.lab1Alpha}</legend>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {LAB1_ALPHA.map((a) => (
                            <Button
                              key={a}
                              variant={
                                Math.abs(radToDeg(p.alpha) - a) < 1e-9 ? 'primary' : 'secondary'
                              }
                              onClick={() => set('alpha', degToRad(a))}
                            >
                              {a}°
                            </Button>
                          ))}
                        </div>
                      </fieldset>
                      <NumberControl
                        label={L.alpha}
                        value={Math.round(radToDeg(p.alpha) * 100) / 100}
                        min={0}
                        max={180}
                        step={1}
                        unit="°"
                        onChange={(v) => set('alpha', degToRad(v))}
                      />
                    </>
                  ) : null}
                  <NumberControl
                    label={L.supplyFrequency}
                    value={p.supplyFrequency}
                    min={lim.supplyFrequency.min}
                    max={lim.supplyFrequency.max}
                    step={1}
                    unit="Hz"
                    onChange={(v) => set('supplyFrequency', v)}
                  />
                  <NumberControl
                    label={L.loadResistance}
                    value={p.loadResistance}
                    min={lim.loadResistance.min}
                    max={lim.loadResistance.max}
                    step={1}
                    unit="Ω"
                    onChange={(v) => set('loadResistance', v)}
                  />
                  <p className="text-sm text-navy-600">{L.loadNote}</p>
                </>
              ) : null}
              {p.family === 'dcdc' ? (
                <>
                  <SelectField<DcDcKind>
                    label={L.circuit}
                    value={p.dcdc}
                    options={DCDC_KINDS.map((k) => ({ value: k, label: L.dcdcs[k] }))}
                    onChange={(v) => set('dcdc', v)}
                  />
                  <NumberControl
                    label={L.dcInput}
                    value={p.dcInput}
                    min={lim.dcInput.min}
                    max={lim.dcInput.max}
                    step={1}
                    unit="V"
                    onChange={(v) => set('dcInput', v)}
                  />
                  <NumberControl
                    label={L.duty}
                    value={p.duty}
                    min={lim.duty.min}
                    max={lim.duty.max}
                    step={0.01}
                    unit="—"
                    onChange={(v) => set('duty', v)}
                  />
                  <NumberControl
                    label={L.inductance}
                    value={Math.round(p.inductance * 1e9) / 1e3}
                    min={lim.inductance.min * 1e6}
                    max={lim.inductance.max * 1e6}
                    step={1}
                    unit="µH"
                    onChange={(v) => set('inductance', v * 1e-6)}
                  />
                  <NumberControl
                    label={L.capacitance}
                    value={Math.round(p.capacitance * 1e9) / 1e3}
                    min={lim.capacitance.min * 1e6}
                    max={lim.capacitance.max * 1e6}
                    step={1}
                    unit="µF"
                    onChange={(v) => set('capacitance', v * 1e-6)}
                  />
                  <NumberControl
                    label={L.dcLoadResistance}
                    value={p.dcLoadResistance}
                    min={lim.dcLoadResistance.min}
                    max={lim.dcLoadResistance.max}
                    step={0.5}
                    unit="Ω"
                    onChange={(v) => set('dcLoadResistance', v)}
                  />
                  <NumberControl
                    label={L.switchingFrequency}
                    value={p.switchingFrequency / 1000}
                    min={lim.switchingFrequency.min / 1000}
                    max={lim.switchingFrequency.max / 1000}
                    step={1}
                    unit="kHz"
                    onChange={(v) => set('switchingFrequency', v * 1000)}
                  />
                </>
              ) : null}
              {p.family === 'inverter' ? (
                <>
                  <SelectField<InverterKind>
                    label={L.circuit}
                    value={p.inverter}
                    options={INVERTER_KINDS.map((k) => ({ value: k, label: L.inverters[k] }))}
                    onChange={(v) => set('inverter', v)}
                  />
                  <NumberControl
                    label={L.dcLink}
                    value={p.dcLink}
                    min={lim.dcLink.min}
                    max={lim.dcLink.max}
                    step={10}
                    unit="V"
                    onChange={(v) => set('dcLink', v)}
                  />
                  <NumberControl
                    label={L.modulationIndex}
                    value={p.modulationIndex}
                    min={lim.modulationIndex.min}
                    max={lim.modulationIndex.max}
                    step={0.05}
                    unit="—"
                    onChange={(v) => set('modulationIndex', v)}
                  />
                  <NumberControl
                    label={L.frequencyRatio}
                    value={p.frequencyRatio}
                    min={lim.frequencyRatio.min}
                    max={lim.frequencyRatio.max}
                    step={1}
                    unit="—"
                    onChange={(v) => set('frequencyRatio', Math.round(v))}
                  />
                  <NumberControl
                    label={L.outputFrequency}
                    value={p.outputFrequency}
                    min={lim.outputFrequency.min}
                    max={lim.outputFrequency.max}
                    step={1}
                    unit="Hz"
                    onChange={(v) => set('outputFrequency', v)}
                  />
                  <NumberControl
                    label={L.inverterLoadResistance}
                    value={p.inverterLoadResistance}
                    min={lim.inverterLoadResistance.min}
                    max={lim.inverterLoadResistance.max}
                    step={1}
                    unit="Ω"
                    onChange={(v) => set('inverterLoadResistance', v)}
                  />
                </>
              ) : null}
              {issues.length > 0 ? (
                <div
                  role="alert"
                  className="space-y-1 rounded bg-status-warningBg px-3 py-2 text-sm text-status-warning"
                >
                  {issues.map((i) => (
                    <p key={i.message}>{i.message}</p>
                  ))}
                </div>
              ) : null}
              <p className="text-sm text-navy-600">{L.liveHint}</p>
            </div>
          ),

          measurements: (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MeasurementDisplay
                  label={m.vAverage}
                  symbol="Vavg"
                  value={out.vAverage}
                  unit="V"
                />
                <MeasurementDisplay label={m.vRms} symbol="Vrms" value={out.vRms} unit="V" />
                <MeasurementDisplay
                  label={m.iAverage}
                  symbol="Iavg"
                  value={out.iAverage}
                  unit="A"
                />
                <MeasurementDisplay label={m.iRms} symbol="Irms" value={out.iRms} unit="A" />
                <MeasurementDisplay
                  label={m.outputPower}
                  symbol="P"
                  value={out.outputPower}
                  unit="W"
                />
                {p.family === 'rectifier' ? (
                  <>
                    <MeasurementDisplay
                      label={m.formFactor}
                      symbol="FF"
                      value={out.formFactor}
                      unit=""
                    />
                    <MeasurementDisplay
                      label={m.rippleFactor}
                      symbol="RF"
                      value={out.rippleFactor}
                      unit=""
                    />
                    <MeasurementDisplay
                      label={m.rectificationEfficiency}
                      symbol="η"
                      value={100 * out.rectificationEfficiency}
                      unit="%"
                    />
                    <MeasurementDisplay
                      label={m.inputPowerFactor}
                      symbol="PF"
                      value={out.inputPowerFactor}
                      unit=""
                    />
                  </>
                ) : null}
                {p.family === 'dcdc' ? (
                  <>
                    <MeasurementDisplay
                      label={m.inductorAverage}
                      symbol="IL"
                      value={out.inductorAverage}
                      unit="A"
                    />
                    <MeasurementDisplay
                      label={m.inductorRipple}
                      symbol="ΔI"
                      value={out.inductorRipple}
                      unit="A"
                    />
                    <MeasurementDisplay
                      label={m.inductorMax}
                      symbol="Imax"
                      value={out.inductorMax}
                      unit="A"
                    />
                    <MeasurementDisplay
                      label={m.inductorMin}
                      symbol="Imin"
                      value={out.inductorMin}
                      unit="A"
                    />
                    <MeasurementDisplay
                      label={m.inductorMinimum}
                      symbol="Lmin"
                      value={out.inductorMinimum * 1e6}
                      unit="µH"
                    />
                    <MeasurementDisplay
                      label={m.outputRipple}
                      symbol="ΔVo"
                      value={out.outputRipple}
                      unit="V"
                    />
                  </>
                ) : null}
                {p.family === 'inverter' ? (
                  <>
                    <MeasurementDisplay
                      label={m.vFundamental}
                      symbol="V1"
                      value={out.vFundamental}
                      unit="V"
                    />
                    <MeasurementDisplay
                      label={m.vFundamentalClosedForm}
                      symbol="V1"
                      value={out.vFundamentalClosedForm}
                      unit="V"
                    />
                    <MeasurementDisplay label={m.thd} symbol="THD" value={100 * out.thd} unit="%" />
                  </>
                ) : null}
              </div>
              {p.family === 'dcdc' ? (
                <p
                  className={`rounded px-3 py-2 text-sm ${out.continuous ? 'bg-lightblue-50 text-navy-700' : 'bg-status-warningBg text-status-warning'}`}
                >
                  {out.continuous ? L.continuousYes : L.continuousNo}
                </p>
              ) : null}
              <RecordPanel
                rows={lab.rows}
                columns={M03_RESULT_COLUMNS}
                onRecord={() =>
                  lab.record({
                    time: sim.time,
                    parameters: numericParameters(p),
                    measurements: { ...out },
                  })
                }
                onClear={lab.clear}
              />
            </div>
          ),

          graphs: (
            <div className="space-y-6">
              <ChartFigure
                title={L.periodVoltage}
                description={L.periodVoltageDesc}
                columns={[
                  { key: 't', label: `t (${tu.unit})` },
                  ...series.v.map((s) => ({ key: s.key, label: `${s.label} (${s.unit})` })),
                ]}
                rows={vRows}
                testId="period-voltage-chart"
              >
                <TimeTraceChart
                  rows={vRows}
                  series={series.v}
                  timeUnit={tu.unit}
                  yLabel="v (V)"
                  xMax={period * tu.scale}
                  height={220}
                />
              </ChartFigure>
              <ChartFigure
                title={L.periodCurrent}
                description={L.periodCurrentDesc}
                columns={[
                  { key: 't', label: `t (${tu.unit})` },
                  ...series.i.map((s) => ({ key: s.key, label: `${s.label} (${s.unit})` })),
                ]}
                rows={iRows}
                testId="period-current-chart"
              >
                <TimeTraceChart
                  rows={iRows}
                  series={series.i}
                  timeUnit={tu.unit}
                  yLabel="i (A)"
                  xMax={period * tu.scale}
                  height={200}
                />
              </ChartFigure>
              <ChartFigure
                title={L.periodGate}
                description={L.periodGateDesc}
                columns={[
                  { key: 't', label: `t (${tu.unit})` },
                  ...series.g.map((s) => ({ key: s.key, label: s.label })),
                ]}
                rows={gRows}
                testId="period-gate-chart"
              >
                <TimeTraceChart
                  rows={gRows}
                  series={series.g}
                  timeUnit={tu.unit}
                  yLabel="signal"
                  xMax={period * tu.scale}
                  height={160}
                />
              </ChartFigure>
              <ChartFigure
                title={L.characteristic}
                description={L.characteristicDesc}
                columns={[
                  { key: 'x', label: characteristic.xLabel },
                  { key: 'y', label: characteristic.yLabel },
                ]}
                rows={characteristic.curve}
                testId="characteristic-chart"
              >
                <CharacteristicChart
                  curve={characteristic.curve}
                  point={{ x: characteristic.x, y: opY }}
                  xLabel={characteristic.xLabel}
                  yLabel={characteristic.yLabel}
                />
              </ChartFigure>
            </div>
          ),

          instructions: (
            <ActivitiesList
              activities={M03_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M03_ID} questions={M03_QUESTIONS} />,
        }}
      />
    </>
  );
}
