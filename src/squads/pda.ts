import { PublicKey } from '@solana/web3.js';
import { getMultisigPda, getVaultPda } from '@sqds/multisig';
import { PRIMARY_VAULT_INDEX, SQUADS_V4_PROGRAM_ID } from './constants.js';

/** Derive the Multisig config account PDA from a createKey pubkey. */
export function deriveMultisigPda(createKey: PublicKey): PublicKey {
  const [pda] = getMultisigPda({ createKey, programId: SQUADS_V4_PROGRAM_ID });
  return pda;
}

/**
 * Derive the Vault PDA for vault index 0.
 *
 * PITFALLS.md Pitfall 11: the Vault PDA is NOT the Multisig config account.
 * All authorities (mint/freeze/update/permanent-delegate) must point here,
 * NOT at the multisig config account. This wrapper is the single code path
 * for deriving the vault address — no caller should call getVaultPda directly.
 */
export function deriveVaultPda(multisigPda: PublicKey): PublicKey {
  const [pda] = getVaultPda({
    multisigPda,
    index: PRIMARY_VAULT_INDEX,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  return pda;
}
