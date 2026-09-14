---
name: memory-bank
description: Use when starting a new session or task, loading project context, updating project documentation after completing tasks, discovering new architectural patterns, or syncing memory with the Memory Bank and mem0
---

# Memory Bank Manager

## Overview

Persistent cross-session memory and cognitive research protocol for the Google Antigravity Agent. Combines the structured file-based **Memory Bank** (`memory-bank/*.md`), semantic vector recall via **mem0 MCP**, deep source-grounded domain research via **NotebookLM MCP** (`63ddabc2-5d6c-493c-8e2d-d61271d0c4db`), and deterministic System 2 cognitive reasoning via **Fable-Engine MCP (`fable_session`)**. Ensures zero context loss, strict epistemic calibration, and zero architectural hallucination across session resets through mandatory first-read initialization, notebook source querying, Fable session lifecycle management, and end-of-task state updates.

## When to Use

- **Session / Task Startup (First Read)**: Immediately upon waking up in a new conversation or starting a task.
- **Deep Domain & Architecture Research**: When designing or validating Flutter, Supabase RLS, Postgres triggers, Edge Functions, pgTAP tests, or booking engine logic against authoritative project research notebooks.
- **System 2 Cognitive Deliberation (Fable Mode)**: When planning architecture, proving invariants, or managing refinement cycles.
- **Task Completion (End Update)**: Immediately after finishing implementation, verifying tests, or reaching a milestone.
- **Pattern Discovery**: When discovering new architectural rules, schema invariants, or debugging insights.
- **Explicit Trigger**: When the user requests `update memory bank`, `sync memory`, or queries research sources.

When NOT to use:
- Trivial one-off queries (e.g., "what time is it?", single command status checks).
- Intermediate scratch steps during active sub-task loops (update at logical milestones).

---

## Memory & Research Architecture

```
[Agent Context Reset / New Task]
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ 1. STARTUP: First-Read & Cognitive Initialization       │
│    - Read memory-bank/ core files                       │
│    - Initialize Fable session (create_session)          │
│    - Query mem0 MCP (search-memories)                   │
│    - Query NotebookLM MCP (notebook_query / source_get) │
│    - Enforce System 2 deliberation & epistemic labels   │
│      ([PROVEN] / [HYPOTHESIS] / [UNKNOWN])              │
│    - Build grounded execution plan                      │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ 2. EXECUTION: Cognitive Separation & Invariant Tracking │
│    - Main Agent: Master Architect / System 2 Conductor  │
│    - Subagents: 100% code edits & unit tests            │
│    - Apply changes test-first under delegation contracts│
│    - Track schema, RPC, or configuration shifts         │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ 3. COMPLETION: End-of-Task Synchronization              │
│    - Record refinement cycles (log_refinement_cycle)    │
│    - Update memory-bank/activeContext.md                │
│    - Update memory-bank/progress.md                     │
│    - Update relevant core/context docs                  │
│    - Persist durable insights to mem0 (add-memory)      │
└─────────────────────────────────────────────────────────┘
```

---

## Memory Bank Structure & File Roles

All memory bank files reside in `memory-bank/` at the repository root.

### Core Files (Required)

| File | Role | Update Frequency | Key Contents |
| :--- | :--- | :--- | :--- |
| `projectbrief.md` | Scope & Foundation | Rarely (scope shift) | Core problem, scope boundaries, non-negotiable goals |
| `productContext.md` | Product & UX Goals | Low | User personas, UX workflows, domain problems solved |
| `activeContext.md` | Active Development Focus | **Every Task** | Current branch, active task status, recent commits, next steps |
| `systemPatterns.md` | Architecture & Design | Medium | System architecture, component relations, design patterns, RPC/RLS invariants |
| `techContext.md` | Tech Stack & Tooling | Medium | Framework versions, CLI tooling, test runners, environment configs |
| `progress.md` | Deliverables & Work Left | **Every Task** | What works (passing test counts), what is left, known issues, blockers |

### Additional Context Files

Store specialized domain documentation in `memory-bank/<topic>.md` (e.g., `event-booking-pivot.md`, `security-invariants.md`, `testing-patterns.md`).

---

## Protocol 1: First-Read Initialization (Task Startup)

Execute this sequence **before** generating execution plans or writing code.

### Step 1.1: Verify & Scan Memory Bank Files
List and inspect `memory-bank/` files:
```powershell
# List memory bank directory
Get-ChildItem -Path "memory-bank"
```

### Step 1.2: Read Core Files
Read in order of operational priority:
1. `memory-bank/activeContext.md` — What was the immediate prior state and active focus?
2. `memory-bank/progress.md` — What works and what is currently pending?
3. `memory-bank/systemPatterns.md` — What architectural patterns and invariants must be respected?
4. `memory-bank/techContext.md` — What tools, dependencies, and environments are active?
5. `memory-bank/projectbrief.md` & `memory-bank/productContext.md` — Domain scope and UX intent.
6. Relevant specialized `memory-bank/*.md` context files.

### Step 1.3: Initialize Fable Session (`fable-engine` MCP)
Initialize a deterministic System 2 cognitive reasoning session via the `fable_session` tool:
```json
{
  "ServerName": "fable-engine",
  "ToolName": "fable_session",
  "Arguments": {
    "action": "create_session",
    "topic": "<task or feature name>",
    "target_dir": "c:/church",
    "time_budget_minutes": 30
  }
}
```

### Step 1.4: Search mem0 Vector Memory
Query semantic memory via `mem0` MCP tool to retrieve cross-session durable preferences and historical learnings:
```json
{
  "ServerName": "mem0",
  "ToolName": "search-memories",
  "Arguments": {
    "query": "<task-related keywords or domain topic>",
    "userId": "mem0-mcp-user"
  }
}
```

### Step 1.5: Query NotebookLM Research Sources
When designing or implementing features touching Flutter, Supabase RLS, triggers, pgTAP tests, or booking architecture, query the curated project research notebook (`63ddabc2-5d6c-493c-8e2d-d61271d0c4db`) via `notebooklm` MCP tools:

1. **Ask Grounded Architectural Questions**:
```json
{
  "ServerName": "notebooklm",
  "ToolName": "notebook_query",
  "Arguments": {
    "notebook_id": "63ddabc2-5d6c-493c-8e2d-d61271d0c4db",
    "query": "How to structure temporal exclusion constraints and RLS for event booking in Supabase?"
  }
}
```

2. **Retrieve Source Reference Contents**:
```json
{
  "ServerName": "notebooklm",
  "ToolName": "source_get_content",
  "Arguments": {
    "notebook_id": "63ddabc2-5d6c-493c-8e2d-d61271d0c4db",
    "source_id": "<source_id>"
  }
}
```

### Step 1.6: Enforce System 2 Deliberation & Epistemic Grounding
Classify all working propositions and assumptions explicitly before committing designs:
- `[PROVEN]`: Verified by concrete live-tool evidence (file contents, terminal commands, compiler output). Concrete evidence pointer required.
- `[HYPOTHESIS]`: Untested assumption; must be tested with empirical probes (`run_command`) before commitment.
- `[UNKNOWN]`: Unmeasured constraint; must be investigated before proceeding.
- Record epistemic claims via `fable_session` action `log_epistemic_step`.
- Enforce strict cognitive separation: Main Agent performs System 2 deliberation and invariant proofs; code edits are strictly delegated to subagents.

### Step 1.7: Synthesize Grounded State
Formulate the task strategy grounded in the retrieved memory, notebook sources, and epistemic assertions without making unverified assumptions.

---

## Protocol 2: End-of-Task Synchronization (Task Completion)

Execute this sequence **immediately after** verifying implementation tests and before reporting completion.

### Step 2.1: Audit Changes
Examine all modified and created files in the working directory:
```powershell
git status --short
```

### Step 2.2: Update `activeContext.md`
Update:
- **Current Focus & Status**: Active branch, verification status, passing test counts.
- **Recent Commits / Changes**: Exact list of deliverables created in the session.
- **Next Immediate Step**: Explicit handoff pointer for the next task/session.

### Step 2.3: Update `progress.md`
Update:
- **Current Status Overview Table**: Update component rows, test outcomes, and passing gates.
- **What Works**: Add newly completed and verified features.
- **What Is Left to Build**: Check off completed items; refine next milestone items.
- **Known Issues / Blockers**: Document unresolved items or external dependencies.

### Step 2.4: Update Secondary Core Files (If Changed)
- `systemPatterns.md`: If new RPCs, RLS rules, data models, or state machines were added.
- `techContext.md`: If new dependencies, packages, CLI flags, or scripts were configured.
- `productContext.md` / `projectbrief.md`: If domain requirements were refined.

### Step 2.5: Record Refinement Cycles & Invariants (`fable_session`)
Log completed cognitive refinement cycles and verify durable invariants via `fable-engine` MCP:
```json
{
  "ServerName": "fable-engine",
  "ToolName": "fable_session",
  "Arguments": {
    "action": "log_refinement_cycle",
    "cycle_summary": "Verified temporal GiST constraints and slot lock invariants under concurrency."
  }
}
```

### Step 2.6: Store Durable Learnings in mem0
Save high-signal architectural decisions, durable constraints, and user preferences to `mem0`:
```json
{
  "ServerName": "mem0",
  "ToolName": "add-memory",
  "Arguments": {
    "content": "<Concise durable fact, e.g.: 'Event booking uses venue/resource temporal exclusion constraints on (resource_id, tstzrange).'>",
    "userId": "mem0-mcp-user"
  }
}
```

---

## Rationalization Table & Red Flags

| Excuse / Rationalization | Reality | Mandatory Correction |
| :--- | :--- | :--- |
| "I'll update memory bank at the very end of the project." | Agent context resets between sessions. Unwritten state is permanently lost. | Update `activeContext.md` and `progress.md` at every task completion. |
| "The changes were small, no need to update memory bank." | Small unrecorded changes accumulate into architectural drift. | Record any commit, schema change, or status shift immediately. |
| "I remember everything from the conversation transcript." | Transcripts truncate; fresh subagents or new sessions start with zero active memory. | Persist state to `memory-bank/*.md` and `mem0`. |
| "mem0 search is optional if I read files." | File memory contains project state; `mem0` contains cross-session user preferences and global facts. | Always search `mem0` on task initialization. |
| "I will implement without checking NotebookLM research." | Grounded project notebooks prevent RLS/temporal exclusion regressions. | Query `notebooklm:notebook_query` for domain/technical questions. |
| "I can edit code directly without System 2 deliberation or subagent delegation." | Fable Mode mandates strict cognitive separation: Main Agent architects/proves invariants; Subagents execute 100% of code/test edits. | Enforce System 2 deliberation and delegate code/test mutations to subagents. |
| "I will assume this schema or RPC behavior without proving it." | Proceeding on unverified assumptions produces hallucinations and broken regressions. | Label as `[HYPOTHESIS]` and verify with empirical probes until `[PROVEN]`. |

### Red Flags — STOP and Sync Memory Bank
- Completing a task without editing `memory-bank/activeContext.md`.
- Claiming a feature is done without recording test metrics in `memory-bank/progress.md`.
- Adding new DB models/RPCs without updating `memory-bank/systemPatterns.md`.
- Ending a conversation without defining the **Next Immediate Step** in `activeContext.md`.
- Committing code mutations without System 2 deliberation or failing to log refinement cycles.

---

## Quick Reference

### Startup Checklist (First Read)
- [ ] Initialize Fable session (`fable_session:create_session`)
- [ ] Read `memory-bank/activeContext.md`
- [ ] Read `memory-bank/progress.md`
- [ ] Read `memory-bank/systemPatterns.md` & `memory-bank/techContext.md`
- [ ] Call `mem0:search-memories` with task topic
- [ ] Query `notebooklm:notebook_query` (`63ddabc2-5d6c-493c-8e2d-d61271d0c4db`) if technical or domain guidance needed
- [ ] Enforce System 2 deliberation & classify propositions (`[PROVEN]`, `[HYPOTHESIS]`, `[UNKNOWN]`)
- [ ] Ground plan on retrieved context

### Completion Checklist (End Update)
- [ ] Verify all tests pass (delegated to subagents)
- [ ] Record refinement cycles & durable invariants (`fable_session:log_refinement_cycle` / `verify_invariant`)
- [ ] Edit `memory-bank/activeContext.md` (branch, status, deliverables, next step)
- [ ] Edit `memory-bank/progress.md` (status table, what works, what remains)
- [ ] Edit `memory-bank/systemPatterns.md` (if schema/RPCs changed)
- [ ] Call `mem0:add-memory` with new architectural rules/preferences
- [ ] Commit memory bank updates alongside code changes

