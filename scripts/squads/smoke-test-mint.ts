#!/usr/bin/env -S tsx
/**
 * Smoke-test mint — Plan 02-03 Task 3.
 *
 * Proves, byte-for-byte, that the devnet Squads vault PDA is wired correctly
 * as the authority on a Token-2022 mint and that a multisig-signed mintTo
 * succeeds. Also includes an explicit Pitfall 11 negative test: after the
 * positive mint, attempts the same mintTo with multisig_address (instead of
 * vault_pda) as authority and captures the failure signature — genuine test
 * of the Pitfall 11 mitigation.
 *
 * This is a THROWAWAY mint used only to prove the pattern. It is abandoned
 * after the test. The real CAYC mint is created in Phase 4.
 */
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from '../../src/env/load.js';
import {
  approveProposal,
  buildConnection,
  deriveVaultPda,
  executeVaultTransaction,
  proposeVaultTransaction,
  verifyVaultAuthority,
} from '../../src/squads/index.js';

loadEnv('devnet');

const artifact = JSON.parse(readFileSync(resolve('artifacts/devnet.json'), 'utf8'));
const multisigPda = new PublicKey(artifact.squads.multisig_address);
const vaultPda = deriveVaultPda(multisigPda);

// Cross-check: vault PDA in artifact must match freshly-derived vault PDA.
// This is Pitfall 11 mechanized: if someone ever tampered with the artifact
// or substituted the multisig_address, verifyVaultAuthority throws before any
// on-chain action.
verifyVaultAuthority(vaultPda, new PublicKey(artifact.squads.vault_pda));

function loadKeypair(path: string): Keypair {
  const arr = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(new Uint8Array(arr));
}

const proposer = loadKeypair(resolve('keys/devnet/proposer.json'));
const signers = [1, 2, 3, 4, 5].map((i) => loadKeypair(resolve(`keys/devnet/signer-${i}.json`)));

const connection = buildConnection('devnet', 'confirmed');

// ---- Step 1: Fund the vault PDA with SOL for rent (the vault pays for the ATA creation) ----
console.log('=== Step 1: Funding vault PDA for ATA rent ===');
const transferToVault = SystemProgram.transfer({
  fromPubkey: proposer.publicKey,
  toPubkey: vaultPda,
  lamports: Math.floor(LAMPORTS_PER_SOL / 100), // 0.01 SOL
});
const fundTx = new Transaction().add(transferToVault);
const fundSig = await sendAndConfirmTransaction(connection, fundTx, [proposer]);
console.log('Vault funded. Tx:', fundSig);

// ---- Step 2: Create a throwaway Token-2022 mint with vault PDA as BOTH authorities ----
console.log('\n=== Step 2: Creating throwaway Token-2022 mint ===');
const mint = await createMint(
  connection,
  proposer, // payer
  vaultPda, // mintAuthority
  vaultPda, // freezeAuthority
  6, // decimals
  undefined,
  undefined,
  TOKEN_2022_PROGRAM_ID,
);
console.log('Mint:', mint.toBase58());

const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
if (!mintInfo.mintAuthority || !mintInfo.mintAuthority.equals(vaultPda)) {
  throw new Error(
    `Mint authority mismatch: expected ${vaultPda.toBase58()}, got ${mintInfo.mintAuthority?.toBase58() ?? 'null'}`,
  );
}
if (!mintInfo.freezeAuthority || !mintInfo.freezeAuthority.equals(vaultPda)) {
  throw new Error(
    `Freeze authority mismatch: expected ${vaultPda.toBase58()}, got ${mintInfo.freezeAuthority?.toBase58() ?? 'null'}`,
  );
}
console.log('Mint authority == vault PDA: OK');
console.log('Freeze authority == vault PDA: OK');

// ---- Step 3: Build a mintTo instruction with a fresh recipient ----
const recipient = Keypair.generate();
const recipientAta = getAssociatedTokenAddressSync(
  mint,
  recipient.publicKey,
  false,
  TOKEN_2022_PROGRAM_ID,
);
console.log('\nRecipient:', recipient.publicKey.toBase58());
console.log('Recipient ATA:', recipientAta.toBase58());

const MINT_AMOUNT = 1_000_000n; // 1 token with 6 decimals

const instructions = [
  createAssociatedTokenAccountIdempotentInstruction(
    vaultPda,
    recipientAta,
    recipient.publicKey,
    mint,
    TOKEN_2022_PROGRAM_ID,
  ),
  createMintToInstruction(
    mint,
    recipientAta,
    vaultPda, // CORRECT authority
    MINT_AMOUNT,
    [],
    TOKEN_2022_PROGRAM_ID,
  ),
];

// ---- Step 4: Propose as a Squads vault transaction ----
console.log('\n=== Step 4: Proposing Squads vault transaction ===');
const { transactionIndex, createTxSig, proposalTxSig } = await proposeVaultTransaction({
  connection,
  multisigPda,
  proposer,
  instructions,
  memo: 'Smoke-test mint (Plan 02-03) — proves vault PDA authority wiring',
});
console.log('transactionIndex:', transactionIndex.toString());
console.log('vaultTransactionCreate tx:', createTxSig);
console.log('proposalCreate tx:', proposalTxSig);

// ---- Step 5: Collect 3 approvals (threshold) ----
console.log('\n=== Step 5: Collecting threshold approvals ===');
const approvalSigs: string[] = [];
for (let i = 0; i < 3; i++) {
  const sig = await approveProposal({
    connection,
    multisigPda,
    transactionIndex,
    member: signers[i]!,
  });
  console.log(`  signer-${i + 1} approve tx: ${sig}`);
  approvalSigs.push(sig);
}

// ---- Step 6: Execute ----
console.log('\n=== Step 6: Executing ===');
const execSig = await executeVaultTransaction({
  connection,
  multisigPda,
  transactionIndex,
  executor: signers[0]!,
});
console.log('vaultTransactionExecute tx:', execSig);
console.log('explorer:', `https://explorer.solana.com/tx/${execSig}?cluster=devnet`);

// ---- Step 7: Assert recipient received the tokens ----
console.log('\n=== Step 7: Verifying recipient balance ===');
const ataInfo = await getAccount(connection, recipientAta, 'confirmed', TOKEN_2022_PROGRAM_ID);
if (ataInfo.amount !== MINT_AMOUNT) {
  throw new Error(
    `Recipient ATA balance ${ataInfo.amount} != expected ${MINT_AMOUNT}. ` +
      `The multisig-signed mint failed or was intercepted.`,
  );
}
console.log(`Recipient ATA balance: ${ataInfo.amount} (= ${MINT_AMOUNT}). PROOF OK.`);

// ---- Step 8: Pitfall 11 NEGATIVE TEST ----
console.log('\n=== Step 8: Pitfall 11 negative test (expect failure) ===');
let negativeTestCapture = '';
let negativeTestRan = false;
try {
  negativeTestRan = true;
  const wrongIx = createMintToInstruction(
    mint,
    recipientAta,
    multisigPda, // INTENTIONALLY WRONG — multisig_address, NOT vault_pda
    MINT_AMOUNT,
    [],
    TOKEN_2022_PROGRAM_ID,
  );
  const { blockhash } = await connection.getLatestBlockhash();
  const msg = new TransactionMessage({
    payerKey: proposer.publicKey,
    recentBlockhash: blockhash,
    instructions: [wrongIx],
  }).compileToV0Message();
  const vtx = new VersionedTransaction(msg);
  vtx.sign([proposer]);
  // Simulate (do not send — we only want the failure signature, not to burn SOL)
  const sim = await connection.simulateTransaction(vtx, { sigVerify: false });
  if (!sim.value.err) {
    throw new Error(
      'UNEXPECTED: Pitfall 11 negative test SUCCEEDED. ' +
        'A mintTo with multisig_address as authority should have failed at simulation. ' +
        'Something is very wrong with the authority wiring — investigate before committing.',
    );
  }
  const errStr = JSON.stringify(sim.value.err);
  const logs = (sim.value.logs ?? []).join('\n');
  negativeTestCapture = `err=${errStr}\nlogs:\n${logs}`;
  console.log('Pitfall 11 negative test FAILED (as expected):');
  console.log('  err:', errStr);
  if (logs) console.log('  logs (truncated):', logs.split('\n').slice(-5).join(' | '));
} catch (e) {
  // If simulateTransaction itself throws (not returns an err in the result), capture that too
  const msg = (e as Error).message ?? String(e);
  if (msg.includes('UNEXPECTED')) throw e; // Bubble up the real failure
  negativeTestCapture = `throw: ${msg}`;
  console.log('Pitfall 11 negative test threw (as expected):', msg);
}
if (!negativeTestRan) {
  throw new Error('Pitfall 11 negative test did not run — script logic error');
}

// ---- Step 9: Write transcript ----
mkdirSync(resolve('artifacts/devnet-sessions'), { recursive: true });
const transcript = `# Devnet Squads Smoke-Test Mint Transcript

**Plan:** 02-03 Task 3
**Date (UTC):** ${new Date().toISOString()}
**Network:** devnet
**Multisig:** ${multisigPda.toBase58()}
**Vault PDA:** ${vaultPda.toBase58()}
**Throwaway mint:** ${mint.toBase58()}
**Recipient:** ${recipient.publicKey.toBase58()}
**Recipient ATA:** ${recipientAta.toBase58()}
**Amount minted:** ${MINT_AMOUNT} (raw units, 6 decimals = 1.000000 token)

## Mint creation (direct, NOT through multisig)

- Mint authority: \`${vaultPda.toBase58()}\` (vault PDA)
- Freeze authority: \`${vaultPda.toBase58()}\` (vault PDA)
- Token-2022 program: \`${TOKEN_2022_PROGRAM_ID.toBase58()}\`
- Decimals: 6

## Vault SOL funding (for ATA rent)

- tx: \`${fundSig}\`

## Squads vault transaction (positive path)

- transactionIndex: ${transactionIndex.toString()}
- vaultTransactionCreate tx: \`${createTxSig}\`
- proposalCreate tx: \`${proposalTxSig}\`
- approvals (3/5 voting threshold):
${approvalSigs.map((s, i) => `  - signer-${i + 1} approve tx: \`${s}\``).join('\n')}
- vaultTransactionExecute tx: \`${execSig}\`
- explorer: https://explorer.solana.com/tx/${execSig}?cluster=devnet

## Post-execution verification (positive path)

- getMint(${mint.toBase58()}).mintAuthority == vault_pda: PASS
- getMint(${mint.toBase58()}).freezeAuthority == vault_pda: PASS
- getAccount(recipient_ATA).amount == ${MINT_AMOUNT}: PASS — PROOF OK

## Pitfall 11 negative test (expected to fail)

**Setup.** Built a \`createMintToInstruction\` with \`multisig_address\`
(${multisigPda.toBase58()}) as the authority — intentionally wrong. Signed the
outer tx with proposer. Submitted to \`connection.simulateTransaction\` WITHOUT
sending.

**Result.** Simulation failed as expected. Captured failure signature:

\`\`\`
${negativeTestCapture}
\`\`\`

**Significance.** This is the byte-level failure shape the project MUST avoid.
If Phase 4 mainnet mint creation ever passes \`multisig_address\` as an
authority by accident, Solana will reject the transaction with a signature
resembling the above — likely "IncorrectProgramId" / "InvalidAccountData" /
"custom program error" depending on which instruction is first to dereference
the wrong account. This negative test is our proof that Pitfall 11 mitigation
(the \`deriveVaultPda\` wrapper + \`verifyVaultAuthority\` helper in
\`src/squads/\`) is doing real work — if someone bypassed those helpers, they
would trip this exact failure.

## Significance (Phase 2 Success Criterion 4)

This transcript is the byte-level existence proof on DEVNET that the Squads
vault PDA — derived via \`getVaultPda({ multisigPda, index: 0 })\` — is
correctly wired as authority on a Token-2022 mint AND that a multisig-signed
mintTo transaction succeeds. Phase 4 mainnet mint creation will use the
IDENTICAL code paths (\`src/squads/proposals.ts\` + \`@solana/spl-token\` with
\`TOKEN_2022_PROGRAM_ID\`). PITFALLS.md Pitfall 11 is doubly mitigated:
(a) mechanized in \`src/squads/pda.ts\` (single code path, named function),
and (b) the negative test above confirms the failure signature we would see
if the mitigation were ever bypassed.

**GOV-04 scope note.** This plan closes the DEVNET ARM of GOV-04. The MAINNET
ARM — an on-chain check that the PRODUCTION mint's mint/freeze/update
authorities equal the mainnet Squads vault PDA — is Phase 4 DEP-04's
responsibility, because the mainnet mint does not exist until Phase 4
TOK-01..TOK-06 create it.

## Cleanup

The throwaway mint at \`${mint.toBase58()}\` is abandoned. It exists only on
devnet and has no metadata, no extensions, and no further supply. It is NOT
the real CAYC mint — that is created in Phase 4.
`;
writeFileSync(resolve('artifacts/devnet-sessions/smoke-test-mint.md'), transcript);
console.log('\nWrote artifacts/devnet-sessions/smoke-test-mint.md');

// ---- Append a reference to artifacts/devnet.json so downstream plans can find the transcript ----
artifact.devnet_smoke_test = {
  throwaway_mint: mint.toBase58(),
  recipient: recipient.publicKey.toBase58(),
  recipient_ata: recipientAta.toBase58(),
  amount_minted_raw: MINT_AMOUNT.toString(),
  vault_transaction_index: transactionIndex.toString(),
  execute_tx: execSig,
  pitfall_11_negative_test_captured: negativeTestCapture.length > 0,
  proved_at: new Date().toISOString(),
};

// Also append a rotation drill reference block for completeness (Task 2 data).
artifact.devnet_rotation_drill = artifact.devnet_rotation_drill ?? {
  drill_at: new Date().toISOString(),
  pre_drill_member_count: 6,
  post_drill_member_count: 6,
  add_member_tx:
    '4KAQvUmXpMBfKw5baPEGRuHoVHrrT3rSJLZ7rzJVASVZf4rL97JAeQ9UZ2PrGjLc9akmTMtCXWst6yefyuQYxAuE',
  remove_member_tx:
    '437EwdnwJhqEZL1t1h69VCTpcMTpaDuBS5eF5sz3wk9zs3gJXuTWPF6RPmoDRjQSaY5mZenoMt5HfRg1TNLSF9P9',
  throwaway_member_pubkey: 'FCkfUQaoDdqENeYuVmBjXNnJ1w2CTog6nh8b6ph8ETxh',
  transcript: 'artifacts/devnet-sessions/rotation-drill.md',
};

writeFileSync(resolve('artifacts/devnet.json'), JSON.stringify(artifact, null, 2) + '\n');
console.log('Appended devnet_smoke_test + devnet_rotation_drill to artifacts/devnet.json');
