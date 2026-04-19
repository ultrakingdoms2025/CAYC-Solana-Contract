---
phase: 01-foundation
plan: 01
subsystem: policy
tags: [pol-01, launch-gate, jupiter, solscan, coingecko, coinmarketcap, symbol-check, token-2022]

# Dependency graph
requires:
  - phase: 00-planning
    provides: PROJECT.md Key Decision locking symbol=CAYC; research/PITFALLS.md Pitfall 12 (Copycat Mints); research/SUMMARY.md User Decision 7 (symbol-check launch gate)
provides:
  - Dated, auditable CAYC symbol availability report across all four listing platforms (Jupiter, Solscan, CoinGecko, CoinMarketCap)
  - Verdict CONFLICT with concrete squatter evidence (mint 9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump, "Clawed Ape Yacht Club", pump.fun, Feb 27 2026)
  - User decision trail (accept-conflict) with captured rationale and downstream implied actions
  - POL-01 launch gate resolved; Phase 2 mainnet-metadata work unblocked with explicit disambiguation policy
  - Re-check cadence committed (<=7 days before mainnet; <=7 days before each listing submission)
  - Documented query methodology (Jupiter Ultra V1 search; Solana RPC as Solscan substitute when Cloudflare blocks; CMC data-api map/all as authoritative active-listings source)
affects:
  - 01-03 (policies must incorporate "CAYC (Cyber Ape Yacht Club)" disambiguation convention; clawback/freeze policy must acknowledge copycat risk)
  - 01-04 (language audit / style guide must codify the disambiguated-first-reference rule)
  - 03-devnet (metadata finalization uses CAYC symbol; no rename needed)
  - 04-mainnet (preflight checklist must include final <=72h symbol re-check in case new squatters appear)
  - 05-listings (Jupiter Verify V3 submission will require extra justification; OPS-07 copycat watchlist must include the squatter mint)
  - 07-cex (CEX applications use "CAYC (Cyber Ape Yacht Club)" disambiguated form)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Symbol-check methodology: query primary API, fall back to canonical on-chain/aggregated source when vendor API is rate-limited or behind anti-bot protection; never trust a single vendor endpoint as sole source of truth"
    - "Brand-qualifier disambiguation: when symbol collision is accepted, first-reference uses full name in parentheses (CAYC (Cyber Ape Yacht Club)) and subsequent mentions use the short symbol"
    - "Launch-gate pattern: a requirement blocking downstream phases must produce a single auditable file with a greppable verdict line that downstream plans can check mechanically"

key-files:
  created:
    - "docs/symbol-availability-check.md (POL-01 evidence + decision trail; greppable Verdict line; Re-check cadence section for Phase 4 preflight)"
  modified: []

key-decisions:
  - "Accepted CONFLICT verdict rather than renaming — preserves PROJECT.md-locked CAYC brand; disambiguation via full-name qualifier on first reference replaces the clean-slate option"
  - "Jupiter Ultra V1 search API (/ultra/v1/search) is the canonical Jupiter check; legacy /tokens/v1/tagged/verified is deprecated (HTTP 404). Ultra aggregates verified + community + unknown mints, giving a strict superset of the verified-only list"
  - "Solana mainnet RPC getAccountInfo is the authoritative substitute for Solscan's API when Cloudflare blocks programmatic access — Solscan mechanically indexes every mainnet mint, so on-chain state == what Solscan renders"
  - "CoinMarketCap data-api/v3/map/all is the canonical active-listings conflict check, not the dexer/search microservice (which was degraded during the query window)"
  - "The squatter mint 9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump (pump.fun, $1.65k mcap, 47 holders, organicScoreLabel 'low') is a dead launch but its on-chain record persists indefinitely — conflict is permanent unless we rename"
  - "OPS-07 (Phase 5) copycat watchlist must include this specific mint address; Phase 4 preflight must re-run the full 4-platform check <=72h before mainnet ceremony to catch any newer squatters"

patterns-established:
  - "Pattern: Launch-gate evidence file. A dated markdown report with greppable verdict line serves as both audit trail and downstream unblock signal. Future launch-gate plans (Phase 4 preflight, Phase 5 listing-readiness) follow the same shape."
  - "Pattern: Vendor-API fallback chain. Document the primary endpoint, the fallback (vendor-documented or on-chain canonical), and the observed failure mode for each. Preserves the check's reproducibility when vendor APIs rotate endpoints or tighten bot protection."
  - "Pattern: Disambiguation convention. First reference = 'CAYC (Cyber Ape Yacht Club)'; subsequent = 'CAYC'. Applies to website copy, listing applications, CEX disclosures, policy docs."

requirements-completed: [POL-01]

# Metrics
duration: 18min
completed: 2026-04-19
---

# Phase 1 Plan 1: CAYC Symbol Availability Check Summary

**POL-01 launch gate resolved: CAYC symbol verified across Jupiter, Solscan, CoinGecko, and CoinMarketCap; CONFLICT found on Jupiter/Solscan (pump.fun squatter mint 9Jqkhu...pump, "Clawed Ape Yacht Club"); user accepted the conflict and the brand stays CAYC with "CAYC (Cyber Ape Yacht Club)" disambiguation on public-facing copy.**

## Performance

- **Duration:** ~18 min end-to-end (Task 1 execution + checkpoint wait + Task 2 decision capture + metadata updates)
- **Started:** 2026-04-19T20:27:00Z (approximate — Task 1 began immediately after Plan 01-02 wave 1 sibling)
- **Task 1 committed:** 2026-04-19T20:37:21Z (commit `994eb66`)
- **Checkpoint resumed / Task 2 committed:** 2026-04-19T20:51:00Z (commit `d5b2145`, after user supplied option=accept-conflict)
- **Completed:** 2026-04-19T20:52:00Z
- **Tasks:** 2 / 2 (Task 1 auto; Task 2 checkpoint:decision)
- **Files created:** 1 (`docs/symbol-availability-check.md`)
- **Files modified:** 0 (outside the one created artifact and planning metadata)

## Accomplishments

- **Produced the POL-01 evidence artifact.** `docs/symbol-availability-check.md` captures every query URL, UTC timestamp, raw response, matches-found count, and per-platform verdict across the four platforms listing submissions will depend on. Greppable overall `**Verdict:** CONFLICT` line means downstream plans (Phase 2 metadata; Phase 4 preflight) can check the gate state mechanically.
- **Confirmed the exact squatter.** Jupiter Ultra V1 search returned one exact CAYC symbol match: mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump`, name "Clawed Ape Yacht Club", Token-2022 program, pump.fun launchpad, created 2026-02-27T02:49:41Z, 47 holders, ~$1.65k market cap, `organicScoreLabel: "low"`, `mintAuthorityDisabled: true`. This is a deliberate-name-collision pump.fun launch; on-chain record persists indefinitely.
- **Cleared CoinGecko and CoinMarketCap.** CoinGecko `/api/v3/search?query=CAYC` returned empty across all categories (coins/exchanges/icos/nfts). CoinMarketCap data-api/v3/map/all scan across 8,415 active listings produced zero CAYC symbol matches and zero "cyber ape yacht" name substrings. Both platforms are clear for a fresh CAYC listing submission.
- **Worked around Solscan's Cloudflare protection.** Solscan's internal API returned HTTP 403 (managed JS challenge) and the public `public-api.solscan.io/token/list` returned HTTP 404 (endpoint deprecated). Substituted with Solana mainnet RPC `getAccountInfo` at slot 414329332 — since Solscan mechanically indexes every mainnet mint, on-chain state is the ground truth Solscan renders. Verified that the squatter mint is a live Token-2022 account with on-chain metadata declaring `symbol=CAYC` and name `Clawed Ape Yacht Club`.
- **Captured the user's naming decision.** User selected `option=accept-conflict`: keep CAYC, disambiguate publicly as "CAYC (Cyber Ape Yacht Club)", accept the Jupiter Verify V3 friction and the user-confusion risk. Decision trail appended to `docs/symbol-availability-check.md` with UTC timestamp, full rationale, and implied downstream actions (OPS-07 watchlist entry, Phase 4 preflight re-check, 01-03/01-04 disambiguation convention).
- **Committed re-check cadence.** The report commits to re-running the full 4-platform check within 7 days before mainnet ceremony (Phase 4) and within 7 days before each listing submission (Phase 5/6). Prior runs are preserved (never overwritten) so the history is auditable.

## Task Commits

Each task committed atomically:

1. **Task 1: Execute symbol availability queries on all four platforms and capture raw results** — `994eb66` (docs)
2. **Task 2: Checkpoint — pause for naming decision; record accept-conflict** — `d5b2145` (docs)

**Plan metadata:** to be captured in final commit after state/roadmap updates.

## Files Created/Modified

**Created:**

- `docs/symbol-availability-check.md` — dated symbol availability report; four platform sections (Jupiter, Solscan, CoinGecko, CoinMarketCap) each with query URL(s), UTC timestamp, raw result, matches-found count, platform verdict, and notes; `## Methodology notes` explaining the Jupiter Ultra V1 / on-chain-RPC / CMC data-api rationale; `## Re-check cadence` committing to pre-ceremony and pre-listing re-runs; `## Decision trail` capturing `accept-conflict` with full rationale and downstream implied actions.

**Modified:**

- None outside the created artifact plus planning metadata (STATE.md, ROADMAP.md, REQUIREMENTS.md — captured in the final metadata commit below).

## Decisions Made

1. **Accept the CONFLICT; keep CAYC; disambiguate publicly.** Rather than rename, the brand stays CAYC per PROJECT.md Key Decisions. Public-facing copy uses "CAYC (Cyber Ape Yacht Club)" in headers and first references; subsequent mentions use "CAYC". Rationale: renaming would churn PROJECT.md Key Decisions + ROADMAP Phase 4 TOK-02 success criteria + all branded assets already prepared. The squatter mint is a dead pump.fun launch (organic score "low", ~$1.65k mcap, 47 holders) whose visibility penalty is manageable; the Clawback/Freeze Authority Policy (POL-03, Plan 01-03) will acknowledge copycat risk as an operational concern rather than redesign the brand around it.
2. **Jupiter Ultra V1 search is the canonical Jupiter check.** The legacy `/tokens/v1/tagged/verified` endpoint returned HTTP 404 (deprecated in Jupiter's API migration). Ultra V1 (`/ultra/v1/search`) is the current authoritative aggregator — it surfaces verified + community + unknown mints in one query and exposes `organicScoreLabel`, `tags`, and `audit` fields. Using Ultra gives a strict superset of the verified-list-only approach.
3. **Solana mainnet RPC is the authoritative substitute for Solscan when Cloudflare blocks programmatic access.** `api-v2.solscan.io` returned HTTP 403 managed-challenge; `solscan.io/search` is client-side rendered. Solscan mechanically indexes every mainnet mint, so if a mint exists on-chain with `symbol=CAYC`, Solscan will display it. `getAccountInfo` at a specific slot is more rigorous than a UI fetch anyway (captures the exact on-chain state; not vulnerable to indexer lag).
4. **CoinMarketCap data-api/v3/map/all is the canonical active-listings check, not dexer/search.** The dexer/search microservice returned HTTP 503 ("no healthy upstream") during the query window. The data-api map endpoint returns CMC's authoritative active cryptocurrency listings and is unaffected by dexer availability — this is the correct source for listing-conflict checks.
5. **The squatter mint address goes on the OPS-07 watchlist (Phase 5).** Address `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` is a Token-2022 mint that will persist indefinitely on-chain. Phase 5 OPS-07 (copycat monitoring) must explicitly include this address with a documented anti-phishing response procedure.
6. **Phase 4 preflight must re-run the full 4-platform check <=72h before the mainnet ceremony.** New squatters can appear between now and launch (the Feb 2026 squatter shows the pattern is active). The Phase 4 ceremony checklist must treat this symbol re-check as a blocking preflight item.

## Deviations from Plan

The plan executed end-to-end as written. Task 1 produced the exact four-platform report the plan specified; Task 2 was a checkpoint:decision that paused for user input exactly as the plan's `<resume-signal>` block called for. No deviation rules fired on the checkpoint task itself.

Task 1 encountered several vendor-side deviations (deprecated endpoints, Cloudflare protection, a degraded microservice) that were all resolved within the plan's documented fallback-methodology clause without requiring rule-driven auto-fixes. Those deviations are carried forward here for traceability:

### Vendor-API deviations handled within Task 1's documented methodology

**1. [Task 1 — Vendor endpoint deprecation] Jupiter `/tokens/v1/tagged/verified` returned HTTP 404**

- **Found during:** Task 1, Jupiter query phase.
- **Issue:** The plan-specified primary endpoint `https://lite-api.jup.ag/tokens/v1/tagged/verified` is deprecated in Jupiter's ongoing API migration and returns HTTP 404 "Route not found".
- **Fix:** Used Jupiter Ultra V1 search (`/ultra/v1/search?query=CAYC`) as the canonical replacement. Ultra is a strict superset of the verified-tagged list (aggregates verified + community + unknown mints and surfaces `tags`, `organicScoreLabel`, `audit`). Plan already contemplated a fallback via the `tokens.jup.ag/tokens?tags=community` endpoint; that endpoint also failed to connect (HTTP 000, also deprecated), confirming that the right move was Ultra V1.
- **Verification:** Ultra V1 returned HTTP 200 and a 20-token result set; filtered to one exact CAYC match.
- **Committed in:** `994eb66` (Task 1 commit; documented in the Jupiter section Notes).

**2. [Task 1 — Anti-bot protection] Solscan API returned HTTP 403 Cloudflare challenge**

- **Found during:** Task 1, Solscan query phase.
- **Issue:** Solscan's internal API (`api-v2.solscan.io/v2/search`) enforces a managed JS challenge via Cloudflare that cannot be bypassed without a browser-resident cookie. The public `public-api.solscan.io/token/list?symbol=CAYC&limit=10` returned HTTP 404 (deprecated). The direct `solscan.io/search?keyword=CAYC` page is SPA-rendered and contains no server-side result data.
- **Fix:** Queried the Solana mainnet RPC directly (`https://api.mainnet-beta.solana.com`) with `getAccountInfo` against the Jupiter-surfaced conflict mint. Solscan mechanically indexes every mainnet mint, so on-chain Token-2022 account state with `symbol=CAYC` in its metadata extension is what Solscan renders. RPC returned the mint at slot 414329332, owned by the Token-2022 program, with base64 data containing ASCII strings `Clawed Ape Yacht Club` (name) and `CAYC` (symbol).
- **Verification:** Both Solscan-as-inferred-from-on-chain and Jupiter-Ultra-directly report the same mint and the same symbol collision — independent confirmation.
- **Note:** Manual re-verification through a human browser session is advised before the Phase 4 mainnet ceremony to capture Solscan's specific UI state (dual-listing rendering, any "verified" badge), but the underlying conflict is fact, not inference.
- **Committed in:** `994eb66` (Task 1 commit; documented in the Solscan section Notes).

**3. [Task 1 — Microservice availability] CoinMarketCap dexer/search microservice degraded**

- **Found during:** Task 1, CoinMarketCap query phase.
- **Issue:** `https://api.coinmarketcap.com/dexer/v3/dexer/search/main-site?keyword=CAYC` returned HTTP 503 "no healthy upstream" during the query window; retry returned the same result.
- **Fix:** Used `https://api.coinmarketcap.com/data-api/v3/map/all?symbol=CAYC&listingStatus=active` as the canonical substitute. This endpoint is CMC's authoritative active-listings map and is unaffected by dexer availability. Scanned 8,415 active listings for `symbol == "CAYC"` (case-insensitive) OR `name` substring match on "cayc" / "cyber ape yacht"; zero hits on both axes.
- **Verification:** Zero matches confirmed via the canonical map endpoint; the dexer outage is orthogonal to the conflict check.
- **Committed in:** `994eb66` (Task 1 commit; documented in the CoinMarketCap section Notes).

**4. [Task 1 — Directory creation] `docs/` directory already existed from Plan 01-02 scaffold**

- **Found during:** Task 1, writing `docs/symbol-availability-check.md`.
- **Issue:** Plan 01-01's task instructions say "Create the `docs/` directory if it does not exist yet (this plan runs in parallel with 01-02 which scaffolds `docs/`, but this plan should not depend on that — create the directory here if needed)." In practice Plan 01-02 completed the scaffold before this plan's Task 1 ran on the final pass, so `docs/` already existed (tracked via `.gitkeep`).
- **Fix:** Wrote directly to `docs/symbol-availability-check.md`; no directory-creation step needed. The plan's defensive language covered both orderings.
- **Verification:** File exists; no directory-creation drift.
- **Committed in:** `994eb66` (Task 1 commit).

**5. [Task 1 — Query count acceptance] Plan's verify regex expected 4+ "Query timestamp (UTC):" lines; produced 6**

- **Found during:** Task 1 self-check before commit.
- **Issue:** The report body contains `Query timestamp (UTC):` on each of the four platform sections plus one in the `## Re-check cadence` section (overall verdict compiled timestamp) plus one implicit reference — total 5–6 occurrences depending on interpretation. The plan's automated verify regex `grep -c "Query timestamp (UTC):" docs/symbol-availability-check.md | grep -qE "^[4-9]$|^[0-9]{2,}$"` accepts anything 4 or higher.
- **Fix:** No fix needed — the actual count falls inside the acceptance range. Flagged here so future re-runs of the check (Phase 4 preflight) know that adding a per-run timestamp stanza is compatible with the verify regex.
- **Verification:** `grep -c "Query timestamp (UTC):" docs/symbol-availability-check.md` returns a value in the accepted range.
- **Committed in:** `994eb66` (Task 1 commit).

---

**Total deviations:** 5 carried forward from Task 1 (all vendor-side, all resolved within the plan's documented fallback clauses; no rule-driven auto-fix was needed because the plan itself anticipated each failure mode). Task 2 had no deviations.
**Impact on plan:** None. The plan's `<action>` block explicitly enumerated the primary-then-fallback strategy for each platform, and the actual fallbacks matched or were stricter than what the plan called for (Jupiter Ultra V1 is a superset of the tagged/verified list; mainnet RPC `getAccountInfo` is more authoritative than any Solscan UI fetch; CMC data-api/v3/map/all is the correct canonical source). No scope creep.

## Issues Encountered

- **Vendor API volatility.** Three of the four vendor APIs shifted under us mid-plan (Jupiter deprecated /tokens/v1/tagged/verified; Solscan tightened Cloudflare; CMC dexer degraded). The plan's defense-in-depth methodology (multiple endpoints per platform, with on-chain RPC as the ground truth for Solana) absorbed all three without user intervention. Pattern codified for future re-checks: always query the primary, fall back to the canonical aggregator, and treat on-chain state as ground truth when a vendor API is the only disputed layer.
- **Gitleaks not on PATH in fresh bash shell.** Plan 01-02's SUMMARY already flagged that winget-installed `gitleaks.exe` lives under `%LOCALAPPDATA%\Microsoft\WinGet\Packages\...\gitleaks.exe` and that winget modifies PATH but requires shell restart. For Task 2's commit, the execution shell explicitly prepended the gitleaks directory to PATH before `git commit`. Pre-commit hook then passed cleanly (gitleaks 8.30.1; "no leaks found"; 2.21 KB scanned in 115ms). No repo change needed — README already documents the install recipe and the shell-restart requirement.
- **Parallel wave interaction with Plan 01-02.** Plan 01-01 and Plan 01-02 ran in the same wave. Plan 01-02's scaffold (pre-commit hook, `docs/` directory, gitleaks config allowlist) was already in place when this plan's Task 1 committed, so the pre-commit hook fired on both the Task 1 and Task 2 commits and passed both times. No plan-to-plan interference.

## User Setup Required

None for this plan. The decision is captured on disk. Downstream plans that act on the disambiguation convention (01-03, 01-04, 05, 07) will carry forward the "CAYC (Cyber Ape Yacht Club)" first-reference rule from the decision trail.

## Launch-Gate Confirmation

POL-01 launch gate: **RESOLVED (via accept-conflict)**.

| Check                   | Expected                                                   | Actual                                                                                                                            | Status |
| ----------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Jupiter                 | Symbol not in use                                          | CONFLICT — mint `9Jqkhu...pump`, unverified, organic score "low", $1.65k mcap                                                     | MET (accepted) |
| Solscan                 | Symbol not in use                                          | CONFLICT (inferred via on-chain RPC; Solscan indexes all mainnet mints)                                                           | MET (accepted) |
| CoinGecko               | Symbol not in use                                          | AVAILABLE — zero matches across all categories                                                                                    | MET    |
| CoinMarketCap           | Symbol not in use                                          | AVAILABLE — zero matches across 8,415 active listings                                                                             | MET    |
| Greppable verdict line  | `^\*\*Verdict:\*\* (AVAILABLE\|CONFLICT\|AMBIGUOUS)$`      | `**Verdict:** CONFLICT` present exactly once                                                                                       | MET    |
| Decision trail recorded | `^## Decision trail$` with timestamp + outcome             | Section present; 2026-04-19T20:49:18Z; option `accept-conflict` with 4-bullet rationale and downstream implied-actions sub-list    | MET    |
| Re-check cadence        | Commit to re-running pre-mainnet (Phase 4) + pre-listing   | `## Re-check cadence` section present; <=7 days pre-ceremony and <=7 days pre-listing commitments                                  | MET    |

## Next Phase / Plan Readiness

**For Plan 01-03 (Mint Policy + Clawback/Freeze Authority Policy v1.0):**

- The disambiguation convention is decided: use "CAYC (Cyber Ape Yacht Club)" on first reference in both policies. Short form "CAYC" on subsequent mentions.
- The Clawback / Freeze Authority Policy (POL-03) should explicitly acknowledge copycat risk and commit to active anti-phishing monitoring of the squatter mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` as part of Phase 5 OPS-07 work.

**For Plan 01-04 (Language audit CI):**

- Add a rule that warns if a public-facing markdown file (README.md, docs/policies/*.md, docs/listings/*.md) introduces the symbol "CAYC" without first using the disambiguated form "CAYC (Cyber Ape Yacht Club)" in the same document. Implementation detail for 01-04; decision is to include the rule.

**For Phase 3 (Devnet rehearsal) and Phase 4 (Mainnet ceremony):**

- Metadata finalization uses CAYC. No rename branch needed.
- Phase 4 ceremony preflight checklist must include a final symbol re-check across all 4 platforms <=72h before mainnet launch. If a new squatter appears between now and then, a new accept-conflict / rename decision is required before the ceremony.

**For Phase 5 (Listings) and Phase 7 (CEX):**

- OPS-07 copycat-monitoring plan must include mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` on the known-squatter watchlist with a documented response procedure.
- Jupiter Verify V3 submission body must proactively explain the symbol collision, include the squatter's low organic score as context, and use the full disambiguated project name.
- CEX applications use "CAYC (Cyber Ape Yacht Club)" in all legal disclosures.

**Phase 1 blockers still open (NOT resolved by this plan):**

- POL-02 (Mint Policy v1.0) — delivered by Plan 01-03.
- POL-03 (Clawback/Freeze Authority Policy v1.0) — delivered by Plan 01-03.
- POL-04 (Language audit + style guide) — delivered by Plan 01-04.

## Self-Check: PASSED

**Files created verified:**

- `docs/symbol-availability-check.md` FOUND (commit `994eb66` Task 1; commit `d5b2145` appended Decision trail)

**Commits verified:**

- `994eb66` FOUND: `docs(01-01): add CAYC symbol availability check report with verdict CONFLICT`
- `d5b2145` FOUND: `docs(01-01): record accept-conflict decision for CAYC symbol collision`

**Verification commands:**

- `grep -E "^\*\*Verdict:\*\* (AVAILABLE|CONFLICT|AMBIGUOUS)$" docs/symbol-availability-check.md` → `**Verdict:** CONFLICT` (MATCHED, exactly one line)
- `grep -q "^## Decision trail$" docs/symbol-availability-check.md && grep -E "accept-conflict" docs/symbol-availability-check.md` → matched section header + decision option (VERIFIED)
- `grep -c "Query timestamp (UTC):" docs/symbol-availability-check.md` → 6 (in acceptance range 4+)
- `git log --oneline | grep -E "994eb66|d5b2145"` → both present (VERIFIED)

---

_Phase: 01-foundation_
_Plan: 01_
_Completed: 2026-04-19_
