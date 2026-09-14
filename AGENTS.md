# Universal Agent Instructions

## Project Identity & Context
- **Official Name**: كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود (العصافرة - الإسكندرية)
- **English Title**: Church of Saints Maximus & Domadius and St. Moses the Black — Official Parish Portal
- **Jurisdiction**: Coptic Orthodox Patriarchate of Alexandria
- **Core Mission**: High-performance, accessible, static-first public parish portal providing instant zero-auth access to divine liturgy schedules, charitable clinic rosters, live stream broadcasts, and community services.
- **Architectural Invariant INV-01**: Decouple public community services from private internal parish ERPs. Never require authentication for public directories or schedules; never store private confession or social welfare financial logs.

---

## Agent skills

### Issue tracker
Dual-mode tracking using GitHub Issues via `gh` CLI for remote collaboration, and local markdown files under `.scratch/<feature-slug>/` for autonomous tasks and offline agent execution. See `docs/agents/issue-tracker.md`.

### Triage labels
Canonical 5-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs
Single-context layout consisting of `CONTEXT.md` at the repository root alongside system architectural decisions in `docs/adr/`. See `docs/agents/domain.md`.

---

## Memory Bank Protocol & Rules

All AI agents operating in this repository must strictly maintain and synchronize with the persistent file-based **Memory Bank** (`memory-bank/*.md`):

### 1. Mandatory First-Read (Startup)
Before modifying any files or planning new tasks:
1. Read `memory-bank/activeContext.md` (active state, current priorities, next immediate step).
2. Read `memory-bank/progress.md` (what works, pending tasks, blockers).
3. Read `memory-bank/systemPatterns.md` (system architecture, schema patterns, RLS invariants).
4. Read `memory-bank/techContext.md` (tech stack versions, environment constraints).
5. Read `memory-bank/projectbrief.md` and `memory-bank/productContext.md` (scope boundaries and user workflows).

### 2. Cognitive Separation (Fable Mode)
- **Main Agent**: System 2 Master Architect. Deliberates, verifies invariants, designs blueprints, and supervises. Does not write or edit codebase files directly during planning phases.
- **Subagents**: Execute code implementation, test writing, and build repairs under explicit delegation contracts.

### 3. Epistemic Calibrations
Classify working statements rigorously:
- `[PROVEN]`: Verified by live compiler, test, or file inspection evidence.
- `[HYPOTHESIS]`: Unverified assumption; must be tested with live probes before commitment.
- `[UNKNOWN]`: Unmeasured constraint; must be investigated before proceeding.

### 4. Mandatory End-of-Task Synchronization (Completion)
Immediately upon completing any task, prior to declaring success:
1. Update `memory-bank/activeContext.md` with recent changes, current status, and next immediate step.
2. Update `memory-bank/progress.md` with updated deliverables status, verification evidence, and remaining backlog.
3. Update `memory-bank/systemPatterns.md` or `memory-bank/techContext.md` if schema, dependencies, or architectural rules changed.
