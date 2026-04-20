import { PublicKey } from '@solana/web3.js';
import { types } from '@sqds/multisig';

/**
 * Member type re-exported from @sqds/multisig generated types.
 * Shape: { key: PublicKey; permissions: Permissions }
 */
export type Member = types.Member;

/**
 * Build a Member[] of voting signers (Initiate | Vote | Execute).
 * Per CONTEXT.md §decisions: mainnet has 5 voting members.
 */
export function buildVotingMembers(keys: readonly PublicKey[]): Member[] {
  return keys.map((key) => ({ key, permissions: types.Permissions.all() }));
}

/**
 * Build a proposer-only Member (Initiate only — no Vote, no Execute).
 * Per CONTEXT.md §decisions: proposer hot wallet is NOT a voting member.
 */
export function buildProposerMember(key: PublicKey): Member {
  return {
    key,
    permissions: types.Permissions.fromPermissions([types.Permission.Initiate]),
  };
}
