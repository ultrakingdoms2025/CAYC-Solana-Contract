---
phase: 02-squads-multisig-setup-devnet-mainnet
plan: 03
subsystem: infra
tags: [squads-v4, multisig, vault-pda, token-2022-authority, rotation-drill, smoke-test-mint, pitfall-11, devnet, tdd]

# Dependency graph
requires:
  - phase: 02-squads-multisig-setup-devnet-mainnet
    provides: devnet multisig 6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu + vault PDA 5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu (Plan 02-02); src/squads helper module with PDA/member/connection/verify helpers (Plan 02-01)
provides:
  - src/squads/proposals.ts — 5 reusable lifecycle helpers (proposeVaultTransaction, approveProposal, executeVaultTransaction, proposeConfigTransaction, executeConfigTransaction) + 2 utilities (nextTransactionIndex, buildVaultTransactionMessage)
  - Inter-RPC confirmation wait (connection.confirmTransaction) built into every proposal-lifecycle helper — fixes AnchorError 6009 InvalidTransactionIndex race caused by @sqds/multisig helpers broadcasting without waiting for confirmation
  - scripts/squads/rotate-devnet-signer.ts — AddMember + RemoveMember drill driver with net-zero member-count assertion
  - scripts/squads/smoke-test-mint.ts — 8-step multisig-signed mint driver with embedded Pitfall 11 negative test
  - artifacts/devnet-sessions/rotation-drill.md — 79-line transcript of the rotation drill with all 12 tx signatures
  - artifacts/devnet-sessions/smoke-test-mint.md — 93-line transcript of the smoke-test mint with positive-path + Pitfall 11 negative-test failure capture
  - artifacts/devnet.json extended with devnet_smoke_test + devnet_rotation_drill blocks (pitfall_11_negative_test_captured: true)
  - docs/runbooks/authority-rotation.md — 301-line byte-level runbook for Phase 4+ mainnet signer rotations
  - package.json scripts: squads:rotate-devnet, squads:smoke-mint
  - 3 new vitest unit tests on proposals.ts (nextTransactionIndex, buildVaultTransactionMessage, lifecycle exports) — 11 total across repo, all passing
affects:
  - 02-04 (mainnet preflight — imports src/squads/proposals lifecycle helpers for dry-runs)
  - 02-05 (mainnet ceremony — mirrors proposeVaultTransaction pattern for the 500M genesis mint; web-UI-based approvals replace approveProposal but lifecycle is identical)
  - Phase 3 (devnet rehearsal — uses these helpers verbatim for mint creation + extension init dry-run)
  - Phase 4 (mainnet mint creation — Pattern 2 Script-Proposes / Multisig-Signs code path IS src/squads/proposals.ts; Pitfall 11 mitigation is mechanized + verified)

# Tech tracking
tech-stack:
  added:
    - "scripts/squads/rotate-devnet-signer.ts + scripts/squads/smoke-test-mint.ts — zero new deps; uses @sqds/multisig ^2.1.4, @solana/spl-token ^0.4.14, @solana/web3.js ^1.98.4 already pinned"
  patterns:
    - "Script-Proposes / Multisig-Signs (Pattern 2) now mechanized: proposeVaultTransaction → 3×approveProposal → executeVaultTransaction wraps the lifecycle with confirmation-between-calls baked in"
    - "Inter-RPC confirmation wait: every proposal-lifecycle helper calls connection.confirmTransaction(sig, 'confirmed') before returning — prevents race conditions between chained RPC calls that @sqds/multisig's fire-and-forget sendTransaction otherwise exposes"
    - "Pitfall 11 doubly mitigated: (a) deriveVaultPda is the single derivation path (Plan 02-01); (b) buildVaultTransactionMessage forces payerKey=vaultPda; (c) verifyVaultAuthority validates artifact-vs-derived match before any on-chain action; (d) the smoke-test's negative test captures the byte-level failure signature (custom error 0x4, 'Error: owner does not match') — proves the mitigation is doing real work"
    - "rentPayer: proposer pattern for AddMember — voting signers' SOL is scarce; the Multisig config account growth rent is paid by the proposer hot wallet (not the executor signer). Encoded in executeConfigTransaction's default-but-overridable rentPayer arg"
    - "Net-zero member-count assertion at end of rotation drill — the drill is only valid if post-drill state == pre-drill state (add one, remove the same one). Script throws if members.length != 6 after RemoveMember"

key-files:
  created:
    - "src/squads/proposals.ts — 199 lines; 5 lifecycle helpers + 2 utilities; inter-RPC confirmation baked in"
    - "src/squads/proposals.test.ts — 3 vitest tests (nextTransactionIndex with mocked account, buildVaultTransactionMessage with mocked connection, lifecycle-export contract check)"
    - "scripts/squads/rotate-devnet-signer.ts — 172 lines; AddMember + RemoveMember drill"
    - "scripts/squads/smoke-test-mint.ts — 275 lines; 8-step mint proof + Pitfall 11 negative test"
    - "artifacts/devnet-sessions/rotation-drill.md — 79 lines; full transcript"
    - "artifacts/devnet-sessions/smoke-test-mint.md — 93 lines; positive + negative test capture"
    - "docs/runbooks/authority-rotation.md — 301 lines; add/remove signer procedure + mainnet differences"
    - ".planning/phases/02-squads-multisig-setup-devnet-mainnet/02-03-SUMMARY.md — this file"
  modified:
    - "src/squads/index.ts — added `export * from './proposals.js';`"
    - "package.json — added squads:rotate-devnet + squads:smoke-mint scripts"
    - "artifacts/devnet.json — appended devnet_smoke_test + devnet_rotation_drill blocks"

key-decisions:
  - "Inter-RPC confirmation wait added to every proposal helper. Plan 02-02 flagged the @sqds/multisig confirmed-state lag as a post-tx-read issue; Plan 02-03 discovered the same pattern ALSO affects back-to-back RPC chains (configTransactionCreate → proposalCreate race tripping AnchorError 6009 InvalidTransactionIndex). Fix: src/squads/proposals.ts wraps every multisig.rpc.* call with `await connection.confirmTransaction(sig, 'confirmed')` before the next call. This is a structural change to the helper surface, not just a script fix — Phase 4 mainnet mint creation inherits this robustness for free."
  - "rentPayer: proposer is REQUIRED for AddMember configTransactionExecute. Voting signers have ~0.02 SOL (tx fees only); the Multisig config account grows by one Member slot on AddMember, needing ~0.002 SOL of additional rent. If rentPayer defaults to the executor (signer-1 with 0.02 SOL), the rent-grow fails. Runbook explicitly documents this for Phase 4."
  - "Signer-wallet funding strategy for Plan 02-03: transferred 0.02 SOL from proposer (1.89 SOL available) to each of the 5 signers. Faucet daily limit still exhausted; proposer was funded via Plan 02-02 transfer from id-devnet.json. Pattern: proposer is the internal treasury for devnet signer top-ups; replicates mainnet-ceremony-day reimbursement model (user pre-funds signers)."
  - "Pitfall 11 negative test captured failure signature verbatim: `{\"InstructionError\":[0,{\"Custom\":4}]}` + Token-2022 program log `Error: owner does not match`. This is the exact Token-2022 response when the mintAuthority account passed to mintTo does not match the mint's stored mintAuthority. Recorded in both artifacts/devnet-sessions/smoke-test-mint.md and artifacts/devnet.json (pitfall_11_negative_test_captured: true boolean)."
  - "Rotation drill uses a fresh Keypair.generate() each run. Orphaned configTransaction from first failed attempt (index 1, never executed because proposalCreate raced the confirm) is accepted cruft on devnet. Re-running after the confirmation fix generated a fresh AddMember at index 2; the orphan at index 1 remains on-chain but is inoperable (no proposal, so no approvals, so no execute path)."
  - "Transcript format aligned to acceptance-criteria regex. Rotation drill transcript uses `signer-N approve tx: <sig>` pattern (not `signer-N: <sig>`) so that `grep -c 'approve tx:'` returns >= 6. The smoke-mint transcript uses the same convention. Small authoring detail; guards against the grep gate in future plan-runs."

patterns-established:
  - "Every @sqds/multisig RPC call in a chain must be followed by connection.confirmTransaction before the next call. The @sqds/multisig helpers return the signature from sendTransaction immediately — no built-in confirmation wait. Future Phase 2-4 scripts inherit this via src/squads/proposals.ts."
  - "src/squads/proposals.ts is the authoritative Script-Proposes / Multisig-Signs code path. Any future script (Phase 4 mint, Phase 5 freeze/clawback) imports from here; no direct multisig.rpc.* calls outside src/squads."
  - "Pitfall 11 mitigation requires a POSITIVE proof (the smoke-test mint succeeded with vault_pda as authority) AND a NEGATIVE proof (the same mintTo with multisig_address as authority FAILS at simulation). Neither alone is sufficient: positive-only could be coincidence; negative-only does not prove the intended path works. Both together are the existence + falsifiability proof."
  - "rentPayer is explicit in config-transaction executes when the action grows the Multisig account (AddMember, AddSpendingLimit, SetRentCollector). Default of rentPayer=executor is only safe for RemoveMember / RemoveSpendingLimit / ChangeThreshold (shrink or no-op)."

requirements-completed: []  # GOV-04 DEVNET ARM closed; MAINNET ARM (on-chain production-mint authority check) still requires Phase 4 DEP-04. Do NOT mark GOV-04 as fully complete in REQUIREMENTS.md yet.

requirements-enabled: [GOV-04]  # Devnet existence proof; mainnet close-out is Phase 4 DEP-04.

# Metrics
duration: 14min
completed: 2026-04-20
---

# Phase 2 Plan 3: Rotation Drill + Smoke-Test Mint Summary

**Devnet Squads v4 signer rotation drill AND multisig-signed Token-2022 smoke-test mint both executed end-to-end; reusable src/squads/proposals.ts lifecycle helpers (with inter-RPC confirmation built in) + docs/runbooks/authority-rotation.md runbook shipped; Pitfall 11 negative test captured byte-level failure signature ("Error: owner does not match", custom error 0x4) as the counterfactual evidence that the vault-PDA-as-authority pattern is doing real work. Phase 2 Success Criterion 1 (rotation) + Criterion 4 (devnet byte-level mint proof) satisfied; GOV-04 devnet arm closed.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-04-20T04:50:31Z
- **Completed:** 2026-04-20T05:04:39Z
- **Tasks:** 3 / 3
- **Files created:** 8 (`src/squads/proposals.ts`, `src/squads/proposals.test.ts`, `scripts/squads/rotate-devnet-signer.ts`, `scripts/squads/smoke-test-mint.ts`, `artifacts/devnet-sessions/rotation-drill.md`, `artifacts/devnet-sessions/smoke-test-mint.md`, `docs/runbooks/authority-rotation.md`, this SUMMARY)
- **Files modified:** 3 (`src/squads/index.ts`, `package.json`, `artifacts/devnet.json`)
- **On-chain transactions executed:** 17 (5 signer-fund transfers, 2 configTransactionCreate, 2 proposalCreate for config path, 6 approvals for config path, 2 configTransactionExecute, 1 vault funding transfer, 1 createMint, 1 vaultTransactionCreate, 1 proposalCreate for vault path, 3 approvals for vault path, 1 vaultTransactionExecute). Additional simulated-only: 1 (Pitfall 11 negative test — simulated, not sent).

## Accomplishments

### Task 1: Reusable proposal-lifecycle helpers

- **`src/squads/proposals.ts`** wraps the full 4-step Squads lifecycle (`propose → approve × N → execute`) for both vault transactions AND config transactions into 5 typed helpers: `proposeVaultTransaction`, `approveProposal`, `executeVaultTransaction`, `proposeConfigTransaction`, `executeConfigTransaction`. Plus 2 utilities: `nextTransactionIndex` and `buildVaultTransactionMessage`.
- **Inter-RPC confirmation baked in.** Every helper calls `connection.confirmTransaction(sig, 'confirmed')` before returning. This was discovered necessary when the first rotation drill attempt failed with `AnchorError 6009: InvalidTransactionIndex` — the @sqds/multisig helpers use `sendTransaction` (no built-in confirm), so back-to-back RPC calls race the ledger's view of state.
- **3 unit tests** covering (1) `nextTransactionIndex` returns `on-chain.transactionIndex + 1n` as bigint (mocked Multisig account), (2) `buildVaultTransactionMessage` sets `payerKey === vaultPda` and preserves instruction order (mocked connection), (3) all 5 lifecycle helpers + 2 utilities are exported as callable functions. All 11 repo tests still pass.

### Task 2: Rotation drill executed end-to-end

- **AddMember → 3 approvals → execute → RemoveMember → 3 approvals → execute** all ran against devnet multisig `6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu`.
- Throwaway pubkey `FCkfUQaoDdqENeYuVmBjXNnJ1w2CTog6nh8b6ph8ETxh` added at transaction index 2, then removed at index 3.
- **Net-zero member count** verified: pre-drill 6, post-AddMember 7, post-RemoveMember 6. Script asserts this invariant before exiting.
- Full transcript at `artifacts/devnet-sessions/rotation-drill.md` (79 lines): 2 configTransactionCreate txs, 2 proposalCreate txs, 6 approval txs (3 per proposal), 2 configTransactionExecute txs, explorer URLs, gotchas observed.
- **docs/runbooks/authority-rotation.md** (301 lines) captures the byte-level procedure for add + remove, including the `rentPayer: proposer` gotcha for AddMember and the mainnet web-UI approval difference.

### Task 3: Smoke-test mint proves vault PDA authority wiring

- **Positive path.** Throwaway Token-2022 mint `J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ` created on devnet with mint authority = freeze authority = vault PDA `5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu`. Squads vault transaction built containing `createAssociatedTokenAccountIdempotentInstruction` + `createMintToInstruction(..., vault_pda, 1_000_000n, ...)`. Three signer approvals collected. `vaultTransactionExecute` completed in tx `3GCGNTTir7KMu8X5uS4JUdjkYTUTVNg19Bk6X8XLqhL3igzsbNNs5gW4siibZRKzbtLicGX7AyeLN2kLzXGemfEk`. Recipient ATA balance verified: exactly 1,000,000 raw units (= 1.000000 with 6 decimals).
- **Negative path (Pitfall 11).** Same `createMintToInstruction` re-built with `multisig_address` (WRONG) as authority. Submitted to `connection.simulateTransaction` (not sent). Simulation failed as expected with `{"InstructionError":[0,{"Custom":4}]}` and Token-2022 program log `Error: owner does not match`. This is the byte-level failure signature to recognize if Pitfall 11 mitigation is ever bypassed.
- **`artifacts/devnet.json`** extended with `devnet_smoke_test` block (throwaway_mint, recipient, recipient_ata, amount_minted_raw="1000000", vault_transaction_index="4", execute_tx, **pitfall_11_negative_test_captured: true**, proved_at) AND `devnet_rotation_drill` block (add/remove tx sigs + transcript reference).
- **Phase 2 Success Criterion 4 devnet arm met.** GOV-04 devnet arm closed; mainnet arm still deferred to Phase 4 DEP-04.

## Task Commits

Each task was committed atomically:

1. **Task 1 — Reusable proposal-lifecycle helpers** — `d952dd7` (feat) — 3 files, 263 insertions (src/squads/proposals.ts, src/squads/proposals.test.ts, src/squads/index.ts barrel update)
2. **Task 2 — Devnet rotation drill + runbook** — `826435a` (feat) — 5 files, 654 insertions, 3 deletions (scripts/squads/rotate-devnet-signer.ts, artifacts/devnet-sessions/rotation-drill.md, docs/runbooks/authority-rotation.md, src/squads/proposals.ts confirmation fix, package.json)
3. **Task 3 — Smoke-test mint + Pitfall 11 negative test** — `aa6d41c` (feat) — 4 files, 473 insertions, 12 deletions (scripts/squads/smoke-test-mint.ts, artifacts/devnet-sessions/smoke-test-mint.md, artifacts/devnet.json, docs/runbooks/authority-rotation.md prettier-fixup)

## Key On-Chain Addresses & Transactions

**Multisig / vault (unchanged from Plan 02-02):**
- Multisig PDA: `6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu`
- Vault PDA: `5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu`
- Threshold: 3 of 6 (5 voting + 1 proposer-only)
- Post-plan-02-03 members: 6 (net-zero change from rotation drill)
- Post-plan-02-03 transactionIndex: 4 (after smoke-test mint's vault tx)

**Rotation drill (Task 2):**
- Throwaway member added/removed: `FCkfUQaoDdqENeYuVmBjXNnJ1w2CTog6nh8b6ph8ETxh`
- AddMember execute: `4KAQvUmXpMBfKw5baPEGRuHoVHrrT3rSJLZ7rzJVASVZf4rL97JAeQ9UZ2PrGjLc9akmTMtCXWst6yefyuQYxAuE` ([explorer](https://explorer.solana.com/tx/4KAQvUmXpMBfKw5baPEGRuHoVHrrT3rSJLZ7rzJVASVZf4rL97JAeQ9UZ2PrGjLc9akmTMtCXWst6yefyuQYxAuE?cluster=devnet))
- RemoveMember execute: `437EwdnwJhqEZL1t1h69VCTpcMTpaDuBS5eF5sz3wk9zs3gJXuTWPF6RPmoDRjQSaY5mZenoMt5HfRg1TNLSF9P9` ([explorer](https://explorer.solana.com/tx/437EwdnwJhqEZL1t1h69VCTpcMTpaDuBS5eF5sz3wk9zs3gJXuTWPF6RPmoDRjQSaY5mZenoMt5HfRg1TNLSF9P9?cluster=devnet))

**Smoke-test mint (Task 3):**
- Throwaway mint: `J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ`
- Recipient: `AkAHF7vdH66Ly6mgfkpRnTUPLdEM4xyLfBZP6b3jDhmL`
- Recipient ATA: `vcd179b5ZQFjzszMP9qV95cD3aoZDRvrh2vAwzx1s5Q`
- Amount minted: 1,000,000 raw units (1.000000 tokens with 6 decimals) — balance verified via `getAccount`
- Vault transaction index: 4
- Execute tx: `3GCGNTTir7KMu8X5uS4JUdjkYTUTVNg19Bk6X8XLqhL3igzsbNNs5gW4siibZRKzbtLicGX7AyeLN2kLzXGemfEk` ([explorer](https://explorer.solana.com/tx/3GCGNTTir7KMu8X5uS4JUdjkYTUTVNg19Bk6X8XLqhL3igzsbNNs5gW4siibZRKzbtLicGX7AyeLN2kLzXGemfEk?cluster=devnet))

**Mint authority verification (from getMint):**
- `getMint(J516...).mintAuthority` == vault PDA: PASS
- `getMint(J516...).freezeAuthority` == vault PDA: PASS
- `getAccount(vcd1...).amount` == 1_000_000: PASS

**Pitfall 11 negative test capture:**

```
err={"InstructionError":[0,{"Custom":4}]}
logs:
Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [1]
Program log: Instruction: MintTo
Program log: Error: owner does not match
Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 1288 of 200000 compute units
Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb failed: custom program error: 0x4
```

This is the byte-level failure signature that production monitoring MUST recognize if Pitfall 11 mitigation is ever bypassed.

## Decisions Made

1. **Inter-RPC confirmation wait built into every proposal helper** — see Deviation 1 below. This is a structural change: any future caller (Phase 3 devnet rehearsal, Phase 4 mainnet mint) automatically gets the robustness. The cost is ~500ms per call chain; acceptable for ceremony operations where reliability >> latency.
2. **`rentPayer: proposer` is documented AND encoded** — see Deviation 2 below. Mainnet signers won't have the SOL buffer that lets the executor-default pattern work for AddMember. Runbook enforces this.
3. **Pitfall 11 negative test runs AFTER the positive path** — if the positive path failed, there would be nothing to falsify. The sequence (positive prove + negative falsify) is the epistemically-correct order. If the negative test ever succeeded (meaning `multisig_address`-as-authority DIDN'T fail), the script throws `UNEXPECTED` and the invariant is flagged.
4. **Signer funding via proposer-internal-transfer, not faucet** — devnet faucet still exhausted from Plan 02-02. Proposer held 1.89 SOL surplus (funded in Plan 02-02 from id-devnet.json). 5 signers × 0.02 SOL = 0.1 SOL transferred; proposer retained 1.79 SOL. This pattern (proposer as internal top-up source) is operationally equivalent to how mainnet will work: user pre-funds proposer, proposer refills signers as needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Proposal lifecycle calls raced the ledger's view of transactionIndex**

- **Found during:** Task 2 first execution (`pnpm squads:rotate-devnet`)
- **Issue:** `configTransactionCreate` succeeded, but the immediate next call (`proposalCreate` with the same `transactionIndex`) failed with `AnchorError 6009: InvalidTransactionIndex`. Root cause: `@sqds/multisig`'s RPC helpers use `connection.sendTransaction(tx, sendOptions)` and return the signature without awaiting confirmation. When the caller chains another RPC using the same `transactionIndex`, the second call's on-chain preflight reads a state in which the configTransaction account doesn't yet exist (or `transactionIndex` hasn't advanced), and the Anchor program rejects the proposalCreate. This is the same confirmed-state-lag symptom seen in Plan 02-02 (post-tx account read), but on a different code path.
- **Fix:** Added a private `confirmSignature(connection, sig)` helper to `src/squads/proposals.ts` that calls `connection.confirmTransaction(...)` at `'confirmed'` commitment. Every multisig.rpc.* call in the 4 lifecycle helpers now has a `await confirmSignature(...)` before returning. This guarantees the chain is observably advanced before the next call fires.
- **Files modified:** `src/squads/proposals.ts`
- **Verification:** Second run of `pnpm squads:rotate-devnet` completed end-to-end on first attempt. `pnpm squads:smoke-mint` (8 chained RPC calls including 3 approvals + execute) also completed cleanly on first attempt. Unit tests still pass (3/3 on proposals.test.ts; 11/11 repo-wide).
- **Committed in:** `826435a` (Task 2 commit includes the fix; the file was bundled into Task 2's commit because Task 2 was the first caller to trip the bug and benefit from the fix)

**2. [Rule 2 - Missing critical functionality] AddMember executeConfigTransaction needed explicit rentPayer: proposer**

- **Found during:** Task 2 drill design (before execution)
- **Issue:** `multisig.rpc.configTransactionExecute` requires `rentPayer: Signer` when the ConfigAction grows the account (AddMember increases members[] length). The Plan's interface block shows `rentPayer: proposer` inline, but my initial draft of the helper would have defaulted `rentPayer = executor` when called without the arg. If the executor is a low-SOL voting signer (each has 0.02 SOL), the rent grow fails.
- **Fix:** `executeConfigTransaction` helper accepts optional `rentPayer?: Keypair` and defaults to `args.executor` if omitted. Call site in `rotate-devnet-signer.ts` explicitly passes `rentPayer: proposer` for AddMember (not for RemoveMember, which shrinks). Runbook documents this for Phase 4 mainnet.
- **Files modified:** `src/squads/proposals.ts`, `scripts/squads/rotate-devnet-signer.ts`, `docs/runbooks/authority-rotation.md`
- **Verification:** Drill AddMember executed successfully with proposer (1.79 SOL) covering rent; signer-1 (0.02 SOL) only paid the tx fee. No balance-related errors.
- **Committed in:** `826435a`

**3. [Rule 3 - Blocking] Signer wallets at 0 SOL from Plan 02-02 faucet exhaustion**

- **Found during:** Task 2 pre-flight balance check
- **Issue:** Plan 02-02 SUMMARY explicitly flagged that signer wallets were at 0 SOL because the devnet faucet daily limit had been exhausted. Without SOL, signers cannot sign proposal approvals (each approval tx costs ~0.000005 SOL). Plan 02-03 requires 3 approvals for each of 2 config proposals + 3 approvals for the smoke-test mint proposal + executeConfigTransaction + executeVaultTransaction = 11 signer-paid transactions.
- **Fix:** Transferred 0.02 SOL from proposer (1.89 SOL balance) to each of the 5 signers via `solana transfer` commands (5 individual transfers, each ~0.000005 SOL fee + 0.02 principal = ~0.10 SOL total out of proposer). Proposer retained ~1.79 SOL, enough for continued proposer-role operations. Signers each ended with exactly 0.02 SOL, enough for ~4000 tx fees each. This approach replicates the mainnet pattern: user pre-funds proposer, proposer is the internal top-up source for signers as needed.
- **Files modified:** None in repo (off-chain balance state). Transfer txs recorded on devnet.
- **Verification:** `solana balance --keypair keys/devnet/signer-N.json` returns `0.02 SOL` for all 5 signers. Rotation drill + smoke-test mint both ran successfully with signers paying their own tx fees.
- **Committed in:** N/A (off-chain balance state only)

**4. [Rule 3 - Blocking] Transcript format mismatched `grep -c "approve tx:"` acceptance regex**

- **Found during:** Task 2 acceptance verification (post-execution)
- **Issue:** My initial transcript template used `- signer-N: <sig>` for approval lines, but the plan's acceptance criterion requires `grep -c "approve tx:" artifacts/devnet-sessions/rotation-drill.md >= 6` (expecting 3 approvals × 2 proposals = 6 lines containing the literal string `approve tx:`). The mismatch was caught only by running the exact grep regex.
- **Fix:** Updated the transcript template in `rotate-devnet-signer.ts` to emit `- signer-N approve tx: \`<sig>\`` AND directly edited the already-written `artifacts/devnet-sessions/rotation-drill.md` to the same format (preserves the single canonical on-chain-executed drill's transcript without re-running). The signatures themselves are unchanged.
- **Files modified:** `scripts/squads/rotate-devnet-signer.ts`, `artifacts/devnet-sessions/rotation-drill.md`
- **Verification:** `grep -c "approve tx:" artifacts/devnet-sessions/rotation-drill.md` → 6 (exactly threshold × 2 proposals).
- **Committed in:** `826435a`

**5. [Rule 3 - Blocking] Prettier rejected initial commit's formatting**

- **Found during:** Task 3 initial commit attempt
- **Issue:** The pre-commit husky hook ran `prettier --check` on staged .ts/.md files; `scripts/squads/smoke-test-mint.ts` and `docs/runbooks/authority-rotation.md` had formatting differences from prettier's output (long lines wrapped inconsistently vs prettier's default). Commit aborted.
- **Fix:** Ran `pnpm format` (applies prettier), re-staged both files, retried the commit. Same fix pattern as Plan 02-02's prettier interactions — prettier is the canonical formatting authority.
- **Files modified:** `scripts/squads/smoke-test-mint.ts`, `docs/runbooks/authority-rotation.md`
- **Verification:** Pre-commit hook's `prettier --check` passes on the retry; all remaining gates (gitleaks, lang-audit, typecheck) also pass.
- **Committed in:** `aa6d41c` (Task 3)

---

**Total deviations:** 5 auto-fixed (1 bug, 1 missing-critical, 3 blocking)
**Impact on plan:** Deviations 1 and 2 are genuinely necessary correctness fixes that improve Phase 4 inheritance. Deviations 3 (faucet) is an environment constraint from Plan 02-02; resolution was straightforward. Deviations 4 (transcript format) and 5 (prettier) are authoring-level fix-ups caught by acceptance gates. No scope creep.

## Issues Encountered

- **@sqds/multisig fire-and-forget `sendTransaction` pattern creates race conditions in chained calls.** See Deviation 1. Fix is structural — baked into `src/squads/proposals.ts`. Phase 4 mainnet scripts that import from `src/squads/proposals` inherit the fix automatically. If any future script bypasses the helpers and calls `multisig.rpc.*` directly, it MUST add its own confirmation waits.
- **Faucet still exhausted at end of Plan 02-02.** See Deviation 3. Plan 02-03 worked around via proposer→signer internal transfers. Plans 02-04+ may need to re-check daily limits or continue the proposer-as-internal-treasury pattern.
- **Orphaned configTransaction at transaction index 1.** First failed-mid-flight attempt of the rotation drill created a configTransactionCreate at index 1 but failed to create the paired proposal (the AnchorError 6009 bug). The orphan is inoperable (no proposal = no approval path = no execute path). Accepted devnet cruft; no operational concern. Current on-chain `transactionIndex = 4` (post-smoke-test).

## User Setup Required

None. No external credentials were touched in this plan. Mainnet RPC URL still not needed (Plan 02-04 is the first that requires it).

## Phase 2 Criteria Contribution

**Phase 2 Success Criterion 1 (rotation drill clause):** _"A signer rotation drill has been executed end-to-end on the devnet Squads v4 multisig: one throwaway signer was added via a configTransactionCreate proposal signed by the threshold, and that same signer was then removed via a second proposal signed by the threshold — both proposals confirmed on-chain."_

- **MET.** Rotation drill executed end-to-end on devnet. Throwaway pubkey `FCkfUQaoDdqENeYuVmBjXNnJ1w2CTog6nh8b6ph8ETxh` added (tx `4KAQvUmXp...6yefyuQYxAuE`) then removed (tx `437EwdnwJh...LSF9P9`). Full transcript at `artifacts/devnet-sessions/rotation-drill.md`. Net-zero member count confirmed: pre-drill 6, post-drill 6.

**Phase 2 Success Criterion 4 (byte-level mint plan clause):** _"A byte-level plan exists for mainnet mint creation that uses the Squads vault PDA (not the multisig config account) as mint/freeze/update authority AND Permanent Delegate — verified by a successful multisig-signed mint transaction on devnet."_

- **MET (devnet arm).** Byte-level plan: `scripts/squads/smoke-test-mint.ts` is the byte-level code path. Throwaway Token-2022 mint `J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ` created on devnet with mint+freeze authorities = vault PDA. Multisig-signed mintTo succeeded in tx `3GCGNTTir7KM...GemfEk`; recipient ATA balance = 1,000,000 exactly. Phase 4 mainnet mint creation will reuse `src/squads/proposals.ts` verbatim. The MAINNET ARM of this criterion (on-chain check against the production mint) requires the production mint to exist, which is Phase 4 TOK-01..TOK-06; the full criterion closes in Phase 4 DEP-04.

**GOV-04 requirement (devnet arm only):** _"On MAINNET, mint/freeze/update authorities all point to Squads vault PDA."_

- **Devnet arm: MET.** The devnet smoke-test mint demonstrates the pattern works. `artifacts/devnet.json.devnet_smoke_test.pitfall_11_negative_test_captured: true` is the machine-verifiable flag that the negative test ran and captured a real failure signature.
- **Mainnet arm: STILL OPEN.** Deferred to Phase 4 DEP-04 (mainnet mint does not yet exist). Do NOT mark GOV-04 as fully complete in REQUIREMENTS.md; it is partially complete, with the devnet arm closed and the mainnet arm tracking in Phase 4.

## Next Plan Readiness (02-04: Mainnet Preflight)

**For Plan 02-04:**

- Import surface is stable: `import { proposeVaultTransaction, approveProposal, executeVaultTransaction, proposeConfigTransaction, executeConfigTransaction } from '../../src/squads/index.js'`. All 5 lifecycle helpers are typed and tested.
- Inter-RPC confirmation is guaranteed — Plan 02-04 dry-runs against mainnet RPC will not trip the InvalidTransactionIndex race that devnet tripped.
- `scripts/squads/verify-vault.ts` works unchanged against `--network mainnet-beta` once `.env.mainnet` is populated.
- `docs/runbooks/authority-rotation.md` is the template for `docs/runbooks/mainnet-ceremony.md` (to be drafted in Plan 02-04 or 02-05). Mainnet differences are documented inline.
- Proposer balance for Plan 02-04 (if any on-chain actions needed): 1.79 SOL (devnet). Mainnet proposer does not yet exist; will be funded at Plan 02-04 preflight or 02-05 ceremony prep.

**For Plan 02-05 (mainnet ceremony):**

- The entire src/squads/proposals surface is the mainnet ceremony code path. Squads web UI handles the hardware-wallet approval step; the script side uses `proposeVaultTransaction` and `executeVaultTransaction` identically to devnet.
- Pitfall 11 mechanization is now triple-redundant: single code path (`deriveVaultPda`), runtime invariant check (`verifyVaultAuthority`), AND byte-level negative-test-captured failure signature. Phase 4 mint creation inherits all three.

**Phase 2 open items:**

- Faucet exhaustion may persist; Plan 02-04 may need to continue proposer-internal-transfer pattern or wait for daily limit reset.
- Mainnet RPC credential (`HELIUS_MAINNET_RPC_URL`) first required in Plan 02-04 preflight.

## Self-Check: PASSED

**Files created verified:**

- `src/squads/proposals.ts` FOUND
- `src/squads/proposals.test.ts` FOUND
- `scripts/squads/rotate-devnet-signer.ts` FOUND
- `scripts/squads/smoke-test-mint.ts` FOUND
- `artifacts/devnet-sessions/rotation-drill.md` FOUND
- `artifacts/devnet-sessions/smoke-test-mint.md` FOUND
- `docs/runbooks/authority-rotation.md` FOUND

**Files modified verified:**

- `src/squads/index.ts` contains `export * from './proposals.js';` FOUND
- `package.json` contains `squads:rotate-devnet` + `squads:smoke-mint` FOUND
- `artifacts/devnet.json` contains `devnet_smoke_test` + `devnet_rotation_drill` FOUND

**Commits verified:**

- `d952dd7` FOUND: `feat(02-03): add reusable Squads proposal-lifecycle helpers`
- `826435a` FOUND: `feat(02-03): execute devnet signer rotation drill + runbook`
- `aa6d41c` FOUND: `feat(02-03): smoke-test mint proves devnet vault PDA authority wiring`

**Verification commands (run in order; all passed):**

- `pnpm typecheck` → exit 0 (VERIFIED)
- `pnpm test` → 11 tests passing across 2 files (VERIFIED)
- `pnpm lang:audit` → "OK — no violations found." on 8 files in scope (VERIFIED)
- `pnpm gitleaks` → "no leaks found" across 34 commits (VERIFIED)
- `grep -c "PROOF OK" artifacts/devnet-sessions/smoke-test-mint.md` → 1 (VERIFIED)
- `grep -c "Pitfall 11 negative test" artifacts/devnet-sessions/smoke-test-mint.md` → 1 (VERIFIED)
- `grep -cE "err=|throw:" artifacts/devnet-sessions/smoke-test-mint.md` → 1 (VERIFIED; negative-test failure capture embedded)
- `grep -c "configTransactionCreate tx:" artifacts/devnet-sessions/rotation-drill.md` → 2 (VERIFIED)
- `grep -c "configTransactionExecute tx:" artifacts/devnet-sessions/rotation-drill.md` → 2 (VERIFIED)
- `grep -c "approve tx:" artifacts/devnet-sessions/rotation-drill.md` → 6 (VERIFIED; 3×2 proposals)
- `wc -l docs/runbooks/authority-rotation.md` → 301 lines (>= 40 required) (VERIFIED)
- `wc -l artifacts/devnet-sessions/rotation-drill.md` → 79 lines (>= 30 required) (VERIFIED)
- `wc -l artifacts/devnet-sessions/smoke-test-mint.md` → 93 lines (>= 40 required) (VERIFIED)
- `node -e "<artifact.devnet_smoke_test invariants>"` → exit 0 (execute_tx present, amount_minted_raw='1000000', pitfall_11_negative_test_captured===true) (VERIFIED)
- `pnpm squads:verify-vault --network devnet --multisig 6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu` → "Threshold: 3 of 6" + member list unchanged from Plan 02-02 (VERIFIED; rotation drill net-zero)

---

_Phase: 02-squads-multisig-setup-devnet-mainnet_
_Plan: 03_
_Completed: 2026-04-20_
