/**
 * Unit tests for scripts/deploy/verify-mint.ts (Plan 03-02).
 *
 * Strategy: mock @solana/spl-token (getMint, getExtensionTypes, getPermanentDelegate,
 * getMetadataPointerState) and @solana/spl-token-metadata (getTokenMetadata) at the
 * module level. verify-mint.ts is a READ-only verifier — mock-level tests are faster
 * than bankrun and cover the whole contract: each mismatch produces a specific,
 * human-readable error string in the aggregated errors[] result.
 *
 * The tests intentionally import from '../../src/config/token-config.js' (Plan 03-01
 * output). If that file is not yet available at RED time, the import failure is an
 * acceptable RED signal; GREEN phase requires 03-01's token-config.ts to exist.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey, Connection } from '@solana/web3.js';
import { ExtensionType } from '@solana/spl-token';

// -----------------------------------------------------------------------------
// Module-level mocks: intercept on-chain reads so tests run in-process, <1s.
// vi.mock is hoisted to the top of the file by vitest.
// -----------------------------------------------------------------------------
vi.mock('@solana/spl-token', async () => {
  const actual = await vi.importActual<typeof import('@solana/spl-token')>('@solana/spl-token');
  return {
    ...actual,
    getMint: vi.fn(),
    getExtensionTypes: vi.fn(),
    getPermanentDelegate: vi.fn(),
    getMetadataPointerState: vi.fn(),
  };
});
vi.mock('@solana/spl-token-metadata', () => ({
  getTokenMetadata: vi.fn(),
}));

// Import AFTER vi.mock so mocked exports are in the module graph.
import {
  getMint,
  getExtensionTypes,
  getPermanentDelegate,
  getMetadataPointerState,
} from '@solana/spl-token';
import { getTokenMetadata } from '@solana/spl-token-metadata';

// System under test — intentionally the module path 03-02 Task 2 will create.
// In RED phase the import resolves to a non-existent module and the tests fail.
import { runVerify } from './verify-mint.js';

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------
// Canonical devnet vault PDA from Plan 02-03 smoke-test / 02-06 publish-artifacts.
const EXPECTED_VAULT = new PublicKey('5tTobJ2HLuuKZxXGLYZW1Wo2ojVhD1wZfoFDxDUkKtHu');
// Throwaway Plan 02-03 smoke-test mint; stands in as "the mint under verification".
const MINT = new PublicKey('J516PvBznTVHT9xDtWs2Qc6rBk3y9DqaK5JdCSUh2RbJ');
// Deterministic "unrelated" pubkey for mismatch-path tests.
const UNRELATED = new PublicKey('11111111111111111111111111111112');

// Token-config constants (Plan 03-01) — re-declared as local fixtures here so
// the test suite remains readable even if the import surface changes. These
// MUST stay byte-for-byte identical to src/config/token-config.ts.
const EXPECTED_NAME_REH2 = 'Cyber Ape Yacht Club 8G';
const EXPECTED_SYMBOL_REH2 = 'CAYC';
const EXPECTED_NAME_REH1 = 'Rehearsal 1 — Throwaway';
const EXPECTED_SYMBOL_REH1 = 'REH1';

// A minimal "mint struct" shape that the SPL helpers consume. Only the fields
// verify-mint reads are populated; TLV data is an empty buffer because
// getExtensionTypes / getPermanentDelegate / getMetadataPointerState are all
// mocked — they never parse the buffer themselves in these tests.
function buildMockMint(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    address: MINT,
    mintAuthority: EXPECTED_VAULT,
    freezeAuthority: EXPECTED_VAULT,
    supply: 0n,
    decimals: 6,
    isInitialized: true,
    tlvData: Buffer.alloc(0),
    ...overrides,
  };
}

function buildMockMetadata(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    updateAuthority: EXPECTED_VAULT,
    mint: MINT,
    name: EXPECTED_NAME_REH2,
    symbol: EXPECTED_SYMBOL_REH2,
    uri: 'https://arweave.net/PLACEHOLDER',
    additionalMetadata: [] as [string, string][],
    ...overrides,
  };
}

// A fake connection — never touched because all network reads are mocked.
const fakeConnection = {} as unknown as Connection;

// Typed aliases for the mocked functions (vitest's vi.mocked preserves types).
const mockedGetMint = vi.mocked(getMint);
const mockedGetExtensionTypes = vi.mocked(getExtensionTypes);
const mockedGetPermanentDelegate = vi.mocked(getPermanentDelegate);
const mockedGetMetadataPointerState = vi.mocked(getMetadataPointerState);
const mockedGetTokenMetadata = vi.mocked(getTokenMetadata);

// Reset ALL mocks before each test so state does not leak.
beforeEach(() => {
  vi.resetAllMocks();

  // Default "all-match" happy path for rehearsal 2 — each test overrides
  // specific mocks as needed. This keeps the failing-path tests terse.
  mockedGetMint.mockResolvedValue(buildMockMint() as never);
  mockedGetExtensionTypes.mockReturnValue([
    ExtensionType.MetadataPointer,
    ExtensionType.PermanentDelegate,
  ]);
  mockedGetPermanentDelegate.mockReturnValue({ delegate: EXPECTED_VAULT });
  mockedGetMetadataPointerState.mockReturnValue({
    authority: EXPECTED_VAULT,
    metadataAddress: MINT,
  });
  mockedGetTokenMetadata.mockResolvedValue(buildMockMetadata() as never);
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------
describe('scripts/deploy/verify-mint — runVerify contract', () => {
  // ---------------------------------------------------------------------------
  // Test 1 — all-match happy path returns { ok: true, errors: [] }
  // ---------------------------------------------------------------------------
  it('all on-chain fields match expected for rehearsal 2 → ok, no errors', async () => {
    const result = await runVerify({
      connection: fakeConnection,
      mint: MINT,
      expectedVault: EXPECTED_VAULT,
      rehearsal: 2,
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Test 2 — wrong decimals → mismatch error naming expected + got values
  // ---------------------------------------------------------------------------
  it('wrong decimals produces a specific "expected 6, got 9" error', async () => {
    mockedGetMint.mockResolvedValue(buildMockMint({ decimals: 9 }) as never);
    const result = await runVerify({
      connection: fakeConnection,
      mint: MINT,
      expectedVault: EXPECTED_VAULT,
      rehearsal: 2,
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('decimals: expected 6, got 9')]),
    );
  });

  // ---------------------------------------------------------------------------
  // Test 3 — wrong mint authority → mismatch names expected vault + actual key
  // ---------------------------------------------------------------------------
  it('wrong mintAuthority produces a mismatch error naming both addresses', async () => {
    mockedGetMint.mockResolvedValue(
      buildMockMint({ mintAuthority: UNRELATED }) as never,
    );
    const result = await runVerify({
      connection: fakeConnection,
      mint: MINT,
      expectedVault: EXPECTED_VAULT,
      rehearsal: 2,
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('mintAuthority'),
      ]),
    );
    const mintAuthError = result.errors.find((e) => e.includes('mintAuthority'));
    expect(mintAuthError).toBeDefined();
    expect(mintAuthError!).toContain(EXPECTED_VAULT.toBase58());
    expect(mintAuthError!).toContain(UNRELATED.toBase58());
  });

  // ---------------------------------------------------------------------------
  // Test 4 — missing MetadataPointer extension → explicit error
  // ---------------------------------------------------------------------------
  it('missing MetadataPointer extension produces an "extension missing" error', async () => {
    mockedGetExtensionTypes.mockReturnValue([ExtensionType.PermanentDelegate]);
    const result = await runVerify({
      connection: fakeConnection,
      mint: MINT,
      expectedVault: EXPECTED_VAULT,
      rehearsal: 2,
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('MetadataPointer')]),
    );
  });

  // ---------------------------------------------------------------------------
  // Test 5 — TokenMetadata name mismatch (rehearsal-1 strings vs rehearsal 2 call)
  // ---------------------------------------------------------------------------
  it('TokenMetadata name mismatch produces "expected <reh2 name>, got <reh1 name>"', async () => {
    mockedGetTokenMetadata.mockResolvedValue(
      buildMockMetadata({ name: EXPECTED_NAME_REH1, symbol: EXPECTED_SYMBOL_REH1 }) as never,
    );
    const result = await runVerify({
      connection: fakeConnection,
      mint: MINT,
      expectedVault: EXPECTED_VAULT,
      rehearsal: 2,
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`name: expected ${EXPECTED_NAME_REH2}`),
      ]),
    );
    const nameErr = result.errors.find((e) => e.startsWith('name:'));
    expect(nameErr).toBeDefined();
    expect(nameErr!).toContain(EXPECTED_NAME_REH1);
  });

  // ---------------------------------------------------------------------------
  // Test 6 — report ALL mismatches in ONE run (no short-circuit on first error)
  // Combine: wrong decimals + wrong mintAuthority + missing PermanentDelegate
  // → expect errors.length >= 3 so a single run surfaces every drift at once.
  // ---------------------------------------------------------------------------
  it('aggregates multiple mismatches — does NOT short-circuit on the first one', async () => {
    mockedGetMint.mockResolvedValue(
      buildMockMint({ decimals: 9, mintAuthority: UNRELATED }) as never,
    );
    mockedGetExtensionTypes.mockReturnValue([ExtensionType.MetadataPointer]); // PermanentDelegate missing
    mockedGetPermanentDelegate.mockReturnValue(null);

    const result = await runVerify({
      connection: fakeConnection,
      mint: MINT,
      expectedVault: EXPECTED_VAULT,
      rehearsal: 2,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);

    // Each distinct mismatch surfaces in the aggregated result:
    const combined = result.errors.join('\n');
    expect(combined).toContain('decimals');
    expect(combined).toContain('mintAuthority');
    expect(combined).toContain('PermanentDelegate');
  });
});
