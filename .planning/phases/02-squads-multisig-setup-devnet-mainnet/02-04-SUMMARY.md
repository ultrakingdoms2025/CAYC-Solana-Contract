---
phase: 02-squads-multisig-setup-devnet-mainnet
plan: 04
subsystem: infra
tags: [squads-v4, multisig, mainnet-preflight, runbook, signer-roster, pitfall-5, pitfall-10, governance]

# Dependency graph
requires:
  - phase: 02-squads-multisig-setup-devnet-mainnet
    provides: src/squads helper surface (Plan 02-01), devnet multisig + vault PDA + artifacts/devnet.json (Plan 02-02), src/squads/proposals.ts lifecycle helpers + artifacts/devnet-sessions/smoke-test-mint.md PROOF OK + docs/runbooks/authority-rotation.md (Plan 02-03)
provides:
  - docs/runbooks/mainnet-squads-ceremony-preflight.md — 5-stage (A-E) preflight checklist; Stage A3 encodes the ROADMAP-vs-CONTEXT vendor-diversity ACCEPTED TRADEOFF (grep-verifiable tokens "vendor diversity", "all-Ledger", "accepted tradeoff"); Stage E points to the automated preflight script
  - docs/security/signer-roster.md — pseudonymous 5-voting + 1-proposer signer-roster template; pubkeys blank (filled in Plan 02-06); §"Vendor diversity" documents the all-Ledger tradeoff and its mitigations (firmware campaign, regional distribution, rotation drill rehearsed, migration-if-disclosure path)
  - scripts/squads/preflight-mainnet.ts — automated Stage E gate; 12 checks (E0-E11); safeEndpoint() + finalize-time refuse-to-write guard block any Helius api-key leak from the artifact
  - artifacts/mainnet-preflight.json — machine-readable verdict; Plan 02-05 first task gates on `overall == "pass"`
  - package.json: pnpm squads:preflight-mainnet script wiring
affects:
  - 02-05 (mainnet ceremony — first task reads artifacts/mainnet-preflight.json and aborts unless overall=pass; uses docs/runbooks/mainnet-squads-ceremony-preflight.md as the live gate)
  - 02-06 (artifact publication — fills the pubkey slots in docs/security/signer-roster.md from the ceremony transcript; also the runbook's See also cross-refs)

# Tech tracking
tech-stack:
  added:
    - "scripts/squads/preflight-mainnet.ts — zero new deps; uses @solana/web3.js ^1.98.4 (Keypair, PublicKey, Connection via buildConnection), node:child_process execFileSync (not execSync — repo security convention), node:fs, node:path — all already pinned or stdlib"
  patterns:
    - "Automated gate pattern: read-only script emits a structured artifact (pass/fail per item + overall verdict); the NEXT plan's first task reads the artifact and refuses to proceed unless overall=pass. Template applies to every subsequent gated ceremony."
    - "safeEndpoint() URL sanitization: new URL(url) → return only protocol + host + pathname (strip query string); fallback strips everything after first '?'. Applied anywhere an HTTP URL enters an artifact/log/error message to prevent API-key leakage via query-string credentials (Helius, any similar paid RPC with keys-in-query-string)."
    - "Defense-in-depth refuse-to-write guard: finalize() serializes the full JSON, regex-scans for /api[-_]?key\\s*=/i, and exits 2 (DIFFERENT exit code from the normal pass=0/fail=1) if matched. Catches any new code path that bypasses safeEndpoint()."
    - "Pre-ceremony expected-fail state: the committed artifacts/mainnet-preflight.json has overall=fail BY DESIGN because .env.mainnet is intentionally absent at this point. Plan 02-05 will re-run the script AFTER the coordinator populates .env.mainnet. The committed artifact's existence proves the script runs cleanly and the file-shape contract is honored; the 'fail' verdict is the correct pre-ceremony signal."
    - "Pseudonymous roster template pattern: commit the file WITHOUT pubkeys now; Plan 02-06 fills pubkey fields after the mainnet ceremony transcript is captured. Pubkey blanks are literal strings (_filled in Plan 02-06..._) so reviewers immediately see which slots are pending."
    - "Grep-verifiable tradeoff acknowledgement pattern: when a plan overrides a ROADMAP success criterion, the acknowledgement is encoded as literal string tokens in committed docs, and acceptance criteria grep for those tokens. Any future edit that silently removes the acknowledgement fails CI. Tokens used here: 'vendor diversity', 'all-Ledger' (or variants), 'accepted tradeoff'."

key-files:
  created:
    - "docs/runbooks/mainnet-squads-ceremony-preflight.md — 175 lines; 5 stages × 4-10 items each; abort criteria; accepted tradeoffs section; see-also cross-refs"
    - "docs/security/signer-roster.md — 116 lines; 5 voting-member slots (Signer 1..5) + 1 Proposer hot wallet slot; Vendor-diversity section with ACCEPTED TRADEOFF acknowledgement; Policy binding + Version history"
    - "scripts/squads/preflight-mainnet.ts — 225 lines; 12 checks (E0 env-file-exists, E1 CONFIRM_MAINNET guard, E2 rpc-url, E3 rpc-reachable, E4 proposer-keypair-loadable, E5 proposer-balance-≥-2-SOL, E6-E10 signer-balances-≥-0.5-SOL, E11 devnet-smoke-test-intact); safeEndpoint() + finalize-time guard"
    - "artifacts/mainnet-preflight.json — 14 lines currently (1 check: E0 fail); will grow to 12-check artifact when .env.mainnet is populated for Plan 02-05"
  modified:
    - "package.json — added squads:preflight-mainnet script entry (no new deps)"

key-decisions:
  - "Preflight artifact committed with overall=fail as the expected pre-ceremony state. Alternative considered: do not commit the artifact at all until .env.mainnet exists. Rejected because the plan's acceptance criteria explicitly require artifacts/mainnet-preflight.json to exist after the Task 2 dry-run, and the fail verdict is the correct signal that Plan 02-05 is not yet unblocked. The artifact shape + the refuse-to-write guard are what the plan is validating; the overall=fail is informational."
  - "Identity-marker grep (real name|given name|surname|first name|last name) forced a rewrite of the visibility paragraph in signer-roster.md. Original draft used the explicit negation 'It contains NO real names, NO email addresses, ...' — linguistically clearer but the literal tokens tripped the acceptance-criteria grep. Rewrote to 'no personally-identifying information, no email addresses, no device serial numbers, no physical addresses' which communicates the same invariant without the forbidden tokens."
  - "Vendor-diversity tradeoff tokens duplicated across TWO committed files (runbook Stage A3 AND roster §Vendor diversity) so the grep-detectable acknowledgement has two independent anchor points. A future edit that silently removes the acknowledgement would have to remove it from BOTH files to break the combined grep — unlikely to happen by accident."
  - "Finalize-time refuse-to-write guard uses exit code 2 (not 1) for the leak-detect branch. Exit 1 is 'overall=fail' (expected pre-ceremony); exit 2 is 'leak detected, artifact refused' (programmer error). Plan 02-05 distinguishes these when reading the gate."
  - "Gitleaks PATH recipe re-applied session-wide before first commit per Phase 2 convention (see Plan 02-01 SUMMARY §Issues Encountered). which gitleaks at plan start returned 'not found'; export PATH prefix restored gitleaks 8.30.1; both task commits and pre-commit hooks ran green afterwards."

patterns-established:
  - "Gate artifacts as the handoff medium between plans: the preflight verdict is a JSON file with a contract (schema: generated_at, commit_sha, overall, check_count, pass_count, checks[]), not a flag in STATE.md or a grep against console output. Plan 02-05 reads the file; the file is the interface."
  - "Pre-ceremony scripts run with missing/placeholder config and produce informative fail artifacts, not crashes. The preflight script short-circuits at E0 (no .env.mainnet) with a clean fail artifact — does not hit E2-E11 uninitialized. Plan 02-05 pattern: every gate script must succeed at writing its artifact even when the ceremony is not yet ready."
  - "URL-in-artifact hygiene: any URL that carries a credential in its query string (Helius, paid RPC, any api-key-in-URL pattern) goes through safeEndpoint() before entering the artifact. Convention applies in Plan 02-05 (mainnet ceremony artifact) and Plan 02-06 (publication artifact)."

requirements-completed: []  # GOV-02 remains open until Plan 02-05 creates the mainnet multisig; GOV-03 remains open until Plan 02-06 publishes the pubkeys. This plan is the SUBSTRATE for both — it does not close them.

requirements-enabled: [GOV-02, GOV-03]  # Preflight gate (GOV-02 prereq); pseudonymous roster template (GOV-03 prereq).

# Metrics
duration: 7min
completed: 2026-04-20
---

# Phase 2 Plan 4: Mainnet Ceremony Preflight + Signer Roster Template Summary

**5-stage preflight runbook (A coordinator-setup → B per-signer → C funding → D codebase → E automated script) + pseudonymous signer-roster template (5 voting + 1 proposer, all Ledger per CONTEXT.md override) + scripts/squads/preflight-mainnet.ts read-only gate script with safeEndpoint() API-key hygiene + finalize-time refuse-to-write guard. Plan 02-05 (mainnet ceremony) is now hard-gated on `artifacts/mainnet-preflight.json.overall == "pass"`; the pre-ceremony committed artifact correctly reports `overall: fail` because `.env.mainnet` is intentionally absent until the coordinator populates it immediately before the ceremony. Vendor-diversity ACCEPTED TRADEOFF is grep-detectable in both runbook Stage A3 and roster §Vendor diversity so a silent future edit cannot remove the ROADMAP-override acknowledgement without breaking CI.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-20T05:14:24Z
- **Completed:** 2026-04-20T05:21:56Z
- **Tasks:** 2 / 2
- **Files created:** 4 (2 docs + 1 script + 1 artifact)
- **Files modified:** 1 (package.json)

## Accomplishments

### Task 1: Preflight runbook + pseudonymous signer-roster template

- **`docs/runbooks/mainnet-squads-ceremony-preflight.md`** (175 lines) — The single authoritative pre-ceremony checklist. 5 stages (A-E), 4-10 items per stage, each item has owner + how-to-verify. Stage A3 encodes the ROADMAP-vs-CONTEXT vendor-diversity tradeoff as a verbatim blockquote; Stage E points operators at `pnpm squads:preflight-mainnet` and commits them to `artifacts/mainnet-preflight.json.overall == "pass"` as the unblock signal for Plan 02-05.
- **`docs/security/signer-roster.md`** (116 lines) — 5 voting-member slots (`### Signer 1` through `### Signer 5`) + 1 proposer slot (`### Proposer hot wallet`). All pseudonymous; pubkey fields are literal placeholder strings (`_filled in Plan 02-06 from mainnet ceremony transcript_`) so Plan 02-06 knows exactly which slots to fill. §"Vendor diversity" documents the all-Ledger tradeoff with 4 concrete mitigations (current firmware, regional distribution, rotation drill rehearsed on devnet, migration path via `docs/runbooks/authority-rotation.md` if a Ledger-wide vulnerability is disclosed).
- **Grep-verifiable tradeoff acknowledgement.** Literal tokens `vendor diversity`, `all-Ledger` (and case variants), and `accepted tradeoff` are present in both files. Acceptance-criteria greps confirmed; a future edit that silently removes the acknowledgement would break CI.
- **Language-audit clean.** `pnpm lang:audit` passes on the scan set (9 files, runbook included; signer-roster excluded per `docs/style-guide.md` section 8 allowlist of `docs/security/`).
- **Forbidden identity markers absent.** `grep -iE 'real name|given name|surname|first name|last name' docs/security/signer-roster.md` returns empty (required by acceptance criteria for the pseudonymous-commitment guarantee).

### Task 2: Automated preflight script + Stage E gate

- **`scripts/squads/preflight-mainnet.ts`** (225 lines, prettier-formatted) — read-only mainnet ceremony preflight. 12 checks:
  - **E0** — `.env.mainnet` exists
  - **E1** — `CONFIRM_MAINNET=yes-mainnet-ceremony` (via `loadEnv('mainnet-beta')`)
  - **E2** — `HELIUS_MAINNET_RPC_URL` set and not a placeholder
  - **E3** — mainnet RPC reachable (`getLatestBlockhash` + `getSlot`)
  - **E4** — `MAINNET_PROPOSER_KEYPAIR_PATH` file exists + loadable → pubkey derived
  - **E5** — proposer mainnet balance ≥ 2 SOL
  - **E6-E10** — each of 5 candidate voting-signer pubkeys (`MAINNET_SIGNER_1_PUBKEY`..`MAINNET_SIGNER_5_PUBKEY`) has ≥ 0.5 SOL
  - **E11** — devnet smoke-test artifact intact (`PROOF OK` marker + `devnet.json.devnet_smoke_test.execute_tx` populated)
- **API-key hygiene.** `safeEndpoint(url)` strips query strings before any URL enters a detail field. Finalize-time regex `/api[-_]?key\s*=/i` on the full serialized JSON refuses to write the artifact (exit code 2, distinct from exit 1 pass/fail) if any leak is detected — defense-in-depth against any future code path that bypasses `safeEndpoint()`.
- **Exec-hygiene.** Uses `execFileSync` (not `execSync` with shell) per repo security conventions. `grep -cE '\bexecSync\b'` returns 0.
- **Dry-run produces the expected informative fail artifact.** With `.env.mainnet` absent (the pre-ceremony state), the script short-circuits at E0 and writes a 14-line artifact with `overall: "fail"`, `check_count: 1`, `pass_count: 0`, and `checks[0].detail` explaining the coordinator's next action. Exit code 1.
- **Artifact schema invariants.** `{ generated_at: string (ISO 8601), commit_sha: string|null (40-char hex or null), overall: "pass" | "fail", check_count: number, pass_count: number, checks: Check[] }`. Each `Check = { id: string (E<n>), description: string, pass: boolean, detail: string }`. Verified via `node -e` assertion.
- **No api-key leak.** `node -e "...JSON.stringify(a).match(/api[-_]?key/i)"` returns null; leak-check exits 0.

## Task Commits

Each task was committed atomically:

1. **Task 1 — Preflight runbook + signer-roster template** — `d53f529` (feat) — 2 files, 291 insertions
2. **Task 2 — Preflight script + Stage E automation** — `3a4eff5` (feat) — 3 files (script, package.json, artifact), 246 insertions

## Files Created/Modified

**Created:**

- `docs/runbooks/mainnet-squads-ceremony-preflight.md` — preflight checklist (175 lines)
- `docs/security/signer-roster.md` — pseudonymous roster template (116 lines)
- `scripts/squads/preflight-mainnet.ts` — Stage E automation script (225 lines)
- `artifacts/mainnet-preflight.json` — pre-ceremony fail artifact (14 lines; regenerated by Plan 02-05 after `.env.mainnet` is populated)
- `.planning/phases/02-squads-multisig-setup-devnet-mainnet/02-04-SUMMARY.md` — this file

**Modified:**

- `package.json` — added `"squads:preflight-mainnet": "tsx scripts/squads/preflight-mainnet.ts"` to `scripts`

## Env Variables the Ceremony Operator Must Populate in `.env.mainnet`

The preflight script reads these. Plan 02-05's ceremony coordinator populates them (from the Stage B private-artifact collection + Helius dashboard + fresh proposer keypair):

- `CONFIRM_MAINNET=yes-mainnet-ceremony` (exact string; enforced by `src/env/load.ts`)
- `HELIUS_MAINNET_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...` (Business tier recommended)
- `MAINNET_FALLBACK_RPC=...` (optional; Triton, QuickNode, or second Helius key)
- `MAINNET_PROPOSER_KEYPAIR_PATH=keys/mainnet/proposer.json` (gitignored path)
- `MAINNET_SIGNER_1_PUBKEY=...` through `MAINNET_SIGNER_5_PUBKEY=...` (5 separate lines; the 5 Ledger-derived voting-member pubkeys captured in Stage B5)

## Accepted Tradeoffs Logged

1. **All-Ledger roster (no vendor diversity).** ROADMAP Phase 2 Success Criterion 2 recommended mixed vendors (Ledger + Trezor + Keystone). CONTEXT.md §decisions overrides to all-Ledger for Solana tooling maturity and signer onboarding simplicity. **Accepted tradeoff** (literal token present in both runbook Stage A3 and roster §Vendor diversity). Mitigations: current-firmware discipline, regional distribution, rotation drill rehearsed, migration-if-disclosure path documented.
2. **No v2 / DAO migration in v1.** PROJECT.md lock. Reaffirmed in runbook "Accepted tradeoffs" section.
3. **Proposer is Squads member with Initiate permission only.** Non-voting; spam-bounded by threshold=3; quarterly rotation in Phase 5 ops.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Identity-marker grep forced a rewrite of the visibility paragraph in signer-roster.md**

- **Found during:** Task 1 acceptance-criteria verification
- **Issue:** Original draft of `docs/security/signer-roster.md` used the explicit-negation sentence "It contains NO real names, NO email addresses, NO device serial numbers, and NO physical addresses." That sentence is linguistically clearer but the literal tokens "real names" triggered the acceptance criterion `grep -iE 'real name|given name|surname|first name|last name' docs/security/signer-roster.md` which is required to return empty (the pseudonymous-commitment guarantee). The grep is about the repo's INVARIANT (no such tokens anywhere, because any instance would be a reviewer's attention tripwire), not about the paragraph's INTENT.
- **Fix:** Rewrote the sentence to "It contains no personally-identifying information, no email addresses, no device serial numbers, and no physical addresses." Same invariant communicated; no forbidden tokens.
- **Files modified:** `docs/security/signer-roster.md`
- **Verification:** `grep -iE 'real name|given name|surname|first name|last name' docs/security/signer-roster.md` exits with exit=1 (empty match). All other acceptance criteria still pass.
- **Committed in:** `d53f529` (Task 1 commit — fix applied before the initial commit)

**2. [Rule 3 - Blocking] Prettier reformatted the newly-written preflight script; format:check failed pre-commit**

- **Found during:** Task 2 pre-commit preparation
- **Issue:** `pnpm format:check` reported `scripts/squads/preflight-mainnet.ts` as not prettier-formatted. Same prettier-interaction pattern as Plans 01-02, 02-02, 02-03. Pre-commit husky hook would have blocked the commit.
- **Fix:** Ran `pnpm format scripts/squads/preflight-mainnet.ts`. Prettier normalized single-line `check('E1', ...)` call to wrap at the `(err as Error).message` arg. No semantic changes.
- **Files modified:** `scripts/squads/preflight-mainnet.ts`
- **Verification:** `pnpm format:check` exits 0. Acceptance-criteria greps (`execFileSync` ≥ 1, `execSync` = 0, `safeEndpoint` ≥ 2, `HELIUS_MAINNET_RPC_URL` ≥ 1, `loadEnv` ≥ 1, `getBalance` ≥ 2, `MAINNET_SIGNER_` ≥ 1) all still pass after reformat. Dry-run still produces the expected fail artifact.
- **Committed in:** `3a4eff5` (Task 2 commit — reformat applied before the commit)

**3. [Rule 3 - Environment gap] gitleaks not on default bash PATH (session entry)**

- **Found during:** Plan start, before Task 1
- **Issue:** Same Phase 1 / Phase 2 inherited gap as documented in Plans 02-01/02/03 SUMMARYs. `which gitleaks` returned "not found" at session start.
- **Fix:** Re-applied the standard Phase 2 PATH recipe: `export PATH="/c/Users/markc/AppData/Local/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe:$PATH"`. After the export, `which gitleaks` → full path; `gitleaks version` → `8.30.1`. Both task commits ran the husky pre-commit hook including `gitleaks protect --staged`; both reported "no leaks found" and the full-tree `pnpm gitleaks` scan (37 commits post-plan) also reports "no leaks found".
- **Files modified:** None in repo (session environment only).
- **Verification:** See above.
- **Committed in:** N/A (session env)

---

**Total deviations:** 3 auto-fixed (2 blocking acceptance-criterion / formatting, 1 blocking env)
**Impact on plan:** All three are standard pre-commit hygiene issues already observed and documented in prior Phase 2 SUMMARYs. None change plan output; all verified via the acceptance-criteria grep suite post-fix. No scope creep.

## Issues Encountered

- **`.env.mainnet` intentionally absent.** This is the expected pre-ceremony state. The committed preflight artifact reports `overall: fail` with a single `E0` check; Plan 02-05 Task 1 will re-run the script AFTER the coordinator populates `.env.mainnet` with a real `HELIUS_MAINNET_RPC_URL` + 5 signer pubkeys + funded proposer path. The artifact committed in this plan proves the script's file-shape contract is honored; the fail verdict is the correct unblock signal (Plan 02-05 refuses to start).
- **Prettier reformatted the new script.** Expected prettier-interaction pattern; see Deviation 2.

## User Setup Required (BEFORE Plan 02-05 can start)

None for THIS plan — the plan intentionally did not require mainnet credentials. Plan 02-05 will require the coordinator to complete BOTH the user-facing setup from the frontmatter user_setup block:

- **Helius Business tier confirmation.** `HELIUS_MAINNET_RPC_URL` populated in `.env.mainnet`; dashboard usage has ≥ 20 transactions of headroom for the ceremony month.
- **Ledger setup per signer.** Each of the 5 voting signers: firmware current, Solana app current, Blind Signing enabled, metal-plate seed-readback test passed, pubkey captured via encrypted channel.
- **`.env.mainnet` populated.** Per the env-variable list in §"Env Variables the Ceremony Operator Must Populate" above.

All three are human prerequisites that cannot be automated; they are what Stages A, B, and C of the runbook enumerate.

## Phase 2 Criteria Contribution

**Phase 2 Success Criterion 2 prerequisite** — _"hardware wallets on stable firmware, signers funded with ≥ 0.5 SOL, proposer hot wallet funded, Helius mainnet RPC active"_:

- **Prerequisite substrate MET.** Runbook Stages B (firmware + Solana app + metal-plate check + pubkey capture + liveness SLA + physical-security posture) and C (proposer ≥ 2 SOL + each signer ≥ 0.5 SOL + HELIUS_MAINNET_RPC_URL + optional fallback RPC) define the gates. Stage E script mechanically verifies the funding + RPC-reachability portion. The prerequisites themselves will be checked off at ceremony time by human coordination; this plan closes the substrate.

**Phase 2 Success Criterion 3 prerequisite** — _"signer-roster.md committed pseudonymously"_:

- **Prerequisite substrate MET.** `docs/security/signer-roster.md` committed with 5 pseudonymous voting-member slots + 1 proposer slot. Pubkey fields blank until Plan 02-06 finalization. Vendor-diversity tradeoff acknowledgement committed. Criterion 3 closes in Plan 02-06 when pubkeys populate.

**GOV-02 + GOV-03 prerequisites:**

- GOV-02 (mainnet multisig created) — preflight gate now in place. GOV-02 closes in Plan 02-05 when the multisig actually lands on-chain.
- GOV-03 (public pseudonymous roster) — template substrate now in place. GOV-03 closes in Plan 02-06 when the pubkey slots are populated from the ceremony transcript.

## Next Plan Readiness (02-05: Mainnet Squads v4 Ceremony)

**For Plan 02-05:**

- **First task reads `artifacts/mainnet-preflight.json`** and aborts if the file does not exist OR if `overall != "pass"`. The committed fail artifact is the current state; the coordinator re-runs `pnpm squads:preflight-mainnet` AFTER populating `.env.mainnet`, the script writes a 12-check `overall: pass` artifact, and Plan 02-05 proceeds.
- **Runbook is the ceremony-day live checklist.** Coordinator walks Stages A-D over the 7 days before ceremony; Stage E is the final script invocation T-minus 15 minutes.
- **Ceremony transcript captures pubkeys.** Plan 02-05 Task 1 (or 2) records the 5 Ledger-derived voting-member pubkeys + 1 proposer pubkey + multisig PDA + vault PDA into `artifacts/mainnet.json` (same shape template as `artifacts/devnet.json` per Plan 02-02 pattern).
- **Signer-roster template is ready for Plan 02-06 to populate.** 5 `_filled in Plan 02-06 from mainnet ceremony transcript_` placeholders mark the slots.

**For Plan 02-06 (artifact publication + roster finalization):**

- Reads `artifacts/mainnet.json` (written by Plan 02-05) → replaces the 6 pubkey placeholders in `docs/security/signer-roster.md` with real pubkeys. Roster becomes authoritative public artifact.
- Fills the "Multisig address" and "Vault PDA" top-of-roster fields from `artifacts/mainnet.json`.

**Phase 2 blockers still open:**

- The ceremony itself (Plan 02-05) requires the 5 humans + 5 Ledgers + funded proposer + Helius Business key. Those are human prerequisites outside this plan's scope.

## Self-Check: PASSED

**Files created verified:**

- `docs/runbooks/mainnet-squads-ceremony-preflight.md` FOUND (175 lines)
- `docs/security/signer-roster.md` FOUND (116 lines)
- `scripts/squads/preflight-mainnet.ts` FOUND (225 lines)
- `artifacts/mainnet-preflight.json` FOUND (14 lines; overall=fail as expected)
- `.planning/phases/02-squads-multisig-setup-devnet-mainnet/02-04-SUMMARY.md` FOUND (this file)

**Files modified verified:**

- `package.json` contains `"squads:preflight-mainnet": "tsx scripts/squads/preflight-mainnet.ts"` FOUND

**Commits verified:**

- `d53f529` FOUND: `feat(02-04): add mainnet ceremony preflight runbook + pseudonymous signer roster template`
- `3a4eff5` FOUND: `feat(02-04): add scripts/squads/preflight-mainnet.ts + Stage E automation gate`

**Verification commands (all passed):**

- `pnpm typecheck` → exit 0 (VERIFIED)
- `pnpm lang:audit` → "OK — no violations found." on 9 files in scope (VERIFIED)
- `pnpm gitleaks` → "no leaks found" across 37 commits (VERIFIED)
- `pnpm format:check` → clean (VERIFIED; prettier reformat applied pre-commit to the new script)
- `pnpm test` → 11/11 passing (VERIFIED — unchanged from Plan 02-03)
- `pnpm squads:preflight-mainnet` → exit 1, writes `artifacts/mainnet-preflight.json` with `overall: "fail"` and E0 detail flag (VERIFIED; expected pre-ceremony state)
- `wc -l docs/runbooks/mainnet-squads-ceremony-preflight.md` → 175 (≥ 80 required) (VERIFIED)
- `wc -l docs/security/signer-roster.md` → 116 (≥ 50 required) (VERIFIED)
- `grep -c '^### Signer' docs/security/signer-roster.md` → 5 (exactly 5 required) (VERIFIED)
- `grep -c 'Proposer hot wallet' docs/security/signer-roster.md` → 1 (≥ 1 required) (VERIFIED)
- `grep -cE '^## Stage [A-E]' docs/runbooks/mainnet-squads-ceremony-preflight.md` → 5 (≥ 5 required) (VERIFIED)
- `grep -iE 'real name|given name|surname|first name|last name' docs/security/signer-roster.md` → empty (required) (VERIFIED)
- `grep -iE 'stablecoin|backed by|redeemable' docs/runbooks/mainnet-squads-ceremony-preflight.md` → empty (required) (VERIFIED)
- `grep -c 'CONFIRM_MAINNET' docs/runbooks/mainnet-squads-ceremony-preflight.md` → 1 (≥ 1 required) (VERIFIED)
- `grep -c 'HELIUS_MAINNET_RPC_URL' docs/runbooks/mainnet-squads-ceremony-preflight.md` → 3 (≥ 1 required) (VERIFIED)
- `grep -c "vendor diversity" docs/security/signer-roster.md` → 1 (≥ 1 required) (VERIFIED)
- `grep -cE "all-Ledger|All Ledger|ALL LEDGER" docs/runbooks/mainnet-squads-ceremony-preflight.md` → 3 (≥ 1 required) (VERIFIED)
- `grep -icE "accepted tradeoff|ACCEPTED TRADEOFF" docs/runbooks/mainnet-squads-ceremony-preflight.md` → 5 (≥ 1 required) (VERIFIED)
- `grep -icE "accepted tradeoff|ACCEPTED TRADEOFF" docs/security/signer-roster.md` → 1 (≥ 1 required) (VERIFIED)
- `grep -c 'Ledger' docs/security/signer-roster.md` → 10 (≥ 6 required) (VERIFIED)
- `grep -c 'execFileSync' scripts/squads/preflight-mainnet.ts` → 2 (≥ 1 required) (VERIFIED)
- `grep -cE '\bexecSync\b' scripts/squads/preflight-mainnet.ts` → 0 (exactly 0 required) (VERIFIED)
- `grep -c 'safeEndpoint' scripts/squads/preflight-mainnet.ts` → 3 (≥ 2 required) (VERIFIED)
- `grep -c 'HELIUS_MAINNET_RPC_URL' scripts/squads/preflight-mainnet.ts` → 3 (≥ 1 required) (VERIFIED)
- `grep -c 'loadEnv' scripts/squads/preflight-mainnet.ts` → 3 (≥ 1 required) (VERIFIED)
- `grep -c 'getBalance' scripts/squads/preflight-mainnet.ts` → 2 (≥ 2 required) (VERIFIED)
- `grep -c 'MAINNET_SIGNER_' scripts/squads/preflight-mainnet.ts` → 1 (≥ 1 required) (VERIFIED)
- `grep -c '"squads:preflight-mainnet"' package.json` → 1 (exactly 1 required) (VERIFIED)
- `node -e "<schema + api-key leak assertion>"` → "preflight artifact schema OK; overall=fail; checks=1; no api-key leak" (VERIFIED)

---

_Phase: 02-squads-multisig-setup-devnet-mainnet_
_Plan: 04_
_Completed: 2026-04-20_
