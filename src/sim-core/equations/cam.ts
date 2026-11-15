/**
 * Cam and follower kinematics (LN Ch3 Part I p20–35). The course teaches the
 * uniform-velocity law with rise, dwell and return; simple harmonic, uniform
 * acceleration and cycloidal laws and the pressure angle are extensions (L-19).
 * SI units: displacement [m], cam angle [rad]. Verification:
 * docs/reference-cases/cam-follower.md.
 */

export type MotionLaw = 'uniform' | 'shm' | 'uniform-acceleration' | 'cycloidal';

/** Normalised rise y(x), dy/dx and d²y/dx² for x in [0, 1] (y from 0 to 1). */
export function riseLaw(law: MotionLaw, x: number): { y: number; dy: number; d2y: number } {
  const u = Math.min(1, Math.max(0, x));
  switch (law) {
    case 'uniform':
      return { y: u, dy: 1, d2y: 0 };
    case 'shm':
      return {
        y: 0.5 * (1 - Math.cos(Math.PI * u)),
        dy: 0.5 * Math.PI * Math.sin(Math.PI * u),
        d2y: 0.5 * Math.PI * Math.PI * Math.cos(Math.PI * u),
      };
    case 'uniform-acceleration':
      return u <= 0.5
        ? { y: 2 * u * u, dy: 4 * u, d2y: 4 }
        : { y: 1 - 2 * (1 - u) * (1 - u), dy: 4 * (1 - u), d2y: -4 };
    case 'cycloidal':
      return {
        y: u - Math.sin(2 * Math.PI * u) / (2 * Math.PI),
        dy: 1 - Math.cos(2 * Math.PI * u),
        d2y: 2 * Math.PI * Math.sin(2 * Math.PI * u),
      };
  }
}

/** Cam motion programme: rise, upper dwell, return, then lower dwell for the rest of the turn. */
export interface CamProgramme {
  readonly law: MotionLaw;
  /** Lift h [m]. */
  readonly lift: number;
  /** Rise, upper dwell and return angles [rad]; the lower dwell is 2π minus their sum. */
  readonly riseAngle: number;
  readonly dwellAngle: number;
  readonly returnAngle: number;
}

/** Segment of the turn: 0 rise, 1 upper dwell, 2 return, 3 lower dwell. */
export type CamSegment = 0 | 1 | 2 | 3;

/**
 * Follower displacement s(θ) [m], ds/dθ [m/rad] and d²s/dθ² [m/rad²] at cam angle θ.
 *
 * Rise over β1: s = h·y(x); return over β2: s = h·(1 − y(x)), x = angle into the
 * segment divided by its length. Uniform velocity has d²s/dθ² = 0 inside each
 * segment; at the segment ends it is theoretically infinite (a sudden change of
 * velocity), which is why practical cams modify the law (LN Ch3 Part I p25).
 */
export function camMotion(c: CamProgramme, theta: number) {
  const twoPi = 2 * Math.PI;
  const a = ((theta % twoPi) + twoPi) % twoPi;
  const r1 = c.riseAngle;
  const r2 = r1 + c.dwellAngle;
  const r3 = r2 + c.returnAngle;
  if (a < r1) {
    const l = riseLaw(c.law, a / c.riseAngle);
    return {
      s: c.lift * l.y,
      ds: (c.lift * l.dy) / c.riseAngle,
      d2s: (c.lift * l.d2y) / (c.riseAngle * c.riseAngle),
      segment: 0 as CamSegment,
    };
  }
  if (a < r2) return { s: c.lift, ds: 0, d2s: 0, segment: 1 as CamSegment };
  if (a < r3) {
    const l = riseLaw(c.law, (a - r2) / c.returnAngle);
    return {
      s: c.lift * (1 - l.y),
      ds: (-c.lift * l.dy) / c.returnAngle,
      d2s: (-c.lift * l.d2y) / (c.returnAngle * c.returnAngle),
      segment: 2 as CamSegment,
    };
  }
  return { s: 0, ds: 0, d2s: 0, segment: 3 as CamSegment };
}

/** Rate of rise of a uniform-velocity segment, h/β [m/rad] (course: mm per degree = h/β°). */
export function uniformRate(lift: number, angle: number): number {
  return lift / angle;
}

/**
 * Pressure angle of a radial knife-edge or roller follower (extension):
 * tan φ = (ds/dθ)/(Rp + s), Rp = Rb (knife-edge) or Rb + Rr (roller) [rad].
 */
export function pressureAngle(ds: number, s: number, primeRadius: number): number {
  return Math.atan2(ds, primeRadius + s);
}

export type FollowerKind = 'knife' | 'roller' | 'flat';

/**
 * Cam profile in the cam's own frame, n points round one turn [m].
 *
 * The follower moves along +y above the cam centre; the cam turns clockwise by θ.
 * The point of the cam under the follower at angle θ lies at cam-frame angle −θ
 * (measured from +y, clockwise positive). x = R sin ψ, y = R cos ψ.
 *
 * - Knife-edge: radius Rb + s(θ).
 * - Roller: pitch curve radius Rb + Rr + s(θ), profile offset inwards by Rr along
 *   the pitch-curve normal.
 * - Flat-faced (face perpendicular to the axis): the contact lies ds/dθ from the
 *   axis along the face (on the side the cam is coming from: x = −ds/dθ for
 *   clockwise rotation), at height Rb + s; the profile is that point in the cam frame.
 */
export function camProfile(
  c: CamProgramme,
  follower: FollowerKind,
  baseRadius: number,
  rollerRadius: number,
  n = 720,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const toCam = (px: number, py: number, theta: number) => {
    // Rotate a world point by −θ (anticlockwise by θ when clockwise is positive).
    const cs = Math.cos(theta);
    const sn = Math.sin(theta);
    return { x: px * cs - py * sn, y: px * sn + py * cs };
  };
  for (let i = 0; i < n; i += 1) {
    const theta = (i / n) * 2 * Math.PI;
    const m = camMotion(c, theta);
    if (follower === 'knife') {
      pts.push(toCam(0, baseRadius + m.s, theta));
    } else if (follower === 'flat') {
      // The contact moves against the rotation as the follower rises: x = −ds/dθ.
      pts.push(toCam(-m.ds, baseRadius + m.s, theta));
    } else {
      // Pitch point (0, Rp) in the world; the contact normal is tilted by the pressure angle.
      const rp = baseRadius + rollerRadius + m.s;
      const phi = Math.atan2(m.ds, rp);
      pts.push(toCam(-rollerRadius * Math.sin(phi), rp - rollerRadius * Math.cos(phi), theta));
    }
  }
  return pts;
}
