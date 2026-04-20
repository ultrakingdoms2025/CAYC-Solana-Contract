# CAYC Multisig Signer Roster

**Version:** 1.0 (Phase 2 Plan 02-04 template; pubkeys filled in Plan 02-06 after the mainnet ceremony.)
**Status:** Template — no pubkeys yet.
**Visibility:** This file is committed to the public repository. It contains ONLY role, pseudonym, pubkey, device class, and timezone. It contains no personally-identifying information, no email addresses, no device serial numbers, and no physical addresses. The coordinator's private ledger (identifying information + contact channels) is kept OUTSIDE the repo.

---

## Multisig parameters

- **Program:** Squads v4 (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`)
- **Network:** mainnet-beta
- **Threshold:** 3 of 5 voting members (plus 1 proposer-only member who cannot vote)
- **Multisig address:** _to be filled in Plan 02-06 from `artifacts/mainnet.json`_
- **Vault PDA:** _to be filled in Plan 02-06 from `artifacts/mainnet.json`_
- **Time lock:** 0 slots (multisig-discipline time-lock per `docs/policies/mint-policy.md` section 5 — the discipline is social, not chain-enforced, for v1)

## Voting members (5 of 5 - all `Permissions.all()`)

Each of the five voting members has `Permissions.all()` (mask 7: Initiate | Vote | Execute). Any three together meet the threshold.

### Signer 1

- **Role:** Founder / primary operator
- **Pseudonym:** _to be assigned (e.g., `cayc-alpha`)_
- **Pubkey:** _filled in Plan 02-06 from mainnet ceremony transcript_
- **Device class:** Ledger (Nano X or Nano S Plus — CONTEXT.md override; see §"Vendor diversity" below)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone:** _tz code_
- **Liveness SLA:** responds to ceremony / proposal notifications within _N hours_

### Signer 2

- **Role:** Co-founder / advisor
- **Pseudonym:** _to be assigned (e.g., `cayc-beta`)_
- **Pubkey:** _filled in Plan 02-06 from mainnet ceremony transcript_
- **Device class:** Ledger (Nano X or Nano S Plus)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone:** _tz code_
- **Liveness SLA:** responds to ceremony / proposal notifications within _N hours_

### Signer 3

- **Role:** Trusted signer (family / long-term collaborator)
- **Pseudonym:** _to be assigned (e.g., `cayc-gamma`)_
- **Pubkey:** _filled in Plan 02-06 from mainnet ceremony transcript_
- **Device class:** Ledger (Nano X or Nano S Plus)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone:** _tz code_
- **Liveness SLA:** responds to ceremony / proposal notifications within _N hours_

### Signer 4

- **Role:** Trusted signer (family / long-term collaborator)
- **Pseudonym:** _to be assigned (e.g., `cayc-delta`)_
- **Pubkey:** _filled in Plan 02-06 from mainnet ceremony transcript_
- **Device class:** Ledger (Nano X or Nano S Plus)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone:** _tz code_
- **Liveness SLA:** responds to ceremony / proposal notifications within _N hours_

### Signer 5

- **Role:** Trusted signer (advisor / co-founder)
- **Pseudonym:** _to be assigned (e.g., `cayc-epsilon`)_
- **Pubkey:** _filled in Plan 02-06 from mainnet ceremony transcript_
- **Device class:** Ledger (Nano X or Nano S Plus)
- **Seed custody:** metal plate in fireproof safe; location separate from device
- **Timezone:** _tz code_
- **Liveness SLA:** responds to ceremony / proposal notifications within _N hours_

## Proposer (1 member - `Permission.Initiate` only, no Vote, no Execute)

The proposer is a Squads member with `Permissions.fromPermissions([Permission.Initiate])` (mask 1). It can create proposals and fee-pay the proposal-create transaction; it cannot approve, and cannot execute. Threshold=3 voting members must still approve any proposal before it executes.

### Proposer hot wallet

- **Role:** Proposal creator / fee payer. **NOT** a voting member.
- **Pseudonym:** `cayc-proposer`
- **Pubkey:** _filled in Plan 02-06 from mainnet ceremony transcript_
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

## Version history

| Version | Date       | Change                                                                                          |
| ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| 1.0     | 2026-04-20 | Template created (Plan 02-04). Pubkeys left blank — filled in Plan 02-06 post-mainnet-ceremony. |

---

_Phase: 02-squads-multisig-setup-devnet-mainnet_
_Plan: 04 (template) → Plan 06 (pubkey population)_
