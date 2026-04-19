# Project Research Summary

**Project:** CAYC -- Cyber Ape Yacht Club 8G Payments Token
**Domain:** Solana Token-2022 soft-pegged branded payments token with Squads v4 multisig governance, multi-platform listing
**Researched:** 2026-04-19
**Confidence:** HIGH (on-chain mechanics, stack versions, Squads flow); MEDIUM (regulatory posture, listing timelines)

---

## USER DECISIONS NEEDED (Pre-Roadmap Blockers)

These 7 items surfaced across all 4 research files. They are not implementation details -- they are decisions that gate or constrain the build order. They must be resolved before requirements finalization.

**1. Stablecoin vs payments token branding -- LEGAL BLOCKER**
The US GENIUS Act (signed July 18, 2025) makes "payment stablecoin" a regulated category with reserve, licensing, AML/KYC, and attestation obligations -- and criminal penalties for false claims. EU MiCA similarly holds management personally liable. PROJECT.md currently uses "stablecoin" throughout. Every public artifact (website, metadata description, listing submissions, social bios) must purge this word before launch. Replace with: "branded payments token," "USDC-pegged utility token," or "ecosystem settlement token." Internal/technical docs may retain the term if labeled clearly as internal.

**2. Permanent Delegate + Freeze authority stacking = dual red flag -- REPUTATION BLOCKER**
RugCheck.xyz flags over 40% of Permanent Delegate tokens as scams. Jupiter Core Working Group publicly called on all wallets and DEXes to warn users on PD tokens. Phantom, Solflare, and Backpack are rolling out or already show warnings. CAYC retains BOTH Permanent Delegate AND Freeze authority. Without a published Clawback/Freeze Policy (defining exact trigger scenarios, governance process, and transparency log commitment) live on the website BEFORE launch, CAYC will be flagged as a scam by automated tools regardless of intent. CEX compliance desks additionally require a written legal memo on these features. Pre-launch outreach to Jupiter Working Group, RugCheck, and Phantom is required to pursue allowlist status rather than flag status.

**3. DEX venue choice is deployment-blocking -- TECHNICAL BLOCKER**
Token-2022 compatibility is not universal. Verified-compatible pool types: Raydium CPMM, Meteora DAMM v2, Orca Whirlpools (subset of extensions). Raydium AMM v4 (classic) does NOT support Token-2022. Meteora DAMM v1 does NOT support Token-2022. This choice gates deployment scripts, treasury LP operations, and Jupiter organic score accumulation. Decision required before Phase 6 scripting begins. Recommendation: Raydium CPMM (broadest Jupiter routing coverage).

**4. Squads multisig MUST be created BEFORE the mint -- BUILD ORDER BLOCKER**
The natural "create mint, then transfer to multisig" flow leaves a single-EOA window with authority over 500M tokens. Even minutes of single-key control is a permanent on-chain record visible to auditors and CEX compliance reviewers forever. The vault PDA must exist first and be used as the mint/freeze/update authority AND Permanent Delegate from the very first initializeMint instruction. This inverts the typical build order and means Squads setup must fully complete before any mainnet mint action.

**5. Uncapped mint is a permanent trust attack surface -- POLICY DECISION REQUIRED**
The USR stablecoin exploit (April 2025) is the reference case: attacker minted 80M uncollateralized tokens, price dropped 86% within hours. Three mitigations in order of preference: (a) revoke mint authority after initial 500M -- eliminates the surface at cost of flexibility; (b) commit publicly to a 48-72h time-lock plus pre-announcement policy for any future mint, backed by Squads execution delays; (c) at minimum, publish a supply policy with a soft-cap commitment before launch. Decision required before Phase 1 policy documents are drafted.

**6. Jupiter submission model changed April 2025 -- PROCESS BLOCKER**
The old GitHub PR to jup-ag/token-list is permanently dead -- that repo was archived April 2025. Current path is Jupiter Verify V3 (verified.jup.ag): tokens earn an organic trading score via community smart-likes, active DEX liquidity, and X account engagement. Standard Review is free with no timeline guarantee. Express Review burns 1,000 JUP and guarantees a review (not approval) within 24 hours. Jupiter verification cannot begin until after DEX liquidity is live and genuine trading volume is established. Any listing runbook using the old PR process is wrong.

**7. CAYC symbol conflict check required before launch -- LAUNCH GATE**
Token names and symbols are not globally unique on Solana; only mint addresses are. If another token already uses "CAYC" on Jupiter, CoinGecko, or CoinMarketCap, listing submissions will conflict and likely be rejected. This check must happen during Phase 0 (Planning), not on launch day. If a conflict exists, a naming decision must be made before metadata is finalized -- metadata fields are immutable after the mint is created.

---

## Executive Summary

CAYC is a Solana Token-2022 branded payments token with a soft peg to USDC and no on-chain reserves, governed by a Squads v4 multisig. It is built using well-documented, battle-tested components (Token-2022 program, Squads v4, spl-token CLI, TypeScript SDK stack) and follows a clear launch path: devnet validation, mainnet ceremony, DEX liquidity seeding, then cascading listing submissions across Jupiter, Solscan, CoinGecko, CoinMarketCap, and at least one CEX. There is no custom on-chain program -- the project uses Token-2022 native extensions (Metadata + Permanent Delegate) and relies on Squads for all authority governance. This is the correct architecture for a v1 payments token launch: minimal audit surface, maximum composability with the existing Solana ecosystem.

The recommended approach is a dependency-ordered, ceremony-based deployment. The project's hardest technical constraint is that Token-2022 extensions are permanent and must be initialized in exact order -- a single error requires abandoning the mint address. This makes devnet end-to-end validation a non-negotiable gate before any mainnet action. The second major constraint is that the Squads multisig must exist and hold all authorities from the first instruction -- not transferred in afterward. Both constraints invert how many teams approach the build order and explain why Squads setup must precede all mainnet mint work. The listing pipeline has its own strict dependency chain: DEX liquidity must precede Jupiter organic score, which must precede CoinGecko/CMC volume thresholds, which must precede CEX listing packages.

The key risks are concentrated in three areas: (1) legal/regulatory -- calling CAYC a "stablecoin" in public artifacts exposes the project to GENIUS Act enforcement; (2) reputation -- Permanent Delegate plus retained freeze without a published policy will cause RugCheck, Phantom, and Jupiter to flag the token automatically; (3) trust -- an uncapped mint authority with no time-lock or pre-announcement commitment gives sophisticated observers no reason to believe future mints will be transparent. All three risks are policy-addressable, not technical, and all three must be resolved before any on-chain work begins. The technical risks (wrong extension init, wrong vault PDA, thin liquidity) are mitigated by the devnet rehearsal requirement and the explicit ceremony script architecture.

---

## Key Findings

### Recommended Stack

The prescriptive stack for CAYC in 2026: Agave CLI 3.1.13 + spl-token CLI 5.x for the mint ceremony; TypeScript with @solana/web3.js@^1.98.4 + @solana/spl-token@^0.4.14 + @solana/spl-token-metadata@^0.1.6 + @sqds/multisig@^2.1.4 for scripted operations; Helius as primary RPC; pnpm 10.x as package manager; Node 20 LTS; TypeScript 5.6.x pinned (not 6.x). Stay on web3.js v1 -- the Squads SDK and spl-token both target v1, and mixing with Kit (v2) creates conflicting types. Squads mainnet web UI handles signer approvals via Ledger; devnet multisig creation must use the SDK (web UI disables devnet creation). For DEX seeding, Raydium CPMM is the recommended default. For testing, solana-bankrun + Vitest handles unit-level extension logic; real devnet is used for full ceremony rehearsals.

**Core technologies:**
- **Agave CLI 3.1.13 + spl-token CLI 5.x**: Mint ceremony execution -- battle-tested, auditable, reference path for Token-2022 one-shot launches
- **@solana/spl-token@^0.4.14**: Token-2022 instruction builders -- extension-aware, canonical JS SDK for MetadataPointer + PermanentDelegate init
- **@solana/spl-token-metadata@^0.1.6**: TokenMetadata extension init/update -- required alongside spl-token for embedded metadata
- **@sqds/multisig@^2.1.4**: Squads v4 TypeScript SDK -- only programmatic path for Squads v4; required for devnet multisig creation and proposal construction
- **Helius RPC (Business tier for mainnet ceremony)**: Priority fee estimation, staked validator routing -- public RPC will drop transactions during ceremony
- **solana-bankrun@^0.4.0 + Vitest@^4.1.4**: Fast unit testing of extension initialization logic without devnet overhead
- **pino@^10.3.1**: Structured ceremony logging -- mainnet ceremony must produce a JSON artifact trail for CEX listing packages

### Expected Features

**Must have (table stakes -- launch is incomplete without these):**
- Token-2022 mint with Metadata + Permanent Delegate extensions, 6 decimals, vault PDA as all authorities from init
- Squads multisig governance with publicly documented ceremony artifacts (mint address, vault PDA, signer count/threshold, tx signatures)
- Website with tokenomics page, soft-peg/no-reserves disclosure, canonical mint address, Clawback/Freeze Policy, and supply policy
- DEX liquidity pool on Token-2022-compatible venue (Raydium CPMM or Meteora DAMM v2), CAYC/USDC pair, LP locked at pool creation
- Jupiter Verify V3 submission (organic score path; Express Review if organic path lags)
- Solscan token update (logo + metadata + reputation update)
- CoinGecko listing (after sustained DEX volume meets $50k/day threshold)
- CoinMarketCap listing (parallel to CoinGecko, same volume requirement)
- Operational runbook for all mint/burn/freeze/rotate operations
- Emergency response plan covering all 9 incident scenarios
- Anti-phishing monitoring (daily scan for copycat mints using "CAYC" name/symbol)

**Should have (within weeks of v1):**
- CEX listing submission package (at least one reputable CEX; MEXC/Bybit/Gate are realistic first targets)
- Jupiter Terminal swap widget embedded on CAYC website
- Proof-of-peg dashboard (live CAYC/USDC price, LP depth, peg deviation history)
- Second DEX pool for price discovery redundancy
- Progressive decentralization roadmap document (plan only, no DAO code)

**Defer to v2+:**
- Solana Pay merchant integration (belongs to the e-commerce project milestone, not token launch)
- Cross-chain bridge via Wormhole (Token-2022 support for new arbitrary tokens not confirmed)
- Collateralized redemption vault (only if sustained peg pressure justifies the compliance cost)
- DAO governance migration
- Merchant dashboard / off-ramp integrations

### Architecture Approach

The architecture has no custom on-chain program -- the system is composed of the Token-2022 program, Squads v4 program, and off-chain TypeScript scripts. The dominant pattern is "script proposes, multisig signs": scripts build Token-2022 instructions wrapped in Squads vault transactions and proposals; signers use the Squads Web UI + Ledger to approve; no private key with authority ever lives in scripts, CI, or a developer machine. The repo separates scripts/ (thin ceremony entrypoints) from src/ (reusable instruction builders), with artifacts/{network}.json as the canonical post-deploy address registry. Two mandatory ceremonies (mint creation and initial 500M mint) are kept separate -- never combined in one proposal.

**Major components:**
1. **CAYC Mint Account** -- Token-2022 program-owned; stores decimals, supply, extension TLV data (MetadataPointer + PermanentDelegate + TokenMetadata); all authorities pointing to Squads vault PDA; permanent after creation
2. **Squads v4 Multisig + Vault PDA** -- Vault PDA is the sole authority on the mint; all production operations flow through Squads proposal approval cycle
3. **Treasury ATA** -- Associated token account owned by the vault PDA; holds the initial 500M CAYC supply; funded via a second Squads ceremony after mint creation is verified
4. **Deployment Scripts + Artifact Registry** -- TypeScript ceremony scripts in scripts/deploy/ and scripts/ops/; artifacts/{network}.json written at deploy time and read by all subsequent scripts; artifacts/mainnet-sessions/ stores timestamped ceremony transcripts for CEX listing evidence
5. **Listing Submission Pipeline** -- Human-assembled from assets/ + artifacts/mainnet.json; generate-submission-pack.ts pre-fills per-portal markdown; each platform submitted in dependency order (DEX -> Jupiter -> Solscan -> CG -> CMC -> CEX)

### Critical Pitfalls

Research identified 16 pitfalls. The top 5 by severity and irreversibility:

1. **Wrong extension set at mint init** -- Token-2022 extensions are permanent; a misconfigured mint requires abandoning the address. Avoid by running a byte-level verified devnet ceremony before mainnet, using @solana/spl-token extension-aware helpers, and getting multi-reviewer sign-off on exact init parameters before any mainnet transaction.

2. **Squads vault PDA vs multisig account address** -- Authorities must point to the vault PDA (derived via getVaultPda(multisigPda, 0)), not the multisig config account. Setting authorities to the multisig account makes them permanently unusable. The only proof this is correct is a successful Squads-signed mint transaction on devnet before mainnet.

3. **Single-EOA authority transfer window** -- Creating the mint with a temporary EOA authority and transferring to Squads afterward creates a single-key window that is a permanent on-chain record and audit liability. The Squads vault PDA must be the authority from initializeMint itself.

4. **Permanent Delegate + Freeze without published policy** -- RugCheck flags over 40% of PD tokens as scams; Phantom and Solflare display warnings. Without a Clawback/Freeze Policy live pre-launch plus proactive outreach to Jupiter/RugCheck/Phantom, the token will be auto-flagged regardless of intent.

5. **Unexpected mint events destroy trust** -- The USR April 2025 incident (80M uncollateralized mint, 86% depeg) shows how fast on-chain monitoring bots and holders react. With an uncapped mint authority, every future mint must be pre-announced with a policy-defined notice period or trust is permanently damaged.

---

## Implications for Roadmap

Research produces a clear 8-phase structure driven by hard dependencies. The critical insight: policy and multisig setup must precede any on-chain work because (a) metadata and extensions are irreversible, (b) the vault PDA must exist before the mint, and (c) legal/compliance posture affects what goes into the mint metadata itself.

### Phase 1: Foundation and Policy

**Rationale:** All downstream phases depend on decisions made here. Metadata is immutable after mint creation, so token description, disclosure language, and supply policy must be finalized before a single on-chain instruction runs.
**Delivers:** Legal copy review complete; Clawback/Freeze Policy document; supply policy document; "CAYC" symbol availability confirmed across Jupiter/CoinGecko/CMC; pre-registered social handles and domains; repo hygiene (.gitignore, gitleaks, secrets-scanning CI configured); finalized token metadata JSON (name, symbol, description, logo URI, website, socials)
**Avoids:** Pitfall 2 (stablecoin legal), Pitfall 3 (PD red flag without policy), Pitfalls 8/9 (uncapped mint trust), Pitfall 12 (symbol squatting), Pitfall 10 (key hygiene)
**Research flag:** Needs legal counsel consultation -- not a technical research problem

### Phase 2: Infrastructure and Stack Setup

**Rationale:** Before writing ceremony scripts, the development environment, RPC access, and code scaffolding must be correct and tested. This phase has no on-chain consequence and is fully reversible.
**Delivers:** Repo scaffolded with src/chain/token22.ts, src/squads/, src/config/, src/signers/; package.json with pinned versions; Helius devnet + mainnet RPC credentials; bankrun unit tests running; gitleaks pre-commit hook active
**Uses:** @solana/web3.js@^1.98.4, @solana/spl-token@^0.4.14, @solana/spl-token-metadata@^0.1.6, @sqds/multisig@^2.1.4, helius-sdk@^2.2.2, solana-bankrun@^0.4.0, tsx@^4.21.0
**Avoids:** Pitfall 10 (hardcoded keys, devnet/mainnet cluster confusion), Pitfall 7 (wrong Token-2022 program ID)
**Research flag:** Standard patterns -- skip research phase

### Phase 3: Squads Multisig Setup (Devnet then Mainnet)

**Rationale:** The vault PDA must exist before the mint. This is the hardest upstream dependency in the entire project. Devnet Squads must be created first via SDK (not web UI), rehearsed with a signer rotation drill, and confirmed working before mainnet ceremony planning begins. Mainnet Squads creation is a physical hardware-wallet ceremony.
**Delivers:** Devnet Squads multisig confirmed working; vault PDA derived and documented; signer rotation drill completed on devnet; all signers on hardware wallets with current firmware; signer diversity audit documented; mainnet Squads multisig created; artifacts pre-populated with vault PDA addresses
**Avoids:** Pitfall 4 (authority transfer window), Pitfall 5 (threshold/signer-loss lockout), Pitfall 11 (vault vs multisig address confusion)
**Research flag:** Squads v4 SDK patterns are well-documented -- skip research phase

### Phase 4: Devnet Token Deployment and Full Ceremony Rehearsal

**Rationale:** Token-2022 extension initialization is irreversible and order-dependent. The only valid proof that the mainnet ceremony will succeed is a byte-verified devnet ceremony that passes all checks. This phase exercises the complete end-to-end flow.
**Delivers:** Devnet mint with confirmed Metadata + PermanentDelegate extensions; vault PDA as all authorities; 500M minted to devnet treasury ATA via Squads; metadata verified across Phantom/Solflare/Backpack/Jupiter/Solscan; all ops scripts tested (propose-mint, propose-burn, propose-freeze, propose-rotate); ceremony runbooks written from observed command sequences; artifacts/devnet.json committed
**Implements:** Network-split config pattern; Script-proposes/Multisig-signs pattern; Artifacts as truth mirror pattern; Ceremony transcript logging pattern
**Avoids:** Pitfall 1 (wrong extension at mint init), Pitfall 6 (extension combination bugs), Pitfall 7 (wrong program ID), Pitfall 11 (vault address), Pitfall 4 (authority transfer window)
**Research flag:** Mint initialization ordering is well-documented but must be devnet-verified before treating as confirmed for mainnet

### Phase 5: Mainnet Launch Ceremony

**Rationale:** The irreversible production deployment. Only runs after Phase 4 is fully clean, all runbooks exist, the status page is live, and legal review is complete. Separated into two distinct ceremonies (mint creation, then initial supply) to allow independent verification.
**Delivers:** CAYC mainnet mint address; extensions confirmed; vault PDA holds all authorities from init; 500M CAYC in treasury ATA; artifacts/mainnet.json committed (append-only from this point); ceremony transcripts in artifacts/mainnet-sessions/; canonical mint address published everywhere (website, socials, Discord topic, Telegram pin)
**Avoids:** Pitfalls 1, 3, 4, 7, 10, 11 (all prevented by Phase 4 rehearsal + runbook discipline)
**Research flag:** Standard execution of rehearsed procedure -- no additional research needed

### Phase 6: DEX Liquidity and Early Listings

**Rationale:** CoinGecko, CMC, and Jupiter all require active DEX liquidity and genuine trading volume as prerequisites. Jupiter organic score takes time to accumulate. LP tokens must be locked at pool creation -- not later -- or DexScreener will flag the token.
**Delivers:** CAYC/USDC pool on Token-2022-compatible DEX (Raydium CPMM recommended); LP tokens locked on-chain at pool creation; DexScreener padlock badge visible; Solscan token update submitted (logo + metadata + socials); Jupiter Verify V3 organic score accumulating; Express Review submitted if organic path lags; Phantom verified badge; anti-phishing monitoring live
**Avoids:** Pitfall 14 (LP rug/thin liquidity), Pitfall 16 (listing rejections from insufficient volume), Pitfall 12 (copycat monitoring)
**Research flag:** Jupiter V3 organic score accumulation timeline for new tokens is not precisely benchmarked -- monitor closely and budget for Express Review (1,000 JUP)

### Phase 7: Broader Listings and CEX Outreach

**Rationale:** CoinGecko and CMC require the DEX volume from Phase 6. CEX listing packages require CG/CMC presence as a baseline signal. This phase has the longest elapsed calendar time due to external review windows (CG: 1-2 weeks, CMC: 2-6 weeks, CEX: highly variable).
**Delivers:** CoinGecko listing accepted (category: Payments or Ecosystem, not Stablecoin); CoinMarketCap listing accepted; CEX listing package assembled; at least one CEX listing accepted; market maker contract engaged for CEX orderbook depth
**Avoids:** Pitfall 2 (stablecoin categorization on CG/CMC), Pitfall 16 (submission sequencing), Pitfall 14 (thin CEX orderbook)
**Research flag:** Individual CEX compliance checklists change frequently -- research each target CEX fresh at time of outreach

### Phase 8: Post-Launch Operations and Ecosystem Expansion

**Rationale:** Ongoing trust maintenance. The uncapped mint, retained authorities, and soft peg all require active stewardship. This is a continuous operational mode, not a discrete milestone.
**Delivers:** On-call rotation operational; supply policy and transparency logs maintained; quarterly signer rotation drills; monitoring and alerting on mint supply changes; status page live; v1.x ecosystem features (Jupiter Terminal widget, proof-of-peg dashboard, second DEX pool); groundwork for Solana Pay merchant integration
**Avoids:** Pitfall 8 (unexpected mint), Pitfall 9 (live mint authority), Pitfall 12 (ongoing copycat), Pitfall 13 (freeze authority misuse), Pitfall 15 (no incident runbook)
**Research flag:** Monitoring/alerting tooling pricing and availability -- validate at phase start

### Phase Ordering Rationale

- **Policy before code** -- Legal language and supply decisions feed directly into immutable on-chain metadata. Reversing this order produces permanent technical debt that cannot be fixed without abandoning the mint address.
- **Squads before mint** -- The vault PDA derivation is the prerequisite; there is no workaround or remediation path if this order is reversed.
- **Devnet rehearsal is not optional** -- The combination of Permanent Delegate, MetadataPointer, and TokenMetadata extensions has a well-documented failure rate on first attempt. Devnet is the only catch mechanism.
- **Two mainnet ceremonies, not one** -- Separating mint creation from initial supply mint limits blast radius and allows independent verification of each milestone.
- **Listing submissions are sequenced, not parallel** -- Jupiter requires DEX volume. CoinGecko requires Jupiter-level signals. CMC requires CG-level data. CEX requires CMC. Submitting before prerequisites triggers cooldown timers that delay all subsequent steps by weeks.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Legal classification of CAYC under GENIUS Act / MiCA -- requires counsel consultation; regulatory exposure is confirmed but specific advisory response to the CAYC fact pattern requires legal expertise
- **Phase 6:** Jupiter V3 organic score -- scoring methodology partially documented but actual accumulation timelines for new tokens are not well-benchmarked
- **Phase 7:** CEX listing requirements -- individual CEX compliance checklists change frequently; each target CEX requires fresh research at time of outreach

Phases with well-documented patterns (skip research phase):
- **Phase 2:** Stack setup -- all versions live-verified; implementation is straightforward
- **Phase 3:** Squads v4 SDK -- official docs and examples cover exact flows; devnet-only creation gotcha already documented
- **Phase 5:** Mainnet ceremony -- execution of rehearsed procedure; no new research needed at that point

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions pulled live from npm registry 2026-04-19; Agave CLI from GitHub releases; Token-2022 program ID and extension semantics stable since 2023 per official Solana docs |
| Features | HIGH | Table stakes verified against official listing platform documentation (Jupiter Verify V3, Solscan guideline, CoinGecko methodology, CMC criteria); DEX Token-2022 compatibility verified against Raydium/Meteora docs |
| Architecture | HIGH | Token-2022 extension init ordering verified against official Solana docs + multiple independent sources; Squads v4 SDK flow verified against official docs + SDK README + examples repo; Jupiter V3 process confirmed via GitHub repo archive state |
| Pitfalls | HIGH (technical) / MEDIUM (regulatory) | Technical pitfalls (extension ordering, vault PDA, LP locking) verified against official sources; regulatory exposure (GENIUS Act, MiCA) verified against official legislation but specific legal interpretation requires counsel |

**Overall confidence:** HIGH for technical implementation; MEDIUM for regulatory posture and listing timeline forecasts

### Gaps to Address

- **CAYC symbol conflict**: Must verify "CAYC" is not in active use on Jupiter/CoinGecko/CMC before finalizing metadata -- cannot confirm absence from research alone because new tokens launch continuously
- **Initial LP depth sizing**: The $50k/day CoinGecko volume threshold is a listing gate, but the treasury budget for initial LP seeding is a business decision outside research scope
- **Specific CEX target selection**: Deferred in PROJECT.md; requires research on which CEXes have listed comparable tokens (payments-branded, Token-2022, retained freeze authority) and have realistic listing timelines
- **Audit scope decision**: Research confirms a lightweight deployment audit ($20k-40k) materially improves CEX listing odds -- the go/no-go needs an explicit decision before Phase 5
- **Wormhole Token-2022 support**: Cross-chain bridge availability for arbitrary new Token-2022 tokens with PermanentDelegate is MEDIUM confidence -- treat as unconfirmed until partnership/compatibility check is done
- **CMC exact 2026 form fields**: Confirmed at MEDIUM confidence only; re-verify immediately before Phase 7 submission

---

## Sources

### Primary -- HIGH confidence (live-verified 2026-04-19)

- npm registry -- version queries for all packages listed in STACK.md
- github.com/anza-xyz/agave releases -- Agave CLI v3.1.13 stable
- docs.anza.xyz/cli/install -- Agave CLI install path and version channels
- spl.solana.com/token-2022 + solana.com/docs/tokens/extensions -- Token-2022 extension reference
- solana.com/developers/guides/token-extensions/permanent-delegate -- PermanentDelegate init ordering
- solana.com/developers/guides/token-extensions/metadata-pointer -- TokenMetadata inline pattern
- docs.squads.so/main -- Squads v4 SDK overview, vault PDA usage, mainnet/devnet UI distinction
- verified.jup.ag + developers.jup.ag/docs/tokens/verification -- Jupiter Verify V3 process
- info.solscan.io/solscan-token-update-guideline -- Solscan token update requirements
- coingecko.com/en/methodology -- CoinGecko listing criteria
- support.coinmarketcap.com/hc/en-us/articles/360043659351 -- CMC listing criteria
- docs.raydium.io/raydium/pool-creation/pool-types-overview -- Raydium CPMM Token-2022 support confirmation
- congress.gov/bill/119th-congress/senate-bill/1582/text -- GENIUS Act legislation
- federalregister.gov/documents/2026/04/10/2026-06963 -- FinCEN NPRM on PPSI AML/CFT and Sanctions
- federalregister.gov/documents/2026/04/10/2026-06974 -- FDIC NPRM on GENIUS Act Requirements
- github.com/jup-ag/token-list -- confirmed archived April 2025 (old GitHub PR path dead)

### Secondary -- MEDIUM confidence

- blog.triton.one/intro-to-the-new-solana-kit -- Kit migration context supporting web3.js v1 recommendation
- helius.dev/blog -- RPC provider context, bankrun testing guide, Solana stablecoin landscape analysis
- rareskills.io/post/token-2022 -- extension composition reference
- chainstack.com/solana-token-2022-metadata -- TokenMetadata variable-length behavior
- dev.to/ohmygod/solanas-permanent-delegate-burn-scam -- 2026 PD scam factory analysis; RugCheck 40% flag rate source
- coinmarketcap.com/academy/article/usr-stablecoin -- USR 80M uncollateralized mint, 86% depeg reference case
- lw.com/en/insights/the-genius-act -- Latham and Watkins GENIUS Act analysis
- bvnk.com/blog/global-stablecoin-regulations-2026 -- GENIUS plus MiCA regulatory summary
- stakepoint.app/solana-lp-locker -- LP locking mechanism reference
- discuss.jup.ag/t/faq-token-list-v3-verification -- Jupiter V3 verification mechanism, organic score methodology
- nftevening.com -- Solana co-founder court-controlled freeze context (April 2026 Drift incident)
- medium.com/@dexarea/why-updating-token-2022-metadata-often-fails -- MetadataPointer requirement in practice

---

*Research completed: 2026-04-19*
*Ready for roadmap: yes -- pending resolution of 7 User Decisions listed above*
