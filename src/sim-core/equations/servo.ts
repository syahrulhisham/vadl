/**
 * Servo position sensors (LN Ch2 Part II p18–26) and response metrics.
 * Angles in radians; clockwise rotation is positive.
 * Verification: docs/reference-cases/servo-motor.md.
 */

const TWO_PI = 2 * Math.PI;
const EPS = 1e-9;

/**
 * Quadrature encoder count: 4 counts per line (both edges of A and B),
 * count = ⌊4·L·θ/2π⌋, signed (anticlockwise counts down).
 * Source: LN Ch2 Part II p25 (2¾ lines → 11 counts).
 */
export function encoderCount(theta: number, lines: number): number {
  return Math.floor((4 * lines * theta) / TWO_PI + EPS);
}

/** Angle of one quadrature count, 2π/(4L) [rad]. */
export function encoderResolution(lines: number): number {
  return TWO_PI / (4 * lines);
}

/** Angle the encoder reports: the count times its resolution (quantised position) [rad]. */
export function encoderAngle(theta: number, lines: number): number {
  return encoderCount(theta, lines) * encoderResolution(lines);
}

/**
 * Channel levels (0 or 1) at shaft angle θ. A is high for the first half of each
 * line period; B is the same signal 90° (electrical) later, so A leads B when
 * the shaft turns clockwise and B leads A anticlockwise. Z (index) is high for
 * the first count of each revolution.
 */
export function encoderChannels(
  theta: number,
  lines: number,
): { readonly a: number; readonly b: number; readonly z: number } {
  const frac = (x: number) => x - Math.floor(x);
  const phase = (lines * theta) / TWO_PI + EPS;
  return {
    a: frac(phase) < 0.5 ? 1 : 0,
    b: frac(phase - 0.25) < 0.5 ? 1 : 0,
    z: frac(theta / TWO_PI + EPS) < 1 / (4 * lines) ? 1 : 0,
  };
}

/**
 * Resolver output amplitudes for reference amplitude Vr: Vsin = Vr·sin θ,
 * Vcos = Vr·cos θ (rotary transformer; the signs give the quadrant).
 */
export function resolverOutputs(
  theta: number,
  amplitude: number,
): { readonly sin: number; readonly cos: number } {
  return { sin: amplitude * Math.sin(theta), cos: amplitude * Math.cos(theta) };
}

/** Shaft angle recovered from the resolver, atan2(Vsin, Vcos) in 0…2π [rad]. */
export function resolverAngle(vsin: number, vcos: number): number {
  const a = Math.atan2(vsin, vcos);
  return a < 0 ? a + TWO_PI : a;
}

/** Quadrant 1–4 from the signs of the resolver outputs (1: sin ≥ 0, cos ≥ 0). */
export function resolverQuadrant(vsin: number, vcos: number): number {
  if (vsin >= 0) return vcos >= 0 ? 1 : 2;
  return vcos < 0 ? 3 : 4;
}

/**
 * Proportional position servo with La neglected (an extension: not in the course notes):
 *
 *   J·θ'' + (B + kφ²/Ra)·θ' + K·θ = K·θref,   K = Kp·Kfb·kφ/Ra
 *
 * Returns ωn = √(K/J), ζ = (B + kφ²/Ra)/(2√(K·J)), overshoot Mp = exp(−πζ/√(1−ζ²))
 * (fraction) and peak time tp = π/(ωn√(1−ζ²)) (NaN when ζ ≥ 1).
 */
export function positionServoSecondOrder(
  kp: number,
  kfb: number,
  kphi: number,
  ra: number,
  inertia: number,
  friction: number,
) {
  const k = (kp * kfb * kphi) / ra;
  const b = friction + (kphi * kphi) / ra;
  const wn = Math.sqrt(k / inertia);
  const zeta = b / (2 * Math.sqrt(k * inertia));
  const wd = zeta < 1 ? wn * Math.sqrt(1 - zeta * zeta) : Number.NaN;
  return {
    stiffness: k,
    naturalFrequency: wn,
    dampingRatio: zeta,
    overshoot: zeta < 1 ? Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) : 0,
    peakTime: Math.PI / wd,
  };
}

/**
 * Steady position error of a proportional position servo holding a load torque:
 * kφ·Ia = TL, Va = Ra·Ia = Kp·Kfb·e  →  e = TL·Ra/(Kp·Kfb·kφ) [rad].
 */
export function positionServoLoadError(
  loadTorque: number,
  ra: number,
  kp: number,
  kfb: number,
  kphi: number,
): number {
  return (loadTorque * ra) / (kp * kfb * kphi);
}

/**
 * Steady speed of a proportional speed servo (tachometer feedback Kt):
 * Va = Kp(Vcs − Kt·ω) = Ra·Ia + kφ·ω with kφ·Ia = B·ω + TL, so
 * ω = (Kp·Vcs − Ra·TL/kφ)/(Kp·Kt + Ra·B/kφ + kφ) [rad/s]. Ignores amplifier saturation.
 */
export function speedServoSteadyState(
  vcs: number,
  kp: number,
  kt: number,
  ra: number,
  kphi: number,
  friction: number,
  loadTorque: number,
): number {
  return (kp * vcs - (ra * loadTorque) / kphi) / (kp * kt + (ra * friction) / kphi + kphi);
}

export interface ResponseSample {
  readonly t: number;
  readonly y: number;
}

export interface ResponseMetrics {
  /** 10 % to 90 % rise time [s]; NaN if the response never reaches 90 %. */
  readonly riseTime: number;
  /** Peak overshoot beyond the final value, as a fraction of the step (0 if none). */
  readonly overshoot: number;
  /** Time after which the response stays within ±2 % of the step [s]; NaN if it never settles. */
  readonly settlingTime: number;
  /** Final value minus the last sample (steady-state error, same unit as y). */
  readonly steadyStateError: number;
}

/**
 * Time-domain metrics of a step response from sampled data (time measured from
 * the first sample). Crossing times are linearly interpolated between samples.
 * `initial` and `final` are the values before and after the step (the reference).
 */
export function responseMetrics(
  samples: readonly ResponseSample[],
  initial: number,
  final: number,
  band = 0.02,
): ResponseMetrics {
  const span = final - initial;
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last || span === 0) {
    return {
      riseTime: Number.NaN,
      overshoot: Number.NaN,
      settlingTime: Number.NaN,
      steadyStateError: Number.NaN,
    };
  }
  const norm = (y: number) => (y - initial) / span;
  const crossing = (level: number) => {
    for (let i = 1; i < samples.length; i += 1) {
      const a = samples[i - 1] as ResponseSample;
      const b = samples[i] as ResponseSample;
      const ya = norm(a.y);
      const yb = norm(b.y);
      if (ya < level && yb >= level) return a.t + ((level - ya) / (yb - ya)) * (b.t - a.t);
    }
    return norm(first.y) >= level ? first.t : Number.NaN;
  };
  const peak = Math.max(...samples.map((s) => norm(s.y)));
  let settle = first.t;
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    const s = samples[i] as ResponseSample;
    if (Math.abs(norm(s.y) - 1) > band) {
      const next = samples[i + 1];
      if (!next) {
        settle = Number.NaN;
        break;
      }
      // Interpolate the instant the error re-enters the band.
      const ea = Math.abs(norm(s.y) - 1);
      const eb = Math.abs(norm(next.y) - 1);
      settle = s.t + ((ea - band) / (ea - eb)) * (next.t - s.t);
      break;
    }
  }
  return {
    riseTime: crossing(0.9) - crossing(0.1),
    overshoot: Math.max(0, peak - 1),
    settlingTime: Number.isNaN(settle) ? settle : settle - first.t,
    steadyStateError: final - last.y,
  };
}
