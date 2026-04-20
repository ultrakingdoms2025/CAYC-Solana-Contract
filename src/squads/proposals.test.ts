import { describe, it, expect, vi } from 'vitest';
import { Connection, Keypair, TransactionMessage } from '@solana/web3.js';
import * as multisig from '@sqds/multisig';

import { deriveVaultPda } from './pda.js';
import { buildVaultTransactionMessage, nextTransactionIndex } from './proposals.js';

describe('src/squads/proposals — helper contracts', () => {
  // --------------------------------------------------------------------
  // Test 1 — nextTransactionIndex returns onchain.transactionIndex + 1n.
  //
  // Mock @sqds/multisig Multisig.fromAccountAddress to return a fixed
  // transactionIndex=5; our helper must return 6n (bigint).
  // --------------------------------------------------------------------
  it('nextTransactionIndex returns (on-chain transactionIndex + 1n) as bigint', async () => {
    const fakeMultisigPda = Keypair.generate().publicKey;
    const mockedAcct = { transactionIndex: 5n };
    const spy = vi
      .spyOn(multisig.accounts.Multisig, 'fromAccountAddress')
      .mockResolvedValue(mockedAcct as unknown as multisig.accounts.Multisig);

    // Connection object is never touched because fromAccountAddress is mocked.
    const fakeConn = {} as unknown as Connection;
    const next = await nextTransactionIndex(fakeConn, fakeMultisigPda);

    expect(typeof next).toBe('bigint');
    expect(next).toBe(6n);

    spy.mockRestore();
  });

  // --------------------------------------------------------------------
  // Test 2 — buildVaultTransactionMessage uses vaultPda as payerKey and
  // preserves instruction order/length. Uses a mock connection that
  // returns a canned blockhash — no RPC required.
  // --------------------------------------------------------------------
  it('buildVaultTransactionMessage sets payerKey=vaultPda and preserves instructions', async () => {
    const multisigPda = Keypair.generate().publicKey;
    const vaultPda = deriveVaultPda(multisigPda);

    // Mock the connection so we do not hit any RPC.
    const fakeConn = {
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: '11111111111111111111111111111111',
        lastValidBlockHeight: 1,
      }),
    } as unknown as Connection;

    const ixA = {
      programId: Keypair.generate().publicKey,
      keys: [],
      data: Buffer.alloc(0),
    } as unknown as import('@solana/web3.js').TransactionInstruction;
    const ixB = {
      programId: Keypair.generate().publicKey,
      keys: [],
      data: Buffer.alloc(0),
    } as unknown as import('@solana/web3.js').TransactionInstruction;

    const msg = await buildVaultTransactionMessage(fakeConn, vaultPda, [ixA, ixB]);

    expect(msg).toBeInstanceOf(TransactionMessage);
    // payerKey MUST be vaultPda — this is the whole point of the helper (Pitfall 11).
    expect(msg.payerKey.equals(vaultPda)).toBe(true);
    expect(msg.instructions).toHaveLength(2);
    expect(msg.instructions[0]).toBe(ixA);
    expect(msg.instructions[1]).toBe(ixB);
  });

  // --------------------------------------------------------------------
  // Test 3 — Module exports typed lifecycle helpers.
  //
  // Importing these at top-of-file and asserting their `typeof` is 'function'
  // is a structural guarantee: if the module compiled (tsc --noEmit green)
  // AND the functions are callable, the typed API contract holds.
  // --------------------------------------------------------------------
  it('exports the 5 proposal-lifecycle helpers as callable functions', async () => {
    const proposals = await import('./proposals.js');
    expect(typeof proposals.proposeVaultTransaction).toBe('function');
    expect(typeof proposals.approveProposal).toBe('function');
    expect(typeof proposals.executeVaultTransaction).toBe('function');
    expect(typeof proposals.proposeConfigTransaction).toBe('function');
    expect(typeof proposals.executeConfigTransaction).toBe('function');
    // Utility helpers:
    expect(typeof proposals.nextTransactionIndex).toBe('function');
    expect(typeof proposals.buildVaultTransactionMessage).toBe('function');
  });
});
