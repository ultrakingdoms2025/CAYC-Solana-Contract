#!/usr/bin/env -S tsx
/**
 * Read-only diagnostic: for a given multisig address, derive the vault PDA
 * and print the multisig config state (threshold, members, configAuthority).
 *
 * Usage:
 *   tsx scripts/squads/verify-vault.ts --network devnet --multisig <MULTISIG_PDA>
 *   tsx scripts/squads/verify-vault.ts --network mainnet-beta --multisig <MULTISIG_PDA>
 *
 * PITFALLS.md Pitfall 11: the printed Vault PDA is the ONLY correct value to
 * use as an authority — NEVER use the Multisig address.
 */
import { PublicKey } from '@solana/web3.js';
import { Command } from 'commander';
import { loadEnv, type Network } from '../../src/env/load.js';
import {
  buildConnection,
  deriveVaultPda,
  loadMultisig,
  SQUADS_V4_PROGRAM_ID,
} from '../../src/squads/index.js';

const program = new Command();
program
  .requiredOption('--network <net>', 'devnet | mainnet-beta')
  .requiredOption('--multisig <pubkey>', 'Multisig config account address')
  .parse(process.argv);

const opts = program.opts<{ network: Network; multisig: string }>();
if (opts.network !== 'devnet' && opts.network !== 'mainnet-beta') {
  throw new Error(`--network must be "devnet" or "mainnet-beta", got: ${opts.network}`);
}

loadEnv(opts.network);

const connection = buildConnection(opts.network);
const multisigPda = new PublicKey(opts.multisig);
const vaultPda = deriveVaultPda(multisigPda);

console.log('--- Squads v4 Multisig Inspection ---');
console.log('Network:          ', opts.network);
console.log('Program ID:       ', SQUADS_V4_PROGRAM_ID.toBase58());
console.log('Multisig config:  ', multisigPda.toBase58());
console.log('Vault PDA (idx=0):', vaultPda.toBase58(), '  <-- USE THIS AS AUTHORITY');

try {
  const acct = await loadMultisig(connection, multisigPda);
  console.log('\n--- On-chain state ---');
  console.log('Threshold:       ', acct.threshold, `of ${acct.members.length}`);
  // configAuthority is a PublicKey (all-zero == self-managed / null semantics).
  const caBase58 = acct.configAuthority.toBase58();
  const isSelfManaged = acct.configAuthority.equals(PublicKey.default);
  console.log(
    'Config authority:',
    isSelfManaged ? `${caBase58} (all-zero → self-managed)` : caBase58,
  );
  console.log('Time lock:       ', acct.timeLock, 'slots');
  console.log('Transaction idx: ', acct.transactionIndex.toString());
  console.log('\n--- Members ---');
  acct.members.forEach((m, i) => {
    console.log(`  [${i}] ${m.key.toBase58()}  permissions.mask=${m.permissions.mask}`);
  });
} catch (err) {
  console.error('\nERROR loading multisig account:', (err as Error).message);
  console.error(
    'If this is a pre-derivation dry run (no on-chain multisig yet), ignore this error.',
  );
  process.exit(1);
}
