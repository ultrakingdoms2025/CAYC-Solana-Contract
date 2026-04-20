import { describe, it, expect } from 'vitest';
import { Keypair, PublicKey } from '@solana/web3.js';
import { types, getVaultPda as sdkGetVaultPda } from '@sqds/multisig';

const { Permission, Permissions } = types;

import {
  SQUADS_V4_PROGRAM_ID,
  PRIMARY_VAULT_INDEX,
  MAINNET_THRESHOLD,
  MAINNET_SIGNER_COUNT,
} from './constants.js';
import { deriveVaultPda, deriveMultisigPda } from './pda.js';
import { buildVotingMembers, buildProposerMember } from './members.js';
import { verifyVaultAuthority, VaultMismatchError } from './verify.js';

describe('src/squads — helper module contracts', () => {
  // A deterministic multisig pubkey for vault PDA derivation checks.
  // Using Keypair.generate() per test run is fine — deriveVaultPda must match
  // the SDK's getVaultPda output whatever the input pubkey is.
  const knownMultisig = Keypair.generate().publicKey;

  // -------------------------------------------------------------------------
  // Test 1 — vault PDA derivation matches the SDK exactly
  // -------------------------------------------------------------------------
  it('deriveVaultPda matches @sqds/multisig getVaultPda({ index: 0 })', () => {
    const [expectedPda] = sdkGetVaultPda({
      multisigPda: knownMultisig,
      index: PRIMARY_VAULT_INDEX,
      programId: SQUADS_V4_PROGRAM_ID,
    });
    const wrappedPda = deriveVaultPda(knownMultisig);
    expect(wrappedPda.equals(expectedPda)).toBe(true);
    // And explicitly assert vault index is 0 (Pitfall 11 mitigation — mainnet
    // authorities are always derived at the primary vault index).
    expect(PRIMARY_VAULT_INDEX).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Test 2 — voting member builder produces all-permission members
  // -------------------------------------------------------------------------
  it('buildVotingMembers returns Member[] of length 5 with Permissions.all() mask', () => {
    const keys = Array.from({ length: 5 }, () => Keypair.generate().publicKey);
    const members = buildVotingMembers(keys);
    expect(members).toHaveLength(MAINNET_SIGNER_COUNT);
    const allMask = Permissions.all().mask;
    // Sanity: Initiate | Vote | Execute = 1 | 2 | 4 = 7
    expect(allMask).toBe(7);
    for (let i = 0; i < members.length; i++) {
      const m = members[i]!;
      const k = keys[i]!;
      expect(m.key.equals(k)).toBe(true);
      expect(m.permissions.mask).toBe(allMask);
    }
  });

  // -------------------------------------------------------------------------
  // Test 3 — proposer-only member has Initiate-only permission
  // -------------------------------------------------------------------------
  it('buildProposerMember returns an Initiate-only Member (no Vote, no Execute)', () => {
    const hotKey = Keypair.generate().publicKey;
    const m = buildProposerMember(hotKey);
    const initiateOnlyMask = Permissions.fromPermissions([Permission.Initiate]).mask;
    expect(m.key.equals(hotKey)).toBe(true);
    expect(m.permissions.mask).toBe(initiateOnlyMask);
    // Must strictly be 1 (Initiate bit only) — not 3 (Initiate|Vote) nor 7 (all).
    expect(m.permissions.mask).toBe(1);
    expect(m.permissions.mask).not.toBe(Permissions.all().mask);
  });

  // -------------------------------------------------------------------------
  // Test 4 — verifyVaultAuthority accepts match, throws named error on mismatch
  // -------------------------------------------------------------------------
  it('verifyVaultAuthority returns {ok:true} when vault PDA matches', () => {
    const vault = deriveVaultPda(knownMultisig);
    expect(verifyVaultAuthority(vault, vault)).toEqual({ ok: true });
  });

  it('verifyVaultAuthority throws VaultMismatchError naming both addresses', () => {
    const expected = deriveVaultPda(knownMultisig);
    // An obviously-wrong candidate: the multisig config account itself
    // (this is EXACTLY the Pitfall 11 scenario).
    const wrongCandidate = knownMultisig;
    expect(() => verifyVaultAuthority(expected, wrongCandidate)).toThrow(VaultMismatchError);
    try {
      verifyVaultAuthority(expected, wrongCandidate);
    } catch (err) {
      expect(err).toBeInstanceOf(VaultMismatchError);
      const msg = (err as Error).message;
      expect(msg).toContain(expected.toBase58());
      expect(msg).toContain(wrongCandidate.toBase58());
      expect(msg).toContain('Pitfall 11');
    }
  });

  // -------------------------------------------------------------------------
  // Test 5 — canonical program id constant
  // -------------------------------------------------------------------------
  it('SQUADS_V4_PROGRAM_ID is the canonical Squads v4 program id', () => {
    expect(SQUADS_V4_PROGRAM_ID).toBeInstanceOf(PublicKey);
    expect(SQUADS_V4_PROGRAM_ID.toBase58()).toBe('SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf');
  });

  // -------------------------------------------------------------------------
  // Bonus check: deriveMultisigPda returns a deterministic, reproducible PDA
  // -------------------------------------------------------------------------
  it('deriveMultisigPda is deterministic for the same createKey', () => {
    const createKey = Keypair.generate().publicKey;
    const a = deriveMultisigPda(createKey);
    const b = deriveMultisigPda(createKey);
    expect(a.equals(b)).toBe(true);
  });

  it('MAINNET_THRESHOLD and MAINNET_SIGNER_COUNT match CONTEXT.md (3-of-5)', () => {
    expect(MAINNET_THRESHOLD).toBe(3);
    expect(MAINNET_SIGNER_COUNT).toBe(5);
  });
});
