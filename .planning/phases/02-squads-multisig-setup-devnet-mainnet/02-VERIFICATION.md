---
phase: 02-squads-multisig-setup-devnet-mainnet
verified: 2026-04-19T00:00:00Z
status: passed
score: 4/4 requirements verified (GOV-04 devnet arm closed per Phase 2 scope; mainnet arm correctly deferred to Phase 4 DEP-04)
---

# Phase 2: Squads Multisig Setup (Devnet + Mainnet) Verification Report

**Phase Goal:** Both the devnet and mainnet Squads v4 multisigs exist with hardware-wallet signers, the vault PDAs are derived and documented, and signer rotation has been rehearsed — all BEFORE any mint instruction is built.
**Verified:** 2026-04-19
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Devnet Squads v4 multisig created via SDK (not web UI); vault PDA derived; rotation drill executed end-to-end | VERIFIED | Multisig `6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu` on-chain; vault PDA `5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu` confirmed; rotation drill transcript in `artifacts/devnet-sessions/rotation-drill.md` (79 lines, 6 approval-tx lines) |
| 2 | Mainnet Squads v4 multisig with 3-of-5 threshold; all-Ledger hardware wallets; each signer funded ≥ 0.5 SOL (verified at ceremony by preflight 12/12 pass); seed phrases cold-stored | VERIFIED | `artifacts/mainnet.json` records threshold=3, voting_member_count=5; preflight_artifact_snapshot shows 12/12 pass at ceremony time (E6-E10 = signer balance checks); CONTEXT.md all-Ledger tradeoff documented in both runbook and roster |
| 3 | Mainnet multisig address, vault PDA, signer pubkeys, threshold, and ceremony transcript committed as public artifacts in `artifacts/mainnet.json` and `docs/security/signer-roster.md` (role + pseudonym only, no real names) | VERIFIED | `artifacts/mainnet.json` contains all required fields; `docs/security/signer-roster.md` v1.1 has 5 voting pubkeys + 1 proposer pubkey with pseudonyms; grep for forbidden identity tokens returns 0 matches |
| 4 | Byte-level plan exists for mainnet mint creation using vault PDA as authority; verified by successful multisig-signed mint on devnet; Pitfall 11 negative test captured | VERIFIED | `artifacts/devnet-sessions/smoke-test-mint.md` has `PROOF OK`; `artifacts/devnet.json.devnet_smoke_test.pitfall_11_negative_test_captured: true`; negative test failure signature captured (`{"InstructionError":[0,{"Custom":4}]}` + `Error: owner does not match`) |

**Score:** 4/4 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/squads/index.ts` | Barrel export for all Squads helpers | VERIFIED | Exists; re-exports constants, pda, members, verify, connection, proposals |
| `src/squads/pda.ts` | Vault PDA derivation wrapper with Pitfall 11 mitigation | VERIFIED | Contains `getVaultPda`; Pitfall 11 rationale comment present |
| `src/squads/constants.ts` | Pinned Squads v4 program ID | VERIFIED | `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` literal present; `MAINNET_THRESHOLD=3`, `MAINNET_SIGNER_COUNT=5` |
| `src/squads/members.ts` | Member builder with Permissions.all() | VERIFIED | `buildVotingMembers` + `buildProposerMember` exported |
| `src/squads/verify.ts` | `verifyVaultAuthority` + `VaultMismatchError` | VERIFIED | Both exported; `VaultMismatchError` class defined with named error + Pitfall 11 message; function returns `{ ok: true }` |
| `src/squads/connection.ts` | `buildConnection` + `loadMultisig` | VERIFIED | Both exported; mainnet guard present |
| `src/squads/proposals.ts` | Proposal lifecycle helpers (5 helpers + 2 utilities) | VERIFIED | `proposeVaultTransaction`, `approveProposal`, `executeVaultTransaction`, `proposeConfigTransaction`, `executeConfigTransaction` present; inter-RPC confirmation baked in |
| `src/env/load.ts` | `loadEnv` with CONFIRM_MAINNET guard | VERIFIED | Exists; `CONFIRM_MAINNET === "yes-mainnet-ceremony"` exact-string guard |
| `scripts/squads/generate-devnet-signers.ts` | 5 signer + 1 proposer keypair generator | VERIFIED | Exists; 6+ `Keypair.generate()` literal calls; writes to gitignored `keys/devnet/` |
| `scripts/squads/verify-vault.ts` | Read-only multisig diagnostic | VERIFIED | Exists; imports from `src/squads` (not direct `@sqds/multisig`); `deriveVaultPda` + `USE THIS AS AUTHORITY` present |
| `scripts/squads/create-devnet.ts` | Devnet multisig creation script | VERIFIED | Exists; idempotence guard; retry-with-backoff; artifact merge-on-write |
| `scripts/squads/rotate-devnet-signer.ts` | Rotation drill script | VERIFIED | Exists; AddMember + RemoveMember; net-zero member-count assertion |
| `scripts/squads/smoke-test-mint.ts` | Smoke-test mint with Pitfall 11 negative test | VERIFIED | Exists; 8-step vault transaction; negative test capture embedded |
| `scripts/squads/preflight-mainnet.ts` | Automated preflight Stage E script | VERIFIED | Exists; 12 checks (E0-E11); safeEndpoint() API-key hygiene; finalize-time refuse-to-write guard |
| `scripts/squads/create-mainnet.ts` | Mainnet ceremony script | VERIFIED | File exists at `scripts/squads/create-mainnet.ts` |
| `scripts/squads/publish-artifacts.ts` | Idempotent artifact validator + link writer | VERIFIED | Exists; 166 lines; validates schema, Pitfall 11, vault PDA re-derivation; idempotent write-or-skip |
| `artifacts/devnet.json` | Devnet multisig state + smoke-test + rotation drill | VERIFIED | Contains `squads` subobject (multisig_address, vault_pda, threshold=3, voting_member_count=5); `devnet_smoke_test` block with `pitfall_11_negative_test_captured: true`; `devnet_rotation_drill` block |
| `artifacts/mainnet.json` | Mainnet multisig state | VERIFIED | Contains `squads.multisig_address = 46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`; `squads.vault_pda = CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`; threshold=3; voting_member_count=5; 5 voting pubkeys; proposer pubkey; creation_tx_signature (88-char base58); creation_slot=414500481; preflight_artifact_snapshot=12/12 pass; `ceremony_transcript` cross-link |
| `artifacts/mainnet-sessions/multisig-creation.md` | CEX-grade ceremony transcript | VERIFIED | 61 lines; pseudonymous participant list; full parameter bundle; on-chain readback; Pitfall 11 defense-in-depth confirmation; Squads v4 program ID verified; tx signature present |
| `artifacts/devnet-sessions/rotation-drill.md` | Rotation drill transcript | VERIFIED | 79 lines; 2 configTransactionCreate txs; 2 configTransactionExecute txs; 6 `approve tx:` lines (3 per proposal) |
| `artifacts/devnet-sessions/smoke-test-mint.md` | Smoke-test mint transcript | VERIFIED | 93 lines; `PROOF OK` marker at line 40; Pitfall 11 negative test section with exact failure signature; GOV-04 devnet scope note |
| `docs/security/signer-roster.md` | Finalized pseudonymous signer roster | VERIFIED | v1.1; 136 lines; 5 voting member sections; 1 proposer section; all pubkeys populated; no identity tokens; `vendor diversity` + `accepted tradeoff` tokens present; `GOV-04` scope note at line 124 + version history |
| `docs/runbooks/mainnet-squads-ceremony-preflight.md` | Preflight runbook with Stages A-E | VERIFIED | 175 lines; Stages A-E headers present; `vendor diversity`, `all-Ledger`, `accepted tradeoff` tokens grep-verifiable in Stage A3 and "Accepted tradeoffs" section |
| `docs/runbooks/authority-rotation.md` | Byte-level rotation runbook | VERIFIED | 301 lines; add-signer and remove-signer procedures; `rentPayer: proposer` documented for AddMember |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/squads/pda.ts` | `@sqds/multisig` | named import | WIRED | `import { getMultisigPda, getVaultPda } from '@sqds/multisig'` present at line 2 |
| `src/squads/index.ts` | `src/squads/pda.ts` | re-export | WIRED | `export * from './pda.js'` confirmed via barrel |
| `src/squads/index.ts` | `src/squads/proposals.ts` | re-export | WIRED | `export * from './proposals.js'` in index confirmed by SUMMARY |
| `scripts/squads/verify-vault.ts` | `src/squads` | imports `deriveVaultPda` | WIRED | Imports from `../../src/squads/index.js`; not from `@sqds/multisig` directly |
| `artifacts/devnet.json` | Pitfall 11 invariant | `multisig_address !== vault_pda` | WIRED | `6Pu2...MEVu` vs `5tTo...HtHu` — byte-level distinct; confirmed by SUMMARY node assertion |
| `artifacts/mainnet.json` | Pitfall 11 invariant | `multisig_address !== vault_pda` | WIRED | `46rX...WR` vs `CFYA...BJR` — byte-level distinct; confirmed by `pnpm squads:verify-vault` post-ceremony readback in SUMMARY |
| `artifacts/mainnet.json` | `artifacts/mainnet-sessions/multisig-creation.md` | `squads.ceremony_transcript` key | WIRED | Field set to `"artifacts/mainnet-sessions/multisig-creation.md"` by `publish-artifacts.ts` |
| `docs/security/signer-roster.md` | `artifacts/mainnet-sessions/multisig-creation.md` | Ceremony transcript section | WIRED | Cross-link at line 111 |
| `devnet_smoke_test.execute_tx` | Vault PDA authority | `getMint().mintAuthority == vault_pda` | WIRED | `smoke-test-mint.md` line 38: `getMint().mintAuthority == vault_pda: PASS` |
| `smoke-test mint` | Pitfall 11 negative test | simulated failure capture | WIRED | `artifacts/devnet.json.devnet_smoke_test.pitfall_11_negative_test_captured: true`; failure signature in transcript |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GOV-01 | 02-01, 02-02 | Create Squads v4 multisig on devnet with devnet-only signers | SATISFIED | Multisig `6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu` on-chain; 5 throwaway filesystem signers (gitignored); vault PDA recorded in `artifacts/devnet.json`; `pnpm squads:verify-vault` confirmed threshold=3, 6 members |
| GOV-02 | 02-04, 02-05 | Create Squads v4 multisig on mainnet with hardware-wallet signers BEFORE mint creation | SATISFIED | Mainnet multisig `46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR` created via ceremony; 5 Ledger voting signers; all-Ledger tradeoff documented with mitigations; preflight 12/12 confirmed ≥ 0.5 SOL per signer at ceremony time; no mint yet created (Phase 4 dependency) |
| GOV-03 | 02-04, 02-06 | Document multisig address, signer pubkeys, threshold, and ceremony transcript as public repo artifacts | SATISFIED | `artifacts/mainnet.json` (39 lines), `docs/security/signer-roster.md` v1.1 (136 lines with 5+1 pubkeys), `artifacts/mainnet-sessions/multisig-creation.md` (61 lines); bidirectional cross-links via `squads.ceremony_transcript` and roster §"Ceremony transcript"; no identity tokens in public files |
| GOV-04 (devnet arm) | 02-01, 02-03 | Vault PDA is the authority (proven on devnet via multisig-signed smoke-test mint; Pitfall 11 negative test captured) | SATISFIED (devnet arm) | `artifacts/devnet-sessions/smoke-test-mint.md` has `PROOF OK`; `pitfall_11_negative_test_captured: true` in `artifacts/devnet.json`; `verifyVaultAuthority` + `VaultMismatchError` mechanized in `src/squads/verify.ts` |
| GOV-04 (mainnet arm) | Phase 4 DEP-04 | On-chain authority check on production mint | INTENTIONALLY DEFERRED | Correctly scoped to Phase 4 DEP-04; no mainnet mint exists yet; "Note on GOV-04" in `docs/security/signer-roster.md` line 124 explicitly states the deferral; `02-03-SUMMARY.md` frontmatter `requirements-completed: []` (not claimed); `02-06-SUMMARY.md` Requirement Closure Audit documents this explicitly |

**Note on REQUIREMENTS.md traceability:** The traceability table shows `GOV-04 | Phase 2 | Pending`. This is technically inaccurate — the devnet arm is complete. However, `docs/security/signer-roster.md`, `artifacts/devnet-sessions/smoke-test-mint.md`, and all six SUMMARY frontmatter files consistently document the devnet-arm-closed / mainnet-arm-Phase-4 split. The table entry is a minor documentation gap (not an implementation gap) that Phase 4 can correct when closing the mainnet arm.

---

## Anti-Patterns Found

No blockers or warnings found. Verified:

- No TODO/FIXME/placeholder comments in any Phase 2 src/squads or scripts/squads files
- No stub implementations (`return null`, `return {}`, `return []`) in wired code paths
- No console.log-only handlers
- No direct `@sqds/multisig` PDA calls outside `src/squads/pda.ts` (import convention maintained)
- No API keys in committed artifacts (`safeEndpoint()` pattern + finalize-time guard verified by 02-04/02-05 SUMMARY gitleaks checks: "no leaks found" across 45 commits)
- No mainnet mint transaction attempted (Phase 4 scope; correctly deferred)

---

## Human Verification Required

### 1. Live on-chain mainnet multisig state

**Test:** Run `pnpm squads:verify-vault --network mainnet-beta --multisig 46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`
**Expected:** Threshold 3 of 6; vault PDA `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`; 5 members with mask=7 + 1 with mask=1; config authority all-zero (self-managed)
**Why human:** Requires live mainnet RPC + populated `.env.mainnet`. Cannot be verified by static file analysis. The 02-05 SUMMARY records a successful post-ceremony readback with matching output; that is treated as the authoritative evidence for this automated verification.

### 2. Devnet multisig still live (not pruned)

**Test:** Run `pnpm squads:verify-vault --network devnet --multisig 6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu`
**Expected:** Threshold 3 of 6; vault PDA `5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu`; transaction index 4 (post-smoke-test)
**Why human:** Devnet accounts are eventually pruned. Devnet existence is only material for Phase 3 rehearsal. 02-02/02-03 SUMMARY records confirmed successful post-tx readbacks at creation time.

---

## Gaps Summary

No gaps. All Phase 2 deliverables are substantively implemented and wired:

- GOV-01 (devnet multisig): on-chain, vault PDA derived, vault-vs-multisig distinction enforced at three layers (helper module, runtime verifyVaultAuthority, artifact schema)
- GOV-02 (mainnet multisig): on-chain, 3-of-5 threshold, all-Ledger tradeoff documented with mitigations, preflight 12/12 passed
- GOV-03 (transparency artifacts): committed, cross-linked, no identity tokens, pseudonymous
- GOV-04 devnet arm: smoke-test mint succeeded with vault PDA as authority; Pitfall 11 negative test captured; `pitfall_11_negative_test_captured: true` in machine-readable artifact
- GOV-04 mainnet arm: correctly deferred to Phase 4 DEP-04 by design — this is NOT a gap

The REQUIREMENTS.md traceability row `GOV-04 | Phase 2 | Pending` slightly under-represents the devnet-arm closure but does not affect Phase 2's goal achievement. The three-point documentation in SUMMARY frontmatter, smoke-test transcript, and signer-roster §"Note on GOV-04" is authoritative.

---

_Verified: 2026-04-19_
_Verifier: Claude (gsd-verifier)_
