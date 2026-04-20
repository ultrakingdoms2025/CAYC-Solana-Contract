/**
 * src/config/token-config — single source of truth for expected mint config.
 *
 * Phase 3 rehearsal scripts AND Phase 3 verify-mint AND Phase 4 mainnet ceremony
 * ALL import from this file. Any change here must be intentional because it
 * changes what "correct" means for every downstream check.
 *
 * Style-guide conformance: TOKEN_DESCRIPTION and REHEARSAL_*_METADATA.description
 * avoid every banned term from docs/style-guide.md §2. The launch description
 * names the governance model ("Squads 3-of-5 multisig") so CEX reviewers and
 * Solscan readers can see the model without leaving the mint page.
 */
import { ExtensionType } from '@solana/spl-token';

/** Locked launch name — the "8G" suffix is a brand disambiguator against the
 * pump.fun CAYC squatter (see docs/symbol-availability-check.md). Preserve
 * verbatim in on-chain metadata, off-chain JSON, and every listing application. */
export const TOKEN_NAME = 'Cyber Ape Yacht Club 8G' as const;

/** Locked launch symbol — 4 chars, ticker registrations treat this as a unit. */
export const TOKEN_SYMBOL = 'CAYC' as const;

/** Locked launch description — style-guide safe; names the governance model. */
export const TOKEN_DESCRIPTION =
  'Payment token for Cyber Ape Yacht Club. Squads 3-of-5 multisig.' as const;

/** USDC-match decimal scale; Phase 4 inherits this. Changing this post-launch
 * would break every downstream balance calculation. */
export const TOKEN_DECIMALS = 6 as const;

/** Canonical website URL used in off-chain metadata external_url. */
export const TOKEN_WEBSITE_URL = 'https://cayc.io' as const;

/** Extensions initialized at mint creation. IRREVERSIBLE after initializeMint.
 * Order matters — MetadataPointer must be initialized before PermanentDelegate,
 * and both BEFORE initializeMint (Pattern 3 from ARCHITECTURE.md). TokenMetadata
 * is initialized AFTER initializeMint via @solana/spl-token-metadata and is
 * NOT represented here as a raw ExtensionType. */
export const TOKEN_EXTENSIONS = [
  ExtensionType.MetadataPointer,
  ExtensionType.PermanentDelegate,
] as const;

/** Rehearsal-1 throwaway metadata — distinct symbol (REH1) so a leaked
 * rehearsal-1 mint address cannot be confused with the real launch mint.
 * Description self-identifies as "DO NOT USE" to protect against premature
 * wallet imports during the rehearsal window. */
export const REHEARSAL_1_METADATA = {
  name: 'Rehearsal 1 — Throwaway',
  symbol: 'REH1',
  description:
    'Phase 3 Rehearsal 1 — extension mechanics validation — DO NOT USE',
  external_url: TOKEN_WEBSITE_URL,
} as const;

/** Rehearsal-2 locked launch metadata — Phase 4 mainnet inherits this shape
 * verbatim. Only the off-chain `image` (Arweave TX ID) changes between
 * rehearsal-2 and mainnet; all strings here are fixed. */
export const REHEARSAL_2_METADATA = {
  name: TOKEN_NAME,
  symbol: TOKEN_SYMBOL,
  description: TOKEN_DESCRIPTION,
  external_url: TOKEN_WEBSITE_URL,
} as const;

/** Initial total supply in raw units (= 500M tokens at 6 decimals).
 * Minted via a Squads proposal SEPARATE from the mint-creation proposal
 * (ROADMAP.md Success Criterion 3 — two-proposal split). */
export const INITIAL_SUPPLY_RAW = 500_000_000n * 10n ** BigInt(TOKEN_DECIMALS);
