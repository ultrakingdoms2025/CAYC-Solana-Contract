#!/usr/bin/env -S tsx
/**
 * scripts/deploy/verify-mint — byte-level on-chain mint verifier.
 *
 * Purpose: read the on-chain Token-2022 mint + TokenMetadata state and assert it
 * matches the single source of truth (src/config/token-config.ts). Any drift
 * produces a specific, human-readable error. ALL mismatches are collected and
 * reported in one run — this lets the human fix every field at once rather than
 * whack-a-mole one error per ceremony.
 *
 * Used by:
 *   - Phase 3 Rehearsal 1 (plan 03-04) — after mint creation + TokenMetadata init
 *   - Phase 3 Rehearsal 2 (plan 03-05) — same, with real launch metadata
 *   - Phase 3 OPS drill (plan 03-06) — verification step in every runbook
 *   - Phase 4 mainnet ceremony (DEP-04) — the acceptance gate for the real mint
 *
 * Guarantees:
 *   - PITFALLS.md Pitfall 11 (vault-PDA vs multisig) — verifyVaultAuthority is
 *     called on every authority field; VaultMismatchError surfaces both pubkeys
 *     in the drift message rather than swallowing the distinction.
 *   - PITFALLS.md Pitfall 7 (program-id spoofing) — uses TOKEN_2022_PROGRAM_ID
 *     from @solana/spl-token, never accepts a program-id CLI arg.
 *   - PITFALLS.md Pitfall 1/6 (extension set) — asserts BOTH MetadataPointer and
 *     PermanentDelegate are present; aborts if either is missing.
 *   - Read-only — issues no writes; safe to run any number of times.
 */
import { Command } from 'commander';
import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getExtensionTypes,
  getPermanentDelegate,
  getMetadataPointerState,
  // NOTE: @solana/spl-token re-exports getTokenMetadata from its tokenMetadata
  // extension (deviation from plan interface spec, which incorrectly listed it
  // as @solana/spl-token-metadata). The low-level @solana/spl-token-metadata
  // package exposes only codecs + instruction builders, not the account reader.
  getTokenMetadata,
} from '@solana/spl-token';

import {
  TOKEN_DECIMALS,
  REHEARSAL_1_METADATA,
  REHEARSAL_2_METADATA,
} from '../../src/config/token-config.js';
import {
  buildConnection,
  verifyVaultAuthority,
  VaultMismatchError,
} from '../../src/squads/index.js';

export interface VerifyArgs {
  connection: Connection;
  mint: PublicKey;
  expectedVault: PublicKey;
  rehearsal: 1 | 2;
  commitment?: Commitment;
}

export interface VerifyResult {
  ok: boolean;
  /** Every mismatch gets one line. Empty iff ok === true. */
  errors: string[];
}

/**
 * Read on-chain mint + metadata state and collect every mismatch vs expectation.
 *
 * Error collection is eager, NOT fail-fast: we deliberately keep running past
 * the first mismatch so a single run surfaces every drift. The CLI wrapper
 * below turns a non-empty errors[] into exit code 1.
 *
 * `verifyVaultAuthority` is invoked for mintAuthority and freezeAuthority —
 * its VaultMismatchError message already names both pubkeys + Pitfall 11, so
 * we catch it and push that message verbatim rather than re-formatting.
 */
export async function runVerify(args: VerifyArgs): Promise<VerifyResult> {
  const commitment: Commitment = args.commitment ?? 'confirmed';
  const errors: string[] = [];
  const expected = args.rehearsal === 1 ? REHEARSAL_1_METADATA : REHEARSAL_2_METADATA;
  const vaultB58 = args.expectedVault.toBase58();

  // -------------------------------------------------------------------------
  // 1. Mint account — decimals, authorities, extensions-present
  // -------------------------------------------------------------------------
  const mint = await getMint(args.connection, args.mint, commitment, TOKEN_2022_PROGRAM_ID);

  // 1a. Decimals
  if (mint.decimals !== TOKEN_DECIMALS) {
    errors.push(`decimals: expected ${TOKEN_DECIMALS}, got ${mint.decimals}`);
  }

  // 1b. Mint authority — use verifyVaultAuthority for Pitfall 11 surfacing
  if (!mint.mintAuthority) {
    errors.push(`mintAuthority: expected ${vaultB58}, got null`);
  } else {
    try {
      verifyVaultAuthority(args.expectedVault, mint.mintAuthority);
    } catch (err) {
      if (err instanceof VaultMismatchError) {
        errors.push(`mintAuthority: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  // 1c. Freeze authority — same Pitfall 11 guard
  if (!mint.freezeAuthority) {
    errors.push(`freezeAuthority: expected ${vaultB58}, got null`);
  } else {
    try {
      verifyVaultAuthority(args.expectedVault, mint.freezeAuthority);
    } catch (err) {
      if (err instanceof VaultMismatchError) {
        errors.push(`freezeAuthority: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  // 1d. isInitialized — defensive; an uninitialized mint shouldn't reach here
  if (!mint.isInitialized) {
    errors.push('mint.isInitialized: expected true, got false');
  }

  // -------------------------------------------------------------------------
  // 2. Extensions — both MetadataPointer AND PermanentDelegate must be present
  // -------------------------------------------------------------------------
  const exts = getExtensionTypes(mint.tlvData);
  if (!exts.includes(ExtensionType.MetadataPointer)) {
    errors.push('extension missing: MetadataPointer');
  }
  if (!exts.includes(ExtensionType.PermanentDelegate)) {
    errors.push('extension missing: PermanentDelegate');
  }

  // -------------------------------------------------------------------------
  // 3. Permanent Delegate — delegate pubkey must equal vault PDA
  // -------------------------------------------------------------------------
  const pd = getPermanentDelegate(mint);
  if (!pd || !pd.delegate) {
    errors.push(`permanentDelegate: expected ${vaultB58}, got null`);
  } else if (!pd.delegate.equals(args.expectedVault)) {
    errors.push(`permanentDelegate: expected ${vaultB58}, got ${pd.delegate.toBase58()}`);
  }

  // -------------------------------------------------------------------------
  // 4. Metadata pointer — must self-reference the mint address (Pattern 3)
  // -------------------------------------------------------------------------
  const mp = getMetadataPointerState(mint);
  if (!mp || !mp.metadataAddress) {
    errors.push(`metadataPointer: expected self (${args.mint.toBase58()}), got null`);
  } else if (!mp.metadataAddress.equals(args.mint)) {
    errors.push(
      `metadataPointer: expected self (${args.mint.toBase58()}), got ${mp.metadataAddress.toBase58()}`,
    );
  }

  // -------------------------------------------------------------------------
  // 5. TokenMetadata — name, symbol, updateAuthority
  // -------------------------------------------------------------------------
  const md = await getTokenMetadata(args.connection, args.mint, commitment, TOKEN_2022_PROGRAM_ID);
  if (!md) {
    errors.push('TokenMetadata: expected initialized, got null');
  } else {
    if (md.name !== expected.name) {
      errors.push(`name: expected ${expected.name}, got ${md.name}`);
    }
    if (md.symbol !== expected.symbol) {
      errors.push(`symbol: expected ${expected.symbol}, got ${md.symbol}`);
    }
    if (!md.updateAuthority) {
      errors.push(`updateAuthority: expected ${vaultB58}, got null`);
    } else {
      try {
        verifyVaultAuthority(args.expectedVault, md.updateAuthority);
      } catch (err) {
        if (err instanceof VaultMismatchError) {
          errors.push(`updateAuthority: ${err.message}`);
        } else {
          throw err;
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// CLI wrapper — only runs when invoked directly via `tsx verify-mint.ts`.
// Tests import runVerify and call it with a mocked connection; the CLI
// branch below is skipped in that code path because argv[1] ends with
// .test.ts rather than verify-mint.ts.
// ---------------------------------------------------------------------------
const invokedAsCli =
  typeof process.argv[1] === 'string' && process.argv[1].endsWith('verify-mint.ts');

if (invokedAsCli) {
  const program = new Command();
  program
    .name('verify-mint')
    .description('Byte-level on-chain mint + metadata verifier')
    .requiredOption('--network <net>', 'devnet | mainnet-beta')
    .requiredOption('--mint <pubkey>', 'mint address to verify')
    .requiredOption('--expected-vault <pubkey>', 'expected Squads vault PDA (authority target)')
    .requiredOption('--rehearsal <n>', 'rehearsal metadata bundle (1 or 2)', (v: string) => {
      const n = Number(v);
      if (n !== 1 && n !== 2) {
        throw new Error('--rehearsal must be 1 or 2');
      }
      return n as 1 | 2;
    })
    .parse(process.argv);

  const opts = program.opts<{
    network: 'devnet' | 'mainnet-beta';
    mint: string;
    expectedVault: string;
    rehearsal: 1 | 2;
  }>();

  if (opts.network !== 'devnet' && opts.network !== 'mainnet-beta') {
    console.error(`ERROR: --network must be "devnet" or "mainnet-beta", got: ${opts.network}`);
    process.exit(2);
  }

  const connection = buildConnection(opts.network, 'confirmed');
  const mintPk = new PublicKey(opts.mint);
  const expectedVaultPk = new PublicKey(opts.expectedVault);

  const result = await runVerify({
    connection,
    mint: mintPk,
    expectedVault: expectedVaultPk,
    rehearsal: opts.rehearsal,
  });

  if (result.ok) {
    console.log(
      `PASS: ${mintPk.toBase58()} matches all expected fields for rehearsal ${opts.rehearsal}`,
    );
    process.exit(0);
  } else {
    console.error(`FAIL: ${mintPk.toBase58()} has ${result.errors.length} mismatches:`);
    for (const e of result.errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }
}
