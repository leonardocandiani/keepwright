# Epistemic Hierarchy P1–P5

When two sources contradict, the highest one wins. Classic inversion: **code (P5) never refutes a symptom reported by the maintainer (P1)**. If they contradict, the code is wrong.

## Hierarchy

| Level | Source | When it wins |
|---|---|---|
| **P1** | Symptom reported by the maintainer or user (screenshot, pasted log, transcript, direct description of what they saw) | Above everything. If they saw it happen, it happened. |
| **P2** | Production logs (server/platform logs, execution history, external service dashboard) | Above P3-P5. Logs are the reality of the running system. |
| **P3** | Database state (current snapshot of the relevant tables) | Truth of the current snapshot. Above P4-P5. |
| **P4** | Source code | What **should** happen. Can be wrong. |
| **P5** | Audit via parser/static analysis / abstract reading of the code | Inference about the code. Weaker than P4 (which is the real code). |

## Practical examples

### ❌ WRONG — P5 refutes P1
> Maintainer: "the Save button doesn't respond when the form has 2 or more attachments"
> Me (P5): "I looked at the submit handler and it handles attachments, so it can't happen"

P1 wins. Find out **why** the handler failed in this case. Hypotheses: payload limit, race with the upload, validation that blocks silently, state not propagated, etc.

### ✅ RIGHT — descending investigation
P1 (maintainer saw it) → P2 (server logs at the moment of the click) → P3 (record persisted in the DB) → P4 (handler line that produced it) → fix.

### ❌ WRONG — assuming P3 when P2 shows something else
DB says `status=processed`, logs show the previous job threw an exception and the status should have become `failed`. P2 > P3 — the DB is stale, the logs are authoritative.

## Applying it to code

Before claiming "this can't happen because code X does Y":
1. Check whether the maintainer tested it (P1) and what they saw
2. Check the logs (P2)
3. Check the database (P3)
4. Only **then** appeal to the code (P4)
5. Never appeal to abstract inference (P5) without corroboration

## Applying it to debugging

When a bug is reported:
- Ask **what the maintainer saw** (P1) before diving into the code
- Reproduce with logs (P2)
- Check the database state before and after (P3)
- Locate the line in the code (P4)

Jumping to P5 ("I looked at the code and it looks OK") is like concluding a patient is healthy without examining them, just reading the chart.
