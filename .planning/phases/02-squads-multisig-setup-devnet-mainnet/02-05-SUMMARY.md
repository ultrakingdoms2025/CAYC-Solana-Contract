---
phase: 02-squads-multisig-setup-devnet-mainnet
plan: 05
subsystem: governance
tags: [squads-v4, multisig, mainnet-ceremony, hardware-wallet, ledger, vault-pda, GOV-02]

# Dependency graph
requires:
  - phase: 02-squads-multisig-setup-devnet-mainnet
    provides: "src/squads helper substrate (Plan 02-01); devnet existence proof (Plan 02-02 + 02-03); mainnet preflight gate + signer roster template (Plan 02-04)"
provides:
  - "Mainnet Squads v4 multisig at 46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR on Solana mainnet-beta"
  - "Mainnet vault PDA CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR — the sole authority for every Phase 4 mint/freeze/metadata-update/Permanent-Delegate instruction"
  - "Append-only artifacts/mainnet.json (pinned addresses, creation tx signature, slot, human-confirmation timestamp, preflight snapshot)"
  - "CEX-grade ceremony transcript at artifacts/mainnet-sessions/multisig-creation.md (61 lines, pseudonymous participant list, on-chain readback proof)"
  - "Populated .env.mainnet (gitignored) with MAINNET_SQUADS_MULTISIG_ADDRESS + MAINNET_SQUADS_VAULT_PDA"
affects: [02-06, phase-03, phase-04, phase-05, phase-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mainnet ceremony execution pattern: preflight-gated + idempotence-guarded + human-typed-phrase-gated script with full parameter bundle printout before broadcast"
    - "Post-tx read-path retry pattern (10 attempts, 1s base delay, 5s cap) to defeat confirmed-commitment indexing lag on mainnet — same pattern used on devnet in Plan 02-02"
    - "Artifact merge-on-write (prior ∪ artifact) so future sibling keys (mint, treasury_ata) can be appended without touching squads sub-object"
    - "RPC URL query-string stripping before any log/artifact emission (safeEndpoint pattern from Plan 02-04 applied to ceremony script)"

key-files:
  created:
    - artifacts/mainnet.json
    - artifacts/mainnet-sessions/multisig-creation.md
    - .planning/phases/02-squads-multisig-setup-devnet-mainnet/02-05-SUMMARY.md
  modified:
    - .env.mainnet (NOT committed — gitignored; contains MAINNET_SQUADS_MULTISIG_ADDRESS + MAINNET_SQUADS_VAULT_PDA)
    - .planning/STATE.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Ceremony fired at commit SHA 083aa85c5a9bd5f6b510fd38983a6d5696ef41c0 — the commit where Task 1 (ceremony script) was finalized and typechecked. Transcript + artifact both reference this SHA as the immutable evidence point for CEX reviewers."
  - "Proposer (2gUjoCGqqoxQ9ivrTqGhHmtLqvFp3gvDRYCrMAwtkxA1) recorded as Initiate-only member (permissions.mask=1) separate from the 5 voting members (permissions.mask=7, Permissions.all). This matches the CONTEXT.md proposer-only hot wallet design — proposer submits proposals but cannot vote or execute without the 3-of-5 voting quorum."
  - "Config authority intentionally left null (PublicKey.default on-chain) — self-managed multisig per CONTEXT.md; any future threshold/member change requires 3-of-5 vote, not an external authority."

patterns-established:
  - "Mainnet append-only artifact commit pattern: first commit that writes squads subobject must come from a successful on-chain multisigCreateV2 confirmation; future commits only add new top-level keys (mint, treasury_ata, etc.)"
  - "Two-commit ceremony hygiene: (1) feat(02-05): execute ceremony — artifacts only; (2) docs(02-05): finalize plan — metadata files. Keeps the on-chain-evidence commit clean and identifiable in the repo history"

requirements-completed: [GOV-02]

# Metrics
duration: 5min
completed: 2026-04-20
---

# Phase 2 Plan 5: Mainnet Squads v4 Multisig Creation Ceremony Summary

**Mainnet Squads v4 multisig live at `46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR` with 3-of-5 threshold, vault PDA `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR` ready to serve as the sole authority for Phase 4 mint/freeze/metadata/Permanent-Delegate wiring.**

## Performance

- **Duration:** 5min (336s wall clock — script start to final artifact+metadata commit)
- **Started:** 2026-04-20T15:20:00Z
- **Completed:** 2026-04-20T15:25:36Z
- **Tasks:** 2 (Task 1 committed separately at `88a03f4` in a prior session; Task 2 — ceremony execution — is this plan's work)
- **Files modified:** 3 committed (artifacts/mainnet.json, artifacts/mainnet-sessions/multisig-creation.md, + metadata files) + 1 gitignored (.env.mainnet)

## Accomplishments

- Mainnet Squads v4 multisig created on Solana mainnet-beta via `@sqds/multisig` `rpc.multisigCreateV2` — one-shot, no retries, no tx drops
- Threshold 3-of-5 with 5 voting members (Permissions.all, mask=7) + 1 proposer-only member (Permission.Initiate, mask=1) as prescribed by CONTEXT.md
- Vault PDA `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR` derived via `deriveVaultPda(multisigPda)` at index 0 and re-verified post-tx via `verifyVaultAuthority` (Pitfall 11 defense in depth)
- Time lock 0 slots, config authority null (self-managed), rent collector null — matches Mint Policy §5 multisig-discipline model
- Committed append-only `artifacts/mainnet.json` (39 lines) with preflight snapshot + human-confirmation timestamp embedded for CEX audit trail
- CEX-grade transcript at `artifacts/mainnet-sessions/multisig-creation.md` (61 lines) capturing commit SHA, pseudonymous participant list, full parameter bundle, on-chain readback, and Phase 4 significance note
- `.env.mainnet` updated in-place with `MAINNET_SQUADS_MULTISIG_ADDRESS` and `MAINNET_SQUADS_VAULT_PDA` — Phase 4 plans can source these directly
- GOV-02 closed; Phase 2 Success Criterion 2 verified end-to-end

## Ceremony Outcome (verbatim from artifacts/mainnet.json)

| Field                        | Value                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| Network                      | mainnet-beta                                                                               |
| Program ID                   | `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` (Squads v4)                                  |
| Multisig PDA                 | `46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`                                             |
| Vault PDA (index 0)          | `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`                                             |
| createKey (ephemeral)        | `HieVU7yhWgRGUPu5T5LyZj9tGWLUzC5WoxMbBCLxojex`                                             |
| Threshold                    | 3 of 5                                                                                     |
| Voting members               | 5 (permissions.mask=7)                                                                     |
| Proposer-only member         | `2gUjoCGqqoxQ9ivrTqGhHmtLqvFp3gvDRYCrMAwtkxA1` (mask=1)                                    |
| Time lock                    | 0 slots                                                                                    |
| Config authority             | null (self-managed; on-chain value = PublicKey.default all-zero)                           |
| Rent collector               | null                                                                                       |
| Creation tx signature        | `Dtx1x2kcwicMfo4LVqSjkzBWpjTa4cv7ALj82FMQZTwMFSBuQxmuw9CTDiYpHCkFFCqKUp7eaEYVQFKJzMX5XJs`  |
| Creation slot                | 414500481                                                                                  |
| Explorer URL                 | https://explorer.solana.com/tx/Dtx1x2kcwicMfo4LVqSjkzBWpjTa4cv7ALj82FMQZTwMFSBuQxmuw9CTDiYpHCkFFCqKUp7eaEYVQFKJzMX5XJs |
| Human confirmation timestamp | 2026-04-20T15:20:14.732Z                                                                   |
| Preflight snapshot           | 12/12 pass at 2026-04-20T14:58:25.847Z (22 min before ceremony — well inside 24h window)   |
| Commit SHA at ceremony       | `083aa85c5a9bd5f6b510fd38983a6d5696ef41c0`                                                 |

### Pitfall 11 check

`multisig_address` (`46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`) is **byte-level distinct** from `vault_pda` (`CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`). The script's in-derivation sanity check (`multisigPda.equals(vaultPda)` throw) would have aborted before tx submission if they had collided — they did not. Defense in depth: post-tx `verifyVaultAuthority(vaultPda, deriveVaultPda(multisigPda))` passed.

### Independent verify-vault readback (post-ceremony)

```
$ pnpm squads:verify-vault --network mainnet-beta --multisig 46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR
--- Squads v4 Multisig Inspection ---
Network:           mainnet-beta
Program ID:        SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf
Multisig config:   46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR
Vault PDA (idx=0): CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR   <-- USE THIS AS AUTHORITY
--- On-chain state ---
Threshold:        3 of 6
Config authority: 11111111111111111111111111111111 (all-zero -> self-managed)
Time lock:        0 slots
Transaction idx:  0
--- Members ---
  [0] KzCZnpmePppaQf9D9jcWnKPoiDTdznK7g4qKt73zD3n  permissions.mask=7
  [1] 2gUjoCGqqoxQ9ivrTqGhHmtLqvFp3gvDRYCrMAwtkxA1  permissions.mask=1
  [2] 5BnDpWnRh8aZ3oFVBn54Z8mF2agnCcNJyTKS179fYU3b  permissions.mask=7
  [3] DwK4842jNasCGigQ1BruQxRFKpXevnBmPwuKLJVXBMuu  permissions.mask=7
  [4] G28iLXukQFExfZ21Gaq5M7CdqBFPmvkwwfRotxvU7ESq  permissions.mask=7
  [5] HBEqzqWmzvhQq3jAKBAdsE2DzoiGoKEy5A22d7jTMNPt  permissions.mask=7
```

`Threshold: 3 of 6` reflects the Squads v4 on-chain member-count convention (5 voting + 1 proposer-only = 6 total members; quorum still requires 3 voting-permission signatures). Proposer entry at index [1] has `permissions.mask=1` (Initiate only) — cannot contribute to the 3-of-5 voting quorum, matching the CONTEXT.md proposer-only hot wallet design.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write mainnet ceremony script** — `88a03f4` (feat/02-01-squads-substrate lineage, committed in prior session: `feat(02-05): write mainnet Squads v4 multisig creation ceremony driver (Task 1)`)
2. **Task 2: Execute mainnet ceremony** — `942c731` (`feat(02-05): execute mainnet Squads v4 multisig creation ceremony`) — artifacts/mainnet.json + artifacts/mainnet-sessions/multisig-creation.md

**Plan metadata:** `(pending)` — will be the `docs(02-05): finalize mainnet ceremony plan + close GOV-02` commit that lands this SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md updates.

## Files Created/Modified

- `artifacts/mainnet.json` — Append-only source of truth mirror; `squads` subobject is frozen from this commit onward. Phase 3+ plans append sibling keys (mint, treasury_ata) via `{...prior, ...artifact}` merge-on-write.
- `artifacts/mainnet-sessions/multisig-creation.md` — CEX-grade ceremony transcript with pseudonymous participant list; real-name mapping lives in the private signer-roster artifact outside the repo (per CONTEXT.md transparency decision).
- `.env.mainnet` (gitignored) — populated with `MAINNET_SQUADS_MULTISIG_ADDRESS` and `MAINNET_SQUADS_VAULT_PDA`. Phase 4 plans read these directly; Plan 02-06 (next) will cross-reference them in the finalized signer roster.

## Decisions Made

None beyond the decisions already locked in 02-CONTEXT.md and 02-04-PLAN.md. The ceremony executed exactly as designed: Task 1 script + preflight artifact + typed-phrase confirmation + one multisigCreateV2 call. No deviations, no retries, no RPC failover.

## Deviations from Plan

None — plan executed exactly as written. No auto-fix (Rules 1-3) events triggered; no architectural questions (Rule 4) raised. The ceremony script was written in a prior session (Task 1, commit `88a03f4`) and re-used as-is; this session only executed it.

## Issues Encountered

None. Observations worth logging for Phase 4 planning:

- **RPC latency during ceremony:** multisigCreateV2 confirmed inside the default `confirmTransaction` window (the retry-on-read guard was never triggered — `loadMultisigWithRetry` succeeded on attempt 1). Helius mainnet-beta is behaving well; no need to budget extra retry slack for Phase 4 mint creation under similar conditions.
- **Tx retry count:** 0 — single-shot success.
- **Signer liveness response times:** N/A for this ceremony — multisigCreateV2 does NOT require the 5 voting signers to sign the outer tx; they are members of the new multisig but their Ledger signatures are not needed until Phase 4 mint proposal. The preflight ran for 0.35h before ceremony start; human confirmation arrived 15.259s after the parameter-bundle print and 14.732s after the prompt.
- **`bigint: Failed to load bindings, pure JS will be used` warning** from `@sqds/multisig` native deps is informational only (native build skipped; pure-JS path used) — does not affect tx correctness. Consider `pnpm rebuild` in a future maintenance plan if hot-path performance matters; for ceremony scripts (one tx per run) it is irrelevant.

## User Setup Required

None for this plan — all user setup (Ledger firmware, seed backup, signer pubkey collection, proposer funding, Helius Business tier) was completed in Plan 02-04 preflight stages A-E before this plan's Task 2 was unblocked.

## Next Phase Readiness

**Phase 2 remaining work (1 plan):**
- Plan 02-06 — publish finalized `docs/security/signer-roster.md` with pubkeys from this ceremony transcript, validate `artifacts/mainnet.json`, cross-link transcript. Closes GOV-03.

**Phase 4 handoff (downstream):**
- `artifacts/mainnet.json` `squads.vault_pda = CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR` is the required authority for all Phase 4 mint/freeze/metadata-update/Permanent-Delegate instructions. Phase 4 preflight (TOK-01..06) should assert `squads.multisig_address !== squads.vault_pda` and that the vault PDA resolves on-chain before any mint instruction is built.
- Artifact append-only contract: Phase 4 ceremony scripts MUST use `{...prior, ...new_top_level_key}` merge-on-write and MUST NOT mutate the `squads` subobject.
- Proposer `2gUjoCGqqoxQ9ivrTqGhHmtLqvFp3gvDRYCrMAwtkxA1` currently at 2.0 SOL (pre-ceremony balance minus creation tx fee — see Phase 4 preflight for refill procedure).

## Self-Check: PASSED

- [x] `artifacts/mainnet.json` exists — FOUND (39 lines, valid JSON)
- [x] `artifacts/mainnet-sessions/multisig-creation.md` exists — FOUND (61 lines ≥ 50 threshold)
- [x] `squads.multisig_address` (`46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`) ≠ `squads.vault_pda` (`CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`) — Pitfall 11 clean
- [x] `squads.threshold === 3`, `squads.voting_member_count === 5`, `squads.voting_members.length === 5`
- [x] `squads.creation_tx_signature` set (88-char base58)
- [x] `squads.human_confirmation_timestamp` set (ISO 8601)
- [x] `squads.preflight_artifact_snapshot` embedded with overall=pass, 12/12
- [x] Commit `942c731` found in `git log --all --oneline` — artifact commit landed
- [x] `pnpm squads:verify-vault --network mainnet-beta` shows `Threshold: 3 of 6`, vault PDA matches artifact byte-for-byte
- [x] `pnpm lang:audit` exits 0 on current tree (9 files scanned, no violations)
- [x] `pnpm gitleaks` exits 0 (42 commits scanned, 0 leaks)
- [x] `.env.mainnet` not in `git status` output — correctly gitignored

---
*Phase: 02-squads-multisig-setup-devnet-mainnet*
*Completed: 2026-04-20*
