import { Button } from '@/design-system';
import { selectClass } from '@/features/lab-shell';
import {
  LADDER_INPUTS,
  LADDER_RELAYS,
  LADDER_SENSORS,
  LADDER_SOLENOIDS,
  type CoilName,
  type Contact,
  type ContactSource,
  type Ladder,
  type Rung,
} from '@/sim-core';
import { M09_LABELS as L } from './content.en';

const SOURCES: readonly ContactSource[] = [
  ...LADDER_INPUTS,
  ...LADDER_SENSORS,
  ...LADDER_RELAYS,
  'T1',
];
const COILS: readonly CoilName[] = [...LADDER_RELAYS, ...LADDER_SOLENOIDS, 'T1'];
const CONTACT_OPTIONS = SOURCES.flatMap((s) => [
  { value: `${s}|0`, label: `${s} NO` },
  { value: `${s}|1`, label: `${s} NC` },
]);
const MAX_RUNGS = 8;
const MAX_BRANCHES = 3;
const MAX_CONTACTS = 4;

const encode = (c: Contact) => `${c.source}|${c.nc ? 1 : 0}`;
function decode(v: string): Contact {
  const [source, nc] = v.split('|');
  return { source: source as ContactSource, nc: nc === '1' };
}

/**
 * Form editor for a relay ladder: per rung, parallel branches of series contacts
 * and an output coil. Every change produces a new ladder (immutable).
 */
export function LadderEditor({
  ladder,
  disabled,
  onChange,
}: {
  readonly ladder: Ladder;
  readonly disabled: boolean;
  readonly onChange: (next: Ladder) => void;
}) {
  const setRung = (i: number, rung: Rung) => onChange(ladder.map((r, k) => (k === i ? rung : r)));
  return (
    <fieldset disabled={disabled} className="space-y-3" data-testid="ladder-editor">
      {ladder.map((rung, i) => (
        <div key={i} className="space-y-2 rounded-md border border-navy-100 p-2">
          <div className="flex flex-wrap items-end gap-2">
            <span className="text-sm font-semibold text-navy-800">
              {L.rung} {i + 1}
            </span>
            <label className="text-sm text-navy-800">
              {L.coil}
              <select
                aria-label={`${L.rung} ${i + 1} ${L.coil}`}
                className={selectClass}
                value={rung.coil}
                onChange={(e) => setRung(i, { ...rung, coil: e.target.value as CoilName })}
              >
                {COILS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="ghost" onClick={() => onChange(ladder.filter((_, k) => k !== i))}>
              {L.removeRung}
            </Button>
          </div>
          {rung.branches.map((chain, b) => (
            <div key={b} className="flex flex-wrap items-end gap-2 pl-2">
              <span className="text-xs text-navy-600">
                {L.branch} {b + 1}
              </span>
              {chain.length === 0 ? (
                <span className="text-xs text-navy-600">{L.emptyBranch}</span>
              ) : null}
              {chain.map((c, k) => (
                <select
                  key={k}
                  aria-label={`${L.rung} ${i + 1} ${L.branch} ${b + 1} contact ${k + 1}`}
                  className={`${selectClass} w-auto`}
                  value={encode(c)}
                  onChange={(e) =>
                    setRung(i, {
                      ...rung,
                      branches: rung.branches.map((ch, bb) =>
                        bb === b
                          ? ch.map((cc, kk) => (kk === k ? decode(e.target.value) : cc))
                          : ch,
                      ),
                    })
                  }
                >
                  {CONTACT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ))}
              <Button
                variant="secondary"
                disabled={chain.length >= MAX_CONTACTS}
                onClick={() =>
                  setRung(i, {
                    ...rung,
                    branches: rung.branches.map((ch, bb) =>
                      bb === b ? [...ch, { source: 'S1', nc: false }] : ch,
                    ),
                  })
                }
              >
                {L.addContact}
              </Button>
              <Button
                variant="ghost"
                disabled={chain.length === 0}
                onClick={() =>
                  setRung(i, {
                    ...rung,
                    branches: rung.branches.map((ch, bb) => (bb === b ? ch.slice(0, -1) : ch)),
                  })
                }
              >
                {L.removeContact}
              </Button>
              <Button
                variant="ghost"
                disabled={rung.branches.length <= 1}
                onClick={() =>
                  setRung(i, { ...rung, branches: rung.branches.filter((_, bb) => bb !== b) })
                }
              >
                {L.removeBranch}
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            disabled={rung.branches.length >= MAX_BRANCHES}
            onClick={() =>
              setRung(i, { ...rung, branches: [...rung.branches, [{ source: 'S1', nc: false }]] })
            }
          >
            {L.addBranch}
          </Button>
        </div>
      ))}
      <Button
        disabled={ladder.length >= MAX_RUNGS}
        onClick={() =>
          onChange([...ladder, { branches: [[{ source: 'S1', nc: false }]], coil: 'K1' }])
        }
      >
        {L.addRung}
      </Button>
    </fieldset>
  );
}
