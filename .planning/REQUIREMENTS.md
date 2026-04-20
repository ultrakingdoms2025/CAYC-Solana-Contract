# Requirements: CAYC — Cyber Ape Yacht Club 8G

**Defined:** 2026-04-19
**Core Value:** Users can send and receive CAYC as a trusted USDC-referenced payment token on Solana, backed by transparent multisig governance, published operational policies, and verification across the wallets, explorers, and exchanges people already use.

## v1 Requirements

Requirements for initial launch. Each maps to one roadmap phase.

### Policy & Legal

Pre-launch policy artifacts that establish trust and unblock verification.

- [x] **POL-01**: Verify "CAYC" symbol availability across Jupiter, Solscan, CoinGecko, and CoinMarketCap before metadata is finalized
- [x] **POL-02**: Publish a Mint Policy document (scope, justification, 48-hour pre-announcement / time-lock commitment for any future mint)
- [x] **POL-03**: Publish a Clawback / Freeze Authority Policy (narrow scope: lawful orders + documented theft / scam recovery via multisig vote)
- [x] **POL-04**: Audit all public-facing copy (website, listing applications, CEX applications) for the word "stablecoin" and replace with "branded payments token, USDC-referenced"

### Governance (Squads Multisig)

Authority setup that MUST precede mint creation.

- [ ] **GOV-01**: Create Squads v4 multisig on devnet with devnet-only signers
- [ ] **GOV-02**: Create Squads v4 multisig on mainnet with hardware-wallet signers (Ledger) BEFORE the mainnet mint is created
- [ ] **GOV-03**: Document multisig address, signer pubkeys, threshold, and ceremony transcript as public repo artifacts
- [ ] **GOV-04**: On mainnet, mint authority, freeze authority, and metadata update authority all point to the Squads vault PDA (never an EOA at any point)
- [ ] **GOV-05**: Proactive outreach to Jupiter, Phantom, and RugCheck with the published authority policies before public listing submissions

### Token Configuration (Token-2022 Mint)

Irreversible configuration. Every decision here is permanent after mint init.

- [ ] **TOK-01**: Token-2022 mint initialized with 6 decimals
- [ ] **TOK-02**: Token-2022 Metadata extension initialized with CAYC name, "CAYC" symbol, description, logo URI, and website URL
- [ ] **TOK-03**: Token-2022 Permanent Delegate extension initialized at mint creation, delegate set to Squads vault PDA
- [ ] **TOK-04**: Freeze authority set to Squads vault PDA and retained (not revoked)
- [ ] **TOK-05**: Mint authority retained (uncapped); mint operations gated by the published Mint Policy with 48h pre-announcement
- [ ] **TOK-06**: Initial 500,000,000 CAYC minted to the Squads treasury Associated Token Account in a ceremony separate from mint creation

### Deployment & Validation

Devnet rehearsal is the only gate that catches irreversible-configuration mistakes.

- [ ] **DEP-01**: Full devnet rehearsal with a throwaway mint and devnet Squads multisig — validates ceremony scripts end-to-end
- [ ] **DEP-02**: Second devnet rehearsal using the real launch metadata against a devnet-separate Squads — verifies Solscan devnet rendering before mainnet
- [ ] **DEP-03**: Mainnet launch executed as a documented, logged ceremony with all signers present; transcript committed to repo artifacts
- [ ] **DEP-04**: Post-ceremony verification script confirms mint, freeze, and update authorities all resolve to the Squads vault PDA on-chain

### Operations (Token Capabilities)

Capabilities the user originally asked for — "mint, burn, transfer, change owner" — formalized as multisig-gated operations.

- [ ] **OPS-01**: Capability to mint additional CAYC via Squads multisig under the published Mint Policy
- [ ] **OPS-02**: Capability to burn CAYC via Squads multisig
- [ ] **OPS-03**: Capability to transfer CAYC to arbitrary wallets (standard SPL transfer behavior, usable by any holder)
- [ ] **OPS-04**: Capability to rotate / transfer mint, freeze, and update authorities to a different signer (the "change contract owner" capability)
- [ ] **OPS-05**: Operational runbook covering mint, burn, authority rotation, freeze use, Permanent Delegate use, and incident response ("3am playbook")
- [ ] **OPS-06**: On-chain monitoring / alerts for unexpected mints, authority changes, large transfers, and DEX pool imbalance
- [ ] **OPS-07**: Copycat / phishing monitoring + canonical mint address published across all official channels

### Liquidity (DEX)

Prerequisite for CoinGecko / CoinMarketCap and any CEX.

- [ ] **LIQ-01**: Raydium CPMM pool created with the CAYC / USDC pair on mainnet
- [ ] **LIQ-02**: Initial liquidity depth chosen to sustain CoinGecko thresholds ($50k/day volume target, <1% spread, $500–$1,500 depth in 2% band)
- [ ] **LIQ-03**: LP token handling documented (locked, treasury-held, or other — explicit decision captured at the liquidity phase)

### Verification & Public Listings

- [ ] **VER-01**: Solscan / Solana Explorer token profile submitted with logo, metadata, website, description
- [ ] **VER-02**: Jupiter Verify V3 submission accepted (organic-score path or Express Review via 1,000 JUP burn — whichever the liquidity timeline supports)
- [ ] **VER-03**: CoinGecko listing application submitted after sustained DEX volume meets CoinGecko's thresholds
- [ ] **VER-04**: CoinMarketCap listing application submitted (parallel with CoinGecko)

### CEX Listing Prep

- [ ] **CEX-01**: CEX listing application package prepared — supply proof, multisig proof, authority audit trail, Mint Policy, PD/Freeze Policy, tokenomics summary, compliance disclosures (including explicit "not a stablecoin / no reserves" disclosure)
- [ ] **CEX-02**: At least one CEX listing application submitted (specific CEX target selected during the CEX phase, not pre-committed here)

## v2 Requirements

Acknowledged but deferred; not in the v1 roadmap.

### Advanced Peg Mechanics

- **PEG-01**: Collateralized USDC redemption vault (users deposit USDC → mint CAYC; burn CAYC → redeem USDC)
- **PEG-02**: Proof-of-peg dashboard (on-chain TVL, mint/burn history, reserve ratio if a vault is added)

### Governance Evolution

- **GOV2-01**: Migration path from Squads multisig to DAO / on-chain governance (Realms)
- **GOV2-02**: Signer rotation automation + signer turnover policy

### Payments Integration

- **PAY-01**: Solana Pay integration for merchant checkout
- **PAY-02**: Merchant payment SDK / reference dApp
- **PAY-03**: Off-ramp integrations (Moonpay / Ramp for USDC→CAYC conversion)

### Distribution Tooling

- **DIST-01**: Vesting contracts (Jupiter Lock or custom) for team / advisor allocations
- **DIST-02**: Airdrop tooling

### Cross-chain

- **X-01**: Wormhole / Portal bridge support for CAYC on other chains (subject to Token-2022 + Permanent Delegate compatibility)

### Redundant Liquidity

- **LIQ2-01**: Additional DEX venue (Meteora DAMM v2) as liquidity redundancy

## Out of Scope

Explicitly excluded — documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Public use of "stablecoin" language | GENIUS Act (July 2025) criminal penalties for false stablecoin advertising + MiCA personal liability. CAYC has no reserves. |
| Algorithmic / oracle-based peg mechanism | Explicitly rejected during discovery; soft peg only. Historical algorithmic peg failures (Terra/UST, USR April 2025). |
| Custom Rust / Anchor on-chain program at launch | Standard Token-2022 is sufficient. Adding a custom program increases audit cost and launch risk for no v1 benefit. |
| Token-2022 Transfer Fee extension | Fee-on-transfer tokens create friction with CEX listings and payments UX. |
| Token-2022 Transfer Hook extension | Not needed for launch; also conflicts with some DEX integrations. |
| Token-2022 Confidential Transfers extension | Wrong product shape for a publicly-verifiable payments token. |
| Token-2022 Interest-Bearing extension | Not a yield product. |
| Legacy Raydium AMM v4 or Meteora DAMM v1 | Do not support Token-2022; deployment-blocking. |
| Hard supply cap | User chose uncapped; trust substitute is the published Mint Policy + 48h time-lock. |
| Revoking freeze or Permanent Delegate authority at launch | Retained for compliance and recovery; aligns with regulated-stablecoin precedent. |
| External paid legal counsel review | User-declined for v1; internal policy + public disclosure is the mitigation. Can be revisited pre-mainnet if regulatory signals change. |
| Airdrop at launch | Treasury holds all 500M; distribution decisions made post-launch. |
| Specific CEX target pre-commitment (Binance / Coinbase / Kraken / etc.) | Decided during the CEX phase based on readiness + CoinGecko/CMC status. |

## Traceability

Which phases cover which requirements. Populated by the roadmapper agent.

| Requirement | Phase | Status |
|-------------|-------|--------|
| POL-01 | Phase 1 | Complete |
| POL-02 | Phase 1 | Complete |
| POL-03 | Phase 1 | Complete |
| POL-04 | Phase 1 | Complete |
| GOV-01 | Phase 2 | Pending |
| GOV-02 | Phase 2 | Pending |
| GOV-03 | Phase 2 | Pending |
| GOV-04 | Phase 2 | Pending |
| GOV-05 | Phase 5 | Pending |
| TOK-01 | Phase 4 | Pending |
| TOK-02 | Phase 4 | Pending |
| TOK-03 | Phase 4 | Pending |
| TOK-04 | Phase 4 | Pending |
| TOK-05 | Phase 4 | Pending |
| TOK-06 | Phase 4 | Pending |
| DEP-01 | Phase 3 | Pending |
| DEP-02 | Phase 3 | Pending |
| DEP-03 | Phase 4 | Pending |
| DEP-04 | Phase 4 | Pending |
| OPS-01 | Phase 3 | Pending |
| OPS-02 | Phase 3 | Pending |
| OPS-03 | Phase 3 | Pending |
| OPS-04 | Phase 3 | Pending |
| OPS-05 | Phase 5 | Pending |
| OPS-06 | Phase 5 | Pending |
| OPS-07 | Phase 5 | Pending |
| LIQ-01 | Phase 5 | Pending |
| LIQ-02 | Phase 5 | Pending |
| LIQ-03 | Phase 5 | Pending |
| VER-01 | Phase 5 | Pending |
| VER-02 | Phase 5 | Pending |
| VER-03 | Phase 6 | Pending |
| VER-04 | Phase 6 | Pending |
| CEX-01 | Phase 7 | Pending |
| CEX-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

**Phase distribution:**
- Phase 1 (Foundation): 4 requirements (POL-01..04)
- Phase 2 (Squads Setup): 4 requirements (GOV-01..04)
- Phase 3 (Devnet Rehearsal): 6 requirements (DEP-01, DEP-02, OPS-01..04)
- Phase 4 (Mainnet Ceremony): 8 requirements (TOK-01..06, DEP-03, DEP-04)
- Phase 5 (DEX + Early Verification + Ops): 9 requirements (LIQ-01..03, VER-01, VER-02, GOV-05, OPS-05..07)
- Phase 6 (Broader Listings): 2 requirements (VER-03, VER-04)
- Phase 7 (CEX Prep): 2 requirements (CEX-01, CEX-02)

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-19 after roadmap creation (traceability populated, 35/35 mapped)*
