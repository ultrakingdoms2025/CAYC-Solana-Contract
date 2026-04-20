# Devnet Squads Smoke-Test Mint Transcript

**Plan:** 02-03 Task 3
**Date (UTC):** 2026-04-20T05:02:36.047Z
**Network:** devnet
**Multisig:** 6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu
**Vault PDA:** 5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu
**Throwaway mint:** J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ
**Recipient:** AkAHF7vdH66Ly6mgfkpRnTUPLdEM4xyLfBZP6b3jDhmL
**Recipient ATA:** vcd179b5ZQFjzszMP9qV95cD3aoZDRvrh2vAwzx1s5Q
**Amount minted:** 1000000 (raw units, 6 decimals = 1.000000 token)

## Mint creation (direct, NOT through multisig)

- Mint authority: `5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu` (vault PDA)
- Freeze authority: `5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu` (vault PDA)
- Token-2022 program: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`
- Decimals: 6

## Vault SOL funding (for ATA rent)

- tx: `3d1aYfk9aLd4NoynwZFMhUFjPyHCXMoaWSkj2KYBBfHJpSZfvSnpmepZZf3dpgmTKzUZH6zoaCUuSsLKXukbrfJr`

## Squads vault transaction (positive path)

- transactionIndex: 4
- vaultTransactionCreate tx: `5UL2voVHFe6ZpY78D2sbfs5suWR1JpiM3uzP1c7Vg75kLco5WPHmTJ3vzXBMtnoVA15zgkqkozFmqTjUgX6NRB2p`
- proposalCreate tx: `2vpfrsqJMWmhgfyJwyYzdmkdVZp62rgjh5ztyj8TvbDW4Z8ZVd2LDAwPLT5AcxrJHwHxvM5CYJP2EirfVMHgaTNA`
- approvals (3/5 voting threshold):
  - signer-1 approve tx: `5RevnNa2Vkn2BFtWgvxz9i3r5GEkzFoVSjtxVDQ8m82cmzR8C3VpGhZAZA3ymboL5y1Lg2dJ8CV5tQe9mMRK6yYv`
  - signer-2 approve tx: `5to72rV63mMzSJMiYWExHBvmK4V8v7fBGvLAhMfja8PcUm9xbFYr9yJnjkQSZFxkMao5tY6wq85nWvhnRcE9yLn7`
  - signer-3 approve tx: `2Xme39jGRabpzjTiymw7Vm4tiD5HiThDaq2rwaNRDpGLv4UXF3Nbj6jiFFaDQZiedgVVAUQe2VEP1BG8gJfCVoTa`
- vaultTransactionExecute tx: `3GCGNTTir7KMu8X5uS4JUdjkYTUTVNg19Bk6X8XLqhL3igzsbNNs5gW4siibZRKzbtLicGX7AyeLN2kLzXGemfEk`
- explorer: https://explorer.solana.com/tx/3GCGNTTir7KMu8X5uS4JUdjkYTUTVNg19Bk6X8XLqhL3igzsbNNs5gW4siibZRKzbtLicGX7AyeLN2kLzXGemfEk?cluster=devnet

## Post-execution verification (positive path)

- getMint(J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ).mintAuthority == vault_pda: PASS
- getMint(J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ).freezeAuthority == vault_pda: PASS
- getAccount(recipient_ATA).amount == 1000000: PASS — PROOF OK

## Pitfall 11 negative test (expected to fail)

**Setup.** Built a `createMintToInstruction` with `multisig_address`
(6Pu2arj3tnaVG7wRE1WB8qFdTssqwertg4svKnoBMEVu) as the authority — intentionally wrong. Signed the
outer tx with proposer. Submitted to `connection.simulateTransaction` WITHOUT
sending.

**Result.** Simulation failed as expected. Captured failure signature:

```
err={"InstructionError":[0,{"Custom":4}]}
logs:
Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [1]
Program log: Instruction: MintTo
Program log: Error: owner does not match
Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 1288 of 200000 compute units
Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb failed: custom program error: 0x4
```

**Significance.** This is the byte-level failure shape the project MUST avoid.
If Phase 4 mainnet mint creation ever passes `multisig_address` as an
authority by accident, Solana will reject the transaction with a signature
resembling the above — likely "IncorrectProgramId" / "InvalidAccountData" /
"custom program error" depending on which instruction is first to dereference
the wrong account. This negative test is our proof that Pitfall 11 mitigation
(the `deriveVaultPda` wrapper + `verifyVaultAuthority` helper in
`src/squads/`) is doing real work — if someone bypassed those helpers, they
would trip this exact failure.

## Significance (Phase 2 Success Criterion 4)

This transcript is the byte-level existence proof on DEVNET that the Squads
vault PDA — derived via `getVaultPda({ multisigPda, index: 0 })` — is
correctly wired as authority on a Token-2022 mint AND that a multisig-signed
mintTo transaction succeeds. Phase 4 mainnet mint creation will use the
IDENTICAL code paths (`src/squads/proposals.ts` + `@solana/spl-token` with
`TOKEN_2022_PROGRAM_ID`). PITFALLS.md Pitfall 11 is doubly mitigated:
(a) mechanized in `src/squads/pda.ts` (single code path, named function),
and (b) the negative test above confirms the failure signature we would see
if the mitigation were ever bypassed.

**GOV-04 scope note.** This plan closes the DEVNET ARM of GOV-04. The MAINNET
ARM — an on-chain check that the PRODUCTION mint's mint/freeze/update
authorities equal the mainnet Squads vault PDA — is Phase 4 DEP-04's
responsibility, because the mainnet mint does not exist until Phase 4
TOK-01..TOK-06 create it.

## Cleanup

The throwaway mint at `J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ` is abandoned. It exists only on
devnet and has no metadata, no extensions, and no further supply. It is NOT
the real CAYC mint — that is created in Phase 4.
