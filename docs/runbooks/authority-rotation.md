# Squads v4 Signer Rotation Runbook

**Version:** 1.0
**Status:** Active
**Scope:** Adding and removing Squads v4 signers on devnet AND mainnet
**Derived from:** Plan 02-03 devnet rotation drill (see `artifacts/devnet-sessions/rotation-drill.md`)

---

## When to use

Execute a signer rotation in any of these situations:

1. **Signer key compromise** — a signer reports their device was lost, stolen, or may
   have been tampered with. Rotate **immediately**; the rotated-out signer no longer
   participates in any future proposals.
2. **Signer departure** — a co-signer leaves the project (employment change, role
   change, personal decision). Rotate within 14 days of notice.
3. **Planned key refresh** — scheduled annual rotation per operational hygiene. Each
   signer generates a fresh seed on a new device, the old key is removed, the new key
   is added.
4. **Threshold change** — switching the `N-of-M` ratio (e.g., 3-of-5 → 4-of-6). This is
   a `ChangeThreshold` ConfigAction (not covered in depth here; same lifecycle pattern).

**Do NOT use rotation as a substitute for the clawback/freeze process.** Rotation affects
WHO can approve proposals; it does not affect any already-approved proposal or any past
on-chain state.

---

## Prerequisites

Before starting:

- [ ] **Threshold signers available.** For a 3-of-5 multisig, you need at least 3 of
      the 5 voting signers present (physically or remotely with hardware wallet
      connected and unlocked) for the duration of the drill.
- [ ] **Proposer hot wallet funded.** The proposer pays rent for the new Member slot
      when adding. Mainnet rule of thumb: at least 0.1 SOL in the proposer wallet
      (rent for the Member slot plus fees; growing the Multisig config account by one
      Member entry costs ~0.002 SOL). Devnet: 0.02 SOL is enough.
- [ ] **New signer pubkey verified.** For AddMember, confirm the pubkey out-of-band
      (voice call, video confirmation on a known-good channel) with the new signer
      BEFORE building the proposal. An attacker who tricks the team into adding their
      pubkey gets full Permissions. Read the pubkey character-by-character; base58
      lookalikes (I vs l, 0 vs O) are the adversary's friend.
- [ ] **`artifacts/<network>.json` up to date.** Confirm the `multisig_address` matches
      what `pnpm squads:verify-vault` prints. If not, the wrong multisig is being
      targeted.
- [ ] **Language audit clean.** `pnpm lang:audit` must exit 0 before committing any
      runbook edits.

---

## Add-signer procedure

Repeat for each new signer. One `AddMember` ConfigAction per transaction (no batching
— PITFALLS.md Pitfall 13 lesson applied to config ops: mixing multiple AddMember and
RemoveMember in a single proposal makes reviewer verification harder).

### 1. Build the proposal

```typescript
import { proposeConfigTransaction, approveProposal, executeConfigTransaction }
  from 'src/squads';
import * as multisig from '@sqds/multisig';

const proposal = await proposeConfigTransaction({
  connection,
  multisigPda,
  proposer,
  actions: [
    {
      __kind: 'AddMember',
      newMember: {
        key: NEW_SIGNER_PUBKEY,              // Verified out-of-band
        permissions: multisig.types.Permissions.all(),  // Full voting (mask=7)
      },
    },
  ],
  memo: 'AddMember: <signer-display-name> per ticket ROTATION-NNNN',
});
```

`proposeConfigTransaction` internally:

1. Reads the on-chain `transactionIndex` and increments by 1n (never re-use an index).
2. Calls `multisig.rpc.configTransactionCreate` with the AddMember action.
3. Waits for the create tx to reach `confirmed` commitment.
4. Calls `multisig.rpc.proposalCreate` to register the proposal for voting.
5. Waits for the proposal tx to reach `confirmed` commitment.
6. Returns `{ transactionIndex, createTxSig, proposalTxSig }`.

The two confirmation waits between RPC calls are critical. Without them, `proposalCreate`
races the ledger's view of `transactionIndex` and fails with
`AnchorError 6009: InvalidTransactionIndex`.

### 2. Collect threshold approvals

Each voting signer calls `approveProposal`. For mainnet, this is done through the
Squads web UI with the Ledger plugged in; the UI builds and submits the exact same
`proposalApprove` instruction.

```typescript
for (const signer of THRESHOLD_SIGNERS) {
  const sig = await approveProposal({
    connection,
    multisigPda,
    transactionIndex: proposal.transactionIndex,
    member: signer,
  });
  console.log(`approve tx: ${sig}`);
}
```

Collect exactly THRESHOLD approvals. More is fine; fewer cannot execute.

### 3. Execute

```typescript
const execSig = await executeConfigTransaction({
  connection,
  multisigPda,
  transactionIndex: proposal.transactionIndex,
  executor: ANY_VOTING_SIGNER,       // Any member with Execute permission
  rentPayer: proposer,               // CRITICAL for AddMember — see note below
});
```

**Gotcha — `rentPayer`.** AddMember grows the Multisig config account by one Member
slot. The growth requires rent. If `rentPayer` is omitted, it defaults to the executor.
Mainnet signers' Ledger wallets typically carry only enough SOL for tx fees — NOT enough
for a Member-slot rent grow. Always pass `rentPayer: proposer` for AddMember. The
proposer hot wallet is designed to absorb this cost (CONTEXT.md §decisions: proposer is
the dedicated SOL-paying hot wallet; voting signers' SOL is scarce and their hardware
wallets are not the place to top up balances).

### 4. Verify on-chain

```bash
pnpm squads:verify-vault --network <network> --multisig <MULTISIG_PDA>
```

Confirm:

- Member count increased by 1
- New signer's pubkey appears in the members list
- Permissions mask matches the intended role (7 for voting, 1 for proposer-only)
- Threshold unchanged (unless a separate ChangeThreshold action was run)

Store the `configTransactionExecute` transaction signature in your ticket + any
public signer-transparency log.

---

## Remove-signer procedure

### 1. Pre-flight check — threshold math

For a 3-of-M multisig where the threshold is **fixed at 3** and the member count
**shrinks below threshold**, the multisig becomes inoperable. Before removing,
verify:

- `post_remove_voting_member_count >= threshold`

For a 3-of-5 multisig, never go below 3 voting members without first lowering the
threshold (separate ChangeThreshold ConfigAction). In practice, remove AFTER adding a
replacement whenever possible.

### 2. Build the proposal

```typescript
const proposal = await proposeConfigTransaction({
  connection,
  multisigPda,
  proposer,
  actions: [
    { __kind: 'RemoveMember', oldMember: OLD_SIGNER_PUBKEY },
  ],
  memo: 'RemoveMember: <signer-display-name> per ticket ROTATION-NNNN',
});
```

### 3. Collect threshold approvals

Same as AddMember. **Important:** the signer being removed can approve their own
removal (it is a normal ConfigAction as far as the Squads program is concerned).
In compromise scenarios, the compromised signer will not cooperate — the threshold
must be met without them. With 3-of-5, losing 1 signer is fine; losing 3 is
catastrophic (see PITFALLS.md Pitfall 5).

### 4. Execute

```typescript
const execSig = await executeConfigTransaction({
  connection,
  multisigPda,
  transactionIndex: proposal.transactionIndex,
  executor: ANY_VOTING_SIGNER,
  // rentPayer omitted — RemoveMember shrinks the account (no rent needed)
});
```

RemoveMember does **not** require `rentPayer: proposer`; the executor can safely
default-pay because no rent-exposure is triggered.

### 5. Verify

```bash
pnpm squads:verify-vault --network <network> --multisig <MULTISIG_PDA>
```

Confirm:

- Member count decreased by 1
- Removed signer's pubkey NO LONGER appears in the members list
- Threshold unchanged (unless ChangeThreshold was run)
- Post-remove voting count >= threshold (otherwise multisig is locked)

---

## Verification checklist

After any rotation drill (add, remove, or paired):

- [ ] `pnpm squads:verify-vault` prints the expected member list
- [ ] `artifacts/<network>.json` is updated with the new roster (if tracked)
- [ ] Rotation transcript committed to `artifacts/<network>-sessions/rotation-*.md`
      with: timestamp, target pubkey, proposal txsig, approval txsigs, execute txsig,
      explorer URL, reviewer names
- [ ] Language audit + gitleaks + typecheck all green in the commit
- [ ] If mainnet: announcement posted to the 5 canonical channels (website, repo,
      X/Twitter, Discord, Telegram) per the Mint Policy amendment procedure

---

## Mainnet differences

The script-side flow is **identical** to devnet — the same TypeScript helpers
(`proposeConfigTransaction`, `approveProposal`, `executeConfigTransaction`) are
called. Differences:

1. **Approval step happens in the Squads web UI, not via `approveProposal` in a
   script.** Each mainnet signer opens https://app.squads.so/, connects their
   Ledger, navigates to the pending proposal, and clicks Approve. The Ledger
   displays the instruction details; the signer blind-signs (or, preferably with
   newer Ledger Solana app versions, clear-signs). The resulting tx signature is
   recorded in the Squads UI and observable in the multisig's `approved[]` list.

2. **Proposer is still a hot wallet** — the `proposeConfigTransaction` step is
   script-driven from the ops machine (not a Ledger), because Squads UI's
   proposer-only path is less deterministic than running our own tested code.

3. **Execution can be any voting signer** with Execute permission. Typically the
   last approver also clicks Execute in the UI, and that tx finalizes the
   rotation.

4. **Ceremony machine** is fresh/clean (PITFALLS.md Pitfall 10). No personal
   laptops. All signers are in the same time window (not necessarily physical
   room; video call + Squads UI is the default).

5. **Announcement obligations.** Non-trivial signer changes (compromise response,
   departure) trigger the Mint Policy §6 pre-announcement rule: post to the 5
   canonical channels within a 10-minute window. Routine annual rotations may use
   the abbreviated "signer rotation notice" template (published within 24h after
   execution, not before).

---

## Observations from the devnet drill (Plan 02-03)

The drill ran on `2026-04-20` against devnet multisig
`6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu`. Full transcript:
`artifacts/devnet-sessions/rotation-drill.md`. Notable findings:

- The first attempt **failed mid-proposal** with `InvalidTransactionIndex` (Anchor
  code 6009) because the @sqds/multisig RPC helpers broadcast-and-return without
  waiting for confirmation. `proposalCreate` raced the ledger's view of
  `transactionIndex` and tripped. Fix: `src/squads/proposals.ts` now calls
  `connection.confirmTransaction` between each chained RPC. This fix benefits the
  entire Phase 4 mainnet mint ceremony (Pattern 2: script-proposes, multisig-signs)
  which would otherwise see the same race on high-latency RPC.
- `rentPayer: proposer` is **required** for AddMember when the executor is a low-SOL
  voting signer. The drill's initial design defaulted `rentPayer` to the executor
  (signer-1 with 0.02 SOL) — the Member-slot rent grow would have failed. Fix
  encoded in the script and this runbook.
- `multisig.types.Permissions.all()` must be passed for the new Member's `permissions`
  field — a plain number (e.g., `7`) does not match the `Permissions` class shape the
  Anchor program expects to deserialize.
- Post-drill member count is a **net-zero** invariant after an add+remove pair. The
  drill script asserts this at the end; if the script exits cleanly, the invariant
  held. Orphan configTransactions from earlier failed attempts (index 1 in our run)
  persist on-chain but are harmless — they have no proposal and cannot be executed.

---

## Version history

| Version | Date       | Change                                                       |
| ------- | ---------- | ------------------------------------------------------------ |
| 1.0     | 2026-04-20 | Initial publication from Plan 02-03 devnet drill observations |
