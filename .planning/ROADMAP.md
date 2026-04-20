# Roadmap: CAYC — Cyber Ape Yacht Club 8G

## Overview

CAYC launches as a Solana Token-2022 branded payments token governed by a Squads v4 multisig. The journey is dependency-ordered: policy and legal artifacts first (because Token-2022 metadata and extensions are irreversible after mint init), then multisig setup (because the Squads vault PDA must be the authority from the very first instruction — no EOA window), then devnet end-to-end rehearsal (the only gate that catches irreversible-configuration mistakes), then the mainnet ceremony (two separate proposals: mint creation, then initial 500M supply), then DEX liquidity and early verification (Solscan, Jupiter), then the broader listing cascade (CoinGecko, CoinMarketCap), and finally CEX listing prep. Every phase respects the hard ordering constraints surfaced by research: policy before code, Squads before mint, devnet before mainnet, DEX before CoinGecko/CMC, and CoinGecko/CMC before CEX.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation — Policy, Legal, Dev Environment** - Publish policy artifacts, confirm symbol availability, audit language, and scaffold the repo with pinned tooling before any on-chain code runs. **COMPLETE 2026-04-19** — all 4 plans shipped, all 4 POL requirements closed.
- [x] **Phase 2: Squads Multisig Setup (Devnet + Mainnet)** - Stand up Squads v4 multisigs with hardware-wallet signers on both networks so the vault PDA exists before any mint instruction. **COMPLETE 2026-04-20** — all 6 plans shipped; GOV-01, GOV-02, GOV-03 fully closed; GOV-04 devnet arm closed (Plan 02-03), mainnet arm deferred to Phase 4 DEP-04.
- [ ] **Phase 3: Devnet Full Rehearsal** - Execute the complete ceremony end-to-end on devnet twice (throwaway metadata, then real launch metadata) and exercise every token operation via the devnet multisig.
- [ ] **Phase 4: Mainnet Launch Ceremony** - Execute the production mint ceremony in two separate Squads proposals (mint creation, then initial 500M supply) with full transcript artifacts.
- [ ] **Phase 5: DEX Liquidity, Early Verification & Ops Go-Live** - Seed locked CAYC/USDC liquidity on Raydium CPMM, submit Solscan + Jupiter Verify, conduct wallet/explorer outreach, and activate ongoing monitoring + runbooks.
- [ ] **Phase 6: Broader Listings (CoinGecko + CoinMarketCap)** - Submit CG and CMC listings once sustained DEX volume meets platform thresholds.
- [ ] **Phase 7: CEX Listing Prep & Submission** - Assemble the CEX listing package (supply proof, multisig proof, policies, disclosures) and submit to at least one reputable CEX.

## Phase Details

### Phase 1: Foundation — Policy, Legal, Dev Environment
**Goal**: Every immutable decision downstream (metadata fields, public positioning, authority model) is locked to a published, legally-reviewed source of truth before any on-chain instruction runs.
**Depends on**: Nothing (first phase)
**Requirements**: POL-01, POL-02, POL-03, POL-04
**Success Criteria** (what must be TRUE):
  1. Anyone visiting the CAYC website can read the Mint Policy (scope, justification, 48-hour pre-announcement / time-lock commitment) and the Clawback / Freeze Authority Policy (narrow scope: lawful orders + documented theft/scam recovery via multisig vote).
  2. The "CAYC" symbol has been checked against Jupiter, Solscan, CoinGecko, and CoinMarketCap; either no conflict exists or a naming decision is documented before metadata is finalized.
  3. No public-facing artifact (website, listing draft, CEX application draft, social bios) uses the word "stablecoin"; every instance has been replaced with "branded payments token, USDC-referenced."
  4. The repo is scaffolded with pinned versions (Agave CLI 3.1.13, @solana/web3.js 1.98.4, @solana/spl-token 0.4.14, @sqds/multisig 2.1.4), gitleaks pre-commit active, `.gitignore` blocks keypairs, and Helius RPC credentials are configured per-network in `.env` (never committed).
**Plans**: 4 plans
- [x] 01-01-PLAN.md — Symbol availability check across Jupiter, Solscan, CoinGecko, CoinMarketCap (POL-01)
- [x] 01-02-PLAN.md — Repo scaffold: pinned package.json, .gitignore, gitleaks pre-commit, per-network .env examples, directory structure (POL-02 + POL-03 + POL-04 substrate)
- [ ] 01-03-PLAN.md — Draft Mint Policy + Clawback/Freeze Authority Policy v1.0 (POL-02, POL-03)
- [ ] 01-04-PLAN.md — Language & Disclosure Style Guide + CI language-audit check (POL-04)

**Canonical refs (required reading for downstream agents):**
- `.planning/PROJECT.md` — Constraints section + Key Decisions table
- `.planning/research/SUMMARY.md` — USER DECISIONS NEEDED items 1, 2, 5, 7
- `.planning/research/STACK.md` — Installation + package.json pins
- `.planning/research/PITFALLS.md` — Pitfall 2 (stablecoin), Pitfall 3 (PD policy), Pitfall 8/9 (uncapped mint), Pitfall 10 (key hygiene), Pitfall 12 (symbol squatting)
- `.planning/research/FEATURES.md` — Flags Raised #1, #6, #7 (disclosure wording)

### Phase 2: Squads Multisig Setup (Devnet + Mainnet)
**Goal**: Both the devnet and mainnet Squads v4 multisigs exist with hardware-wallet signers, the vault PDAs are derived and documented, and signer rotation has been rehearsed — all BEFORE any mint instruction is built.
**Depends on**: Phase 1
**Requirements**: GOV-01, GOV-02, GOV-03, GOV-04
**Success Criteria** (what must be TRUE):
  1. A devnet Squads v4 multisig has been created via the `@sqds/multisig` SDK (web UI disables devnet creation), vault PDA derived via `getVaultPda(multisigPda, 0)`, and a signer rotation drill has been executed end-to-end.
  2. A mainnet Squads v4 multisig exists with a 3-of-5-minimum threshold, signers on geographically and device-diverse hardware wallets (mixed vendors where possible), each signer funded with ≥ 0.5 SOL, seed phrases cold-stored separately from devices.
  3. The mainnet multisig address, vault PDA, signer pubkeys, threshold, and ceremony transcript are committed as public repo artifacts in `artifacts/mainnet.json` and `docs/security/signer-roster.md` (role + pseudonym only, no real names).
  4. A byte-level plan exists for mainnet mint creation that uses the Squads **vault PDA** (not the multisig config account) as mint/freeze/update authority AND Permanent Delegate — verified by a successful multisig-signed mint transaction on devnet.
**Plans**: 6 plans
- [x] 02-01-PLAN.md — Squads v4 helper module (src/squads/) + devnet signer-generator + vault verifier (substrate for all GOV requirements)
- [x] 02-02-PLAN.md — Devnet Squads v4 multisig creation via SDK + vault PDA derivation + artifacts/devnet.json (GOV-01)
- [x] 02-03-PLAN.md — Devnet rotation drill (add/remove signer) + multisig-signed smoke-test mint proving vault-PDA authority wiring (GOV-04 devnet arm)
- [x] 02-04-PLAN.md — Mainnet ceremony preflight runbook + pseudonymous signer-roster template + automated preflight script (GOV-02, GOV-03 prereq)
- [x] 02-05-PLAN.md — Mainnet Squads v4 multisig creation ceremony [HUMAN CHECKPOINT — 5 humans + hardware wallets required] (GOV-02)
- [x] 02-06-PLAN.md — Artifact publication: finalize signer-roster.md with pubkeys, validate artifacts/mainnet.json, cross-link ceremony transcript (GOV-03)

**Canonical refs:**
- `.planning/research/ARCHITECTURE.md` — System Overview, Pattern 2 (Script-Proposes/Multisig-Signs), Build Order table items 3-4
- `.planning/research/STACK.md` — Squads v4 Web UI vs SDK distinction
- `.planning/research/PITFALLS.md` — Pitfall 4 (authority transfer window), Pitfall 5 (threshold/signer lockout), Pitfall 11 (vault vs multisig address)

### Phase 3: Devnet Full Rehearsal
**Goal**: The exact mainnet ceremony (mint creation + initial 500M supply + every ongoing token operation) has been executed end-to-end on devnet twice, with metadata rendering verified across all target wallets and explorers.
**Depends on**: Phase 2
**Requirements**: DEP-01, DEP-02, OPS-01, OPS-02, OPS-03, OPS-04
**Success Criteria** (what must be TRUE):
  1. A devnet mint exists with Token-2022 MetadataPointer + TokenMetadata + PermanentDelegate extensions initialized in the correct order, 6 decimals, and the devnet Squads vault PDA set as mint/freeze/update authority and Permanent Delegate from `initializeMint` itself (no EOA window).
  2. A second devnet rehearsal has been run with the real launch metadata (final name, symbol, description, logo URI, website URL) and verified to render correctly on Phantom, Solflare, Backpack, Jupiter, and Solscan devnet views.
  3. The 500M devnet supply has been minted to a devnet treasury ATA in a **separate Squads proposal** from mint creation, not combined into one transaction.
  4. Every ongoing token capability has been exercised via the devnet multisig: additional mint (gated by Mint Policy), burn, standard SPL transfer, and authority rotation (mint/freeze/update transferred to a different signer and back). All four operations produce successful multisig-signed transactions.
  5. `artifacts/devnet.json` is committed with mint address, vault PDA, treasury ATA, authority hashes, and ceremony transcripts; `scripts/deploy/verify-mint.ts` confirms on-chain state matches `src/config/token-config.ts` exactly.
**Plans**: 7 plans
- [ ] 03-01-PLAN.md — Logo resize + metadata JSON + src/config/token-config.ts single source of truth
- [ ] 03-02-PLAN.md — scripts/deploy/verify-mint.ts + unit tests (on-chain state vs token-config assertion)
- [ ] 03-03-PLAN.md — Arweave + GitHub raw metadata hosting for rehearsal JSONs (DEP-01/02 prereq)
- [ ] 03-04-PLAN.md — Rehearsal 1 (throwaway metadata) devnet mint via Squads proposal (DEP-01)
- [ ] 03-05-PLAN.md — Rehearsal 2 (locked launch metadata) + 500M supply in SEPARATE proposal + wallet-render verification (DEP-02)
- [ ] 03-06-PLAN.md — OPS drill: additional mint (OPS-01), burn (OPS-02), transfer (OPS-03), authority rotation (OPS-04)
- [ ] 03-07-PLAN.md — Phase 3 artifact validator + REHEARSAL-SUMMARY.md aggregator (Phase 4 readiness gate)

**Canonical refs:**
- `.planning/research/ARCHITECTURE.md` — Pattern 3 (Mint Init Ordering), Flow B (Devnet Ceremony), Anti-Pattern 4 (don't combine ceremonies)
- `.planning/research/PITFALLS.md` — Pitfall 1 (wrong extensions), Pitfall 6 (extension combination bugs), Pitfall 7 (wrong program ID), Pitfall 11 (vault address)
- `.planning/research/FEATURES.md` — Feature Dependencies graph (metadata renders consistently)

### Phase 4: Mainnet Launch Ceremony
**Goal**: The CAYC mainnet mint exists in its final, irreversible state, with all 500M CAYC in the Squads treasury ATA and a complete, publishable ceremony transcript — executed as two separate Squads proposals for independent verification.
**Depends on**: Phase 3
**Requirements**: TOK-01, TOK-02, TOK-03, TOK-04, TOK-05, TOK-06, DEP-03, DEP-04
**Success Criteria** (what must be TRUE):
  1. A mainnet Token-2022 mint exists with 6 decimals, MetadataPointer + TokenMetadata + PermanentDelegate extensions initialized at mint creation, the Squads vault PDA set as mint/freeze/update authority AND Permanent Delegate from `initializeMint`, and freeze authority retained (not revoked).
  2. The TokenMetadata extension contains the final CAYC name, "CAYC" symbol, description, logo URI, and website URL — readable via `getTokenMetadata` and rendering correctly on Phantom, Solflare, Backpack, Jupiter, and Solscan.
  3. Exactly 500,000,000 CAYC have been minted to the Squads treasury Associated Token Account in a **second, separate** Squads proposal (distinct from mint creation).
  4. `scripts/deploy/verify-mint.ts --network mainnet` confirms mint authority, freeze authority, and metadata update authority all resolve to the Squads vault PDA on-chain; `artifacts/mainnet.json` is committed as the append-only source of truth mirror.
  5. A timestamped ceremony transcript (proposer address, signers present, proposal addresses, tx signatures, simulated-vs-executed state diffs) is committed under `artifacts/mainnet-sessions/` — ready for CEX listing evidence packages.
**Plans**: TBD

**Canonical refs:**
- `.planning/research/ARCHITECTURE.md` — Flow C (Mainnet Ceremony), Anti-Pattern 4 (ceremony separation principle)
- `.planning/research/STACK.md` — Network & RPC Strategy (Helius Business for ceremony)
- `.planning/research/PITFALLS.md` — Pitfall 1, 3, 4, 7, 10, 11 (all mitigated by Phase 3 rehearsal + runbook discipline)

### Phase 5: DEX Liquidity, Early Verification & Ops Go-Live
**Goal**: CAYC is tradeable on Raydium CPMM with locked liquidity, has verified badges on Solscan and Jupiter, has proactive allowlist outreach completed with the major wallets and scam-flaggers, and has operational runbooks and monitoring live — the "3am playbook" is active, not deferred.
**Depends on**: Phase 4
**Requirements**: LIQ-01, LIQ-02, LIQ-03, VER-01, VER-02, GOV-05, OPS-05, OPS-06, OPS-07
**Success Criteria** (what must be TRUE):
  1. A CAYC/USDC pool exists on Raydium CPMM with initial liquidity depth sized for CoinGecko's $50k/day volume threshold, <1% bid-ask spread, and $500–$1,500 of depth inside the 2% band; LP token handling (locked, treasury-held, market-maker-paired, or other) is explicitly decided and documented.
  2. The Solscan token page at `solscan.io/token/<mint>` displays the final logo, metadata, website, and description (not the generic icon) via an accepted `solscan.io/token-update` submission, and Jupiter Verify V3 has accepted the submission (via organic score or Express Review, whichever the timeline supports).
  3. Proactive outreach to Jupiter Working Group, Phantom, and RugCheck has been completed **with the published Mint Policy and Clawback/Freeze Policy URLs** — documented responses or allowlist confirmations are filed in the repo.
  4. A monitoring stack (Helius webhooks or equivalent) alerts within minutes on unexpected mints, authority changes, large transfers, or DEX pool imbalance, routing to on-call; a copycat / phishing watchlist scans Solscan + DexScreener + RugCheck daily and the canonical CAYC mint address is published across all official channels (website, socials, Discord topic, Telegram pin).
  5. Every runbook in `docs/runbooks/` is written (mint, burn, authority rotation, freeze use, Permanent Delegate use, signer compromise, signer loss, unexpected mint, peg break, copycat, freeze complaint, legal inquiry) and has been tabletop-exercised at least once.
**Plans**: TBD

**Canonical refs:**
- `.planning/research/ARCHITECTURE.md` — Flow D (Listing Submissions), Flow E (Post-Launch Operations)
- `.planning/research/FEATURES.md` — Feature Dependencies graph (listings cascade), Anti-phishing hygiene
- `.planning/research/PITFALLS.md` — Pitfall 3 (PD flag), Pitfall 12 (copycats), Pitfall 13 (freeze misuse), Pitfall 14 (LP rug / thin liquidity), Pitfall 15 (no incident runbook), Pitfall 16 (listing submission sequencing)

### Phase 6: Broader Listings (CoinGecko + CoinMarketCap)
**Goal**: CAYC is listed and accurately categorized on CoinGecko and CoinMarketCap once sustained DEX volume meets each platform's thresholds — not before, because premature submission triggers rejection cooldowns that delay all downstream work by weeks.
**Depends on**: Phase 5
**Requirements**: VER-03, VER-04
**Success Criteria** (what must be TRUE):
  1. The Raydium CAYC/USDC pool has sustained ≥ $50k daily volume with < 1% spread for long enough that CoinGecko and CoinMarketCap reviewers see a credible trading history.
  2. A CoinGecko listing has been accepted under the "Payments" or "Ecosystem Token" category (explicitly **not** "Stablecoin") with accurate circulating supply, multisig authority disclosure, working website, and canonical mint address.
  3. A CoinMarketCap listing has been accepted (submitted in parallel with CoinGecko), with the same category discipline and the same canonical artifacts.
  4. The public CoinGecko and CoinMarketCap listings include a prominent "not a reserve-backed stablecoin / soft peg only" disclosure consistent with the POL-04 language audit.
**Plans**: TBD

**Canonical refs:**
- `.planning/research/FEATURES.md` — Feature Dependencies graph (CG requires sustained volume; CMC requires CG signals)
- `.planning/research/PITFALLS.md` — Pitfall 2 (stablecoin categorization), Pitfall 16 (listing submission sequencing)
- `.planning/research/ARCHITECTURE.md` — Flow D (Listing Submissions, items 3 and 4)

### Phase 7: CEX Listing Prep & Submission
**Goal**: The CEX listing package is assembled from the artifact trail of Phases 4–6 and submitted to at least one reputable CEX whose compliance posture accepts freeze-authority + Permanent Delegate tokens with published policies.
**Depends on**: Phase 6
**Requirements**: CEX-01, CEX-02
**Success Criteria** (what must be TRUE):
  1. A CEX listing application package exists as a single assembled bundle containing: supply proof (500M in treasury ATA with on-chain Solscan link), multisig proof (Squads mainnet address + vault PDA + threshold + signer count), authority audit trail (`artifacts/mainnet.json` + `artifacts/mainnet-sessions/`), the published Mint Policy, the published Clawback/Freeze Policy, tokenomics summary, and compliance disclosures including the explicit "not a stablecoin / no reserves" disclosure.
  2. A specific CEX target has been selected (decided at the CEX phase, not pre-committed) based on: acceptance of retained freeze authority + Permanent Delegate, CoinGecko/CMC listing as a prerequisite filter met, and realistic listing timelines for a payments-positioned Token-2022 asset.
  3. At least one CEX listing application has been submitted, acknowledged by the CEX, and is either under review or has been accepted — with any requests for additional documentation satisfied from the existing artifact trail.
**Plans**: TBD

**Canonical refs:**
- `.planning/research/FEATURES.md` — Feature Dependencies graph (CEX requires CG+CMC+multisig artifacts), Competitor Feature Analysis
- `.planning/research/PITFALLS.md` — Pitfall 3 (CEX reviewers on PD+freeze), Pitfall 14 (market maker for CEX orderbook)
- `.planning/research/ARCHITECTURE.md` — Flow D (Listing Submissions, item 6)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation — Policy, Legal, Dev Environment | 4/4 | Complete | 2026-04-19 |
| 2. Squads Multisig Setup (Devnet + Mainnet) | 6/6 | Complete | 2026-04-20 |
| 3. Devnet Full Rehearsal | 0/7 | Not started | - |
| 4. Mainnet Launch Ceremony | 0/TBD | Not started | - |
| 5. DEX Liquidity, Early Verification & Ops Go-Live | 0/TBD | Not started | - |
| 6. Broader Listings (CoinGecko + CoinMarketCap) | 0/TBD | Not started | - |
| 7. CEX Listing Prep & Submission | 0/TBD | Not started | - |

---
*Roadmap created: 2026-04-19*
*Granularity: standard (7 phases)*
*Coverage: 35/35 v1 requirements mapped*
