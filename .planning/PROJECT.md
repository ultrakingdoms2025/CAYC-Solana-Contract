# CAYC — Cyber Ape Yacht Club 8G

## What This Is

CAYC is a Solana Token-2022 stablecoin designed to serve as the payments / e-commerce rail for an upcoming Cyber Ape Yacht Club project. It is soft-pegged to USDC (branding and market-liquidity targeted, not collateralized), governed by a Squads multisig, and aimed at verified listings across major Solana wallets, block explorers, DEXes, and at least one CEX.

## Core Value

Users can send and receive CAYC as a trusted USDC-branded payment token on Solana, backed by transparent multisig governance and verified across the wallets, explorers, and exchanges people already use.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Deploy a Token-2022 mint for CAYC with 6 decimals and 500,000,000 initial supply
- [ ] All 500M tokens minted to the Squads treasury multisig at launch (no pre-allocation to other wallets)
- [ ] Squads multisig holds mint authority, freeze authority, and metadata update authority
- [ ] Token-2022 Metadata extension enabled with CAYC name, symbol, description, logo URI, website URL
- [ ] Token-2022 Permanent Delegate extension enabled at mint creation (centralized recovery)
- [ ] Freeze authority retained (not revoked) for compliance scenarios
- [ ] Mint additional tokens beyond the initial 500M via multisig (uncapped — no hard cap enforced)
- [ ] Burn tokens via multisig
- [ ] Transfer CAYC to arbitrary wallets (standard SPL transfer behavior)
- [ ] Rotate / transfer mint, freeze, and update authorities to a different signer (change "contract owner")
- [ ] Full devnet deployment validated end-to-end before mainnet
- [ ] Mainnet launch via multisig ceremony with documented artifacts (mint address, authority hashes, signers)
- [ ] Jupiter Verified Token List submission accepted
- [ ] Solscan / Solana Explorer listing with logo, metadata, and verified branding
- [ ] CoinGecko listing accepted
- [ ] CoinMarketCap listing accepted
- [ ] DEX liquidity seeded on a major Solana DEX (Raydium / Orca / Meteora — specific venue TBD)
- [ ] CEX listing package prepared (legal disclosures, multisig proof, audit trail, mint/supply documentation)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Collateralized USDC-backed redemption vault — out of scope for v1; the peg is intentional branding only, not on-chain reserves. Could become a future milestone once liquidity/trust is established.
- Algorithmic / oracle-based peg mechanisms — explicitly rejected; soft peg only.
- Custom Rust / Anchor program for the mint — standard Token-2022 extensions are sufficient; adding a custom program increases audit cost and launch risk for no v1 benefit.
- Token-2022 Transfer Fee extension — rejected; fee-on-transfer tokens create friction with CEX listings and with payments use cases.
- Vesting / cliff contracts — not needed since the entire 500M goes to the treasury multisig; vesting can be applied downstream by the treasury if/when distributing.
- DAO / on-chain governance program for authorities — multisig is sufficient for v1; DAO is a future decentralization milestone.
- Specific CEX selection (Binance / Coinbase / Kraken / Bybit / MEXC) — deferred until listing prep phase; listing generically targets "at least one reputable CEX."
- Staking, rewards, or yield mechanics — separate protocol, not a v1 concern.
- Airdrop mechanics — treasury may distribute later, but airdrop tooling is out of scope for the launch itself.

## Context

- **Pre-deployment project.** Empty repository. Greenfield build with no prior Solana code in this directory.
- **Upcoming project dependency.** CAYC is being built ahead of an e-commerce / payments project that will consume it; launch readiness matters more than raw feature depth.
- **Ecosystem state (2025–2026).** Token-2022 is the stable, recommended standard for new Solana token launches. Squads v4 is the dominant multisig on Solana. Jupiter, Solscan, CoinGecko, and CoinMarketCap all publish documented verification/listing processes.
- **Known peg tension.** Pegging a token to USDC without a collateral / redemption mechanism means price will float with market liquidity. This is accepted for v1 but is the most likely source of "why isn't it exactly $1?" questions. The Out of Scope section makes this explicit.
- **Assets on hand.** Logo, website URL, and token description copy are ready for metadata upload and listing submissions.
- **Security posture.** User explicitly wants multisig control before mainnet. Freeze authority and Permanent Delegate are retained to support compliance and recovery scenarios — a deliberate centralization tradeoff chosen over maximum trustlessness.

## Constraints

- **Tech stack**: Solana mainnet, Token-2022 program (no legacy SPL), Squads Protocol multisig — Standard stack for modern Solana stablecoin-style launches.
- **Standard**: Token-2022 only — Locked; legacy SPL Token is explicitly rejected.
- **Decimals**: 6 — Locked; matches USDC for clean 1:1 pricing math and CEX expectations for stablecoin-positioned assets.
- **Initial supply**: 500,000,000 CAYC — Locked by user.
- **Supply cap**: None (uncapped mint authority) — Locked; additional minting must pass through the multisig.
- **Authorities**: Squads multisig only (no EOA holding mint/freeze/update in production) — Locked for mainnet.
- **Freeze authority**: Retained — Locked; aligns with regulated-stablecoin precedent (USDC/USDT).
- **Extensions (permanent)**: Metadata + Permanent Delegate enabled at mint init. No transfer fee, no transfer hook. — Locked; Token-2022 extensions cannot be added or removed after mint creation.
- **Custom programs**: None at launch — Scope constraint; avoids audit cost and deployment risk.
- **Peg model**: Soft peg / branding only; no on-chain reserve — Locked for v1.
- **Launch path**: Devnet end-to-end validation required before mainnet — Safety constraint.
- **Timeline**: Quality-first; no external deadline — Budget constraint (time can be spent on verification, security, and listing quality).

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Token-2022 over legacy SPL | Unlocks metadata + Permanent Delegate natively; aligns with modern tooling and CEX expectations | — Pending |
| 6 decimals (match USDC) | Clean 1:1 math against USDC peg; expected convention for stablecoin-positioned assets | — Pending |
| Squads multisig for all authorities | Industry-standard security on Solana; de facto requirement for serious CEX listings | — Pending |
| Retain freeze authority | Compliance-friendly; USDC/USDT both retain freeze; needed to satisfy regulated CEX reviews | — Pending |
| Enable Permanent Delegate extension | Enables centralized recovery for scam/theft incidents; consistent with regulated-stablecoin posture | — Pending |
| No custom Anchor program at launch | Lower audit cost, faster launch, battle-tested path via stock Token-2022 | — Pending |
| Uncapped supply (mint authority kept alive) | Flexibility for future ecosystem expansion; treasury-controlled via multisig | — Pending |
| Soft peg only (no collateral vault) | Scope-limits v1 to a token launch; redemption vault deferred to a future milestone | — Pending |
| All 500M to treasury multisig at launch | Simplest, most auditable initial state; downstream distribution decided later | — Pending |
| Devnet → Mainnet path (skip testnet) | Testnet adds little value for SPL tokens; devnet is the standard validation target | — Pending |
| Reject Transfer Fee extension | Fee-on-transfer tokens create friction with CEX listings and with payments UX | — Pending |

---
*Last updated: 2026-04-19 after initialization*
