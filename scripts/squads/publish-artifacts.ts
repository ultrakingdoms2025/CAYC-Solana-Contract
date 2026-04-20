#!/usr/bin/env -S tsx
/**
 * Publish + validate Phase 2 mainnet artifacts - Plan 02-06 Task 1.
 *
 * Idempotent. Safe to run multiple times. Validates artifacts/mainnet.json
 * against every schema invariant we care about; writes the ceremony_transcript
 * cross-link if absent; exits non-zero on any validation failure.
 *
 * SCOPE: this script validates INTERNAL CONSISTENCY of the committed artifact.
 *   - Pubkey format, threshold, member counts, program id, Pitfall 11 sanity
 *     (vault_pda != multisig_address)
 *   - Re-derives vault PDA from multisig_address via deriveVaultPda(...) and
 *     confirms it matches the stored vault_pda — this is PURE MATH. It proves
 *     the two values in the artifact are consistent with each other and with
 *     the Squads v4 PDA derivation algorithm. It does NOT check the on-chain
 *     state of any production mint's authorities — that check is Phase 4
 *     DEP-04's responsibility (the GOV-04 mainnet arm).
 *
 * This script does NOT touch on-chain state. It does not require .env.mainnet.
 * It's a schema validator + link writer, runnable in CI.
 */
import { PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import {
  deriveVaultPda,
  MAINNET_SIGNER_COUNT,
  MAINNET_THRESHOLD,
  SQUADS_V4_PROGRAM_ID,
  verifyVaultAuthority,
} from '../../src/squads/index.js';

const MAINNET_ARTIFACT = resolve('artifacts/mainnet.json');
const TRANSCRIPT_PATH = resolve('artifacts/mainnet-sessions/multisig-creation.md');

function fail(msg: string): never {
  console.error(`FATAL: ${msg}`);
  process.exit(1);
}

// ---- Load + parse ----
if (!existsSync(MAINNET_ARTIFACT)) {
  fail(`${MAINNET_ARTIFACT} does not exist. Run Plan 02-05 (pnpm squads:create-mainnet) first.`);
}
const artifact = JSON.parse(readFileSync(MAINNET_ARTIFACT, 'utf8'));

// ---- Validate schema ----
const sq = artifact.squads;
if (!sq) fail('artifacts/mainnet.json missing top-level `squads` object');

const required = [
  'program_id',
  'multisig_address',
  'vault_pda',
  'threshold',
  'voting_member_count',
  'voting_members',
  'proposer_only_pubkey',
  'creation_tx_signature',
] as const;
for (const key of required) {
  if (!(key in sq)) fail(`artifacts/mainnet.json squads.${key} missing`);
}

// Pubkey format validation (each MUST be 32-byte base58)
function validatePubkey(s: unknown, field: string): PublicKey {
  if (typeof s !== 'string') fail(`${field} not a string`);
  try {
    return new PublicKey(s);
  } catch {
    fail(`${field} not a valid base58 pubkey: ${s}`);
  }
}

const multisigPda = validatePubkey(sq.multisig_address, 'multisig_address');
const vaultPda = validatePubkey(sq.vault_pda, 'vault_pda');
const programId = validatePubkey(sq.program_id, 'program_id');
const proposerPk = validatePubkey(sq.proposer_only_pubkey, 'proposer_only_pubkey');

// Program id must equal Squads v4 canonical program id
if (!programId.equals(SQUADS_V4_PROGRAM_ID)) {
  fail(
    `squads.program_id=${programId.toBase58()} != SQUADS_V4_PROGRAM_ID=${SQUADS_V4_PROGRAM_ID.toBase58()}`,
  );
}

// Threshold + counts
if (sq.threshold !== MAINNET_THRESHOLD) {
  fail(`squads.threshold=${sq.threshold} != expected ${MAINNET_THRESHOLD}`);
}
if (sq.voting_member_count !== MAINNET_SIGNER_COUNT) {
  fail(`squads.voting_member_count=${sq.voting_member_count} != expected ${MAINNET_SIGNER_COUNT}`);
}
if (!Array.isArray(sq.voting_members) || sq.voting_members.length !== MAINNET_SIGNER_COUNT) {
  fail(`squads.voting_members is not an array of exactly ${MAINNET_SIGNER_COUNT} pubkeys`);
}
for (let i = 0; i < sq.voting_members.length; i++) {
  validatePubkey(sq.voting_members[i], `voting_members[${i}]`);
}
// No duplicates
const seen = new Set<string>();
for (const pk of sq.voting_members) {
  if (seen.has(pk)) fail(`Duplicate voting member pubkey: ${pk}`);
  seen.add(pk);
}
// Proposer not in voting set
if (seen.has(proposerPk.toBase58())) {
  fail(
    `proposer_only_pubkey ${proposerPk.toBase58()} is also in voting_members - proposer MUST be a separate identity`,
  );
}

// Pitfall 11: vault_pda != multisig_address
if (multisigPda.equals(vaultPda)) {
  fail('multisig_address === vault_pda (PITFALLS.md Pitfall 11) - cannot proceed');
}

// Artifact-internal consistency: re-derive vault from multisig and confirm it matches
// the stored vault_pda. This is pure math — it does NOT verify on-chain mint authorities.
const rederivedVault = deriveVaultPda(multisigPda);
verifyVaultAuthority(vaultPda, rederivedVault);

// Creation tx signature format (base58, 80-90 chars)
if (
  typeof sq.creation_tx_signature !== 'string' ||
  !/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(sq.creation_tx_signature)
) {
  fail(`creation_tx_signature is not a valid base58 signature: ${sq.creation_tx_signature}`);
}

// ---- Add ceremony_transcript cross-link if missing ----
let wrote = false;
if (!sq.ceremony_transcript) {
  if (!existsSync(TRANSCRIPT_PATH)) {
    fail(
      `artifacts/mainnet-sessions/multisig-creation.md does not exist - Plan 02-05 was incomplete`,
    );
  }
  const relPath = relative(resolve('.'), TRANSCRIPT_PATH).replace(/\\/g, '/');
  sq.ceremony_transcript = relPath;
  artifact.squads = sq;
  writeFileSync(MAINNET_ARTIFACT, JSON.stringify(artifact, null, 2) + '\n');
  wrote = true;
  console.log(`Added squads.ceremony_transcript=${relPath}`);
} else {
  const asIs = sq.ceremony_transcript as string;
  if (!existsSync(resolve(asIs))) {
    fail(`squads.ceremony_transcript points to missing file: ${asIs}`);
  }
  console.log(`squads.ceremony_transcript already set: ${asIs}`);
}

// ---- Summarize ----
console.log('\n--- artifacts/mainnet.json validation PASS ---');
console.log(`multisig_address: ${multisigPda.toBase58()}`);
console.log(`vault_pda:        ${vaultPda.toBase58()}`);
console.log(`threshold:        ${sq.threshold} of ${sq.voting_member_count}`);
console.log(`voting_members:   ${sq.voting_members.length} unique pubkeys`);
console.log(`proposer:         ${proposerPk.toBase58()} (Initiate-only)`);
console.log(`creation_tx:      ${sq.creation_tx_signature}`);
console.log(`ceremony_transcript: ${sq.ceremony_transcript}`);
console.log(
  `idempotent write: ${wrote ? 'yes (ceremony_transcript added)' : 'no (already consistent)'}`,
);
console.log(`\nNOTE: this script validates artifact-internal consistency only.`);
console.log(`GOV-04 mainnet arm (on-chain mint-authority check) is Phase 4 DEP-04, NOT this plan.`);
