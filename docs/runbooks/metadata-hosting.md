# Metadata Hosting Runbook

**Scope:** Upload and lifecycle management of the off-chain metadata JSON + logo derivatives that back the Token-2022 TokenMetadata `uri` field for both devnet rehearsals (Phase 3) and the mainnet launch (Phase 4).

**Canonical script:** `scripts/assets/upload-metadata.ts` (invoked via `pnpm assets:upload-metadata`).

---

## 1. When to use

Run this runbook in the following situations:

| Situation                                                                                                  | Command                                                     |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Phase 3 Plan 03-03 — upload Rehearsal 1 assets before devnet Rehearsal 1 ceremony                          | `pnpm assets:upload-metadata --rehearsal 1`                 |
| Phase 3 Plan 03-03 — upload Rehearsal 2 assets before devnet Rehearsal 2 ceremony                          | `pnpm assets:upload-metadata --rehearsal 2`                 |
| Phase 4 — upload mainnet launch metadata pre-ceremony (run ~24h before, so Arweave propagation is settled) | _(see Phase 4 differences, §6 below)_                       |
| Asset re-upload after logo redesign                                                                        | `pnpm assets:upload-metadata --rehearsal <N> --force`       |
| Cost-constrained devnet rehearsal only                                                                     | `pnpm assets:upload-metadata --rehearsal <N> --github-only` |

The **on-chain `uri` field is immutable in practice** — updating it after mint creation costs a full Squads multisig proposal (propose → 3 approvals → execute). Therefore the uploaded Arweave URL for Rehearsal 2 (and Phase 4) MUST be the final, production URL. No placeholders.

---

## 2. Prerequisites

### Devnet (Phase 3)

- `keys/devnet/proposer.json` exists with ≥ 0.02 SOL balance.
  - Check: `solana balance --keypair keys/devnet/proposer.json --url devnet`
  - If low: airdrop 1 SOL from the public devnet faucet, or transfer from `keys/devnet/id-devnet.json` (per Plan 02-02 pattern).
- `.env.devnet` exists (copy from `.env.devnet.example` if not; the script only needs `HELIUS_DEVNET_RPC_URL` or the fallback, but `loadEnv('devnet')` enforces the file exists).
- Assets produced by Plan 03-01 exist on disk:
  - `assets/logo-512.png` (< 100 KB)
  - `assets/logo-1024.png` (< 100 KB)
  - `assets/metadata/rehearsal-1.json`
  - `assets/metadata/rehearsal-2.json`
- `@ardrive/turbo-sdk` installed (added in Plan 03-03 Task 1).

### Mainnet (Phase 4)

- `keys/mainnet/proposer.json` exists with ≥ 0.05 SOL balance (extra margin; mainnet SOL is not free).
- `.env.mainnet` populated with `CONFIRM_MAINNET=yes-mainnet-ceremony`.
- Launch metadata JSON locked and reviewed by all 5 multisig signers (Rehearsal 2 output is the template).
- Final launch logo derivatives reviewed and approved.

---

## 3. Command reference

### Branch A — Arweave primary (default)

Uploads `logo-512.png`, `logo-1024.png`, then rewrites the JSON's `image` field to the Arweave logo-512 URL, then uploads the JSON. Records all six artifacts (three TX IDs + three URLs) plus the GitHub raw mirror URLs for the same three files in `artifacts/metadata-hosting.json`.

```bash
pnpm assets:upload-metadata --rehearsal 1
pnpm assets:upload-metadata --rehearsal 2
```

Each invocation is idempotent — the second run exits early with "rehearsal_N already uploaded" unless `--force` is passed.

### Branch B — GitHub raw only (devnet rehearsal fallback only)

Skips Arweave entirely. Rewrites the JSON's `image` field to point at `https://raw.githubusercontent.com/<owner>/<repo>/main/assets/logo-512.png`. Records only the GitHub raw URLs in the artifact.

```bash
pnpm assets:upload-metadata --rehearsal 1 --github-only
pnpm assets:upload-metadata --rehearsal 2 --github-only
```

**WARNING — Phase 4 mainnet should NOT use `--github-only`.** GitHub repos can be deleted or renamed; Arweave TX IDs are permanent. Branch B is a zero-cost shortcut for devnet only.

### Re-upload with --force

```bash
pnpm assets:upload-metadata --rehearsal 2 --force
```

Use when the logo has been redesigned or the JSON description text has been revised AFTER the initial upload. Note: the old Arweave TX IDs remain live forever (Arweave is append-only); `--force` just writes NEW TX IDs and overwrites the artifact's entry, so downstream scripts reading the artifact see the new URLs.

---

## 4. What the script does (step-by-step)

1. Validates required files exist (logos + JSON).
2. Checks `artifacts/metadata-hosting.json` for an existing entry; short-circuits unless `--force`.
3. Computes the GitHub raw URLs for both logo variants + the JSON by parsing `git remote get-url origin`.
4. **Branch B:** rewrites JSON `image` → GitHub raw logo-512 URL, writes artifact, exits.
5. **Branch A:**
   a. Loads `keys/devnet/proposer.json` (or `keys/mainnet/proposer.json` in Phase 4).
   b. Authenticates `@ardrive/turbo-sdk` with `token: 'solana'` and the base58-encoded keypair.
   c. Queries Turbo Credits balance. If zero, submits a 0.01 SOL top-up transaction to Turbo's deposit address.
   d. Uploads `logo-512.png` with `Content-Type: image/png` + `App-Name: CAYC-Metadata` + `Variant: logo-512` tags.
   e. Uploads `logo-1024.png` with the same tag set but `Variant: logo-1024`.
   f. **Rewrites the JSON's `image` field** to the Arweave logo-512 URL (`https://arweave.net/<tx>`). Writes the updated JSON back to disk.
   g. Uploads the updated JSON with `Content-Type: application/json` + `Variant: metadata-json` tags.
   h. Merges `rehearsal_<N>` entry into `artifacts/metadata-hosting.json`.

---

## 5. How wallets/explorers consume the uri

The on-chain `TokenMetadata.uri` field (stored via `@solana/spl-token-metadata`'s `createInitializeInstruction`) is just a string — typically a URL. When a wallet (Phantom, Solflare, Backpack) or explorer (Solscan, Jupiter Ultra) needs to display a token:

1. It fetches the TokenMetadata account via `getTokenMetadata(connection, mintPubkey)`.
2. It reads the `uri` field.
3. It performs an HTTPS GET on that URI, expecting JSON.
4. It parses the JSON. The keys it honors (per de-facto Solana conventions):
   - `name` — token name (wallet display)
   - `symbol` — token symbol
   - `description` — long-form description (detail pane)
   - `image` — another URL, pointing at the logo PNG
   - `external_url` — project website
   - `attributes` — array (used mostly for NFTs; empty here)
5. It follows the `image` URL and caches the PNG.

Arweave URLs (`https://arweave.net/<tx>`) are served through a gateway fleet that caches globally. Response time is typically 200–800 ms after a ~30–60 s propagation delay post-upload.

GitHub raw URLs (`https://raw.githubusercontent.com/...`) are served through GitHub's CDN. Response time is typically 50–300 ms. Cache-control headers may have shorter TTLs than Arweave; some wallets may re-fetch more aggressively.

---

## 6. Phase 4 mainnet differences

The same script will be used in Phase 4, but with these adjustments:

| Aspect           | Phase 3 (devnet)                                                                     | Phase 4 (mainnet)                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Keypair          | `keys/devnet/proposer.json`                                                          | `keys/mainnet/proposer.json`                                                                                    |
| Env loader       | `loadEnv('devnet')`                                                                  | `loadEnv('mainnet-beta')` (script must be forked or take a `--network` arg; see migration note below)           |
| SOL cost         | ~0.01 SOL (devnet, no economic value)                                                | ~0.01 SOL real mainnet (≈ $1–2 at launch, still negligible for permanent storage)                               |
| Branch A vs B    | Either acceptable                                                                    | **Branch A (Arweave) required** — mainnet on-chain `uri` must not depend on GitHub repo longevity               |
| Metadata content | Rehearsal 2's `assets/metadata/rehearsal-2.json` is already the final locked content | Same file, re-uploaded from mainnet keypair (TX IDs will differ, content byte-identical)                        |
| Re-upload policy | `--force` freely                                                                     | `--force` is a multisig-approval-worthy change — requires updating the on-chain `uri` via a new Squads proposal |

**Migration note:** Plan 03-03's script hardcodes `loadEnv('devnet')`. Phase 4 should add a `--network <devnet|mainnet-beta>` flag that:

- Switches the keypair path (`keys/<network>/proposer.json`).
- Switches `loadEnv(network)`.
- Guards any mainnet invocation behind `CONFIRM_MAINNET=yes-mainnet-ceremony` (the `loadEnv` path already enforces this).

---

## 7. Bundler service longevity

`@ardrive/turbo-sdk` is the modern Bundlr successor for SOL-paid Arweave uploads. If it becomes unavailable or deprecated:

- **Already-uploaded TXs remain accessible forever.** Arweave is permanent by design; TX IDs resolve via any Arweave gateway indefinitely. No action needed for live mints.
- **For future re-uploads:** switch to `@irys/sdk` (~@irys/sdk 0.2.x, older infrastructure but still supports SOL payment). Contract changes: import, constructor shape (URL + token + key instead of factory), and `uploadFile` signature. Update `scripts/assets/upload-metadata.ts` and document the switch inline in this runbook's version history.
- **Nuclear fallback:** self-host an Arweave node and upload directly via `arweave-js`. Only necessary if all hosted bundlers vanish simultaneously (not expected).

---

## 8. Verification after upload

After `pnpm assets:upload-metadata --rehearsal N` completes:

```bash
# Check artifact is well-formed
jq . artifacts/metadata-hosting.json

# Check the placeholder was replaced
grep PLACEHOLDER assets/metadata/rehearsal-1.json   # expected: no output
grep PLACEHOLDER assets/metadata/rehearsal-2.json   # expected: no output

# Fetch the uploaded JSON (Arweave propagation: wait ~1min if initial 404)
curl -fsS $(jq -r .rehearsal_2.json_arweave_url artifacts/metadata-hosting.json)

# Fetch the logo (expect image/png content-type)
curl -sI $(jq -r .rehearsal_2.logo_512_arweave_url artifacts/metadata-hosting.json) | grep -i content-type
```

Plan 03-05 (Rehearsal 2 verification) includes a full wallet-rendering check against Phantom, Solflare, Backpack, Jupiter Ultra, and Solscan devnet.

---

## 9. Artifact schema

`artifacts/metadata-hosting.json` has this shape:

```json
{
  "generated_at": "<iso 8601>",
  "schema_version": 1,
  "rehearsal_1": {
    "mode": "arweave-primary" | "github-only",
    "logo_512_arweave_tx": "<tx-id>" | null,
    "logo_512_arweave_url": "https://arweave.net/<tx>" | null,
    "logo_1024_arweave_tx": "<tx-id>" | null,
    "logo_1024_arweave_url": "https://arweave.net/<tx>" | null,
    "json_arweave_tx": "<tx-id>" | null,
    "json_arweave_url": "https://arweave.net/<tx>" | null,
    "github_raw_url": "https://raw.githubusercontent.com/.../rehearsal-1.json",
    "github_logo_512_url": "https://raw.githubusercontent.com/.../logo-512.png",
    "github_logo_1024_url": "https://raw.githubusercontent.com/.../logo-1024.png",
    "uploaded_via": "@ardrive/turbo-sdk" | "github-raw-only",
    "uploaded_at": "<iso 8601>",
    "uploader_pubkey": "<base58 pubkey>",
    "file_sizes": {
      "logo_512_bytes": <int>,
      "logo_1024_bytes": <int>,
      "json_bytes": <int>
    }
  },
  "rehearsal_2": { /* same shape */ }
}
```

Phase 4 will append a `launch` sibling key with the same shape, pointing at the mainnet-uploaded Arweave TXs.

---

## 10. Version history

- **v1.0 — 2026-04-20** — Initial runbook (Plan 03-03 Task 1). Documents Turbo SDK (primary) + GitHub raw (mirror/fallback). No Arweave uploads executed yet — Task 2 checkpoint pauses for funding approval.
