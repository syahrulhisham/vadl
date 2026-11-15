# Reference cases RC-M07-01 to RC-M07-04: cam and follower

| Field            | Value                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| Module           | M07 – Cam and Follower                                                             |
| Source of case   | LN Ch3 Part I p23–29 (uniform velocity); RC-M07-02 to -04 are extensions (L-19)    |
| Course alignment | Displacement diagram: follower displacement (mm) against cam angle, 30° increments |
| Worked by        | Hand calculation, 15 November 2026                                                 |
| Status           | Tests: `tests/reference/cam-follower.test.ts`                                      |

## Motion laws over a segment of angle β and lift h (x = (θ − θ0)/β, 0 ≤ x ≤ 1)

| Law                              | s(x)                                    | ds/dθ              | d²s/dθ²              |
| -------------------------------- | --------------------------------------- | ------------------ | -------------------- |
| Uniform velocity (course)        | h·x                                     | h/β                | 0 (infinite at ends) |
| Simple harmonic (extension)      | (h/2)(1 − cos πx)                       | (πh/2β) sin πx     | (π²h/2β²) cos πx     |
| Uniform acceleration (extension) | 2h·x² (x ≤ ½); h[1 − 2(1 − x)²] (x > ½) | 4hx/β; 4h(1 − x)/β | ±4h/β²               |
| Cycloidal (extension)            | h[x − sin(2πx)/(2π)]                    | (h/β)(1 − cos 2πx) | (2πh/β²) sin 2πx     |

Return segments use s = h − s_rise(x). Follower velocity v = (ds/dθ)·ω and acceleration
a = (d²s/dθ²)·ω² for a cam turning at constant ω.

## RC-M07-01 — uniform velocity, 30 mm rise over 180°, return over 180° (LN Ch3 Part I p27–29)

- Rate of rise 30/180 = **0.166667 mm per degree**.
- Displacement at 30° steps: 0°: **0**, 30°: **5**, 60°: **10**, 90°: **15**, 120°: **20**,
  150°: **25**, 180°: **30** mm; return 210°: **25**, … 330°: **5**, 360°: **0** mm.
- At 60 rpm (ω = 2π rad/s) the follower rises at (h/β)·ω = (0.03/π)·2π = **0.06 m/s**.

## RC-M07-02 — other laws at one point (extension)

h = 30 mm, β = 180°:

- Simple harmonic at 60° (x = ⅓): s = 15(1 − cos 60°) = **7.5 mm**.
- Uniform acceleration at 45° (x = ¼): s = 2 × 30 × (¼)² = **3.75 mm**; at 135° (x = ¾):
  30[1 − 2(¼)²] = **26.25 mm**.
- Cycloidal at 45° (x = ¼): s = 30[0.25 − sin(π/2)/(2π)] = **2.72535 mm**.
- At 60 rpm: peak velocity SHM (πh/2β)ω = **0.0942478 m/s**; uniform acceleration and
  cycloidal 2(h/β)ω = **0.12 m/s**; peak SHM acceleration (π²h/2β²)ω² = **0.592176 m/s²**.

## RC-M07-03 — rise, dwell, return, dwell

Rise 20 mm over 120°, dwell 60°, return over 90°, dwell for the remaining 90°, uniform velocity:
at 60°: **10 mm**; 150°: **20 mm** (dwell); 210°: 20 − 20 × 30/90 = **13.3333 mm**;
300°: **0** (dwell).

## RC-M07-04 — profile and pressure angle (extension)

Base circle Rb = 40 mm, roller Rr = 10 mm, case RC-M07-01 at θ = 90°: s = 15 mm,
ds/dθ = 30/π = 9.54930 mm/rad. Radial roller follower: tan φ = (ds/dθ)/(Rb + Rr + s) =
9.54930/65 → pressure angle φ = **8.35767°**.

Profile checks (exact geometry, used as invariants in the tests):

- Knife-edge: the profile radius at the contact angle is Rb + s.
- Roller: every profile point lies Rr from the pitch curve (radius Rb + Rr + s).
- Flat-faced: the profile's extent along the follower axis equals Rb + s at every angle.

## Tolerances

Laws: relative 1e−9. Profile invariants: 0.01 mm with 720 profile points.
