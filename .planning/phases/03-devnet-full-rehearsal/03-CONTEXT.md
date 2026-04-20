# Phase 3: Devnet Full Rehearsal - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute the exact mainnet ceremony end-to-end on devnet **twice**:
1. **Rehearsal 1** — throwaway metadata, validates the ceremony mechanics (extension ordering, vault-PDA-as-authority wiring, two-proposal supply-minting split)
2. **Rehearsal 2** — real launch metadata, validates that the final on-chain strings render correctly across Phantom, Solflare, Backpack, Jupiter, and Solscan devnet views

Additionally, exercise every ongoing token operation (additional mint, burn, SPL transfer, authority rotation) via the **devnet** Squads multisig, proving those runbooks work end-to-end.

Scope-deferred to other phases:
- Mainnet mint creation (Phase 4 TOK-01..06)
- Mainnet supply minting (Phase 4 TOK-06)
- DEX liquidity pool (Phase 5 LIQ-*)
- Listing submissions (Phase 5 VER-01, VER-02; Phase 6 VER-03, VER-04)
</domain>

<decisions>
## Implementation Decisions

### Launch Metadata Content (for Rehearsal 2 and eventually Phase 4 mainnet)

| Field | Value |
|-------|-------|
| `name` | `Cyber Ape Yacht Club 8G` |
| `symbol` | `CAYC` |
| `description` | `Payment token for Cyber Ape Yacht Club. Squads 3-of-5 multisig.` |
| `uri` | Points to the off-chain metadata JSON (see Metadata Hosting below) |
| `additional_metadata` | (none — keep on-chain minimal per user decision) |

Rationale:
- Name uses the `8G` suffix for brand differentiation vs the pump.fun CAYC squatter (see `docs/symbol-availability-check.md`)
- Symbol remains `CAYC` per the accept-conflict decision from Phase 1
- Description is style-guide-safe (no "stablecoin"), short enough to display uncut on all target wallets, and names the governance model for reader trust
- `additional_metadata` is deliberately empty — updates cost a multisig proposal; keep the mutable surface small

### Metadata Hosting (Claude's Discretion — default)

Two-tier approach for durability + speed:
- **Primary URI:** Arweave (permanent, pay-once storage). The on-chain `uri` field points here.
- **Secondary mirror:** GitHub raw (`https://raw.githubusercontent.com/<user>/<repo>/main/assets/metadata.json`) for fast CDN-backed reads and zero-cost mirroring.
- **Logo file:** Also uploaded to both (the JSON references the Arweave logo as primary, GitHub raw as fallback).

Plans may revisit this if Arweave upload proves difficult — acceptable fallbacks: IPFS via Pinata (paid pinning), or user's own website with cache-control headers.

### Concrete Assets Available On-Disk

These are confirmed present at the time of context capture:

- **Logo file:** `assets/logo.png` — 5863×4529 PNG, RGBA, 394 KB. **WILL be resized** during planning/execution to 512×512 (primary display) + 1024×1024 (high-res), both losslessly-compressed via `pnpm dlx oxipng` or equivalent. The 5863×4529 original should be retained as `assets/logo-source.png` (source-of-truth); the 512 + 1024 derivatives are what get uploaded to Arweave / referenced in metadata JSON. Wallets typically cap at ~200 KB per logo; the compressed 512×512 should fit comfortably under this.
- **Website URL:** `https://cayc.io` — resolves (Cloudflare 308 → `https://www.cayc.io/` on Vercel, HTTP 200). Use the short form `https://cayc.io` in off-chain metadata JSON; the 308 redirect is permanent and CDN-handled so wallet clients will follow it correctly.

### Off-chain Metadata JSON (shape planners should target)

The on-chain `uri` field points here. Target shape per Token-2022 conventions + SPL metadata standard:

```json
{
  "name": "Cyber Ape Yacht Club 8G",
  "symbol": "CAYC",
  "description": "Payment token for Cyber Ape Yacht Club. Squads 3-of-5 multisig.",
  "image": "https://arweave.net/<TX_ID>",
  "external_url": "https://cayc.io",
  "attributes": []
}
```

`image` points to the 512×512 PNG on Arweave; GitHub raw URL may appear as a comment / fallback depending on how the JSON-hosting plan shakes out.

### Rehearsal Strategy (Claude's Discretion — default)

- **Two fresh devnet mints** — do NOT reuse the Plan 02-03 smoke-test mint (that's a separate proof artifact and should remain intact)
- **Rehearsal 1** uses throwaway metadata: name="Rehearsal 1 — Throwaway", symbol="REH1", description="Phase 3 Rehearsal 1 — extension mechanics validation — DO NOT USE"
- **Rehearsal 2** uses the real launch metadata locked above — this is the one where wallet rendering verification happens
- **Wallet/explorer verification matrix for Rehearsal 2:** Phantom, Solflare, Backpack, Jupiter Ultra, Solscan — as listed in ROADMAP.md Success Criterion 2. Screenshots of each view saved under `artifacts/devnet-sessions/rehearsal-2-wallet-renders/`.

### Authority Rotation Drill Scope (Claude's Discretion — default)

- **What rotates:** mint authority, freeze authority, metadata update authority (all three at once — matches the Phase 4 ceremony pattern)
- **Rotates to:** a second devnet Squads vault PDA (NOT an EOA — testing EOA-as-authority would introduce the exact Pitfall 4 anti-pattern we spent Phase 2 preventing)
- **Then back:** rotated back to the original devnet vault PDA to prove the reversibility
- **Permanent Delegate:** NOT rotated in this drill — Permanent Delegate is immutable once set per Token-2022 semantics, so there's no rotation to rehearse
- **Transcript:** `artifacts/devnet-sessions/authority-rotation-drill.md` with before/after on-chain state for all three authorities

### Two-proposal supply split (locked by ROADMAP Success Criterion 3)

The 500M devnet supply MUST be minted in a Squads proposal **separate** from the mint-creation proposal. This is not a style choice — it's the exact pattern Phase 4 will follow on mainnet, and it provides an independent verification checkpoint between "mint exists with correct config" and "treasury holds the initial supply."

### Verify-mint script (Claude's Discretion)

`scripts/deploy/verify-mint.ts` reads `src/config/token-config.ts` (a new single-source-of-truth file with the expected extensions, decimals, authorities) and asserts on-chain state matches byte-for-byte. Should exit non-zero on any mismatch. Re-usable for Phase 4 mainnet verification.

### Claude's Discretion (remaining)

- Exact transaction retry / confirmation-timeout parameters (reuse patterns from `src/squads/proposals.ts`)
- Whether to commit Arweave upload scripts to the repo or run them ad-hoc (prefer committed scripts for reproducibility)
- Exactly how many commits per rehearsal (default: one commit for Rehearsal 1 artifacts, one commit for Rehearsal 2 artifacts, one commit for the rotation drill, one commit for verify-mint tooling)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Token-2022 extension ordering and mechanics
- `.planning/research/ARCHITECTURE.md` §"Pattern 3 (Mint Init Ordering)" — the exact order MetadataPointer + PermanentDelegate must be initialized before `initializeMint`; TokenMetadata after
- `.planning/research/ARCHITECTURE.md` §"Flow B (Devnet Ceremony)" — step-by-step devnet ceremony flow
- `.planning/research/ARCHITECTURE.md` §"Anti-Pattern 4 (don't combine ceremonies)" — why mint-creation and supply-mint must be separate proposals

### Pitfalls this phase must avoid
- `.planning/research/PITFALLS.md` Pitfall 1 — wrong extensions (irreversible after mint init)
- `.planning/research/PITFALLS.md` Pitfall 6 — extension combination bugs
- `.planning/research/PITFALLS.md` Pitfall 7 — wrong Token-2022 program ID
- `.planning/research/PITFALLS.md` Pitfall 11 — vault PDA vs multisig config account

### Metadata rendering across wallets
- `.planning/research/FEATURES.md` §"Feature Dependencies graph" — the listing cascade, specifically the "metadata renders consistently" precondition

### Project-level locks
- `.planning/PROJECT.md` §"Constraints" — Extensions (permanent): Metadata + Permanent Delegate only; 6 decimals; Token-2022; authorities via Squads vault PDA
- `.planning/PROJECT.md` §"Key Decisions" — full tradeoff rationale for each locked choice

### Phase 1 inheritance
- `docs/policies/mint-policy.md` — bounds on mint authority use (48h pre-announcement etc.) — the rehearsal drill should respect this even on devnet as a practice run
- `docs/policies/clawback-freeze-policy.md` — bounds on Permanent Delegate and Freeze use
- `docs/style-guide.md` — language audit rules; the launch metadata strings must pass `pnpm lang:audit`
- `docs/symbol-availability-check.md` §"Decision trail" — accept-conflict rationale that chose CAYC-with-disambiguation

### Phase 2 inheritance
- `scripts/squads/create-mainnet.ts` — the mainnet ceremony script pattern; Phase 3's mint-creation script follows this shape (adapted for mint-init instead of multisig-create)
- `scripts/squads/smoke-test-mint.ts` — Plan 02-03's devnet mint that proved the vault-PDA-as-authority pattern; **reference pattern for Rehearsal 1's mechanics**
- `src/squads/proposals.ts` — proposal lifecycle helpers (includes the RPC-confirmation retry/backoff from Plan 02-03)
- `src/squads/verify.ts` — `verifyVaultAuthority`, the Pitfall 11 guard
- `docs/runbooks/authority-rotation.md` — runbook from Plan 02-03's multisig-member rotation drill; Phase 3's mint-authority rotation drill should mirror this structure
- `artifacts/devnet.json` §`squads` — devnet multisig `6Pu2a…EVu`, vault PDA `5tTob…KtHu` — this is the authority that Rehearsal 1 + Rehearsal 2 mints use

### Mainnet reference (for Phase 4 parity check, NOT used in Phase 3 directly)
- `artifacts/mainnet.json` §`squads` — mainnet multisig `46rXDg…inWR`, vault `CFYA2…D2BJR` — Phase 4 will use this; Phase 3 is the dress rehearsal

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1 and Phase 2)

- `src/squads/` barrel — full helper suite including `deriveVaultPda`, `verifyVaultAuthority`, `VaultMismatchError`, `buildConnection`, `loadMultisig`, proposal lifecycle helpers
- `src/squads/proposals.ts` — `proposeVaultTransaction`, `approveProposal`, `executeVaultTransaction`, `proposeConfigTransaction`, `nextTransactionIndex`, `buildVaultTransactionMessage` — used to build Squads-signed mint init / supply-mint / burn / transfer / authority-rotation proposals
- `src/env/load.ts` — `loadEnv(network)` + `expandHome(path)` — handles `.env.devnet` / `.env.mainnet` with `~` path expansion
- `scripts/squads/smoke-test-mint.ts` — working pattern for "devnet Token-2022 mint with vault PDA as authority from init"; Rehearsal 1 can adapt this
- `scripts/squads/create-mainnet.ts` — working pattern for ceremony scripts with preflight gate + typed-phrase confirmation; Rehearsal 2's approach can mirror this for consistency with Phase 4
- `scripts/squads/verify-vault.ts` — pattern for on-chain state readback; `verify-mint.ts` can follow the same shape
- `scripts/squads/publish-artifacts.ts` — idempotent artifact validator with schema + math checks
- `@solana/spl-token@^0.4.14` — includes `createMintToInstruction`, `createBurnInstruction`, `createInitializeMetadataPointerInstruction`, `createInitializeMintInstruction`, Token-2022 extension helpers
- `@solana/spl-token-metadata@^0.1.6` — `createInitializeInstruction` for TokenMetadata, `createUpdateFieldInstruction`

### Established Patterns

- TypeScript + pnpm + ESM (NodeNext) — no changes needed
- `solana-bankrun` + `vitest` for unit tests (11 unit tests currently passing)
- Devnet-first workflow: throwaway keys in `keys/devnet/`, real network via Helius devnet RPC
- Artifact JSON files under `artifacts/` as append-only source of truth
- Ceremony transcripts under `artifacts/devnet-sessions/` or `artifacts/mainnet-sessions/` per network
- `docs/runbooks/` for human-facing procedures
- `pnpm typecheck` + `pnpm format:check` + `pnpm gitleaks` + `pnpm lang:audit` + `pnpm test` gates for every commit

### Integration Points

- **NEW `src/config/token-config.ts`** — single source of truth for expected mint config (name, symbol, description, decimals, extensions, authority patterns). Read by both the rehearsal scripts AND `verify-mint.ts`. Prevents drift between "what we tried to set" and "what we verify on-chain."
- **NEW `scripts/deploy/mint-rehearsal.ts`** (or two scripts — one per rehearsal) — Token-2022 mint creation with MetadataPointer + PermanentDelegate + initializeMint + TokenMetadata init, all proposed via Squads multisig from the very first instruction
- **NEW `scripts/deploy/mint-supply.ts`** — separate Squads proposal to mint 500M to treasury ATA (Success Criterion 3)
- **NEW `scripts/deploy/verify-mint.ts`** — reads `src/config/token-config.ts` + on-chain state, asserts byte-level match
- **NEW `scripts/deploy/rotate-authority.ts`** — exercises mint/freeze/metadata-update authority rotation to a second devnet vault and back
- **NEW metadata JSON + logo** — hosted on Arweave + mirrored on GitHub raw; committed to repo under `assets/metadata.json` + `assets/logo.png`
- **ARTIFACT EXTENSIONS** — `artifacts/devnet.json` gains `rehearsal_1` and `rehearsal_2` sub-objects (same shape as `squads` and `devnet_smoke_test`); plus `authority_rotation_drill`

### Specific deviations to plan around (inherited)

- Gitleaks PATH prepend required on every commit — Phase 1/2 pattern
- Solana CLI PATH prepend required for every shell that invokes `solana-keygen` / `solana` — add session-top `export PATH="/c/solana/solana-release/bin:$PATH"`
- Devnet faucet is flaky/exhausted — may require transferring SOL from the existing funded devnet wallets (Plan 02-02/02-03 pattern). Proposer wallet and signer wallets still have residual SOL from Phase 2 runs; check balances first before any airdrop attempts.

</code_context>

<specifics>
## Specific Ideas

- The **8G suffix** in the token name is a deliberate brand differentiator against the pump.fun CAYC squatter. This was first mentioned in the user's original project pitch ("Cyber Ape Yacht Club 8G") and re-confirmed here. Preserve the "8G" literal everywhere: on-chain metadata, off-chain JSON, listing applications.
- The description specifically names "Squads 3-of-5 multisig" to build reader trust on first glance — CEX reviewers and Solscan readers can see the governance model without clicking through to policies. Keep this wording when updating in Phase 4 or later.
- The two-rehearsal structure exists to catch bugs in the ACTUAL strings (Rehearsal 2) that Rehearsal 1's throwaway metadata would mask. Treat Rehearsal 2's wallet-rendering verification as a hard gate — if Phantom or Solscan shows truncation, wrong encoding, missing logo, etc., that is a Phase 3 blocker, not a post-launch concern.
- "Additional metadata" being empty is a deliberate minimization of the mutable on-chain surface. Any future changes (e.g., adding a `policy_url` key) would cost a multisig proposal. Keep it that way.

</specifics>

<deferred>
## Deferred Ideas

- **Arweave ↔ IPFS redundancy beyond the two-tier primary+GitHub mirror** — can be added later if a storage provider fails; not needed for v1
- **Multi-language metadata** (e.g., `name_fr`, `description_es`) — not needed for v1; `additional_metadata` is empty anyway
- **External URL / website link in on-chain metadata** — deferred (user chose minimal on-chain); website link lives in off-chain JSON file only
- **Cross-chain metadata (Wormhole / Portal)** — v2 milestone per PROJECT.md
- **Interest-bearing or Confidential Transfers extensions** — rejected per PROJECT.md Out of Scope
- **Post-launch metadata update cadence / versioning policy** — operational concern for Phase 5 OPS runbooks, not Phase 3

</deferred>

---

*Phase: 03-devnet-full-rehearsal*
*Context gathered: 2026-04-20*
