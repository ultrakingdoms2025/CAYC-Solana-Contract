import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from '@solana/web3.js';
import * as multisig from '@sqds/multisig';
import { deriveVaultPda } from './pda.js';
import { SQUADS_V4_PROGRAM_ID, PRIMARY_VAULT_INDEX } from './constants.js';

/**
 * Wait for a tx signature to reach `confirmed` commitment. The @sqds/multisig
 * RPC helpers broadcast-and-return-immediately (they call `sendTransaction`
 * without confirm), so any back-to-back call pattern needs explicit confirmation
 * between steps — otherwise the next RPC's preflight reads a stale chain state
 * and can fail with "InvalidTransactionIndex" and similar race-condition errors.
 */
async function confirmSignature(connection: Connection, signature: string): Promise<void> {
  const latest = await connection.getLatestBlockhash('confirmed');
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    'confirmed',
  );
}

/**
 * Read the multisig account and return the next transactionIndex to use.
 * Callers MUST use this; re-using an existing index throws on-chain
 * ("account already in use").
 */
export async function nextTransactionIndex(
  connection: Connection,
  multisigPda: PublicKey,
): Promise<bigint> {
  const acct = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
  return BigInt(acct.transactionIndex.toString()) + 1n;
}

/**
 * Compile a Squads vault-transaction inner message.
 * payerKey MUST be the vaultPda because the vault "signs" via Squads CPI.
 * PITFALLS.md Pitfall 11: never pass the multisig config account here.
 */
export async function buildVaultTransactionMessage(
  connection: Connection,
  vaultPda: PublicKey,
  instructions: TransactionInstruction[],
): Promise<TransactionMessage> {
  const { blockhash } = await connection.getLatestBlockhash();
  return new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash: blockhash,
    instructions,
  });
}

/** Build + propose a vault transaction. Returns the transactionIndex used. */
export async function proposeVaultTransaction(args: {
  connection: Connection;
  multisigPda: PublicKey;
  proposer: Keypair;
  instructions: TransactionInstruction[];
  memo?: string;
}): Promise<{ transactionIndex: bigint; createTxSig: string; proposalTxSig: string }> {
  const vaultPda = deriveVaultPda(args.multisigPda);
  const transactionIndex = await nextTransactionIndex(args.connection, args.multisigPda);
  const message = await buildVaultTransactionMessage(args.connection, vaultPda, args.instructions);

  const createTxSig = await multisig.rpc.vaultTransactionCreate({
    connection: args.connection,
    multisigPda: args.multisigPda,
    transactionIndex,
    creator: args.proposer.publicKey,
    vaultIndex: PRIMARY_VAULT_INDEX,
    ephemeralSigners: 0,
    transactionMessage: message,
    memo: args.memo,
    feePayer: args.proposer,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  await confirmSignature(args.connection, createTxSig);

  const proposalTxSig = await multisig.rpc.proposalCreate({
    connection: args.connection,
    multisigPda: args.multisigPda,
    transactionIndex,
    creator: args.proposer,
    feePayer: args.proposer,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  await confirmSignature(args.connection, proposalTxSig);

  return { transactionIndex, createTxSig, proposalTxSig };
}

/** Single-signer approval of an existing proposal. Call once per threshold signer. */
export async function approveProposal(args: {
  connection: Connection;
  multisigPda: PublicKey;
  transactionIndex: bigint;
  member: Keypair;
}): Promise<string> {
  const sig = await multisig.rpc.proposalApprove({
    connection: args.connection,
    multisigPda: args.multisigPda,
    transactionIndex: args.transactionIndex,
    member: args.member,
    feePayer: args.member,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  await confirmSignature(args.connection, sig);
  return sig;
}

/** Execute a vault transaction once threshold approvals have been collected. */
export async function executeVaultTransaction(args: {
  connection: Connection;
  multisigPda: PublicKey;
  transactionIndex: bigint;
  executor: Keypair;
}): Promise<string> {
  const sig = await multisig.rpc.vaultTransactionExecute({
    connection: args.connection,
    multisigPda: args.multisigPda,
    transactionIndex: args.transactionIndex,
    member: args.executor.publicKey,
    feePayer: args.executor,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  await confirmSignature(args.connection, sig);
  return sig;
}

/**
 * Propose a config transaction (add/remove member, change threshold, etc).
 * Use multisig.types.ConfigAction shape for `actions` — e.g.,
 *   { __kind: "AddMember", newMember: { key, permissions } }
 *   { __kind: "RemoveMember", oldMember: pubkey }
 */
export async function proposeConfigTransaction(args: {
  connection: Connection;
  multisigPda: PublicKey;
  proposer: Keypair;
  actions: readonly unknown[];
  memo?: string;
}): Promise<{ transactionIndex: bigint; createTxSig: string; proposalTxSig: string }> {
  const transactionIndex = await nextTransactionIndex(args.connection, args.multisigPda);

  const createTxSig = await multisig.rpc.configTransactionCreate({
    connection: args.connection,
    multisigPda: args.multisigPda,
    transactionIndex,
    creator: args.proposer.publicKey,
    feePayer: args.proposer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actions: args.actions as any,
    memo: args.memo,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  await confirmSignature(args.connection, createTxSig);

  const proposalTxSig = await multisig.rpc.proposalCreate({
    connection: args.connection,
    multisigPda: args.multisigPda,
    transactionIndex,
    creator: args.proposer,
    feePayer: args.proposer,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  await confirmSignature(args.connection, proposalTxSig);

  return { transactionIndex, createTxSig, proposalTxSig };
}

/**
 * Execute a config transaction once threshold approvals have been collected.
 * `rentPayer` is required if the config action adds a new member (rent for
 * member array growth). Defaults to `executor` if not provided.
 */
export async function executeConfigTransaction(args: {
  connection: Connection;
  multisigPda: PublicKey;
  transactionIndex: bigint;
  executor: Keypair;
  rentPayer?: Keypair;
}): Promise<string> {
  const sig = await multisig.rpc.configTransactionExecute({
    connection: args.connection,
    multisigPda: args.multisigPda,
    transactionIndex: args.transactionIndex,
    member: args.executor,
    rentPayer: args.rentPayer ?? args.executor,
    feePayer: args.executor,
    programId: SQUADS_V4_PROGRAM_ID,
  });
  await confirmSignature(args.connection, sig);
  return sig;
}
