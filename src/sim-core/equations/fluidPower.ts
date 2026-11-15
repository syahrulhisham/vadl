/**
 * Fluid power: cylinders, orifice flow, pumps, valves and solenoid coils.
 * SI units (Pa, m², m³/s, N, W). Pressures are gauge unless named "absolute".
 * Sources: Festo TP101/TP201/TP501/TP601 workbooks used by course Labs 2–4b.
 * The orifice-flow speed models are VADL's own (the course gives no speed formula).
 * Verification: docs/reference-cases/fluid-power.md.
 */

/** Standard atmospheric pressure [Pa]. */
export const ATMOSPHERE = 101_325;
/** Air: gas constant [J/(kg·K)], ratio of specific heats, temperature [K]. */
export const AIR = { R: 287, gamma: 1.4, T: 293.15 } as const;
/** Mineral hydraulic oil density [kg/m³]. */
export const OIL_DENSITY = 870;

/** Piston area A = πD²/4 [m²]. */
export function pistonArea(bore: number): number {
  return (Math.PI * bore * bore) / 4;
}

/** Annulus (rod-side) area A' = π(D² − d²)/4 [m²]. */
export function annulusArea(bore: number, rod: number): number {
  return (Math.PI * (bore * bore - rod * rod)) / 4;
}

/** Theoretical force F = p·A [N] (lecture: P = F/A). */
export function theoreticalForce(pressure: number, area: number): number {
  return pressure * area;
}

/**
 * Effective force F = (1 − f)·p·A − F_spring [N]: friction f of the theoretical
 * force (Festo: about 10 % at 4–8 bar), minus a return spring if fitted.
 */
export function effectiveForce(
  pressure: number,
  area: number,
  frictionFraction: number,
  springForce = 0,
): number {
  return (1 - frictionFraction) * pressure * area - springForce;
}

/** Effective area of restrictions in series, 1/A² = Σ 1/Aᵢ² (orifices in series) [m²]. */
export function seriesArea(...areas: readonly number[]): number {
  if (areas.some((a) => a <= 0)) return 0;
  return 1 / Math.sqrt(areas.reduce((s, a) => s + 1 / (a * a), 0));
}

const CRITICAL = (2 / (AIR.gamma + 1)) ** (AIR.gamma / (AIR.gamma - 1));

/**
 * Air mass flow through an orifice of effective area A from absolute pressure
 * pUp to pDown [kg/s] (isentropic nozzle, choked below the critical ratio 0.528).
 */
export function airMassFlow(area: number, pUp: number, pDown: number): number {
  if (area <= 0 || pUp <= pDown) return 0;
  const { R, gamma: g, T } = AIR;
  const r = pDown / pUp;
  if (r <= CRITICAL) {
    return area * pUp * Math.sqrt(g / (R * T)) * (2 / (g + 1)) ** ((g + 1) / (2 * (g - 1)));
  }
  return (
    area * pUp * Math.sqrt(((2 * g) / ((g - 1) * R * T)) * (r ** (2 / g) - r ** ((g + 1) / g)))
  );
}

/** Air density at absolute pressure p, ρ = p/(RT) [kg/m³]. */
export function airDensity(absolutePressure: number): number {
  return absolutePressure / (AIR.R * AIR.T);
}

/** Volumetric flow at upstream conditions through a choked orifice per m² of area, √(γRT)(2/(γ+1))^((γ+1)/(2(γ−1))) [m/s]. */
export function chokedVelocityFactor(): number {
  const { R, gamma: g, T } = AIR;
  return Math.sqrt(g * R * T) * (2 / (g + 1)) ** ((g + 1) / (2 * (g - 1)));
}

/** Oil flow through an orifice, q = A·√(2Δp/ρ) [m³/s] (Δp ≤ 0 gives 0). */
export function oilFlow(area: number, dp: number, density = OIL_DENSITY): number {
  return dp <= 0 ? 0 : area * Math.sqrt((2 * dp) / density);
}

/** Pressure drop to pass flow q through an orifice, Δp = (ρ/2)(q/A)² [Pa]. */
export function oilPressureDrop(area: number, flow: number, density = OIL_DENSITY): number {
  if (flow <= 0) return 0;
  if (area <= 0) return Number.POSITIVE_INFINITY;
  return (density / 2) * (flow / area) ** 2;
}

function bisect(f: (x: number) => number, lo: number, hi: number, iterations = 80): number {
  const fLo = f(lo);
  let a = lo;
  let b = hi;
  for (let i = 0; i < iterations; i += 1) {
    const m = (a + b) / 2;
    if (f(m) > 0 === fLo > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

export interface PneumaticStroke {
  /** Piston speed [m/s] (0 if the cylinder cannot move the load). */
  readonly speed: number;
  /** Gauge pressures in the driving and exhausting chambers [Pa]. */
  readonly drivePressure: number;
  readonly exhaustPressure: number;
}

/**
 * Quasi-static stroke of a pneumatic cylinder (VADL's own model):
 *
 *   inflow   ṁ_in(ps → pd) = ρ(pd)·A_d·v        (supply through the inlet path)
 *   outflow  ṁ_out(pe → pa) = ρ(pe)·A_e·v       (exhaust through the outlet path)
 *   force    (pd − pa)·A_d − (pe − pa)·A_e = F_friction + F_load
 *
 * Isothermal air at 293 K, constant speed (inertia neglected). For each speed v
 * the inflow fixes pd and the force balance fixes pe; v is the speed at which
 * the exhaust can pass the displaced air. Single-acting spring return: pass the
 * spring force as the driving force with zero supply (see `springStroke`).
 */
export function pneumaticStroke(
  supply: number,
  driveArea: number,
  exhaustArea: number,
  frictionForce: number,
  loadForce: number,
  inletArea: number,
  outletArea: number,
): PneumaticStroke {
  const pa = ATMOSPHERE;
  const ps = supply + pa;
  const stall = { speed: 0, drivePressure: supply, exhaustPressure: 0 };
  if (supply * driveArea <= frictionForce + loadForce || inletArea <= 0 || outletArea <= 0) {
    return stall;
  }
  const pdOf = (v: number) => {
    const k = (p: number) => airMassFlow(inletArea, ps, p) - airDensity(p) * driveArea * v;
    return k(pa) <= 0 ? pa : bisect(k, pa, ps, 60);
  };
  const peOf = (pd: number) =>
    pa + ((pd - pa) * driveArea - frictionForce - loadForce) / exhaustArea;
  const h = (v: number) => {
    const pe = peOf(pdOf(v));
    if (pe <= pa) return -exhaustArea * v;
    return airMassFlow(outletArea, pe, pa) / airDensity(pe) - exhaustArea * v;
  };
  const v = bisect(h, 1e-9, 30, 60);
  const pd = pdOf(v);
  return { speed: v, drivePressure: pd - pa, exhaustPressure: Math.max(0, peOf(pd) - pa) };
}

/**
 * Return stroke of a single-acting cylinder: the spring pushes the piston back,
 * the air leaves through the outlet path. Force balance (pe − pa)·A = F_spring −
 * F_friction − F_load fixes the chamber pressure; the flow fixes the speed.
 */
export function springStroke(
  area: number,
  springForce: number,
  frictionForce: number,
  loadForce: number,
  outletArea: number,
): PneumaticStroke {
  const net = springForce - frictionForce - loadForce;
  if (net <= 0 || outletArea <= 0) return { speed: 0, drivePressure: 0, exhaustPressure: 0 };
  const pe = ATMOSPHERE + net / area;
  const speed = airMassFlow(outletArea, pe, ATMOSPHERE) / airDensity(pe) / area;
  return { speed, drivePressure: 0, exhaustPressure: pe - ATMOSPHERE };
}

/** Pump flow q = V·n·η_v [m³/s] with displacement V [m³/rev] and speed n [rev/s]. */
export function pumpFlow(
  displacement: number,
  speedRevPerSecond: number,
  volumetricEfficiency = 1,
): number {
  return displacement * speedRevPerSecond * volumetricEfficiency;
}

/** Hydraulic power P = p·q [W]. */
export function hydraulicPower(pressure: number, flow: number): number {
  return pressure * flow;
}

/** Drive (input) power P = p·q/η [W]; the course uses η = 0.7. */
export function drivePower(pressure: number, flow: number, efficiency = 0.7): number {
  return (pressure * flow) / efficiency;
}

/** Piston speed v = q/A [m/s]. */
export function cylinderSpeed(flow: number, area: number): number {
  return flow / area;
}

/** Load pressure p = F/A [Pa] (Lab 4a: weight on the annulus). */
export function loadPressure(force: number, area: number): number {
  return force / area;
}

/** Force with back pressure, F = A_P·p1 − A_PR·p2 [N] (Festo TP501 Ex 8). */
export function backPressureForce(
  pistonA: number,
  p1: number,
  annulusA: number,
  p2: number,
): number {
  return pistonA * p1 - annulusA * p2;
}

/**
 * Relief-valve flow [m³/s]: closed below the cracking pressure, which is 0.4 MPa
 * below the setting (course measurement, TP501 p.61–62), then opening linearly to
 * pass the rated flow at the setting.
 */
export function reliefFlow(
  pressure: number,
  setting: number,
  ratedFlow: number,
  override = 4e5,
): number {
  const crack = setting - override;
  return pressure <= crack ? 0 : (ratedFlow * (pressure - crack)) / override;
}

/** Coil current I = U/R [A]. */
export function coilCurrent(voltage: number, resistance: number): number {
  return voltage / resistance;
}

/** Coil power P = U²/R [W]. */
export function coilPower(voltage: number, resistance: number): number {
  return (voltage * voltage) / resistance;
}

/** Voltage for a coil of power P and resistance R, U = √(P·R) [V]. */
export function coilVoltage(power: number, resistance: number): number {
  return Math.sqrt(power * resistance);
}

export interface HydraulicStrokeInput {
  /** Pump flow delivered to the circuit [m³/s] (0 when the pump circulates to tank). */
  readonly pumpFlow: number;
  readonly reliefSetting: number;
  /** Flow the relief valve passes at its setting [m³/s] (the rated pump flow). */
  readonly reliefRatedFlow: number;
  /** Chamber the pump fills, and the chamber that empties to tank [m²]. */
  readonly inArea: number;
  readonly outArea: number;
  /** Force opposing the motion [N]; negative when the load drives the motion (overrunning). */
  readonly opposingForce: number;
  /** Effective areas of the pump-to-chamber and chamber-to-tank paths [m²]. */
  readonly inPathArea: number;
  readonly outPathArea: number;
  /** Cracking pressure of a non-return valve in the pump line [Pa] (0 if none). */
  readonly checkValve: number;
}

export interface HydraulicStroke {
  readonly speed: number;
  readonly pumpPressure: number;
  readonly inPressure: number;
  readonly outPressure: number;
  readonly reliefFlow: number;
  /** True when an overrunning load pulls the piston faster than the pump can fill it. */
  readonly cavitation: boolean;
}

/**
 * Quasi-static hydraulic stroke (VADL's own model; incompressible oil):
 *
 *   p_out = Δp_out(v·A_out);   p_in = (F + p_out·A_out)/A_in  (≥ 0)
 *   p_pump = p_in + Δp_in(v·A_in) + p_check
 *   q_pump = v·A_in + q_relief(p_pump)
 *
 * The speed is the root of the flow balance (decreasing in v). With the pump to
 * tank, only an overrunning load moves the piston, at the speed its own pressure
 * −F/A_out drives through the outlet path.
 */
export function hydraulicStroke(h: HydraulicStrokeInput): HydraulicStroke {
  const pOut = (v: number) => oilPressureDrop(h.outPathArea, v * h.outArea);
  const pIn = (v: number) => Math.max(0, (h.opposingForce + pOut(v) * h.outArea) / h.inArea);
  const pPump = (v: number) => pIn(v) + oilPressureDrop(h.inPathArea, v * h.inArea) + h.checkValve;
  const relief = (p: number) => reliefFlow(p, h.reliefSetting, h.reliefRatedFlow);
  const freeSpeed =
    h.opposingForce < 0 ? oilFlow(h.outPathArea, -h.opposingForce / h.outArea) / h.outArea : 0;
  if (h.pumpFlow <= 0) {
    return {
      speed: freeSpeed,
      pumpPressure: 0,
      inPressure: 0,
      outPressure: freeSpeed > 0 ? -h.opposingForce / h.outArea : 0,
      reliefFlow: 0,
      cavitation: freeSpeed > 0,
    };
  }
  const f = (v: number) => h.pumpFlow - v * h.inArea - relief(pPump(v));
  let v = 0;
  if (f(0) > 0) v = bisect(f, 0, h.pumpFlow / h.inArea, 80);
  if (freeSpeed > v) {
    // The load runs ahead of the pump: the filling chamber is at (about) zero pressure.
    const pp = oilPressureDrop(h.inPathArea, h.pumpFlow) + h.checkValve;
    return {
      speed: freeSpeed,
      pumpPressure: pp,
      inPressure: 0,
      outPressure: -h.opposingForce / h.outArea,
      reliefFlow: relief(pp),
      cavitation: true,
    };
  }
  if (v === 0) {
    // Stalled or at the end of the stroke: all pump flow over the relief valve.
    const pp = bisect((p) => h.pumpFlow - relief(p), 0, h.reliefSetting * 4, 80);
    return {
      speed: 0,
      pumpPressure: pp,
      inPressure: Math.max(0, pp - h.checkValve),
      outPressure: 0,
      reliefFlow: h.pumpFlow,
      cavitation: false,
    };
  }
  const pp = pPump(v);
  return {
    speed: v,
    pumpPressure: pp,
    inPressure: pIn(v),
    outPressure: pOut(v),
    reliefFlow: relief(pp),
    cavitation: false,
  };
}
