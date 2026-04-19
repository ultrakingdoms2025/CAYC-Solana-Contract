# Feature Research

**Domain:** Solana Token-2022 soft-pegged "branded payments" token launch (CAYC)
**Researched:** 2026-04-19
**Confidence:** MEDIUM-HIGH (listing requirements, multisig practice, DEX compatibility verified via current 2025-2026 sources; some items — e.g., Wormhole Token-2022 native-transfer support for arbitrary new tokens — remain MEDIUM)

---

## Feature Landscape

### Table Stakes (Launch will fail or stall without these)

These are non-negotiable. Missing any one of them makes CAYC look either untrustworthy or invisible to the users and exchanges you're targeting.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Token-2022 Metadata extension populated** (name, symbol, description, logo URI, website, socials) | Required by Solscan, Jupiter, Phantom to even render a recognizable token. "Unknown token" kills trust instantly. | LOW | Already in scope. Use Metaplex-compatible JSON off-chain metadata pinned to a stable host (IPFS/Arweave/CDN with long URL lifespan). |
| **Jupiter Verify submission** (verified.jup.ag) | Jupiter's verified list is replicated by Phantom and most wallets. Without it, users see "unverified token" warnings. In the current V3 (VRFD) system, Express Verification costs **1000 JUP**, burned to a multisig; Standard is free but no timeline. | LOW-MED | Submit *after* mint creation and metadata is final. Prepare to explain the "soft peg, no reserves" story — Jupiter CAT (Certainty/Alignment/Transparency) reviewers will ask. |
| **Solscan token update submission** (Solscan token-update form) | Solscan is the dominant Solana block explorer. Only the official form is reviewed; third-party channels are ignored. Free standard; paid 24h-SLA tier available. | LOW | Submit Reputation Update + Social Links & Logo Update. Links must be live at submission time. |
| **Phantom verified badge** (inherited from Jupiter Verify) | Phantom is the default wallet for most Solana users; "verified" is the purple checkmark next to the token name. Phantom explicitly replicates Jupiter's verified list. | LOW | Falls out automatically once Jupiter Verify succeeds. No separate Phantom submission needed. |
| **DEX liquidity pool with USDC pair** (Raydium or Meteora DAMM v2) | No DEX pool = no on-chain price = not listable on CoinGecko / CMC / Birdeye / DexScreener. USDC pair is required for a USDC-branded token (users will look for CAYC/USDC first). | MEDIUM | **Token-2022 compatibility gotcha:** Meteora DAMM v1 does NOT support Token-2022. Use Meteora DAMM v2 or Raydium CPMM (Raydium AMM v4 classic does not support Token-2022 either). Orca Whirlpools supports Token-2022 with limited extensions. |
| **Initial liquidity depth** (sized for >$50k daily volume support) | CoinGecko minimum: **$50k/day volume, spread <1% between best bid/ask, $500-$1500 of depth inside 2% spread**. CMC requires Tier-1/Tier-2 exchange listing with verified volume. Thin liquidity = listing rejection. | MEDIUM | Budget meaningfully for initial LP (treasury-provided or external market maker). Under-seeding is the #1 reason stablecoin-positioned launches stall at listing phase. |
| **CoinGecko listing application** | CG review takes 2-6+ weeks. Requires: accurate circulating supply, verifiable exchange volume, clear ownership, working website, whitepaper/docs, team info, socials. | MEDIUM | Apply *after* DEX pool is seeded and has ~1 week of live trading data. Submitting early = rejection. |
| **CoinMarketCap listing application** | CMC requires: listing on tracked Tier-1/Tier-2 exchange with API feed, working block explorer (Solscan covers this), working website. 2-4 week review. CMC-side fee is $0. | MEDIUM | Apply after CG or in parallel. Requires the same artifacts as CG. |
| **Logo + brand assets** (SVG/PNG, 512x512 min, uploaded to official sources) | Every listing form asks for logo URL. A broken/low-res logo is an instant rejection signal. | LOW | Already "assets on hand" per PROJECT.md. Host on a stable URL (not a free Imgur-style host — it WILL 404 in 6 months and break listings). |
| **Public tokenomics documentation** (website page, not just a tweet) | CG/CMC/CEX reviewers and users all look for: total supply, circulating supply, mint authority holder, freeze authority holder, extensions enabled, distribution plan. Missing = "rug-adjacent" signal. | LOW | Should explicitly disclose: 500M initial, uncapped mint via multisig, Squads-controlled, Metadata + Permanent Delegate extensions enabled, freeze authority retained, soft-peg-not-collateralized. |
| **Multisig ceremony transparency artifacts** (public doc with mint address, Squads multisig PDA, signer count & threshold, tx signatures for deployment) | Serious CEX reviewers and sophisticated investors ask for this. Squads transactions are on-chain and auditable; publishing the signatures lets anyone verify the chain of custody. | LOW-MED | Squads protocol is formally verified, audited (OtterSec, Neodyme, Bramah), and open-source — leverage that reputation in the disclosure. Include Solscan links to each ceremony tx. |
| **Anti-phishing hygiene: reserve symbol on exchanges + monitor copycats** | Scammers mint Token-2022 copies with identical name/symbol within hours of a notable launch. Users then trade fakes on DEX aggregators. Standard mitigation: submit "CAYC" symbol pre-emptively to all major wallet/explorer trust lists, monitor Solscan + DexScreener + RugCheck for clones. | LOW-MED | Ongoing operational burden, not one-time. Keep a watchlist and a takedown template (report-to-Solscan, report-to-Jupiter, report-to-Phantom). |
| **Operational runbook** (mint/burn/freeze/authority-rotation procedures via Squads) | Needed internally for repeatable, safe post-launch ops. Also a CEX diligence item — reviewers want to see you're not ad-hoc clicking buttons in production. | MEDIUM | Include: pre-tx checklist, signer-sanity-check ("are you on the right network, right mint?"), post-tx verification steps, emergency escalation contacts. |
| **Emergency response plan** (compromised key, drain exploit, phishing wave) | Standard CEX diligence. Plan must answer: who calls the freeze decision? how fast can we rotate mint authority? what's the public comms template? | MEDIUM | Pre-approve freeze-authority trigger scenarios so counsel-approved response is possible in minutes, not days. Pre-stage authority-rotation instructions for the multisig so a compromised key can be removed quickly. |
| **"Not a reserve-backed stablecoin" disclosure** (prominent on website + listing submissions) | **This is the single biggest risk flag.** Post-GENIUS Act (2025-2026), "stablecoin" is a regulated term in the US. Calling CAYC a "stablecoin" without reserves invites regulatory attention and CEX listing rejection. | MEDIUM | **Flag for user decision — see "Flags raised" section below.** The word "stablecoin" in branding may need to be replaced with "USDC-pegged utility token," "branded payments token," or similar. |

### Differentiators (Nice-to-have, feature-depth for CAYC's ecosystem role)

Features that advance CAYC's payments/e-commerce goal without being mandatory for the *launch* itself.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Solana Pay integration** (merchant-facing SDK + payment-request URIs) | Directly addresses CAYC's stated core value: "payments rail for the Cyber Ape Yacht Club e-commerce project." Solana Pay has Shopify integration out of the box. | MEDIUM | Solana Pay works with any SPL-like token; Token-2022 support exists but validate permanent-delegate behavior doesn't break merchant refunds. Defer to a post-launch milestone. |
| **Merchant dashboard / reference dApp** (accept CAYC, see balances, withdraw to USDC) | Drives actual utility. Without this, CAYC is "a token with a logo" — not a payments system. | HIGH | Scope it as a separate milestone after token launch is stable. |
| **Off-ramp integration** (Moonpay/Ramp/Transak fiat→CAYC, or USDC↔CAYC swap widget) | Reduces onboarding friction for non-crypto-native buyers on the e-commerce project. | MEDIUM-HIGH | Fiat on-ramp providers will want KYC, reserve disclosures, and risk reviews — tied to the "stablecoin vs utility token" positioning decision. |
| **CAYC/USDC swap widget** embedded on CAYC site (Jupiter Terminal) | Lets holders trade at the advertised peg through *your* site instead of a random UI. Reinforces the peg narrative visually. | LOW | Jupiter Terminal is a drop-in iframe/JS widget. Trivial to embed once CAYC is Jupiter-verified. |
| **Proof-of-peg dashboard** (real-time CAYC/USDC price + LP depth, maybe history) | Substitute for "proof of reserves" that you can't offer (since there are no reserves). Shows the peg is being actively defended by liquidity rather than claimed by trust. | MEDIUM | Builds credibility. Can be built from Jupiter price API + DEX LP queries. |
| **Cross-chain bridge availability** (Wormhole / Portal) | Lets CAYC exist on EVM chains. Useful if the e-commerce project is multi-chain. | HIGH (not self-serve) | Wormhole natively supports SPL including many stablecoins, but **Token-2022 support for arbitrary new tokens is not confirmed in public docs** — treat as research-required, not available-by-default. Likely requires partnership outreach. |
| **Transfer Hook extension** for compliance checks (geofencing, sanctions screening, KYC'd-wallet gating) | Forward-looking for payments-to-regulated-merchants scenarios. RWA-style compliance. | HIGH + PERMANENT | **CRITICAL:** Token-2022 extensions cannot be added after mint creation. Decision is locked at launch. PROJECT.md already locks this to NO; this entry confirms that's the right call — adding Transfer Hooks later is impossible, and enabling them now blocks Confidential Transfers and many DEX pools. |
| **DAO governance migration path** (documented plan to transfer authorities to on-chain governance later) | Counteracts centralization criticism ("multisig = they can freeze me"). Just the *plan* — not the implementation — is valuable for listing reviewers. | LOW (plan only) | Write a "Progressive Decentralization Roadmap" doc. Don't actually ship DAO in v1. |
| **Gasless / paymaster transactions** (sponsored SOL fees for new users) | Huge UX win for merchant/e-commerce flows where buyers don't hold SOL. Especially valuable if onboarding fiat users. | HIGH | Defer. Useful for v1.x of the payments app, not the token launch. |
| **Token snapshot / airdrop tooling** | For rewarding early holders or the Cyber Ape community. | MEDIUM | PROJECT.md explicitly out-of-scope. Keep it out — treasury can do ad-hoc distributions via multisig. |
| **Confidential Transfers extension** | Privacy for payment amounts. | HIGH + PERMANENT | **Locked OUT:** Token-2022 extensions cannot be added after mint. Also incompatible with Transfer Hooks. Not in scope per PROJECT.md; correct call. |
| **Interest-bearing extension** | N/A — CAYC is soft-pegged, not yield-bearing. | — | Correctly excluded. Adding it would break the $1 peg narrative. |

### Anti-Features (Deliberately do NOT build)

Features that sound reasonable for a "stablecoin" but actively hurt CAYC's goals.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Transfer Fee extension** (fee-on-transfer) | "We could capture value on every trade!" | Blocks major CEX listings (Binance/Coinbase explicitly reject FoT tokens). Breaks Solana Pay merchant flows (refund/partial-refund math gets weird). Breaks many DEX aggregator routes. | None needed. Already correctly rejected in PROJECT.md. |
| **Algorithmic peg mechanism** (supply expansion/contraction to hold $1) | "Keep the price stable without reserves!" | Documented history of catastrophic failure (UST/LUNA, etc.). Wake Forest Law Review literally titled "Built to Fail." Would get CAYC delisted from CoinGecko's main stablecoin category and flagged as high-risk. | Honest "soft peg / market-defended" positioning. Seed the USDC pool deeply; arbitrage holds the peg. |
| **Collateralized redemption vault** in v1 | "Real stablecoin backing = trust." | Massively expands scope: smart contract audit, legal entity for reserves, bank/custodian relationship, attestation process, GENIUS Act PPSI registration (if US-facing). Not feasible in launch timeline. | Ship soft peg in v1 with honest disclosure. Revisit vault as a future milestone once volume justifies the compliance burden. |
| **Custom Anchor program at launch** | "We need unique logic!" | $60k-$180k audit cost (2026 Solana audit pricing). Months of review. Token-2022 stock extensions cover 95% of what most issuers actually need. | Ship Token-2022 with Metadata + Permanent Delegate. Revisit only if a specific business requirement cannot be met otherwise. |
| **Vesting contracts for initial distribution** | "Lock up team tokens." | Not applicable — 100% of the 500M goes to the treasury multisig at launch. The multisig *is* the vesting control. | None. Treasury-multisig-with-documented-distribution-plan is the answer. |
| **Staking / yield mechanics on CAYC itself** | "Reward holders." | Adds a second protocol with its own audit + regulation burden. Also creates an implicit "expectation of profit" — bad news under US securities analysis. | Keep CAYC as pure payments rail. Rewards belong in the e-commerce project's loyalty layer. |
| **Airdrop tooling at launch** | "Marketing!" | Distracts from launch stability. Attracts farmers and short-term sell pressure. PROJECT.md correctly out-of-scope. | Treasury can distribute later via multisig if/when strategic. |
| **Branded as "stablecoin" in US-facing copy** | It's the obvious word. | **NEW FLAG:** Post-GENIUS Act (2025-2026), "payment stablecoin" is a regulated term. Using it without being a Permitted Payment Stablecoin Issuer invites regulatory and CEX-listing problems. | Use "USDC-pegged utility token," "branded payments token," or "ecosystem token for Cyber Ape Yacht Club" in user-facing copy. Reserve "stablecoin" for internal/technical descriptions. |

---

## Feature Dependencies

```
[Token-2022 mint deployed on mainnet]
    └──requires──> [Devnet end-to-end validated]
    └──requires──> [Squads multisig created and funded with SOL]
    └──requires──> [Metadata JSON hosted at stable URL]

[Metadata extension populated]
    └──requires──> [Logo uploaded to stable host]
    └──requires──> [Website live with tokenomics page]

[DEX liquidity pool seeded]
    └──requires──> [Mint deployed]
    └──requires──> [Treasury holds CAYC + USDC for LP]
    └──requires──> [DEX confirmed Token-2022-compatible] (Raydium CPMM or Meteora DAMM v2)

[Jupiter Verify submission]
    └──requires──> [Mint deployed + metadata populated]
    └──requires──> [DEX pool exists] (Jupiter routes through it)
    └──enables────> [Phantom verified badge] (automatic)

[Solscan verified reputation]
    └──requires──> [Metadata populated]
    └──requires──> [Website + socials live]

[CoinGecko listing]
    └──requires──> [DEX pool with >$50k/day volume, <1% spread, $500-1500 depth in 2% band]
    └──requires──> [~1 week of trading history on a tracked venue]
    └──requires──> [Solscan metadata verified]
    └──requires──> [Public tokenomics doc + whitepaper]

[CoinMarketCap listing]
    └──requires──> [Tier-1/Tier-2 exchange listing with API feed]
    └──requires──> [Block explorer support] (Solscan covers this)
    └──requires──> [~same data bundle as CG]

[CEX listing package]
    └──requires──> [Legal disclosure on soft-peg / no-reserves status]
    └──requires──> [Multisig ceremony artifacts]
    └──requires──> [Emergency response runbook]
    └──requires──> [Already listed on Jupiter + CG + CMC] (most CEX reviewers check these first)

[Anti-phishing monitoring]
    └──enhances──> [All of the above] (protects the brand continuously)

[Transfer Hook extension] ──CONFLICTS with──> [Confidential Transfers extension]
[Transfer Fee extension] ──CONFLICTS with──> [CEX listings + Solana Pay refund flows]
[All Token-2022 extensions] ──CONFLICTS with──> [Changing your mind later] (permanent at mint creation)
```

### Dependency Notes

- **Listings cascade:** Jupiter Verify → Phantom badge → Solscan verified → DEX pool with real volume → CoinGecko → CoinMarketCap → CEX. Skipping a step breaks the next one. CEX reviewers in particular use CG/CMC presence as a filter.
- **DEX choice gates Token-2022 support:** Not all DEXes on Solana support Token-2022. Raydium CPMM (not AMM v4 classic) and Meteora DAMM v2 (not v1) are the currently-verified compatible pool types. Orca Whirlpools supports a subset of extensions. This is a deployment-blocking decision; verify against chosen DEX's current docs at mainnet-launch time.
- **Extension selection is permanent:** Token-2022 extensions are set at mint creation and cannot be added, removed, or toggled later. PROJECT.md has this correctly locked to Metadata + Permanent Delegate only.
- **Liquidity threshold cascade:** CoinGecko's $50k daily volume minimum isn't a suggestion — it's a listing gate. Under-seeded LP → no volume → no CG listing → no CMC → no CEX. Treasury must plan for sustained LP, not just a token-launch splash.
- **Compliance posture gates CEX reach:** The more CAYC presents as a "stablecoin" (vs. "branded utility token"), the more GENIUS Act / FinCEN / OFAC scrutiny applies, and the more US-regulated CEXes require evidence of PPSI status or a clear carve-out.

---

## MVP Definition

### Launch With (v1 — the milestone currently scoped)

The minimum state at which CAYC exists as a credible, tradeable, discoverable token.

- [ ] Token-2022 mint deployed on mainnet with 500M supply to Squads treasury
- [ ] Metadata + Permanent Delegate extensions enabled; freeze authority retained
- [ ] Squads multisig holds mint/freeze/update authorities, ceremony publicly documented
- [ ] Logo + JSON metadata hosted on stable URL
- [ ] Website live with tokenomics page + **soft-peg/no-reserves disclosure**
- [ ] DEX liquidity pool seeded on Raydium CPMM or Meteora DAMM v2 (Token-2022-compatible venue)
- [ ] Jupiter Verify submission accepted (gets Phantom badge automatically)
- [ ] Solscan token update submitted + verified reputation status
- [ ] CoinGecko listing submitted (once LP has sustained volume)
- [ ] CoinMarketCap listing submitted (same)
- [ ] Operational runbook written (mint/burn/freeze/rotate via Squads)
- [ ] Emergency response plan written (compromised key, drain, phishing)
- [ ] Anti-phishing watchlist established (CAYC symbol + lookalikes across Solscan/Jupiter/DexScreener)

### Add After Validation (v1.x)

Add once the token is listed, tradeable, and the peg is holding.

- [ ] CEX listing submission (pick target CEX after CG/CMC are live — MEXC/Bybit/Gate are typically easier first targets than Binance/Coinbase)
- [ ] Jupiter Terminal swap widget embedded on CAYC website
- [ ] Proof-of-peg dashboard (live CAYC/USDC price, LP depth, historical peg deviation)
- [ ] Solana Pay integration for merchant checkout (connects to the e-commerce project)
- [ ] Second DEX pool for redundancy (diversify across Raydium + Meteora so one DEX outage doesn't break price discovery)

### Future Consideration (v2+)

Defer until the e-commerce project is live and CAYC has real usage data.

- [ ] Merchant dashboard / SDK
- [ ] Off-ramp integrations (Moonpay / Ramp)
- [ ] Cross-chain bridge (Wormhole) — requires Token-2022 compatibility confirmation and likely a partnership
- [ ] Collateralized redemption vault — only if the peg is under persistent pressure and market volume justifies the compliance cost
- [ ] DAO governance migration — only after the multisig-controlled phase has proven trustworthy and the community is large enough to participate
- [ ] Gasless / paymaster UX
- [ ] Loyalty / rewards system (belongs in the e-commerce project, not the token)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Token-2022 mint + metadata + Permanent Delegate | HIGH | LOW | **P1** |
| Squads multisig ceremony + public artifacts | HIGH | LOW-MED | **P1** |
| Website + tokenomics page + soft-peg disclosure | HIGH | LOW | **P1** |
| DEX liquidity pool (Raydium CPMM / Meteora DAMM v2) | HIGH | MED | **P1** |
| Jupiter Verify submission | HIGH | LOW | **P1** |
| Solscan token metadata submission | HIGH | LOW | **P1** |
| Operational runbook + emergency response plan | HIGH | MED | **P1** |
| Anti-phishing monitoring | MED-HIGH | LOW (ongoing) | **P1** |
| CoinGecko listing | HIGH | MED | **P1** (post-LP) |
| CoinMarketCap listing | HIGH | MED | **P1** (post-LP) |
| CEX listing (at least one) | HIGH | MED-HIGH | **P2** |
| Jupiter Terminal swap widget | MED | LOW | **P2** |
| Proof-of-peg dashboard | MED | MED | **P2** |
| Solana Pay merchant integration | HIGH (for e-commerce goal) | MED | **P2** (next milestone) |
| Cross-chain bridge | LOW-MED at launch | HIGH | **P3** |
| Progressive decentralization / DAO plan doc | MED (for reviewers) | LOW (doc only) | **P2** |
| Off-ramp integrations | MED | MED-HIGH | **P3** |
| Merchant SDK / dashboard | HIGH (for e-commerce) | HIGH | **P3** (separate milestone) |

**Priority key:**
- **P1** — Must land in v1. Launch is incomplete without it.
- **P2** — Should land within weeks of v1. Adds credibility and utility.
- **P3** — Future milestones. Do not let them grow v1 scope.

---

## Flags Raised (user hasn't decided but should, before mainnet)

The research surfaced these items that are NOT currently covered by PROJECT.md but are likely to bite the launch. Flag each for explicit user decision.

1. **"Stablecoin" branding vs. GENIUS Act exposure.** The US **GENIUS Act (2025, with FinCEN/OCC/FDIC rulemaking running into June 2026)** treats "permitted payment stablecoin issuers" as regulated financial institutions with reserve, disclosure, AML/CFT, and sanctions-compliance obligations. Calling CAYC a "stablecoin" in US-facing copy without being a registered PPSI creates regulatory risk and is a well-known CEX-listing red flag. **Recommended:** replace "stablecoin" in user-facing copy with "USDC-pegged utility token" or "branded payments token." Keep "soft-pegged" terminology internal/technical.
   - **Decision needed from user:** how to phrase CAYC externally on website, exchange submissions, and social media.

2. **Where will 500M of treasury CAYC go long-term, and is there a public distribution plan?** CG/CMC reviewers and CEX diligence teams ALL ask "who holds the tokens and what happens to them?" A treasury holding 100% of supply is fine at genesis but looks centralized/risky forever unless paired with a public plan (even a rough one: X% for liquidity, Y% for partners, Z% held in reserve, no sales before date D).
   - **Decision needed from user:** write a 1-page "Distribution Plan" doc, even if it's preliminary, before launch.

3. **Initial DEX liquidity depth & who funds it.** CoinGecko requires $50k daily volume with $500-1500 depth in a 2% band. If treasury seeds the LP alone, it's locked-up value that can be rug-signal-flagged. If an external market maker funds it, that's a partnership/fee conversation that needs to happen *before* launch day.
   - **Decision needed from user:** LP funding source (treasury-only, market-maker-partnered, or hybrid) and target initial depth in USDC.

4. **Which specific DEX for the initial pool?** PROJECT.md lists "Raydium / Orca / Meteora — TBD." This choice is deployment-blocking because Token-2022 support varies by pool type. Recommend **Raydium CPMM** or **Meteora DAMM v2** as the two currently-verified compatible options. Classic Raydium AMM v4 and Meteora DAMM v1 will NOT work.
   - **Decision needed from user:** pick one now; it affects deployment scripts and liquidity ops.

5. **Symbol squatting defense.** A token launch at this profile will attract copycat mints within hours. Recommend pre-filing "CAYC" symbol reservations / flags with Solscan, Jupiter, DexScreener, RugCheck, and Phantom BEFORE the real mint goes public, so fake mints can be reported faster.
   - **Decision needed from user:** designate an ops owner for the anti-phishing watchlist.

6. **Permanent Delegate disclosure.** The Permanent Delegate extension lets the multisig move any holder's tokens without signature. This is a deliberate compliance/recovery design choice, but some users and some CEX reviewers see it as a red flag without explicit disclosure. Put it on the tokenomics page in plain English: "Permanent Delegate is enabled and held by the Squads multisig; it exists to support recovery from theft or compliance orders. By holding CAYC you consent to this power."
   - **Decision needed from user:** approve disclosure wording.

7. **Freeze authority disclosure.** Similar story to above. USDC/USDT both retain freeze, so this is precedented — but disclose it explicitly.
   - **Decision needed from user:** approve disclosure wording (likely combined with #6).

8. **Audit scope.** PROJECT.md correctly avoids a custom Anchor program, which dodges most of the audit cost. But CEX reviewers and sophisticated investors may still ask "who audited the deployment process?" Consider a lightweight security review of the multisig setup + metadata JSON + deployment scripts by a reputable Solana security firm (2026 pricing: low-end Token-2022-focused reviews start around $20k-40k). Not mandatory but materially improves CEX listing odds.
   - **Decision needed from user:** security review yes/no, and at what scope.

9. **Terms of Service / Privacy Policy / Risk Disclosures on website.** Expected by CG/CMC/CEX reviewers. Must include: jurisdiction restrictions (likely: no US, or US with big disclaimers, or US-only with PPSI framing), peg-failure risk language, smart-contract risk, freeze-authority & permanent-delegate powers, no warranty of redemption.
   - **Decision needed from user:** commission ToS / Privacy / Risk disclosures from counsel.

10. **Monitoring & alerting on the mint itself.** Once live, you want automated alerts on: mint authority transactions, freeze authority transactions, supply changes, large transfers, LP depth dropping below X, peg deviation > Y%. Off-the-shelf: Hellomoon, Solscan alerts, Helius webhooks, or custom on Squads webhook events.
   - **Decision needed from user:** pick a monitoring stack for launch day + ongoing ops.

---

## Competitor Feature Analysis

Comparing CAYC's position against reference Solana stablecoin / branded-token launches.

| Feature | USDC (Circle) | USDG (Paxos) | JupUSD (Ethena+Jupiter) | sUSD (interest-bearing) | **CAYC (our approach)** |
|---------|---------------|--------------|-------------------------|-------------------------|-------------------------|
| Peg mechanism | Collateral, 1:1 USD | Collateral, MAS-regulated | Collateral, Ethena reserves | T-bill backed, interest via multiplier | **Soft peg / market-defended via LP** |
| Token standard | Token-2022 | Token-2022 | Token-2022 | Token-2022 w/ extensions | Token-2022 |
| Freeze authority | Retained (Circle) | Retained (Paxos) | Retained | Retained | **Retained (Squads multisig)** |
| Permanent Delegate | Enabled | Enabled | Enabled | Enabled | **Enabled (Squads multisig)** |
| Governance | Centralized corporate | Centralized corporate | Partnership | Protocol + operator | **Multisig (Squads), progressive-decentralization plan documented** |
| Proof-of-reserves | Monthly attestation | Monthly attestation + MAS oversight | Ethena reserves reporting | On-chain T-bill multiplier | **N/A — no reserves; proof-of-peg dashboard substitutes** |
| Transfer Fee extension | No | No | No | No | **No (correctly rejected)** |
| Transfer Hook | No | No | No | No | **No (permanently out per PROJECT.md)** |
| Confidential Transfers | No | No | No | No | **No (permanently out per PROJECT.md)** |
| DEX primary pair | USDC/* | USDG/USDC | JupUSD/USDC | sUSD/USDC | **CAYC/USDC (Raydium CPMM or Meteora DAMM v2)** |
| CEX presence | Every major exchange | Growing | Planned | DeFi-native | **Target: ≥1 reputable CEX** |
| Core differentiator | Liquidity & regulation | MAS regulation (Singapore) | Jupiter ecosystem integration + collateral | Yield-bearing | **Payments rail for a specific e-commerce ecosystem; Cyber Ape brand; USDC-pegged UX for branded payments** |

**Takeaway:** CAYC is deliberately positioned *below* the regulated-stablecoin tier (no reserves, no PPSI registration) and *above* the memecoin tier (multisig governance, verified listings, payments utility). This is a coherent "branded payments utility token pegged for UX reasons" position — but it requires honest disclosure to avoid being mistaken for a reserve-backed stablecoin. The word choice in external copy is the key risk control.

---

## Sources

- [Jupiter token verification docs](https://developers.jup.ag/docs/tokens/verification) — HIGH confidence (official)
- [Jupiter Verify portal (VRFD)](https://verified.jup.ag/) — HIGH (official)
- [Jupiter token-list repo](https://github.com/jup-ag/token-list) — HIGH (official)
- [Solscan Token Update Guideline](https://info.solscan.io/solscan-token-update-guideline/) — HIGH (official)
- [Solscan Update Token Details docs](https://docs.solscan.io/integration/update-token-details) — HIGH (official)
- [CoinGecko Methodology](https://www.coingecko.com/en/methodology) — HIGH (official)
- [CoinMarketCap Listings Criteria](https://support.coinmarketcap.com/hc/en-us/articles/360043659351-Listings-Criteria) — HIGH (official)
- [CoinMarketCap Category-Specific Listings Criteria](https://support.coinmarketcap.com/hc/en-us/articles/360045595471-Category-Specific-Listings-Criteria) — HIGH (official)
- [Phantom verified vs unverified tokens help doc](https://help.phantom.com/hc/en-us/articles/38425812822419-Understanding-verified-and-unverified-tokens-in-Phantom) — HIGH (official)
- [Solana Token Extensions guides](https://solana.com/solutions/token-extensions) — HIGH (official)
- [Solana Transfer Hook extension guide](https://solana.com/developers/guides/token-extensions/transfer-hook) — HIGH (official)
- [Squads multisig docs](https://docs.squads.so/main) — HIGH (official)
- [Squads advanced security best practices](https://docs.squads.so/main/additional-resources/advanced-security-best-practices) — HIGH (official)
- [Helius: Solana's Stablecoin Landscape](https://www.helius.dev/blog/solanas-stablecoin-landscape) — MEDIUM (industry analysis)
- [Zerion: Solana Stablecoins Complete 2025 Guide](https://zerion.io/blog/solana-stablecoins-the-complete-guide/) — MEDIUM (industry analysis)
- [The Block: Ethena + Jupiter JupUSD launch](https://www.theblock.co/post/373734/ethena-and-jupiter-partner-to-launch-native-solana-stablecoin-jupusd) — MEDIUM (news)
- [Solana Pay official](https://solanapay.com/) — HIGH (official)
- [Solana Pay x Shopify docs](https://commercedocs.solanapay.com/) — HIGH (official)
- [CoinGecko listing criteria analysis](https://listing.help/coingecko-listing-cost/) — MEDIUM (third-party, verified against CG Methodology)
- [CoinMarketCap listing criteria analysis](https://listing.help/coinmarketcap-listing-requirements/) — MEDIUM (third-party, verified against CMC criteria page)
- [Meteora DAMM v2 + Token-2022 compatibility](https://20lab.app/blog/add-liquidity-to-meteora/) — MEDIUM (third-party but current)
- [Create Token-2022 liquidity pool on Solana](https://smithii.io/en/create-liquidity-pool-token-2022/) — MEDIUM (third-party, current)
- [GENIUS Act text (S.1582, 119th Congress)](https://www.congress.gov/bill/119th-congress/senate-bill/1582/text) — HIGH (official legislation)
- [FinCEN NPRM on PPSI AML/CFT & Sanctions (Apr 2026)](https://www.federalregister.gov/documents/2026/04/10/2026-06963/permitted-payment-stablecoin-issuer-anti-money-launderingcountering-the-financing-of-terrorism) — HIGH (official rulemaking)
- [FDIC NPRM GENIUS Act Requirements (Apr 2026)](https://www.federalregister.gov/documents/2026/04/10/2026-06974/genius-act-requirements-and-standards-for-fdic-supervised-permitted-payment-stablecoin-issuers-and) — HIGH (official rulemaking)
- [Latham & Watkins GENIUS Act analysis](https://www.lw.com/en/insights/the-genius-act-of-2025-stablecoin-legislation-adopted-in-the-us) — MEDIUM-HIGH (legal commentary)
- [Zealynx: Solana Smart Contract Audit Guide 2026](https://www.zealynx.io/blogs/solana-2026-security) — MEDIUM (industry)
- [BIS Working Paper: Public info and stablecoin runs](https://www.bis.org/publ/work1164.pdf) — HIGH (academic)
- [NIST IR 8408: Stablecoin Technology & Security](https://nvlpubs.nist.gov/nistpubs/ir/2023/NIST.IR.8408.pdf) — HIGH (standards body)
- [Wake Forest Law Review: Built to Fail (algorithmic stablecoins)](https://www.wakeforestlawreview.com/2021/10/built-to-fail-the-inherent-fragility-of-algorithmic-stablecoins/) — HIGH (peer-reviewed)
- [RugCheck.xyz](https://rugcheck.xyz/) — reference for anti-phishing monitoring (MEDIUM, community tool)

---

*Feature research for: Solana Token-2022 soft-pegged branded payments token (CAYC)*
*Researched: 2026-04-19*
