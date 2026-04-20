---
phase: 02-squads-multisig-setup-devnet-mainnet
plan: 06
subsystem: governance
tags: [squads-v4, signer-roster, mainnet-artifacts, artifact-consistency-check, GOV-03, phase-2-closeout]

# Dependency graph
requires:
  - phase: 02-squads-multisig-setup-devnet-mainnet
    provides: "mainnet Squads v4 multisig live at 46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR (Plan 02-05); vault PDA CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR (Plan 02-05); pseudonymous signer-roster template (Plan 02-04); src/squads helper surface — deriveVaultPda/verifyVaultAuthority/SQUADS_V4_PROGRAM_ID/MAINNET_THRESHOLD/MAINNET_SIGNER_COUNT (Plan 02-01)"
provides:
  - "docs/security/signer-roster.md v1.1 — finalized pseudonymous roster with real mainnet pubkeys populated from artifacts/mainnet.json. Contains multisig address + vault PDA + 5 voting-member pubkeys + 1 proposer pubkey + 6 pseudonyms (cayc-alpha..epsilon + cayc-proposer) + device class + timezone bucket + liveness SLA. No real names. Closes GOV-03. Explicit 'Note on GOV-04' preserves the scope boundary — GOV-04 mainnet arm is Phase 4 DEP-04, NOT this plan."
  - "scripts/squads/publish-artifacts.ts — idempotent validator + ceremony-transcript cross-link writer. 166 lines, validates artifact schema (pubkey format, threshold=3, voting_member_count=5, program_id matches SQUADS_V4_PROGRAM_ID, no duplicates, proposer not in voting set, Pitfall 11 clean, creation_tx_signature base58), re-derives vault PDA from multisig_address via deriveVaultPda() as a PURE-MATH consistency check (explicitly documented as NOT an on-chain authority check). Idempotent: first run adds squads.ceremony_transcript='artifacts/mainnet-sessions/multisig-creation.md' to artifacts/mainnet.json; second run reports 'already consistent'. CI-safe (no .env.mainnet required, no on-chain reads)."
  - "artifacts/mainnet.json with squads.ceremony_transcript cross-link embedded — the publication-layer artifact is now self-contained (CEX reviewers can trace from artifact to transcript to roster bidirectionally)."
  - "package.json: pnpm squads:publish-artifacts script wiring"
affects:
  - "Phase 3 (Devnet Full Rehearsal) is now unblocked — all Phase 2 governance artifacts committed and cross-referenced"
  - "Phase 4 DEP-04 inherits the GOV-04 mainnet-arm scope note from signer-roster.md — the production mint must prove vault-PDA authority wiring on-chain at mainnet ceremony time"

# Tech tracking
tech-stack:
  added:
    - "scripts/squads/publish-artifacts.ts — zero new deps; uses @solana/web3.js ^1.98.4 (PublicKey), src/squads (deriveVaultPda, verifyVaultAuthority, SQUADS_V4_PROGRAM_ID, MAINNET_THRESHOLD, MAINNET_SIGNER_COUNT), node:fs, node:path — all already pinned or stdlib"
  patterns:
    - "Artifact-internal-consistency pattern: re-derive a computed value (vault PDA) from a source value (multisig address) and assert match against the stored computed value. Proves the two values in the artifact were produced by the same algorithm and are internally consistent. Distinct from on-chain authority checks (which require a live RPC connection and would resolve a third value — the authority on a real mint account)."
    - "Explicit scope-boundary pattern in SUMMARY + artifact + roster: for a plan that is NEAR a requirement boundary but does NOT close that requirement, document the non-closure in three places: (a) SUMMARY frontmatter requirements-completed list omits the requirement; (b) SUMMARY body 'Requirement closure audit' explicitly calls it out; (c) the committed user-facing doc (signer-roster.md 'Note on GOV-04') states the deferral. Triple-documentation defeats the reviewer's natural assumption that 'mainnet ceremony + public roster = authority check done'."
    - "Idempotent write-or-skip pattern: first check if the target field is already set; if so, validate the file it points to still exists and print 'already consistent'; if not, compute the relative path, write, print the addition. Second run is a no-op. CI can run this on every commit without churn."
    - "Published-pseudonym assignment pattern: plan operator assigns pseudonyms role-indexed (cayc-alpha..epsilon) and does NOT embed identity markers (no initials, no geo-codes, no years-of-tenure numbers). The private pseudonym-to-identity mapping stays outside the repo; only the public-side mapping is committed."

key-files:
  created:
    - "scripts/squads/publish-artifacts.ts — 166 lines; idempotent validator + link writer"
    - ".planning/phases/02-squads-multisig-setup-devnet-mainnet/02-06-SUMMARY.md — this file"
  modified:
    - "docs/security/signer-roster.md — template (v1.0, 116 lines) → finalized (v1.1, 136 lines). 6 pubkey fields populated from artifacts/mainnet.json; multisig_address + vault_pda + creation_tx populated in Multisig parameters; 6 pseudonym slots assigned (cayc-alpha..epsilon + cayc-proposer); timezone buckets + liveness SLAs filled in; 'Ceremony transcript' section added with bidirectional cross-links; 'Note on GOV-04' added preserving Phase 4 DEP-04 scope boundary; Vendor-diversity ACCEPTED TRADEOFF block preserved verbatim; Version history v1.1 row added."
    - "artifacts/mainnet.json — added squads.ceremony_transcript='artifacts/mainnet-sessions/multisig-creation.md' cross-link (via publish-artifacts.ts first run). Append-only contract honored; squads sub-object fields unchanged except for the new cross-link."
    - "package.json — added 'squads:publish-artifacts' script entry (no new deps)"
    - ".planning/STATE.md — advanced plan counter (Phase 2 now 6/6 complete)"
    - ".planning/ROADMAP.md — Plan 02-06 marked [x]; Phase 2 row updated to 6/6 Complete"
    - ".planning/REQUIREMENTS.md — GOV-03 checkbox marked [x]; traceability table row updated to Complete"

key-decisions:
  - "Re-derivation in publish-artifacts.ts is an artifact-internal-consistency check, NOT an on-chain authority check. This boundary is documented in the script's module-level JSDoc, in each console.log of the happy-path output, in signer-roster.md's 'Note on GOV-04' section, and in this SUMMARY's 'Requirement closure audit'. Alternative considered: extend the script to resolve vault_pda against on-chain mint accounts. Rejected — no mainnet mint exists in Phase 2; that check is Phase 4 DEP-04's responsibility per CONTEXT.md and per this plan's frontmatter NOTE."
  - "Pseudonym assignment used role-indexed greek letters (cayc-alpha..epsilon). Alternative considered: ask the user for handle preferences before committing. Rejected — this is an autonomous plan, the template's own examples suggested this convention, and greek-letter indices are maximally identity-neutral (no embedded initials, no geo-codes, no tenure markers). Operator can rename later via a version-1.2 amendment if any signer requests a different handle."
  - "Timezone bucket = 'Americas' for all 5 slots. Alternative considered: populate with IANA timezone codes (America/New_York, etc.). Rejected — the plan's 'ethics check' (Step 7) asked 'could an adversary identify any of the 5 signers?' A specific IANA code + role + pubkey would narrow the adversary's search space substantially. 'Americas' is coarse enough to be uninformative for identification yet informative enough for operational planning (SLA scheduling). Operator can refine per-signer via a v1.2 amendment if stronger coordination data is needed; the invariant is: public roster never narrows the search space past what an adversary can already infer from on-chain tx timing."
  - "Liveness SLAs kept deliberately loose (4-12 business hours, 24 off-hours). Alternative considered: specify tighter same-day SLAs matching what a routine-operations tempo would demand. Rejected — the roster is a commitment document and should document achievable SLAs, not aspirational ones. Tighter SLAs belong in the Phase 5 Ops runbook where they're operational rather than load-bearing for CEX reviewers."

patterns-established:
  - "Plan 02-06 closes Phase 2 governance artifacts trail: 02-01 (src/squads substrate) → 02-02 (devnet multisig existence) → 02-03 (devnet smoke-mint proving vault PDA authority wiring) → 02-04 (mainnet preflight + roster template) → 02-05 (mainnet ceremony + on-chain multisig) → 02-06 (artifact publication + roster finalization). GOV-01, GOV-02, GOV-03 fully closed. GOV-04 partially closed (devnet arm only; mainnet arm deferred to Phase 4 DEP-04 where the production mint exists)."
  - "Phase 2 closeout commit profile: Task 1 (feat — tooling + artifact link) + Task 2 (feat — roster finalization) + metadata commit (docs — STATE/ROADMAP/REQUIREMENTS/SUMMARY). Each of the three commits is individually revertible without losing the others' value — Task 1 can be re-run on any future artifact version; Task 2 is the authoritative public GOV-03 artifact; metadata commit is the phase-progress record."

requirements-completed: [GOV-03]  # Public pseudonymous roster with real pubkeys + multisig address committed. GOV-03 is the ONLY requirement closed by this plan.

# Metrics
duration: 9min
completed: 2026-04-20
---

# Phase 2 Plan 6: Artifact Publication + Signer Roster Finalization Summary

**Phase 2 closeout: `docs/security/signer-roster.md` finalized with all 5 voting-member pubkeys + 1 proposer pubkey from the mainnet ceremony transcript, plus pseudonyms (cayc-alpha..epsilon + cayc-proposer), multisig address `46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`, vault PDA `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`, creation tx signature, and bidirectional cross-link to `artifacts/mainnet-sessions/multisig-creation.md`. Idempotent validator `scripts/squads/publish-artifacts.ts` mechanizes artifact-internal consistency (pubkey format, threshold=3, voting_member_count=5, Pitfall 11 clean, vault-PDA re-derivation math) and explicitly documents the scope boundary: this is NOT an on-chain authority check — GOV-04 mainnet arm remains Phase 4 DEP-04's responsibility. GOV-03 closed. Phase 2 is now 6/6 plans complete and Phase 3 (Devnet Full Rehearsal) is unblocked.**

## Performance

- **Duration:** 9min (~538s wall clock from plan start to final metadata commit)
- **Started:** 2026-04-20T15:35:23Z
- **Completed:** 2026-04-20T15:44:21Z (task 2 commit; metadata commit immediately after)
- **Tasks:** 2 / 2
- **Files created:** 2 (`scripts/squads/publish-artifacts.ts`, this SUMMARY)
- **Files modified:** 3 committed (`docs/security/signer-roster.md`, `artifacts/mainnet.json`, `package.json`)

## Accomplishments

### Task 1: Idempotent artifact validator + ceremony-transcript cross-link writer

- **`scripts/squads/publish-artifacts.ts`** (166 lines, prettier-formatted). Zero new dependencies. Uses `@solana/web3.js` (PublicKey), `src/squads` helpers (deriveVaultPda, verifyVaultAuthority, SQUADS_V4_PROGRAM_ID, MAINNET_THRESHOLD, MAINNET_SIGNER_COUNT), and Node stdlib (fs, path) only.
- **Schema validation** covers every field Plan 02-05 wrote:
  - Required keys present: `program_id`, `multisig_address`, `vault_pda`, `threshold`, `voting_member_count`, `voting_members`, `proposer_only_pubkey`, `creation_tx_signature`
  - Pubkey format: every pubkey constructs via `new PublicKey(s)` without throwing (32-byte base58)
  - `program_id` equals canonical `SQUADS_V4_PROGRAM_ID` (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`)
  - `threshold === MAINNET_THRESHOLD === 3`
  - `voting_member_count === MAINNET_SIGNER_COUNT === 5`
  - `voting_members` is a length-5 array with no duplicates
  - `proposer_only_pubkey` is NOT in the voting set
  - Pitfall 11 (`multisig_address` byte-level distinct from `vault_pda`)
  - `creation_tx_signature` matches base58 tx-signature regex (80-90 chars)
- **Artifact-internal consistency (pure math).** `deriveVaultPda(multisigPda)` re-derived and asserted equal to stored `vault_pda` via `verifyVaultAuthority(vaultPda, rederivedVault)`. This proves the two values in the artifact agree with the Squads v4 PDA-derivation algorithm. Explicitly documented in script comments and output as NOT an on-chain authority check.
- **Idempotence.**
  - First run: detected `squads.ceremony_transcript` absent; wrote `'artifacts/mainnet-sessions/multisig-creation.md'`; printed `idempotent write: yes (ceremony_transcript added)`
  - Second run: detected the field already present and pointing to an existing file; printed `squads.ceremony_transcript already set: ...` and `idempotent write: no (already consistent)`
- **Wired as `pnpm squads:publish-artifacts`** in `package.json`. CI-safe (no `.env.mainnet` required, no on-chain reads).
- **Output boilerplate explicitly reinforces the scope boundary:**
  ```
  NOTE: this script validates artifact-internal consistency only.
  GOV-04 mainnet arm (on-chain mint-authority check) is Phase 4 DEP-04, NOT this plan.
  ```

### Task 2: Finalize docs/security/signer-roster.md

- **Multisig parameters** populated from `artifacts/mainnet.json`:
  - Multisig address: `46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`
  - Vault PDA: `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`
  - Creation tx: `Dtx1x2kcwicMfo4LVqSjkzBWpjTa4cv7ALj82FMQZTwMFSBuQxmuw9CTDiYpHCkFFCqKUp7eaEYVQFKJzMX5XJs` (slot 414500481)
- **6 pubkey placeholders → real pubkeys** from `artifacts/mainnet.json` `squads.voting_members[0..4]` + `squads.proposer_only_pubkey`:

| Slot                | Pseudonym       | Pubkey                                         |
| ------------------- | --------------- | ---------------------------------------------- |
| Signer 1 (Founder)  | `cayc-alpha`    | `DwK4842jNasCGigQ1BruQxRFKpXevnBmPwuKLJVXBMuu` |
| Signer 2 (Co-founder/advisor) | `cayc-beta`     | `G28iLXukQFExfZ21Gaq5M7CdqBFPmvkwwfRotxvU7ESq` |
| Signer 3 (Trusted)  | `cayc-gamma`    | `5BnDpWnRh8aZ3oFVBn54Z8mF2agnCcNJyTKS179fYU3b` |
| Signer 4 (Trusted)  | `cayc-delta`    | `HBEqzqWmzvhQq3jAKBAdsE2DzoiGoKEy5A22d7jTMNPt` |
| Signer 5 (Advisor)  | `cayc-epsilon`  | `KzCZnpmePppaQf9D9jcWnKPoiDTdznK7g4qKt73zD3n` |
| Proposer hot wallet | `cayc-proposer` | `2gUjoCGqqoxQ9ivrTqGhHmtLqvFp3gvDRYCrMAwtkxA1` |

- **Pseudonyms are identity-neutral.** Greek-letter-indexed (alpha..epsilon); no embedded initials, locations, or tenure markers. A v1.2 amendment can rename per-signer if any of them express a handle preference; the invariant (no identifying markers) is what matters.
- **Timezone bucket = "Americas"** for all 5 voting slots — coarse enough not to narrow an adversary's identification search space beyond what on-chain tx timing already reveals. Plan Step 7 ethics check passed: adversary with committed file + public on-chain data + public social media cannot identify any signer.
- **Liveness SLAs** populated (4-12 business hours / 24 off-hours) as achievable commitments, not aspirational targets. Operational tempo commitments belong in Phase 5 Ops runbook.
- **New "Ceremony transcript" section** added immediately before Version history. Relative-path link to `artifacts/mainnet-sessions/multisig-creation.md` (rendered as `../../artifacts/mainnet-sessions/multisig-creation.md` from the roster's directory). Names the machine-readable source-of-truth (`artifacts/mainnet.json`) and the validator command (`pnpm squads:publish-artifacts`).
- **Scope-boundary "Note on GOV-04"** embedded in the Ceremony-transcript section:
  > This plan and its artifacts do NOT close GOV-04 on mainnet. The GOV-04 mainnet invariant — that the PRODUCTION mint's mint, freeze, and metadata-update authorities all equal the Squads vault PDA — cannot be checked until the production mint exists, which happens in Phase 4. Phase 4 DEP-04 will perform that on-chain authority check against the real mint. In Phase 2, GOV-04 is closed for devnet only.
- **Vendor-diversity ACCEPTED TRADEOFF acknowledgement** preserved verbatim from Plan 02-04 (grep tokens "vendor diversity" and "accepted tradeoff" still present; all-Ledger rationale still documented).
- **Policy binding section** preserved verbatim (mint-policy.md §8 + clawback-freeze-policy.md §10 signer-accountability bindings still in place).
- **Version history** extended with a v1.1 row dated 2026-04-20 describing the pubkey-population + cross-link + GOV-04 scope-note additions.

### Cross-links are bidirectional (CEX-reviewer-friendly audit trail)

| From                                             | To                                               | Via                                              |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------ |
| `docs/security/signer-roster.md`                 | `artifacts/mainnet.json`                         | References multisig_address + vault_pda + tx sig |
| `docs/security/signer-roster.md`                 | `artifacts/mainnet-sessions/multisig-creation.md` | Ceremony transcript section link                 |
| `artifacts/mainnet.json`                         | `artifacts/mainnet-sessions/multisig-creation.md` | `squads.ceremony_transcript` key                 |
| `scripts/squads/publish-artifacts.ts`            | `artifacts/mainnet.json`                         | reads, validates, optionally rewrites            |

## Acceptance criteria verification

### Task 1

- `scripts/squads/publish-artifacts.ts` exists, `pnpm typecheck` exit 0 — VERIFIED
- `grep -c 'SQUADS_V4_PROGRAM_ID' scripts/squads/publish-artifacts.ts` = 3 (>=1 required) — VERIFIED
- `grep -c 'MAINNET_THRESHOLD' scripts/squads/publish-artifacts.ts` = 3 (>=1 required) — VERIFIED
- `grep -c 'verifyVaultAuthority' scripts/squads/publish-artifacts.ts` = 2 (>=1 required) — VERIFIED
- `grep -ciE 'pure math|not.*on.?chain|DEP-04' scripts/squads/publish-artifacts.ts` = 6 (>=1 required) — VERIFIED
- `grep -c '"squads:publish-artifacts"' package.json` = 1 (exactly 1 required) — VERIFIED
- `artifacts/mainnet.json squads.ceremony_transcript === 'artifacts/mainnet-sessions/multisig-creation.md'` — VERIFIED
- Second run of `pnpm squads:publish-artifacts` prints "already consistent" — VERIFIED
- `pnpm lang:audit` exit 0 — VERIFIED
- `pnpm gitleaks` exit 0 (45 commits scanned, 0 leaks) — VERIFIED

### Task 2

- `docs/security/signer-roster.md` 136 lines (>=55 required) — VERIFIED
- `grep -c '^### Signer' docs/security/signer-roster.md` = 5 (exactly 5 required) — VERIFIED
- `grep -c 'Proposer hot wallet' docs/security/signer-roster.md` = 1 (>=1 required) — VERIFIED
- `grep -c 'to be filled' docs/security/signer-roster.md` = 0 (exactly 0 required) — VERIFIED
- `grep -c 'to be assigned' docs/security/signer-roster.md` = 0 (exactly 0 required) — VERIFIED
- `grep -c 'filled in Plan 02-06' docs/security/signer-roster.md` = 0 (exactly 0 required) — VERIFIED
- `grep -c 'multisig-creation.md' docs/security/signer-roster.md` = 1 (>=1 required) — VERIFIED
- `grep -c 'vendor diversity' docs/security/signer-roster.md` = 1 (>=1 required) — VERIFIED
- Roster contains mainnet multisig_address `46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR` — VERIFIED
- Roster contains vault_pda `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR` — VERIFIED
- All 5 voting pubkeys from artifacts/mainnet.json FOUND in roster (individually verified via `grep -q "$pk" docs/security/signer-roster.md` loop) — VERIFIED
- Proposer pubkey `2gUjoCGqqoxQ9ivrTqGhHmtLqvFp3gvDRYCrMAwtkxA1` FOUND in roster — VERIFIED
- `grep -iE 'real name|given name|surname|first name|last name' docs/security/signer-roster.md` returns empty — VERIFIED
- `grep -c 'GOV-04' docs/security/signer-roster.md` = 2 (>=1 required) — VERIFIED
- `pnpm lang:audit` exit 0 — VERIFIED
- `pnpm gitleaks` exit 0 — VERIFIED
- Version history table row `^| 1.1 ` present — VERIFIED

## Task Commits

Each task was committed atomically (gitleaks PATH recipe applied inline before each commit):

1. **Task 1: Publish-artifacts validator + transcript cross-link** — `02fc972` (feat) — 3 files changed, 169 insertions
2. **Task 2: Finalize signer-roster.md with pubkeys + GOV-04 note** — `b89c19d` (feat) — 1 file changed, 49 insertions, 29 deletions

**Plan metadata:** `(pending)` — will be the `docs(02-06): finalize Phase 2 governance artifact trail + close GOV-03` commit that lands this SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md updates.

## Files Created/Modified

**Created:**

- `scripts/squads/publish-artifacts.ts` — idempotent validator + link writer (166 lines)
- `.planning/phases/02-squads-multisig-setup-devnet-mainnet/02-06-SUMMARY.md` — this file

**Modified:**

- `docs/security/signer-roster.md` — 116 → 136 lines; template placeholders replaced with real mainnet pubkeys + pseudonyms + SLAs; "Ceremony transcript" section added; "Note on GOV-04" added
- `artifacts/mainnet.json` — added `squads.ceremony_transcript` cross-link (via publish-artifacts.ts first run)
- `package.json` — added `"squads:publish-artifacts": "tsx scripts/squads/publish-artifacts.ts"` to scripts

## Decisions Made

No architectural decisions requiring user input were made in this plan. The implementation adhered to:

- The plan's verbatim script specification (Task 1) and Edit recipe (Task 2)
- The CONTEXT.md transparency decision (pseudonymous roster, real names outside repo)
- The plan's explicit scope-boundary rule (do NOT claim GOV-04 closure in the SUMMARY)

Four minor implementation choices are documented in frontmatter `key-decisions`:
1. Artifact-internal-consistency vs on-chain authority check — re-derivation is pure math
2. Pseudonym assignment strategy — role-indexed greek letters (identity-neutral)
3. Timezone bucket granularity — "Americas" not IANA codes (ethics-check-passing coarseness)
4. Liveness SLA strictness — achievable not aspirational (roster is a commitment document)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prettier reformatted the newly-written signer-roster.md; format:check failed pre-commit**

- **Found during:** Task 2 pre-commit preparation
- **Issue:** `pnpm format:check` reported `docs/security/signer-roster.md` as not prettier-formatted. The long Version-history v1.1 row I wrote exceeded prettier's 100-char line wrap and prettier reflowed the table. Same prettier-interaction pattern as Plans 01-02, 02-02, 02-03, 02-04.
- **Fix:** Ran `npx prettier --write docs/security/signer-roster.md`. Prettier re-wrapped the long table row; no semantic changes. Acceptance-criteria greps (Signer headings=5, Proposer hot wallet=1, to-be-filled/to-be-assigned/filled-in-Plan-02-06=0, multisig-creation.md=1, vendor-diversity=1, GOV-04=2, version-history row v1.1 present, all 6 pubkeys present, multisig_address present, vault_pda present) all still pass after reformat.
- **Files modified:** `docs/security/signer-roster.md`
- **Verification:** `pnpm format:check` exits 0. All acceptance-criteria greps pass.
- **Committed in:** `b89c19d` (Task 2 commit — reformat applied before the commit)

**2. [Rule 3 - Environment gap] gitleaks not on default bash PATH; husky pre-commit failed**

- **Found during:** Task 2 first commit attempt
- **Issue:** `git commit` spawned a fresh subshell that did not inherit the session's `PATH` export. Husky pre-commit hook's `pnpm gitleaks` step failed with "gitleaks not installed". Same inherited Phase 2 gap as documented in Plans 02-01 through 02-05.
- **Fix:** Re-ran the commit with the PATH export prefix inline: `export PATH="/c/Users/markc/AppData/Local/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe:$PATH" && git commit -m "..."`. Commit succeeded with clean pre-commit hook output.
- **Files modified:** None in repo (session environment only).
- **Verification:** Task 1 and Task 2 commits both landed with `[pre-commit] OK`; `pnpm gitleaks` full-tree scan reports "no leaks found" (45 commits scanned post-Task-1, re-verified post-Task-2).
- **Committed in:** N/A (session env only)

---

**Total deviations:** 2 auto-fixed (1 blocking prettier format, 1 blocking env PATH)
**Impact on plan:** Both are the standard pre-commit hygiene pattern documented across every prior Phase 2 plan. No change to plan output. No scope creep.

## Issues Encountered

- **`bigint: Failed to load bindings, pure JS will be used` warning** from `@sqds/multisig` native deps during `pnpm squads:publish-artifacts` runs. Informational only (native build skipped; pure-JS path used) — does not affect script correctness. Same observation as Plan 02-05; still not worth `pnpm rebuild` for a read-only artifact validator.
- **`.claude/` directory untracked.** Harness-generated; not in scope for this plan. Ignored per task-commit protocol (not a generated output of the plan).

## User Setup Required

None. This plan is a pure-artifact-publication plan; no external credentials, no hardware wallets, no ceremony coordination required. All three commits landed autonomously.

## Requirement Closure Audit

| Req    | Status after this plan                                                                                        | Closed by                                       |
| ------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| GOV-01 | COMPLETE — devnet Squads v4 multisig exists (Plan 02-02)                                                       | `02-02-SUMMARY.md` (commit `6Pu2arj...`)        |
| GOV-02 | COMPLETE — mainnet Squads v4 multisig exists (Plan 02-05)                                                      | `02-05-SUMMARY.md` (commit `942c731`)           |
| GOV-03 | COMPLETE — **closed by THIS plan** — public pseudonymous roster + multisig address + ceremony artifacts committed | `02-06-SUMMARY.md` (this plan, commit `b89c19d`) |
| GOV-04 | **PARTIAL — devnet arm closed (Plan 02-03); mainnet arm DEFERRED to Phase 4 DEP-04**                          | Devnet: `02-03-SUMMARY.md`. Mainnet: Phase 4 DEP-04. |

**GOV-04 explicit non-closure rationale:** The GOV-04 mainnet invariant requires an on-chain check that the production mint's mint, freeze, and metadata-update authorities all equal the Squads vault PDA. No mainnet mint exists in Phase 2 — it is created in Phase 4. Therefore the on-chain authority invariant is not checkable from Phase 2, and Plan 02-06's vault-PDA re-derivation is artifact-internal consistency (pure math against the two values in `artifacts/mainnet.json`), not an on-chain authority check. Phase 4 DEP-04 will perform the actual on-chain check at mainnet mint ceremony time.

## Phase 2 Criteria Contribution

**Phase 2 Success Criterion 3 — MET.** "The mainnet multisig address, vault PDA, signer pubkeys, threshold, and ceremony transcript are committed as public repo artifacts in `artifacts/mainnet.json` and `docs/security/signer-roster.md` (role + pseudonym only, no real names)."

- Mainnet multisig address in `artifacts/mainnet.json` (`squads.multisig_address`) AND in `docs/security/signer-roster.md` (Multisig parameters section)
- Vault PDA in `artifacts/mainnet.json` (`squads.vault_pda`) AND in `docs/security/signer-roster.md`
- Signer pubkeys (5 voting + 1 proposer) in `artifacts/mainnet.json` (`squads.voting_members[]` + `squads.proposer_only_pubkey`) AND in `docs/security/signer-roster.md` (6 per-signer subsections)
- Threshold `3` in `artifacts/mainnet.json` (`squads.threshold`) AND in `docs/security/signer-roster.md` (Multisig parameters + Voting members heading)
- Ceremony transcript at `artifacts/mainnet-sessions/multisig-creation.md` (committed in Plan 02-05) cross-linked from BOTH `artifacts/mainnet.json` (`squads.ceremony_transcript`) AND `docs/security/signer-roster.md` (Ceremony transcript section)
- "role + pseudonym only, no real names": VERIFIED via `grep -iE 'real name|given name|surname|first name|last name' docs/security/signer-roster.md` → empty

**Phase 2 declaration:** Phase 2 plan-scope COMPLETE. 6/6 plans done. GOV-01, GOV-02, GOV-03 FULLY CLOSED. GOV-04 PARTIALLY CLOSED (devnet arm via Plan 02-03; mainnet arm deferred to Phase 4 DEP-04). Phase 3 (Devnet Full Rehearsal) is unblocked.

## Next Phase Readiness

**Phase 3 (Devnet Full Rehearsal):** Unblocked. Inherits:
- Devnet Squads multisig `6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu` + vault PDA `5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu` from Plan 02-02
- `src/squads/` helper surface (deriveVaultPda, verifyVaultAuthority, proposals lifecycle, connection) from Plan 02-01
- Devnet smoke-mint proof (Plan 02-03) proving the vault-PDA authority wiring pattern

**Phase 4 (Mainnet Launch Ceremony):** Directly inherits:
- Mainnet Squads vault PDA `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR` — the required authority for all TOK-01..06 instructions (mint/freeze/update/Permanent-Delegate)
- `artifacts/mainnet.json` squads subobject — FROZEN from Plan 02-05; Phase 4 APPENDS `mint`/`treasury_ata`/etc. sibling keys via merge-on-write, never mutates `squads`
- `scripts/squads/publish-artifacts.ts` can be extended or referenced in Phase 4 — the current version is mint-agnostic and CI-safe
- **DEP-04 responsibility reminder.** Phase 4 DEP-04 must perform the ON-CHAIN authority check: fetch the production mint account, read mint/freeze/metadata-update authorities, assert each equals `squads.vault_pda`. The `verifyVaultAuthority` helper from `src/squads/verify.ts` is the primitive; Phase 4 will wrap it with the actual on-chain read. This closes the GOV-04 mainnet arm that Plan 02-06 deliberately did NOT claim.

## Self-Check: PASSED

**Files created verified:**

- `scripts/squads/publish-artifacts.ts` — FOUND (166 lines)
- `.planning/phases/02-squads-multisig-setup-devnet-mainnet/02-06-SUMMARY.md` — FOUND (this file)

**Files modified verified:**

- `docs/security/signer-roster.md` — 136 lines, v1.1, all pubkeys populated
- `artifacts/mainnet.json` — `squads.ceremony_transcript` field present
- `package.json` — `"squads:publish-artifacts"` entry present

**Commits verified:**

- `02fc972` — FOUND: `feat(02-06): add idempotent publish-artifacts validator + ceremony transcript cross-link`
- `b89c19d` — FOUND: `feat(02-06): finalize signer-roster.md with mainnet pubkeys + GOV-04 scope note`

**Verification commands (all passed):**

- `pnpm typecheck` — exit 0
- `pnpm lang:audit` — "OK — no violations found." (9 files in scope)
- `pnpm gitleaks` — "no leaks found" (45 commits scanned, 1.29 MB)
- `pnpm format:check` — "All matched files use Prettier code style!"
- `pnpm squads:publish-artifacts` (first run) — wrote `squads.ceremony_transcript`, exit 0
- `pnpm squads:publish-artifacts` (second run) — `idempotent write: no (already consistent)`, exit 0
- All pubkeys from artifacts/mainnet.json (5 voting + 1 proposer) cross-checked `grep -q` FOUND in docs/security/signer-roster.md
- Multisig address + vault_pda cross-checked FOUND in docs/security/signer-roster.md
- `grep -iE 'real name|given name|surname|first name|last name' docs/security/signer-roster.md` — empty

---

_Phase: 02-squads-multisig-setup-devnet-mainnet_
_Plan: 06_
_Completed: 2026-04-20_
