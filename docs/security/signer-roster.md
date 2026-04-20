# CAYC Multisig Signer Roster

**Version:** 1.1 (Phase 2 Plan 02-06 — pubkeys populated from mainnet ceremony transcript.)
**Status:** Finalized — real mainnet pubkeys in place, pseudonymous identities.
**Visibility:** This file is committed to the public repository. It contains ONLY role, pseudonym, pubkey, device class, and timezone bucket. It contains no personally-identifying information, no email addresses, no device serial numbers, and no physical addresses. The coordinator's private ledger (pseudonym-to-identity mapping, contact channels, exact locations) is kept OUTSIDE the repo.

---

## Multisig parameters

- **Program:** Squads v4 (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`)
- **Network:** mainnet-beta
- **Threshold:** 3 of 5 voting members (plus 1 proposer-only member who cannot vote)
- **Multisig address:** `46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`
- **Vault PDA:** `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`
- **Creation tx:** `Dtx1x2kcwicMfo4LVqSjkzBWpjTa4cv7ALj82FMQZTwMFSBuQxmuw9CTDiYpHCkFFCqKUp7eaEYVQFKJzMX5XJs` (slot 414500481, 2026-04-20)
- **Time lock:** 0 slots (multisig-discipline time-lock per `docs/policies/mint-policy.md` section 5 — the discipline is social, not chain-enforced, for v1)

## Voting members (5 of 5 - all `Permissions.all()`)

Each of the five voting members has `Permissions.all()` (mask 7: Initiate | Vote | Execute). Any three together meet the threshold.

### Signer 1

- **Role:** Founder / primary operator
- **Pseudonym:** `cayc-alpha`
- **Pubkey:** `DwK4842jNasCGigQ1BruQxRFKpXevnBmPwuKLJVXBMuu`
- **Device class:** Ledger (Nano X or Nano S Plus — CONTEXT.md override; see §"Vendor diversity" below)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone bucket:** Americas
- **Liveness SLA:** responds to ceremony / proposal notifications within 4 hours (business hours) / 24 hours (off-hours)

### Signer 2

- **Role:** Co-founder / advisor
- **Pseudonym:** `cayc-beta`
- **Pubkey:** `G28iLXukQFExfZ21Gaq5M7CdqBFPmvkwwfRotxvU7ESq`
- **Device class:** Ledger (Nano X or Nano S Plus)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone bucket:** Americas
- **Liveness SLA:** responds to ceremony / proposal notifications within 8 hours (business hours) / 24 hours (off-hours)

### Signer 3

- **Role:** Trusted signer (family / long-term collaborator)
- **Pseudonym:** `cayc-gamma`
- **Pubkey:** `5BnDpWnRh8aZ3oFVBn54Z8mF2agnCcNJyTKS179fYU3b`
- **Device class:** Ledger (Nano X or Nano S Plus)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone bucket:** Americas
- **Liveness SLA:** responds to ceremony / proposal notifications within 12 hours (business hours) / 24 hours (off-hours)

### Signer 4

- **Role:** Trusted signer (family / long-term collaborator)
- **Pseudonym:** `cayc-delta`
- **Pubkey:** `HBEqzqWmzvhQq3jAKBAdsE2DzoiGoKEy5A22d7jTMNPt`
- **Device class:** Ledger (Nano X or Nano S Plus)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone bucket:** Americas
- **Liveness SLA:** responds to ceremony / proposal notifications within 12 hours (business hours) / 24 hours (off-hours)

### Signer 5

- **Role:** Trusted signer (advisor / co-founder)
- **Pseudonym:** `cayc-epsilon`
- **Pubkey:** `KzCZnpmePppaQf9D9jcWnKPoiDTdznK7g4qKt73zD3n`
- **Device class:** Ledger (Nano X or Nano S Plus)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone bucket:** Americas
- **Liveness SLA:** responds to ceremony / proposal notifications within 8 hours (business hours) / 24 hours (off-hours)

## Proposer (1 member - `Permission.Initiate` only, no Vote, no Execute)

The proposer is a Squads member with `Permissions.fromPermissions([Permission.Initiate])` (mask 1). It can create proposals and fee-pay the proposal-create transaction; it cannot approve, and cannot execute. Threshold=3 voting members must still approve any proposal before it executes.

### Proposer hot wallet

- **Role:** Proposal creator / fee payer. **NOT** a voting member.
- **Pseudonym:** `cayc-proposer`
- **Pubkey:** `2gUjoCGqqoxQ9ivrTqGhHmtLqvFp3gvDRYCrMAwtkxA1`
- **Device class:** filesystem Ledger is possible, but a gitignored filesystem keypair on the coordinator's operational machine is expected for v1
- **Custody:** gitignored path (pattern `keys/mainnet/proposer.json` or `.env.mainnet MAINNET_PROPOSER_KEYPAIR_PATH`). Rotated quarterly per Phase 5 operational policy. Funded with SOL ONLY — holds no mint authority.
- **Permission mask:** `Permission.Initiate` (1). Can create vault and config proposals; cannot approve; cannot execute.

## Vendor diversity

**Vendor diversity: ACCEPTED TRADEOFF.** ROADMAP.md Phase 2 Success Criterion 2 recommended device-diverse hardware wallets (Ledger + Trezor + Keystone). CONTEXT.md §decisions overrides to all-Ledger for Solana tooling maturity and signer onboarding simplicity. Accepted tradeoff: vendor diversity is concentrated on Ledger; a Ledger-wide vulnerability would affect all 5 voting signers simultaneously.

Mitigations:

1. **Current firmware.** Signers are kept on current Ledger firmware. Phase 5 ops runbook includes an annual firmware-refresh campaign and a pre-any-rotation refresh check.
2. **Regional distribution.** Signers are distributed across timezones and locations. A regional Ledger firmware-rollout issue will not hit all 5 simultaneously, allowing detection before full rollout.
3. **Rotation drill rehearsed.** The rotation drill was executed on devnet (see `artifacts/devnet-sessions/rotation-drill.md` — AddMember + RemoveMember with net-zero member count). Mainnet rotation runbook at `docs/runbooks/authority-rotation.md` documents the same procedure.
4. **Migration path if disclosure.** If a Ledger-wide vulnerability is disclosed, the rotation runbook allows migration to a mixed-vendor roster within one rotation cycle (typically 14 days end-to-end: procure + fund + propose + approve + execute, per `docs/runbooks/authority-rotation.md`). This is not a hypothetical — the drill is already proven on devnet.

The tradeoff is documented here (and in `docs/runbooks/mainnet-squads-ceremony-preflight.md` Stage A3) so CEX reviewers reading the compliance package understand the rationale and mitigation profile. Silent removal of this acknowledgement would break acceptance criteria in Plan 02-04.

## Policy binding

Every signer is bound, by accepting their slot in this roster, to:

- `docs/policies/mint-policy.md` section 8 Signer accountability — mint operations never executed unilaterally; signers confirm proposal context before approving; signers disclose material conflicts of interest.
- `docs/policies/clawback-freeze-policy.md` section 10 Signer accountability — freeze/clawback operations executed ONLY under the narrow scope of that policy; signers decline proposals that fall outside scope or lack the required evidence packet.

Violations of either policy trigger the rotation procedure at `docs/runbooks/authority-rotation.md`. The Squads multisig can rotate any signer with a 3-of-5 vote.

## Ceremony transcript

The mainnet Squads v4 multisig creation ceremony is recorded in detail at
[`artifacts/mainnet-sessions/multisig-creation.md`](../../artifacts/mainnet-sessions/multisig-creation.md).
That document contains:

- Commit SHA the ceremony script ran at
- The full parameter bundle the operator confirmed before broadcasting the transaction
- The human-confirmation timestamp
- The `multisigCreateV2` transaction signature + Solana Explorer URL
- The on-chain readback that confirmed threshold + member count
- The Pitfall 11 defense-in-depth re-derivation that confirmed vault PDA matches (artifact-internal consistency)

The machine-readable source of truth for the same data is `artifacts/mainnet.json`
(validated by `pnpm squads:publish-artifacts`).

**Note on GOV-04.** This plan and its artifacts do NOT close GOV-04 on mainnet. The GOV-04 mainnet invariant — that the PRODUCTION mint's mint, freeze, and metadata-update authorities all equal the Squads vault PDA — cannot be checked until the production mint exists, which happens in Phase 4. Phase 4 DEP-04 will perform that on-chain authority check against the real mint. In Phase 2, GOV-04 is closed for devnet only (see `artifacts/devnet-sessions/smoke-test-mint.md`).

## Version history

| Version | Date       | Change                                                                                                                                                                                                                                         |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-04-20 | Template created (Plan 02-04). Pubkeys left blank — populated in Plan 02-06 post-mainnet-ceremony.                                                                                                                                             |
| 1.1     | 2026-04-20 | Pubkeys populated from `artifacts/mainnet.json` (Plan 02-06). Multisig address + vault PDA + creation tx populated. Ceremony transcript cross-link added. GOV-04 mainnet-arm note added (deferred to Phase 4 DEP-04). No real names committed. |

---

_Phase: 02-squads-multisig-setup-devnet-mainnet_
_Plan: 04 (template) → Plan 06 (pubkey population)_
