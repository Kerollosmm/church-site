# Domain Documentation Guidelines

This repository follows a **single-context** architecture. All domain concepts, ubiquitous language, and system-wide decisions are consolidated at the repository root.

---

## 1. Required Reading Before Exploring & Planning

Before planning or modifying any feature, agents must read:

1. **`CONTEXT.md`** at the repository root: Ubiquitous language, ecclesiastical terms, and canonical naming for the Church of Saints Maximus, Domadius, and Moses the Black.
2. **`docs/adr/`**: Architecture Decision Records detailing architectural choices, boundary definitions, and invariants.
   - Specifically: `docs/adr/0001-static-first-headless-edge-architecture.md` (Invariant INV-01).

---

## 2. File Structure: Single-Context Layout

```text
/
├── CONTEXT.md                                  # Ubiquitous domain vocabulary & canonical glossary
├── docs/
│   ├── adr/                                    # Architectural Decision Records
│   │   └── 0001-static-first-headless-edge-architecture.md
│   └── agents/                                 # Agent skill configurations
│       ├── domain.md                           # This layout specification
│       ├── issue-tracker.md                    # Issue tracker protocol
│       └── triage-labels.md                    # Canonical triage roles
├── memory-bank/                                # 6 core memory bank files
└── src/                                        # Application source code
    ├── app/                                    # Next.js App Router
    ├── components/                             # UI components
    └── lib/                                    # DB, utils, validations
```

---

## 3. Strict Domain Vocabulary Adherence

When naming components, types, database fields, routes, issue titles, or test cases:

- **Always consult `CONTEXT.md`**: Use defined canonical terms (e.g., `altars`, `clergy`, `mass_schedules`, `condolence_bookings`).
- **Never drift to colloquial synonyms**: Avoid generic terms like `events` when referring specifically to `mass_schedules`, or `users` when referring to `parishioners` or `clergy`.
- **Bilingual alignment**: Ensure Arabic UI terminology matches the liturgical and ecclesiastical standards of the Coptic Orthodox Church (Alexandria diocese).

---

## 4. Flagging ADR Conflicts

If any proposed feature or PR contradicts an existing ADR:
1. Stop immediately.
2. Surface the conflict explicitly in the plan or issue:
   > *Contradicts ADR-0001 (Decoupling public portal from internal ERP), but proposed because...*
3. Never bypass Invariant INV-01 without formal approval from the lead architect and clergy council.
