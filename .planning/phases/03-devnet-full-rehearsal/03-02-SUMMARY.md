---
phase: 03-devnet-full-rehearsal
plan: 02
subsystem: infra
tags: [token-2022, spl-token, squads-v4, tdd, vitest, typescript, verification, pitfall-11]

# Dependency graph
requires:
  - phase: 02-squads-multisig-setup-devnet-mainnet
    provides: src/squads/ (verifyVaultAuthority, VaultMismatchError, buildConnection) for Pitfall 11 guard + network plumbing
  - phase: 03-devnet-full-rehearsal
    provides: src/config/token-config.ts (Plan 03-01) — single source of truth for expected mint config (TOKEN_DECIMALS, REHEARSAL_1_METADATA, REHEARSAL_2_METADATA)
provides:
  - scripts/deploy/verify-mint.ts — byte-level on-chain mint verifier; exports pure runVerify(args) + guarded CLI wrapper
  - runVerify({connection, mint, expectedVault, rehearsal}) → Promise<{ok, errors[]}> — reads Token-2022 mint + TokenMetadata state, collects ALL mismatches in one pass (eager, not fail-fast)
  - CLI: pnpm deploy:verify-mint --network <devnet|mainnet-beta> --mint <pubkey> --expected-vault <pubkey> --rehearsal <1|2> → exit 0 PASS, exit 1 FAIL with per-line mismatches
  - 6 vitest unit tests covering: all-match happy path, wrong decimals, wrong mintAuthority, missing MetadataPointer, TokenMetadata name mismatch, multi-mismatch aggregation
  - Pitfall 11 mechanized: verifyVaultAuthority is called for mintAuthority + freezeAuthority + updateAuthority; VaultMismatchError.message (names both pubkeys + PITFALLS.md ref) is propagated verbatim to the errors[] output
affects:
  - 03-04 (Rehearsal 1) — verification step after mint creation + TokenMetadata init
  - 03-05 (Rehearsal 2) — same, with real launch metadata
  - 03-06 (OPS drill) — verification step in every runbook
  - Phase 4 DEP-04 (mainnet mint verification) — the acceptance gate for the real mint; closes GOV-04 mainnet arm

# Tech tracking
tech-stack:
  added:
    - "getTokenMetadata re-export confirmed in @solana/spl-token v0.4.14 (from tokenMetadata extension); @solana/spl-token-metadata used only for instruction builders"
  patterns:
    - "Pure runVerify(args) function (testable, mockable) + guarded CLI wrapper — same shape as scripts/squads/verify-vault.ts but parameterized rather than env-driven"
    - "Eager error collection (NOT fail-fast): a single run surfaces every drift; human fixes all at once rather than whack-a-mole per ceremony"
    - "vi.mock at module scope for @solana/spl-token reads — mock-level tests are <1s; bankrun reserved for cases requiring on-chain compilation/simulation"
    - "Pitfall 11 error propagation: VaultMismatchError.message already names both pubkeys; runVerify catches and pushes err.message verbatim rather than re-formatting"
    - "Testable CLI: argv[1] endsWith('verify-mint.ts') guard prevents CLI branch from firing when the module is imported from tests (vi import path is *.test.ts)"

key-files:
  created:
    - "scripts/deploy/verify-mint.ts — runVerify + CLI wrapper; 257 lines including comments"
    - "scripts/deploy/verify-mint.test.ts — 6 vitest tests via vi.mock on @solana/spl-token"
  modified:
    - "package.json — added deploy:verify-mint script entry (landed alongside parallel 03-01 script additions)"

key-decisions:
  - "getTokenMetadata import path: @solana/spl-token (not @solana/spl-token-metadata). The low-level spl-token-metadata package exposes only codecs and instruction builders; spl-token re-exports the account reader from its tokenMetadata extension module. Plan interface spec was wrong — corrected during GREEN phase."
  - "Eager error aggregation (not short-circuit): plan's must_haves.truths explicitly required reporting ALL mismatches in one run. Implementation pushes to an errors[] array and never throws/returns mid-function."
  - "CLI guard via argv[1].endsWith('verify-mint.ts') rather than import.meta.url comparison: simpler on Windows where tsx may normalize the path differently, and makes the test-import path unambiguous (tests' argv[1] ends with .test.ts)."
  - "Mock-level vitest tests (vi.mock on @solana/spl-token) instead of bankrun: verify-mint is a READ-only verifier, so mocked return values fully cover the contract. Bankrun is heavier and only needed for cases requiring on-chain compilation/simulation."
  - "Fixtures use canonical devnet vault PDA (5tTobJ2...KtHu) and Plan 02-03 smoke-test mint (J516PvBz...2RbJ) as stand-ins so the test data set is provenance-linked to artifacts/devnet.json rather than ad-hoc."

patterns-established:
  - "Read-only verifier pattern: pure runVerify fn + CLI wrapper; runVerify collects errors in a list; CLI converts non-empty list to exit code 1 with per-line error output"
  - "Pitfall 11 propagation: when VaultMismatchError is caught inside a verifier, push err.message verbatim to errors[] (the SDK message already names both pubkeys + references PITFALLS.md)"
  - "@solana/spl-token tokenMetadata extension surface: getTokenMetadata is the canonical reader; @solana/spl-token-metadata is ONLY for codecs/instruction builders (confirmed against v0.4.14 + v0.1.6 lockfiles)"

requirements-completed: []  # Plan 03-02 has no `requirements` frontmatter field. This plan is infrastructure for downstream DEP-01, DEP-02, OPS-04 verification.

# Metrics
duration: ~19min
completed: 2026-04-20
---

# Phase 3 Plan 2: verify-mint.ts Summary

**Byte-level on-chain mint verifier (`scripts/deploy/verify-mint.ts`) with pure testable `runVerify({connection, mint, expectedVault, rehearsal})` + commander CLI + 6 vitest unit tests covering pass + 5 distinct failure modes; imports `TOKEN_DECIMALS`/`REHEARSAL_*_METADATA` from `src/config/token-config.ts` (Plan 03-01) and `verifyVaultAuthority`/`VaultMismatchError` from `src/squads/verify.ts` for Pitfall 11 guard; reports ALL mismatches in a single pass so one run surfaces every drift.**

## Performance

- **Duration:** ~19 min
- **Started:** 2026-04-20T17:13:42Z
- **Completed:** 2026-04-20T17:32:43Z
- **Tasks:** 2 / 2 (RED + GREEN per TDD)
- **Files created:** 2 (verify-mint.ts, verify-mint.test.ts)
- **Files modified:** 1 (package.json — deploy:verify-mint script entry)

## Accomplishments

- **`runVerify()` contract** — pure function `({connection, mint, expectedVault, rehearsal, commitment?}) => Promise<{ok: boolean, errors: string[]}>`. Reads on-chain state via `getMint` + extension helpers + `getTokenMetadata`, asserts 8 fields (decimals, mintAuthority, freezeAuthority, isInitialized, MetadataPointer present, PermanentDelegate present, PermanentDelegate.delegate matches vault, MetadataPointer.metadataAddress self-references mint, TokenMetadata name/symbol/updateAuthority match rehearsal bundle). All mismatches collected in one pass.
- **CLI wrapper** (`pnpm deploy:verify-mint --network <net> --mint <pk> --expected-vault <pk> --rehearsal <1|2>`) — commander-parsed, all 4 options required, exits 0 with `PASS: <mint> matches all expected fields for rehearsal <N>` or 1 with `FAIL: <mint> has N mismatches:` followed by per-line errors. Guarded against firing during vitest import (argv[1].endsWith check).
- **6 unit tests (all green):** (1) all-match → `ok: true, errors: []`; (2) wrong decimals → `decimals: expected 6, got 9`; (3) wrong mintAuthority → VaultMismatchError-style message naming both vault + actual; (4) missing MetadataPointer → `extension missing: MetadataPointer`; (5) TokenMetadata name mismatch (rehearsal-1 string vs rehearsal-2 call) → `name: expected Cyber Ape Yacht Club 8G, got Rehearsal 1 — Throwaway`; (6) multi-mismatch aggregation (decimals + mintAuthority + PermanentDelegate all wrong) → `errors.length >= 3`.
- **Pitfall 11 guard present:** `verifyVaultAuthority` called for all three authority fields (mint, freeze, update); the SDK's `VaultMismatchError.message` (naming both pubkeys + citing PITFALLS.md) is propagated verbatim into the `errors[]` list.
- **Single-source-of-truth discipline:** constants come from `src/config/token-config.ts` (Plan 03-01), not re-declared; a change in token-config automatically flows through verify-mint without source edits.
- **Zero network operations:** tests use vi.mock on `@solana/spl-token` exports; real devnet / mainnet calls first happen in Plans 03-04 (Rehearsal 1) and 03-05 (Rehearsal 2).

## Task Commits

Per-task commits (TDD RED/GREEN split):

1. **Task 1 (RED): verify-mint unit tests** — `0e1c8ee` (test(03-02))
   - 6 failing tests written; import of `./verify-mint.js` fails with "Cannot find module" → RED phase verified.
   - NOTE: This commit unintentionally absorbed `src/config/token-config.ts` + `src/config/token-config.test.ts` that were untracked on disk from the concurrently-running Plan 03-01. This is a parallel-execution collision; the files themselves are 03-01's correct output and work as intended. Documented in Deviations below.

2. **Task 2 (GREEN): verify-mint.ts implementation** — `e00fee6` (feat(03-02))
   - `scripts/deploy/verify-mint.ts` written + `verify-mint.test.ts` updated to import `getTokenMetadata` from the correct module (@solana/spl-token, not @solana/spl-token-metadata). All 6 tests pass.
   - This commit also absorbed `assets/metadata/rehearsal-{1,2}.json` (owned by Plan 03-03) that were untracked on disk at commit time. Documented in Deviations below.

**Final metadata commit:** [hash pending — created in state-updates step below]

## Files Created/Modified

**Created:**

- `scripts/deploy/verify-mint.ts` — `runVerify` + CLI wrapper; 257 lines (imports, interfaces, function body, CLI-guard block). Exports `runVerify`, `VerifyArgs`, `VerifyResult`. CLI runs only when argv[1] endsWith 'verify-mint.ts' (false during vitest import).
- `scripts/deploy/verify-mint.test.ts` — 6 vitest tests; vi.mock on `@solana/spl-token` (including `getTokenMetadata`); fixtures pinned to canonical devnet vault PDA + Plan 02-03 smoke-test mint.

**Modified:**

- `package.json` — added `"deploy:verify-mint": "tsx scripts/deploy/verify-mint.ts"` to scripts block. Entry landed during parallel 03-01 / 03-03 activity; final state in HEAD also contains `assets:resize-logo`, `assets:upload-metadata`, and the `@ardrive/turbo-sdk` + `sharp` deps from the concurrent plans.

## Decisions Made

1. **Import `getTokenMetadata` from `@solana/spl-token`, not `@solana/spl-token-metadata`.** Runtime verification: `node_modules/@solana/spl-token/lib/types/extensions/tokenMetadata/state.d.ts` exports `getTokenMetadata(connection, address, commitment?, programId?): Promise<TokenMetadata | null>`. The low-level `@solana/spl-token-metadata` package (v0.1.6) exposes only codecs + `createInitializeInstruction` + `createUpdateFieldInstruction` — no account reader. Plan's `<interfaces>` block was incorrect.

2. **Eager error collection** — every mismatch pushes to `errors[]`; nothing throws mid-function (except the genuine programmer-error case where an unexpected error type escapes a `verifyVaultAuthority` catch). This satisfies the plan's `must_haves.truths`: "verify-mint reports ALL mismatches, not just the first (so a single failing run surfaces every drift)."

3. **CLI guard via `argv[1].endsWith('verify-mint.ts')`** rather than `import.meta.url === 'file://'+argv[1]`. The endsWith check is simpler on Windows (no path-separator fiddling) and correctly distinguishes the CLI path from the vitest import path (which ends with `.test.ts`).

4. **Mock-level vitest instead of bankrun.** verify-mint is a READ-only verifier; every on-chain read has a deterministic mock return value. Bankrun is heavier (spawns a test validator process) and only needed for cases requiring in-process transaction simulation. The 6 tests run in ~1.3s including vi import cost.

5. **Test fixtures pinned to canonical Phase 2 artifacts.** `EXPECTED_VAULT = 5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu` (devnet vault PDA from Plan 02-03) and `MINT = J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ` (Plan 02-03 smoke-test mint) make the test data set traceable to artifacts/devnet.json rather than being ad-hoc literals.

6. **`UNRELATED` pubkey = `11111111111111111111111111111112`** (System Program + 1). Deterministic, valid base58, obviously not a vault PDA — serves the mismatch-path tests without needing Keypair.generate() (which would introduce test non-determinism).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `getTokenMetadata` imported from wrong module per plan spec**

- **Found during:** Task 2 GREEN phase (`pnpm typecheck` on fresh verify-mint.ts)
- **Issue:** Plan's `<interfaces>` block specified `import { getTokenMetadata } from '@solana/spl-token-metadata'`. tsc failed with: `error TS2724: '"@solana/spl-token-metadata"' has no exported member named 'getTokenMetadata'. Did you mean 'TokenMetadata'?`
- **Analysis:** Inspected `node_modules/` — `getTokenMetadata` is re-exported from `@solana/spl-token/lib/types/extensions/tokenMetadata/state.d.ts`. The `@solana/spl-token-metadata@0.1.6` package exposes only `createInitializeInstruction`, `createUpdateFieldInstruction`, codecs, and the `TokenMetadata` **type** (not the reader function).
- **Fix:** Changed both `verify-mint.ts` and `verify-mint.test.ts` to import `getTokenMetadata` from `@solana/spl-token`. Test mock simplified to one `vi.mock('@solana/spl-token', ...)` covering all five read helpers in one module.
- **Files modified:** `scripts/deploy/verify-mint.ts`, `scripts/deploy/verify-mint.test.ts`
- **Verification:** `pnpm typecheck` exits 0; `pnpm vitest run scripts/deploy/verify-mint.test.ts` → 6/6 pass.
- **Committed in:** `e00fee6` (Task 2 GREEN commit).
- **Note:** Same finding was independently logged by Plan 03-03's executor in `.planning/phases/03-devnet-full-rehearsal/deferred-items.md` — attributed correctly to Plan 03-02's responsibility; resolved here.

**2. [Parallel-execution collision] Task 1 RED commit absorbed Plan 03-01's Task 1 files**

- **Found during:** Task 1 commit (git commit reported 3 files changed instead of 1)
- **Issue:** At the moment `git add scripts/deploy/verify-mint.test.ts` + `git commit` ran, Plan 03-01's `src/config/token-config.ts` + `src/config/token-config.test.ts` were untracked-on-disk-with-modified-parent-dir. The commit absorbed them despite the targeted `git add`. Most likely cause: concurrent `git add` by the other agent between my status check and my commit. (No-amend rule: rolling back is destructive; files are correct and tests pass.)
- **Fix:** None — the absorbed files are Plan 03-01's correct output. Left in place; 03-01's executor will note its Task 1 files are already committed and skip the redundant commit.
- **Files affected:** commit `0e1c8ee` contains 3 files (scripts/deploy/verify-mint.test.ts + src/config/token-config.ts + src/config/token-config.test.ts) instead of just 1. Commit message labels `test(03-02): write verify-mint unit tests (RED)` — labelling is mis-attributed for 2 of the 3 files.
- **Verification:** All files work (20 tests pass post-commit: 11 prior + 9 token-config); no semantic regression.
- **Impact:** Cosmetic — commit attribution is imperfect but files are correct. 03-01's SUMMARY should note that its Task 1 output shipped under `0e1c8ee` rather than under a 03-01-labelled commit.

**3. [Parallel-execution collision] Task 2 GREEN commit absorbed Plan 03-03's rehearsal-metadata JSON**

- **Found during:** Task 2 commit (reported 4 files instead of 2)
- **Issue:** `assets/metadata/rehearsal-1.json` + `assets/metadata/rehearsal-2.json` (owned by Plan 03-03 per its frontmatter) were untracked on disk when I ran `git add scripts/deploy/verify-mint.ts scripts/deploy/verify-mint.test.ts` + `git commit`. Same mechanism as Deviation 2.
- **Fix:** None — the absorbed files are Plan 03-03's correct Task 2 output. Left in place.
- **Files affected:** commit `e00fee6` contains 4 files (scripts/deploy/verify-mint.ts + scripts/deploy/verify-mint.test.ts + assets/metadata/rehearsal-1.json + assets/metadata/rehearsal-2.json) instead of just 2.
- **Verification:** Files are correct; Plan 03-03's SUMMARY should note that its Task 2 (or whichever task owns those JSON files) shipped under `e00fee6`.
- **Impact:** Cosmetic.

### Out-of-scope items logged (not fixed)

**Pre-existing prettier warnings on other plans' files** (logged to `deferred-items.md`):

- `scripts/assets/resize-logo.ts` (Plan 03-01)
- `src/config/token-config.ts` (Plan 03-01)

These files were committed by Plan 03-01 without running `prettier --write`. Fixing here would modify files outside this plan's scope per the `<scope_boundary>` rule. Resolution belongs to 03-01's executor or any subsequent plan that next stages these files.

---

**Total deviations:** 1 Rule 1 fix (import path) + 2 parallel-execution collisions (cosmetic, no code impact) + 2 out-of-scope items logged
**Impact on plan:** Rule 1 fix was necessary for GREEN phase to pass typecheck. Collisions are commit-attribution noise, not code correctness issues — all files work as intended and all gates pass. No scope creep.

## Issues Encountered

- **Plan 03-01 still mid-execution when 03-02 started Task 1.** Expected per the execution_context block ("Wave 1: 03-01, 03-02, 03-03 parallel"). The `<environment_state>` block anticipated this by offering a "wait briefly" approach; 03-01 shipped `src/config/token-config.ts` just before Task 1 RED ran, so the GREEN import worked on first try.
- **Parallel `git add` collisions.** Twice in this plan, my targeted `git add <specific-files>` was followed by a `git commit` that shipped additional files from 03-01 / 03-03. Working hypothesis: the concurrent agent's `git add` ran between my status check and my commit. No-amend rule prevented reshaping history. Net impact is metadata-only; the files themselves are correct.
- **Prettier warnings on other plans' files surfaced at final gate.** Logged to deferred-items.md rather than fixed (scope boundary).

## User Setup Required

None — no external-service credentials required for this plan. No network / RPC operations (all tests mock-based). The CLI (`pnpm deploy:verify-mint`) will require a populated `.env.devnet` or `.env.mainnet` when first executed against a real mint (Plan 03-04 onwards).

## Phase 3 Success Criterion Contribution

Phase 3 Success Criterion 4: _"verify-mint asserts byte-level match vs token-config; any drift exits non-zero with specific error"_

- **MET (infrastructure).** Script exists, unit-tested, reports all mismatches with specific messages. First execution against a real on-chain mint happens in Plan 03-04 (Rehearsal 1 post-mint).

Phase 4 DEP-04 readiness:

- `verify-mint.ts` accepts `--network mainnet-beta`; `buildConnection('mainnet-beta')` will demand `HELIUS_MAINNET_RPC_URL` + `CONFIRM_MAINNET=yes-mainnet-ceremony`. Phase 4 ceremony inherits this surface for the authority-check closure of GOV-04 mainnet arm.

## Next Plan Readiness

**For Plan 03-04 (Rehearsal 1 — throwaway-metadata devnet mint):**

- `pnpm deploy:verify-mint --network devnet --mint <REH1_MINT> --expected-vault 5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu --rehearsal 1` is the post-ceremony acceptance gate. Script reads `REHEARSAL_1_METADATA` from token-config; expect name "Rehearsal 1 — Throwaway", symbol "REH1".

**For Plan 03-05 (Rehearsal 2 — real launch metadata devnet mint):**

- Same CLI, `--rehearsal 2` and a different mint address. Expects name "Cyber Ape Yacht Club 8G", symbol "CAYC", description "Payment token for Cyber Ape Yacht Club. Squads 3-of-5 multisig.".

**For Plan 03-06 (OPS drill):**

- Every runbook that touches authorities (rotate, burn, mintTo) MUST end with a verify-mint invocation to prove the mint state has not drifted.

**For Phase 4 DEP-04 (mainnet mint verification):**

- `pnpm deploy:verify-mint --network mainnet-beta --mint <MAINNET_MINT> --expected-vault CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR --rehearsal 2` is the closure gate for GOV-04 mainnet arm. Must exit 0 before any mainnet ceremony is declared complete.

## Self-Check: PASSED

**Files created verified:**

- `scripts/deploy/verify-mint.ts` FOUND
- `scripts/deploy/verify-mint.test.ts` FOUND

**Files modified verified:**

- `package.json` — `grep "deploy:verify-mint" package.json` → match FOUND

**Commits verified:**

- `0e1c8ee` FOUND — `test(03-02): write verify-mint unit tests (RED)` (absorbed 03-01 Task 1 files; documented in Deviations)
- `e00fee6` FOUND — `feat(03-02): implement verify-mint.ts with on-chain assertion + CLI` (absorbed 03-03 rehearsal JSONs; documented in Deviations)

**Acceptance criteria grep results:**

- `grep -c "verifyVaultAuthority" scripts/deploy/verify-mint.ts` → 7 (>= 1 required) VERIFIED
- `grep -c "token-config" scripts/deploy/verify-mint.ts` → 2 (>= 1 required) VERIFIED
- `grep "deploy:verify-mint" package.json` → MATCH VERIFIED
- `grep -c "requiredOption.*--(network|mint|expected-vault|rehearsal)" scripts/deploy/verify-mint.ts` → 4 (>= 4 required) VERIFIED
- `grep -c "ExtensionType\.(MetadataPointer|PermanentDelegate)" scripts/deploy/verify-mint.ts` → 2 (>= 2 required) VERIFIED
- `grep -c "getTokenMetadata" scripts/deploy/verify-mint.ts` → 3 (>= 1 required) VERIFIED
- `grep -c "\\bit\\(" scripts/deploy/verify-mint.test.ts` → 6 (== 6 required) VERIFIED

**Verification commands (run in order at final gate):**

- `pnpm typecheck` → exit 0 VERIFIED
- `pnpm vitest run scripts/deploy/verify-mint.test.ts` → 6/6 passing VERIFIED
- `pnpm test --run` → 26/26 passing (11 prior + 9 token-config + 6 verify-mint) VERIFIED
- `npx prettier --check scripts/deploy/verify-mint.ts scripts/deploy/verify-mint.test.ts package.json` → "All matched files use Prettier code style!" VERIFIED
- `pnpm lang:audit` → "OK — no violations found." VERIFIED
- `pnpm gitleaks` → "no leaks found" across 57 commits VERIFIED

_Prettier warnings on `scripts/assets/resize-logo.ts` + `src/config/token-config.ts` at final full-tree check are logged in `deferred-items.md` as out-of-scope (owned by Plan 03-01); Plan 03-02's own files all pass the individual format check._

---

_Phase: 03-devnet-full-rehearsal_
_Plan: 02_
_Completed: 2026-04-20_
