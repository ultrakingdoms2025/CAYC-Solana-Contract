#!/usr/bin/env -S tsx
/**
 * Create the devnet Squads v4 multisig.
 *
 * Squads v4 web UI disables devnet multisig creation (STACK.md §"Squads v4 Web UI vs SDK"),
 * so the only path is via the @sqds/multisig SDK.
 *
 * IDEMPOTENT: refuses to create a new multisig if artifacts/devnet.json already exists
 * with a populated `squads.multisig_address`. Pass --force to override (destroys address continuity).
 *
 * CONTEXT.md §decisions — parameters:
 *   - threshold: 3
 *   - voting members: 5 (Permissions.all())
 *   - proposer: 1 (Permissions.Initiate only, NOT a voting member)
 *   - timeLock: 0
 *   - configAuthority: null (self-managed)
 *
 * PITFALLS.md Pitfall 10: never log full secret keys. Only pubkeys.
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as multisig from '@sqds/multisig';
import { loadEnv } from '../../src/env/load.js';
import {
  buildConnection,
  buildProposerMember,
  buildVotingMembers,
  deriveMultisigPda,
  deriveVaultPda,
  loadMultisig,
  MAINNET_THRESHOLD,
  MAINNET_SIGNER_COUNT,
  SQUADS_V4_PROGRAM_ID,
} from '../../src/squads/index.js';

const FORCE = process.argv.includes('--force');
const ARTIFACT_PATH = resolve('artifacts/devnet.json');

loadEnv('devnet');

// Idempotence guard — refuse to overwrite existing multisig_address without --force.
if (existsSync(ARTIFACT_PATH) && !FORCE) {
  const existing = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf8'));
  if (existing.squads?.multisig_address) {
    console.error(
      `artifacts/devnet.json already has squads.multisig_address=${existing.squads.multisig_address}.`,
      '\nPass --force to create a new multisig (invalidates the recorded address).',
    );
    process.exit(1);
  }
}

function loadKeypair(path: string): Keypair {
  const arr = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(new Uint8Array(arr));
}

// Load voting signers + proposer from gitignored keys/devnet/
const signerKeys = [1, 2, 3, 4, 5].map((i) => loadKeypair(resolve(`keys/devnet/signer-${i}.json`)));
const proposer = loadKeypair(resolve('keys/devnet/proposer.json'));

// Build member list: 5 voting + 1 proposer-only = 6 total Squads members
const members = [
  ...buildVotingMembers(signerKeys.map((kp) => kp.publicKey)),
  buildProposerMember(proposer.publicKey),
];

// Ephemeral createKey seeds the multisigPda derivation; it is NOT a signer of future txs.
const createKey = Keypair.generate();
const multisigPda = deriveMultisigPda(createKey.publicKey);
const vaultPda = deriveVaultPda(multisigPda);

// Fetch Squads program config to get treasury (required for multisigCreateV2).
const connection = buildConnection('devnet', 'confirmed');
const [programConfigPda] = multisig.getProgramConfigPda({
  programId: SQUADS_V4_PROGRAM_ID,
});
const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
  connection,
  programConfigPda,
);
const treasury = programConfig.treasury;

console.log('--- Creating devnet Squads v4 multisig ---');
console.log('Program ID:    ', SQUADS_V4_PROGRAM_ID.toBase58());
console.log('Treasury:      ', treasury.toBase58());
console.log('createKey:     ', createKey.publicKey.toBase58(), '(ephemeral)');
console.log('Multisig PDA:  ', multisigPda.toBase58());
console.log('Vault PDA (0): ', vaultPda.toBase58(), '  <-- authority for all on-chain powers');
console.log('Threshold:     ', MAINNET_THRESHOLD, 'of', MAINNET_SIGNER_COUNT);
console.log('Members (voting):');
signerKeys.forEach((kp, i) => console.log(`  [${i + 1}] ${kp.publicKey.toBase58()}`));
console.log('Proposer (Initiate-only):', proposer.publicKey.toBase58());

const signature = await multisig.rpc.multisigCreateV2({
  connection,
  treasury,
  createKey,
  creator: proposer,
  multisigPda,
  configAuthority: null,
  threshold: MAINNET_THRESHOLD,
  members,
  timeLock: 0,
  rentCollector: null,
  memo: 'CAYC devnet multisig — Phase 2 Plan 02-02',
  programId: SQUADS_V4_PROGRAM_ID,
});

console.log('\n--- Transaction confirmed ---');
console.log('Signature:', signature);
console.log('Explorer:  https://explorer.solana.com/tx/' + signature + '?cluster=devnet');

// Re-read on-chain state to confirm creation.
// The RPC node that confirmed the tx may not yet have the account indexed on its read path
// (confirmation commitment lags finalized state). Retry with backoff for up to ~30s.
async function loadMultisigWithRetry(maxAttempts = 10, baseDelayMs = 1000) {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await loadMultisig(connection, multisigPda);
    } catch (err) {
      lastErr = err;
      const delay = Math.min(baseDelayMs * attempt, 5000);
      console.log(
        `  loadMultisig attempt ${attempt}/${maxAttempts} failed (${(err as Error).message}); retrying in ${delay}ms...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(
    `loadMultisig failed after ${maxAttempts} attempts. Last error: ${(lastErr as Error).message}`,
  );
}
const onchain = await loadMultisigWithRetry();
if (onchain.threshold !== MAINNET_THRESHOLD) {
  throw new Error(
    `On-chain threshold mismatch: expected ${MAINNET_THRESHOLD}, got ${onchain.threshold}`,
  );
}
if (onchain.members.length !== MAINNET_SIGNER_COUNT + 1) {
  throw new Error(
    `On-chain member count mismatch: expected ${MAINNET_SIGNER_COUNT + 1} (5 voting + 1 proposer), got ${onchain.members.length}`,
  );
}

// Capture creation slot
const slot = await connection.getSlot('confirmed');

// Write artifact
const artifact = {
  network: 'devnet',
  generated_at: new Date().toISOString(),
  squads: {
    program_id: SQUADS_V4_PROGRAM_ID.toBase58(),
    program_version: 'v4',
    multisig_address: multisigPda.toBase58(),
    vault_pda: vaultPda.toBase58(),
    create_key_pubkey: createKey.publicKey.toBase58(),
    threshold: MAINNET_THRESHOLD,
    voting_member_count: MAINNET_SIGNER_COUNT,
    proposer_only_pubkey: proposer.publicKey.toBase58(),
    voting_members: signerKeys.map((kp) => kp.publicKey.toBase58()),
    time_lock_slots: 0,
    config_authority: null,
    creation_tx_signature: signature,
    creation_slot: slot,
    explorer_url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  },
  notes: [
    'PITFALLS.md Pitfall 11: Authorities MUST be vault_pda, NOT multisig_address.',
    'Devnet keys are throwaway — mainnet uses Ledgers, a different ceremony (Plan 02-05).',
  ],
};

// Merge with any pre-existing artifact (e.g., future phases appending mint, treasury, etc.)
let prior: Record<string, unknown> = {};
if (existsSync(ARTIFACT_PATH)) {
  try {
    prior = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf8')) as Record<string, unknown>;
  } catch {
    prior = {};
  }
}
const merged = { ...prior, ...artifact };
writeFileSync(ARTIFACT_PATH, JSON.stringify(merged, null, 2) + '\n');
console.log('\nWrote', ARTIFACT_PATH);

// Update .env.devnet with the new addresses (idempotent — strips any prior values first).
const envPath = resolve('.env.devnet');
let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
envContent = envContent.replace(/^DEVNET_SQUADS_MULTISIG_ADDRESS=.*$/m, '');
envContent = envContent.replace(/^DEVNET_SQUADS_VAULT_PDA=.*$/m, '');
envContent = envContent.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
envContent += `\n# Written by scripts/squads/create-devnet.ts on ${new Date().toISOString()}\n`;
envContent += `DEVNET_SQUADS_MULTISIG_ADDRESS=${multisigPda.toBase58()}\n`;
envContent += `DEVNET_SQUADS_VAULT_PDA=${vaultPda.toBase58()}\n`;
writeFileSync(envPath, envContent);
console.log('Updated', envPath);

console.log('\n--- Done. Next: Plan 02-03 (rotation drill + smoke-test mint). ---');
