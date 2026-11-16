# Milestone 11 — Concepts from the owner's earlier interactive labs

Branch `milestone-11` (from `main` at `80e3303`). Started 16 November 2026 at the owner's
instruction ("complete all at once") after a comparison of VADL with five earlier single-file
HTML labs by the owner.

## Design references

The owner's earlier labs, kept outside the repository and used for their teaching concepts only.
No code was copied: those files mix physics and drawing in one script, while VADL keeps physics in
the simulation core with hand-worked reference cases.

- Shunt-Wound DC Motor: Operating Principle
- Separately Excited DC Motor: Operating Principle
- Single-Phase DC Drive Interactive Simulator (V3)
- Actuators and Drives — Stepper & Servo Virtual Laboratory (and an earlier stepper-only version)

## Objectives

| #   | Concept                                                                             | Where               |
| --- | ----------------------------------------------------------------------------------- | ------------------- |
| 0   | Correct the D3 record: earlier simulator files exist                                | `docs/decisions.md` |
| 1   | Operating-principle sequence: eight steps from field current to back-emf            | M01, new view       |
| 2   | Construction explorer: choose a part, see it highlighted and described              | M01, M04, M05       |
| 3   | Encoder decoding X1/X2/X4 and a resolver with an n-bit converter as feedback        | M05                 |
| 4   | Two-phase hybrid stepper: Sa = 360°/(4·Nr)                                          | M04                 |
| 5   | Drive waveforms: instantaneous va and ia, conducting devices, discontinuous current | M01, new view       |
| 6   | Dual converter modes, overhauling load (regeneration) and operating quadrant        | M01, same view      |
| 7   | AC two-phase servo motor (linearised)                                               | M05                 |

## Rules kept

- Every new equation has a comment block, a hand-worked reference case written before its test,
  and literal expected values.
- The operating-principle drawing is illustrative and says so; the numbers beside it are outputs
  of the laboratory's model. No value is read from an animation.
- Items 4 to 7 depend on lecturer questions that are still open (L-5, L-13, L-15, L-16). They are
  built as labelled extensions, as the PI and PID servo options already are.
- Each laboratory keeps exactly seven regions.

## Stated limits

- The drive-waveform view is a periodic steady state at the present speed, not a transient
  simulation; the laboratory's dynamic model still uses the average converter voltage.
- The AC servo is the linearised textbook model.
- No new assessment questions were added for these features.
- Nothing is deployed. The classroom projector check is still outstanding.

## Gate

All seven concepts work in the laboratories with reference tests, interface tests and browser
tests; all existing checks pass.
