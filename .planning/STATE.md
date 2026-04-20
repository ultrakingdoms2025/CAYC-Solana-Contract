---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: Completed 02-02-PLAN.md (devnet Squads v4 multisig live on-chain; artifacts/devnet.json authoritative; .env.devnet populated; GOV-01 closed). Plan 02-03 (rotation drill + smoke-test mint) is next — refund signer wallets before running since faucet daily limit hit during 02-02.
last_updated: "2026-04-20T04:45:48.948Z"
last_activity: 2026-04-20 — Plan 02-02 complete (d951edf); GOV-01 CLOSED. Plan 02-03 (rotation drill + smoke-test mint) is next — imports from src/squads + reads artifacts/devnet.json.
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 10
  completed_plans: 6
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Users can send and receive CAYC as a trusted USDC-referenced payment token on Solana, backed by transparent multisig governance, published operational policies, and verification across the wallets, explorers, and exchanges people already use.
**Current focus:** Phase 2 — Squads Multisig Setup (Devnet + Mainnet), GOV-01..04

## Current Position

Phase: 2 of 7 (Squads Multisig Setup — Devnet + Mainnet) — IN PROGRESS
Plan: 2 of 6 in current phase COMPLETE (02-02 devnet Squads v4 multisig live on-chain; next: 02-03 rotation drill + smoke-test mint)
Status: Plan 02-02 complete. Devnet multisig 6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu live on-chain (Squads v4 program SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf); vault PDA 5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu (distinct — Pitfall 11 verified); threshold 3 of 6 (5 voting + 1 proposer-only); self-managed configAuthority; timeLock=0. scripts/squads/create-devnet.ts + artifacts/devnet.json committed; .env.devnet populated (gitignored). proposer keypair funded (1.9 SOL via transfer from id-devnet.json — daily faucet limit hit); 5 signer keypairs unfunded (0 SOL — OK for this plan, refund in 02-03).
Last activity: 2026-04-20 — Plan 02-02 complete (d951edf); GOV-01 CLOSED. Plan 02-03 (rotation drill + smoke-test mint) is next — imports from src/squads + reads artifacts/devnet.json.

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 18.5min
- Total execution time: 74min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 74min | 18.5min |

**Recent Trend:**
- Last 5 plans: 01-foundation P04 (40min, 2 tasks, 5 files), 01-foundation P03 (7min, 2 tasks, 3 files), 01-foundation P02 (9min, 3 tasks, 22 files), 01-foundation P01 (18min, 2 tasks, 1 file)
- Trend: P04 took longer due to in-flight script debugging (LINENO reserved-variable bug, set -e interaction with pipelines, allowlist expansion needed to cover existing legitimate "stablecoin" uses)

*Updated after each plan completion*
| Phase 01-foundation P04 | 40min | 2 tasks | 5 files |
| Phase 01-foundation P03 | 7min | 2 tasks | 3 files |
| Phase 01-foundation P02 | 9min | 3 tasks | 22 files |
| Phase 01-foundation P01 | 18min | 2 tasks | 1 file |
| Phase 02-squads-multisig-setup-devnet-mainnet P01 | 7min | 2 tasks | 11 files |
| Phase 02-squads-multisig-setup-devnet-mainnet P02 | 10min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. Locked constraints driving the roadmap:

- Token-2022 (not legacy SPL), 6 decimals, 500M initial supply, uncapped mint
- Squads v4 multisig from `initializeMint` itself — no EOA authority window
- Metadata + Permanent Delegate extensions permanent; no Transfer Fee, no Transfer Hook
- Public framing: "branded payments token, USDC-referenced" — never "stablecoin"
- Raydium CPMM as launch DEX venue (Token-2022 compatibility)
- Devnet end-to-end rehearsal required before mainnet
- [Phase 01-foundation]: Pinned @solana/web3.js v1 (not Kit) — Squads v4 SDK and @solana/spl-token 0.4.x both target v1; revisit when Squads ships Kit-native SDK
- [Phase 01-foundation]: Pinned TypeScript ~5.6.0 (not 6.x) — Solana ecosystem typedefs still target 5.x; TS 6.x produces skipLibCheck noise masking real errors
- [Phase 01-foundation]: Three-tier .env strategy: .env.example (network-agnostic, devnet default) + .env.devnet.example + .env.mainnet.example with CONFIRM_MAINNET=no explicit opt-in guard
- [Phase 01-foundation]: Gitleaks allowlist broadened to entire .planning/ tree — planning docs legitimately contain example secrets in code fences; source files and real .env files remain strictly scanned
- [Phase 01-foundation]: Husky v9 core.hooksPath=.husky/_ accepted as equivalent to .husky (shim dir sources .husky/pre-commit); hook fires as intended, verified live
- [Phase 01-foundation]: CAYC symbol CONFLICT accepted (Jupiter + Solscan squatter mint 9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump — "Clawed Ape Yacht Club", pump.fun, Feb 2026, dead launch); brand stays CAYC per PROJECT.md Key Decisions; public copy uses "CAYC (Cyber Ape Yacht Club)" first-reference disambiguation
- [Phase 01-foundation]: Jupiter Ultra V1 search (/ultra/v1/search) is the canonical Jupiter symbol-check endpoint; legacy /tokens/v1/tagged/verified deprecated (HTTP 404)
- [Phase 01-foundation]: Solana mainnet RPC getAccountInfo is the authoritative substitute for Solscan API when Cloudflare blocks programmatic access — Solscan mechanically indexes every mainnet mint, so on-chain state == Solscan rendering
- [Phase 01-foundation]: OPS-07 copycat watchlist (Phase 5) must include mint 9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump; Phase 4 preflight must re-run full 4-platform symbol check <=72h before mainnet ceremony
- [Phase 01-foundation]: Mint Policy §5 uses multisig-discipline time-lock (not on-chain timelock program) — no custom Solana program at launch; v2+ may migrate to Squads v4 execution-delay with 14-day public notice
- [Phase 01-foundation]: Mint Policy §6 requires pre-announcement on ALL FIVE canonical channels (website, repo, X/Twitter, Discord, Telegram) within a 10-minute window; proof-of-simultaneity via screenshot archive committed to repo
- [Phase 01-foundation]: Clawback/Freeze Policy §6 mandates one-account-per-proposal (batched freezes prohibited); target address named twice in Squads proposal (title + description) with character-by-character match
- [Phase 01-foundation]: Clawback/Freeze Policy §7 SLAs — 24h initial response (business days), 48h (weekend), 72h resolution. Public commitment, not legal guarantee
- [Phase 01-foundation]: Clawback/Freeze Policy §8 Freeze Transparency Log lives at caycsolana.com/freeze-log + docs/security/freeze-transparency-log.md with strict entry schema (ticket ID, UTC timestamp, reason category from fixed enum, tx signatures, target account, owner wallet, amount, resolution, explicit redaction markers)
- [Phase 01-foundation]: Both policies' "Legal posture" sections (Mint §12, Clawback §14) are the ONLY places "stablecoin" appears describing CAYC — explicit non-classification disclaimers invoking GENIUS Act + MiCA; POL-04 language audit MUST allowlist these two files
- [Phase 01-foundation]: Clawback/Freeze Policy §15 explicitly names squatter mint 9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump and commits multisig operator to Phase 5 OPS-07 monitoring, canonical-address publication discipline, non-use of Freeze/PD against unrelated copycat mints, and ≤72h pre-ceremony symbol re-check before mainnet
- [Phase 01-foundation]: Policies README uses descriptive link text ("Mint Policy", "Clawback & Freeze Authority Policy") not filename-as-link-text — satisfies plan key_links regex and reads more naturally
- [Phase 01-foundation]: Amendment procedure for substantive policy changes requires 14-day public notice on all five canonical channels; editorial changes apply immediately but are logged in version history
- [Phase 01-foundation]: POL-04 language audit wired end-to-end via `scripts/check-language.sh` + `.langauditrc.json` + `pnpm lang:audit` script + `.husky/pre-commit` Step 3 — any commit introducing "stablecoin"/"backed by"/"redeemable"/"1:1 with USDC"/"always worth $1" in public-facing copy (docs/ except docs/security and docs/style-guide.md, plus README.md) is blocked at pre-commit. Allowlist triple: (a) exclude_paths for files that ARE the rule document, (b) context-anchored allowlists for mint-policy §12 + clawback-freeze §14 + policies-README "What these policies do NOT cover", (c) 12 line-level regex allowlists covering Style-Guide §6 permitted references (negations, GENIUS-Act definitional terms, historical references to other projects like USDC/USDT/Terra-UST)
- [Phase 01-foundation]: scripts/check-language.sh uses `set -uo pipefail` (not `-e`) because grep/read control-flow in subshell pipelines would abort the scan prematurely. Real errors are surfaced via explicit exit statements; rationale documented in script header
- [Phase 01-foundation]: `LINENO` is a reserved bash variable — never use it as a loop iterator. Lesson learned in POL-04 script debugging; renamed to `LN` throughout scan loop. Future shell-script authors should prefer neutral names like LN/LINENUM
- [Phase 01-foundation]: Pre-commit hook order locked as gitleaks → prettier → lang-audit → typecheck. Rationale: secrets first (hard security gate), formatting second (normalizes text), language third (text-content gate operating on normalized text), typecheck last (most expensive). Any future hook additions must respect this order
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Squads helper API access: Permission/Permissions/Member types come from @sqds/multisig types namespace (multisig.types.Permission, types.Permissions, types.Member) — not top-level exports. Plan interface docs showed top-level, but runtime exposes only via types.*. src/squads/members.ts and tests use types.* form.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Pitfall 11 mechanized via src/squads: deriveVaultPda() is the ONLY vault-derivation path; VaultMismatchError throws with both addresses + PITFALLS.md reference; verifyVaultAuthority() must be called before any authority-set transaction. Downstream scripts import from src/squads, never @sqds/multisig PDA helpers directly.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Mainnet config authority convention: Squads v4 Multisig.configAuthority is a PublicKey (not nullable); the 'self-managed / null' semantic is configAuthority.equals(PublicKey.default) (all-zero bytes). verify-vault.ts prints the pubkey with an (all-zero → self-managed) suffix when this case matches.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Session gitleaks PATH recipe (from Plan 02-01 onward): export PATH="/c/Users/markc/AppData/Local/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe:$PATH" — must be re-applied in any new shell session for the rest of Phase 2. Each continuation-agent plan re-applies before first git commit or pnpm gitleaks.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Devnet faucet exhaustion workaround: when Helius ('1 SOL per project per day') and public devnet ('daily airdrop limit') both exhausted, transfer SOL from the pre-funded id-devnet.json keypair (GEqTsuKzWbTMMqipcvwrbqGxkDeEKTUXQyeigSR8DiY3) to the proposer. Signer members[] wallets do NOT need funding for multisigCreateV2 itself (SDK signature only requires createKey + creator as Signers); refund signers before Plan 02-03 rotation drill when their keys actually sign.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] RPC confirmed-state lag mitigation: post-multisigCreateV2 loadMultisig can fail with 'Unable to find Multisig account' even though the tx confirmed, because confirmed-commitment RPC nodes index tx-pipeline before account-read-path. Fix: retry-with-backoff (10 attempts, 1s initial, 5s cap) on any post-tx account read. Pattern applies to Plan 02-05 mainnet ceremony. Consider hoisting to src/squads helper if re-used in 02-03+.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] artifacts/devnet.json shape: { network, generated_at, squads: {...}, notes: [...] } with network-agnostic top-level and 'squads' sub-object. Phase 3+ plans append sibling keys (mint: {...}, treasury: {...}) via {...prior, ...artifact} merge-on-write; squads is never mutated. Same shape template applies to artifacts/mainnet.json in Plan 02-05.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Devnet multisig 6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu + vault PDA 5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu is the canonical Phase 2+3 devnet authority. Pitfall 11: multisig != vault; all Phase 3+ authorities (mint/freeze/update/permanent-delegate) MUST point to vault_pda, NEVER multisig_address. One orphaned first-attempt multisig at H1QWPbfzZn57Z3G6G96N6n1Z2XuLBtP5u75b5ZzJn2dy is accepted cruft (~0.003 SOL devnet rent, no operational impact).
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] scripts/squads/* driver template: loadEnv(network) → buildConnection(network) → Keypair loads from gitignored keys/ → SDK call → retry-on-read → artifact+env merge-write. Idempotence via existsSync(artifactPath) + populated-key check + --force override. Applies to 02-03 rotation, 02-05 mainnet ceremony, and Phase 4 mint creation scripts.

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 1 gate (POL-01): RESOLVED 2026-04-19 via accept-conflict.** CAYC symbol CONFLICT on Jupiter and Solscan (squatter mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump`, "Clawed Ape Yacht Club", pump.fun Feb 2026); CoinGecko and CoinMarketCap clear. User elected to retain CAYC and disambiguate publicly. See `docs/symbol-availability-check.md`.
- **Phase 1 gates (POL-02, POL-03): RESOLVED 2026-04-19 via Plan 01-03.** Mint Policy v1.0 draft at `docs/policies/mint-policy.md` (107 lines; 48-hour pre-announcement gate, multisig-discipline time-lock, 500M genesis, uncapped mint authority, GENIUS-Act disclaimer). Clawback/Freeze Authority Policy v1.0 draft at `docs/policies/clawback-freeze-policy.md` (152 lines; narrow lawful-order + theft-recovery scope, 7-step approval, 24/48/72h SLAs, Freeze Transparency Log, §15 copycat/OPS-07 acknowledgement). Phase 1 Success Criterion 1 content ready; publication deferred to Phase 5 Ops Go-Live.
- **Plan 01-04 allowlist obligation: RESOLVED 2026-04-19 via Plan 01-04.** POL-04 language audit is wired end-to-end. `docs/policies/mint-policy.md` §12 and `docs/policies/clawback-freeze-policy.md` §14 are correctly allowlisted via context-anchored section ranges in `.langauditrc.json` (`allowlisted_contexts`). A third context allowlist covers `docs/policies/README.md` "What these policies do NOT cover". `docs/style-guide.md` itself is in `exclude_paths` (the rule document cannot scan itself). 12 line-level regex allowlists cover Style-Guide §6 permitted references (negation + GENIUS-Act definitional term + historical reference to other projects). `pnpm lang:audit` exits 0 on current tree; smoke test confirms audit blocks deliberate violations.
- **Phase 1 gate (POL-04): RESOLVED 2026-04-19 via Plan 01-04.** Language & Disclosure Style Guide v1.0 shipped at `docs/style-guide.md` (111 lines, 10 numbered sections + version history). Enforcement: `scripts/check-language.sh` + `.langauditrc.json` + `pnpm lang:audit` + `.husky/pre-commit` Step 3. Phase 1 Success Criterion 3 met. All four POL requirements (POL-01 through POL-04) closed.
- **Phase 1 COMPLETE 2026-04-19.** All four Phase 1 plans shipped. All four POL requirements (POL-01 through POL-04) closed. Phase 2 (Squads Multisig Setup, GOV-01..04) is unblocked pending phase-plan generation.
- **Phase 2 session PATH obligation (every shell restart):** gitleaks is installed via winget under `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe\` but that directory is NOT on default bash PATH on this machine. Any new Phase 2 executor shell must first run: `export PATH="/c/Users/markc/AppData/Local/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe:$PATH"` then `which gitleaks` (must print the full path). Without this, every `pnpm gitleaks` acceptance gate and every husky pre-commit hook fails. Plans 02-02 through 02-06 each `read_first` 02-01-SUMMARY.md so the recipe is trivially re-discoverable.
- **Phase 2 Plan 02-01 SHIPPED 2026-04-20.** src/squads helper substrate in place (8 vitest tests passing, Pitfall 11 mechanized, gitleaks PATH gate closed). GOV-01 and GOV-04 requirements remain [ ] pending — close in Plans 02-02 (devnet multisig creation) and 02-05 (mainnet ceremony) respectively. Downstream Phase 2 plans import from src/squads; no plan should call @sqds/multisig PDA helpers directly.
- **Phase 4 preflight obligation:** Re-run the full 4-platform symbol check <=72h before the mainnet ceremony to catch any newer squatters. Add to the ceremony checklist when Phase 4 is planned. Obligation now doubly-cited: Plan 01-01 decision trail AND Clawback/Freeze Policy §15.
- **Phase 5 OPS-07 obligation:** Add mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` to the copycat watchlist with a documented anti-phishing response procedure. Now a published policy commitment (Clawback/Freeze Policy §15), not just an internal note.
- **Phase 5 Freeze Transparency Log bootstrap obligation:** On the same day the Clawback/Freeze Policy takes effect on caycsolana.com, publish `docs/security/freeze-transparency-log.md` with Entry 0 (policy effective date marker). Schema specified in Clawback/Freeze Policy §8 — Phase 5 Ops Runbook must not improvise.
- **Phase 5 research flag:** Jupiter V3 organic score accumulation timeline is not well-benchmarked for new tokens; budget for Express Review (1,000 JUP burn) if organic path lags. Accept-conflict decision adds Jupiter Verify V3 submission friction — proactive outreach with full-name "CAYC (Cyber Ape Yacht Club)" context is mandatory.
- **Phase 7 research flag:** Individual CEX compliance checklists change frequently; each target CEX requires fresh research at time of outreach. All CEX applications use "CAYC (Cyber Ape Yacht Club)" in legal disclosures. Both policy files become mandatory attachments per CEX-01.

## Session Continuity

Last session: 2026-04-20T04:45:48.944Z
Stopped at: Completed 02-02-PLAN.md (devnet Squads v4 multisig live on-chain; artifacts/devnet.json authoritative; .env.devnet populated; GOV-01 closed). Plan 02-03 (rotation drill + smoke-test mint) is next — refund signer wallets before running since faucet daily limit hit during 02-02.
Resume file: None
