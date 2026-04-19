# CAYC Language & Disclosure Style Guide

**Version:** 1.0
**Effective date:** upon commit
**Last reviewed:** 2026-04-19
**Applies to:** all public-facing CAYC copy — website, tokenomics pages, listing applications, CEX application letters, social bios, Discord topic, Telegram pin, press releases, blog posts, canonical announcements. Also applies to technical documentation that will be read by CEX reviewers, listing reviewers, or regulators.

**Does NOT apply to:** files under `.planning/` (internal planning artifacts), files under `docs/security/` (internal security incident reports), and explicitly-labeled internal engineering notes.

## 1. The rule that matters most

**Do not describe CAYC as a "stablecoin" in public-facing copy.** Replace every instance with one of the approved terms in Section 2.

The reason this rule is absolute:

- The **US GENIUS Act** (signed 18 July 2025) makes "payment stablecoin" a regulated category with reserve, licensing, AML/KYC, and attestation obligations — and **criminal penalties for false claims**.
- The **EU MiCA** regulation holds management **personally liable** for misleading token descriptions in whitepapers and marketing.
- The **SEC's April 2025 "covered stablecoins" guidance** only exempts tokens that are fully backed 1:1 and redeemable at par. CAYC is neither.
- **CoinGecko and CoinMarketCap** apply enhanced scrutiny to tokens listed in the "Stablecoin" category, including reserve attestations the project cannot provide.

CAYC is a soft-pegged branded payments token with no reserves. Calling it a stablecoin is factually wrong AND legally exposed AND a listing-rejection signal. There is no scenario in which this word improves any public artifact.

## 2. Approved terminology

| Instead of                                        | Use                                                                                                                          | Context                                                                                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "stablecoin"                                      | **"branded payments token, USDC-referenced"**                                                                                | Primary public description. Use this in every first mention.                                                                                                                               |
| "stablecoin" (short-form continuation)            | **"payments token"**                                                                                                         | Acceptable after the first full mention in the same piece of copy.                                                                                                                         |
| "stablecoin" (ecosystem context)                  | **"ecosystem payments rail"** OR **"branded settlement token"**                                                              | When framing CAYC's role inside the Cyber Ape Yacht Club ecosystem.                                                                                                                        |
| "USD stablecoin" / "USD-backed" / "USD-pegged"    | **"USDC-referenced"** (never "USD-backed")                                                                                   | Emphasizes CAYC uses USDC decimals and tooling conventions without claiming backing.                                                                                                       |
| "pegged" / "soft peg" (standalone)                | **"USDC-referenced"** in marketing. **"soft-peg"** is acceptable only in technical/internal sections clearly marked as such. | "Pegged" without qualifier invites confusion with reserve-backed tokens.                                                                                                                   |
| "backed by"                                       | **DO NOT USE**                                                                                                               | There is nothing backing CAYC. Any use of this phrase is a factual error.                                                                                                                  |
| "redeemable" / "redemption"                       | **DO NOT USE**                                                                                                               | There is no redemption mechanism. CAYC has no issuer counterparty obligation.                                                                                                              |
| "1:1"                                             | **DO NOT USE in public copy about the CAYC/USDC relationship**                                                               | "1:1 with USDC" implies backing. Acceptable ONLY when describing the 1:1 decimal match ("CAYC uses 6 decimals, matching USDC") and clearly framed as a technical match, not a value match. |
| "always worth $1" / "maintains $1"                | **DO NOT USE**                                                                                                               | Factually wrong and legally exposed.                                                                                                                                                       |
| "stable value" / "stability" (as a CAYC property) | **DO NOT USE**                                                                                                               | Implies the regulated category. Use "USDC-referenced" for the peg signal.                                                                                                                  |
| "guaranteed" / "guarantee"                        | **DO NOT USE** in any context relating to price, supply, availability, or compliance outcomes.                               |

## 3. Disclosures that must accompany certain phrases

Wherever CAYC is described in connection with payments, e-commerce, or the USDC reference, the first mention in the same piece of copy MUST include the boilerplate disclosure:

> CAYC is a branded payments token, USDC-referenced. It is not a stablecoin, is not backed by fiat or on-chain reserves, and is not redeemable at par. Its price is determined by market liquidity and may diverge from USDC at any time.

Short-form variants are allowed for space-constrained surfaces (social bios, Discord topic) provided they retain the two critical elements: **"not a stablecoin"** AND **"not backed by reserves"**.

Example short-form (Twitter/X bio, 150 chars or fewer):

> CAYC — branded payments token on Solana, USDC-referenced. Not a stablecoin, not reserve-backed. caycsolana.com

## 4. Permanent Delegate and Freeze authority disclosure wording

Per research/FEATURES.md Flags 6 and 7, any public disclosure of the Permanent Delegate extension and Freeze authority MUST use this pattern:

> CAYC's mint is governed by a Squads v4 multisig. The multisig holds Permanent Delegate and Freeze authority over the mint, used under published policies limiting those powers to (a) compliance with lawful orders, and (b) documented theft and scam recovery. By holding CAYC you acknowledge these authorities. See the Clawback & Freeze Authority Policy for the full scope, governance procedure, and appeal path.

This wording is acceptable verbatim and is the recommended starting point. Departures from this wording require policy review.

## 5. Listing-platform-specific rules

| Platform         | Category to select                                                      | Avoid                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CoinGecko        | "Payments" OR "Ecosystem Token"                                         | "Stablecoin" — triggers reserve-attestation demands the project cannot meet.                                                                                 |
| CoinMarketCap    | "Payments" OR "Utility Token"                                           | "Stablecoin" — same reason as CG.                                                                                                                            |
| Jupiter Verify   | n/a (no category selection)                                             | Never describe CAYC as a stablecoin in the Jupiter CAT review.                                                                                               |
| Solscan          | n/a                                                                     | Do not submit the Solscan logo update with the word "stablecoin" in the project description field.                                                           |
| CEX applications | Use "payments token" or "utility token" per application form vocabulary | Do not describe CAYC as a stablecoin in CEX listing applications. Some CEXes explicitly require a stablecoin-compliance checklist that CAYC cannot complete. |

## 6. Where "stablecoin" IS acceptable

The word "stablecoin" may appear in public-facing copy ONLY in the following narrow contexts:

1. **As a negation,** clearly distinguishing CAYC from the regulated category. Example: "CAYC is NOT a stablecoin. It is a branded payments token, USDC-referenced."
2. **In the "Legal posture" sections of the Mint Policy and Clawback/Freeze Authority Policy,** where the legal disclaimer explicitly denies stablecoin status.
3. **In historical or reference context about other projects,** e.g., "USDC, a US-regulated stablecoin issued by Circle, is the reference currency CAYC is denominated against." (The referent is USDC, which is a stablecoin; CAYC remains negated.)

Any use outside these three contexts is a violation of this style guide.

## 7. Enforcement

A CI check at `scripts/check-language.sh` runs on every pre-commit and must pass before a commit is accepted. The check greps the public-facing directories (`docs/`, `README.md`) for the banned terms and fails the commit if any instance is found outside the allowlisted sections of the two policy files (`docs/policies/mint-policy.md` Section 12 and `docs/policies/clawback-freeze-policy.md` Section 14). Configuration is in `.langauditrc.json`.

The CI check scans for the exact words "stablecoin", "stable coin", "stable-coin", and the phrases "backed by", "redeemable", "1:1 with USDC" (case-insensitive). The allowlist mechanism (Section 9 below) permits approved contexts to pass.

## 8. Scope: what is "public-facing"

In this repository, **public-facing** means any file that would reasonably be expected to be read by users, listing reviewers, or regulators. Specifically:

- **Public:** `README.md`, `docs/` (excluding `docs/security/`), `docs/policies/`. Also: any website content, any social-media copy, any listing application, any CEX submission, any press release.
- **Internal (exempt):** `.planning/` (entire directory — planning artifacts, research, state), `docs/security/` (security incident reports with redactions), files explicitly labeled `<!-- internal -->` in their first 10 lines, and the `scripts/check-language.sh` script itself (which necessarily contains the banned terms as literals).

Files on the filesystem that are not committed (e.g., `.env`, local keypair files) are not in scope for this audit (`.gitignore` handles them).

## 9. Allowlisting specific contexts

Two mechanisms exist:

1. **Path allowlist** (file-level): a file path listed in `.langauditrc.json` → `allowlisted_paths` is entirely exempt.
2. **Context allowlist** (line-level): a line in `.langauditrc.json` → `allowlisted_contexts` is an exact line-or-paragraph pattern that, when present, is allowed to contain banned terms. This is used for the "Legal posture" disclaimer sections of the two policy files.

Additions to either allowlist require a one-paragraph rationale in the PR description explaining why the banned term cannot be avoided.

## 10. Version history

| Version | Date       | Summary of changes                                                                                                                                                                                                    | Changed by                      |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1.0     | 2026-04-19 | Initial style guide — Phase 1 POL-04 deliverable. Establishes the "no 'stablecoin' in public copy" rule, the approved replacement terminology table, the boilerplate disclosure wording, and the allowlist mechanism. | Project maintainer (pre-launch) |

---

_This style guide is binding on the repository as of commit. Changes to the banned-terms list or the allowlist require a PR that updates both this file AND `.langauditrc.json` in the same commit._
