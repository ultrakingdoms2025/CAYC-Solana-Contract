# Mainnet Squads v4 Ceremony Preflight Runbook

**Version:** 1.0
**Status:** Active
**Applies to:** Plan 02-05 (Mainnet Squads v4 multisig creation ceremony)
**Gate note:** Plan 02-05 will refuse to run until `artifacts/mainnet-preflight.json` exists with `overall: pass`. This runbook tells the ceremony coordinator how to get there.

---

## Purpose

The mainnet ceremony is the first time 5 humans with Ledger hardware wallets interact with this production codebase. Every failure mode that can be detected in advance should be detected in advance, because the ceremony's cost of failure is high: rescheduling a 5-party synchronous window is slow, every attempt spends mainnet SOL, and each partial attempt creates on-chain cruft that future reviewers will ask about.

This runbook enumerates every gate that MUST pass before the ceremony is initiated. Items are grouped into five stages (A through E) and each stage gates the next. The final stage (E) is automated via `scripts/squads/preflight-mainnet.ts` and writes `artifacts/mainnet-preflight.json`; Plan 02-05's first task reads that artifact and aborts if `overall != pass`.

Every item below has:

- a **checkbox** (hand-executed during preflight),
- a **how-to-verify** line (explicit command or observation the owner performs),
- an **owner** (signer, coordinator, or script).

## Ordering

Items are grouped into FIVE stages. Each stage gates the next.

- **Stage A** (coordinator setup, T-minus 7 days) blocks Stages B-E
- **Stage B** (per-signer readiness, T-minus 3 days) blocks Stages C-E
- **Stage C** (funding, T-minus 1 day) blocks Stages D-E
- **Stage D** (codebase readiness, T-minus 1 hour) blocks Stage E
- **Stage E** (automated preflight, T-minus 15 minutes) is the final go/no-go gate

A single fail in any stage moves the team to the "Abort criteria" section below.

---

## Stage A - Coordinator setup (T-minus 7 days)

Owner: **coordinator**

- [ ] **A1. Final signer roster confirmed.** 5 voting members + 1 proposer. No duplicates; no two members share a device. Real identities are kept OUTSIDE the repo (private coordinator artifact). Pseudonyms + pubkeys are committed in `docs/security/signer-roster.md` AFTER the ceremony (Plan 02-06).
      How-to-verify: coordinator's private ledger shows 6 distinct humans + 6 distinct Ledger devices; pseudonyms chosen for repo publication.

- [ ] **A2. Ceremony date/time chosen; synchronous 90-minute window.** All 5 voting signers confirm availability via encrypted channel. Timezones recorded. Backup date agreed in case of any Stage-A-D fail.
      How-to-verify: coordinator's private calendar has 5 confirmations AND a backup date; timezones recorded so rollover-midnight cases are unambiguous.

- [ ] **A3. Vendor-diversity tradeoff acknowledged.** ROADMAP.md Phase 2 Success Criterion 2 recommended device-diverse hardware wallets (mixed vendors). CONTEXT.md §decisions locks all-Ledger. The item below is copied verbatim from the plan; the acceptance-criteria grep looks for the tokens "vendor diversity", "all-Ledger", and "accepted tradeoff" somewhere in this runbook.

      > **Vendor diversity: ACCEPTED TRADEOFF.** ROADMAP Phase 2 Success Criterion 2 recommended device-diverse hardware wallets (e.g., Ledger + Trezor + Keystone) to limit single-vendor-failure blast radius. CONTEXT.md §decisions overrides to all-Ledger for Solana tooling maturity and signer onboarding simplicity. Accepted tradeoff: a Ledger-wide vulnerability would affect all 5 signers simultaneously. Mitigations documented in `docs/security/signer-roster.md` §"Vendor diversity".

      How-to-verify: this item has the word "ACCEPTED TRADEOFF" and the phrases "vendor diversity" and "all-Ledger" visible above.

- [ ] **A4. Copycat re-check scheduled.** Per `docs/policies/clawback-freeze-policy.md` section 15, a fresh 4-platform (Jupiter + Solscan + CoinGecko + CMC) symbol-availability re-check is scheduled within 72 hours before ceremony start. Output recorded in `docs/symbol-availability-check.md` as an appended dated entry.
      How-to-verify: coordinator's calendar item for the re-check; updated `docs/symbol-availability-check.md` entry no older than 72h at ceremony start.

## Stage B - Signer readiness (per signer, T-minus 3 days)

Owner: **each of 5 voting signers** (coordinator tracks completion)

- [ ] **B1. Ledger firmware current.** Signer's Ledger firmware version recorded and matches latest stable shown in Ledger Live. (Do NOT ceremony on a device that auto-updated within the last 24h - let the update bake.)
      How-to-verify: screenshot of Ledger Live → Device manager showing "Up to date" status; firmware version recorded in coordinator's private log.

- [ ] **B2. Solana app installed, current, Blind Signing enabled.** Solana app version recorded; `Settings → Blind signing → Enabled`. Squads v4 transactions are complex and older Solana apps reject them without blind signing.
      How-to-verify: on device, navigate Settings → Solana → Blind signing; value reads "Enabled".

- [ ] **B3. Seed backup integrity test: METAL-PLATE READ-BACK.** Coordinator picks a random word position (e.g., "word #17"). Signer reads ONLY that word from their metal plate. Full seed never disclosed. This confirms the plate is in the signer's possession, readable, and matches the device.
      How-to-verify: signer returns the single word out-of-band (encrypted channel). Coordinator does NOT record the word (the verification is the liveness check, not the cryptographic value).

- [ ] **B4. Wallet pairing tested.** Phantom or Solflare paired with the Ledger on the same machine the signer will use during the ceremony. A dry-run test signature (e.g., a small devnet transfer) flows through without errors.
      How-to-verify: signer reports successful test signature; coordinator ticks the box.

- [ ] **B5. Signer pubkey captured via encrypted channel.** Signer's Solana-app pubkey shared via Signal, encrypted email, or in-person. Coordinator records in the PRIVATE artifact (NOT in the repo). A pseudonym for the repo publication is chosen in the same step.
      How-to-verify: coordinator's private artifact has 5 pubkeys; `docs/security/signer-roster.md` has 5 pseudonym slots ready to receive them in Plan 02-06.

- [ ] **B6. Liveness check confirmed.** Signer commits to responding to ceremony-day coordination messages within a named SLA (e.g., 15 minutes) during the ceremony window.
      How-to-verify: signed commitment in coordinator's private artifact with SLA value.

- [ ] **B7. Physical security posture.** Ledger device physically present during ceremony. Seed phrase on metal plate remains in fireproof safe at a DIFFERENT physical location from the device.
      How-to-verify: signer affirms the split-location posture; coordinator records the affirmation (not the locations).

## Stage C - Funding (T-minus 1 day, or ceremony day morning)

Owner: **coordinator** (for proposer); **signers or coordinator** (for signer SOL)

- [ ] **C1. Proposer hot wallet funded.** Mainnet SOL balance of the proposer pubkey is **≥ 2 SOL**. Covers multisig creation (~0.003 SOL rent), proposal submissions during ceremony (~0.000005 SOL each), and a comfortable safety margin. Keypair path recorded in `.env.mainnet` as `MAINNET_PROPOSER_KEYPAIR_PATH`.
      How-to-verify: `solana balance --keypair $MAINNET_PROPOSER_KEYPAIR_PATH --url $HELIUS_MAINNET_RPC_URL` prints ≥ 2 SOL. Re-verified by Stage E automation (E5).

- [ ] **C2. Each signer pubkey funded.** Each of the 5 voting signer pubkeys has mainnet SOL balance **≥ 0.5 SOL**. Covers signer tx fees during ceremony + rotation drill safety margin. Funded either from the proposer wallet OR each signer's own wallet (CONTEXT.md Claude's Discretion).
      How-to-verify: `solana balance <pubkey> --url $HELIUS_MAINNET_RPC_URL` for each of the 5 signers prints ≥ 0.5 SOL. Re-verified by Stage E automation (E6-E10). PITFALLS.md Pitfall 5 mitigation.

- [ ] **C3. RPC keys + quotas.** `HELIUS_MAINNET_RPC_URL` is set in `.env.mainnet`. Helius dashboard → Usage shows ≥ 20 transactions of headroom for the ceremony month (Business tier recommended per STACK.md §"Network & RPC Strategy").
      How-to-verify: coordinator logs in to https://dashboard.helius.dev → Usage; headroom visible; API key tested by a read-only `getLatestBlockhash` call via `curl` or the preflight script (E3).

- [ ] **C4. Secondary RPC (optional but recommended).** `MAINNET_FALLBACK_RPC` set in `.env.mainnet` (Triton, QuickNode, or a second Helius key). Used as the fallback if the primary drops mid-ceremony.
      How-to-verify: `.env.mainnet` has a non-empty `MAINNET_FALLBACK_RPC` line (or an explicit decision to run single-RPC documented in the coordinator's notes).

## Stage D - Codebase + artifact readiness (ceremony day, T-minus 1 hour)

Owner: **coordinator** (repo operations)

- [ ] **D1. Clean working tree.** `git status` prints empty (no uncommitted changes). Ceremony runs off a known, reviewed commit SHA.
      How-to-verify: `git status --porcelain` returns no lines.

- [ ] **D2. Commit SHA captured.** `git rev-parse HEAD` recorded for the ceremony transcript (Plan 02-05 writes it into `artifacts/mainnet.json`).
      How-to-verify: coordinator copies the SHA into the ceremony coordination note; the preflight script also captures it at (E) time.

- [ ] **D3. Dependencies installed.** `pnpm install --frozen-lockfile` exits 0.
      How-to-verify: `pnpm install --frozen-lockfile` exit code is zero; no `pnpm-lock.yaml` drift.

- [ ] **D4. Typecheck clean.** `pnpm typecheck` exits 0.
      How-to-verify: `pnpm typecheck` exit code is zero.

- [ ] **D5. Unit tests pass.** `pnpm test` passes all suites. `src/squads/` tests MUST pass — Plan 02-05 consumes these helpers.
      How-to-verify: `pnpm test` exits 0; failing suite count is zero.

- [ ] **D6. Language audit clean.** `pnpm lang:audit` exits 0. New ceremony-related copy complies with `docs/style-guide.md`.
      How-to-verify: `pnpm lang:audit` exit code is zero.

- [ ] **D7. Gitleaks clean.** `pnpm gitleaks` exits 0. No secrets in committed history.
      How-to-verify: `pnpm gitleaks` exit code is zero; output reports zero leaks across all commits.

- [ ] **D8. Devnet smoke test still in place.** `artifacts/devnet-sessions/smoke-test-mint.md` still has the `PROOF OK` marker. `artifacts/devnet.json` still has `devnet_smoke_test.execute_tx` populated. Plan 02-03's proof is intact; the mainnet authority pattern is the same pattern the devnet proof validated.
      How-to-verify: `grep 'PROOF OK' artifacts/devnet-sessions/smoke-test-mint.md` returns one line; `devnet.json` `devnet_smoke_test.execute_tx` is a non-empty string. Re-verified by Stage E automation (E11).

- [ ] **D9. Signer-roster template ready.** `docs/security/signer-roster.md` exists with exactly 5 pseudonymous voting-member slots and 1 proposer slot. Pubkey fields blank — filled in Plan 02-06 after the ceremony.
      How-to-verify: `grep -c '^### Signer' docs/security/signer-roster.md` prints 5; `grep 'Proposer hot wallet' docs/security/signer-roster.md` returns at least one line.

- [ ] **D10. Squads v4 program id verified by eye.** `src/squads/constants.ts` shows `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` (PITFALLS.md Pitfall 7 mitigation). Read the literal by eye against a printed copy or the Squads docs URL in the file header comment.
      How-to-verify: `grep 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf' src/squads/constants.ts` returns one line; coordinator re-reads the literal character-by-character against docs.squads.so.

## Stage E - Automated preflight (ceremony day, T-minus 15 minutes)

Owner: **coordinator runs the script; Plan 02-05 reads the artifact**

- [ ] **E1. Run `pnpm squads:preflight-mainnet`.** The script loads `.env.mainnet`, asserts `CONFIRM_MAINNET=yes-mainnet-ceremony`, connects to the Helius mainnet RPC, checks proposer balance ≥ 2 SOL, and checks each of the 5 candidate voting-signer pubkeys has ≥ 0.5 SOL. Writes `artifacts/mainnet-preflight.json` with per-item pass/fail + an overall verdict. The artifact MUST NOT contain any `api-key=` substring — the script records the RPC hostname/origin only, stripping the Helius URL's query string where the API key lives.
      How-to-verify: script exit code; inspect `artifacts/mainnet-preflight.json`.

- [ ] **E2. `artifacts/mainnet-preflight.json` has `overall: pass`.** Any item with `pass: false` must be resolved first, then the script re-run. Plan 02-05's first task refuses to proceed if this artifact is missing OR if `overall != pass`.
      How-to-verify: `node -e "process.exit(JSON.parse(require('fs').readFileSync('artifacts/mainnet-preflight.json')).overall === 'pass' ? 0 : 1)"` exit code is zero.

## Abort criteria

The ceremony is aborted and rescheduled if any of the following occur within the 4-hour window before the scheduled start:

- Any Stage A-D item is fail and cannot be resolved in < 60 minutes.
- Fewer than 5 voting signers + 1 proposer available at scheduled start.
- Helius mainnet RPC degraded (status.helius.dev shows an incident, OR the preflight script's test `getLatestBlockhash` latency exceeds 30 seconds).
- Solana mainnet degraded (status.solana.com shows a reduced-performance or outage incident).
- Any signer reports an unfamiliar prompt on their Ledger during Stage B4 test signing (potential phishing / malware indicator — investigate before proceeding).
- Stage E `overall: fail` where a fail item cannot be resolved in < 60 minutes.

If the ceremony is aborted, the coordinator posts the reason in the private coordination channel, updates the calendar to the Stage A2 backup date, and re-runs Stages C-E on the new date.

## Accepted tradeoffs (document trail for CEX reviewers)

CEX compliance teams reading this runbook should understand that CAYC has made three deliberate tradeoffs, each documented here for transparency.

1. **All-Ledger roster (no vendor diversity).** See Stage A3 above. Rationale: Solana tooling maturity on Ledger (Solana app is first-party; Trezor + Keystone Solana support lags). Mitigation: signers on current firmware, annual firmware refresh campaign in Phase 5 ops runbook, regional timezone distribution so a simultaneous firmware-rollout regression can be detected before all 5 update. Full detail in `docs/security/signer-roster.md` §"Vendor diversity". This is an **accepted tradeoff**.

2. **No v2 / DAO migration in v1 (PROJECT.md lock).** CAYC's governance is Squads v4 multisig, not on-chain DAO voting, for v1. Rationale: PROJECT.md Key Decisions. Revisited in the v2 milestone if ecosystem conditions merit.

3. **Proposer is Squads member with Initiate permission only.** The proposer hot wallet CAN propose and CANNOT vote or execute. Rationale: the proposer pattern removes hardware-wallet friction for routine proposing. Spam risk is bounded because threshold=3 voting members must still approve. Quarterly rotation in Phase 5 operational policy.

## See also

- `docs/security/signer-roster.md` — pseudonymous signer roster (pubkeys filled in Plan 02-06 after the ceremony).
- `docs/runbooks/authority-rotation.md` — rotation procedure (Plan 02-03 drill on devnet; same procedure on mainnet).
- `.planning/phases/02-squads-multisig-setup-devnet-mainnet/02-05-PLAN.md` — the ceremony itself.
- `docs/policies/mint-policy.md` section 2 Authority model.
- `docs/policies/clawback-freeze-policy.md` section 2 Authority model.
- Script implementation: `scripts/squads/preflight-mainnet.ts` (Stage E automation).

---

_Runbook created: 2026-04-20 (Phase 2 Plan 02-04)._
_Next review: immediately before ceremony start in Plan 02-05._
