---
title: "Church Site Memory Bank — Map of Contents"
aliases: ["Index", "MOC", "Dashboard", "Memory Bank Root"]
tags:
  - "#memory-bank"
  - "#moc"
  - "#dashboard"
  - "#status/active"
version: "2.0"
last_updated: 2026-09-26
---

# 🏛️ Church Site Memory Bank — Map of Contents (MOC)

> [!info] Project Identity
> **Parish**: كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود (العصافرة - الإسكندرية)
> **English**: Church of Saints Maximus & Domadius and St. Moses the Black — Official Parish Portal
> **Jurisdiction**: Coptic Orthodox Patriarchate of Alexandria
> **Core Architectural Invariant**: [[INV-01 Zero-Auth Invariant|INV-01 Zero-Auth Public Access]]

Welcome to the Obsidian-connected **Memory Bank** for the Church of Saints Maximus & Domadius and St. Moses the Black web portal and administration platform.

---

## 🧭 Core Memory Bank Documents

| Note | Focus Area | Status | Key Topics |
| :--- | :--- | :--- | :--- |
| [[Active Context]] | Current Sprint & Git State | `#status/active` | Commit `07b179e`, 65/66 TestSprite pass, clean secrets |
| [[Progress & Deliverables]] | Implementation & Verification Status | `#status/verified` | Vitest 638/638, Web 26/27, Admin 39/39, gates |
| [[System Patterns]] | Master Architecture & Invariants | `#status/approved` | 42 Master patterns, static-first, security headers |
| [[Tech Context]] | Tooling, Dependencies & Runtimes | `#status/current` | Next.js 15, Supabase, pnpm monorepo, Node 22 |
| [[Project Brief]] | High-Level Scope & Purpose | `#status/approved` | Vision, audience, non-negotiable boundaries |
| [[Product Context]] | UX Principles & User Personas | `#status/approved` | RTL-first, Cairo time, accessibility, persona journeys |

---

## 📐 Deep Architectural Topics

Specialized architectural deep dives for core modules, security protocols, and persistence systems:

- **Security & Boundaries**:
  - [[INV-01 Zero-Auth Invariant]] — Strict isolation between public zero-auth services and private parish records.
  - [[External Assets & Security Headers]] — Host allowlisting, AssetResolver, SSRF prevention, and strict CSP.
  - [[Audit Trail & Compliance]] — Immutable `audit_log`, RFC-4180 UTF-8 BOM CSV exports, and actor tracking.

- **Data & Storage**:
  - [[Dual-Driver Storage & Repositories]] — Seamless duality between local JsonStore (v1–v5) and Supabase PostgreSQL.
  - [[Database Migrations & Security Hardening]] — Full catalog of the 20 Supabase migrations, RPC hardening, and RLS InitPlan.

- **Monorepo & Verification**:
  - [[Monorepo Architecture]] — Package boundaries across `apps/web`, `apps/admin`, `packages/domain`, `packages/data-access`, `packages/ui`.
  - [[TestSprite Quality Gates]] — E2E test suites, local tunnel orchestration, and multi-tier quality gates.

---

## 🗄️ Historical Archive

Historical audit logs, sprint summaries, and retired evidence files:

- [[Archive/Progress History 2026-09-22|Progress History (2026-09-22)]] — Milestone history prior to monorepo refactoring.
- [[Archive/QA Evidence 2026-09-22|QA Evidence Archive (2026-09-22)]] — Playwright / TestSprite raw terminal traces and screenshot manifests.

---

## 🔄 Memory Bank Operating Rules

> [!important] Mandatory Maintenance Protocols
> 1. **First-Read Rule**: Every agent session MUST read [[Active Context]], [[Progress & Deliverables]], and [[System Patterns]] before taking actions.
> 2. **Cognitive Separation**: System 2 architect deliberation remains separate from subagent code execution.
> 3. **End-of-Task Sync**: Every completed milestone MUST update [[Active Context]] and [[Progress & Deliverables]] with exact verification metrics.
> 4. **Epistemic Calibration**: All working claims must be labeled `[PROVEN]`, `[HYPOTHESIS]`, or `[UNKNOWN]`.

---
*Maintained by the Antigravity System 2 Architecture Conductor & Engineering Subagents.*
