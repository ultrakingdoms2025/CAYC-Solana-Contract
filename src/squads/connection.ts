import { Connection, Commitment, PublicKey } from '@solana/web3.js';

export type SolanaNetwork = 'devnet' | 'mainnet-beta';

/**
 * Build a Connection keyed by network.
 * Devnet: HELIUS_DEVNET_RPC_URL (falls back to public devnet).
 * Mainnet: HELIUS_MAINNET_RPC_URL (required; aborts if unset).
 */
export function buildConnection(
  network: SolanaNetwork,
  commitment: Commitment = 'confirmed',
): Connection {
  if (network === 'mainnet-beta') {
    const url = process.env.HELIUS_MAINNET_RPC_URL;
    if (!url || url.includes('REPLACE_WITH_')) {
      throw new Error(
        'HELIUS_MAINNET_RPC_URL is not set — refusing to build a mainnet connection. ' +
          'Copy .env.mainnet.example to .env.mainnet and fill the Helius URL.',
      );
    }
    return new Connection(url, commitment);
  }
  const devnetEnv = process.env.HELIUS_DEVNET_RPC_URL;
  const url =
    devnetEnv && !devnetEnv.includes('REPLACE_WITH_')
      ? devnetEnv
      : (process.env.SOLANA_DEVNET_FALLBACK_RPC ?? 'https://api.devnet.solana.com');
  return new Connection(url, commitment);
}

/**
 * Load a Multisig account by address.
 * Returns the raw account struct — callers read threshold, members, configAuthority.
 */
export async function loadMultisig(connection: Connection, multisigPda: PublicKey) {
  // Dynamic import to avoid pulling the full @sqds/multisig into the module graph
  // when only PDA helpers are needed.
  const multisig = await import('@sqds/multisig');
  return multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
}
