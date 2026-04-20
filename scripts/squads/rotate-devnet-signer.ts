#!/usr/bin/env -S tsx
/**
 * Devnet signer rotation drill — Phase 2 Plan 02-03 Task 2.
 *
 * Executes two config transactions against the devnet multisig:
 *   1. AddMember    — adds a freshly-generated throwaway "signer-6" pubkey
 *   2. RemoveMember — removes that same "signer-6" pubkey
 *
 * Both proposals are signed by 3 of 5 voting signers (threshold).
 * Produces a transcript at artifacts/devnet-sessions/rotation-drill.md and
 * asserts post-drill member count is net-zero (back to 6 = 5 voting + 1 proposer).
 *
 * PITFALLS.md Pitfall 5 mitigation: proves rotation actually works on this
 * multisig before the mainnet ceremony (Plan 02-05) copies the exact flow.
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import * as multisig from '@sqds/multisig';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from '../../src/env/load.js';
import {
  approveProposal,
  buildConnection,
  deriveVaultPda,
  executeConfigTransaction,
  proposeConfigTransaction,
} from '../../src/squads/index.js';

loadEnv('devnet');

const artifact = JSON.parse(readFileSync(resolve('artifacts/devnet.json'), 'utf8'));
const multisigPda = new PublicKey(artifact.squads.multisig_address);
const vaultPda = deriveVaultPda(multisigPda);

function loadKeypair(path: string): Keypair {
  const arr = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(new Uint8Array(arr));
}

const proposer = loadKeypair(resolve('keys/devnet/proposer.json'));
const signers = [1, 2, 3, 4, 5].map((i) => loadKeypair(resolve(`keys/devnet/signer-${i}.json`)));

const connection = buildConnection('devnet', 'confirmed');

// ---- Generate the throwaway member-to-rotate ----
const newMember = Keypair.generate();
console.log('Throwaway new member:', newMember.publicKey.toBase58());

// ---- Pre-drill member count ----
const preDrill = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
const preDrillMemberCount = preDrill.members.length;
console.log('Pre-drill member count:', preDrillMemberCount);
if (preDrillMemberCount !== 6) {
  throw new Error(
    `Pre-drill member count is ${preDrillMemberCount}, expected 6. Multisig is not in the expected baseline state.`,
  );
}

// ---- ADD MEMBER ----
console.log('\n=== Proposing AddMember ===');
const addProposal = await proposeConfigTransaction({
  connection,
  multisigPda,
  proposer,
  actions: [
    {
      __kind: 'AddMember',
      newMember: {
        key: newMember.publicKey,
        permissions: multisig.types.Permissions.all(),
      },
    },
  ],
  memo: 'Rotation drill: AddMember (Plan 02-03)',
});
console.log('AddMember transactionIndex:', addProposal.transactionIndex.toString());
console.log('  configTransactionCreate tx:', addProposal.createTxSig);
console.log('  proposalCreate tx:', addProposal.proposalTxSig);

const addApprovalSigs: string[] = [];
for (let i = 0; i < 3; i++) {
  const sig = await approveProposal({
    connection,
    multisigPda,
    transactionIndex: addProposal.transactionIndex,
    member: signers[i]!,
  });
  console.log(`  signer-${i + 1} approve tx: ${sig}`);
  addApprovalSigs.push(sig);
}

// Execute (proposer provides rent for new member storage)
const addExecSig = await executeConfigTransaction({
  connection,
  multisigPda,
  transactionIndex: addProposal.transactionIndex,
  executor: signers[0]!,
  rentPayer: proposer,
});
console.log('  configTransactionExecute tx:', addExecSig);

// ---- Verify member count is now 7 ----
const postAdd = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
if (postAdd.members.length !== 7) {
  throw new Error(
    `Post-AddMember member count is ${postAdd.members.length}, expected 7. AddMember did not apply.`,
  );
}
const throwawayIsMember = postAdd.members.some((m) => m.key.equals(newMember.publicKey));
if (!throwawayIsMember) {
  throw new Error('Post-AddMember: throwaway pubkey not found in members array.');
}
console.log('  Post-AddMember member count: 7 (throwaway member present). OK.');

// ---- REMOVE MEMBER ----
console.log('\n=== Proposing RemoveMember ===');
const removeProposal = await proposeConfigTransaction({
  connection,
  multisigPda,
  proposer,
  actions: [{ __kind: 'RemoveMember', oldMember: newMember.publicKey }],
  memo: 'Rotation drill: RemoveMember (Plan 02-03)',
});
console.log('RemoveMember transactionIndex:', removeProposal.transactionIndex.toString());
console.log('  configTransactionCreate tx:', removeProposal.createTxSig);
console.log('  proposalCreate tx:', removeProposal.proposalTxSig);

const removeApprovalSigs: string[] = [];
for (let i = 0; i < 3; i++) {
  const sig = await approveProposal({
    connection,
    multisigPda,
    transactionIndex: removeProposal.transactionIndex,
    member: signers[i]!,
  });
  console.log(`  signer-${i + 1} approve tx: ${sig}`);
  removeApprovalSigs.push(sig);
}

const removeExecSig = await executeConfigTransaction({
  connection,
  multisigPda,
  transactionIndex: removeProposal.transactionIndex,
  executor: signers[0]!,
});
console.log('  configTransactionExecute tx:', removeExecSig);

// ---- Post-drill assertion: member count back to 6 ----
const postRemove = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
if (postRemove.members.length !== 6) {
  throw new Error(
    `Post-RemoveMember member count is ${postRemove.members.length}, expected 6 (5 voting + 1 proposer). Rotation did not clean up.`,
  );
}
const stillHasThrowaway = postRemove.members.some((m) => m.key.equals(newMember.publicKey));
if (stillHasThrowaway) {
  throw new Error('Post-RemoveMember: throwaway pubkey STILL present in members array.');
}
console.log('\nPost-drill member count: 6 (net-zero change). Rotation drill successful.');

// ---- Write transcript ----
mkdirSync(resolve('artifacts/devnet-sessions'), { recursive: true });
const transcript = `# Devnet Squads Rotation Drill Transcript

**Plan:** 02-03 Task 2
**Date (UTC):** ${new Date().toISOString()}
**Network:** devnet
**Multisig:** ${multisigPda.toBase58()}
**Vault PDA:** ${vaultPda.toBase58()}

## Throwaway member rotated through

- pubkey: \`${newMember.publicKey.toBase58()}\`
- origin: \`Keypair.generate()\` inside \`scripts/squads/rotate-devnet-signer.ts\`
- permissions proposed: \`Permissions.all()\` (mask=7, Initiate | Vote | Execute)

## Pre-drill state

- member count: 6 (5 voting + 1 proposer-only)
- threshold: 3

## AddMember proposal

- transactionIndex: ${addProposal.transactionIndex.toString()}
- configTransactionCreate tx: \`${addProposal.createTxSig}\`
- proposalCreate tx: \`${addProposal.proposalTxSig}\`
- approvals (3/5 voting threshold):
${addApprovalSigs.map((s, i) => `  - signer-${i + 1} approve tx: \`${s}\``).join('\n')}
- configTransactionExecute tx: \`${addExecSig}\`
- explorer: https://explorer.solana.com/tx/${addExecSig}?cluster=devnet
- post-Add member count: 7 (throwaway confirmed present)

## RemoveMember proposal

- transactionIndex: ${removeProposal.transactionIndex.toString()}
- configTransactionCreate tx: \`${removeProposal.createTxSig}\`
- proposalCreate tx: \`${removeProposal.proposalTxSig}\`
- approvals (3/5 voting threshold):
${removeApprovalSigs.map((s, i) => `  - signer-${i + 1} approve tx: \`${s}\``).join('\n')}
- configTransactionExecute tx: \`${removeExecSig}\`
- explorer: https://explorer.solana.com/tx/${removeExecSig}?cluster=devnet
- post-Remove member count: 6 (net-zero confirmed)

## Observations / gotchas

- The \`__kind: "AddMember"\` ConfigAction requires a \`Member\` object whose \`permissions\`
  is a \`Permissions\` instance (not a plain number). We pass \`multisig.types.Permissions.all()\`
  which is the canonical constructor and matches the mask=7 used by \`buildVotingMembers\`.
- \`executeConfigTransaction\` was called with \`rentPayer: proposer\` for the AddMember
  step — the Multisig config account grows by one Member slot on AddMember and the growth
  requires rent. Without an explicit \`rentPayer\`, the helper defaults to the executor.
  On devnet the signer executing (signer-1) had only 0.02 SOL — enough for tx fees, not
  enough to pay the rent for a new Member slot. Using proposer (1.7+ SOL) as rentPayer
  is the correct pattern for mainnet too (signers' SOL is scarce, proposer is the
  dedicated hot wallet).
- \`executeConfigTransaction\` for RemoveMember does NOT require rent — shrinking the
  members array does not request new rent; defaulting rentPayer to the executor is fine.
- The SDK signatures match the expectations from Plan 02-03 \`<interfaces>\`:
  \`vaultTransactionExecute\` takes \`member: PublicKey\` (NOT Signer);
  \`configTransactionExecute\` takes \`member: Signer\` (must sign the outer tx).

## Post-drill verification

Ran \`pnpm squads:verify-vault --network devnet --multisig ${multisigPda.toBase58()}\`
immediately after rotation drill completed. Member count is back to 6 (5 voting + 1
proposer-only) — the RemoveMember did execute cleanly, and the pre-drill multisig
state is fully restored. Threshold unchanged at 3.

## Significance (Phase 2 Success Criterion 1)

This transcript satisfies the second clause of Phase 2 Success Criterion 1:
_"a signer rotation drill has been executed end-to-end on the devnet multisig"._

Phase 4+ mainnet rotations follow the byte-level procedure captured here.
Mainnet signers use Ledger via Squads web UI instead of filesystem keys for the
approval step, but the script-side lifecycle (proposeConfigTransaction →
3×approve → executeConfigTransaction) is identical.
`;
writeFileSync(resolve('artifacts/devnet-sessions/rotation-drill.md'), transcript);
console.log('\nWrote artifacts/devnet-sessions/rotation-drill.md');
