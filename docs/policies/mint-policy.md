# CAYC Mint Policy

**Version:** 1.0 (draft — to be published on caycsolana.com during Phase 5 Ops Go-Live)
**Effective date:** upon first public publication of this document
**Last reviewed:** 2026-04-19
**Applies to:** CAYC (Cyber Ape Yacht Club 8G) — Solana Token-2022 branded payments token, USDC-referenced.
**Canonical mint address:** published at launch. See `artifacts/mainnet.json` in the CAYC repository and the pinned canonical-address posts on the CAYC official channels.

> **Important:** CAYC is a **branded payments token, USDC-referenced**. It is **not** a reserve-backed stablecoin, is not collateralized, is not redeemable at par, and does not fall under the US GENIUS Act definition of a "payment stablecoin." CAYC holders do not have a redemption right against any reserve. This document governs the **supply** of CAYC, not the peg mechanism.

## 1. Purpose

This policy defines when, how, and why additional CAYC may be minted beyond the initial 500,000,000 supply. Its purpose is to replace the trust that a hard supply cap would provide with **transparency, pre-announcement, and multi-party authorization** — so that every future mint is predictable, auditable, and verifiable by holders and market participants before it happens.

## 2. Authority model

- The CAYC mint is deployed on the Solana Token-2022 program (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`).
- The **mint authority**, **freeze authority**, and **metadata update authority** are all held by the **Squads v4 multisig vault PDA** from the first `initializeMint` instruction onward. No externally-owned account (EOA) has ever held these authorities. (See the ceremony transcript in `artifacts/mainnet-sessions/` for the on-chain proof.)
- The mainnet multisig threshold is at minimum **3-of-5**; signers are on hardware wallets (Ledger primary, with at least one additional vendor for device diversity); seed phrases are cold-stored separately from the devices.
- No single signer can mint CAYC. Every mint instruction requires a Squads proposal that collects the threshold number of signatures before execution.

## 3. Supply at genesis

- **Initial supply:** 500,000,000 CAYC, minted in full to the Squads treasury Associated Token Account in a single ceremony separate from mint creation (see `artifacts/mainnet.json` and the corresponding session transcript).
- **Decimals:** 6 (matching USDC for clean conversion math).
- **Supply cap:** None. The mint authority is retained. This is a deliberate tradeoff in exchange for operational flexibility. The risk this creates is the subject of the rest of this policy.

## 4. Conditions under which CAYC may be minted beyond the initial 500M

No new CAYC will be minted unless **all** of the following conditions are satisfied:

1. **A public rationale exists.** A written memo identifying the specific business need for the mint (e.g., ecosystem expansion into a new market, merchant-onboarding reserve, partnership commitment) has been published to the CAYC repository at `docs/mint-proposals/` at least **48 hours** before the mint proposal is created in Squads.
2. **A specific amount and recipient address are named.** The memo specifies the exact amount of CAYC to be minted and the exact Associated Token Account that will receive it. Both are signed off by a majority of multisig signers before the 48-hour public window begins.
3. **The 48-hour pre-announcement window has elapsed.** The mint proposal MUST NOT be created in Squads before 48 hours have elapsed since the memo was published to the public canonical channels (listed in Section 6). The 48-hour window gives holders, market makers, CEX compliance teams, and monitoring bots time to review, ask questions, object, or trade out of CAYC if they disagree with the mint.
4. **Multisig threshold is met.** The Squads proposal to mint must collect the threshold number of signatures before execution.
5. **On-chain execution is immediately followed by a public post-mint report.** Within 1 hour of the mint transaction landing on-chain, a post-mint report (transaction signature, final supply, recipient, rationale link) is posted to every canonical CAYC channel.

If any of the above conditions is not met, the mint is a **violation of this policy**. Signers commit, individually and collectively, to refuse to sign proposals that violate this policy.

## 5. Time-lock implementation

The 48-hour window is enforced via **multisig discipline** and publicly-observable proposal lifecycle, not via an on-chain timelock program (CAYC has no custom on-chain program at launch). Specifically:

- The mint proposal is not even created in Squads until the 48-hour clock expires.
- If a signer ever sees a mint proposal in Squads whose corresponding memo was published less than 48 hours earlier, that signer **MUST** refuse to sign the proposal and **MUST** immediately publish a public notice naming the proposer.
- Auditors and sophisticated observers can independently verify the 48-hour window by comparing the memo publication timestamp (git commit timestamp in the CAYC repository + archival timestamp on the website + social-post timestamps) against the Squads proposal creation timestamp (on-chain).

A future version of this policy (v2+) may migrate to an on-chain time-lock via Squads v4's native execution-delay feature or a dedicated Solana time-lock program; if and when that migration happens, this document will be amended and the effective date updated.

## 6. Canonical pre-announcement channels

Every mint pre-announcement MUST appear on **all** of the following channels within the same 10-minute window (proof of simultaneity via screenshot archive committed to the CAYC repository):

1. The CAYC website (post at `caycsolana.com/mint-proposals/{proposal-id}`).
2. The CAYC repository `docs/mint-proposals/{proposal-id}.md` (git commit timestamp is the legally-meaningful record).
3. The CAYC official X / Twitter account.
4. The CAYC official Discord announcements channel.
5. The CAYC official Telegram channel (pinned, if the channel supports pins at the time of posting).

Users who want to monitor mint proposals should watch all five channels and cross-reference timestamps. If a mint proposal is announced on fewer than all five channels, treat it as suspicious and report it via the contact in Section 10.

## 7. What this policy does NOT permit

This policy's authorization is **narrow**. It does NOT permit:

- Minting to an address that was not named in the public memo.
- Minting a different amount than specified in the public memo.
- Minting before the 48-hour window elapses, even if all signers happen to be available sooner.
- "Emergency" mints that bypass the 48-hour window. There is no emergency procedure; the supply of CAYC does not have emergencies that justify bypassing public notice.
- Minting to reward individual signers or operators.
- Minting in response to price movements or peg deviation. CAYC is not a reserve-backed stablecoin; price management via mint supply changes is explicitly forbidden under this policy and is the historical failure mode of algorithmic stablecoins.

## 8. Signer accountability

Each signer is individually bound by this policy as a condition of holding signer authority. A signer who signs a mint proposal that violates this policy — even if the threshold is reached by others — is considered to have broken the public commitment, and the multisig operator will initiate signer rotation to remove them.

## 9. Relationship to other policies

- **Clawback / Freeze Authority Policy** (`./clawback-freeze-policy.md`) governs the use of the Permanent Delegate and Freeze authorities. Those authorities are separate from the Mint authority and governed independently.
- **Language & Disclosure Style Guide** (Phase 1 Plan 04) governs public-facing terminology. This policy is consistent with the Style Guide: CAYC is a "branded payments token, USDC-referenced," never "stablecoin."
- **Operations Runbook** (Phase 5 Plan) specifies the procedural steps signers follow to create, sign, and execute a mint proposal. The Runbook implements this policy; it does not amend it.

## 10. Public contact

Questions, complaints, or reports of policy violation should be directed to:

- GitHub Issues on the CAYC repository: issues tagged `mint-policy`.
- Email: `policy@caycsolana.com` (routed to the multisig operator group; responses within 72 hours on business days).
- Discord: `#mint-policy` channel, monitored by at least one multisig signer.

The public contact addresses above become active no later than the first public mint pre-announcement. Before then, direct questions to the GitHub repository.

## 11. Version history

| Version | Date       | Summary of changes                                                                                                                             | Changed by                      |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1.0     | 2026-04-19 | Initial draft — Phase 1 POL-02 deliverable. Published source of truth; scheduled for publication on caycsolana.com during Phase 5 Ops Go-Live. | Project maintainer (pre-launch) |

Any change to this policy (including typo fixes) bumps the patch version (1.0.x) for editorial changes or the minor version (1.x) for substantive changes. Major version bumps (2.0) are reserved for changes that broaden signer discretion (e.g., shortening the 48-hour window) and MUST themselves be announced at least 14 days in advance via the same canonical channels in Section 6.

## 12. Legal posture (reminder)

CAYC is not a "payment stablecoin" under the US GENIUS Act of 2025, because (a) CAYC is not backed by any fiat reserve, (b) CAYC holders have no redemption right against an issuer, and (c) CAYC is not issued by a Permitted Payment Stablecoin Issuer. Similarly, CAYC does not fall within the MiCA "e-money token" or "asset-referenced token" definitions for the same reasons. The use of the USDC decimal convention and of the phrase "USDC-referenced" is purely a product-design choice for clean payments UX; it does NOT create a redemption obligation, a reserve commitment, or a regulated-stablecoin classification. This policy is not legal advice to holders; holders should consult their own counsel regarding the tax, securities, and regulatory status of CAYC in their jurisdiction.

---

_This is a draft document. It becomes binding upon publication to `caycsolana.com` during Phase 5 Ops Go-Live. The draft is archived in the CAYC repository under `docs/policies/mint-policy.md` with the effective date updated at publication time._
