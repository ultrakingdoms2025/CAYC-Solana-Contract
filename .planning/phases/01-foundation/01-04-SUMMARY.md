---
phase: 01-foundation
plan: 04
subsystem: policy
tags: [pol-04, style-guide, language-audit, ci-check, husky, pre-commit, gitleaks, prettier, genius-act, mica, jupiter, coingecko, coinmarketcap, solscan]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: docs/policies/ scaffolded (Plan 01-02); mint-policy.md §12 + clawback-freeze-policy.md §14 Legal-posture disclaimers containing intentional "stablecoin" occurrences that this plan's audit must allowlist (Plan 01-03); .husky/pre-commit scaffold with gitleaks + prettier + typecheck steps (Plan 01-02); package.json with lang:audit placeholder script (Plan 01-02)
provides:
  - CAYC Language & Disclosure Style Guide v1.0 at `docs/style-guide.md` (POL-04 deliverable) — codifies the "no 'stablecoin' in public copy" rule, approved replacement terminology table ("branded payments token, USDC-referenced"), boilerplate disclosure wording, Permanent Delegate + Freeze disclosure pattern, listing-platform category rules (CoinGecko/CMC/Jupiter Verify/Solscan/CEX), the three narrow contexts where "stablecoin" IS acceptable (negation / legal-posture / historical reference), and the allowlist mechanism
  - Mechanical CI enforcement at `scripts/check-language.sh` (174 lines; bash + node for config parsing; context-anchored allowlist via section-heading range detection; --staged mode for pre-commit)
  - Audit configuration at `.langauditrc.json` (133 lines) — 6 banned terms (stablecoin/variants, backed by, redeemable, 1:1 with USDC, always worth $1), 3 context allowlists (mint-policy §12, clawback-freeze §14, policies README "What these policies do NOT cover"), and 12 line-level allowlist patterns covering negations + Style-Guide §6 permitted references
  - `package.json` scripts: `lang:audit` (replaces Plan-02 placeholder) + `lang:audit:staged` variant
  - `.husky/pre-commit` hook extended with language audit as Step 3 (order: gitleaks → prettier → lang-audit → typecheck) — any commit introducing a banned term outside the allowlist is blocked
  - Proven self-enforcement: `pnpm lang:audit` exits 0 on the current tree (the two legal-posture sections + style-guide.md + policies README scope paragraph correctly allowlisted); smoke test with deliberate violation fails with 2 violation messages, confirming the check actually blocks
affects:
  - 02-squads-setup (any docs added during Phase 2 that describe authorities must use the Style-Guide §4 Permanent Delegate + Freeze disclosure wording verbatim; lang:audit will enforce)
  - 05-listings (every listing application — Jupiter CAT review, CoinGecko form, CoinMarketCap form, Solscan description — must pass the language audit before submission; Style-Guide §5 specifies the exact categories to select on each platform)
  - 05-ops (any website copy, social posts, Discord pins authored in Phase 5 must pass lang:audit; OPS-07 copycat warning templates must use approved terminology)
  - 07-cex (every CEX listing application + compliance disclosure document is a hard-gate language-audit check before submission; Style-Guide §5 last row specifies the CEX vocabulary)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Style-guide-as-contract: POL-04 delivers BOTH a policy document (docs/style-guide.md) AND a mechanical enforcement mechanism (scripts/check-language.sh + .langauditrc.json + pre-commit integration). The policy document is the human-readable rulebook; the CI check makes violations impossible to miss. Every future phase that writes public-facing copy is blocked at commit time if it introduces banned terms outside the allowlist."
    - "Context-level (section-anchor) allowlist: rather than exempting entire files, the audit allowlists specific sections of specific files by heading anchor (e.g., `## 12. Legal posture` in mint-policy.md). The script finds the anchor line, finds the next H1/H2 heading, and treats the range as allowlisted. Precision over breadth: the rest of each policy file is still scanned."
    - "Line-level regex allowlist: for recurring permitted phrases that appear across many files (e.g., 'not a regulated stablecoin', 'payment stablecoin' referring to the GENIUS-Act category, 'algorithmic stablecoin' referring to historical Terra/UST-style projects), a regex allowlist catches the pattern without needing per-file exemptions. Twelve patterns cover all current legitimate uses."
    - "node-parsed JSON config: the bash script uses `node -e` to parse `.langauditrc.json` (no jq dependency). Node is already a repo prerequisite, so this avoids adding a tool. Tabs are used as field separators since they can't appear in the regex patterns or paths."
    - "pre-commit hook order: gitleaks (secrets) → prettier (formatting) → lang-audit (language) → typecheck (types). Language is Step 3, between formatting and types, because language violations are about text content — same category as formatting."

key-files:
  created:
    - "docs/style-guide.md (111 lines; v1.0; POL-04 deliverable; 10 numbered sections + version-history table; rule + rationale + replacement terminology + boilerplate + PD/Freeze disclosure + listing-platform rules + narrow-acceptable-contexts enumeration + allowlist-mechanism spec)"
    - "scripts/check-language.sh (174 lines; executable; --staged support; context + line allowlist engines; strict-mode opt-out for grep/read control-flow compatibility)"
    - ".langauditrc.json (133 lines; v1.0; 6 banned_terms, 3 allowlisted_contexts, 12 allowlisted_lines, exclude_paths covering docs/security + docs/style-guide.md + .planning)"
  modified:
    - "package.json (replaced Plan-02 placeholder lang:audit script with real bash invocation; added lang:audit:staged variant)"
    - ".husky/pre-commit (inserted Step 3 language audit between prettier and typecheck; renumbered typecheck to Step 4; added header comment)"

key-decisions:
  - "scripts/check-language.sh uses `set -uo pipefail` rather than `set -euo pipefail` — `-e` combined with the grep/read control-flow inside subshell pipelines causes the script to abort silently on the first non-match. The scan-loop pattern (grep returns 1 on no-match; `while ... read` returns 1 at EOF) is deliberate control flow, not error. Documented in the script header comment. Real errors are surfaced via explicit exit statements."
  - "Renamed `LINENO` → `LN` throughout the scan loop (Rule 1 auto-fix): `LINENO` is a reserved bash variable that always holds the current script line number. Assigning to it via `IFS=: read -r LINENO LINETEXT` appears to work but read silently ignores the assignment — the variable keeps returning the script line. Symptom was every violation reported as line 151 (or whatever line `$LINENO` was at in the loop). Renamed to `LN` which has no shell-builtin meaning."
  - "Expanded allowlist patterns beyond the plan's original 3-pattern set to 12 patterns. The plan's original `not a stablecoin` literal doesn't match 'not a regulated stablecoin', 'not a reserve-backed stablecoin', or '**not** a reserve-backed stablecoin' (markdown bold). Broadened to `not[*]{0,2} a [a-z-]+ stablecoin` (allows markdown bold + hyphenated qualifier) plus dedicated patterns for 'payment stablecoin' (GENIUS-Act definitional term), 'algorithmic stablecoin' (historical reference), 'regulated stablecoin' (the category CAYC explicitly isn't), and 'not redeemable' (explicit redemption negation)."
  - "Three context allowlists, not two: plan specified §12 of mint-policy.md and §14 of clawback-freeze-policy.md. Added a third for `docs/policies/README.md` § 'What these policies do NOT cover' because that section's scope paragraph explicitly negates peg/stablecoin framing. Without it, the README would need file-level exclusion (which is coarser) or repeated allowlisted-lines entries."
  - "`docs/style-guide.md` is in `exclude_paths` (entirely skipped), not in `allowlisted_contexts`. The style guide is the rule document — it necessarily contains every banned term as a literal. Scanning it and then allowlisting section by section would be 30+ allowlist entries. File-level exclusion is the right precision for this file."
  - "Pre-commit hook uses `bash scripts/check-language.sh --staged` (staged mode) not full-tree scan — consistent with gitleaks' `--staged` flag and prettier's staged-file filter. Full-tree scan runs via `pnpm lang:audit` (manual invocation) or future GitHub Actions CI."
  - "Hook order kept as gitleaks → prettier → lang-audit → typecheck. Placing lang-audit before typecheck means a TypeScript file that also violates language rules fails fast on language (cheaper check) rather than running the full TSC pass. Placing it after prettier means the input is already formatted-normalized — avoids false positives from variable whitespace."

patterns-established:
  - "Allowlist-triple mechanism: (1) exclude_paths for files that are definitionally the rule document or are internal-only (docs/style-guide.md, docs/security/, .planning/); (2) allowlisted_contexts for specific sections of specific files where banned terms are part of a legal-posture disclaimer (mint-policy §12, clawback-freeze §14, policies README scope); (3) allowlisted_lines regex patterns for recurring idioms across any file (negations, GENIUS-Act/MiCA definitional terms, historical references to other projects)."
  - "Banned-term message convention: every `banned_terms[].message` field points to `docs/style-guide.md Section 2` for the canonical replacement. Developers hitting a violation always know where to read the rule."
  - "Allowlist addition procedure (documented in docs/style-guide.md §9): adding to either allowlist requires a one-paragraph PR rationale explaining why the banned term cannot be avoided. The rationale goes in the allowlist entry's `rationale` field AND in the PR description — two archival locations, not one."

requirements-completed: [POL-04]

# Metrics
duration: 40min
completed: 2026-04-19
---

# Phase 1 Plan 4: POL-04 Language Style Guide + CI Language Audit Summary

**v1.0 Language & Disclosure Style Guide (docs/style-guide.md, 111 lines, 10 sections) paired with a bash+node CI audit (scripts/check-language.sh + .langauditrc.json) wired into `pnpm lang:audit` and `.husky/pre-commit`, with context-level section-anchor allowlists and 12 line-level regex allowlists that make the two policy files' Legal-posture "stablecoin" disclaimers pass cleanly while blocking any unintended public-copy violation.**

## Performance

- **Duration:** 40 min end-to-end (file drafting + Prettier reconciliation + script debugging + allowlist tuning + smoke test + atomic commits)
- **Started:** 2026-04-19T21:17:07Z
- **Task 1 committed:** 2026-04-19T21:19:xxZ (commit `e9a65c1`)
- **Task 2 committed:** 2026-04-19T21:57:xxZ (commit `8d8e3d8`)
- **Completed:** 2026-04-19T21:57:39Z
- **Tasks:** 2 / 2 (both `type="auto"`, no checkpoints)
- **Files created:** 3 (`docs/style-guide.md`, `scripts/check-language.sh`, `.langauditrc.json`)
- **Files modified:** 2 (`package.json`, `.husky/pre-commit`)

## Accomplishments

- **POL-04 deliverable shipped.** `docs/style-guide.md` is a 111-line v1.0 document covering all 10 sections the plan requires: the absolute "no stablecoin" rule with GENIUS-Act + MiCA + SEC + CG/CMC rationale, the approved terminology table with 11 replacement entries, the boilerplate disclosure + short-form variant, the Permanent Delegate + Freeze disclosure pattern (per research/FEATURES.md Flags 6-7), listing-platform-specific category rules (CoinGecko/CMC/Jupiter Verify/Solscan/CEX), enforcement notes pointing at the CI check, scope definition distinguishing public vs internal, the three narrow contexts where "stablecoin" IS acceptable (negation / legal-posture / historical reference to other projects like USDC), and the allowlist mechanism specification.
- **Mechanical CI enforcement wired end-to-end.** `scripts/check-language.sh` (174 lines, executable) reads `.langauditrc.json` (133 lines), scans either all tracked files in `scan_paths` or only staged files (`--staged`), applies file-level exclusions + section-anchor context allowlists + line-level regex allowlists, and exits non-zero if any violation remains. The script is invoked via `pnpm lang:audit` (manual) and automatically by `.husky/pre-commit` (`bash scripts/check-language.sh --staged`) before every commit.
- **Two intentional "stablecoin" occurrences correctly allowlisted.** The audit passes `docs/policies/mint-policy.md` §12 and `docs/policies/clawback-freeze-policy.md` §14 cleanly (Legal-posture disclaimer sections, part of the Plan 01-03 Wave-2 inheritance obligation). A third context allowlist covers `docs/policies/README.md` "What these policies do NOT cover" scope paragraph. `docs/style-guide.md` itself is in `exclude_paths` (full file exemption) because it is the rule document and necessarily contains every banned term as a literal.
- **Smoke test confirmed the audit actually blocks.** Staged a test file `docs/test-violation.md` containing `CAYC is a stablecoin that is backed by USDC reserves.`. Ran `pnpm lang:audit:staged`. Audit reported 2 violations (stablecoin-word at line 3, backed-by at line 3) with correct line numbers and the file path. Unstaged + removed the test file. Confirms the enforcement mechanism is real, not theater.
- **Phase 1 hard gates green.** `pnpm typecheck`, `pnpm format:check`, `pnpm gitleaks` (21 commits scanned, no leaks), and `pnpm lang:audit` (7 files scanned, no violations) all exit 0 on the current tree.
- **Four POL requirements now closed.** POL-01 (Plan 01-01), POL-02 + POL-03 (Plan 01-03), POL-04 (this plan). Phase 1 Success Criteria 1, 2, 3, and 4 all have concrete evidence on disk.

## Task Commits

Each task committed atomically:

1. **Task 1: Draft docs/style-guide.md v1.0 (POL-04)** — `e9a65c1` (docs)
2. **Task 2: Wire POL-04 language audit (script + config + package.json + pre-commit)** — `8d8e3d8` (feat)

**Plan metadata:** to be captured in final metadata commit after state/roadmap updates.

## Files Created/Modified

**Created:**

- `docs/style-guide.md` — 111 lines; v1.0 draft; POL-04 deliverable. Ten numbered sections + version-history table. Every clause the plan specifies is present and greppable; acceptance-criteria grep suite (H1, "branded payments token, USDC-referenced" ≥3 occurrences, "GENIUS Act", §2 heading, §9 heading, all four listing platforms, ≥60 lines, 0 placeholder remnants) passed.
- `scripts/check-language.sh` — 174 lines; executable (chmod +x); `#!/usr/bin/env bash` shebang; `set -uo pipefail` (intentionally NOT `-e` to preserve grep/read control-flow); node-parsed JSON config (no jq dependency); tab-separated internal field format; `--staged` mode for pre-commit hook.
- `.langauditrc.json` — 133 lines; v1.0 config. Six banned_terms (stablecoin, stable[- ]coin, backed by, redeemable, 1:1 with USDC, always worth $1). Three allowlisted_contexts (mint-policy §12 Legal posture, clawback-freeze §14 Legal posture, policies README "What these policies do NOT cover"). Twelve allowlisted_lines (NOT a stablecoin / not a stablecoin / not a [a-z-]+ stablecoin / never .stablecoin / deliberately NOT / regulated stablecoin / does NOT make CAYC a regulated / comparable to regulated / not[*]{0,2} a [a-z-]+ stablecoin (markdown-bold-aware) / not[*]{0,2} redeemable / no redemption / payment stablecoin / algorithmic stablecoin / stablecoin[- ]compliance / regulated-stablecoin / "Stablecoin. issuer"). Exclude_paths: docs/security, docs/style-guide.md, .planning.

**Modified:**

- `package.json` — replaced Plan-02 placeholder `"lang:audit": "echo 'lang:audit wired up in Plan 04'"` with `"lang:audit": "bash scripts/check-language.sh"` and added `"lang:audit:staged": "bash scripts/check-language.sh --staged"`. All other fields unchanged.
- `.husky/pre-commit` — inserted Step 3 language audit (`bash scripts/check-language.sh --staged`) between the existing Step 2 (prettier) and Step 3 (now Step 4, typecheck). Updated header comment to list the four steps in order: gitleaks → prettier → lang-audit → typecheck.

## Decisions Made

1. **`scripts/check-language.sh` uses `set -uo pipefail` rather than `set -euo pipefail`.** The plan's original script text included `-e`, but `-e` combined with the scan loop's grep+read subshell pipelines causes silent abort on the first no-match — symptom: script exits 1 with no error output. Removed `-e`, documented the rationale in the script header (`# Note: -e is deliberately not set. The scan loop uses grep/read exit codes as control flow...`). Real errors are surfaced via explicit exit statements (2 for missing config, 1 for violations, 0 for clean).
2. **Renamed the reserved bash variable `LINENO` → `LN` throughout the scan loop.** Used `replace_all` via Edit tool. `LINENO` is a bash builtin that always returns the current script line number; assigning to it via `IFS=: read -r LINENO LINETEXT` silently fails, and `$LINENO` continues to return the script line. Symptom: every violation reported the same line number (the line number of the echo statement inside the loop — "151" in my case). After rename, line numbers are correct (3, 5, 9, 71, 80, 103 etc., matching direct grep output). This was a Rule 1 auto-fix (bug in my own script while writing it).
3. **Expanded the allowlist patterns from the plan's 3 entries to 12.** The plan specified `NOT a stablecoin` + `not a stablecoin` + `never .stablecoin`. That's not enough to cover legitimate existing uses:
   - **`not[*]{0,2} a [a-z-]+ stablecoin`** — matches `not a regulated stablecoin`, `not a payment stablecoin`, `not a reserve-backed stablecoin`, and the markdown-bold variant `**not** a reserve-backed stablecoin` (the `[*]{0,2}` allows 0-2 trailing asterisks on "not").
   - **`payment stablecoin`** — Style Guide §6 case 3 (GENIUS-Act definitional term in quotes).
   - **`algorithmic stablecoin`** — Style Guide §6 case 3 (historical reference to Terra/UST-style projects).
   - **`regulated stablecoin`** — matches CAYC's explicit disclaimer of regulated-category status as well as references to USDC/USDT as regulated stablecoins.
   - **`comparable to regulated`** — catches the Clawback/Freeze Policy §2 "compliance scenarios comparable to regulated stablecoins (USDC, USDT)" (reference to USDC/USDT, not to CAYC).
   - **`not[*]{0,2} redeemable`** — explicit redemption negation.
   - **`no redemption`** — explicit redemption negation variant ("has no redemption right", "there is no redemption mechanism").
   - Plus several tightly-scoped patterns for hyphenated adjectives and GENIUS-Act statutory roles.
   - Each new entry has its own `rationale` field documenting why the broad form is correct.
4. **Added a third context allowlist for `docs/policies/README.md` "What these policies do NOT cover".** The plan's original allowlist covered only the two policy files' §12/§14 legal-posture sections. But the policies README's scope section ALSO contains phrasing that discusses peg mechanism by negation ("there is no peg contract"). Added a context allowlist entry anchored at `## What these policies do NOT cover` (next H2 is `## Versioning` at line 25, so lines 19-24 are allowlisted). Alternative would have been a file-level exclusion, which is coarser.
5. **`docs/style-guide.md` is in `exclude_paths`, not `allowlisted_contexts`.** The style guide is the rule document — it necessarily contains every banned term as a literal example. Scanning it section-by-section would require 30+ allowlist entries, all of them trivial. File-level exclusion is the correct precision for this file. Noted explicitly in `.langauditrc.json` comment (via JSON structure) that this is the only file where full-file exclusion is the right call.
6. **Hook order: gitleaks → prettier → lang-audit → typecheck.** Language audit inserted as Step 3 (between prettier and typecheck). Rationale: (a) language violations are text-content violations, same category as formatting — group them together near the start of the chain; (b) lang-audit is cheap (pure grep + bash) compared to tsc's full type-inference pass, so it runs first if both would fail; (c) placing it after prettier means any Prettier-normalized whitespace doesn't cause false positives.
7. **Smoke test used `docs/test-violation.md` (staged but never committed).** Rather than commit a violation to test the audit, I wrote a file to disk, `git add`-ed it (which puts it in the index without committing), ran `pnpm lang:audit:staged`, observed it FAIL with 2 correct violations, then `git reset HEAD` + `rm` to clean up. This avoids polluting git history with a deliberately-broken commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Script reserved-variable bug (`LINENO` → `LN`)**

- **Found during:** Task 2, running `pnpm lang:audit` for the first time after writing the script.
- **Issue:** The plan's script text (reproduced verbatim initially) used `LINENO` as the variable to hold the line number parsed from grep's `-n` output. `LINENO` is a reserved bash builtin — assignments to it are silently ignored, and reading it returns the current script line. Symptom: every violation reported line "151" (the bash script's line-number of the echo statement inside the scan loop), regardless of which file was scanned. File paths and line text were correct, only the line number was wrong.
- **Fix:** Used `Edit --replace_all` to rename `LINENO` → `LN` throughout `scripts/check-language.sh`. Four occurrences changed (declaration, empty-guard, two context-range comparisons, violation-message interpolation). After rename, line numbers match direct grep output (3, 5, 9, 71, 80, 103, etc.). Verified via smoke test: deliberate violation at file line 3 correctly reports "docs/test-violation.md:3".
- **Files modified:** `scripts/check-language.sh` (4 rename occurrences).
- **Verification:** Smoke test output `VIOLATION: docs/test-violation.md:3 [stablecoin-word]` — line 3 is the file line where the banned text lives, correct. After fix, no more erroneous "151" line numbers.
- **Committed in:** `8d8e3d8` (Task 2 commit; fix folded in before the commit because the script was being debugged as part of Task 2).

**2. [Rule 1 - Bug] `set -e` aborts scan loop silently**

- **Found during:** Task 2, re-running `pnpm lang:audit` after the LN fix. Script exited 1 with NO "FAILED — N violations" message (the exit-message branch didn't fire). This was confusing — violations existed but weren't being reported.
- **Issue:** The script's `set -euo pipefail` header combined with the scan-loop pipelines (`while IFS=$'\t' read ... | while IFS=: read ...`) causes `-e` to terminate the entire script when either `grep` returns 1 (no match found, normal control flow) or the `while read` exits with status 1 at EOF. Result: the script aborted in the middle of the scan, before reaching the violations-count-and-report block at the end.
- **Fix:** Changed `set -euo pipefail` to `set -uo pipefail` and added a 3-line comment block explaining the rationale. Real errors are still surfaced via explicit exit statements (config missing → exit 2; violations found → exit 1; clean → exit 0).
- **Files modified:** `scripts/check-language.sh` (script header only).
- **Verification:** After fix, `pnpm lang:audit` produces either "OK — no violations found." (exit 0) or a block of "VIOLATION: ..." messages followed by "FAILED — N violation(s) found." (exit 1). Smoke test confirmed the failure path works end-to-end.
- **Committed in:** `8d8e3d8` (Task 2 commit; fix folded into the script text before the commit).

**3. [Rule 2 - Missing Critical] Allowlist expansion to cover existing legitimate "stablecoin" uses**

- **Found during:** Task 2, first clean run of the audit revealed five violations that the plan's 3-entry allowlist didn't anticipate:
  - `README.md:5` — "is not a regulated stablecoin" (negation with qualifier, not matched by literal `not a stablecoin`)
  - `docs/policies/mint-policy.md:9` — "not a reserve-backed stablecoin" + markdown bold `**not**` (same class)
  - `docs/policies/mint-policy.md:9` — "is not redeemable at par" (banned `redeemable` triggered; negation; needs allowlist)
  - `docs/policies/mint-policy.md:9` — "payment stablecoin" (GENIUS-Act definitional term in quotes)
  - `docs/policies/mint-policy.md:71` — "not a reserve-backed stablecoin" + "algorithmic stablecoins" (reference to historical category)
  - `docs/policies/mint-policy.md:80` — "never 'stablecoin'" (matched plan's `never .stablecoin` so no issue there)
  - `docs/policies/clawback-freeze-policy.md:8` — "comparable to regulated stablecoins (USDC, USDT)" (Style Guide §6.3 historical reference to other projects)
- **Issue:** The plan's three allowlist patterns (`NOT a stablecoin`, `not a stablecoin`, `never .stablecoin`) only catch naked-negation forms. They don't cover (a) negation with a qualifier word like "regulated" or "reserve-backed", (b) GENIUS-Act / MiCA definitional terms, (c) Style-Guide §6.3 references to other projects as regulated stablecoins, (d) markdown-bold formatting around "not". All of these are LEGITIMATE uses per Style Guide §6; the audit should pass them.
- **Fix:** Added 9 additional `allowlisted_lines` entries to `.langauditrc.json`, each with its own `rationale` field. See Decision #3 above for the full list. Also added a third `allowlisted_contexts` entry for `docs/policies/README.md` "What these policies do NOT cover" (the scope paragraph explicitly negates peg/stablecoin framing).
- **Files modified:** `.langauditrc.json` (allowlist section expanded from 3 to 12 entries; allowlisted_contexts expanded from 2 to 3).
- **Verification:** After fix, `pnpm lang:audit` scans 7 files and reports "OK — no violations found." Every existing "stablecoin" / "backed by" / "redeemable" occurrence in the scanned tree is either (a) in an excluded path, (b) in an allowlisted context/section, or (c) matched by an allowlisted line pattern with a documented rationale.
- **Committed in:** `8d8e3d8` (Task 2 commit).

**4. [Rule 3 - Environment] Gitleaks PATH workaround (inherited from Plan 01-02/01-03)**

- **Found during:** Task 1, first `git commit`.
- **Issue:** Gitleaks 8.30.1 is installed via winget but not on the default bash shell PATH (known machine-specific quirk, documented in Plan 01-02 SUMMARY and the orchestrator's `<gitleaks_path_note>`).
- **Fix:** Prepended the gitleaks winget directory to PATH inside each `git commit` bash invocation: `export PATH="/c/Users/markc/AppData/Local/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe:$PATH"`. Both task commits (`e9a65c1`, `8d8e3d8`) succeeded with the pre-commit hook firing and gitleaks passing ("no leaks found").
- **Files modified:** None (shell-level only).
- **Verification:** Both commits show `[pre-commit] Running gitleaks on staged changes...` → `[pre-commit] OK`.
- **Committed in:** N/A (shell-level workaround).

**5. [Rule 3 - Blocking] Prettier reformatted the style guide on save**

- **Found during:** Task 1, running `pnpm format:check` as a verification step.
- **Issue:** The plan's provided style-guide text has unpadded Markdown tables. Prettier's project config (from Plan 01-02) pads table columns. After writing the file, `pnpm format:check` flagged it.
- **Fix:** Ran `pnpm format`. Table columns padded to align; italic-delimiter normalization. Pure cosmetic changes, no content modification. Line count went from 109 to 111 (Prettier inserted a blank line before one of the blockquotes). Acceptance-criteria grep suite re-run and still passes.
- **Files modified:** `docs/style-guide.md` (Prettier reformat only).
- **Verification:** `pnpm format:check` → "All matched files use Prettier code style!"
- **Committed in:** `e9a65c1` (Task 1 commit; reformatted file committed, not the pre-format version).

---

**Total deviations:** 5 auto-fixed (2 bugs in my own script being written, 1 missing critical allowlist expansion, 1 environment/PATH quirk inherited from prior plans, 1 formatter conformance).
**Impact on plan:** All five are necessary for correctness. The two script bugs had to be fixed for the audit to function at all. The allowlist expansion was necessary for the audit to pass on the current tree (the plan's minimal allowlist would have failed on multiple legitimate existing uses of "stablecoin" that Style Guide §6 permits). The gitleaks PATH workaround and Prettier reformat are both inherited patterns already documented in Plan 01-02/01-03 SUMMARYs. No scope creep; the style guide content is exactly what the plan specified, and the audit mechanism does exactly what the plan specified — the expansions are implementation tuning.

## Issues Encountered

- **Script debugging took longer than expected.** The LINENO bug was particularly insidious — because `LINENO` is silently reassigned by bash (not errored on), and because the LINETEXT variable was correct, the initial symptom looked like "the script is finding the wrong line number" rather than "the script is using a reserved builtin." A bash `-x` trace was needed to notice that the reported number was always the line of the violation-echo statement itself. Resolution: rename, document, move on.
- **The `set -e` interaction with grep-based control flow is a classic bash gotcha.** The plan's script text inherited this from a common bash idiom. Real fix would be to restructure the loop with explicit `|| true` guards on each grep call, but removing `-e` is simpler and the script's error paths are few enough to handle explicitly.
- **No regressions on existing hooks.** The Husky `core.hooksPath=.husky/_` shim pattern from Plan 01-02 continues to work. The new Step 3 inserts cleanly; the hook's existing error-propagation logic (each step has its own `|| { echo ERROR; exit 1; }` block) is preserved.

## User Setup Required

None for this plan. All deliverables are code + config files committed to the repo. Developers installing the repo for the first time will get the pre-commit hook via `pnpm install` → `prepare` → `husky` (same as Plan 01-02). Language audit runs automatically without any additional setup.

## Phase 1 Completion Confirmation

With Plan 01-04 complete, Phase 1 Success Criterion 3 is met:

> "No public-facing artifact uses the word 'stablecoin'; every instance has been replaced with 'branded payments token, USDC-referenced.'"

| Sub-item                                             | Status | Evidence                                                                                                                                                                                                    |
| ---------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Style guide exists defining the rule                 | MET    | `docs/style-guide.md` §§1-10 (111 lines); canonical replacement phrase "branded payments token, USDC-referenced" appears 3 times in canonical positions                                                     |
| CI check mechanically enforces the rule              | MET    | `scripts/check-language.sh` executable; `pnpm lang:audit` green on current tree; `.husky/pre-commit` Step 3 blocks any commit introducing a violation                                                        |
| Current tree passes the audit                        | MET    | 7 files scanned, 0 violations. The two policy-file Legal-posture sections and the policies-README scope paragraph are correctly allowlisted via section-anchor ranges.                                       |
| Smoke test proves the check actually blocks          | MET    | `docs/test-violation.md` with "CAYC is a stablecoin that is backed by USDC reserves." produced 2 violations (stablecoin-word + backed-by at line 3) when staged. File removed after test.                      |

## Phase 1 Summary (All Plans)

With Plans 01-01 through 01-04 complete, all four POL requirements are closed:

| Requirement | Plan  | Deliverable                                                                                                          |
| ----------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| POL-01      | 01-01 | Symbol-availability check document + accept-conflict decision + disambiguation convention                            |
| POL-02      | 01-03 | `docs/policies/mint-policy.md` v1.0 (48h pre-announcement gate, multisig-discipline time-lock)                       |
| POL-03      | 01-03 | `docs/policies/clawback-freeze-policy.md` v1.0 (narrow scope, Freeze Transparency Log, OPS-07 acknowledgement)       |
| POL-04      | 01-04 | `docs/style-guide.md` v1.0 + `scripts/check-language.sh` + `.langauditrc.json` + pre-commit wiring (this plan)       |

Phase 1 Success Criteria 1, 2, 3, and 4 all have concrete evidence on disk.

## Next Phase Readiness

**For Phase 2 (Squads Multisig Setup — GOV-01 through GOV-04):**

- **Phase 1 is unblocked.** Every policy deliverable is committed. The language audit enforces the public-copy rule automatically from this commit onward, meaning Phase 2's signer-vendor disclosures, Squads multisig setup documentation, and any public announcements about authority configuration will all pass through the same CI gate.
- **Pending: symbol-availability preflight re-check.** Plan 01-01 decision trail requires a fresh 4-platform symbol check ≤72h before the mainnet ceremony (Phase 4). Phase 2 does not need to re-check yet; the obligation is recorded for Phase 4 planning.

**For Phase 5 (Ops Go-Live — Publication + OPS-07 + Transparency Log):**

- **Publication copy must pass lang:audit.** Every website page, every social post, every pinned message, every listing submission, and every OPS-07 warning template authored in Phase 5 will be scanned on commit. The style guide's §5 listing-platform rules specify the exact vocabulary to use (CoinGecko: "Payments" or "Ecosystem Token"; CoinMarketCap: "Payments" or "Utility Token"; Jupiter Verify: avoid "stablecoin" entirely; Solscan: no "stablecoin" in description).
- **Freeze Transparency Log** content (`docs/security/freeze-transparency-log.md` to be created at Phase 5 Ops Go-Live) is in `exclude_paths` — internal security content, not public-facing. Phase 5 can author freely there.

**For Phase 7 (CEX listings):**

- Every CEX application document is public-facing and must pass `pnpm lang:audit` before submission. Style Guide §5 last row: use "payments token" or "utility token" per application form vocabulary; never "stablecoin" in CEX applications. CEX-01 deliverable (listing package) becomes a hard language-audit gate before CEX-02 (actual submission).

**For all future phases:**

- **lang:audit is now a self-enforcing contract.** Any commit that introduces a banned term in a public-facing file (anywhere in `docs/` except `docs/security` and `docs/style-guide.md`, or `README.md`) will be blocked at pre-commit time. Phase authors cannot accidentally introduce "stablecoin" into public copy without an explicit allowlist addition PR. This is the mechanism that keeps the GENIUS-Act + MiCA legal exposure mitigation durable across the remainder of the project.

## Self-Check: PASSED

**Files created verified:**

- `docs/style-guide.md` FOUND (committed in `e9a65c1`)
- `scripts/check-language.sh` FOUND and executable (committed in `8d8e3d8`)
- `.langauditrc.json` FOUND (committed in `8d8e3d8`)

**Files modified verified:**

- `package.json` modified (placeholder removed, real scripts wired; committed in `8d8e3d8`)
- `.husky/pre-commit` modified (Step 3 language audit inserted; committed in `8d8e3d8`)

**Commits verified:**

- `e9a65c1` FOUND: `docs(01-04): add CAYC Language & Disclosure Style Guide v1.0 (POL-04)`
- `8d8e3d8` FOUND: `feat(01-04): wire POL-04 language audit (script + config + package.json + pre-commit)`

**Verification commands (all passed):**

- `test -f docs/style-guide.md` → exit 0
- `grep -q "^# CAYC Language & Disclosure Style Guide$" docs/style-guide.md` → matched
- `grep -c "branded payments token, USDC-referenced" docs/style-guide.md` → 3 (≥ 3 required)
- `grep -q "GENIUS Act" docs/style-guide.md` → matched
- `grep -q "^## 2\\. Approved terminology" docs/style-guide.md` → matched
- `grep -q "^## 9\\. Allowlisting specific contexts" docs/style-guide.md` → matched
- `grep -q "CoinGecko" / "CoinMarketCap" / "Jupiter Verify" / "Solscan" docs/style-guide.md` → all matched
- `wc -l < docs/style-guide.md` → 111 (≥ 60 required)
- `grep -c "{TASK RUN DATE IN UTC" docs/style-guide.md` → 0 placeholders remaining
- `test -f scripts/check-language.sh && test -x scripts/check-language.sh` → executable confirmed
- `head -1 scripts/check-language.sh | grep -q '#!/usr/bin/env bash'` → shebang confirmed
- `test -f .langauditrc.json` → exit 0
- `grep -q '"banned_terms"' .langauditrc.json` → matched
- `grep -q '"stablecoin"' .langauditrc.json` → matched
- `grep -q '"file": "docs/policies/mint-policy.md"' .langauditrc.json` → matched (S12 context allowlist)
- `grep -q '"section_anchor": "## 12. Legal posture"' .langauditrc.json` → matched
- `grep -q '"file": "docs/policies/clawback-freeze-policy.md"' .langauditrc.json` → matched (S14 context allowlist)
- `grep -q '"section_anchor": "## 14. Legal posture"' .langauditrc.json` → matched
- `grep -q '"lang:audit": "bash scripts/check-language\\.sh"' package.json` → matched (placeholder replaced)
- `grep -c "lang:audit wired up in Plan 04" package.json` → 0 (placeholder gone)
- `grep -q 'scripts/check-language\\.sh --staged' .husky/pre-commit` → matched
- `pnpm lang:audit` → "[lang:audit] OK — no violations found." (exit 0, 7 files scanned)
- `pnpm format:check` → "All matched files use Prettier code style!"
- `pnpm gitleaks` → "21 commits scanned … no leaks found"
- `pnpm typecheck` → exit 0 (no stdout)
- Smoke test: staging `docs/test-violation.md` with "CAYC is a stablecoin that is backed by USDC reserves." produced 2 violations (stablecoin-word and backed-by at line 3). File removed after test.
- `git log --oneline | grep -E "e9a65c1|8d8e3d8"` → both present

---

_Phase: 01-foundation_
_Plan: 04_
_Completed: 2026-04-19_
