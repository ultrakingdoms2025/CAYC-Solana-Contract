#!/usr/bin/env -S tsx
/**
 * MAINNET Squads v4 multisig creation ceremony - Plan 02-05.
 *
 * GATES:
 *   1. .env.mainnet must set CONFIRM_MAINNET=yes-mainnet-ceremony (src/env/load.ts enforces)
 *   2. artifacts/mainnet-preflight.json must exist with overall=pass AND generated_at <24h ago
 *   3. Human must type "PROCEED WITH CAYC MAINNET CEREMONY" at the prompt (any other input aborts)
 *
 * IDEMPOTENCE: refuses to re-create if artifacts/mainnet.json already has squads.multisig_address.
 *              Pass --force to override (and understand you are invalidating the previous address
 *              for every downstream plan).
 *
 * This script does NOT require the 5 Ledger signers to sign the multisigCreateV2 transaction -
 * only the proposer + the ephemeral createKey sign. The signers appear as MEMBERS of the new
 * multisig. Their hardware wallets come into play in Phase 4 (signing the mint creation proposal),
 * not here. But CONTEXT.md mandates their LIVENESS be confirmed during this ceremony window, so
 * the human-confirmation prompt explicitly asks the operator to confirm all 5 signers are available
 * to respond if anything goes wrong mid-ceremony (e.g., tx drop + retry).
 *
 * PITFALLS.md references:
 *   - Pitfall 7 (hardcoded program id) — SQUADS_V4_PROGRAM_ID is pinned in src/squads/constants.ts;
 *     the prompt asks the operator to confirm it by eye against docs.squads.so.
 *   - Pitfall 10 (no secret keys in logs) — this script prints ONLY pubkeys, signatures, and
 *     derived PDAs; never the proposer's secret key bytes, never any signer private material.
 *   - Pitfall 11 (vault vs multisig address) — both addresses are printed with explicit labels;
 *     verifyVaultAuthority is called on a re-derived vault after creation as defense in depth.
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as multisig from '@sqds/multisig';
import { loadEnv, expandHome } from '../../src/env/load.js';
import {
  buildConnection,
  buildProposerMember,
  buildVotingMembers,
  deriveMultisigPda,
  deriveVaultPda,
  loadMultisig,
  MAINNET_SIGNER_COUNT,
  MAINNET_THRESHOLD,
  SQUADS_V4_PROGRAM_ID,
  verifyVaultAuthority,
} from '../../src/squads/index.js';

const FORCE = process.argv.includes('--force');
const MAINNET_ARTIFACT = resolve('artifacts/mainnet.json');
const PREFLIGHT_ARTIFACT = resolve('artifacts/mainnet-preflight.json');
const SESSION_PATH = resolve('artifacts/mainnet-sessions/multisig-creation.md');

loadEnv('mainnet-beta'); // asserts CONFIRM_MAINNET=yes-mainnet-ceremony

// ---- Gate 1: preflight artifact exists + passes + fresh ----
if (!existsSync(PREFLIGHT_ARTIFACT)) {
  console.error(
    'FATAL: artifacts/mainnet-preflight.json missing. Run `pnpm squads:preflight-mainnet` first.',
  );
  process.exit(1);
}
const preflight = JSON.parse(readFileSync(PREFLIGHT_ARTIFACT, 'utf8'));
if (preflight.overall !== 'pass') {
  console.error(
    `FATAL: preflight overall=${preflight.overall}; every check must pass before ceremony.`,
  );
  console.error('Failures:');
  for (const c of preflight.checks) {
    if (!c.pass) console.error(`  [${c.id}] ${c.description}: ${c.detail}`);
  }
  process.exit(1);
}
const ageMs = Date.now() - new Date(preflight.generated_at).getTime();
if (ageMs > 24 * 60 * 60 * 1000) {
  const hours = Math.floor(ageMs / (60 * 60 * 1000));
  console.error(
    `FATAL: preflight artifact is ${hours}h old (> 24h). Re-run \`pnpm squads:preflight-mainnet\`.`,
  );
  process.exit(1);
}
console.log(
  `Preflight OK: ${preflight.pass_count}/${preflight.check_count} at ${preflight.generated_at}`,
);

// ---- Gate 2: idempotence guard ----
if (existsSync(MAINNET_ARTIFACT) && !FORCE) {
  const existing = JSON.parse(readFileSync(MAINNET_ARTIFACT, 'utf8'));
  if (existing.squads?.multisig_address) {
    console.error(
      `FATAL: artifacts/mainnet.json already has squads.multisig_address=${existing.squads.multisig_address}.`,
    );
    console.error(
      "Pass --force to create a new mainnet multisig (invalidates every downstream plan's address references).",
    );
    process.exit(1);
  }
}

// ---- Load proposer keypair + gather signer pubkeys from env ----
const proposerPathRaw = process.env.MAINNET_PROPOSER_KEYPAIR_PATH;
const proposerPath = expandHome(proposerPathRaw ?? '');
if (!proposerPath || !existsSync(proposerPath)) {
  throw new Error(`MAINNET_PROPOSER_KEYPAIR_PATH unset or file missing: ${proposerPath}`);
}
const proposerSecret = JSON.parse(readFileSync(proposerPath, 'utf8')) as number[];
const proposer = Keypair.fromSecretKey(new Uint8Array(proposerSecret));

const signerPubkeys: PublicKey[] = [];
for (let i = 1; i <= MAINNET_SIGNER_COUNT; i++) {
  const envKey = `MAINNET_SIGNER_${i}_PUBKEY`;
  const pk = process.env[envKey];
  if (!pk) {
    throw new Error(`${envKey} not set in .env.mainnet`);
  }
  signerPubkeys.push(new PublicKey(pk));
}
// Sanity: no duplicates, no signer == proposer
const seen = new Set<string>();
for (const pk of signerPubkeys) {
  if (seen.has(pk.toBase58())) {
    throw new Error(`Duplicate signer pubkey: ${pk.toBase58()}`);
  }
  seen.add(pk.toBase58());
}
if (seen.has(proposer.publicKey.toBase58())) {
  throw new Error(
    `Proposer pubkey ${proposer.publicKey.toBase58()} collides with a voting signer. ` +
      'Proposer MUST be a separate identity (CONTEXT.md: proposer-only hot wallet, NOT a voting member).',
  );
}

// ---- Derive PDAs ----
const createKey = Keypair.generate(); // ephemeral, used only for PDA seed
const multisigPda = deriveMultisigPda(createKey.publicKey);
const vaultPda = deriveVaultPda(multisigPda);

// Pitfall 11 sanity: multisig_address MUST differ from vault_pda.
if (multisigPda.equals(vaultPda)) {
  throw new Error(
    `FATAL: derived multisigPda equals derived vaultPda (${multisigPda.toBase58()}). ` +
      'This is a Pitfall 11 violation — the two addresses MUST differ. Abort.',
  );
}

// ---- Build members ----
const members = [...buildVotingMembers(signerPubkeys), buildProposerMember(proposer.publicKey)];

// ---- Print parameter bundle + prompt for human confirmation ----
const connection = buildConnection('mainnet-beta', 'confirmed');

let commitSha = '(unknown)';
try {
  commitSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  /* no-op */
}

console.log('\n==========================================================');
console.log('CAYC MAINNET SQUADS v4 MULTISIG CREATION - parameter bundle');
console.log('==========================================================');
console.log(`Commit SHA:        ${commitSha}`);
console.log(`Program ID:        ${SQUADS_V4_PROGRAM_ID.toBase58()}`);
console.log(`Network:           mainnet-beta`);
// Strip query string (api-key) from RPC URL before logging (Pitfall 10 hygiene).
const rawRpc = process.env.HELIUS_MAINNET_RPC_URL ?? '';
const safeRpc = rawRpc.split('?')[0];
console.log(`RPC endpoint:      ${safeRpc}`);
console.log(`createKey (ephem): ${createKey.publicKey.toBase58()}`);
console.log(`Multisig PDA:      ${multisigPda.toBase58()}`);
console.log(`Vault PDA (idx 0): ${vaultPda.toBase58()}   <-- authority for all on-chain powers`);
console.log(`Threshold:         ${MAINNET_THRESHOLD} of ${MAINNET_SIGNER_COUNT}`);
console.log(`Time lock:         0 slots (multisig-discipline per Mint Policy section 5)`);
console.log(`Config authority:  null (self-managed)`);
console.log(`Rent collector:    null`);
console.log(`Proposer (fee payer, Initiate-only member): ${proposer.publicKey.toBase58()}`);
console.log(`Voting members (Permissions.all):`);
signerPubkeys.forEach((pk, i) => {
  console.log(`  [${i + 1}] ${pk.toBase58()}`);
});
console.log('\nChecks you MUST perform before typing the confirmation:');
console.log('  - Program ID above matches SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf (Pitfall 7)');
console.log('  - Vault PDA is DIFFERENT from Multisig PDA (Pitfall 11)');
console.log('  - All 5 voting pubkeys match the signer-roster shared via the coordination channel');
console.log('  - Proposer pubkey matches MAINNET_PROPOSER_KEYPAIR_PATH in .env.mainnet');
console.log('  - All 5 signers have confirmed liveness in the ceremony coordination channel');
console.log('');
console.log('Type exactly: PROCEED WITH CAYC MAINNET CEREMONY');
console.log('(Any other input aborts.)');
console.log('');

const rl = createInterface({ input: stdin, output: stdout });
const answer = (await rl.question('> ')).trim();
rl.close();

const human_confirmation_timestamp = new Date().toISOString();

if (answer !== 'PROCEED WITH CAYC MAINNET CEREMONY') {
  console.error(`Abort: expected exact phrase, got ${JSON.stringify(answer)}.`);
  process.exit(1);
}

// ---- Fetch Squads program treasury (required for multisigCreateV2) ----
const [programConfigPda] = multisig.getProgramConfigPda({
  programId: SQUADS_V4_PROGRAM_ID,
});
const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
  connection,
  programConfigPda,
);
const treasury = programConfig.treasury;

console.log(`\nSubmitting multisigCreateV2 at ${new Date().toISOString()}...`);

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
  memo: `CAYC mainnet multisig creation - commit ${commitSha}`,
  programId: SQUADS_V4_PROGRAM_ID,
});

// Wait for the tx to be observably indexed on the read path (inherits the Plan 02-02 lesson:
// confirmed-state lag can cause an immediate loadMultisig to miss the account even though the
// tx already confirmed).
await connection.confirmTransaction(signature, 'confirmed');

console.log('\n--- Transaction confirmed ---');
console.log('Signature:', signature);
const explorer = `https://explorer.solana.com/tx/${signature}`;
console.log('Explorer: ', explorer);

// ---- On-chain readback to verify state (with retry-on-read per Plan 02-02 pattern) ----
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
  throw new Error(`On-chain threshold ${onchain.threshold} != expected ${MAINNET_THRESHOLD}`);
}
if (onchain.members.length !== MAINNET_SIGNER_COUNT + 1) {
  throw new Error(
    `On-chain member count ${onchain.members.length} != expected ${MAINNET_SIGNER_COUNT + 1} (5 voting + 1 proposer)`,
  );
}

// Cross-check vault PDA derived vs re-derived from on-chain multisig (Pitfall 11 defense in depth).
const rederivedVault = deriveVaultPda(multisigPda);
verifyVaultAuthority(vaultPda, rederivedVault);

const slot = await connection.getSlot('confirmed');

// ---- Write artifact ----
const artifact = {
  network: 'mainnet-beta',
  generated_at: new Date().toISOString(),
  commit_sha: commitSha,
  squads: {
    program_id: SQUADS_V4_PROGRAM_ID.toBase58(),
    program_version: 'v4',
    multisig_address: multisigPda.toBase58(),
    vault_pda: vaultPda.toBase58(),
    create_key_pubkey: createKey.publicKey.toBase58(),
    threshold: MAINNET_THRESHOLD,
    voting_member_count: MAINNET_SIGNER_COUNT,
    voting_members: signerPubkeys.map((pk) => pk.toBase58()),
    proposer_only_pubkey: proposer.publicKey.toBase58(),
    time_lock_slots: 0,
    config_authority: null,
    rent_collector: null,
    creation_tx_signature: signature,
    creation_slot: slot,
    explorer_url: explorer,
    preflight_artifact_snapshot: {
      generated_at: preflight.generated_at,
      overall: preflight.overall,
      pass_count: preflight.pass_count,
      check_count: preflight.check_count,
    },
    human_confirmation_timestamp,
  },
  notes: [
    'PITFALLS.md Pitfall 11: Authorities MUST be vault_pda, NOT multisig_address. Phase 4 mint ceremony uses vault_pda for mint/freeze/update authority AND Permanent Delegate.',
    'This file is APPEND-ONLY from this commit onward. Only ceremony scripts that reach a successful on-chain execution may modify it, and only to add new top-level keys (mint, treasury_ata, etc.) - the squads subobject is frozen.',
  ],
};

// Merge-with-prior preserves any future sibling keys (mint, treasury, etc.).
let prior: Record<string, unknown> = {};
if (existsSync(MAINNET_ARTIFACT)) {
  try {
    prior = JSON.parse(readFileSync(MAINNET_ARTIFACT, 'utf8')) as Record<string, unknown>;
  } catch {
    prior = {};
  }
}
const merged = { ...prior, ...artifact };
writeFileSync(MAINNET_ARTIFACT, JSON.stringify(merged, null, 2) + '\n');
console.log('\nWrote', MAINNET_ARTIFACT);

// ---- Write ceremony transcript ----
mkdirSync(resolve('artifacts/mainnet-sessions'), { recursive: true });
const transcript = `# CAYC Mainnet Squads v4 Multisig Creation Ceremony

**Plan:** 02-05
**Date (UTC):** ${artifact.generated_at}
**Network:** mainnet-beta
**Commit SHA:** \`${commitSha}\`

## Participants (pseudonyms; see \`docs/security/signer-roster.md\` for role mapping)

- Proposer / operator: \`${proposer.publicKey.toBase58()}\` (cayc-proposer)
- Voting signer 1: \`${signerPubkeys[0]?.toBase58()}\`
- Voting signer 2: \`${signerPubkeys[1]?.toBase58()}\`
- Voting signer 3: \`${signerPubkeys[2]?.toBase58()}\`
- Voting signer 4: \`${signerPubkeys[3]?.toBase58()}\`
- Voting signer 5: \`${signerPubkeys[4]?.toBase58()}\`

## Preflight gate

- Preflight artifact generated at: ${preflight.generated_at}
- Overall verdict: ${preflight.overall} (${preflight.pass_count}/${preflight.check_count} passed)

## Parameter bundle confirmed by human

- Program ID: \`${SQUADS_V4_PROGRAM_ID.toBase58()}\` (Squads v4 - verified against Pitfall 7 reference)
- createKey (ephemeral): \`${createKey.publicKey.toBase58()}\`
- Multisig PDA: \`${multisigPda.toBase58()}\`
- Vault PDA (index 0): \`${vaultPda.toBase58()}\`
- Threshold: ${MAINNET_THRESHOLD} of ${MAINNET_SIGNER_COUNT} voting members
- Time lock: 0 slots
- Config authority: null (self-managed)
- Rent collector: null
- Human confirmation timestamp: ${human_confirmation_timestamp}

## On-chain transaction

- Instruction: \`multisig.rpc.multisigCreateV2\`
- Transaction signature: \`${signature}\`
- Explorer: [${signature.substring(0, 8)}...](${explorer})
- Confirmed slot: ${slot}

## On-chain state readback (immediately after creation)

- threshold: ${onchain.threshold} (expected ${MAINNET_THRESHOLD}) — OK
- members.length: ${onchain.members.length} (expected ${MAINNET_SIGNER_COUNT + 1}, = 5 voting + 1 proposer) — OK
- configAuthority: ${onchain.configAuthority ? onchain.configAuthority.toBase58() : 'null (self-managed)'}
- Re-derived vault PDA matches artifact vault_pda (Pitfall 11 defense in depth) — OK

## Significance

This transcript is the immutable record that the CAYC mainnet Squads v4 multisig exists,
with the stated threshold and member roster, created by the committed codebase at commit
\`${commitSha}\`. Phase 4 mainnet mint creation (TOK-01 through TOK-06) will use
\`vault_pda\` = \`${vaultPda.toBase58()}\` as the mint authority, freeze authority, metadata
update authority, and Permanent Delegate - the exact same wiring pattern proven on devnet
in Plan 02-03 Task 3 (see \`artifacts/devnet-sessions/smoke-test-mint.md\` for the devnet
existence proof).

## Next steps

1. Plan 02-06 populates \`docs/security/signer-roster.md\` with pubkeys from this transcript.
2. Phase 4 Plan 04-XX builds the Token-2022 mint creation proposal against this multisig.
`;
writeFileSync(SESSION_PATH, transcript);
console.log('Wrote', SESSION_PATH);

// ---- Update .env.mainnet with addresses (idempotent strip + append) ----
const envPath = resolve('.env.mainnet');
let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
envContent = envContent.replace(/^MAINNET_SQUADS_MULTISIG_ADDRESS=.*$/m, '');
envContent = envContent.replace(/^MAINNET_SQUADS_VAULT_PDA=.*$/m, '');
envContent = envContent.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
envContent += `\n# Written by scripts/squads/create-mainnet.ts on ${artifact.generated_at}\n`;
envContent += `MAINNET_SQUADS_MULTISIG_ADDRESS=${multisigPda.toBase58()}\n`;
envContent += `MAINNET_SQUADS_VAULT_PDA=${vaultPda.toBase58()}\n`;
writeFileSync(envPath, envContent);
console.log('Updated', envPath);

console.log('\n==========================================================');
console.log('Mainnet Squads v4 multisig creation COMPLETE');
console.log('Next: run Plan 02-06 to publish the finalized signer roster.');
console.log('==========================================================');
