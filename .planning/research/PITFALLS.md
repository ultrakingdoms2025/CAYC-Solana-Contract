# Pitfalls Research

**Domain:** Solana Token-2022 soft-pegged "stablecoin" payments token, Squads-governed, no custom program
**Researched:** 2026-04-19
**Confidence:** HIGH (Token-2022 mechanics, Squads, listing processes verified against official docs; regulatory commentary MEDIUM)

This document catalogs mistakes that are specifically relevant to the CAYC launch, given its locked constraints: Token-2022 with Metadata + Permanent Delegate (both immutable after init), retained freeze authority, soft-peg-to-USDC branding with no reserves, uncapped mint, Squads multisig as sole authority holder, and multi-platform listing ambitions (Jupiter / Solscan / CoinGecko / CMC / CEX).

---

## Critical Pitfalls

### Pitfall 1: Wrong Extension Set at Mint Init (IRREVERSIBLE)

**What goes wrong:**
The CAYC mint is created with Metadata + Permanent Delegate. If either the required extensions, a metadata field, or the Permanent Delegate authority pubkey is wrong at `initializeMint`, the only fix is creating a brand new mint and abandoning the original address. Token-2022 extensions are part of the mint account layout and cannot be added, removed, or re-pointed after initialization.

**Why it happens:**
Developers treat mint init like EVM contract deployment, where state is set via subsequent transactions. On Token-2022, extensions must be initialized *before* `initializeMint2` in the same transaction, in a specific order, with the account pre-allocated to the exact size the extension set requires. A single off-by-one in the space calculation or a missing `initializeXExtension` call silently produces a mint that looks right but has subtle permanent defects (e.g., metadata pointer pointing to self, but TokenMetadata extension uninitialized).

**How to avoid:**
- Run the full mint-creation transaction on devnet end-to-end, then do a byte-level diff of the mainnet transaction against it before signing. Constraint #77 already requires devnet validation — treat this as the hardest gate.
- Use `@solana/spl-token` helper `createMint` with the extensions array explicitly spelled out; do not hand-roll the TLV layout.
- Enable the **MetadataPointer extension** pointing to the mint itself and then initialize the **TokenMetadata** extension — this is the correct pattern. The "Metadata extension" shorthand in the brief is actually two extensions that must both be present.
- For Permanent Delegate, the delegate pubkey must be the Squads **vault** address (not the multisig account address). See Pitfall 11.
- Freeze everything in a signed artifact: list of extensions, init order, space size, each authority pubkey, each metadata field — review this list in a multi-reviewer session before mainnet. No verbal approvals.
- Do a full mainnet dry run by simulating the transaction with `simulateTransaction` and inspect the returned account data.

**Warning signs:**
- `getMint` on devnet shows unexpected extension state (missing metadata, wrong delegate)
- Metadata fetch returns empty or truncated strings (URI truncated because account space was under-allocated)
- Metadata updates fail because new URI is longer than old (mint-embedded metadata has fixed space)
- Jupiter/Solscan display a blank logo or "Unclassified" despite submission

**Phase to address:** Phase 2 (Devnet Deploy) + Phase 4 (Mainnet Ceremony). This is the single most important gate before mainnet.

---

### Pitfall 2: Calling CAYC a "Stablecoin" Without Reserves (LEGAL)

**What goes wrong:**
PROJECT.md explicitly describes CAYC as a "stablecoin" with "soft peg" to USDC and no collateral vault (Out-of-Scope #46). Under the **US GENIUS Act (signed July 18, 2025)** and **EU MiCA (fully in force 2024–2026)**, the term "payment stablecoin" is a regulated category that requires 1:1 fiat reserves, redemption at par, issuer licensing, AML/KYC controls, and regular reserve attestations. The GENIUS Act introduces **criminal penalties for falsely advertising non-compliant products as stablecoins**. MiCA holds management personally liable for misleading whitepaper claims. The SEC's April 2025 "covered stablecoins" guidance only exempts tokens that are fully backed 1:1 and redeemable at par — CAYC is neither.

**Why it happens:**
"Stablecoin" is a common descriptor in crypto marketing. Teams conflate technical peg branding with the legal category. Using USDC's decimals and positioning as a "USDC-branded payment token" (PROJECT.md line 9) will be read by regulators, CEX compliance teams, and CoinGecko categorization reviewers as a stablecoin claim.

**How to avoid:**
- **Do not use the word "stablecoin" in any public artifact** — website copy, metadata description, whitepaper, Twitter/X bio, Discord topic, listing submissions, CEX application letters. Use: "payments token," "ecosystem payment rail," "branded settlement token."
- Add an explicit disclosure on the website and in the metadata description: "CAYC is not a stablecoin. It is not backed by fiat or on-chain reserves. Its price is determined by market liquidity and may diverge from USDC at any time." Courts and regulators look for clarity of disclosure.
- Remove "stablecoin" from the PROJECT.md "What This Is" section of any derived public doc — keep it in internal docs only if labeled clearly as internal.
- On CoinGecko/CMC submission, categorize as "payments" or "ecosystem token" — **do not** select "stablecoin" category. A stablecoin categorization triggers stricter review and potentially triggers listing platforms to demand reserve attestations you cannot provide.
- Get a 1-hour consult with crypto counsel before any public launch. This is the highest-ROI legal spend in the project.
- If any team member is in the EU, also review MiCA ART (asset-referenced token) classification — a token "referencing" a fiat currency (USDC is fiat-referenced) may itself be pulled into the ART regime. A USDC-branded token is one legal argument away from being deemed an ART.

**Warning signs:**
- Draft marketing copy contains "stablecoin," "stable," "pegged," "redeemable," "1:1," "backed by"
- Website says "always worth $1" or "hold value"
- Twitter/X bio or Discord topic uses the stablecoin label
- Listing application pre-fill uses the "stablecoin" category

**Phase to address:** Phase 1 (Planning) and Phase 5+ (Listings). Pre-launch copy review is a gate.

---

### Pitfall 3: Permanent Delegate + Retained Freeze Triggers Wallet / DEX / CEX Red Flags

**What goes wrong:**
As of 2026, **Permanent Delegate has become the single most-abused Token-2022 extension** — scammers use it to burn victim tokens seconds after a buy. RugCheck.xyz flags over 40% of new Solana tokens using this extension as scams. Jupiter Core Working Group (Slorg, March 2026) publicly called on every Solana DEX aggregator, wallet, and bot to warn users on any token with Permanent Delegate enabled. Phantom, Solflare, and Backpack are rolling out or already display warnings. Combined with **retained freeze authority** (also in scope per PROJECT.md), CAYC presents two of the most user-hostile centralization flags a Solana token can have. CEX compliance teams reviewing for listing will have hard questions; some CEXes have de-facto rejected or quarantined tokens with both features.

**Why it happens:**
The features are legitimately used by regulated stablecoins (USDC has a freeze authority; Paxos-style tokens use clawback) — but those issuers have brand recognition, regulatory licenses, and public legal frameworks. A new token with the same centralization flags but without a public compliance posture looks identical to a scam on-chain.

**How to avoid:**
- **Publish a Clawback/Freeze Policy BEFORE launch.** Define: (a) the exact scenarios in which the Permanent Delegate will be used (court order, confirmed theft from a reported address, OFAC sanction), (b) the governance process (Squads vote, minimum signers), (c) a commitment to publish every clawback/freeze action on-chain with an on-website log. This transforms a red flag into a compliance story.
- Pre-coordinate with Jupiter Working Group / RugCheck / Phantom before launch. A public identity + disclosed policy lets them allowlist the mint rather than flag it.
- Expect and accept: some CEXes will still reject. Have a list of CEXes that have listed USDC/USDT (who already accept freeze-authority tokens) as your target list, not CEXes known for trustless/DeFi positioning.
- Budget for a code audit + legal memo of the clawback process — CEX listing packages will ask for both.
- Consider revoking **mint authority** after initial 500M mint in exchange for keeping freeze + permanent delegate, to reduce centralization surface. This conflicts with Constraint #72 (uncapped); decide early whether uncapped supply is worth the additional red flag. See Pitfall 9.
- Do NOT delegate the Permanent Delegate to a hot wallet. The delegate must be the Squads vault (see Pitfall 11).

**Warning signs:**
- RugCheck score is "Danger" / "Caution" despite good intent
- Phantom / Solflare display a warning banner on the token page
- Jupiter does not allowlist the token despite submission (organic-score issue, but centralization flags compound it)
- CEX application rejected with "centralization concerns" or "compliance risk"

**Phase to address:** Phase 1 (Policy drafting before mint init) + Phase 4 (Ceremony — address encoded correctly) + Phase 5 (Listing prep — policy published).

---

### Pitfall 4: Squads Authority Transfer Window — Single-Key Control of a "Multisig" Token

**What goes wrong:**
The natural flow for many teams is: create mint with a single EOA as authorities, mint the 500M, then transfer authorities to the Squads multisig. There is a **transfer window** — measured in minutes to days depending on execution discipline — during which a single key (potentially a hot wallet with internet access) controls mint, freeze, and update authorities over 500M tokens. If that key is compromised during the window, the mint is pwned. Worse, any public claim that the token is "multisig governed" is false for that window, and on-chain observers/auditors will find the single-EOA history forever.

**Why it happens:**
Squads requires SOL in the signer wallets to execute transactions; setting up the vault, funding signers, wiring Ledgers, and getting all signatories online takes time. The path of least resistance is to mint first and multisig later.

**How to avoid:**
- **Invert the flow:** Create the Squads multisig FIRST. Derive the vault PDA. Use the vault address as the initial mint/freeze/update authority *at mint init* and as the Permanent Delegate. No EOA ever holds authority.
- Mint 500M from the vault via a Squads transaction (the first multisig tx). This does require all signers online for the initial mint, but that is desired and auditable.
- If for tooling reasons a temporary EOA must hold authority: use a **fresh, air-gapped key**, complete the transfer to the multisig in the same session, verify on-chain that authorities now point to the Squads vault before ending the session, and publish the EOA pubkey + transfer transaction signatures as part of the launch artifacts so the single-EOA history is publicly acknowledged.
- Never use a hardware wallet you'll continue to use for other purposes as the temporary authority — burn it after use.
- Record and publish the multisig address, the vault PDA, the signer pubkeys, the threshold, and the transfer tx signatures as a signed artifact on the project website and in metadata.

**Warning signs:**
- Mint deploy script creates mint with `payer.publicKey` as authority
- Squads vault PDA not yet derived at time of mint init
- Initial mint tx is a plain TokenProgram instruction, not a Squads proposal
- Signer hardware wallets are not yet configured and tested

**Phase to address:** Phase 3 (Squads Setup) must complete BEFORE Phase 4 (Mainnet Ceremony). The roadmap must order these dependencies explicitly.

---

### Pitfall 5: Squads Threshold and Signer-Loss Lockout

**What goes wrong:**
Common threshold mistakes cause either permanent lockout or reduced security:
- **2-of-2:** One key lost = total lockout. No recovery. 500M tokens unmintable, unrotatable.
- **N-of-N:** Same problem, worse odds.
- **1-of-N:** Not a multisig; any one signer is a single point of failure.
- **2-of-3 with one signer on a laptop and two on identical Ledgers in the same safe:** Correlated loss (fire, theft, firmware wipe) = lockout.
- **All Ledgers flashed with the same firmware version:** A Ledger firmware bug affects all signers simultaneously.

**Why it happens:**
Squads setup UX is fast and teams click through with defaults. Signer diversity (geographic, device-model, seed-phrase-custody) is not prompted for.

**How to avoid:**
- Use **3-of-5** at minimum for mainnet authority. 2-of-3 is acceptable only if all three signers are on genuinely different hardware stored in genuinely separate locations with independently backed-up seed phrases.
- Signer diversity rules:
  1. At least two hardware wallet vendors (e.g., Ledger + Trezor + Keystone) — avoid all-Ledger
  2. At least two geographic locations
  3. Seed phrases stored separately from hardware (metal plate in safe #1, hardware in safe #2)
  4. At least one signer with a documented, tested recovery chain (lawyer / trustee / family)
- **Practice a signer rotation on devnet** before mainnet. Remove one signer, add a new one, confirm the vault still works. This validates both the rotation runbook AND the threshold math.
- Fund each signer wallet with at least 0.5 SOL for transaction fees. Signers with 0 SOL cannot sign. Document a refill procedure.
- Document: which signer is held by whom, their timezone, a liveness check (respond within X hours), and the escalation path if a signer is unreachable.
- Beware Squads' **durable nonce** signing mode: a malicious proposer can extend the signature-collection window beyond a normal blockhash expiry. Explicitly disallow durable-nonce transactions in the runbook unless consciously approved.

**Warning signs:**
- Threshold configured as N-of-N or 1-of-N
- Two or more signers located in the same building / on the same firmware version / on the same email account for 2FA recovery
- No documented recovery procedure
- No tested rotation on devnet

**Phase to address:** Phase 3 (Squads Setup) — must include signer diversity audit and rotation drill.

---

### Pitfall 6: Incompatible or Misconfigured Token-2022 Extension Combinations

**What goes wrong:**
CAYC's locked scope (Metadata + Permanent Delegate, no Transfer Fee, no Transfer Hook) avoids most incompatibilities — but there are still failure modes specific to this mix:
- **MetadataPointer without TokenMetadata initialization** → mint looks complete but metadata readers get empty data
- **Metadata extension + legacy Metaplex Metadata PDA also created** → Jupiter/Phantom/Solscan read different sources, displaying inconsistent name/symbol/logo. This is the "Metadata conflict" specifically flagged in the brief.
- **MetadataPointer pointing to an external account that is later closed** → token metadata vanishes
- **Metadata embedded inside the mint (no MetadataPointer) → fixed space forever**; any future metadata update with a longer URI/name fails silently

**Why it happens:**
- Teams create Metaplex metadata "just to be safe" on top of Token-2022 metadata, causing dual-source conflicts.
- Code examples online mix the two patterns.
- MetadataPointer is a separate extension from TokenMetadata; half the teams initialize only one.

**How to avoid:**
- **Pick ONE metadata source: Token-2022 TokenMetadata extension.** Do not additionally create a Metaplex `mpl-token-metadata` PDA. Jupiter, Solscan, Phantom, and Solflare all support Token-2022 native metadata as of 2025–2026.
- Initialize **both** MetadataPointer AND TokenMetadata at mint init. The pointer should target the mint itself (self-reference) so metadata lives in the mint account and cannot be orphaned by closing an external account.
- Over-allocate the mint account space by at least 512 bytes beyond the initial metadata payload. Metadata fields (especially `uri`) can be updated only to values that fit existing space. Budget for future extension.
- Verify with `getMint` + `getTokenMetadata` on devnet that both extensions are present before running the mainnet ceremony.
- If any third party (e.g., a launchpad tool) creates a Metaplex PDA, burn it / close it before public launch. Conflicting sources will surface inconsistencies in listings.

**Warning signs:**
- Jupiter shows one logo/name, Phantom shows another
- Solscan "Metadata" tab shows empty or unclassified
- Metadata update fails with "insufficient space"
- Both Metaplex and Token-2022 metadata accounts exist

**Phase to address:** Phase 2 (Devnet Deploy) — prove metadata is read consistently across all four display surfaces before mainnet.

---

### Pitfall 7: Wrong Token-2022 Program ID / Spoofed Program

**What goes wrong:**
The canonical Token-2022 program ID is `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`. A deployment script that takes the program ID from a constant imported from an untrusted source, or from a shell env var, can silently point at a forked/malicious program that behaves identically on initial calls but embeds a backdoor.

**Why it happens:**
Copy-pasted tutorial code. Env-driven deployment where the programId env var was set months ago and no one re-verifies. Single-line diffs in CI are ambiguous.

**How to avoid:**
- Hardcode `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` as a **string literal constant in the deploy script**, in a file that is code-reviewed by at least two people line-by-line before Phase 4.
- Use `@solana/spl-token`'s `TOKEN_2022_PROGRAM_ID` constant — pin the package version in `package.json`, and verify the package's integrity via `npm audit signatures` or the project's lockfile.
- In the devnet and mainnet ceremonies, print the program ID to console and have a human read it against a physical printed reference before broadcasting.
- Do not accept program IDs from `.env` files for this variable.

**Warning signs:**
- Deploy script reads program ID from env, CLI arg, or network request
- `package-lock.json` / `yarn.lock` not committed
- Multiple Token-2022 program IDs referenced across the codebase

**Phase to address:** Phase 2 (Devnet Deploy) and Phase 4 (Mainnet Ceremony).

---

### Pitfall 8: Unexpected Mints Post-Launch Destroy Trust

**What goes wrong:**
PROJECT.md locks uncapped mint authority (Constraint #72). Any future mint by the multisig will be visible on-chain in real time. If holders, Jupiter, DEX pools, or CEX market makers observe a mint event they were not expecting or cannot explain, the market price can collapse within minutes. This is precisely the failure mode of the **USR stablecoin (April 2025)**: attacker minted 80M uncollateralized tokens, price dropped 86% in hours; the issuer's communication lag made it worse. Even a legitimate mint with no prior announcement reads as a rug.

**Why it happens:**
Uncapped + silent mint = no social contract with holders. Every subsequent mint must earn back the trust that the launch established. Teams underestimate how fast on-chain monitoring bots (Solana Floor, Bubblemaps, DeBank) flag new mints.

**How to avoid:**
- **Publish a supply policy** before launch: current supply, any planned future mints (with dates/amounts if known), governance process required to mint (Squads transaction with N signers, cooldown period, rationale required), commitment to announce every future mint X hours in advance.
- Put the supply policy in the token metadata `description` field and on the website with version history.
- Consider a **soft cap commitment** even if the mint authority is uncapped: publicly commit "no mint above 500M CAYC without 30-day notice + multisig vote."
- Establish a monitoring dashboard that watches the mint account supply and posts to the project's official announcement channel automatically on any supply change. Beat the scam-detection bots to the announcement.
- Strongly reconsider Constraint #72 (uncapped). If the project will in practice never need to mint more, revoking mint authority after initial 500M removes this entire risk class and dramatically simplifies the CEX listing story. The tradeoff is permanent loss of flexibility. See Pitfall 9.

**Warning signs:**
- No written supply policy
- No announcement template for future mints
- Mint function exists in the runbook without a "how we communicate this to holders" checklist
- Holder-monitoring Discord/Telegram is not set up pre-launch

**Phase to address:** Phase 1 (Policy) + Phase 6 (Post-launch operations).

---

### Pitfall 9: Mint Authority as a Live Attack Surface Forever

**What goes wrong:**
Uncapped + live mint authority + Squads = any compromise of the threshold (e.g., 3 of 5 signers phished, seed-phrase breach, malicious insider) = attacker mints arbitrary supply and dumps. This is a permanent attack surface. Even with a robust multisig, the surface exists for the lifetime of the project. The USR exploit root cause was private key compromise, not a protocol flaw.

**Why it happens:**
Uncapped supply is chosen for "flexibility" at launch without modeling the full risk-over-time. The longer the authority stays live, the more opportunities for compromise.

**How to avoid:**
- **Reconsider uncapped supply** against this risk. If there is no concrete business case in the 12-month roadmap for minting above 500M, revoke mint authority post-launch. Freeze + Permanent Delegate can remain for the compliance use case.
- If uncapped is kept, introduce a **time-locked mint** pattern: a Squads vote to mint does not execute immediately; a 48–72h delay allows holders and monitoring bots to react before the mint lands. This can be implemented via Squads' proposal execution delay or by publishing proposal-to-execution intent publicly before signing the execution step.
- Rotate signers at least annually — old signers (team members who left, devices retired) retain authority otherwise.
- Independent monitoring: pay a third-party (Chainalysis, Hypernative, Hexagate) to alert on anomalous authority activity.
- Cold-storage *all* signer seed phrases; no signer seed should exist on a laptop at rest.

**Warning signs:**
- Signers share email providers, password managers, or 2FA apps
- No annual signer rotation in the runbook
- No third-party monitoring on the mint account

**Phase to address:** Phase 1 (Supply Cap Decision) + Phase 3 (Squads Setup) + Phase 6 (Ongoing Ops).

---

### Pitfall 10: Hardcoded Keys / .env Committed / Mainnet RPC with Dev Key

**What goes wrong:**
A keypair JSON committed to git, a `.env` with `WALLET_PRIVATE_KEY=...` pushed to a public fork, an `anchor.toml` with a mainnet cluster URL checked in, or a deploy script that defaults to mainnet when an env var is unset. Any of these and authority is compromised before ceremony happens.

**Why it happens:**
Solana CLI default wallets live in `~/.config/solana/id.json`. Developers `cp` that file into the project directory for "easier testing" and `git add .` catches it. Default cluster in scripts is sometimes mainnet-beta for "production" builds.

**How to avoid:**
- `.gitignore` must include: `*.json` under `keys/`, `id.json`, `keypair*.json`, `.env`, `.env.*`, `wallet*`, `*.keypair`, `target/` (Anchor)
- Pre-commit hook: `git secrets` or `trufflehog` scanning for base58 private keys
- Scan every commit before push with `gitleaks`
- Deploy scripts default to **devnet**, require `--cluster mainnet-beta` explicit flag to touch mainnet, and abort if the wallet balance is above 1 SOL without explicit `--confirm-mainnet` flag
- Separate `~/.config/solana/id-devnet.json` from `id-mainnet.json`. Different key files for different clusters. Hardware-wallet-only for mainnet authority actions.
- Squads authority means the mainnet ceremony uses only hardware wallet signers, not any JSON keypair. Treat any JSON keypair on disk as devnet-only.
- Run `git log --all -p` pre-launch and search for leaked keys with `trufflehog git file://.`

**Warning signs:**
- `id.json` or `keys/` directory appears in `git ls-files`
- `.env` exists and isn't gitignored
- Deploy script lacks cluster guard
- Mainnet RPC URL appears in a committed `.env.example`

**Phase to address:** Phase 0 (Repo Setup) + Phase 2 (Devnet) + Phase 4 (Mainnet Ceremony). Every phase, really.

---

### Pitfall 11: Squads Vault Address vs Multisig Account Address Confusion

**What goes wrong:**
Squads has **two distinct addresses** for a given multisig:
- **Multisig account**: the config account that stores threshold, signers, etc.
- **Vault PDA (at index 0 by default)**: the address that actually holds assets and is used as a signer for outgoing transactions.

Mint/freeze/update authorities and the Permanent Delegate must point to the **vault PDA**, not the multisig account. Setting them to the multisig account makes the authorities effectively unusable — the multisig cannot sign as the multisig account, only as the vault.

**Why it happens:**
Squads UIs display the multisig account prominently. Developers copy-paste that address. The distinction is documented but easy to miss. This is explicitly called out in LayerZero's Solana guidance and in several Squads integration bug reports.

**How to avoid:**
- In the deploy script, derive the vault PDA programmatically using Squads' SDK: `getVaultPda(multisigPda, vaultIndex=0)`. Do not accept the address from a copy-paste.
- Print both addresses in the deploy log. Have a second reviewer confirm which one is being used.
- On devnet, after authorities are set, attempt a multisig-signed mint transaction. If it fails with "authority mismatch," you used the wrong address. This MUST be caught before mainnet.
- Document in the runbook: "The authority address is the Squads **vault**, not the multisig. The vault PDA is `<address>`. The multisig config account is `<other address>`."

**Warning signs:**
- Devnet multisig-signed mint transactions fail with authority errors
- Deploy script references the multisig pda directly rather than calling `getVaultPda`
- Two different addresses appear in documentation without clarification of which is which

**Phase to address:** Phase 3 (Squads Setup) + Phase 2 (Devnet).

---

### Pitfall 12: Copycat Mints and Canonical Address Problem

**What goes wrong:**
Within hours of a visible launch — especially after Jupiter verification or CMC listing — copycat mints with identical names, symbols, and logos will appear. Users who Google "CAYC Solana" land on a phishing site showing the fake mint address. Those users buy the scam token; their reaction is "CAYC rugged me." Reputation damage is rapid and compounding.

**Why it happens:**
Token name + symbol are not globally unique on Solana. Only the **mint address** is. Users copy-paste symbols, not mint addresses. Scammers optimize SEO on "CAYC token" queries.

**How to avoid:**
- **Publish the canonical mint address everywhere** from day one: website (footer + header), metadata description, Twitter/X bio, Discord topic, Telegram pinned message, all listing submissions. A "metadata proof" page linking mint + CID + explorer URLs is a known-good signal.
- Pre-register social handles: `@caycsolana`, `caycsolana.com`, reddit sub, Discord, Telegram, Medium — before launch announcement. Scammers will squat otherwise.
- Submit to RugCheck.xyz, dexscreener, and birdeye.so to establish a verified trust footprint early. Dexscreener's "padlock" liquidity-lock badge adds a visible trust signal.
- Monitor for copycats with a daily script: query `getProgramAccounts` on Token-2022 filtered by name="CAYC" and check for unauthorized mints. Report to Jupiter (they have fraud tooling), Phantom (flag blocklist), and DEX aggregators.
- Brand-protection DMCAs against phishing sites (Namecheap / Cloudflare abuse channels).
- Use the **metadata `updateAuthority` immutability flag** after initial metadata finalization — prevents an attacker who compromises the Squads multisig from repointing metadata to scam URLs. This is a separate "lock" from revoking the update authority entirely.

**Warning signs:**
- New Solana mints with name "CAYC" appearing on dexscreener within 24h of launch
- Google Ads for "CAYC token" promoting fake sites
- Twitter accounts impersonating the team

**Phase to address:** Phase 5 (Listings) + Phase 6 (Ongoing Ops). Domain/social pre-registration is Phase 0 (Planning).

---

### Pitfall 13: Freeze Authority Misuse / Mass-Freeze Incident

**What goes wrong:**
Freeze authority is retained per PROJECT.md constraint. Known failure modes:
- **Accidental mass-freeze:** A runbook error or script bug freezes every account matching a pattern instead of one specific account. 10k holders locked. No simple undo mechanism scaling-wise.
- **Freeze-the-wrong-address:** Address copy-paste error freezes a legitimate user's account.
- **Indefinite freeze with no SLA:** User reports their account was wrongly frozen; no documented unfreeze timeline; they file complaints, lose trust.
- **Freeze-as-censorship controversy:** Freezing a specific wallet for legitimate compliance reasons (OFAC sanction) but doing so without transparency, leading to community backlash à la Drift Protocol debate (April 2026, Solana co-founder calling for court-controlled freezes).

**Why it happens:**
Freeze operations are powerful single-instruction actions. A misplaced loop or an autocomplete-selected address triggers catastrophic actions with no confirmation UX.

**How to avoid:**
- **Runbook:** freeze operations require (a) ticket with linked evidence, (b) Squads proposal with the target address in the proposal description, (c) at least 2 reviewers visually confirm the target address against evidence, (d) execution, (e) post-action on-chain publication of the action + reason.
- Freeze scripts loop over at most **one** address per invocation. Batching is prohibited in the runbook.
- Confirm target address twice in the script (pass it as both `--address` and `--confirm-address`, fail if they mismatch).
- Publish a **Freeze Transparency Log** on the website: every freeze/unfreeze, timestamp, tx sig, reason category (theft / court order / OFAC / accidental reversal). This converts the capability from a trust liability to a trust asset.
- Publish an **Unfreeze SLA**: "Users who believe their account was wrongly frozen can report at <email>; we commit to response within 24h and resolution within 72h."
- Test the unfreeze flow on devnet as part of the ceremony.

**Warning signs:**
- No runbook for freeze operations
- No transparency log
- Freeze scripts that accept lists of addresses or glob patterns
- No unfreeze SLA

**Phase to address:** Phase 6 (Ongoing Ops) + Phase 1 (Policy).

---

### Pitfall 14: DEX Liquidity Single Point of Failure + LP Rug Accusation

**What goes wrong:**
If launch liquidity on Raydium/Orca/Meteora is seeded from a single LP provider (the treasury), and that LP position is not locked, any withdrawal — even a legitimate rebalancing — reads as a rug pull to the market. DexScreener and RugCheck both flag unlocked LPs prominently. Thin liquidity also causes first-trade price spikes that scare users and look manipulative.

**Why it happens:**
Self-liquidity is fast and cheap. Teams plan "we'll lock it later." Later never comes, or the lock happens after a holder panic has already started.

**How to avoid:**
- **Lock LP tokens at pool creation** using StakePoint or a comparable Solana LP locker. The PDA-based lock is verifiable and earns DexScreener's padlock badge.
- Choose **lock duration thoughtfully**: 6–12 months is standard. Longer reads as trustworthy but removes flexibility if pool parameters need changing.
- Seed liquidity with sufficient depth on day one to absorb expected launch volume without >2% slippage on a median-sized buy. For a CAYC-pegged-to-USDC use case, that means **paired against USDC**, not SOL, so the peg visually holds.
- Consider a **balanced dual seed**: half the liquidity from the treasury (locked), other half from an independent LP (incentivized with LP rewards). Reduces SPoF.
- For CEX, engage a market maker under contract (Wintermute, GSR, Amber, FlowDesk) for at least 6 months. Thin CEX orderbooks on a stablecoin-positioned token look terrible.
- Publish the **treasury balance** of the 500M + the LP position composition publicly. "All 500M in the treasury multisig, X% allocated to DEX liquidity, Y% reserved for future distribution." Transparency dashboard is a known trust signal.

**Warning signs:**
- LP tokens held in the treasury with no lock transaction
- Single-sided liquidity (CAYC only) or paired against a volatile asset
- DexScreener shows "Burn/Lock: Not locked"
- No market-maker contract for CEX phase
- Peg drifts >5% in the first 72h

**Phase to address:** Phase 5 (Listings / DEX Launch) + Phase 6 (Post-launch).

---

### Pitfall 15: No Incident Response Runbook / 3AM Problem

**What goes wrong:**
Something goes wrong at 3am on a Sunday: a freeze-authority-compromise alert fires, a copycat scam breaks, the peg breaks, a CEX pulls the listing, a signer reports a lost Ledger. No one knows who calls whom, who has authority to act, or what steps come first. Response is chaotic; response time determines blast radius.

**Why it happens:**
Teams focus on launch, not operations. Runbooks are written after the first incident, not before.

**How to avoid:**
- Write runbooks **before launch** for each scenario:
  1. Signer compromise (one key) — how to rotate, how fast
  2. Signer loss (one key) — how to rotate, how fast
  3. Threshold breach suspected — emergency pause, lawyer notification, CEX notification
  4. Metadata compromise (update authority misuse) — freeze update authority, communicate
  5. Mint event unexpected (not from team) — pause trading requests, CEX halts, public statement
  6. Peg break > 10% — communication template, liquidity response, market maker escalation
  7. Copycat + phishing campaign — DMCA, social reporting, community warning
  8. Freeze complaint / wrongly-frozen user — triage, unfreeze SLA
  9. Legal inquiry (subpoena, regulator) — who handles, what we disclose, court-ordered freeze process
- On-call rotation: at least 2 people with follow-the-sun coverage.
- Quarterly tabletop exercise — simulate a scenario, measure response time, update runbook.
- Public status page: users must have somewhere to see real-time incident status, or they will assume the worst.
- Legal counsel on retainer for US + EU (given MiCA and GENIUS Act exposure).

**Warning signs:**
- No on-call rotation
- Runbooks not written pre-launch
- No status page
- No legal counsel on retainer

**Phase to address:** Phase 6 (Ongoing Ops) — runbooks must exist before Phase 4 (Mainnet).

---

### Pitfall 16: Listing Submissions Made with Partial / Wrong Artifacts

**What goes wrong:**
Each listing platform has specific submission criteria. Common rejections:
- **Jupiter Verify V3 (VRFD):** No more GitHub PRs. Tokens need organic trading score + smart likes on the Jupiter UI. "Standard Review" is free but slow; "Express" costs 1000 JUP with 24h SLA. Most common ineligibility: existing pending submission. New tokens without organic activity get rejected; need liquidity + genuine trading first.
- **Solscan:** Token reputation system — new tokens get "Unclassified" icon by default. Logo update requires token Update Authority (correctly configured) + valid metadata JSON with `name`, `symbol`, `image`. Many submissions fail because metadata JSON is broken or image URI returns a 404.
- **CoinGecko:** Needs active trading on a recognized exchange. Rejected if only pre-launch. Wants mint address, website, socials, description, logo, and genuine volume.
- **CoinMarketCap:** Recommends **$50,000+ daily volume** before listing. Accepts expedited review but doesn't guarantee approval.
- **Category misselection:** Choosing "stablecoin" on CG/CMC triggers enhanced scrutiny the project cannot pass (see Pitfall 2).

**Why it happens:**
Teams submit before liquidity and volume are established, leading to rejections that then have a cooldown (pending submission blocks new submission). Submissions done by the least-senior team member who doesn't know the metadata JSON is broken.

**How to avoid:**
- **Submit in the right order:** liquidity + volume first → DexScreener/Birdeye presence → Jupiter organic score → Solscan logo → CG → CMC → CEX. Each step builds the credibility the next step requires.
- Host metadata JSON on a content-addressed, permanent storage (IPFS/Arweave/Shadow Drive). Avoid centralized URLs that can 404.
- Pre-validate metadata JSON against each platform's schema on devnet before submitting mainnet.
- Pre-screen: check that "CAYC" is not already in use by another token on Jupiter / CG / CMC. If it is, decide now whether to rename or to differentiate via a qualifier (e.g., "CAYC (Cyber Ape Yacht Club)").
- For Jupiter: build genuine volume before submitting. Consider the 1000-JUP Express route only after Standard Review has been attempted.
- For CG/CMC: do not select "Stablecoin" category. Use "Payments" or "Ecosystem / Utility Token."

**Warning signs:**
- Submission rejected on first try
- Metadata JSON returns 404 or malformed JSON
- Symbol already exists on the target platform
- Submitting before DEX volume exists

**Phase to address:** Phase 5 (Listings) with dependencies in Phase 4 (Mainnet Launch) and Phase 6 (Liquidity ramp).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Mint first, multisig later (EOA transfer window) | Faster initial deploy | Single-key exposure on 500M; permanent on-chain history of single-EOA ownership hurts audit story | **Never for mainnet.** Acceptable on devnet only. |
| Skip MetadataPointer, embed metadata directly in mint | Slightly less space allocation | URI updates restricted to ≤ current size forever; no way to extend | Only if metadata is truly finalized and will never update |
| Use Metaplex metadata PDA on top of Token-2022 metadata | "Belt and suspenders" | Conflicting sources, inconsistent display across wallets/explorers | Never. Pick one — Token-2022 native. |
| 2-of-3 multisig with signers in the same city | Fast setup | Correlated risk of signer loss | Pre-launch devnet validation only |
| Self-LP without lock | Control, flexibility | Dex aggregators flag; users assume rug | Never for mainnet launch. Lock at pool creation. |
| Run devnet ceremony with different signers than mainnet | Easier coordination | Mainnet ceremony has no actual rehearsal | Never. Use identical signer roles (even if different physical keys for isolation). |
| Use `anchor test` wallets for devnet deploy, manually swap for mainnet | Fast iteration | Keys end up in scripts, .env files, CI logs | Early development only. Before Phase 2 devnet deploy, migrate to hardware-wallet-only. |
| Hardcode mainnet cluster in any script | "I'll never run this wrong" | You (or a teammate) eventually do | Never. Always require explicit `--cluster mainnet-beta` flag. |
| "We'll write the runbook after launch" | Launch faster | First incident has no playbook; reactive response | Never for a project handling $M of authority |
| Uncapped mint without time-lock or cooldown | Maximum flexibility | Permanent attack surface; every mint event is a trust re-earning event | Only if business case for future mints is explicit and communicated |
| Submit to CG/CMC before DEX volume | "Get the listing started early" | Rejection triggers cooldown, blocks resubmission | Never. Sequence the listings. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| Squads | Pointing authority at the multisig config account instead of the vault PDA | Use `getVaultPda(multisigPda, 0)`; verify with devnet multisig-signed mint tx |
| Token-2022 metadata | Relying on Metaplex readers | Read via Token-2022 `getTokenMetadata`; all major wallets now support it natively |
| Jupiter Verify V3 | Submitting before organic trading activity | Build liquidity + volume first; submit only when smart-likes score is credible |
| Solscan | Uploading logo before Update Authority is correctly set to the multisig vault | Sequence: Ceremony finalizes authorities → upload logo via Solscan portal signed by vault |
| CoinGecko | Selecting "Stablecoin" category | Use "Payments" or "Ecosystem Token" |
| Hardware wallet (Ledger) in Squads | Outdated Solana app version silently fails to sign blind-signed complex txs | Update Solana app to latest on every signer device before ceremony; enable blind signing |
| Raydium LP | Creating pool with unlocked LP tokens | Lock LP tokens at pool creation via StakePoint or comparable on-chain locker |
| DexScreener | Missing `token-info` metadata fields (Twitter, website, description) | Pre-fill all fields at launch; the "Update profile" flow requires mint authority |
| RugCheck.xyz | Assuming score will self-update after listing | Submit manually with project context; appeal / clarify risk flags explicitly |
| CEX listing | Missing clawback/freeze policy document | Prepare pre-launch; CEX compliance requires written policies on centralization features |
| IPFS/Arweave metadata hosting | Using a pinning provider with uncertain longevity | Use Shadow Drive (Solana-native), Arweave (permanent), or multi-pin IPFS |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| Thin DEX liquidity at launch | 5%+ slippage on median buys; peg breaks on first whale trade | Seed with sufficient depth (at least $100k equivalent); locked LP; dual-sided liquidity | First 72h post-launch |
| Single RPC provider for deploy/monitoring | Deploy fails during RPC outage; monitoring goes dark | Multi-provider failover: Helius + QuickNode + public RPC | Any provider incident |
| Metadata embedded in mint with no space budget | Future metadata updates fail silently | Over-allocate mint account space; use MetadataPointer + TokenMetadata | On first metadata update attempt |
| Ledger signer runs out of SOL | Ceremony fails mid-way; signer cannot sign | Fund every signer with 0.5+ SOL; automated balance alerts | During ceremony or rotation |
| Squads transaction hits Solana compute limit | Deploy/mint tx fails with "compute exceeded" | Pre-simulate transactions; split complex flows; use compute budget instructions | Complex ceremonies with 5+ extensions + many instructions |
| Freeze operation batched over thousands of accounts | Tx too large; partial state | Freeze one at a time per tx | Never at current scale, but encoded in runbook |

## Security Mistakes

Beyond generic web security — domain-specific issues.

| Mistake | Risk | Prevention |
|---|---|---|
| Keypair JSON in git history | Authority compromise pre-launch | `.gitignore` + `gitleaks` pre-commit + audit `git log --all` |
| Program ID read from env var | Spoofed Token-2022 program | Hardcode `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`; code review |
| Signers on correlated hardware/location | Multi-key loss event | 3-of-5 with device-diversity + geographic-diversity policy |
| Permanent Delegate + no published policy | Marked as scam by RugCheck/wallets | Publish Clawback Policy + Freeze Policy pre-launch |
| Update authority on a hot wallet during launch | Metadata rug by attacker | Update authority is Squads vault from mint init |
| Durable-nonce Squads transaction accepted blindly | Extended attack window; stale proposal | Runbook disallows durable-nonce unless explicitly approved |
| Single LP position seeding the pool | Rug-pull narrative on any withdrawal | Lock LP; publish lock tx sig; optional dual-seed |
| `--cluster` defaulting to mainnet-beta | Accidental mainnet deploy of test code | Default to devnet; require explicit flag for mainnet |
| Running deploys from a personal laptop | Malware on laptop = compromised ceremony | Dedicated air-gapped or freshly-provisioned ceremony machine |
| Reused signer across multiple Solana projects | One project compromise affects others | Project-dedicated signer keys |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---|---|---|
| "Stablecoin" branding without reserves | Users feel deceived when price drifts; legal exposure | Brand as "payments token"; disclose mechanism clearly |
| Permanent Delegate with no explanation | Wallet warnings scare users off | On-site disclosure: when it's used, governance, transparency log |
| Freeze authority with no SLA | Frozen users feel trapped; community outrage | Published unfreeze SLA + transparency log |
| First-trade price spike from thin liquidity | Users think "rug" or "manipulation" | Deep liquidity + locked LP + market maker for CEX |
| Copycat confusion (right symbol, wrong mint) | Phished users blame the real project | Canonical mint published everywhere + pre-registered social handles |
| No status page | Users fill the information vacuum with panic | Real-time status page + incident history |
| Metadata logo broken on one major wallet | Token "looks fake" on Phantom or Solflare | Test metadata display across all four wallets before launch |
| Unexpected mint event | Price panic | Pre-announced mint policy + advance-notice SLA |

## "Looks Done But Isn't" Checklist

Ceremony and launch phases where artifacts appear complete but are missing critical pieces.

- [ ] **Mint deployed on devnet:** Verify extensions with `getMint` + `getTokenMetadata`; confirm MetadataPointer *and* TokenMetadata both present; confirm Permanent Delegate is the Squads vault PDA (not config account)
- [ ] **Squads multisig set up:** Verify threshold math by running a signer-rotation drill on devnet; verify all signers have ≥ 0.5 SOL
- [ ] **Authority transfer complete:** Run a Squads-signed mint on devnet and confirm it succeeds — this is the ONLY proof that authorities are correctly pointed
- [ ] **Metadata finalized:** Fetch metadata via the read path of Phantom, Solflare, Backpack, Jupiter, Solscan, and Dexscreener. If any shows broken, treat as not done.
- [ ] **LP liquidity seeded:** Confirm LP tokens are in a locker PDA, not the treasury wallet. Verify lock duration publicly on DexScreener.
- [ ] **Jupiter submission:** Check VRFD shows "pending" or "verified" — not "rejected" with unclear reason. Know the smart-likes count.
- [ ] **Solscan listing:** Logo renders on `solscan.io/token/<mint>` — not the generic icon. Metadata tab shows full JSON.
- [ ] **CG/CMC submissions:** Category is NOT "Stablecoin." Volume threshold met before submission.
- [ ] **Runbooks exist:** All 9 incident scenarios have written runbooks, not just the "happy path" deploy guide.
- [ ] **Supply policy published:** On website + in metadata description; includes commitment to future-mint notice period.
- [ ] **Freeze/Clawback policy published:** Defines usage, governance, transparency log URL.
- [ ] **Canonical mint address published:** On website, all social bios, Discord topic, Telegram pinned, every listing.
- [ ] **Copycat monitoring live:** Daily job scanning for mints with name="CAYC" on Token-2022.
- [ ] **Status page live:** Accessible pre-launch so users know where to look during any future incident.
- [ ] **Legal review done:** Marketing copy scrubbed of "stablecoin" and stablecoin-adjacent claims; counsel sign-off on file.
- [ ] **No keypair JSON in git:** `gitleaks` run clean; `git log --all -p` grep clean.
- [ ] **Ceremony machine is clean:** Fresh OS install or dedicated device; no extensions, no clipboard managers, no keyloggers.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Wrong extension at mint init | **HIGH** (mint is permanent; new mint required) | Abandon mint; deploy new; communicate change; migrate holders if launched; update every listing. Avoid at all costs via devnet validation. |
| Authority pointing to multisig account instead of vault | MEDIUM (only if caught pre-transfer-finalization) | If caught before handoff to vault: reset authority to vault. If caught after: run a recovery transfer via whatever signer still has access; if none, authority is locked. |
| Signer loses key (1 of N) | LOW | Squads transaction to rotate signer; add new signer pubkey; remove old. Documented runbook. |
| Signers below threshold (irrecoverable) | **CRITICAL** | Authority permanently inaccessible. Communicate honestly; no recovery. Protection: 3-of-5 minimum, diversity policy. |
| Copycat mint campaign | MEDIUM (hours of response) | Publicly denounce; submit to Phantom/Jupiter/Solscan blocklist; DMCA phishing sites; community alerts. Speed matters. |
| Jupiter verification rejected | LOW-MEDIUM | Build organic volume; re-submit via Standard Review or 1000-JUP Express. Publicly document the rejection reason and remediation. |
| CG/CMC rejected | LOW-MEDIUM | Meet volume threshold; fix category; resubmit. Cooldowns can last weeks. |
| Permanent Delegate flagged as scam by RugCheck/Phantom | MEDIUM | Publish Clawback Policy; direct outreach to RugCheck/Phantom/Jupiter Working Group with documentation. |
| Unexpected mint event (attacker-minted) | **CRITICAL** | Immediate public statement; coordinate with CEXes to halt trading; Squads vote to revoke mint authority; potential Permanent Delegate clawback of attacker's mint if caught pre-sell. The 48–72h time-lock on mints (if implemented) mitigates. |
| Peg break > 10% | MEDIUM | Market-maker intervention; liquidity injection (if treasury has USDC); public communication distinguishing price drift from insolvency (there's no reserve to be insolvent against); frame as expected soft-peg behavior. |
| Keypair leaked to git | **CRITICAL** (if mainnet authority) | Immediate Squads rotation if multisig protected; if EOA holds authority, the authority is compromised — move authority to multisig immediately. Rotate all associated infrastructure. |
| Metadata rug (update authority compromised) | MEDIUM | Squads rotate update authority; update metadata back to correct values; post-mortem. Prevention: lock metadata updateAuthority immutability after finalization. |

## Pitfall-to-Phase Mapping

Suggested phase ordering for the CAYC roadmap based on pitfall prevention dependencies.

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| #1 Wrong extension at mint init | Phase 2 (Devnet Deploy) | Devnet mint passes `getMint` + `getTokenMetadata` inspection; extensions all present |
| #2 Stablecoin labeling (legal) | Phase 1 (Policy) | Legal counsel sign-off; "stablecoin" absent from all public copy |
| #3 Permanent Delegate red flag | Phase 1 (Policy) + Phase 5 (Listings) | Clawback Policy published on website before mint init |
| #4 Authority transfer window | Phase 3 (Squads Setup) → Phase 4 (Ceremony) | Squads vault exists BEFORE mint init; mint init uses vault as authority |
| #5 Threshold / signer lockout | Phase 3 (Squads Setup) | Devnet rotation drill passes; signer-diversity audit documented |
| #6 Extension combination bugs | Phase 2 (Devnet Deploy) | Metadata renders correctly on Phantom, Solflare, Backpack, Jupiter, Solscan |
| #7 Wrong Token-2022 program ID | Phase 2 + Phase 4 | Program ID verified against printed reference at ceremony |
| #8 Unexpected mints destroy trust | Phase 1 (Policy) + Phase 6 (Ops) | Supply policy published; monitoring + announcement automation in place |
| #9 Live mint authority attack surface | Phase 1 (Supply decision) + Phase 3 + Phase 6 | Either mint authority revoked post-initial-mint OR time-lock + 3rd-party monitoring in place |
| #10 Hardcoded keys / .env leak | Phase 0 (Repo Setup) — every phase | `gitleaks` clean; `.gitignore` verified; deploy scripts require explicit cluster flag |
| #11 Squads vault vs multisig address | Phase 3 + Phase 2 (Devnet) | Devnet multisig-signed mint succeeds |
| #12 Copycat / canonical address | Phase 0 (Branding) + Phase 5 + Phase 6 | Social handles registered pre-launch; canonical mint published; monitoring live |
| #13 Freeze authority misuse | Phase 1 (Policy) + Phase 6 (Ops) | Freeze runbook + transparency log + unfreeze SLA published |
| #14 LP rug accusation / thin liquidity | Phase 5 (DEX Launch) | LP locked on-chain; lock tx sig published; DexScreener shows padlock |
| #15 No incident runbook | Phase 6 (Ops) — must exist pre-Phase-4 | All 9 incident runbooks written and tabletop-exercised |
| #16 Listing submission rejections | Phase 5 (Listings) | Submissions sequenced in dependency order; each step validated before the next |

### Suggested Phase Ordering

This ordering is derived from the pitfall dependencies above. It prioritizes irreversible decisions and upstream dependencies before downstream work.

**Phase 0 — Foundation & Policy (before any code)**
- Legal review of "stablecoin" language (P2)
- Supply policy drafted (P8)
- Clawback/Freeze policy drafted (P3, P13)
- Domain + social handles registered (P12)
- Repo hygiene: `.gitignore`, `gitleaks`, secrets-scanning CI (P10)

**Phase 1 — Squads Multisig Setup (before any mint)**
- Signer diversity audit (P5)
- Hardware wallets provisioned, firmware updated (P5)
- Devnet Squads created; rotation drill completed (P5, P11)
- Vault PDA derived and documented (P4, P11)

**Phase 2 — Devnet Mint & Validation**
- Deploy Token-2022 mint with Metadata + Permanent Delegate, vault-authority from init (P1, P4, P6, P7)
- Verify all extensions, all authorities, metadata across all wallets (P6)
- Run multisig-signed mint of 500M (P1, P11)
- Run rotation, freeze, unfreeze, burn drills (P5, P13)

**Phase 3 — Mainnet Ceremony Preparation**
- All runbooks written (P15)
- Ceremony machine provisioned, offline until ceremony (P10)
- Status page live pre-launch (P15)
- Legal sign-off on all public copy (P2)

**Phase 4 — Mainnet Launch Ceremony**
- Deploy mint identical to devnet artifact (P1, P7)
- Publish canonical mint address + artifacts (P12)

**Phase 5 — DEX Liquidity & Early Listings**
- Seed locked LP with depth + USDC pairing (P14)
- Establish organic volume (P16)
- Submit to Solscan (logo + metadata) (P16)
- Submit to Jupiter Verify once organic score permits (P16)

**Phase 6 — Broader Listings & Market Maker**
- CG submission (volume met, correct category) (P2, P16)
- CMC submission ($50k+ daily volume) (P16)
- CEX outreach with compliance package (P3, P13, P14)
- Market maker contract for CEX phase (P14)

**Phase 7+ — Ongoing Operations**
- Incident response on-call rotation (P15)
- Copycat monitoring (P12)
- Signer rotation annually (P9)
- Transparency logs maintained (P8, P13)

## Sources

- [Token Extensions | Solana](https://solana.com/docs/tokens/extensions) — canonical extension specification
- [Permanent Delegate | Solana](https://solana.com/docs/tokens/extensions/permanent-delegate) — official Permanent Delegate docs
- [Solana's Permanent Delegate Burn Scam (DEV Community, 2026)](https://dev.to/ohmygod/solanas-permanent-delegate-burn-scam-how-token-2022-extensions-power-2026s-largest-automated-rug-4579) — 2026 scam factory analysis; RugCheck 40% flag rate
- [Scammers Exploit Solana Token Feature to Burn Users' Crypto (CryptoRank)](https://cryptorank.io/news/feed/0cf43-scammers-exploit-solana-token-feature-to-burn-users-crypto) — Jupiter Working Group call-out
- [The Solana Token 2022 Specification (RareSkills)](https://rareskills.io/post/token-2022) — extension interaction details
- [Token-2022 metadata: from conventions to state (Chainstack)](https://chainstack.com/solana-token-2022-metadata-from-conventions-to-explicit-state/) — metadata extension patterns
- [Why Updating Token-2022 Metadata Often Fails (DEXArea / Medium)](https://medium.com/@dexarea/why-updating-token-2022-metadata-often-fails-and-how-we-solved-it-at-dexarea-b0535a023842) — MetadataPointer requirement
- [Squads V4 (GitHub)](https://github.com/Squads-Protocol/v4) — official Squads source
- [Squads Token Manager docs](https://docs.squads.so/main/navigating-your-squad/developers-assets/token-manager) — vault PDA usage
- [LayerZero Solana Guidance](https://docs.layerzero.network/v2/developers/solana/technical-reference/solana-guidance) — durable-nonce attack warning; vault-vs-multisig confusion
- [Fortifying Squads (Medium)](https://medium.com/@aboladeevans/fortifying-squads-advanced-strategies-for-secure-multi-sig-signing-on-solana-453b8f4fed3d) — signer security practices
- [Secure Multisig Best Practices (SEAL)](https://frameworks.securityalliance.org/wallet-security/secure-multisig-best-practices/) — threshold and diversity recommendations
- [Jupiter Verify V3 FAQ](https://discuss.jup.ag/t/faq-token-list-v3-verification/23074) — VRFD criteria; organic score + smart likes
- [Jupiter Verify portal](https://verified.jup.ag/) — current verification UI
- [Solscan Token Update Guideline](https://info.solscan.io/solscan-token-update-guideline/) — metadata + logo requirements
- [Solscan Top Block Explorers 2025](https://info.solscan.io/top-sol-block-explorers-2025/) — reputation system, "Unclassified" default
- [CoinGecko & CMC Listing Guide (Tokpie)](https://tokpie.io/blog/list-solana-token-on-cmc-and-coingecko/) — listing criteria overview
- [Global Stablecoin Regulations 2026 (BVNK)](https://bvnk.com/blog/global-stablecoin-regulations-2026) — GENIUS + MiCA summary
- [US GENIUS Act vs EU MiCA (World Economic Forum)](https://www.weforum.org/stories/2025/09/us-genius-act-eu-mica-convergence-crypto-rules/) — regulatory convergence
- [Global Stablecoin Compliance Guide (Sumsub)](https://sumsub.com/blog/global-stablecoin-compliance-guide/) — criminal penalties for false stablecoin claims
- [Stablecoin Regulation Guide 2026 (Bitwage)](https://bitwage.com/en-us/blog/stablecoin-regulation-guide-2026-genius-clarity-mica) — reserve requirements
- [USR Stablecoin Minting Exploit (CoinMarketCap)](https://coinmarketcap.com/academy/article/usr-stablecoin-drops-86percent-after-minting-exploit) — 80M uncollateralized mint; 86% depeg
- [Stablecoin Security Design Choices (Hacken)](https://hacken.io/discover/stablecoin-security/) — design vulnerabilities
- [Understanding Frozen Tokens (Solflare)](https://help.solflare.com/en/articles/9271566-understanding-frozen-tokens-and-freeze-authority-on-solana) — freeze UX
- [Should stablecoin issuers be able to freeze accounts (Crypto Is Macro)](https://www.cryptoismacro.com/p/should-stablecoin-issuers-be-able) — freeze controversy
- [Solana Co-Founder Calls for Court-Controlled Stablecoin Freezes (NFTevening)](https://nftevening.com/solana-co-founder-calls-court-controlled-stablecoin-freezes/) — April 2026 Drift incident context
- [Beware of Solana Phishing Attacks (SlowMist)](https://slowmist.medium.com/beware-of-solana-phishing-attacks-wallet-owner-permissions-may-be-altered-708bbb30518e) — phishing vectors
- [Exposing Solana Scammers (GoPlus Security)](https://goplussecurity.medium.com/exposing-solana-scammers-scams-and-phishing-b5a4e0ca2676) — copycat + phishing patterns
- [Solana LP Locker (StakePoint)](https://stakepoint.app/solana-lp-locker) — LP locking mechanism
- [DexScreener padlock guide](https://www.soltokenburner.com/blog/dexscreener-padlock-liquidity-lock) — LP lock visibility
- [Protect Your Solana API Keys (Helius)](https://www.helius.dev/docs/rpc/protect-your-keys) — key management
- [Production Readiness (Solana Docs)](https://solana.com/docs/payments/production-readiness) — mainnet checklist
- [Token 2022 Program on Solscan](https://solscan.io/account/TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb) — canonical program ID reference

---
*Pitfalls research for: CAYC Solana Token-2022 payments token with Squads governance*
*Researched: 2026-04-19*
