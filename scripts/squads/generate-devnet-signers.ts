#!/usr/bin/env -S tsx
/**
 * Generate 5 throwaway devnet signer keypairs + 1 proposer hot wallet keypair.
 *
 * CONTEXT.md §decisions: "Devnet signer keys: Plain filesystem keypairs
 * stored in `.gitignore`d paths per signer. Never reused on production.
 * Never committed."
 *
 * Output: keys/devnet/signer-{1..5}.json (Solana keypair JSON format, 64-byte array)
 *         keys/devnet/proposer.json
 * Also prints each pubkey to stdout for copy-paste into env / plan artifacts.
 *
 * IDEMPOTENT: refuses to overwrite existing keypair files — pass --force to regenerate.
 * Devnet-only: production ceremony uses Ledger hardware wallets, never filesystem keys.
 */
import { Keypair } from '@solana/web3.js';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const KEYS_DIR = resolve('keys/devnet');
const FORCE = process.argv.includes('--force');

mkdirSync(KEYS_DIR, { recursive: true });

function writePath(name: string): string {
  const path = resolve(KEYS_DIR, `${name}.json`);
  if (existsSync(path) && !FORCE) {
    throw new Error(
      `${path} already exists. Pass --force to regenerate ` +
        `(this will invalidate any devnet multisig created with the previous key).`,
    );
  }
  return path;
}

function saveKeypair(path: string, kp: Keypair): void {
  writeFileSync(path, JSON.stringify(Array.from(kp.secretKey)));
}

console.log('Generating devnet signer keypairs under', KEYS_DIR);
console.log('(These are throwaway devnet-only keys. NEVER reuse on production.)\n');

// Inline 5 signer Keypair.generate() calls + 1 proposer so the intent is explicit
// in source (not hidden behind a loop). Each call produces a fresh Ed25519 keypair.
const signer1 = Keypair.generate();
saveKeypair(writePath('signer-1'), signer1);
console.log(`DEVNET_SIGNER_1_PUBKEY=${signer1.publicKey.toBase58()}`);

const signer2 = Keypair.generate();
saveKeypair(writePath('signer-2'), signer2);
console.log(`DEVNET_SIGNER_2_PUBKEY=${signer2.publicKey.toBase58()}`);

const signer3 = Keypair.generate();
saveKeypair(writePath('signer-3'), signer3);
console.log(`DEVNET_SIGNER_3_PUBKEY=${signer3.publicKey.toBase58()}`);

const signer4 = Keypair.generate();
saveKeypair(writePath('signer-4'), signer4);
console.log(`DEVNET_SIGNER_4_PUBKEY=${signer4.publicKey.toBase58()}`);

const signer5 = Keypair.generate();
saveKeypair(writePath('signer-5'), signer5);
console.log(`DEVNET_SIGNER_5_PUBKEY=${signer5.publicKey.toBase58()}`);

const proposer = Keypair.generate();
saveKeypair(writePath('proposer'), proposer);
console.log(`DEVNET_PROPOSER_PUBKEY=${proposer.publicKey.toBase58()}`);

console.log(
  '\nNext steps:',
  '\n  1. Fund each signer + proposer with devnet SOL:',
  '\n       solana airdrop 2 <pubkey> --url https://api.devnet.solana.com',
  '\n  2. Copy DEVNET_PROPOSER_PUBKEY into .env.devnet as DEVNET_PROPOSER_KEYPAIR_PATH=keys/devnet/proposer.json',
  '\n  3. Run scripts/squads/create-devnet.ts (Plan 02-02) to create the multisig.',
);
