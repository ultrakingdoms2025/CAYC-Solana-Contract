# CAYC Clawback & Freeze Authority Policy

**Version:** 1.0 (draft — to be published on caycsolana.com during Phase 5 Ops Go-Live)
**Effective date:** upon first public publication of this document
**Last reviewed:** 2026-04-19
**Applies to:** CAYC (Cyber Ape Yacht Club 8G) — Solana Token-2022 branded payments token, USDC-referenced.

> **Important:** CAYC retains both a **Freeze authority** and a **Permanent Delegate** authority. This document defines the narrow, auditable, and appeal-able scope in which those authorities may be used. Any use outside this scope is a policy violation and will result in signer rotation. This policy exists because, under the Solana Token-2022 standard, Permanent Delegate authority cannot be revoked after mint creation; Freeze authority _can_ be revoked but has been deliberately retained to support compliance scenarios comparable to regulated stablecoins (USDC, USDT).

## 1. Purpose

Permanent Delegate and Freeze authorities are powerful: they allow the multisig to move any holder's CAYC (Permanent Delegate) or to lock any holder's CAYC-holding token account (Freeze). Without a published, narrow-scope policy, these features present as centralization risks indistinguishable from a scam. This policy defines the exact scenarios in which each authority may be used, the governance process required, the transparency commitments, and the user recourse path.

## 2. Authority model

- The **Permanent Delegate** is set to the **Squads v4 multisig vault PDA** at mint initialization and cannot be changed or revoked (Token-2022 standard).
- The **Freeze authority** is set to the **Squads v4 multisig vault PDA** at mint initialization and is **retained** (not revoked). A future version of this policy may commit to revoking Freeze authority once CAYC has mature CEX coverage that no longer benefits from it; any such commitment will follow the policy-amendment procedure in Section 11.
- No single signer can invoke either authority. Every clawback or freeze action requires a Squads proposal with the threshold number of signatures before execution.

## 3. Permitted uses of Freeze authority

Freeze authority (the power to lock a specific token account so CAYC cannot be transferred in or out of it) may be used ONLY in the following narrowly-defined scenarios:

1. **Valid lawful order.** A court order, subpoena, OFAC sanction addition, or equivalent binding order from a jurisdiction in which CAYC holders, the multisig operator, or a CAYC-facing service provider operate. The order must be in writing, the ordering authority must be verifiable, and legal counsel must have reviewed the order before signers are asked to vote.
2. **Documented theft or scam recovery.** A specific wallet address has been credibly reported to have received stolen CAYC from a verifiably-victimized user, where: (a) the victim has filed a report with the CAYC operator (Section 7) including on-chain evidence (tx signatures showing the unauthorized transfer), (b) the reported thief address has not moved the stolen CAYC to a second address, and (c) freezing would meaningfully protect the victim by preserving recoverable assets.

Both scenarios require the multisig vote described in Section 5.

## 4. Permitted uses of Permanent Delegate authority

Permanent Delegate authority (the power to transfer CAYC out of any holder's token account without the holder's signature) may be used ONLY in the following narrowly-defined scenarios:

1. **Completion of a theft recovery after freeze.** If an account has been frozen under Section 3.2 AND the legitimate victim has been identified AND legal counsel has confirmed that the multisig operator has a legal basis to effect the recovery (this typically requires a court order; check with counsel for every incident), the Permanent Delegate may be used to transfer the recovered CAYC back to the victim's wallet.
2. **Execution of a lawful order.** Where a court order or equivalent binding order requires the CAYC to be moved (not just frozen) to a specific destination.

Section 4 is strictly narrower than Section 3. Every Permanent Delegate use implies a prior Freeze action and a written legal-counsel review.

## 5. Approval procedure (both authorities)

Every proposed use of Freeze or Permanent Delegate authority follows this procedure:

1. **Intake.** The incident is reported via the channels in Section 7 or arrives via a lawful order. The multisig operator logs the intake with a timestamp and a unique ticket ID.
2. **Evidence review.** Two multisig signers independently review the evidence. For theft scenarios: transaction signatures, victim identity, chain-of-custody of reports. For lawful orders: authenticity of the ordering authority, scope of the order.
3. **Legal counsel review.** External counsel reviews the proposed action and confirms in writing that the action is within the scope of this policy and within applicable law. Mandatory for every Permanent Delegate use. Mandatory for Freeze where the facts are not clear-cut (theft-recovery fact patterns frequently are not).
4. **Proposal creation.** A Squads proposal is created. The proposal description includes: the ticket ID, the target token account address (named twice — see Section 6), the reason category (lawful-order / theft-recovery / other), a link to the evidence bundle (hosted on the CAYC repository under `docs/security/incidents/{ticket-id}.md` with sensitive details redacted), and a link to counsel's written review.
5. **Signer vote.** The threshold number of signers must approve. Signers verify the target address character-by-character against the evidence bundle before signing; any signer who cannot verify must not sign.
6. **Execution.** The proposal is executed on-chain.
7. **Public log entry.** The action is added to the **Freeze Transparency Log** (Section 8) within 24 hours of execution, or within 24 hours of the relevant court order becoming public where the order initially imposes a disclosure delay.

If any step in 1–5 is skipped, the action is a policy violation. Signers commit individually and collectively to refuse to sign proposals that skip steps.

## 6. Target-address integrity requirements

Copy-paste errors have historically caused catastrophic freeze incidents in other protocols. Every Freeze or Permanent Delegate proposal MUST satisfy:

- The target token account address is named **twice** in the Squads proposal (once in the title field, once in the description field) and both occurrences must match character-by-character. A mismatch fails the integrity check.
- The proposal targets exactly **one** token account per instruction. Batched freeze operations (freezing many accounts in a single proposal) are prohibited. Each account is its own proposal.
- The proposal is accompanied by a verification artifact (a signed file or commit in the `docs/security/incidents/{ticket-id}.md` record) that identifies the owner of the target token account (owner wallet address), the current balance, and a short rationale for why this specific account is the correct target.

## 7. User recourse / appeal path

Users whose accounts have been frozen or whose CAYC has been clawed back may appeal:

1. **Report the incident** to `compliance@caycsolana.com` OR file a GitHub Issue in the CAYC repository tagged `freeze-complaint`. Include: your wallet address, the frozen token account address, the approximate time of freeze, and any context you believe is relevant.
2. **Initial response SLA:** the multisig operator commits to an initial response within **24 hours** on business days, and within **48 hours** on weekends or holidays.
3. **Resolution SLA:** the multisig operator commits to a resolution (either unfreeze, affirm the freeze with explanation, or escalate to counsel) within **72 hours** of the initial response.
4. **Escalation path:** if a user believes the multisig operator has acted in bad faith or outside this policy, the user may pursue dispute resolution via the jurisdiction of the multisig operator's legal entity (disclosed at launch on caycsolana.com) and may publicly report the incident to any of: RugCheck.xyz, the Jupiter Core Working Group, Phantom wallet security, or Solscan reputation reviewers.

This SLA is a public commitment, not a legal guarantee. Users have no contractual claim against the multisig operator by virtue of holding CAYC; however, the multisig operator undertakes the SLA as a matter of published policy and will maintain a public compliance record.

## 8. Freeze Transparency Log (public, maintained from launch)

A public append-only log will be maintained at `caycsolana.com/freeze-log` and mirrored in the CAYC repository at `docs/security/freeze-transparency-log.md`. Each entry contains:

- **Ticket ID:** unique identifier.
- **Timestamp (UTC):** of the on-chain action.
- **Reason category:** `lawful-order` | `theft-recovery` | `other`.
- **Transaction signature(s):** on-chain proof of the action.
- **Target token account address:** the frozen (or clawed-back) account.
- **Affected owner wallet:** the wallet that owns the frozen token account (at the time of freeze).
- **Amount affected:** if Permanent Delegate clawback was used, the amount; if Freeze-only, the balance at time of freeze.
- **Resolution:** status (pending / reversed / sustained) and resolution timestamp.
- **Redactions:** where the log text has been partially redacted (e.g., to protect an ongoing investigation), the redaction is explicit (`[redacted — sealed lawful order]`), and the legal basis for the redaction is named.

The log starts empty at launch. Entry 0 will be a "policy effective date" marker entry, published on the same day the policy takes effect on the website.

## 9. What this policy does NOT permit

Freeze and Permanent Delegate authority will NOT be used for:

- **Censorship of lawful speech or activity.** Freezing a wallet because it publicly criticizes the project, or because it is associated with a competing token, or because it is associated with a political view, is prohibited.
- **Competitive interference.** Freezing a wallet because it is associated with a competitor, a market-maker for a competitor, or otherwise to affect trading dynamics is prohibited.
- **Private-party disputes.** The multisig operator does not arbitrate commercial, custody, or partnership disputes between CAYC holders unless a binding lawful order so requires.
- **Price management.** Freezing or clawback will never be used to manipulate the market price of CAYC.
- **Retaliation against users who appeal.** A user who exercises the Section 7 recourse path will not face additional or retaliatory freezes.
- **"Emergency" bypass of the Section 5 procedure.** There is no emergency procedure. The Section 5 procedure IS the emergency procedure.

## 10. Signer accountability

Every signer is individually bound by this policy. A signer who signs a Freeze or Permanent Delegate proposal that violates this policy — even if the threshold is reached by others — is considered to have broken the public commitment, and the multisig operator will initiate signer rotation to remove them.

## 11. Relationship to other policies and amendment procedure

- **Mint Policy** (`./mint-policy.md`) governs mint authority separately from this policy.
- **Operations Runbook** (Phase 5) implements this policy procedurally; it does not amend the policy.
- **Amendment procedure:** substantive changes to this policy (changes to permitted scope, to the SLA, to the Transparency Log format) require a 14-day public notice period on all five canonical channels (see the Mint Policy, Section 6) before taking effect. Editorial changes (typos, formatting) may be applied immediately and tracked in the version history.

## 12. Public contact

- GitHub Issues on the CAYC repository: issues tagged `freeze-policy` or `freeze-complaint`.
- Email: `compliance@caycsolana.com`.
- Discord: `#freeze-policy` channel, monitored by at least one multisig signer.

## 13. Version history

| Version | Date       | Summary of changes                                                                                                                                                                                     | Changed by                      |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| 1.0     | 2026-04-19 | Initial draft — Phase 1 POL-03 deliverable. Defines narrow scope for Freeze and Permanent Delegate authorities; establishes Freeze Transparency Log commitment; establishes 24/48/72-hour appeal SLAs. | Project maintainer (pre-launch) |

## 14. Legal posture (reminder)

The existence of Freeze and Permanent Delegate authorities does NOT make CAYC a regulated stablecoin, an e-money token, or an asset-referenced token. These authorities exist primarily to support compliance with lawful orders and to enable theft-recovery in narrow circumstances, consistent with the operational posture of regulated stablecoin issuers (USDC, USDT) but WITHOUT the regulated-issuer legal status. Nothing in this policy creates a redemption right, a reserve commitment, or any contractual obligation of the multisig operator to CAYC holders beyond the public commitments made in this document.

## 15. Copycat mint and phishing-risk acknowledgement

CAYC's symbol ("CAYC") is already claimed on Solana mainnet by an unrelated pump.fun Token-2022 mint at address `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` (name: "Clawed Ape Yacht Club"; created 2026-02-27; ~47 holders; organic-score label "low"; see `../symbol-availability-check.md` for the full POL-01 evidence record). The CAYC team has elected to retain the CAYC symbol with public-copy disambiguation — first references in all public-facing material use the full form "CAYC (Cyber Ape Yacht Club)" — rather than rename. This decision creates a permanent copycat / phishing risk surface: users searching "CAYC" on Jupiter and Solscan will see both mints, and new deliberate-collision squatter mints may appear between policy publication and mainnet launch (and beyond).

The CAYC multisig operator acknowledges this risk and commits to:

1. **Proactive copycat monitoring (Phase 5 OPS-07).** The OPS-07 requirement in Phase 5 establishes a copycat / phishing monitoring program. At minimum, the program watches the known squatter mint (`9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump`) for any visibility change (Jupiter verified-tag acquisition, sudden liquidity, CoinGecko listing) and scans for new Token-2022 mints declaring `symbol=CAYC` or a confusing name variant on a cadence specified in the Phase 5 Ops Runbook.
2. **Canonical-address publication.** The canonical CAYC mint address is pinned on every official channel (website, repository, X/Twitter, Discord, Telegram) and referenced in every policy document. Users verifying a CAYC transaction or token account should confirm the mint address matches the canonical record — **never** trust symbol or name alone.
3. **No use of Freeze or Permanent Delegate against copycat mints.** The CAYC multisig has no authority over unrelated mints — the squatter mint is fully outside the CAYC multisig's control surface and this policy's remedies explicitly do not reach it. Remedies against phishing are limited to ecosystem-level coordination (Jupiter, Phantom, RugCheck, Solscan reputation reviewers), public warnings, and takedown requests where applicable.
4. **Mainnet-ceremony preflight re-check.** Within 72 hours before the mainnet launch ceremony (Phase 4), a fresh symbol-availability check across all four platforms is mandatory. If the preflight check surfaces new squatters that materially change the landscape, the maintainer group will re-evaluate the disambiguation strategy before the ceremony.

This acknowledgement does not impose a contractual obligation on the multisig operator; it is a public commitment that users, exchanges, and listing reviewers may rely on when evaluating CAYC's operational posture.

---

_This is a draft document. It becomes binding upon publication to `caycsolana.com` during Phase 5 Ops Go-Live. The draft is archived in the CAYC repository under `docs/policies/clawback-freeze-policy.md` with the effective date updated at publication time._
