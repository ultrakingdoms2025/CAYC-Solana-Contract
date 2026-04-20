import { describe, it, expect } from 'vitest';
import { ExtensionType } from '@solana/spl-token';

import {
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_DESCRIPTION,
  TOKEN_DECIMALS,
  TOKEN_WEBSITE_URL,
  TOKEN_EXTENSIONS,
  REHEARSAL_1_METADATA,
  REHEARSAL_2_METADATA,
  INITIAL_SUPPLY_RAW,
} from './token-config.js';

describe('src/config/token-config — locked launch constants', () => {
  // -------------------------------------------------------------------------
  // Test 1 — TOKEN_NAME exact string including the '8G' brand disambiguator
  // -------------------------------------------------------------------------
  it('TOKEN_NAME is exactly "Cyber Ape Yacht Club 8G" (brand disambiguator preserved)', () => {
    expect(TOKEN_NAME).toBe('Cyber Ape Yacht Club 8G');
  });

  // -------------------------------------------------------------------------
  // Test 2 — TOKEN_SYMBOL exactly 4 chars per Phase 1 accept-conflict decision
  // -------------------------------------------------------------------------
  it('TOKEN_SYMBOL is exactly "CAYC"', () => {
    expect(TOKEN_SYMBOL).toBe('CAYC');
    expect(TOKEN_SYMBOL.length).toBe(4);
  });

  // -------------------------------------------------------------------------
  // Test 3 — TOKEN_DESCRIPTION is the exact style-guide-safe launch string
  // -------------------------------------------------------------------------
  it('TOKEN_DESCRIPTION is the exact locked launch description', () => {
    expect(TOKEN_DESCRIPTION).toBe(
      'Payment token for Cyber Ape Yacht Club. Squads 3-of-5 multisig.',
    );
  });

  // -------------------------------------------------------------------------
  // Test 4 — TOKEN_DECIMALS === 6 (USDC-match; Phase 4 inherits)
  // -------------------------------------------------------------------------
  it('TOKEN_DECIMALS is 6 (USDC-match)', () => {
    expect(TOKEN_DECIMALS).toBe(6);
  });

  // -------------------------------------------------------------------------
  // Test 5 — TOKEN_EXTENSIONS ordering matters: MetadataPointer then PermanentDelegate
  // Pattern 3 from ARCHITECTURE.md dictates init order before initializeMint.
  // -------------------------------------------------------------------------
  it('TOKEN_EXTENSIONS is [MetadataPointer, PermanentDelegate] in that order', () => {
    expect(TOKEN_EXTENSIONS).toEqual([
      ExtensionType.MetadataPointer,
      ExtensionType.PermanentDelegate,
    ]);
    expect(TOKEN_EXTENSIONS.length).toBe(2);
  });

  // -------------------------------------------------------------------------
  // Test 6 — INITIAL_SUPPLY_RAW === 500M * 10^6
  // -------------------------------------------------------------------------
  it('INITIAL_SUPPLY_RAW is 500_000_000n * 10n ** 6n', () => {
    expect(INITIAL_SUPPLY_RAW).toBe(500_000_000n * 10n ** 6n);
    expect(INITIAL_SUPPLY_RAW).toBe(500_000_000_000_000n);
  });

  // -------------------------------------------------------------------------
  // Test 7 — REHEARSAL_1_METADATA.symbol === 'REH1' (distinct from launch)
  // -------------------------------------------------------------------------
  it('REHEARSAL_1_METADATA uses throwaway symbol REH1 distinct from launch CAYC', () => {
    expect(REHEARSAL_1_METADATA.symbol).toBe('REH1');
    expect(REHEARSAL_1_METADATA.symbol).not.toBe(TOKEN_SYMBOL);
    expect(REHEARSAL_1_METADATA.name).toBe('Rehearsal 1 — Throwaway');
    expect(REHEARSAL_1_METADATA.external_url).toBe('https://cayc.io');
  });

  // -------------------------------------------------------------------------
  // Test 8 — REHEARSAL_2_METADATA reuses locked launch values byte-for-byte
  // -------------------------------------------------------------------------
  it('REHEARSAL_2_METADATA inherits locked launch name/symbol/description byte-for-byte', () => {
    expect(REHEARSAL_2_METADATA.name).toBe(TOKEN_NAME);
    expect(REHEARSAL_2_METADATA.symbol).toBe(TOKEN_SYMBOL);
    expect(REHEARSAL_2_METADATA.description).toBe(TOKEN_DESCRIPTION);
    expect(REHEARSAL_2_METADATA.external_url).toBe(TOKEN_WEBSITE_URL);
    expect(TOKEN_WEBSITE_URL).toBe('https://cayc.io');
  });

  // -------------------------------------------------------------------------
  // Test 9 — no banned style-guide terms in any description
  // -------------------------------------------------------------------------
  it('no banned style-guide terms in any description (stablecoin|backed by|redeemable|pegged|1:1)', () => {
    const banned = /stablecoin|backed by|redeemable|pegged|1:1/;
    expect(TOKEN_DESCRIPTION.toLowerCase()).not.toMatch(banned);
    expect(REHEARSAL_1_METADATA.description.toLowerCase()).not.toMatch(banned);
    // REHEARSAL_2_METADATA has no `description` property in the const shape
    // (it reuses TOKEN_DESCRIPTION via reference); verify that through TOKEN_DESCRIPTION.
    expect(REHEARSAL_2_METADATA.description.toLowerCase()).not.toMatch(banned);
  });
});
