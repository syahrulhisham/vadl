import { colors } from '@/design-system';
import {
  formatSignificant,
  radToDeg,
  type PowerConverterOutputs,
  type PowerConverterParams,
} from '@/sim-core';
import { M03_LABELS as L } from './content.en';

const fmt = (v: number) => formatSignificant(v, 4);

/** Block diagram: source → converter → load, labelled with the model's present values. */
export function ConverterDiagram({
  params: p,
  outputs: o,
}: {
  readonly params: PowerConverterParams;
  readonly outputs: PowerConverterOutputs;
}) {
  const wire = colors.navy[800];
  const source =
    p.family === 'rectifier'
      ? `AC ${fmt(p.supplyRms)} V, ${fmt(p.supplyFrequency)} Hz`
      : p.family === 'dcdc'
        ? `DC ${fmt(p.dcInput)} V`
        : `DC link ${fmt(p.dcLink)} V`;
  const block =
    p.family === 'rectifier'
      ? L.rectifiers[p.rectifier]
      : p.family === 'dcdc'
        ? L.dcdcs[p.dcdc]
        : L.inverters[p.inverter];
  const control =
    p.family === 'rectifier'
      ? p.rectifier.startsWith('diode')
        ? 'uncontrolled'
        : `α = ${fmt(radToDeg(p.alpha))}°`
      : p.family === 'dcdc'
        ? `D = ${fmt(p.duty)}, f = ${fmt(p.switchingFrequency / 1000)} kHz`
        : `ma = ${fmt(p.modulationIndex)}, mf = ${p.frequencyRatio}`;
  const load =
    p.family === 'rectifier'
      ? `R = ${fmt(p.loadResistance)} Ω${p.rectifier.endsWith('-l') ? ' + large L' : ''}`
      : p.family === 'dcdc'
        ? `R = ${fmt(p.dcLoadResistance)} Ω`
        : `R = ${fmt(p.inverterLoadResistance)} Ω`;
  const result =
    p.family === 'inverter' ? `V1 = ${fmt(o.vFundamental)} V rms` : `Vavg = ${fmt(o.vAverage)} V`;
  const desc = `${source} feeding ${block} (${control}) into a load of ${load}. ${result}.`;
  return (
    <svg
      viewBox="0 0 560 170"
      className="h-auto w-full max-w-2xl"
      role="img"
      aria-label={desc}
      data-testid="converter-diagram"
    >
      <g fill={colors.white} stroke={wire} strokeWidth={2.5}>
        <rect x="10" y="45" width="140" height="70" rx="8" />
        <rect x="200" y="35" width="170" height="90" rx="8" fill={colors.lightblue[50]} />
        <rect x="420" y="45" width="130" height="70" rx="8" />
      </g>
      <g stroke={wire} strokeWidth={2.5}>
        <line x1="150" y1="80" x2="200" y2="80" />
        <line x1="370" y1="80" x2="420" y2="80" />
      </g>
      <g
        fontFamily="system-ui, sans-serif"
        fill={colors.navy[900]}
        fontSize="13"
        textAnchor="middle"
      >
        <text x="80" y="76">
          Source
        </text>
        <text x="80" y="96" fontSize="11">
          {source}
        </text>
        <text x="285" y="62" fontSize="12">
          {block}
        </text>
        <text x="285" y="86" fontSize="12">
          {control}
        </text>
        <text x="285" y="108" fontSize="12" fontWeight="600" data-testid="converter-result">
          {result}
        </text>
        <text x="485" y="76">
          Load
        </text>
        <text x="485" y="96" fontSize="11">
          {load}
        </text>
      </g>
    </svg>
  );
}
