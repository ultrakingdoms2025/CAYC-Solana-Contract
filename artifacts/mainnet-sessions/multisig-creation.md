# CAYC Mainnet Squads v4 Multisig Creation Ceremony

**Plan:** 02-05
**Date (UTC):** 2026-04-20T15:20:16.898Z
**Network:** mainnet-beta
**Commit SHA:** `083aa85c5a9bd5f6b510fd38983a6d5696ef41c0`

## Participants (pseudonyms; see `docs/security/signer-roster.md` for role mapping)

- Proposer / operator: `2gUjoCGqqoxQ9ivrTqGhHmtLqvFp3gvDRYCrMAwtkxA1` (cayc-proposer)
- Voting signer 1: `DwK4842jNasCGigQ1BruQxRFKpXevnBmPwuKLJVXBMuu`
- Voting signer 2: `G28iLXukQFExfZ21Gaq5M7CdqBFPmvkwwfRotxvU7ESq`
- Voting signer 3: `5BnDpWnRh8aZ3oFVBn54Z8mF2agnCcNJyTKS179fYU3b`
- Voting signer 4: `HBEqzqWmzvhQq3jAKBAdsE2DzoiGoKEy5A22d7jTMNPt`
- Voting signer 5: `KzCZnpmePppaQf9D9jcWnKPoiDTdznK7g4qKt73zD3n`

## Preflight gate

- Preflight artifact generated at: 2026-04-20T14:58:25.847Z
- Overall verdict: pass (12/12 passed)

## Parameter bundle confirmed by human

- Program ID: `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` (Squads v4 - verified against Pitfall 7 reference)
- createKey (ephemeral): `HieVU7yhWgRGUPu5T5LyZj9tGWLUzC5WoxMbBCLxojex`
- Multisig PDA: `46rXDgUogTwwUVwohfcayqWNQzHj157GQvKTogfVinWR`
- Vault PDA (index 0): `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR`
- Threshold: 3 of 5 voting members
- Time lock: 0 slots
- Config authority: null (self-managed)
- Rent collector: null
- Human confirmation timestamp: 2026-04-20T15:20:14.732Z

## On-chain transaction

- Instruction: `multisig.rpc.multisigCreateV2`
- Transaction signature: `Dtx1x2kcwicMfo4LVqSjkzBWpjTa4cv7ALj82FMQZTwMFSBuQxmuw9CTDiYpHCkFFCqKUp7eaEYVQFKJzMX5XJs`
- Explorer: [Dtx1x2kc...](https://explorer.solana.com/tx/Dtx1x2kcwicMfo4LVqSjkzBWpjTa4cv7ALj82FMQZTwMFSBuQxmuw9CTDiYpHCkFFCqKUp7eaEYVQFKJzMX5XJs)
- Confirmed slot: 414500481

## On-chain state readback (immediately after creation)

- threshold: 3 (expected 3) — OK
- members.length: 6 (expected 6, = 5 voting + 1 proposer) — OK
- configAuthority: 11111111111111111111111111111111
- Re-derived vault PDA matches artifact vault_pda (Pitfall 11 defense in depth) — OK

## Significance

This transcript is the immutable record that the CAYC mainnet Squads v4 multisig exists,
with the stated threshold and member roster, created by the committed codebase at commit
`083aa85c5a9bd5f6b510fd38983a6d5696ef41c0`. Phase 4 mainnet mint creation (TOK-01 through TOK-06) will use
`vault_pda` = `CFYA2y6nwmyqUxDFX7WvFKgYFtMWHLxdK8rZkGtD2BJR` as the mint authority, freeze authority, metadata
update authority, and Permanent Delegate - the exact same wiring pattern proven on devnet
in Plan 02-03 Task 3 (see `artifacts/devnet-sessions/smoke-test-mint.md` for the devnet
existence proof).

## Next steps

1. Plan 02-06 populates `docs/security/signer-roster.md` with pubkeys from this transcript.
2. Phase 4 Plan 04-XX builds the Token-2022 mint creation proposal against this multisig.
