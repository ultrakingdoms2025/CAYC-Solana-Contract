# Devnet Squads Rotation Drill Transcript

**Plan:** 02-03 Task 2
**Date (UTC):** 2026-04-20T04:57:02.513Z
**Network:** devnet
**Multisig:** 6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu
**Vault PDA:** 5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu

## Throwaway member rotated through

- pubkey: `FCkfUQaoDdqENeYuVmBjXNnJ1w2CTog6nh8b6ph8ETxh`
- origin: `Keypair.generate()` inside `scripts/squads/rotate-devnet-signer.ts`
- permissions proposed: `Permissions.all()` (mask=7, Initiate | Vote | Execute)

## Pre-drill state

- member count: 6 (5 voting + 1 proposer-only)
- threshold: 3

## AddMember proposal

- transactionIndex: 2
- configTransactionCreate tx: `2R36YHZQoYZYx6iZFdBpXykzDQ3Tp9w4mmvX65yYh2QNatbmrJiDREb52ingMkAH264mnCsT9aZ8YCcqaUABjZeK`
- proposalCreate tx: `5gw8MgHyT5SU1Y5SpTDAJHezty4pEEriWc9Q6UiavoSL8EZLzWYkrr2Fgc56ipKs5isXQnwWYWfWwiM7sFt7qCrW`
- approvals (3/5 voting threshold):
  - signer-1 approve tx: `3FNH7EcEZAYsL3wysvevQ1StA3RuUVMwVMV4PvtzxzHw7k9ZQPSemfVzczthByM5SqyC2qkj99NQYAWZooDqFPtj`
  - signer-2 approve tx: `7owSbmKSsEqvJKw1Y5uiGcZwX1R5FgMmEgUgdZMQBSvHZqMwkbv5bhRw77zxwMcmykmYShXLvurqi3pGy3vRRDc`
  - signer-3 approve tx: `2qoYJELJChSqzLnRSeLVeKzZHR9dTGmGmCe631xxQcxRZqBnRCVAkma1kHt7oxhWLCnxxRB9Bv9mbFjYPqrr8tA7`
- configTransactionExecute tx: `4KAQvUmXpMBfKw5baPEGRuHoVHrrT3rSJLZ7rzJVASVZf4rL97JAeQ9UZ2PrGjLc9akmTMtCXWst6yefyuQYxAuE`
- explorer: https://explorer.solana.com/tx/4KAQvUmXpMBfKw5baPEGRuHoVHrrT3rSJLZ7rzJVASVZf4rL97JAeQ9UZ2PrGjLc9akmTMtCXWst6yefyuQYxAuE?cluster=devnet
- post-Add member count: 7 (throwaway confirmed present)

## RemoveMember proposal

- transactionIndex: 3
- configTransactionCreate tx: `2qmJTkbBPkmWTJhkKfXVR2jtwnpjr6VUAnxaQd7ARj6TXuVE4LKiQ6KVLU5spCFk9MziP3B8kaaCfNT15Rvpv5AK`
- proposalCreate tx: `6nepKWaNHKwzCxSbUWJr9Xf1qDQ9bZ54UV7D4AGofwQuwwdPZrfZEHJKppvy91sLTgsc4LixhJguMxiawKMuqMY`
- approvals (3/5 voting threshold):
  - signer-1 approve tx: `22PdQ7uWVwiYquW7Q9mnkNpypee1zuKZiYHfuKB2qHpJzAEMeoXCHAih8oWj6nrcE2Kya85VYR6B8LjvvTj79nDP`
  - signer-2 approve tx: `5eAqoByqxsevB3YYLtAszvk8KFheZ4nHJh8M1E9uAUGu5x41C3QVroiqis2MDjgfXc7YaNDKYPDMejVkjM4L9eaJ`
  - signer-3 approve tx: `3qdz56Yw6LfcdJAfwKjn3dXUgxsU93K8e4DV9HFAC228iyuC1V5Re3JneUMTnfpS5eK1VgsTiWb2P9r16mNCpBDy`
- configTransactionExecute tx: `437EwdnwJhqEZL1t1h69VCTpcMTpaDuBS5eF5sz3wk9zs3gJXuTWPF6RPmoDRjQSaY5mZenoMt5HfRg1TNLSF9P9`
- explorer: https://explorer.solana.com/tx/437EwdnwJhqEZL1t1h69VCTpcMTpaDuBS5eF5sz3wk9zs3gJXuTWPF6RPmoDRjQSaY5mZenoMt5HfRg1TNLSF9P9?cluster=devnet
- post-Remove member count: 6 (net-zero confirmed)

## Observations / gotchas

- The `__kind: "AddMember"` ConfigAction requires a `Member` object whose `permissions`
  is a `Permissions` instance (not a plain number). We pass `multisig.types.Permissions.all()`
  which is the canonical constructor and matches the mask=7 used by `buildVotingMembers`.
- `executeConfigTransaction` was called with `rentPayer: proposer` for the AddMember
  step — the Multisig config account grows by one Member slot on AddMember and the growth
  requires rent. Without an explicit `rentPayer`, the helper defaults to the executor.
  On devnet the signer executing (signer-1) had only 0.02 SOL — enough for tx fees, not
  enough to pay the rent for a new Member slot. Using proposer (1.7+ SOL) as rentPayer
  is the correct pattern for mainnet too (signers' SOL is scarce, proposer is the
  dedicated hot wallet).
- `executeConfigTransaction` for RemoveMember does NOT require rent — shrinking the
  members array does not request new rent; defaulting rentPayer to the executor is fine.
- The SDK signatures match the expectations from Plan 02-03 `<interfaces>`:
  `vaultTransactionExecute` takes `member: PublicKey` (NOT Signer);
  `configTransactionExecute` takes `member: Signer` (must sign the outer tx).

## Post-drill verification

Ran `pnpm squads:verify-vault --network devnet --multisig 6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu`
immediately after rotation drill completed. Member count is back to 6 (5 voting + 1
proposer-only) — the RemoveMember did execute cleanly, and the pre-drill multisig
state is fully restored. Threshold unchanged at 3.

## Significance (Phase 2 Success Criterion 1)

This transcript satisfies the second clause of Phase 2 Success Criterion 1:
_"a signer rotation drill has been executed end-to-end on the devnet multisig"._

Phase 4+ mainnet rotations follow the byte-level procedure captured here.
Mainnet signers use Ledger via Squads web UI instead of filesystem keys for the
approval step, but the script-side lifecycle (proposeConfigTransaction →
3×approve → executeConfigTransaction) is identical.
