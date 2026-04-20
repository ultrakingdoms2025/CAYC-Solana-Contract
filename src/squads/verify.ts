import { PublicKey } from '@solana/web3.js';

export class VaultMismatchError extends Error {
  constructor(expected: PublicKey, actual: PublicKey) {
    super(
      `Vault PDA mismatch — expected ${expected.toBase58()} ` +
        `but got ${actual.toBase58()}. ` +
        `PITFALLS.md Pitfall 11: authorities MUST be the vault PDA, ` +
        `not the multisig config account.`,
    );
    this.name = 'VaultMismatchError';
  }
}

/** Throw if `candidate` is not exactly equal to `expected`. */
export function verifyVaultAuthority(expected: PublicKey, candidate: PublicKey): { ok: true } {
  if (!expected.equals(candidate)) {
    throw new VaultMismatchError(expected, candidate);
  }
  return { ok: true };
}
