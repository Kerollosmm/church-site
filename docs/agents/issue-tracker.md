# Issue Tracker Configuration

This repository supports dual-mode issue tracking: **GitHub Issues** (for remote collaboration and CI integration via `gh` CLI) and **Local Markdown** under `.scratch/<feature-slug>/` (for offline, autonomous agent execution, and rapid local prototyping).

---

## 1. Tracker Resolution Hierarchy

1. **Remote Available & Configured**: When a Git remote points to GitHub and the `gh` CLI is authenticated (`gh auth status` returns 0), skills publish and sync tickets to **GitHub Issues**.
2. **Local / Offline / Subagent Mode**: When operating offline, without a GitHub remote, or during internal subagent execution loops, skills default to **Local Markdown** under `.scratch/<feature-slug>/`.

---

## 2. Local Markdown Issue Tracker Conventions

Issues and specs live as markdown files under `.scratch/`:

- **Feature Root**: `.scratch/<feature-slug>/`
- **Feature Specification**: `.scratch/<feature-slug>/spec.md`
- **Ticket Files**: Individual files per issue at `.scratch/<feature-slug>/issues/<NN>-<slug>.md` (numbered starting from `01`, never combined into a single file).
- **Issue Header Metadata**:
  ```markdown
  # [Issue Title]
  Status: [needs-triage | needs-info | ready-for-agent | ready-for-human | wontfix | claimed | resolved]
  Type: [feature | bug | refactor | task | research]
  Assignee: [agent | human | unassigned]
  Blocked by: [NN, NN | none]
  ```
- **Comments & Log**: Append updates to the bottom under `## Comments`.
- **Resolution**: Append final outcome under `## Resolution` and flip `Status: resolved`.

---

## 3. GitHub Issue Tracker Conventions

When using GitHub Issues via `gh` CLI:

- **Create Issue**: `gh issue create --title "..." --body "..."` (heredoc for multi-line bodies).
- **Read Issue**: `gh issue view <number> --comments` (pipe to `jq` for structured fields).
- **List Issues**: `gh issue list --state open --json number,title,body,labels,comments`.
- **Label Management**: `gh issue edit <number> --add-label "<label>"` / `--remove-label "<label>"`.
- **Comment**: `gh issue comment <number> --body "..."`.
- **Close**: `gh issue close <number> --comment "..."`.
- **PRs as Request Surface**: `PRs as a request surface: no` (external PRs are not treated as triage tickets).

---

## 4. Workflows for Engineering Skills

### A. Skill: `to-tickets`
1. Break down approved feature specs (`spec.md` or PRD section) into atomic, independently verifiable tasks.
2. If GitHub active: execute `gh issue create` with label `ready-for-agent` (or `needs-triage`).
3. If Local Markdown active: generate `.scratch/<feature-slug>/issues/01-<slug>.md`, `02-<slug>.md`, etc., with explicit dependencies in `Blocked by:`.

### B. Skill: `triage`
1. Read open issues (GitHub: `gh issue list --label needs-triage`; Local: grep `Status: needs-triage` in `.scratch/*/issues/*.md`).
2. Evaluate against project requirements and architectural invariants (INV-01).
3. Update label/status to one of the 5 canonical roles: `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

### C. Skill: `implement`
1. Identify the unblocked, highest-priority ticket labeled `ready-for-agent`.
2. Claim ticket:
   - Local: update `Status: claimed`, `Assignee: agent` in frontmatter.
   - GitHub: `gh issue edit <n> --add-assignee @me`.
3. Read referenced domain context (`CONTEXT.md`, relevant `docs/adr/`, `memory-bank/systemPatterns.md`).
4. Execute test-first implementation via subagents under strict cognitive separation.
5. Verify changes with live tests and compilation checks.
6. Resolve ticket:
   - Local: append test evidence in `## Resolution`, set `Status: resolved`.
   - GitHub: `gh issue comment <n> --body "<evidence>"`, `gh issue close <n>`.

---

## 5. Wayfinding Operations (`/wayfinder`)

- **Map Representation**:
  - Local: `.scratch/<effort>/map.md` containing Notes, Decisions-so-far, and Fog.
  - GitHub: Single tracking issue labeled `wayfinder:map`.
- **Child Tickets**:
  - Local: `.scratch/<effort>/issues/NN-<slug>.md` with `Type: research|prototype|grilling|task`.
  - GitHub: Sub-issues or child issues linked with `Part of #<map>` and labeled `wayfinder:<type>`.
- **Blocking & Frontier**:
  - Frontier consists of open, unblocked, unclaimed tickets.
  - In Local mode: scanned from `Blocked by: NN` lines where all listed prerequisites are `resolved`.
  - In GitHub mode: parsed via native issue dependencies or `Blocked by: #<n>` comments.
