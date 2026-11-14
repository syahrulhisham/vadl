/**
 * Bounded trace recorder (risk R10: long traces). A ring buffer keeps the most
 * recent `capacity` samples in order; `downsample` reduces a trace for plotting
 * while keeping each bucket's minimum and maximum so peaks are never hidden.
 */

export interface Sample {
  /** Simulation time, s. */
  readonly t: number;
  /** Output values in SI units, keyed by output name. */
  readonly values: Readonly<Record<string, number>>;
}

export class Recorder {
  private readonly buffer: (Sample | undefined)[];
  private start = 0;
  private count = 0;

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 2) {
      throw new RangeError(`Recorder capacity must be an integer ≥ 2, got ${capacity}`);
    }
    this.buffer = new Array<Sample | undefined>(capacity);
  }

  get size(): number {
    return this.count;
  }

  push(sample: Sample): void {
    const index = (this.start + this.count) % this.capacity;
    this.buffer[index] = sample;
    if (this.count < this.capacity) this.count += 1;
    else this.start = (this.start + 1) % this.capacity;
  }

  clear(): void {
    this.buffer.fill(undefined);
    this.start = 0;
    this.count = 0;
  }

  /** Samples in time order, oldest first. */
  toArray(): Sample[] {
    const out: Sample[] = [];
    for (let i = 0; i < this.count; i += 1) {
      out.push(this.buffer[(this.start + i) % this.capacity] as Sample);
    }
    return out;
  }

  /** The newest sample, or undefined when empty. */
  last(): Sample | undefined {
    return this.count === 0
      ? undefined
      : this.buffer[(this.start + this.count - 1) % this.capacity];
  }
}

/**
 * Reduce `samples` to at most about `maxPoints` points for plotting. Splits the
 * trace into buckets and keeps, per bucket, the samples holding the minimum and
 * maximum of `key` (in time order). The first and last samples are always kept.
 */
export function downsample(samples: readonly Sample[], maxPoints: number, key: string): Sample[] {
  if (maxPoints < 4) throw new RangeError('maxPoints must be at least 4');
  if (samples.length <= maxPoints) return [...samples];
  const first = samples[0] as Sample;
  const last = samples[samples.length - 1] as Sample;
  const inner = samples.slice(1, -1);
  const buckets = Math.floor((maxPoints - 2) / 2);
  const size = inner.length / buckets;
  const out: Sample[] = [first];
  for (let b = 0; b < buckets; b += 1) {
    const from = Math.floor(b * size);
    const to = Math.min(inner.length, Math.floor((b + 1) * size));
    if (to <= from) continue;
    let minIdx = from;
    let maxIdx = from;
    for (let i = from; i < to; i += 1) {
      const v = (inner[i] as Sample).values[key] ?? 0;
      if (v < ((inner[minIdx] as Sample).values[key] ?? 0)) minIdx = i;
      if (v > ((inner[maxIdx] as Sample).values[key] ?? 0)) maxIdx = i;
    }
    const [a, c] = minIdx <= maxIdx ? [minIdx, maxIdx] : [maxIdx, minIdx];
    out.push(inner[a] as Sample);
    if (c !== a) out.push(inner[c] as Sample);
  }
  out.push(last);
  return out;
}
