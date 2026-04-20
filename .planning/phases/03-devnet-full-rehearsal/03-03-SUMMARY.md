---
phase: 03-devnet-full-rehearsal
plan: 03
subsystem: infra
tags: [metadata, hosting, github-raw, arweave-deferred, turbo-sdk, branch-b, devnet-only, phase-4-migration-required]

# Dependency graph
requires:
  - phase: 03-devnet-full-rehearsal
    provides: "Plan 03-01: assets/logo-512.png, assets/logo-1024.png, assets/metadata/rehearsal-{1,2}.json with PLACEHOLDER_* image strings awaiting substitution"
  - phase: 02-squads-multisig-setup-devnet-mainnet
    provides: "keys/devnet/proposer.json (funded for Branch A Arweave upload; not used in Branch B)"
  - phase: 01-foundation
    provides: "gitleaks pre-commit hook + PATH recipe, prettier+typecheck staged-file gate"
provides:
  - "scripts/assets/upload-metadata.ts dual-mode driver: Branch A (Arweave via @ardrive/turbo-sdk, SOL-paid) + Branch B (--github-only, zero-cost GitHub raw mirror)"
  - "docs/runbooks/metadata-hosting.md upload lifecycle + Phase 4 mainnet parity guidance"
  - "artifacts/metadata-hosting.json Branch B shape: top-level mode='github-only' + arweave_deferred_reason + phase_4_mainnet_migration_required=true + github_raw_urls map; per-rehearsal entries with null arweave_* fields + populated github_{raw_url,logo_512_url,logo_1024_url}"
  - "assets/metadata/rehearsal-1.json + rehearsal-2.json with image field rewritten from PLACEHOLDER_*_ARWEAVE_URL to https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/logo-512.png (0 PLACEHOLDER strings remain)"
  - "GitHub raw content URLs proven live post-push (HTTP 200 on both logo-512.png and rehearsal-{1,2}.json after CDN propagation)"
affects: [03-04-rehearsal-1, 03-05-rehearsal-2, 04-mainnet-launch — CRITICAL Phase 4 Arweave migration obligation]

# Tech tracking
tech-stack:
  added:
    - "@ardrive/turbo-sdk ^1 (installed but unused in Branch B — reserved for Phase 4 Arweave migration)"
    - "GitHub raw (raw.githubusercontent.com) as devnet-only metadata/asset host"
  patterns:
    - "Dual-branch hosting driver: --github-only flag forks into Branch B at top of script; Branch A (Arweave) preserved intact and will be exercised in Phase 4"
    - "Repo-must-be-public constraint for GitHub raw: pivot happened before execution (verified via gh repo view isPrivate=false) — documented as a hard prerequisite for Branch B mode"
    - "Idempotence via artifact populated-key check + --force override (shared with Plans 02-03/05 driver template)"
    - "CDN propagation tolerance pattern: GitHub raw.githubusercontent.com caches for up to ~5min; post-push verification polls with cachebust query param until served content matches committed content"
    - "Per-rehearsal artifact shape preserves null arweave_* fields so the same shape can be re-populated in-place if Phase 4 or a future devnet re-run enables Branch A"

key-files:
  created:
    - "scripts/assets/upload-metadata.ts (Task 1, commit ee9515b) — dual-mode upload driver"
    - "docs/runbooks/metadata-hosting.md (Task 1, commit ee9515b) — upload lifecycle runbook + Phase 4 mainnet parity"
    - "artifacts/metadata-hosting.json (Task 3, commit eb9b388) — Branch B source-of-truth; rehearsal-1 + rehearsal-2 GitHub raw URLs; arweave_deferred_reason + phase_4_mainnet_migration_required=true sentinel"
  modified:
    - "assets/metadata/rehearsal-1.json (Task 3, commit eb9b388) — image field PLACEHOLDER_REH1_ARWEAVE_URL → https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/logo-512.png"
    - "assets/metadata/rehearsal-2.json (Task 3, commit eb9b388) — image field PLACEHOLDER_REH2_ARWEAVE_URL → https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/logo-512.png"
    - "package.json (Task 1, commit ee9515b) — assets:upload-metadata script wired"
    - ".planning/phases/03-devnet-full-rehearsal/deferred-items.md (Task 3) — appended confirmation that Plan 03-01 prettier warnings still out-of-scope"

key-decisions:
  - "Branch B (GitHub raw only) selected for devnet rehearsal — zero-cost, no Solana wallet funding loop, no external bundler dependency. EXPLICITLY NOT durable enough for mainnet."
  - "Phase 4 mainnet MUST switch to Arweave before production launch — GitHub raw URL durability depends on the ultrakingdoms2025/CAYC-Solana-Contract repository remaining public and never force-pushed over the main branch. A single git push --force or repo deletion could break every mainnet wallet's image render. Arweave's permanent storage is the correct primitive for immutable-in-practice on-chain uri fields."
  - "Repo-must-be-public pivot: before Task 3 execution the repository was flipped from private to public (verified gh repo view isPrivate=false). Branch B is NOT possible on a private repo because raw.githubusercontent.com requires auth tokens for private-repo paths that wallets/explorers cannot provide."
  - "artifact schema preserves Arweave-shape fields (set to null) to allow in-place re-population by a future Branch A run (devnet re-run or Phase 4 mainnet) — no migration needed."
  - "CDN propagation is asynchronous — ~3min after push, raw.githubusercontent.com began serving the rewritten rehearsal-2.json content. Downstream plans (03-04, 03-05) must tolerate this when fetching the on-chain uri; wallets typically cache URI content more aggressively than the CDN."
  - "Plan 03-03 Task 2 checkpoint preserved in git history (commit 83ac27c) as a standalone state-record even though the resolution (Branch B) landed in the next commit."

patterns-established:
  - "Dual-mode hosting driver: single TypeScript entry point with a --github-only flag forks into two internal code paths; Arweave path requires Solana keypair + turbo-sdk + SOL top-up; GitHub path is pure node:child_process + node:fs. Both share idempotence + artifact-merge logic."
  - "Phase 4 handoff sentinel: artifact top-level fields phase_4_mainnet_migration_required=true and arweave_deferred_reason provide a grep-visible flag for Phase 4 plan authors. `jq .phase_4_mainnet_migration_required artifacts/metadata-hosting.json` returning `true` is the programmatic signal to run Branch A."

requirements-completed: []  # Plan 03-03 is infra (enables TOK-01..06 in Phase 4) — no requirements gated directly on this plan's delivery.
requirements-enabled: []

# Metrics
duration: 31min (15min active execution + checkpoint wait for user Arweave vs GitHub-only decision)
completed: 2026-04-20
checkpoint-resolved: true
arweave-deferred-to: "Phase 4 mainnet launch (DEP-04 era) — MUST be revisited before any mainnet mint transaction"
---

# Phase 3 Plan 03: Metadata Hosting (Branch B — GitHub Raw Only) Summary

**Off-chain metadata hosted at raw.githubusercontent.com for devnet rehearsal; Arweave upload driver shipped but intentionally unexercised, deferred to Phase 4 mainnet ceremony with a grep-visible migration-required sentinel in the artifact.**

## Performance

- **Duration:** ~31 min wall-clock (Task 1: ~10min; checkpoint wait for user decision; Task 3: ~5min; metadata finalization: ~5min)
- **Started:** 2026-04-20T17:28:21Z (Task 1 commit timestamp)
- **Completed:** 2026-04-20T17:59:47Z (Task 3 commit timestamp)
- **Tasks:** 3 / 3 (Task 1 auto; Task 2 checkpoint resolved; Task 3 auto Branch B)
- **Files created:** 3 (scripts/assets/upload-metadata.ts, docs/runbooks/metadata-hosting.md, artifacts/metadata-hosting.json)
- **Files modified:** 4 (assets/metadata/rehearsal-1.json, assets/metadata/rehearsal-2.json, package.json, deferred-items.md)

## Accomplishments

- **Dual-mode upload driver shipped.** `scripts/assets/upload-metadata.ts` supports both Branch A (Arweave via @ardrive/turbo-sdk, SOL-paid using devnet proposer keypair) and Branch B (--github-only, zero-cost GitHub raw mirror). The Arweave path is fully implemented and ready for Phase 4 mainnet execution — it just wasn't executed for devnet.
- **Branch B resolution executed per user decision.** Rehearsal 1 and Rehearsal 2 both had their `image` field rewritten from `PLACEHOLDER_REH{1,2}_ARWEAVE_URL` to the GitHub raw logo-512.png URL. No PLACEHOLDER strings remain in either JSON (`grep -c PLACEHOLDER_ assets/metadata/rehearsal-*.json` returns 0,0).
- **Repo-public pivot completed pre-execution.** Repository visibility was flipped from private to public (verified via `gh repo view` → `isPrivate=false`) because Branch B requires unauthenticated fetches at `raw.githubusercontent.com/<owner>/<repo>/...`. Logo image URL verified HTTP 200 before the rewrite ran.
- **Post-push live verification.** After commit `eb9b388` was pushed to origin/main, both `https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/logo-512.png` and both rehearsal JSON URLs returned HTTP 200 serving the rewritten content (after the GitHub raw CDN propagated, which took ~3min). Wallet-rendering gate in Plan 03-05 now has live URLs to fetch.
- **Phase 4 mainnet migration obligation captured in three places:** (1) artifact top-level `phase_4_mainnet_migration_required=true` + `arweave_deferred_reason` sentinel; (2) this SUMMARY's frontmatter `arweave-deferred-to` field; (3) STATE.md decisions + blockers entry (documented below).
- **docs/runbooks/metadata-hosting.md shipped.** Runbook documents both branches, when to use each, Phase 4 mainnet prerequisites (~0.05 SOL budget, mainnet proposer wallet), and the Arweave-vs-GitHub durability tradeoff explicitly.

## Task Commits

1. **Task 1: Write upload-metadata.ts driver with idempotence and artifact write** — `ee9515b` (feat)
2. **Task 2: Checkpoint — fund devnet proposer / Branch A vs B decision** — `83ac27c` (docs: checkpoint state record)
3. **Task 3: Execute uploads + write metadata-hosting.json (Branch B)** — `eb9b388` (feat)

**Plan metadata:** [final commit appended after SUMMARY + STATE + ROADMAP] (docs: complete metadata hosting plan)

## Files Created/Modified

**Created (Task 1, commit ee9515b):**

- `scripts/assets/upload-metadata.ts` — Dual-mode driver. Branch A path uses TurboFactory.authenticated + SOL payment; Branch B path uses execFileSync('git','remote','get-url','origin') to derive GitHub raw URLs from the `origin` remote. Both paths share idempotence guard + artifact merge.
- `docs/runbooks/metadata-hosting.md` — 50+ line runbook covering usage, Phase 4 mainnet parity, bundler longevity note, fallback to @irys/sdk if Turbo is deprecated.

**Modified (Task 1):**

- `package.json` — added `"assets:upload-metadata": "tsx scripts/assets/upload-metadata.ts"` script, added `@ardrive/turbo-sdk` runtime dependency.

**Created (Task 3, commit eb9b388):**

- `artifacts/metadata-hosting.json` — Branch B shape:
  - top-level: `mode: "github-only"`, `arweave_deferred_reason: "user chose GitHub-only for devnet rehearsal; Phase 4 mainnet will revisit and switch to Arweave"`, `phase_4_mainnet_migration_required: true`, `github_raw_urls` map with all 4 URLs
  - `rehearsal_1` and `rehearsal_2`: each with null arweave_* fields + populated github_raw_url + github_logo_512_url + github_logo_1024_url + uploaded_via="github-raw-only" + uploaded_at timestamp

**Modified (Task 3, commit eb9b388):**

- `assets/metadata/rehearsal-1.json` — image field PLACEHOLDER_REH1_ARWEAVE_URL → logo-512.png GitHub raw URL. Name/symbol/description/external_url/attributes unchanged ("Rehearsal 1 — Throwaway", REH1, DO-NOT-USE description).
- `assets/metadata/rehearsal-2.json` — image field PLACEHOLDER_REH2_ARWEAVE_URL → logo-512.png GitHub raw URL. Name/symbol/description unchanged (Cyber Ape Yacht Club 8G, CAYC, "Payment token for Cyber Ape Yacht Club. Squads 3-of-5 multisig.").

**Modified (Task 3, deferred-items only):**

- `.planning/phases/03-devnet-full-rehearsal/deferred-items.md` — appended Plan 03-03 Task 3 confirmation that pre-existing prettier warnings in `scripts/assets/resize-logo.ts` + `src/config/token-config.ts` (Plan 03-01 ownership) remain out-of-scope. The pre-commit hook runs prettier only on STAGED files so Plan 03-03's commits pass cleanly.

## Decisions Made

### CRITICAL — Phase 4 Mainnet MUST Revisit This Decision

**Branch B (GitHub raw only) is acceptable for devnet rehearsal ONLY.** Before the mainnet launch ceremony (Phase 4), the following MUST happen:

1. The mainnet proposer wallet must be funded with ~0.05 SOL (per the runbook).
2. `pnpm assets:upload-metadata --rehearsal 2` (omitting `--github-only`) must be re-run against the mainnet proposer keypair to upload `assets/logo-512.png`, `assets/logo-1024.png`, and `assets/metadata/rehearsal-2.json` (renamed/duplicated as `assets/metadata/launch.json`) to Arweave.
3. The on-chain TokenMetadata `uri` field at Phase 4 TOK-01..06 MUST point at `https://arweave.net/<tx-id>`, NOT the GitHub raw URL.
4. `artifacts/metadata-hosting.json` must gain a `mainnet_launch` sibling entry with real Arweave TX IDs.

**Why the hard line:**

- GitHub raw URLs depend on the `ultrakingdoms2025/CAYC-Solana-Contract` repository remaining public, never being renamed, and never having `main` force-pushed in a way that removes `assets/logo-512.png`. A single `git push --force` that drops the logo blob would break every wallet's image render for every CAYC holder, forever (the on-chain uri is immutable-in-practice; only a multisig proposal can rotate it, and rotation invalidates already-displayed caches across wallets/exchanges).
- Arweave pays once at upload time for permanent storage. Turbo SDK's Solana payment flow is ~0.01 SOL on devnet, ~0.05 SOL on mainnet per upload set. That is the cost of durability.
- GitHub is also a single SPOF (repo owner abandonment, org ban, GitHub outage). Arweave is backed by a global miner network and hundreds of replicas.

**Why GitHub raw is OK for devnet:** the devnet mint will be burned/replaced when mainnet launches; any broken image on devnet has zero production impact. Saving the ~0.01 SOL Arweave cost and the bundler-SDK debugging surface area is a rational devnet-rehearsal tradeoff. It is NOT a rational mainnet tradeoff.

### Other Decisions

- **Repo visibility flipped to public before execution.** Required by Branch B (raw.githubusercontent.com rejects anonymous fetches on private repos). Verified pre-execution via `gh repo view` → `isPrivate=false`. Phase 4 does not depend on the repo remaining public (Arweave is self-contained) but the runbook flags the current dependency.
- **Arweave-shape fields preserved as nulls in the artifact.** Rather than omit `logo_512_arweave_tx` etc., they are present with `null` so the schema is stable across branches. A future Branch A run will populate them in-place via the script's merge-on-write pattern.
- **Task 2 checkpoint preserved as a standalone commit (`83ac27c`).** The checkpoint-pause state was committed separately before user input resumed execution, providing a git-visible audit trail of where the pause happened. This is a pattern worth reusing in future long-running plans.
- **Single canonical image size per JSON.** Both rehearsal JSONs point at `logo-512.png` (not 1024). Wallet display surfaces overwhelmingly render at 64-128px logical pixels; 512 is 4x over-provisioned for retina but 1024 is bandwidth waste. The 1024 derivative is uploaded anyway for marketing/press kit usage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added top-level Branch B sentinel fields to artifact schema**

- **Found during:** Task 3 (executing Branch B uploads + verifying artifact against resume-instructions schema)
- **Issue:** The original `scripts/assets/upload-metadata.ts` Branch B path wrote only per-rehearsal entries (with `mode: "github-only"` inside each rehearsal sub-object). The resume instructions specified a top-level `mode` field, a top-level `arweave_deferred_reason` field, and a top-level `github_raw_urls` map for the Phase 4 migration sentinel. Without these, the grep-visible migration flag pattern would be weaker — Phase 4 plan authors would need to descend into each rehearsal entry to find the mode.
- **Fix:** After the script wrote the artifact with per-rehearsal entries, appended top-level fields via direct Edit: `mode: "github-only"`, `arweave_deferred_reason: "..."`, `phase_4_mainnet_migration_required: true`, and `github_raw_urls: { rehearsal_1_json, rehearsal_2_json, logo_512, logo_1024 }`. Per-rehearsal entries preserved untouched.
- **Files modified:** `artifacts/metadata-hosting.json` (post-script edit)
- **Verification:** `node -e "const a=...; console.log('mode:', a.mode, 'reason:', a.arweave_deferred_reason)"` returns the expected values; `jq .rehearsal_1` and `jq .rehearsal_2` both return populated objects unchanged.
- **Committed in:** `eb9b388` (Task 3 commit).

**2. [Rule 3 - Blocking] CDN propagation delay required post-push polling**

- **Found during:** Task 3 post-push verification (the fifth resume-instruction step)
- **Issue:** Immediately after `git push origin main`, fetching the rehearsal-2.json URL returned HTTP 200 but with the OLD content (PLACEHOLDER_REH2_ARWEAVE_URL still in the `image` field). GitHub's `raw.githubusercontent.com` serves via a CDN with a ~5min default cache TTL and does not honor Cache-Control: no-cache on request, only on response.
- **Fix:** Rather than block the plan, polled with a cachebust query-string parameter (`?v=<timestamp>`) in an until-loop until the served content contained the updated URL. Took ~1-3min for propagation. Documented this as a known GitHub raw behavior — not a bug.
- **Files modified:** None (behavioral only).
- **Verification:** Final fetch of `https://raw.githubusercontent.com/.../rehearsal-2.json?v=<bust>` returned the updated JSON with `"image": "https://raw.githubusercontent.com/.../logo-512.png"`. Same confirmed for rehearsal-1.json.
- **Committed in:** N/A (transient CDN wait; documented in this SUMMARY as a future-gotcha for Plans 03-04 / 03-05 that will fetch these URLs during rehearsal execution).

---

**Total deviations:** 2 auto-fixed (2 blocking — 1 artifact schema gap; 1 CDN propagation delay).
**Impact on plan:** Both necessary for correctness. No scope creep. The schema fix strengthens the Phase 4 migration sentinel; the CDN polling pattern is now documented for Wave 3 rehearsal executors.

### Scope Boundary — Out of Scope (Logged, Not Fixed)

- **Prettier format warnings on `scripts/assets/resize-logo.ts` and `src/config/token-config.ts`:** pre-existing from Plan 03-01. Not modified by Plan 03-03; `.husky/pre-commit` runs prettier only on staged files so these don't block. Appended entry to `deferred-items.md` confirming. Will be resolved by whichever plan next touches those files OR a one-off `chore: format-sweep` commit.

## Issues Encountered

- **GitHub raw CDN propagation delay.** After push, JSON URL served stale content (pre-rewrite PLACEHOLDER) for ~3min. Worked around with cachebust polling loop. Important for Plans 03-04 / 03-05 to note: fetch-after-commit should allow a few minutes for CDN propagation if the URI is committed same-session.
- **Pre-commit prettier warnings on non-Plan-03 files surfaced during `pnpm format:check`.** Not actionable from Plan 03-03; staged-files only pre-commit gate means these don't block Plan 03-03's commit.
- **No actual issues with the Branch B upload itself.** Script ran first-try for both rehearsals. Idempotence guard was not triggered (first run for each rehearsal).

## Phase 4 Mainnet Migration — Handoff Note

**This section exists because Branch B is a devnet-only decision that MUST be reversed before mainnet launch.**

The Phase 4 mainnet-launch plan (whichever plan creates the production mint with its TokenMetadata extension pointing at `uri`) MUST execute the following BEFORE the mainnet `initializeMint` transaction:

### Phase 4 Prerequisites (block mainnet ceremony until complete)

1. **Mainnet proposer wallet funded with ≥ 0.05 SOL** (covers 2 PNGs + 1 JSON upload + 10x safety margin).
2. **Switch to Branch A:** run `pnpm assets:upload-metadata --rehearsal 2` WITHOUT the `--github-only` flag, against a mainnet-network variant of the script (the current script hardcodes `loadEnv('devnet')`; Phase 4 needs a `--network mainnet-beta` flag OR a duplicate `scripts/assets/upload-mainnet-metadata.ts` that `loadEnv('mainnet-beta')` instead).
3. **Rename the uploaded JSON file:** the mainnet metadata should be committed as `assets/metadata/launch.json` (not `rehearsal-2.json`) with identical content. The Arweave TX IDs point at the blob, not the filename, so the script needs a `--json-path` override or a duplicate-and-rename step.
4. **Write mainnet entry in `artifacts/metadata-hosting.json`:** add a `mainnet_launch` sibling key with real Arweave TX IDs + URLs. Top-level `mode` transitions from `"github-only"` → `"arweave-primary-with-github-mirror"`. The `phase_4_mainnet_migration_required` flag can flip to `false` (or be removed).
5. **Update on-chain TokenMetadata `uri` instruction to use `https://arweave.net/<json_arweave_tx>`.** The multisig proposal MUST reference the Arweave URL, never the GitHub raw URL.

### Why this is non-negotiable for mainnet

- On-chain `uri` is immutable-in-practice. Rotating it costs a multisig proposal + 3-of-5 signer coordination + wallet cache invalidation delays of 1-24 hours across different wallet providers. You want to do it zero times in token lifetime, not every time GitHub has an outage or the repo gets renamed.
- Arweave permanence cost (~$0.10-0.50 USD at current SOL price for ~100KB total payload) is trivially cheaper than any alternative over a 5-year horizon.
- The current GitHub mirror is operated by one individual (repo owner `ultrakingdoms2025`). A single account suspension, password loss, or repo deletion breaks every wallet's image render, forever. That is unacceptable for a payment token's mainnet presence.

### Verification that Phase 4 honored this handoff

After Phase 4 mainnet ceremony completes:

- `jq -r .mode artifacts/metadata-hosting.json` → should NOT be `"github-only"`.
- `jq -r .mainnet_launch.json_arweave_url artifacts/metadata-hosting.json` → should start with `https://arweave.net/` and resolve HTTP 200.
- On-chain TokenMetadata `uri` → must match `arweave.net` URL byte-for-byte (verify via `scripts/deploy/verify-mint.ts` Phase-4-variant).

## Next Plan Readiness

**For Plan 03-04 (Rehearsal 1 — devnet extension mechanics validation):**

- `https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/metadata/rehearsal-1.json` is the on-chain `uri` to pass at `initializeTokenMetadata` CPI. Already serving HTTP 200.
- Verified body:
  ```json
  { "name": "Rehearsal 1 — Throwaway", "symbol": "REH1",
    "description": "Phase 3 Rehearsal 1 — extension mechanics validation — DO NOT USE",
    "image": "https://raw.githubusercontent.com/.../assets/logo-512.png", ... }
  ```
- Script `scripts/deploy/verify-mint.ts` from Plan 03-02 will be re-run post-mint to verify the URI was recorded correctly.

**For Plan 03-05 (Rehearsal 2 — wallet-rendering verification):**

- `https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/metadata/rehearsal-2.json` is the on-chain `uri`. Serving HTTP 200 with the CAYC launch-identical content.
- Wallet-rendering gate (Phantom, Solflare, Backpack on devnet) should fetch the URI, parse `image`, fetch the logo-512.png URL, and render as the token's image. Both URLs are verified live.
- Note the CDN propagation delay — if Plan 03-05 updates the URI within the same session, allow ~5min between push and wallet fetch.

**For Phase 4 mainnet launch (CRITICAL HANDOFF — see Phase 4 section above):**

- MUST switch to Arweave. MUST fund mainnet proposer. MUST NOT reuse the GitHub raw URLs on mainnet.
- `artifacts/metadata-hosting.json.phase_4_mainnet_migration_required === true` is the grep-visible sentinel.

**Phase-3 blockers now closed by Plan 03-03:**

- Placeholder Arweave URLs in `assets/metadata/rehearsal-{1,2}.json` — RESOLVED (both rewritten to GitHub raw URLs).
- Absence of `artifacts/metadata-hosting.json` blocking Plans 03-04 + 03-05 from knowing what URI to submit — RESOLVED (artifact exists, populated for both rehearsals, schema stable).

## Self-Check: PASSED

**Files created verified:**

- `scripts/assets/upload-metadata.ts` FOUND (committed ee9515b)
- `docs/runbooks/metadata-hosting.md` FOUND (committed ee9515b)
- `artifacts/metadata-hosting.json` FOUND (committed eb9b388)

**Files modified verified:**

- `assets/metadata/rehearsal-1.json` — image field = `https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/logo-512.png` (0 PLACEHOLDER_ strings) — VERIFIED
- `assets/metadata/rehearsal-2.json` — image field = `https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/logo-512.png` (0 PLACEHOLDER_ strings) — VERIFIED
- `package.json` — `assets:upload-metadata` script present — VERIFIED
- `.planning/phases/03-devnet-full-rehearsal/deferred-items.md` — Plan 03-03 Task 3 entry appended — VERIFIED

**Commits verified:**

- `ee9515b` FOUND: `feat(03-03): add Arweave metadata upload driver + hosting runbook`
- `83ac27c` FOUND: `docs(03-03): record Task 1 complete + pause at Task 2 checkpoint`
- `eb9b388` FOUND: `feat(03-03): complete metadata hosting via GitHub raw (Branch B, devnet-only)`

**Live URL verification (post-push, post-CDN-propagation):**

- `https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/logo-512.png` → HTTP 200 VERIFIED
- `https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/metadata/rehearsal-1.json` → HTTP 200 + image field rewritten VERIFIED
- `https://raw.githubusercontent.com/ultrakingdoms2025/CAYC-Solana-Contract/main/assets/metadata/rehearsal-2.json` → HTTP 200 + image field rewritten VERIFIED

**Pre-commit gates (Task 3 commit eb9b388):**

- gitleaks → no leaks found (59 commits scanned, 1.84 MB)
- prettier (staged-files only) → clean
- typecheck → exit 0
- lang:audit → no violations
- Husky hook fired and passed — VERIFIED

**Phase 4 migration sentinel present:**

- `jq -r .mode artifacts/metadata-hosting.json` → `"github-only"` VERIFIED
- `jq -r .phase_4_mainnet_migration_required artifacts/metadata-hosting.json` → `true` VERIFIED
- `jq -r .arweave_deferred_reason artifacts/metadata-hosting.json` → populated string VERIFIED

---

_Phase: 03-devnet-full-rehearsal_
_Plan: 03_
_Completed: 2026-04-20_
_Branch selected: B (GitHub raw only — devnet rehearsal only)_
_Arweave-deferred-to: Phase 4 mainnet launch (MUST revisit)_
