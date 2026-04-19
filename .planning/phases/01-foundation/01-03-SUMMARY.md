---
phase: 01-foundation
plan: 03
subsystem: policy
tags: [pol-02, pol-03, mint-policy, clawback-policy, freeze-authority, permanent-delegate, squads, token-2022, genius-act, mica]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: docs/policies/ scaffolded directory (Plan 01-02); accept-conflict decision + "CAYC (Cyber Ape Yacht Club)" disambiguation convention + squatter mint address for watchlist (Plan 01-01)
provides:
  - Mint Policy v1.0 draft (POL-02) at `docs/policies/mint-policy.md` — full clause-level text covering authority model, 500M genesis, 48-hour pre-announcement gate, multisig-discipline time-lock, forbidden uses, signer accountability, version history, public contact, GENIUS-Act/MiCA legal-posture disclaimer
  - Clawback & Freeze Authority Policy v1.0 draft (POL-03) at `docs/policies/clawback-freeze-policy.md` — narrow permitted-use scope (lawful orders + documented theft/scam recovery only), 7-step approval procedure, target-address integrity checks, 24/48/72-hour recourse SLAs, Freeze Transparency Log commitment, forbidden uses, legal-posture disclaimer, copycat/OPS-07 acknowledgement
  - Policies index at `docs/policies/README.md` linking both policies with status/version columns and indexing scope, versioning rules, publication targets, contact addresses
  - Cross-references between the two policies (Mint Policy §9 → clawback-freeze-policy.md; Clawback/Freeze Policy §11 → mint-policy.md)
  - Copycat mint acknowledgement (§15 of Clawback/Freeze Policy) that explicitly names squatter `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` and commits to Phase 5 OPS-07 monitoring, canonical-address discipline, and ≤72h mainnet-ceremony preflight re-check
  - Ready-for-allowlist signal for Plan 01-04: the two policy files contain "stablecoin" intentionally (Mint Policy §12 and Clawback/Freeze Policy §14 Legal-posture disclaimers); POL-04 language audit must allowlist these two files
  - Ready-for-publication signal for Phase 5 Ops Go-Live: `docs/policies/*.md` are the Markdown source of truth; Phase 5 website Publication tasks render these files under `caycsolana.com/policies/*`
affects:
  - 01-04 (language audit must (a) allowlist the two intentional "stablecoin" occurrences in Legal-posture disclaimer sections and (b) enforce the "CAYC (Cyber Ape Yacht Club)" first-reference rule against public markdown)
  - 05-listings (proactive outreach to Jupiter / Phantom / RugCheck quotes these policy files verbatim; OPS-07 inherits the copycat acknowledgement + squatter mint address from §15)
  - 05-ops (Operations Runbook implements these policies procedurally; Freeze Transparency Log lives at `docs/security/freeze-transparency-log.md` per policy §8)
  - 07-cex (every CEX listing application includes both policy files as attachments)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Authority-policy pattern: every retained-authority Token-2022 mint publishes a narrow-scope policy document BEFORE mainnet — covers permitted uses, forbidden uses, approval procedure, user recourse, transparency commitment, legal posture. Mitigates Pitfall 3 (Permanent Delegate + retained freeze without published policy) and Pitfall 8 (unexpected mints destroy trust)."
    - "48-hour pre-announcement gate: mint authority retained but every mint must publish rationale memo 48h before Squads proposal creation; multisig discipline enforces the window until an on-chain time-lock migration (v2+). Substitutes transparency for a hard cap."
    - "Target-address integrity on freeze/clawback: target account named twice in the Squads proposal (title + description) with character-by-character match; one account per proposal (no batching); verification artifact committed to `docs/security/incidents/{ticket-id}.md`. Mitigates historical copy-paste freeze incidents."
    - "Freeze Transparency Log: public append-only log with strict entry schema (ticket ID, UTC timestamp, reason category from fixed enum, tx signatures, target account, affected owner wallet, amount, resolution status, explicit redaction markers)."
    - "Recourse SLA: 24h initial response (business), 48h (weekend), 72h resolution. Public commitment, not a legal guarantee."
    - "Disambiguation convention applied (first reference): 'CAYC (Cyber Ape Yacht Club 8G)' in each policy's Applies-to line; subsequent mentions use 'CAYC'. Inherits from Plan 01-01 accept-conflict decision."

key-files:
  created:
    - "docs/policies/mint-policy.md (107 lines; 12 sections; v1.0 draft; POL-02 deliverable)"
    - "docs/policies/clawback-freeze-policy.md (152 lines; 15 sections; v1.0 draft; POL-03 deliverable; includes §15 copycat-mint acknowledgement)"
    - "docs/policies/README.md (53 lines; policy index with status/version table; cross-links to both policies and to symbol-availability-check.md)"
  modified: []

key-decisions:
  - "Mint Policy §5 uses multisig-discipline time-lock (not an on-chain timelock program) because CAYC has no custom on-chain program at launch; v2+ may migrate to Squads v4's native execution-delay or a dedicated timelock program, requiring 14-day public notice per §11."
  - "Mint Policy §6 requires pre-announcement on ALL FIVE canonical channels (website, repo, X/Twitter, Discord, Telegram) within the same 10-minute window — proof of simultaneity via screenshot archive committed to the repo. A mint proposal announced on fewer than five channels is treated as suspicious, not legitimate."
  - "Clawback/Freeze Policy §3 keeps Freeze authority permitted-use scope strictly to (a) verifiable lawful orders and (b) documented theft/scam recovery meeting three hard criteria (filed report + unmoved thief funds + meaningful protection). No other bases."
  - "Clawback/Freeze Policy §4 makes Permanent Delegate use strictly narrower than Freeze use: always implies a prior Freeze action AND a written legal-counsel review. No standalone PD invocation is permitted by this policy."
  - "Clawback/Freeze Policy §6 mandates the single-account-per-proposal rule (batched freezes prohibited). Historical catastrophic freezes in other protocols traced to copy-paste errors in batched operations — this policy refuses to batch on principle, making every freeze an individual, auditable decision."
  - "Clawback/Freeze Policy §15 names the squatter mint 9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump explicitly and commits to OPS-07 monitoring. The multisig has no authority over the squatter (it is unrelated), so remedies are limited to ecosystem-level coordination (Jupiter, Phantom, RugCheck, Solscan), public warnings, and takedown requests."
  - "README table uses full descriptive link text ('Mint Policy', 'Clawback & Freeze Authority Policy') rather than filename text so the plan's `key_links.pattern` regex (requires 'Mint Policy' literal inside the markdown link) matches. Filename-as-link-text would have failed the link-integrity acceptance criterion."
  - "Prettier reformatting (table column alignment + `_italic_` delimiter) applied to all three files; bundled into Task 2's commit because the mint-policy changes were cosmetic-only and generated by the same plan's format pass. format:check passes clean after."

patterns-established:
  - "Legal-posture disclaimer placement: ALWAYS the final numbered section of any on-chain authority policy. Both policies carry a dedicated 'Legal posture (reminder)' section invoking GENIUS Act + MiCA non-classification. These are the ONLY places 'stablecoin' appears in these files and must be allowlisted by the Plan 01-04 language audit."
  - "Policy version-history as a Markdown table: columns Version | Date | Summary of changes | Changed by. Every change adds a row; editorial patch version for typos, minor version for substantive changes (14-day public notice), major for scope broadening (14-day notice + rationale memo)."
  - "Amendment-procedure transparency: substantive policy changes require 14-day pre-effective public notice on all five canonical channels (same channels as mint pre-announcements). Editorial changes are immediate but logged in version history."

requirements-completed: [POL-02, POL-03]

# Metrics
duration: 7 min
completed: 2026-04-19
---

# Phase 1 Plan 3: Mint Policy and Clawback/Freeze Authority Policy Summary

**Two v1.0 public-policy drafts shipped: Mint Policy (48-hour pre-announcement gate, multisig-discipline time-lock, GENIUS-Act legal posture) and Clawback/Freeze Authority Policy (narrow lawful-order + theft-recovery scope, 7-step approval, Freeze Transparency Log, 24/48/72-hour recourse SLAs, explicit copycat/OPS-07 acknowledgement naming the squatter mint).**

## Performance

- **Duration:** 7 min end-to-end (file drafting + prettier reconciliation + both atomic commits)
- **Started:** 2026-04-19T21:00:15Z
- **Task 1 committed:** 2026-04-19T21:02:00Z (commit `1a3c23d`)
- **Task 2 committed:** 2026-04-19T21:07:00Z (commit `0f544ea`, includes prettier reformat of Task 1 output)
- **Completed:** 2026-04-19T21:07:47Z
- **Tasks:** 2 / 2 (both `type="auto"`, no checkpoints)
- **Files created:** 3 (`docs/policies/mint-policy.md`, `docs/policies/clawback-freeze-policy.md`, `docs/policies/README.md`)
- **Files modified:** 0 outside the three policy files this plan created

## Accomplishments

- **POL-02 deliverable shipped.** `docs/policies/mint-policy.md` is a 107-line v1.0 draft covering all 12 sections the plan requires: authority model (Squads v4 vault PDA, 3-of-5 minimum threshold, hardware-wallet signers, Token-2022 program ID pinned), supply at genesis (500M CAYC, 6 decimals, uncapped mint authority), the five-condition mint gate (public rationale memo, named amount + recipient, 48-hour window elapsed, multisig threshold met, post-mint report within 1h), multisig-discipline time-lock, five canonical pre-announcement channels, forbidden uses, signer accountability, relationship to other policies, public contact (policy@caycsolana.com), version history, GENIUS-Act/MiCA legal-posture disclaimer.
- **POL-03 deliverable shipped.** `docs/policies/clawback-freeze-policy.md` is a 152-line v1.0 draft covering all 14 plan-required sections plus a §15 addendum mandated by the orchestrator's Wave 1 inheritance brief (copycat mint acknowledgement + OPS-07 commitment). Defines narrow permitted-use scope (lawful orders + documented theft/scam recovery only), the 7-step approval procedure (intake → two-signer evidence review → legal counsel review → Squads proposal → threshold vote → on-chain execution → Transparency Log entry within 24h), target-address integrity requirements (named twice, one account per proposal, verification artifact committed), user recourse SLAs (24h/48h/72h), Freeze Transparency Log schema, forbidden uses (censorship, competitive interference, private-party disputes, price management, retaliation, emergency bypass), signer accountability, amendment procedure (14-day notice for substantive changes), public contact (compliance@caycsolana.com), version history, legal-posture disclaimer.
- **Policy index written and linked.** `docs/policies/README.md` is a 53-line index with a status/version/file table, scope + out-of-scope sections, versioning semantics, publication targets (caycsolana.com/policies/* at Phase 5 Ops Go-Live), contact addresses, and cross-references to `../symbol-availability-check.md` (POL-01) and the forthcoming `../style-guide.md` (POL-04).
- **Cross-references between the two policies verified.** Mint Policy §9 links to `./clawback-freeze-policy.md`; Clawback/Freeze Policy §11 links to `./mint-policy.md`. Both resolve correctly and are grep-verified.
- **Wave 1 disambiguation convention applied.** Both policies use "CAYC (Cyber Ape Yacht Club 8G)" in their "Applies to" line as the disambiguated first reference (per Plan 01-01 accept-conflict decision); subsequent mentions use "CAYC" short form.
- **Copycat-mint risk surfaced in policy text.** Clawback/Freeze Policy §15 explicitly names the squatter mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump`, acknowledges the phishing/user-confusion risk, and commits the multisig operator to (1) active OPS-07 monitoring in Phase 5, (2) canonical-address publication discipline, (3) the principled non-use of Freeze/PD against unrelated copycat mints (outside CAYC control surface), and (4) a ≤72h pre-ceremony symbol re-check before mainnet launch.
- **`pnpm format:check` passes.** All three new policy files formatted to Prettier's markdown style; no outstanding format warnings repo-wide.
- **`pnpm gitleaks` passes.** 17 commits scanned (full git history since repo init); no leaks found. New policy text contains no secret-shaped content.

## Task Commits

Each task committed atomically:

1. **Task 1: Draft Mint Policy v1.0 (POL-02)** — `1a3c23d` (docs)
2. **Task 2: Draft Clawback/Freeze Authority Policy v1.0 + policies index README** — `0f544ea` (docs; also includes Prettier reformat of mint-policy.md table alignment and italic delimiters from the same format pass)

**Plan metadata:** to be captured in final metadata commit after state/roadmap updates.

## Files Created/Modified

**Created:**

- `docs/policies/mint-policy.md` — 107 lines; v1.0 draft; POL-02 deliverable. Twelve numbered sections plus an Important callout, a closing draft-marker italic paragraph, and a version-history row. Every clause the plan specifies is present and greppable; acceptance-criteria grep suite passed (14 checks).
- `docs/policies/clawback-freeze-policy.md` — 152 lines; v1.0 draft; POL-03 deliverable. Fourteen numbered sections as specified by the plan, plus §15 "Copycat mint and phishing-risk acknowledgement" added to satisfy the orchestrator's Wave 1 inheritance requirement (acknowledge squatter mint + commit to OPS-07). Acceptance-criteria grep suite passed (20 checks including the Wave-1-added copycat + OPS-07 checks).
- `docs/policies/README.md` — 53 lines; policies index. Status/version table; scope; out-of-scope enumeration; versioning semantics; publication targets; contact addresses; cross-links to symbol-availability-check.md and to the forthcoming style-guide.md (Plan 01-04).

**Modified:**

- None outside the three files created by this plan (Task 2's commit bundles Prettier reformat of `docs/policies/mint-policy.md` from the same format pass; semantic content unchanged).

## Decisions Made

1. **Added §15 "Copycat mint and phishing-risk acknowledgement" to Clawback/Freeze Policy.** The plan's `<action>` block specified "Do NOT change any other content" from the exact file text it provided, but the orchestrator's `<success_criteria>` explicitly requires "Clawback/Freeze Policy acknowledges the copycat mint risk and the commitment to Phase 5 OPS-07 monitoring." Resolution: add a §15 addendum that explicitly names the squatter mint address, commits the multisig operator to OPS-07 monitoring + canonical-address discipline + a ≤72h pre-ceremony re-check, and clarifies that the multisig has no control surface over the unrelated squatter. This is additive — it does not alter any section the plan's acceptance criteria checks — and it resolves the orchestrator's explicit Wave 1 inheritance requirement. Documented in the Deviations section under Rule 2 (Missing Critical — orchestrator success criterion).
2. **README link text uses the descriptive policy names, not the filenames.** The plan's `key_links` regex `\[.*Mint Policy.*\]\(\./mint-policy\.md\)` requires the literal string "Mint Policy" inside the link brackets. Initial draft used filename-as-link-text (`[mint-policy.md](./mint-policy.md)`) which is idiomatic Markdown but fails the plan's link-integrity regex. Changed to `[Mint Policy](./mint-policy.md)` and `[Clawback & Freeze Authority Policy](./clawback-freeze-policy.md)` to satisfy both the regex and human readability. Documented in Deviations under Rule 3 (Blocking).
3. **Bundled the Prettier reformat of `mint-policy.md` into Task 2's commit.** Running `pnpm format:check` after Task 2's file writes flagged all three new .md files. Applied `pnpm format` which also reformatted table columns and italic delimiters in the already-committed `mint-policy.md` (semantic-free cosmetic change). Could have been a separate cosmetic commit but chose to fold into Task 2 because (a) it originated from the same format pass triggered by this plan's work and (b) the per-task-commit protocol allows bundling formatting-only adjacent file changes when they are a direct consequence of the same plan step. Not a scope creep — fully cosmetic.
4. **Used `{TASK RUN DATE IN UTC, YYYY-MM-DD}` → `2026-04-19`** in all four occurrences (two in Mint Policy: "Last reviewed" and version-history row; two in Clawback/Freeze Policy: same two fields). Placeholder count = 0 verified post-write.
5. **Kept the plan's italic-delimiter choice from the spec text (`*This is a draft document...*`) even though Prettier converts it to `_..._` on write.** The plan text used `*` but Prettier's repo-default Markdown config uses `_`; the project's existing policy is "Prettier wins on disagreement" (established in Plan 01-02). No content change; pure delimiter normalization.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added §15 copycat/OPS-07 acknowledgement to Clawback/Freeze Policy (Wave 1 inheritance)**

- **Found during:** Task 2, right before writing `docs/policies/clawback-freeze-policy.md`.
- **Issue:** The plan's `<action>` block provides exact file text and instructs "Do NOT change any other content." But the orchestrator's `<success_criteria>` explicitly requires "Clawback/Freeze Policy acknowledges the copycat mint risk and the commitment to Phase 5 OPS-07 monitoring" — a Wave 1 inheritance requirement passed down from Plan 01-01's accept-conflict decision. The plan text as written does NOT contain an OPS-07 commitment or the squatter mint address. Without the addendum, the orchestrator's success criterion would fail.
- **Fix:** Added `## 15. Copycat mint and phishing-risk acknowledgement` as a new final numbered section. The addendum (a) names the squatter mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` explicitly with context (pump.fun, Feb 2026, "Clawed Ape Yacht Club", ~47 holders, organic-score "low"), (b) points to `../symbol-availability-check.md` as the POL-01 evidence record, (c) commits the multisig operator to four specific undertakings: proactive OPS-07 monitoring, canonical-address publication discipline, non-use of Freeze/PD against unrelated copycat mints (out-of-scope clarification), and a ≤72h pre-ceremony preflight re-check before mainnet. The addendum is additive only — it does not change any clause in sections 1-14 that the plan's acceptance-criteria grep suite checks. The §14 "Legal posture" section (plan-required) remains as specified; the §15 addendum follows it. The closing draft-marker italic paragraph is retained after §15.
- **Files modified:** `docs/policies/clawback-freeze-policy.md` (added §15 before the closing draft-marker paragraph).
- **Verification:** `grep -q "9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump"` → matched. `grep -q "OPS-07"` → matched. `grep -q "^## 14\. Legal posture"` → still matched (plan-required section preserved). `grep -q "^## 15\. Copycat mint"` → new section present. Full plan acceptance-criteria grep suite passed (20 checks).
- **Committed in:** `0f544ea` (Task 2 commit; §15 folded in with the main POL-03 content).

**2. [Rule 3 - Blocking] README link-text changed from filename to descriptive policy name**

- **Found during:** Task 2, running the plan's `<verify>` grep suite.
- **Issue:** Initial README draft used `[mint-policy.md](./mint-policy.md)` and `[clawback-freeze-policy.md](./clawback-freeze-policy.md)` (Markdown convention of filename-as-link-text). The plan's `key_links.pattern` field (frontmatter) requires `\[.*Mint Policy.*\]\(\./mint-policy\.md\)` — literal "Mint Policy" INSIDE the link text. Same for "Clawback.*Freeze" for the other link. Filename-as-link-text fails both regexes.
- **Fix:** Changed link text to the descriptive policy names. Result: `| Mint Policy | ... | [Mint Policy](./mint-policy.md) |` and `| Clawback & Freeze Authority Policy | ... | [Clawback & Freeze Authority Policy](./clawback-freeze-policy.md) |`. More readable for humans AND satisfies the plan regex.
- **Files modified:** `docs/policies/README.md` (two table rows updated).
- **Verification:** `grep -q "\[.*Mint Policy.*\](\./mint-policy\.md)"` → matched. `grep -q "\[.*Clawback.*Freeze.*\](\./clawback-freeze-policy\.md)"` → matched.
- **Committed in:** `0f544ea` (Task 2 commit; included in the pre-commit version of the README).

**3. [Rule 3 - Blocking] Prettier flagged all three new policy files as unformatted**

- **Found during:** Task 2, running `pnpm format:check` as a verification check.
- **Issue:** The plan text as provided has columnless Markdown tables (pipes without alignment padding) and uses `*...*` for italics. Prettier's project config (inherited from Plan 01-02 `.prettierrc.json`) aligns table columns and converts italics to `_..._`. Initial file writes matched the plan text exactly → Prettier flagged all three files.
- **Fix:** Ran `pnpm format` to apply Prettier. Affected all three policy files (`mint-policy.md`, `clawback-freeze-policy.md`, `README.md`) with pure cosmetic changes: table column padding and italic delimiter normalization. No content change. The mint-policy.md change is cosmetic-only and was bundled into Task 2's commit because the format pass happened after Task 1's commit but before Task 2's commit.
- **Files modified:** `docs/policies/mint-policy.md` (Prettier reformat; line count 106→107 due to table row padding + trailing-blank-before-italic), `docs/policies/clawback-freeze-policy.md` (Prettier reformat), `docs/policies/README.md` (Prettier reformat).
- **Verification:** `pnpm format:check` → "All matched files use Prettier code style!" (repo-wide).
- **Committed in:** `0f544ea` (Task 2 commit; bundled the mint-policy.md reformat because it came from the same format pass).

**4. [Rule 3 - Environment] Gitleaks not on PATH in fresh bash shell**

- **Found during:** Task 1, preparing to invoke `git commit` for the first time.
- **Issue:** The execution shell's PATH did not include `/c/Users/markc/AppData/Local/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_.../` (winget installs it there but PATH update requires shell restart). The pre-commit hook invokes `gitleaks` by bare name. Without PATH, commit would fail with "gitleaks: command not found." This was flagged in the orchestrator prompt as a known machine-specific deviation.
- **Fix:** Prepended the gitleaks winget directory to PATH inside each `git commit` bash invocation: `export PATH="/c/Users/markc/AppData/Local/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe:$PATH"`. Both task commits (1a3c23d, 0f544ea) succeeded with pre-commit hook firing and gitleaks passing ("no leaks found").
- **Files modified:** None (shell-level only).
- **Verification:** Both commits show `[pre-commit] Running gitleaks on staged changes...` → `[pre-commit] OK`.
- **Committed in:** N/A (shell-level workaround; the machine-specific gitleaks PATH issue is already documented in Plan 01-02 SUMMARY as a known install-time quirk).

---

**Total deviations:** 4 auto-fixed (1 orchestrator success-criterion addendum, 1 plan-regex alignment, 1 formatter conformance, 1 environment/PATH quirk).
**Impact on plan:** All four are necessary for correctness. The §15 addendum directly satisfies a Wave 1 inheritance success criterion that would otherwise fail. The README link text change satisfies the plan's own `key_links.pattern` regex. The Prettier reformat keeps the repo-wide `format:check` green and is semantic-free. The gitleaks PATH workaround is machine-specific and already tracked. No scope creep; no clause the plan's acceptance criteria checks was altered.

## Issues Encountered

- **Plan text vs orchestrator inheritance requirement conflict.** The plan's `<action>` block said "Do NOT change any other content" about the Clawback/Freeze Policy's exact file text, but the orchestrator's `<success_criteria>` explicitly required the policy to acknowledge copycat risk and commit to OPS-07 — content not present in the plan text. Resolution was to add §15 as a purely additive section (does not alter any sentence in sections 1-14 that acceptance criteria grep for). Documented as Rule 2 deviation above.
- **Markdown link-text convention vs plan regex.** Using the filename as link text (`[mint-policy.md](./mint-policy.md)`) is idiomatic and unambiguous, but the plan's frontmatter regex required the descriptive policy name inside the brackets. Chose the descriptive form; it also reads more naturally ("Click Mint Policy" vs "Click mint-policy.md"). Not a real issue, just a spec-alignment step.
- **Prettier reformatting a previously-committed file inside a subsequent task's format pass.** Bundling `docs/policies/mint-policy.md`'s cosmetic reformat into Task 2's commit was a judgment call. Alternative would have been a separate `style(01-03): apply prettier reformat to mint-policy.md` commit. Chose bundling because the reformat was a direct consequence of the same plan's format-check step and the content change is zero.

## User Setup Required

None for this plan. Policy files are Markdown source-of-truth only; Phase 5 Ops Go-Live publishes them to `caycsolana.com/policies/*` when that phase's website tasks run.

## Phase 1 Success Criterion 1 — Content Readiness Confirmation

Phase 1 Success Criterion 1: _"Anyone visiting the CAYC website can read the Mint Policy (scope, justification, 48-hour pre-announcement / time-lock commitment) and the Clawback / Freeze Authority Policy (narrow scope: lawful orders + documented theft/scam recovery via multisig vote)."_

| Sub-item                                                          | Status             | Evidence                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mint Policy content exists (scope + justification + 48h + timelock) | CONTENT READY      | `docs/policies/mint-policy.md` §§1-7 cover scope, authority model, 500M genesis, five-condition mint gate (48h pre-announcement), time-lock implementation approach               |
| Clawback/Freeze Policy content exists (narrow-scope scenarios)    | CONTENT READY      | `docs/policies/clawback-freeze-policy.md` §§3-5 enumerate narrow permitted uses (lawful orders + documented theft-recovery only) with multisig-vote approval procedure            |
| Publication to caycsolana.com                                     | DEFERRED (Phase 5) | Both policy files declare "to be published on caycsolana.com during Phase 5 Ops Go-Live" in their Version metadata line; README.md scope section lists publication targets        |
| Greppable content-ready markers                                   | MET                | `48-hour pre-announcement`, `Freeze Transparency Log`, `lawful-order`, `theft-recovery`, `compliance@caycsolana.com`, `policy@caycsolana.com` all present and matched by grep       |

## Next Phase / Plan Readiness

**For Plan 01-04 (Language audit + POL-04 Style Guide):**

- **CRITICAL allowlist requirement:** `docs/policies/mint-policy.md` §12 "Legal posture" and `docs/policies/clawback-freeze-policy.md` §14 "Legal posture" contain the word "stablecoin" INTENTIONALLY. Passing these specific sections through the language audit unflagged is NOT the goal; the disclaimers EXPLICITLY state CAYC is NOT a stablecoin. The language audit must allowlist these two files (or these specific section-ranges) so the audit can continue to catch unintended "stablecoin" usage elsewhere in the repo without false-flagging the disclaimers.
- **Disambiguation-convention enforcement:** The language audit should (per Plan 01-01 decision trail §"Implied downstream actions") enforce that any public-facing markdown file introducing the symbol "CAYC" must first use "CAYC (Cyber Ape Yacht Club)" in the same document. Both policies already satisfy this in their "Applies to" line — Plan 01-04 should treat these two files as the canonical examples.
- **"Branded payments token, USDC-referenced" as the canonical banned-for-stablecoin replacement phrase.** Both policies use this phrase consistently in headers, important callouts, and legal-posture sections. Plan 01-04's style guide should codify this phrase as the REQUIRED replacement for any attempted use of "stablecoin" to describe CAYC.
- **README link style precedent:** `docs/policies/README.md` uses descriptive-policy-name link text (not filename-as-link-text). Plan 01-04 docs/ additions should follow the same convention for consistency.

**For Phase 5 (Ops Go-Live — Publication + OPS-07 + Transparency Log):**

- **Policy source of truth:** `docs/policies/*.md` are the Markdown source that Phase 5 website Publication tasks render under `caycsolana.com/policies/*`. On publication, update the Effective-date line ("upon first public publication of this document" → actual UTC date) and the README's "Where these policies are published" section to link to the published web copies.
- **OPS-07 copycat watchlist — inherited commitment:** Clawback/Freeze Policy §15 COMMITS the multisig operator to Phase 5 OPS-07 monitoring. That commitment names the specific squatter mint (`9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump`) and the specific preflight cadence (≤72h pre-ceremony re-check). Phase 5's OPS-07 plan MUST:
  1. Enumerate the squatter mint on a persistent watchlist,
  2. Define the monitoring cadence (at minimum: weekly scan for new Token-2022 mints with `symbol=CAYC` + daily check of the known squatter's organic-score / tag state on Jupiter),
  3. Define the anti-phishing response procedure (canonical-address post templates, Jupiter/RugCheck/Solscan/Phantom reporting contacts, user-facing warning copy),
  4. Tie itself back to this policy via citation.
- **Freeze Transparency Log bootstrap:** Phase 5 Ops Go-Live must create `docs/security/freeze-transparency-log.md` with Entry 0 (policy effective date marker) on the same day the policy takes effect. Policy §8 specifies the entry schema exactly — Phase 5 should not improvise on the schema.
- **Operations Runbook (OPS-05) integration:** The Runbook is the procedural implementation of these two policies. It should cite policy sections directly (not paraphrase) so that any divergence is visible at diff-time.

**For Phase 4 (Mainnet ceremony):**

- Mint Policy §2 pins the Token-2022 program ID `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` — Phase 4 ceremony scripts must target exactly this program address.
- Mint Policy §2 requires "first `initializeMint` instruction onward" holds authority at the Squads v4 vault PDA — no EOA authority window. Phase 4 ceremony transcript must show this explicitly.
- Clawback/Freeze Policy §15 mandates a ≤72h pre-ceremony symbol re-check across all four platforms — this is a BLOCKING preflight item for the Phase 4 ceremony, not optional.

**For Phase 7 (CEX listings):**

- Both policy files become mandatory attachments to every CEX listing application (per CEX-01 requirement). The "branded payments token, USDC-referenced" framing + the Legal-posture disclaimers + the published narrow-scope authority policies are the core CEX-compliance-reviewer materials.

**Phase-1 blockers still open (NOT resolved by this plan):**

- POL-04 (Language audit CI + Style Guide v1.0) — delivered by Plan 01-04, the final Phase 1 plan.

## Self-Check: PASSED

**Files created verified:**

- `docs/policies/mint-policy.md` FOUND (committed in `1a3c23d`; reformatted in `0f544ea`)
- `docs/policies/clawback-freeze-policy.md` FOUND (committed in `0f544ea`)
- `docs/policies/README.md` FOUND (committed in `0f544ea`)

**Commits verified:**

- `1a3c23d` FOUND: `docs(01-03): draft CAYC Mint Policy v1.0 (POL-02)`
- `0f544ea` FOUND: `docs(01-03): draft Clawback/Freeze Authority Policy v1.0 (POL-03) and policies index README`

**Verification commands (all passed):**

- `test -f docs/policies/mint-policy.md` → exit 0
- `test -f docs/policies/clawback-freeze-policy.md` → exit 0
- `test -f docs/policies/README.md` → exit 0
- `grep -q "^# CAYC Mint Policy$" docs/policies/mint-policy.md` → matched
- `grep -q "^# CAYC Clawback & Freeze Authority Policy$" docs/policies/clawback-freeze-policy.md` → matched
- `grep -q "48-hour pre-announcement" docs/policies/mint-policy.md` → matched
- `grep -q "3-of-5" docs/policies/mint-policy.md` → matched
- `grep -q "500,000,000" docs/policies/mint-policy.md` → matched
- `grep -q "Squads v4 multisig vault PDA" docs/policies/mint-policy.md` → matched
- `grep -q "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" docs/policies/mint-policy.md` → matched
- `grep -q "branded payments token, USDC-referenced" docs/policies/mint-policy.md` → matched
- `grep -q "^## 12\. Legal posture" docs/policies/mint-policy.md` → matched
- `grep -q "GENIUS Act" docs/policies/mint-policy.md` → matched
- `grep -q "policy@caycsolana.com" docs/policies/mint-policy.md` → matched
- `! grep -qE "^## .*stablecoin" docs/policies/mint-policy.md` → confirmed absent in headings
- `grep -c "{TASK RUN DATE IN UTC" docs/policies/mint-policy.md` → 0 placeholders remaining
- `grep -q "^\*\*Version:\*\* 1.0" docs/policies/mint-policy.md` → matched
- `wc -l < docs/policies/mint-policy.md` → 107 (≥ 80 required)
- `grep -q "Freeze Transparency Log" docs/policies/clawback-freeze-policy.md` → matched
- `grep -q "lawful-order" docs/policies/clawback-freeze-policy.md` → matched
- `grep -q "theft-recovery" docs/policies/clawback-freeze-policy.md` → matched
- `grep -q "24 hours" / "48 hours" / "72 hours" docs/policies/clawback-freeze-policy.md` → all matched
- `grep -q "compliance@caycsolana.com" docs/policies/clawback-freeze-policy.md` → matched
- `grep -q "^## 9\. What this policy does NOT permit$" docs/policies/clawback-freeze-policy.md` → matched
- `grep -q "^## 14\. Legal posture" docs/policies/clawback-freeze-policy.md` → matched
- `grep -c "{TASK RUN DATE IN UTC" docs/policies/clawback-freeze-policy.md` → 0 placeholders remaining
- `wc -l < docs/policies/clawback-freeze-policy.md` → 152 (≥ 80 required)
- `grep -q "9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump" docs/policies/clawback-freeze-policy.md` → matched (Wave 1 inheritance: squatter mint acknowledged)
- `grep -q "OPS-07" docs/policies/clawback-freeze-policy.md` → matched (Wave 1 inheritance: OPS-07 commitment)
- `grep -q "\[.*Mint Policy.*\](\./mint-policy\.md)" docs/policies/README.md` → matched (plan key_links regex)
- `grep -q "\[.*Clawback.*Freeze.*\](\./clawback-freeze-policy\.md)" docs/policies/README.md` → matched (plan key_links regex)
- `grep -q "\./clawback-freeze-policy\.md" docs/policies/mint-policy.md` → matched (Mint Policy §9 → Clawback/Freeze Policy)
- `grep -q "\./mint-policy\.md" docs/policies/clawback-freeze-policy.md` → matched (Clawback/Freeze Policy §11 → Mint Policy)
- `pnpm format:check` → "All matched files use Prettier code style!"
- `pnpm gitleaks` → "17 commits scanned … no leaks found"
- `git log --oneline | grep -E "1a3c23d|0f544ea"` → both present

---

_Phase: 01-foundation_
_Plan: 03_
_Completed: 2026-04-19_
