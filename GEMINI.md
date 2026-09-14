# GEMINI Instructions — Coptic Orthodox Parish Portal

## Project Identity
- **Parish**: كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود (العصافرة - الإسكندرية)
- **English Title**: Church of Saints Maximus & Domadius and St. Moses the Black — Official Parish Portal
- **Mission**: High-performance, accessible, static-first public parish portal providing instant zero-auth access to schedules, clinics, live stream, and community services.
- **Invariant INV-01**: Never couple public community services with private parish ERPs. Zero authentication required for public directories/schedules; never store confession or private welfare records.

---

## Startup Protocol (Mandatory First-Action)

Every agent session MUST execute `/memory-bank` check on start:
1. Read `memory-bank/activeContext.md` (current sprint, active focus, next immediate step).
2. Read `memory-bank/progress.md` (deliverable status, blockers, verification).
3. Read `memory-bank/systemPatterns.md` (architecture patterns, RLS policies, invariants).
4. Read `memory-bank/techContext.md` (tech stack versions, environment constraints).
5. Read `memory-bank/projectbrief.md` and `memory-bank/productContext.md`.

---

## Operating Modes & Skills Workflow

### 1. `/fable-mode` Cognitive Separation
- **Main Agent**: Master Architect & System 2 Conductor. Deliberates, verifies invariants, designs blueprints, coordinates tasks. Never writes/edits code files directly during planning phases.
- **Subagents**: Execute code authoring, file modifications, testing, and builds under clear contracts.
- **Epistemic Calibration**: Mark claims `[PROVEN]`, `[HYPOTHESIS]`, or `[UNKNOWN]`. Ground all work on live verifiable facts.

### 2. `/ask-matt` Routing & Skills Framework
- Follow the Matt Pocock skills flow:
  - Idea / Spec: `/grill-with-docs` -> `/to-spec` -> `/to-tickets`
  - Implementation: `/implement` per ticket using `/tdd` (Red-Green-Refactor) -> `/code-review`
  - Bugs / Issues: `/diagnosing-bugs` (tight feedback loop first)
  - Navigation: Query `/ask-matt` when uncertain which workflow fits the current situation.

### 3. Session Wrap-up & Memory Bank Sync
Before declaring completion:
1. Update `memory-bank/activeContext.md`.
2. Update `memory-bank/progress.md`.
3. Update architectural patterns if schemas or dependencies change.
