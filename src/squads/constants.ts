import { PublicKey } from '@solana/web3.js';

/**
 * Squads v4 program id — same on mainnet-beta AND devnet.
 * Hardcoded per PITFALLS.md Pitfall 7 (spoofed-program risk): do not read from env.
 * Verified against: node_modules/@sqds/multisig/lib/generated/index.ts PROGRAM_ADDRESS
 *                   and https://docs.squads.so/main
 */
export const SQUADS_V4_PROGRAM_ID = new PublicKey('SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf');

/** Vault index for the primary vault. Never change without a migration plan. */
export const PRIMARY_VAULT_INDEX = 0;

/** Mainnet threshold per CONTEXT.md decision (3-of-5). */
export const MAINNET_THRESHOLD = 3;
export const MAINNET_SIGNER_COUNT = 5;
