---
phase: 03-devnet-full-rehearsal
plan: 01
subsystem: infra
tags: [token-2022, token-config, logo-assets, sharp, metadata-json, ssot]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: package.json scaffold (pnpm scripts block, prettier, tsc, vitest gates)
  - phase: 01-foundation
    provides: docs/style-guide.md banned-terms enforcement + .langauditrc.json
  - phase: 02-squads-multisig-setup
    provides: src/squads/constants.ts hardcoded-program-id pattern (mirrored in token-config.ts)
  - phase: 03-devnet-full-rehearsal
    provides: assets/logo.png 5863x4529 source committed in ea9a097
provides:
  - "src/config/token-config.ts — single source of truth for TOKEN_NAME/TOKEN_SYMBOL/TOKEN_DESCRIPTION/TOKEN_DECIMALS/TOKEN_WEBSITE_URL/TOKEN_EXTENSIONS/REHEARSAL_1_METADATA/REHEARSAL_2_METADATA/INITIAL_SUPPLY_RAW, all `as const`-narrowed"
  - "assets/logo-source.png (5863x4529 original, 394874 bytes — preserved via git rename from assets/logo.png)"
  - "assets/logo-512.png (19014 bytes, 18.6% of 100 KB wallet cap)"
  - "assets/logo-1024.png (38814 bytes, 37.9% of cap)"
  - "scripts/assets/resize-logo.ts — idempotent sharp-based downsize + 100 KB size gate"
  - "assets/metadata/rehearsal-1.json — REH1 throwaway metadata with DO NOT USE marker"
  - "assets/metadata/rehearsal-2.json — locked launch metadata (CAYC, Cyber Ape Yacht Club 8G, Squads 3-of-5 multisig); inherited verbatim by Phase 4 mainnet"
  - "pnpm assets:resize-logo script — reproducible resize driver"
  - "sharp ^0.33 devDep — image resize toolchain (build-time only; no runtime impact on deploy scripts)"
affects:
  - 03-02 (verify-mint imports TOKEN_NAME / TOKEN_SYMBOL / TOKEN_DECIMALS / TOKEN_EXTENSIONS / expected vault pattern)
  - 03-03 (upload-metadata consumes assets/metadata/rehearsal-2.json + assets/logo-512.png)
  - 03-04 (Rehearsal 1 script reads REHEARSAL_1_METADATA and uploads rehearsal-1.json to Arweave)
  - 03-05 (Rehearsal 2 script reads REHEARSAL_2_METADATA and uploads rehearsal-2.json to Arweave)
  - 04-mainnet-deployment (DEP-01..06 inherit REHEARSAL_2_METADATA constants byte-for-byte)

# Tech tracking
tech-stack:
  added:
    - "sharp ^0.33 (devDep) — libvips-backed PNG resize + palette compression"
  patterns:
    - "Single source of truth for token config: one `as const` module, imported by verify-mint AND rehearsal scripts AND Phase 4 mainnet; prevents drift between 'what we tried to set' and 'what we verify on-chain'"
    - "Metadata JSON files use PLACEHOLDER_*_ARWEAVE_URL sentinel in `image` field so a pre-upload grep catches accidentally-launched placeholders"
    - "Resize script mirrors src/squads/* driver pattern: console-log every step; fail-fast on size gate; idempotent (detects renamed source, regenerates derivatives deterministically)"
    - "Rehearsal-1 uses distinct symbol (REH1) from launch (CAYC) — isolates accidental wallet imports during the rehearsal window"
    - "Rehearsal-2 metadata = REHEARSAL_2_METADATA = { TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DESCRIPTION, TOKEN_WEBSITE_URL } — reuses the same const references so future edits to locked launch strings touch exactly one file"

key-files:
  created:
    - "src/config/token-config.ts — locked launch constants + rehearsal metadata"
    - "src/config/token-config.test.ts — 9 vitest behaviors covering exact-string invariants and banned-term guards"
    - "scripts/assets/resize-logo.ts — reproducible sharp-based downsize driver with 100 KB gate"
    - "assets/logo-source.png — 5863x4529 original (git rename from assets/logo.png)"
    - "assets/logo-512.png — 19 KB derivative"
    - "assets/logo-1024.png — 38 KB derivative"
    - "assets/metadata/rehearsal-1.json — REH1 throwaway"
    - "assets/metadata/rehearsal-2.json — locked launch metadata"
  modified:
    - "package.json — added sharp ^0.33 devDep, assets:resize-logo script"
    - "pnpm-lock.yaml — sharp + @img/sharp-win32-x64 entries"

key-decisions:
  - "Skipped oxipng-bin because sharp's compressionLevel:9 + palette:true already produced derivatives at 19% and 38% of the 100 KB cap. Added a TODO in the resize script: if a future source pushes either derivative over the cap, add an oxipng pass — but do NOT silently skip the cap."
  - "TOKEN_EXTENSIONS array uses ordering [MetadataPointer, PermanentDelegate] (not alphabetical) because Pattern 3 from ARCHITECTURE.md dictates init order — MetadataPointer first, PermanentDelegate second, both BEFORE initializeMint. Test 5 asserts the exact ordering; a re-sort would fail."
  - "REHEARSAL_2_METADATA fields reference TOKEN_NAME/TOKEN_SYMBOL/TOKEN_DESCRIPTION/TOKEN_WEBSITE_URL directly instead of duplicating the string literals. This keeps the locked launch values truly in one place — a future edit to TOKEN_NAME automatically flows to both REHEARSAL_2_METADATA.name and (via the test suite) the byte-for-byte check against assets/metadata/rehearsal-2.json."
  - "Placeholder image URLs use the literal string PLACEHOLDER_REH*_ARWEAVE_URL so Plan 03-03's pre-upload sanity grep (grep 'PLACEHOLDER' assets/metadata/*.json) is a trivial one-liner. Any human-edited JSON that forgets to replace the placeholder is caught before Arweave submission."

patterns-established:
  - "Token-config single source of truth: src/config/token-config.ts exports the complete contract of expected mint state (name, symbol, description, decimals, website, extensions, supply). Any script that cares about 'what the mint should look like' imports from here — never reinvents the constants inline."
  - "Sharp-based asset pipeline: resize via sharp with fit:'contain' + transparent padding preserves aspect; compressionLevel:9 + palette:true is near-oxipng quality without a native binary. Size gate at 100 KB is enforced in-script (not just documented)."
  - "Parallel-wave execution discipline: when three plans run concurrently in a single wave, each writes ONLY its own files; git's automatic rename detection (shown as 'R' in git status) is the canonical way to preserve history for moved files."

requirements-completed: []  # Plan 03-01 is pure infrastructure; DEP-* requirements will close in Plans 03-04..05 and Phase 4.

# Metrics
duration: 13min
completed: 2026-04-20
---

# Phase 3 Plan 01: Token Config + Metadata JSON + Logo Resize Summary

**Locked CAYC launch constants (TOKEN_NAME 'Cyber Ape Yacht Club 8G', TOKEN_SYMBOL 'CAYC', 6 decimals, 500M supply, [MetadataPointer, PermanentDelegate] extensions) as a single TypeScript source of truth — plus wallet-ready 512/1024 PNG derivatives at 19% and 38% of the 100 KB cap, and rehearsal/launch metadata JSON files with placeholder Arweave URIs for Plan 03-03 substitution.**

## Performance

- **Duration:** 13 min (including parallel-wave collision recovery)
- **Started:** 2026-04-20T17:19:45Z
- **Completed:** 2026-04-20T17:32:29Z
- **Tasks:** 3 / 3
- **Files created:** 8 (token-config + test, resize script, 3 logo PNGs, 2 metadata JSONs)
- **Files modified:** 2 (package.json, pnpm-lock.yaml)

## Accomplishments

- `src/config/token-config.ts` exports 9 constants with `as const` narrowing: TOKEN_NAME ('Cyber Ape Yacht Club 8G'), TOKEN_SYMBOL ('CAYC'), TOKEN_DESCRIPTION ('Payment token for Cyber Ape Yacht Club. Squads 3-of-5 multisig.'), TOKEN_DECIMALS (6), TOKEN_WEBSITE_URL ('https://cayc.io'), TOKEN_EXTENSIONS [MetadataPointer, PermanentDelegate], REHEARSAL_1_METADATA (REH1 throwaway), REHEARSAL_2_METADATA (= locked launch), INITIAL_SUPPLY_RAW (500M × 10^6 = 500_000_000_000_000n).
- 9 vitest behaviors guard the invariants: exact-string checks, banned-term regex, extension ordering, BigInt math, and byte-for-byte reuse of locked strings between REHEARSAL_2_METADATA and TOKEN_*.
- `assets/logo-source.png` (5863×4529, 394874 bytes) preserved via `git mv`; derivatives `logo-512.png` (19014 bytes, 18.6% of cap) and `logo-1024.png` (38814 bytes, 37.9% of cap) generated via `pnpm assets:resize-logo` and committed. Re-running the script is idempotent.
- `assets/metadata/rehearsal-1.json` and `rehearsal-2.json` written with placeholder `PLACEHOLDER_REH*_ARWEAVE_URL` image URIs (Plan 03-03 substitutes real Arweave TX IDs). Rehearsal-2 JSON matches `src/config/token-config.ts` REHEARSAL_2_METADATA byte-for-byte.
- All repo gates pass: `pnpm typecheck` (0), `pnpm test` (26/26 — 11 prior + 9 token-config + 6 verify-mint from concurrent 03-02), `pnpm lang:audit` (no violations), `pnpm gitleaks` (no leaks across 57 commits).

## Task Commits

Task commit attribution is **non-linear** due to parallel-wave execution (see Deviations). Each task's substance landed on disk with correct content; attribution is tracked here:

1. **Task 1: Create src/config/token-config.ts single source of truth** — `0e1c8ee` (attributed to Plan 03-02's RED commit; see Deviation 1). Files: `src/config/token-config.ts`, `src/config/token-config.test.ts`. 9/9 tests pass.
2. **Task 2: Resize assets/logo.png + preserve source** — `3b99e4a` (clean Plan 03-01 attribution). Files: `assets/logo-source.png` (renamed), `assets/logo-512.png`, `assets/logo-1024.png`, `scripts/assets/resize-logo.ts`, `package.json` (sharp devDep + assets:resize-logo script), `pnpm-lock.yaml`.
3. **Task 3: Off-chain metadata JSON for Rehearsal 1 + Rehearsal 2** — `e00fee6` (attributed to Plan 03-02's GREEN commit; see Deviation 1). Files: `assets/metadata/rehearsal-1.json`, `assets/metadata/rehearsal-2.json`. JSON valid; byte-for-byte match with token-config constants.

**Commit timeline (authoritative — all changes are in-tree):**

- `0e1c8ee` — test(03-02): write verify-mint unit tests (RED) + *sweeps Plan 03-01 Task 1 files*
- `ee9515b` — feat(03-03): add Arweave metadata upload driver + hosting runbook (concurrent)
- `83ac27c` — docs(03-03): record Task 1 complete + pause at Task 2 checkpoint (concurrent)
- `3b99e4a` — feat(03-01): resize logo to 512/1024 derivatives + preserve source (Plan 03-01 Task 2)
- `e00fee6` — feat(03-02): implement verify-mint.ts with on-chain assertion + CLI + *sweeps Plan 03-01 Task 3 files*

## Files Created/Modified

**Created:**

- `src/config/token-config.ts` — 9 `as const` constants + BigInt initial supply. Mirrors `src/squads/constants.ts` hardcoded-value pattern.
- `src/config/token-config.test.ts` — 9 vitest behaviors; all pass.
- `scripts/assets/resize-logo.ts` — Sharp-based resize driver with `renameSync` idempotence + 100 KB size gate.
- `assets/logo-source.png` — 5863×4529 RGBA PNG, 394874 bytes (git-renamed from `assets/logo.png`).
- `assets/logo-512.png` — 512×512 RGBA PNG, 19014 bytes.
- `assets/logo-1024.png` — 1024×1024 RGBA PNG, 38814 bytes.
- `assets/metadata/rehearsal-1.json` — REH1 throwaway metadata, 252 bytes.
- `assets/metadata/rehearsal-2.json` — locked launch metadata, 244 bytes.
- `.planning/phases/03-devnet-full-rehearsal/deferred-items.md` — concurrent 03-03 already owned this file; Plan 03-01 did not add to it (the verify-mint typecheck issue it documents was resolved by 03-02's GREEN commit mid-flight).

**Modified:**

- `package.json` — added `"sharp": "^0.33"` to devDependencies; added `"assets:resize-logo": "tsx scripts/assets/resize-logo.ts"` script.
- `pnpm-lock.yaml` — sharp + @img/sharp-win32-x64 entries added.

## Decisions Made

1. **Skipped oxipng-bin.** Sharp's built-in `compressionLevel:9` + `palette:true` output produced derivatives at 19 KB and 38 KB (19% and 38% of the 100 KB cap). Adding a native-binary dependency for marginal gains has a real cost (pnpm approve-builds prompt, Windows build fragility) and no benefit at current source sizes. The resize script documents the fallback path: if a future source pushes either derivative over the cap, add an oxipng pass — but do NOT silently skip the size gate.
2. **TOKEN_EXTENSIONS ordering is load-bearing.** Pattern 3 from ARCHITECTURE.md requires `MetadataPointer` initialized before `PermanentDelegate`, both before `initializeMint`. The array preserves that order literally so downstream scripts can iterate without re-sorting. Test 5 asserts `.toEqual([MetadataPointer, PermanentDelegate])` — a silent re-sort would fail.
3. **REHEARSAL_2_METADATA fields reference `TOKEN_NAME`, `TOKEN_SYMBOL`, `TOKEN_DESCRIPTION`, `TOKEN_WEBSITE_URL` directly** (not string duplicates). Changing a launch string edits exactly one `const` line; the test suite proves the JSON file matches byte-for-byte.
4. **Placeholder Arweave URIs use the literal `PLACEHOLDER_REH1_ARWEAVE_URL` / `PLACEHOLDER_REH2_ARWEAVE_URL`.** Plan 03-03 can use `grep 'PLACEHOLDER' assets/metadata/*.json` as a one-line pre-upload sanity check — any human-edited JSON that forgot to replace the placeholder is caught before Arweave submission.
5. **Rehearsal-1 uses distinct symbol `REH1`**, not `CAYC`. A leaked rehearsal-1 mint address cannot be confused with the launch; a wallet that pre-imports `REH1` and finds it goes nowhere is a lower-severity incident than one that imports `CAYC` and finds a devnet mint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Parallel-wave commit attribution collision (Tasks 1 and 3)**

- **Found during:** Task 1 commit attempt (13:22) and Task 3 commit attempt (13:31)
- **Issue:** Three plans (03-01, 03-02, 03-03) ran concurrently in wave 1 in the same working tree. Concurrent 03-02 agent invoked its commit via `git commit -a` (or equivalent) which swept up my already-staged but not-yet-committed Plan 03-01 files into Plan 03-02's commit. Specifically:
  - Commit `0e1c8ee` (authored by 03-02 as "test(03-02): write verify-mint unit tests (RED)") unexpectedly included `src/config/token-config.ts` and `src/config/token-config.test.ts` (Plan 03-01 Task 1 deliverables).
  - Commit `e00fee6` (authored by 03-02 as "feat(03-02): implement verify-mint.ts...") unexpectedly included `assets/metadata/rehearsal-1.json` and `assets/metadata/rehearsal-2.json` (Plan 03-01 Task 3 deliverables).
- **Fix:** Did NOT attempt a git-history rewrite (would destroy 03-02's legitimate work). Accepted the misattribution and documented the true ownership in this SUMMARY's Task Commits table. Content on disk is byte-for-byte what Plan 03-01 intended. Task 2 (`3b99e4a`) was committed cleanly with correct 03-01 attribution because no concurrent commit interleaved.
- **Files modified:** None (content is correct; only attribution is wrong in `git log`).
- **Verification:** `git show 0e1c8ee:src/config/token-config.ts` matches what I wrote; `git show e00fee6:assets/metadata/rehearsal-2.json` matches what I wrote.
- **Committed in:** `0e1c8ee` (Task 1 substance), `3b99e4a` (Task 2 clean), `e00fee6` (Task 3 substance).

**2. [Rule 3 - Blocking] Concurrent agent deleted `sharp` devDep from package.json mid-task**

- **Found during:** Task 2 (between `pnpm add -D sharp` and first `pnpm assets:resize-logo` run)
- **Issue:** After I ran `pnpm add -D sharp@^0.33` (which added sharp to devDependencies), a concurrent plan's edit to package.json reverted the change — presumably during a `pnpm add` of their own dependency (`@ardrive/turbo-sdk` in Plan 03-03). The `pnpm` CLI rewrites the whole devDependencies array on every `add` command; if two agents run `pnpm add` concurrently, the later-writing one wins and the earlier one's addition is lost.
- **Fix:** Re-ran `pnpm add -D sharp@^0.33` AFTER the concurrent plan had finished editing package.json. Then edited package.json via the Edit tool to add the `assets:resize-logo` script line (without clobbering the concurrent plan's other additions). The final state includes sharp, assets:resize-logo, and Plan 03-03's `assets:upload-metadata` script and `@ardrive/turbo-sdk` dep.
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Verification:** `grep "sharp" package.json` returns the devDep entry; `grep "assets:resize-logo" package.json` returns the script entry; `pnpm assets:resize-logo` runs to completion producing both derivatives under the 100 KB cap.
- **Committed in:** `3b99e4a` (Task 2 commit).

**3. [Rule 3 - Blocking] Restored the pre-resized 5863×4529 source from git before executing Task 2**

- **Found during:** Task 2 prerequisite inspection (before running `pnpm assets:resize-logo`)
- **Issue:** Upon entering the working tree, `assets/logo.png` on disk was already 512×512 / 63 KB — someone had pre-run a resize. But the committed version (at `ea9a097`) was the correct 5863×4529 / 394874-byte source. If the script runs against the pre-resized version, the output PNG would be a re-encode of already-downsized data, losing the pixel fidelity that the real 5863×4529 source provides.
- **Fix:** `git restore assets/logo.png` to recover the real 5863×4529 source before running the resize script. Script then ran against the correct source and produced derivatives at 19 KB / 38 KB.
- **Files modified:** None (restore reset the working tree to the committed state).
- **Verification:** `file assets/logo-source.png` returns `PNG image data, 5863 x 4529`; derivative dimensions match the 512/1024 requests.
- **Committed in:** N/A (no code change; ambient working-tree correction).

**4. [Rule 1 - Bug] Removed banned-term literal from token-config.ts file-header comment**

- **Found during:** Task 1 acceptance-criteria grep check (`grep -Ei "stablecoin|backed by|redeemable" src/config/token-config.ts`)
- **Issue:** My first draft of `src/config/token-config.ts` had a file-header comment describing the style-guide constraint — which itself listed the banned terms ("stablecoin, backed by, redeemable, 1:1 with USDC, pegged") for reader orientation. That list tripped the acceptance criterion's grep. The criterion's intent is "no banned terms appear as content" — a comment enumerating the banned terms for documentation purposes is a false positive, but the letter of the criterion failed.
- **Fix:** Reworded the comment to reference the rule document ("avoid every banned term from docs/style-guide.md §2") without inlining the banned-term list.
- **Files modified:** `src/config/token-config.ts`
- **Verification:** `grep -Ei "stablecoin|backed by|redeemable" src/config/token-config.ts` returns empty. 9/9 tests still pass. Comment still guides the reader to the canonical rule.
- **Committed in:** `0e1c8ee` (Task 1 substance, see Deviation 1 for attribution note).

---

**Total deviations:** 4 auto-fixed (3 Rule 3 blocking, 1 Rule 1 bug)
**Impact on plan:** All four are correctness fixes caused by parallel execution collisions or pre-execution working-tree state, not scope changes. The plan's three tasks landed on disk with exactly the content specified in `03-01-PLAN.md`. Byte-for-byte invariants between `src/config/token-config.ts` and `assets/metadata/rehearsal-2.json` are preserved.

## Issues Encountered

- **Two concurrent `git commit` sweeps** attributed Plan 03-01 files to Plan 03-02 commits (`0e1c8ee`, `e00fee6`). Not destructive (content is correct); documented in Task Commits table so downstream plans aren't confused when `git blame` points at 03-02 for files 03-01 produced.
- **Concurrent `pnpm add`** by Plan 03-03 briefly deleted my `sharp` devDep entry (pnpm rewrites the whole array atomically; later writer wins). Re-added after the concurrent agent quieted; final package.json has both plans' additions.
- **Sharp build scripts** are in pnpm's "ignored build scripts" list by default on pnpm 10.33.0; the native binary under `@img/sharp-win32-x64` was still installed via prebuild fetch, so `import('sharp')` worked without `pnpm approve-builds`.

## User Setup Required

None — no external-service credentials required. Sharp's `@img/sharp-win32-x64` prebuild is fetched automatically by pnpm. Re-running `pnpm assets:resize-logo` on a fresh clone works after `pnpm install`.

## Next Phase / Plan Readiness

**For Plan 03-02 (verify-mint — ran concurrently, already complete):**
- Already importing `TOKEN_NAME`, `TOKEN_SYMBOL`, `TOKEN_DECIMALS`, `TOKEN_EXTENSIONS`, `REHEARSAL_1_METADATA`, `REHEARSAL_2_METADATA` from `src/config/token-config.ts`. Commit `e00fee6` proves the imports resolve and the 6 verify-mint vitest behaviors pass.

**For Plan 03-03 (upload-metadata — ran concurrently, at checkpoint):**
- `assets/metadata/rehearsal-1.json` and `assets/metadata/rehearsal-2.json` are in place with `PLACEHOLDER_REH*_ARWEAVE_URL` sentinels. Plan 03-03's Task 2+ will upload `assets/logo-512.png` to Arweave, replace both placeholders with the real Arweave TX URL, then upload the resulting JSONs.

**For Plans 03-04 and 03-05 (rehearsal scripts):**
- Both `REHEARSAL_1_METADATA` and `REHEARSAL_2_METADATA` are ready for TokenMetadata init calls. The locked launch strings in REHEARSAL_2 pass through to on-chain TLV via `createInitializeInstruction` from `@solana/spl-token-metadata`.

**For Phase 4 mainnet:**
- `REHEARSAL_2_METADATA` is the mainnet metadata bundle. Phase 4 inherits it verbatim; only the `image` field in the off-chain JSON will change (to a fresh mainnet Arweave TX ID). Every byte of name/symbol/description/external_url flows through unchanged.

---

## Self-Check: PASSED

**Files created verified (absolute paths):**

- `E:\markc\cayc-solana-contract\CAYC Solana Contract\src\config\token-config.ts` FOUND
- `E:\markc\cayc-solana-contract\CAYC Solana Contract\src\config\token-config.test.ts` FOUND
- `E:\markc\cayc-solana-contract\CAYC Solana Contract\assets\logo-source.png` FOUND (394874 bytes; 5863×4529 RGBA)
- `E:\markc\cayc-solana-contract\CAYC Solana Contract\assets\logo-512.png` FOUND (19014 bytes)
- `E:\markc\cayc-solana-contract\CAYC Solana Contract\assets\logo-1024.png` FOUND (38814 bytes)
- `E:\markc\cayc-solana-contract\CAYC Solana Contract\assets\metadata\rehearsal-1.json` FOUND (252 bytes)
- `E:\markc\cayc-solana-contract\CAYC Solana Contract\assets\metadata\rehearsal-2.json` FOUND (244 bytes)
- `E:\markc\cayc-solana-contract\CAYC Solana Contract\scripts\assets\resize-logo.ts` FOUND

**Files modified verified:**

- `package.json` — `sharp ^0.33` in devDependencies, `assets:resize-logo` script present
- `pnpm-lock.yaml` — sharp + @img/sharp-win32-x64 entries present

**Commits verified (in repo):**

- `0e1c8ee` FOUND: Task 1 substance (see Deviation 1 for attribution note)
- `3b99e4a` FOUND: Task 2 (clean 03-01 attribution): `feat(03-01): resize logo to 512/1024 derivatives + preserve source`
- `e00fee6` FOUND: Task 3 substance (see Deviation 1 for attribution note)

**Gate commands (run in order):**

- `pnpm typecheck` → exit 0 (VERIFIED)
- `pnpm test` → 4 files, 26 tests passing (VERIFIED; 11 prior + 9 token-config + 6 verify-mint)
- `pnpm lang:audit` → "no violations found" across 10 files (VERIFIED)
- `pnpm gitleaks` → "no leaks found" across 57 commits (VERIFIED)
- `pnpm assets:resize-logo` → idempotent; "OK — both derivatives under 100 KB" (VERIFIED)

**Acceptance criteria grep checks:**

- `grep -c "Cyber Ape Yacht Club 8G" src/config/token-config.ts` → 1 (TOKEN_NAME literal; REHEARSAL_2_METADATA.name references it by variable so no duplicate literal). Plan expected >= 2 but the reference-via-const approach is preferred per Decision 3.
- `grep -c "Cyber Ape Yacht Club 8G" assets/metadata/rehearsal-2.json` → 1 (VERIFIED)
- `grep -c "Squads 3-of-5 multisig" src/config/token-config.ts` → 1 (TOKEN_DESCRIPTION literal, same reference-via-const rationale as above)
- `grep -c "Squads 3-of-5 multisig" assets/metadata/rehearsal-2.json` → 1 (VERIFIED)
- `grep -E "TOKEN_DECIMALS\s*=\s*6" src/config/token-config.ts` → match (VERIFIED)
- `grep -E "INITIAL_SUPPLY_RAW\s*=\s*500_000_000n" src/config/token-config.ts` → match (VERIFIED)
- `grep -E "ExtensionType\.(MetadataPointer|PermanentDelegate)" src/config/token-config.ts` → 2 lines (VERIFIED)
- `grep -Ei "stablecoin|backed by|redeemable" src/config/token-config.ts` → empty (VERIFIED after Deviation 4 fix)
- `grep -c "PLACEHOLDER_REH1_ARWEAVE_URL" assets/metadata/rehearsal-1.json` → 1 (VERIFIED)
- `grep -c "PLACEHOLDER_REH2_ARWEAVE_URL" assets/metadata/rehearsal-2.json` → 1 (VERIFIED)
- `grep -c "DO NOT USE" assets/metadata/rehearsal-1.json` → 1 (VERIFIED)
- `grep -Ei "stablecoin|backed by|redeemable" assets/metadata/` → empty (VERIFIED)
- `grep -c "https://cayc.io" assets/metadata/rehearsal-2.json` → 1 (VERIFIED)
- `grep -c "CAYC" assets/metadata/rehearsal-2.json` → 1 (symbol field only, as specified)

**Note on two grep counts of 1 instead of >=2:** The plan's acceptance criteria stated `grep -c "Cyber Ape Yacht Club 8G" src/config/token-config.ts returns >= 2 (once in TOKEN_NAME, once in REHEARSAL_2_METADATA.name reference — via TOKEN_NAME const)`. I read this as a wording oddity: since REHEARSAL_2_METADATA.name is declared as `name: TOKEN_NAME`, the string literal appears exactly once (in the TOKEN_NAME declaration). The criterion's parenthetical hedge ("via TOKEN_NAME const") acknowledges this. If the intent was a literal duplicate, my Decision 3 rationale argues against it: duplicating string literals is a drift vector.

---

_Phase: 03-devnet-full-rehearsal_
_Plan: 01_
_Completed: 2026-04-20_
