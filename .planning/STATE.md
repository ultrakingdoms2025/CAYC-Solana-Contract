---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Phase 2 COMPLETE (6/6 plans). Plan 02-06 closed GOV-03 via docs/security/signer-roster.md v1.1 (real pubkeys + pseudonyms) + scripts/squads/publish-artifacts.ts (idempotent artifact validator) + artifacts/mainnet.json ceremony_transcript cross-link. GOV-04 mainnet arm explicitly deferred to Phase 4 DEP-04. Phase 3 (Devnet Full Rehearsal) UNBLOCKED.
last_updated: "2026-04-20T16:03:31.379Z"
last_activity: "2026-04-20 — Plan 02-06 COMPLETE (artifact publication + signer-roster finalization, 9min wall clock). GOV-03 closed. Phase 2 at 6/6 plans. Next phase: Phase 3 Devnet Full Rehearsal."
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 10
  completed_plans: 10
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Users can send and receive CAYC as a trusted USDC-referenced payment token on Solana, backed by transparent multisig governance, published operational policies, and verification across the wallets, explorers, and exchanges people already use.
**Current focus:** Phase 3 — Devnet Full Rehearsal (Phase 2 COMPLETE 2026-04-20 with GOV-01, GOV-02, GOV-03 fully closed; GOV-04 devnet arm closed by Plan 02-03, mainnet arm deferred to Phase 4 DEP-04)

## Current Position

Phase: 2 of 7 (Squads Multisig Setup — Devnet + Mainnet) — COMPLETE
Plan: 6 of 6 in current phase COMPLETE (02-06 artifact publication DONE; next phase: Phase 3 Devnet Full Rehearsal)
Status: Phase 2 COMPLETE 2026-04-20. Plan 02-06 closed GOV-03 via docs/security/signer-roster.md v1.1 (commit b89c19d) — all 5 voting-member pubkeys (DwK4842..., G28iLXu..., 5BnDpWn..., HBEqzqW..., KzCZnpm...) + proposer pubkey (2gUjoCG...) populated from artifacts/mainnet.json with role-indexed pseudonyms (cayc-alpha..epsilon + cayc-proposer). No real names. scripts/squads/publish-artifacts.ts (commit 02fc972) is an idempotent artifact-internal-consistency validator: pubkey format, threshold=3, voting_member_count=5, program_id matches SQUADS_V4_PROGRAM_ID, Pitfall 11 clean, creation_tx_signature base58, vault-PDA re-derivation pure-math match. Explicitly documented as NOT an on-chain authority check — GOV-04 mainnet arm remains Phase 4 DEP-04's responsibility (no mainnet mint exists in Phase 2). artifacts/mainnet.json now embeds squads.ceremony_transcript='artifacts/mainnet-sessions/multisig-creation.md'. Phase 2 requirements state: GOV-01 (Plan 02-02), GOV-02 (Plan 02-05), GOV-03 (THIS plan) FULLY CLOSED; GOV-04 PARTIAL (devnet arm closed by Plan 02-03; mainnet arm deferred to Phase 4 DEP-04). Phase 2 Success Criterion 3 MET. Phase 3 (Devnet Full Rehearsal) UNBLOCKED.
Last activity: 2026-04-20 — Plan 02-06 COMPLETE (artifact publication + signer-roster finalization, 9min wall clock). GOV-03 closed. Phase 2 at 6/6 plans. Next phase: Phase 3 Devnet Full Rehearsal.

Progress: [██████████] 100%

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
| Phase 02-squads-multisig-setup-devnet-mainnet P03 | 14min | 3 tasks | 11 files |
| Phase 02-squads-multisig-setup-devnet-mainnet P04 | 7min | 2 tasks | 5 files |
| Phase 02-squads-multisig-setup-devnet-mainnet P05 | 5min | 2 tasks | 3 files |
| Phase 02-squads-multisig-setup-devnet-mainnet P06 | 9min | 2 tasks | 5 files |

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
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Inter-RPC confirmation wait baked into src/squads/proposals.ts: @sqds/multisig RPC helpers use sendTransaction without awaiting confirmation, causing AnchorError 6009 InvalidTransactionIndex when chaining configTransactionCreate → proposalCreate back-to-back. Fix: every lifecycle helper now calls connection.confirmTransaction(sig, 'confirmed') before returning. Phase 4 mainnet mint creation inherits this fix for free.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] rentPayer: proposer is REQUIRED for AddMember configTransactionExecute — voting signers hold ~0.02 SOL (tx fees only) and cannot cover the ~0.002 SOL rent grow. Default rentPayer=executor is only safe for RemoveMember / ChangeThreshold (shrink or no-op). Documented in docs/runbooks/authority-rotation.md.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Pitfall 11 devnet existence proof: throwaway Token-2022 mint J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ with mint+freeze authorities=vault PDA; multisig-signed mintTo of 1_000_000 raw units to recipient ATA succeeded. Negative test captured byte-level failure signature {"InstructionError":[0,{"Custom":4}]} + 'Error: owner does not match' as the prod-monitoring-recognizable failure if Pitfall 11 is ever bypassed. artifacts/devnet.json.devnet_smoke_test.pitfall_11_negative_test_captured: true. GOV-04 devnet arm closed; mainnet arm deferred to Phase 4 DEP-04.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Mainnet preflight gate artifact pattern: read-only script emits artifacts/mainnet-preflight.json with schema { generated_at, commit_sha, overall: 'pass'|'fail', check_count, pass_count, checks: [{ id, description, pass, detail }] }. Plan 02-05 first task reads this and aborts unless overall=pass. Committed pre-ceremony artifact has overall=fail by design (E0 = .env.mainnet missing) — correct signal that 02-05 is blocked.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] API-key hygiene pattern: safeEndpoint(url) in scripts/squads/preflight-mainnet.ts strips query strings (new URL → protocol+host+pathname) before any URL enters an artifact/log/error. Finalize-time regex /api[-_]?key\s*=/i on the serialized JSON refuses to write and exits 2 (distinct from exit 1 overall=fail) — defense-in-depth against future code paths bypassing safeEndpoint(). Template for Plan 02-05 mainnet-ceremony artifact and Plan 02-06 publication artifact.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] Grep-verifiable tradeoff acknowledgement pattern: when a plan overrides a ROADMAP success criterion, acceptance criteria grep for exact literal tokens in committed docs. For the all-Ledger-vs-vendor-diversity override: tokens 'vendor diversity', 'all-Ledger', 'accepted tradeoff' must appear in docs/runbooks/mainnet-squads-ceremony-preflight.md Stage A3 AND docs/security/signer-roster.md §Vendor diversity. Silent edit removing the acknowledgement fails CI.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: [Phase 02] docs/security/ pseudonymous roster pattern: docs/security/signer-roster.md committed with 5 voting + 1 proposer slots; pubkeys left as literal placeholder strings (_filled in Plan 02-06 from mainnet ceremony transcript_) so reviewers see which slots are pending. docs/security/ is excluded from pnpm lang:audit per docs/style-guide.md §8 but still avoids banned terms. Identity-marker grep (real name|given name|surname|first name|last name) must return empty — enforces pseudonymous commitment.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: Plan 02-05 mainnet ceremony EXECUTED 2026-04-20T15:20:16.898Z. Multisig 46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR / Vault PDA CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR / 3-of-5 threshold / tx Dtx1x2kcwicMfo4LVqSjkzBWpjTa4cv7ALj82FMQZTwMFSBuQxmuw9CTDiYpHCkFFCqKUp7eaEYVQFKJzMX5XJs slot 414500481. Preflight 12/12 pass (22min before ceremony). Pitfall 11 clean (byte-level multisig != vault). verify-vault confirmed Threshold 3 of 6 on-chain (5 voting mask=7 + 1 proposer mask=1). GOV-02 CLOSED. Phase 2 Success Criterion 2 verified. Phase 4 mint ceremony inherits vault_pda as mint/freeze/update/Permanent-Delegate authority.
- [Phase 02-squads-multisig-setup-devnet-mainnet]: Plan 02-06 COMPLETE — docs/security/signer-roster.md v1.1 finalized with 5 voting + 1 proposer pubkeys from artifacts/mainnet.json, pseudonyms cayc-alpha..epsilon + cayc-proposer. scripts/squads/publish-artifacts.ts is idempotent artifact-consistency validator (NOT on-chain check). GOV-03 CLOSED. GOV-04 mainnet arm explicitly DEFERRED to Phase 4 DEP-04 (no mainnet mint exists in Phase 2). Phase 2 now 6/6 plans complete.

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
- Plan 02-05 ceremony prerequisites (human-only, must complete BEFORE 02-05): (a) 5 signers update Ledger firmware + Solana app + enable Blind signing; (b) each signer performs metal-plate seed read-back; (c) 5 signer pubkeys captured via encrypted channel; (d) Helius Business tier confirmed, ~20 tx of headroom; (e) proposer mainnet keypair generated + funded >=2 SOL; (f) each of 5 signer pubkeys funded >=0.5 SOL; (g) .env.mainnet populated; (h) pnpm squads:preflight-mainnet -> artifacts/mainnet-preflight.json overall=pass. Enumerated in docs/runbooks/mainnet-squads-ceremony-preflight.md Stages A-E.
- **Plan 02-05 RESOLVED 2026-04-20 (commit 942c731).** Ceremony executed one-shot against Helius mainnet-beta; multisigCreateV2 confirmed slot 414500481. artifacts/mainnet.json written with full squads subobject (multisig 46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR, vault CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR, tx Dtx1x2kcwicMfo4LVqSjkzBWpjTa4cv7ALj82FMQZTwMFSBuQxmuw9CTDiYpHCkFFCqKUp7eaEYVQFKJzMX5XJs, human_confirmation_timestamp 2026-04-20T15:20:14.732Z, preflight_artifact_snapshot 12/12 pass). artifacts/mainnet-sessions/multisig-creation.md transcript 61 lines. .env.mainnet updated in-place (gitignored). verify-vault independently confirmed Threshold 3 of 6, 5 voting members mask=7 + 1 proposer mask=1, config authority all-zero (self-managed). GOV-02 closed. Phase 2 Success Criterion 2 verified. Phase 2 remaining: Plan 02-06 (publish signer roster, GOV-03).
- **Phase 4 mint ceremony inheritance:** vault_pda CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR is the required authority for Phase 4 TOK-01..06 (mint/freeze/update/Permanent-Delegate). artifacts/mainnet.json squads subobject is frozen; Phase 4 appends sibling keys (mint, treasury_ata) via merge-on-write.
- **Plan 02-06 RESOLVED 2026-04-20 (commits 02fc972 + b89c19d).** docs/security/signer-roster.md v1.1 finalized: 5 voting-member pubkeys + 1 proposer pubkey from artifacts/mainnet.json, role-indexed pseudonyms (cayc-alpha..epsilon + cayc-proposer), no real names, vendor-diversity ACCEPTED TRADEOFF preserved, bidirectional cross-links to artifacts/mainnet.json + artifacts/mainnet-sessions/multisig-creation.md, "Note on GOV-04" explicit scope-boundary preserving Phase 4 DEP-04 responsibility. scripts/squads/publish-artifacts.ts idempotent validator: schema check (pubkey format, threshold=3, voting_member_count=5, program_id, no duplicates, proposer not in voting set, Pitfall 11 clean, creation_tx_signature base58) + pure-math vault-PDA re-derivation match via deriveVaultPda/verifyVaultAuthority. Script documents scope ("NOT an on-chain authority check"). artifacts/mainnet.json squads.ceremony_transcript cross-link added; idempotence proven (second run = "already consistent"). GOV-03 CLOSED. Phase 2 Success Criterion 3 MET. Phase 2 at 6/6 plans complete.
- **GOV-04 mainnet arm CARRIED FORWARD to Phase 4 DEP-04.** GOV-04 requires an on-chain check that the production mint's mint/freeze/metadata-update authorities all equal the Squads vault PDA (CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR). No mainnet mint exists in Phase 2 — therefore GOV-04 cannot be closed here. Devnet arm was closed by Plan 02-03 (smoke-test mint on J516PvBz...). Phase 4 DEP-04 plan MUST fetch the production mint account and assert each authority equals vault_pda via verifyVaultAuthority from src/squads/verify.ts. Do NOT mark GOV-04 complete until Phase 4 DEP-04 lands.

## Session Continuity

Last session: 2026-04-20T15:50:16.620Z
Stopped at: Phase 2 COMPLETE (6/6 plans). Plan 02-06 closed GOV-03 via docs/security/signer-roster.md v1.1 (real pubkeys + pseudonyms) + scripts/squads/publish-artifacts.ts (idempotent artifact validator) + artifacts/mainnet.json ceremony_transcript cross-link. GOV-04 mainnet arm explicitly deferred to Phase 4 DEP-04. Phase 3 (Devnet Full Rehearsal) UNBLOCKED.
Resume file: None
