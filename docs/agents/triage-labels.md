# Triage Labels

The engineering skills speak in terms of five canonical triage roles. This file maps those roles to the exact label strings used across this repository's issue tracker (both GitHub and local markdown tickets).

| Label in Engineering Skills | Label in Our Tracker | Meaning |
| :--- | :--- | :--- |
| `needs-triage` | `needs-triage` | Maintainer / lead architect needs to evaluate this issue |
| `needs-info` | `needs-info` | Waiting on reporter or priest/servant council for domain clarification |
| `ready-for-agent` | `ready-for-agent` | Fully specified and bounded, ready for an autonomous agent to implement |
| `ready-for-human` | `ready-for-human` | Requires human implementation, sensitive pastoral decision, or manual secret handling |
| `wontfix` | `wontfix` | Will not be actioned, out of scope, or violates architectural invariants (e.g. ERP creep) |

---

## Usage Rules

1. **Role Resolution**: When an engineering skill mentions a canonical triage role (e.g., "apply the AFK-ready triage label"), apply the string from the "Label in Our Tracker" column.
2. **Local Markdown Representation**: In `.scratch/<feature>/issues/<NN>-<slug>.md`, write `Status: <Label in Our Tracker>`.
3. **GitHub Issue Representation**: Use `gh issue edit <number> --add-label "<Label in Our Tracker>"`.
4. **Invariant Protection**: Any issue proposing to store sensitive private confession data, complex secret parish finances, or requiring mandatory user login for public liturgy/clinic schedules must be triaged as `wontfix` to protect Invariant INV-01.
