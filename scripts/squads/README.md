# scripts/squads/

Squads v4 ceremony + diagnostic scripts. All scripts import from `src/squads` and
`src/env` — never from `@sqds/multisig` directly for PDA derivation (Pitfall 11).

## Scripts in this directory (populated across Phase 2 plans)

| Script                       | Plan  | Purpose                                                         |
| ---------------------------- | ----- | --------------------------------------------------------------- |
| `generate-devnet-signers.ts` | 02-01 | Create 5 throwaway devnet signer keypairs                       |
| `verify-vault.ts`            | 02-01 | Read-only diagnostic for any multisig address                   |
| `create-devnet.ts`           | 02-02 | Create the devnet Squads v4 multisig via SDK                    |
| `rotate-devnet-signer.ts`    | 02-03 | Rotation drill (add + remove a signer)                          |
| `smoke-test-mint.ts`         | 02-03 | Multisig-signed test mint — proves vault PDA = authority        |
| `preflight-mainnet.ts`       | 02-04 | Read-only preflight checks before mainnet ceremony              |
| `create-mainnet.ts`          | 02-05 | Mainnet ceremony script (CHECKPOINT: requires 5 humans present) |
| `publish-artifacts.ts`       | 02-06 | Finalize artifacts/mainnet.json + signer-roster.md              |

## Conventions

- Every script accepts `--network devnet|mainnet-beta` (no default).
- Mainnet scripts additionally require `CONFIRM_MAINNET=yes-mainnet-ceremony` in `.env.mainnet`.
- Scripts write append-only JSON to `artifacts/{network}.json` (devnet) or require signed confirmation (mainnet).
- No script ever logs a full secret key. Only pubkeys.
