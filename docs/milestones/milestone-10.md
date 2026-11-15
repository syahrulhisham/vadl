# Milestone 10 — Integration testing, documentation and deployment

Branch `milestone-10` (from `milestone-9`). Started 15 November 2026 after the owner approved
Milestone 9. Requirements: NFR-10 (accessibility), NFR-11 (browser support), D12 (hosting),
master instruction §10–§11.

## Objectives

1. **Integration testing.** In a real browser, each of the ten laboratories runs, records a
   measurement and feeds its report, with no console error and no horizontal overflow; every
   dashboard area opens from a deep link.
2. **Cross-browser (NFR-11).** The integration pass in Chrome (Chromium), Edge, Firefox and
   Safari's engine (WebKit).
3. **Accessibility (NFR-10).** An automated WCAG 2.1 A/AA audit (axe-core) of every page type,
   with serious and critical violations fixed.
4. **Faster unit tests.** Lighter laboratory page tests (Milestone 9 open item).
5. **Deployment readiness.** A build that works from the root of a host or from a sub-folder;
   deep links on static hosts; server rules for the likely UTeM hosts; a CI workflow (not run
   until the owner pushes); no deployment until the owner chooses the host (D12).
6. **Documentation.** Student, lecturer, maintainer and deployment guides in `docs/guides/`.

## Stated limits

- Nothing is deployed and nothing is pushed: hosting (D12) and publishing are the owner's
  decisions.
- `README.md` is the owner's file and is not replaced without permission.
- The classroom projector check needs the room; the guides say what to check.

## Gate

All ten laboratories pass the integration test in every browser that can run on the
development machine; no serious or critical axe violation; a sub-folder build passes in a
browser; guides written; all checks pass.
