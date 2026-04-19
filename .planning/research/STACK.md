# Stack Research — CAYC Token-2022 Stablecoin Launch

**Domain:** Solana Token-2022 stablecoin deployment + Squads v4 multisig governance + cross-platform listing (Jupiter/Solscan/CoinGecko/CMC/DEX/CEX)
**Researched:** 2026-04-19
**Confidence:** HIGH (versions verified via live npm registry + Anza/Solana-Program GitHub releases; process info verified via official docs)

---

## TL;DR — The Prescriptive Stack

For a greenfield Token-2022 stablecoin launch in 2026 with Squads v4 governance, use:

- **CLI path for mint creation** — `solana` CLI (Agave ≥ 3.1.13) + `spl-token` CLI (≥ 3.x). This is the battle-tested, auditable route for a one-time mint ceremony with retained authorities.
- **Scripted/reproducible path** — TypeScript + `@solana/web3.js ^1.98.4` + `@solana/spl-token ^0.4.14` + `@solana/spl-token-metadata ^0.1.6`. Stay on web3.js v1 for this project (see Kit section below).
- **Multisig** — Squads v4 only (via web UI for mainnet creation; `@sqds/multisig ^2.1.4` + Squads CLI for devnet and scripted operations).
- **RPC** — Helius (primary) + public endpoint (fallback) on devnet; Helius or Triton on mainnet for the mint ceremony.
- **Testing** — `solana-bankrun ^0.4.0` + Vitest ^4.1.4 for extension logic + state transition tests; real `solana-test-validator` or devnet for end-to-end mint ceremony rehearsals.
- **Package manager** — pnpm ^10.33.0.
- **Node** — 20 LTS (22 LTS acceptable; avoid 21/23 odd-numbered).
- **TypeScript** — 5.6.x (pin; do NOT adopt TS 6.x yet in the Solana ecosystem — most Solana type defs still target 5.x).

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Solana CLI (Agave)** | 3.1.13 (stable) | Root CLI — `solana`, `solana-keygen`, `solana-test-validator` | Agave is the reference validator after the Solana Labs → Anza handover; stable channel is what mainnet runs. Required for keygen, airdrops, test validator, and final transaction submission. |
| **spl-token CLI** | 5.x (ships with spl-token-cli crate; the CLI binary is versioned separately from the JS SDK) | Token-2022 mint creation, metadata initialization, mint/burn/freeze operations | Handles Token-2022 natively via `--program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`. Supports `--enable-metadata` and `--enable-permanent-delegate` flags at mint creation — exactly what this project needs. |
| **Token-2022 Program** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (on-chain) | The mint program | Locked by PROJECT.md. Supports the Metadata + Permanent Delegate extensions we need. |
| **Squads v4 Program** | `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` (on-chain) | Multisig governance program | The dominant Solana multisig; secures >$10B; v4 adds time locks, spending limits, sub-accounts, lookup tables. PROJECT.md explicitly requires Squads. |
| **@sqds/multisig** | ^2.1.4 | TypeScript SDK for Squads v4 | Only supported programmatic path for Squads v4. Used to create devnet multisigs (web UI disallows devnet creation), build proposal transactions, and script signer rotation. |
| **@solana/web3.js** | ^1.98.4 | Solana JS SDK — Connection, Keypair, Transaction, Instruction | Stay on v1 for this project. `@solana/spl-token` 0.4.x and `@sqds/multisig` 2.1.x both target web3.js v1. Switching to Kit (v2) would force reimplementing both SDKs against `@solana-program/token-2022` and the Kit-compat layer — unnecessary risk for a one-shot launch. |
| **@solana/spl-token** | ^0.4.14 | JS bindings for Token + Token-2022, including extension-aware helpers (`createMint`, `createInitializeMetadataPointerInstruction`, `createInitializePermanentDelegateInstruction`, etc.) | The canonical JS SDK for Token-2022 extension mints. 0.4.x supports all current extensions. Pair with `@solana/spl-token-metadata` for the embedded metadata writes. |
| **@solana/spl-token-metadata** | ^0.1.6 | Instruction builders for TokenMetadata extension (Initialize, Update, Remove) | The Metadata extension stores data *on the mint itself* (no separate Metaplex account). This package is required for `createInitializeInstruction` (set name/symbol/URI) and `createUpdateFieldInstruction` (updates via multisig). |
| **Node.js** | 20 LTS (20.18+) | Runtime for deployment scripts | LTS; stable for @solana/* ecosystem. Avoid odd-numbered releases. Node 22 LTS is acceptable. |
| **TypeScript** | 5.6.x (pinned) | Language for deployment + test scripts | Pin 5.6.x — `@solana/web3.js` 1.x types and `@sqds/multisig` 2.x types were authored against TS 5.x. TS 6.0 is out but the Solana ecosystem has not caught up; adopting it risks `skipLibCheck` noise. |
| **pnpm** | ^10.33.0 | Package manager | Fast, strict, disk-efficient; handles peer deps better than npm for Solana packages which frequently conflict on `@solana/web3.js` versions. Preferred in modern Solana dev (Helius docs, Anchor docs both use pnpm). |
| **Squads v4 Web UI (mainnet)** | https://v4.squads.so | Create mainnet multisig + sign proposals | The production ceremony tool. Mainnet multisig creation is done here, not CLI. Devnet has a different URL (https://devnet.squads.so) where you can *view but not create* — devnet multisigs must be made via SDK/CLI and imported. |
| **Phantom + Ledger (per signer)** | Current | Signer wallets | Phantom is the standard Solana browser wallet; all signers should pair it with a Ledger (for mainnet signers) via Phantom's Ledger integration. Solflare is acceptable but Phantom has better Squads v4 UI compatibility. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **helius-sdk** | ^2.2.2 | Typed Helius RPC + enhanced APIs (DAS, priority fee estimator) | Use for priority fee estimation during the mint ceremony. Essential on mainnet — mint creation + multisig proposal execution at congested times fails without dynamic priority fees. |
| **@triton-one/yellowstone-grpc** | ^5.0.8 | Triton gRPC streaming client | Only needed if you want sub-second confirmation monitoring during the ceremony. Optional for v1. |
| **solana-bankrun** | ^0.4.0 | In-process Solana runtime for tests (10-100× faster than test-validator) | Use for fast iteration on mint-construction + extension-initialization code. Not a substitute for devnet rehearsal. |
| **vitest** | ^4.1.4 | Test runner | Pairs well with bankrun (`jest` works too but vitest has better TS + ESM story in 2026). Use for the extension-logic and proposal-building tests. |
| **tsx** | ^4.21.0 | Direct TypeScript execution (`tsx scripts/deploy.ts`) | Use for all deployment scripts — no build step needed. Replaces `ts-node`. |
| **dotenv** | ^17.4.2 | Load RPC URLs / keypair paths from `.env` | Standard. Keep keypair *paths* in env, never raw keys. |
| **zod** | ^4.3.6 | Runtime validation of env vars + metadata JSON before upload | Critical — catching a typo in `decimals: 6` before submitting an on-chain tx is worth hours. |
| **commander** | ^14.0.3 | CLI arg parsing for deployment scripts | Build your own `pnpm cayc deploy --network devnet` wrapper. |
| **pino** | ^10.3.1 | Structured logging for ceremony audit trail | Mainnet ceremony must be auditable. Log every signature, tx signature, authority hash to JSON lines for the CEX listing package. |
| **bs58** | ^6.0.0 | Base58 encode/decode for keys + sigs | Standard dep. |
| **@metaplex-foundation/mpl-token-metadata** | ^3.4.0 | Legacy Metaplex metadata (NOT for this project's mint) | DO NOT use for the mint itself — Token-2022 Metadata extension supersedes it. Only relevant if you later need a parallel Metaplex metadata account for legacy-wallet compatibility (most wallets now read the extension directly). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **VS Code** | Primary IDE | Install extensions: `rust-analyzer` (only needed if exploring Token-2022 source), `Solana` (by Solana Foundation — syntax/snippet pack), `Prettier`, `ESLint`, `GitLens`. |
| **solana-test-validator** | Local validator (ships with Agave CLI) | Use for local-first dev before devnet. Supports Token-2022 natively. |
| **Squads CLI** | Devnet multisig creation + proposal CLI | Available via `@sqds/multisig` or the standalone Squads CLI. Required for devnet because the Squads web UI disables multisig creation on devnet. |
| **Solana Explorer** | Mainnet/devnet transaction inspection | https://explorer.solana.com/?cluster=devnet — primary debugging tool for devnet rehearsals. |
| **Solscan** | Token-centric explorer + listing submission portal | https://solscan.io/token-update for the Solscan token metadata submission after mint goes live. |
| **GitHub Actions** | CI for lint + bankrun tests on PR | Do NOT run devnet/mainnet tx from CI. Devnet rehearsal and mainnet ceremony are human-in-the-loop. |

---

## Installation

### System-level (one-time, all signers + deployer)

```bash
# 1. Agave (Solana CLI) — installs solana, solana-keygen, spl-token, solana-test-validator
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Verify
solana --version        # expect: solana-cli 3.1.13 (agave) or newer stable
spl-token --version     # expect: spl-token-cli 5.x
solana-test-validator --version

# 2. Node 20 LTS (use nvm, fnm, or volta)
# Windows: winget install OpenJS.NodeJS.LTS
# macOS/Linux: nvm install 20 && nvm use 20

# 3. pnpm
npm install -g pnpm@10

# 4. Squads CLI (devnet multisig creation)
cargo install squads-cli --git https://github.com/Squads-Protocol/v4
# Alternative: use the @sqds/multisig SDK programmatically (preferred for this project)
```

### Project-level (`package.json`)

```bash
# Core runtime
pnpm add \
  @solana/web3.js@^1.98.4 \
  @solana/spl-token@^0.4.14 \
  @solana/spl-token-metadata@^0.1.6 \
  @sqds/multisig@^2.1.4 \
  helius-sdk@^2.2.2 \
  bs58@^6.0.0 \
  dotenv@^17.4.2 \
  zod@^4.3.6 \
  commander@^14.0.3 \
  pino@^10.3.1

# Dev
pnpm add -D \
  typescript@~5.6.0 \
  tsx@^4.21.0 \
  vitest@^4.1.4 \
  solana-bankrun@^0.4.0 \
  @types/node@^20 \
  prettier@^3 \
  eslint@^9
```

### `package.json` engines pin

```json
"engines": {
  "node": ">=20.18.0 <23",
  "pnpm": ">=10"
}
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@solana/web3.js@1.98.x` | `@solana/kit@6.8.0` (formerly web3.js v2) | Use Kit for greenfield *dApps* needing small bundle / browser perf. Do NOT use it here — `@sqds/multisig@2.1.x` targets web3.js v1, and re-implementing proposal construction against Kit + `@solana-program/token-2022@0.9.0` is unnecessary risk for a one-time launch. Revisit Kit if/when Squads ships a Kit-native SDK. |
| `@solana/spl-token@0.4.14` | `@solana-program/token-2022@0.9.0` + `@solana-program/token@0.13.0` | These are the Kit-native replacements. Use if/when the project migrates to Kit. Not today. |
| Helius RPC | Triton One, QuickNode, Chainstack, public mainnet-beta | Triton for ultra-low-latency trading (not needed here). QuickNode for multi-chain projects. Public RPC is rate-limited and will fail the mainnet ceremony — never use in production. |
| Squads v4 | `@sqds/sdk@2.0.4` (Squads v3) | Do not use v3 for a 2026 launch. v3 is legacy; v4 is the current standard and has all new development. |
| Phantom wallet | Solflare, Backpack, Glow | Solflare has better Ledger UX for some users; Backpack is popular with developers. Any of the three work as Squads v4 signers. Coordinate so all signers use the same wallet to reduce ceremony friction. |
| solana-bankrun | `solana-test-validator` only | Use test-validator when testing behavior that depends on real validator semantics (slot timing, vote accounts, epoch transitions). For mint construction + extension logic, bankrun is 10-100× faster. |
| pnpm | npm, yarn, bun | npm is fine but slower and has weaker peerDep discipline. Bun is fast but has occasional incompatibilities with Solana native modules (bs58, bankrun). Yarn is fine; no strong preference between yarn and pnpm. |
| Raydium CPMM (for DEX seeding) | Orca Whirlpools, Meteora DLMM, Raydium CLMM | **Raydium CPMM** is the recommended default: supports Token-2022, simple to seed, broad routing coverage via Jupiter. **Orca Whirlpools** if you want concentrated liquidity with a more polished UX. **Meteora DLMM** only if you have active LP management capacity — its dynamic fees shine for volatile pairs but require babysitting. |
| Token-2022 Metadata extension | Metaplex mpl-token-metadata@3.4.0 | Token-2022 Metadata extension is the modern choice and is what PROJECT.md specifies. Metaplex metadata is legacy for SPL Token (non-2022) mints. Most 2026 wallets read the Token-2022 Metadata extension directly; you do not need a parallel Metaplex account. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Legacy SPL Token program (`TokenkegQfe...`) | Explicitly rejected in PROJECT.md. No metadata, no permanent delegate natively, and CEX expectations have shifted to Token-2022 for new stablecoin-positioned launches. | Token-2022 (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`). |
| `@solana/spl-token@0.3.x` or older | Older versions lack extension-aware helpers (MetadataPointer, PermanentDelegate initialization instructions). | `@solana/spl-token@^0.4.14`. |
| `@sqds/sdk@2.0.4` (Squads v3) | v3 is legacy. v4 is the current on-chain program and has all new features (time locks, spending limits, lookup tables). | `@sqds/multisig@^2.1.4` (v4). |
| Squads web UI for *creating* a devnet multisig | The mainnet UI at v4.squads.so is for mainnet creation. Devnet UI (devnet.squads.so) intentionally disables creation — you must make devnet multisigs via SDK/CLI, then paste the address into the devnet UI to operate it. | `@sqds/multisig` SDK + a one-shot TS script that creates the devnet multisig with the same threshold + signer set as planned mainnet. |
| Public mainnet-beta RPC (`https://api.mainnet-beta.solana.com`) for the mainnet ceremony | Rate-limited (~40 rps shared), no priority fee estimation API, will silently drop transactions during congestion. Mainnet mint creation at the wrong moment will cost hours of retries. | Helius or Triton paid tier. Pre-purchase capacity. Have a backup endpoint configured in the script. |
| Anchor/custom program for the mint | PROJECT.md: "No custom Anchor program at launch." Adds audit cost + deploy risk for zero v1 benefit — Token-2022 extensions already cover the requirements. | Stock Token-2022 program + Squads v4 for governance. |
| Token-2022 Transfer Fee extension | PROJECT.md rejects it. Fee-on-transfer tokens create CEX listing friction and payments UX issues. | No transfer fee. Revenue models should be external to the mint. |
| Token-2022 Transfer Hook extension | Not in PROJECT.md scope. Transfer hooks make CEX/DEX integration harder (every venue needs to whitelist your hook program). | No transfer hook for v1. |
| Running the mainnet mint ceremony from a laptop without Ledger signers | Single point of failure. A hot-wallet-only multisig defeats the purpose. | All mainnet signers use Ledger + Phantom. At least 3 of 5 (or 2 of 3) threshold. Rehearse fully on devnet first. |
| Storing keypairs in the repo or in `.env` | Leaks → total loss. Even for devnet deployer keys, this creates muscle memory that leads to mainnet mistakes. | `.env` holds a *path* to a keypair on disk (e.g., `DEPLOYER_KEYPAIR_PATH=~/.config/solana/deployer.json`). Mainnet authority keys live in Ledgers only. |
| Bun as the runtime for deployment scripts | Reports of native-module incompatibilities with `solana-bankrun`, `bs58`, and some `@solana/web3.js` code paths (as of early 2026). | Node 20 LTS + tsx. |
| TypeScript 6.0.x | Solana ecosystem typedefs have not caught up; `skipLibCheck` workarounds mask real errors. | TypeScript 5.6.x pinned with `~5.6.0`. |
| Metaplex `mpl-token-metadata` as the *primary* metadata source | Duplicates Token-2022 Metadata extension data and creates update-surface confusion (which is authoritative?). | Token-2022 Metadata extension only. |

---

## Stack Patterns by Variant

**If the mint ceremony is a one-shot manual operation (recommended for CAYC):**
- Use the `spl-token` CLI for the actual mint creation, with the Squads-controlled mint authority keypair produced from the multisig's Vault PDA.
- Wrap every CLI invocation in a TypeScript runner (`tsx scripts/ceremony/<step>.ts`) that: (a) validates inputs with zod, (b) logs the full command + stdout + tx signature to pino JSONL, (c) writes an `artifacts/<network>/<timestamp>/` folder with keypair hashes, authority addresses, tx sigs. This artifact folder becomes the CEX listing evidence pack.
- Why: CLI is auditable (operators can replay commands), TS wrapper is reproducible.

**If the mint creation needs to be fully programmatic (e.g., if legal requires "single atomic transaction creates mint + metadata + permanent delegate + transfer to multisig"):**
- Use `@solana/spl-token` + `@solana/spl-token-metadata` directly in TS and assemble a single transaction:
  1. `SystemProgram.createAccount` for the mint (with space computed via `getMintLen([ExtensionType.MetadataPointer, ExtensionType.PermanentDelegate])`).
  2. `createInitializeMetadataPointerInstruction` (pointer → mint itself).
  3. `createInitializePermanentDelegateInstruction`.
  4. `createInitializeMintInstruction` (decimals=6, mintAuthority=multisig Vault PDA, freezeAuthority=multisig Vault PDA).
  5. `spl-token-metadata` `createInitializeInstruction` for name/symbol/URI.
  6. Follow-up tx: `createMintToInstruction` (500M * 10^6 → treasury ATA owned by Vault PDA).
- Note: Token-2022 has a strict order — extensions must be initialized *after* `createAccount` but *before* `initializeMint`. The `@solana/spl-token` helpers handle this if called in order.
- Why: Atomic; harder to make a partial state.

**If the team needs devnet rehearsal before mainnet (recommended):**
- Devnet multisig creation: `@sqds/multisig` SDK script (Squads v4 web UI rejects devnet creation).
- Use **devnet Helius** endpoint (same SDK, different URL) — devnet public RPC is unreliable for priority fees.
- Run the entire ceremony script against devnet until all artifacts are produced cleanly. Diff the devnet artifact folder against an expected template before promoting to mainnet.

**If a signer is unavailable during the mainnet ceremony:**
- Squads v4 supports asynchronous signing — proposal stays in `Active` state until threshold reached. No need for all signers to be live simultaneously.
- Use the Squads v4 mainnet UI for signing; signers do not need the repo or any scripts.
- The deployer script only needs to *create* the proposal and *execute* it once it reaches `Ready`.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@solana/web3.js@^1.98.4` | `@solana/spl-token@^0.4.14`, `@sqds/multisig@^2.1.4`, `solana-bankrun@^0.4.0` | All current SDKs in this project target web3.js v1. Do not mix Kit (`@solana/kit`) into the same codebase — they have conflicting types for `PublicKey`. |
| `@solana/spl-token@^0.4.14` | `@solana/spl-token-metadata@^0.1.6` | Metadata extension helpers live in the `-metadata` package; they compose with the main package's mint-creation helpers. |
| `@sqds/multisig@^2.1.4` | Squads v4 on-chain program | Do NOT use with Squads v3 (`@sqds/sdk@2.0.4`) — different on-chain program IDs, different account layouts. |
| `solana-bankrun@^0.4.0` | Node 20/22 LTS, `@solana/web3.js@1.x` | Native module — has prebuilt binaries for major platforms. If CI is on an uncommon arch (e.g., Alpine musl), confirm bankrun has a prebuilt or be ready to build from source. |
| Agave CLI 3.1.x | `spl-token-cli` 5.x | Agave 2.x + spl-token-cli 4.x also works, but 2.x is deprecated. Match Agave stable channel. |
| Squads v4 web UI (mainnet) | Any Phantom/Solflare/Backpack + Ledger | The UI is the signing surface; the SDK is the proposal-creation surface. Both target the same on-chain program. |
| Node 20/22 LTS | TypeScript 5.6.x, tsx 4.21.x, pnpm 10.33.x | Node 21/23 (odd-numbered, non-LTS) not recommended. |

---

## Network & RPC Strategy

**Devnet (rehearsal):**
- **Primary:** Helius devnet endpoint (free tier sufficient — ~1M credits/month covers full rehearsal cycles).
- **Fallback:** Public devnet `https://api.devnet.solana.com` for `solana airdrop`.
- **Squads:** Must use `@sqds/multisig` SDK to *create* the devnet multisig, then use https://devnet.squads.so to *operate* it.

**Mainnet (ceremony):**
- **Primary:** Helius Business plan ($499/mo, or upgrade for ceremony month only) — staked validator routing, enhanced priority fee API, DAS for metadata verification.
- **Secondary:** Triton (optional, for redundancy). Configure the deployment script with `PRIMARY_RPC` + `FALLBACK_RPC` env vars and automatic retry on timeout.
- **Never:** `api.mainnet-beta.solana.com` for the ceremony itself (fine for read-only `solana balance` checks).
- **Priority fees:** Always fetch dynamic estimate via Helius `getPriorityFeeEstimate` before ceremony transactions. Set `compute-unit-price` on every tx. A single dropped tx here costs 2+ hours of multisig re-proposal work.

**RPC credential handling:**
- Mainnet RPC API keys in `.env` only, never committed.
- Separate keys per environment (`HELIUS_DEVNET_RPC` / `HELIUS_MAINNET_RPC`) — prevents an accidental devnet-test firing against mainnet.

---

## Verification & Listing Tooling

| Platform | Submission Path | Prerequisites | Confidence |
|----------|----------------|---------------|------------|
| **Jupiter Verified** (VRFD) | https://verified.jup.ag/ — standard (free, queued) or Express (burn 1,000 JUP, 24h SLA) | Active DEX pool with real trading volume; organic trading score; X account with smart followers engagement; attestation tweet. | HIGH — verified 2026-04 on verified.jup.ag and jup.ag docs. |
| **Solscan** | https://solscan.io/token-update (standard) or Priority Support (24h SLA, paid) | Mint address live; metadata accessible (logo URI resolvable); website + social channels published. | HIGH — verified on info.solscan.io. |
| **CoinGecko** | https://support.coingecko.com/ — Listing Request form | Listed on at least one tracked exchange (Raydium counts); working website; whitepaper or detailed docs; public verification post from official account linking back to CG request ID. | HIGH — verified on CoinGecko support center. Free; no paid listing. |
| **CoinMarketCap** | https://support.coinmarketcap.com/ — Request form | Similar to CoinGecko; public trading required; paid expedited review available but no guarantee of approval. | MEDIUM — process confirmed, exact 2026 form fields not scraped live. |
| **Solana Explorer** | No submission — explorer reads Token-2022 Metadata extension directly | Metadata extension populated with correct name/symbol/URI. | HIGH — Token-2022 Metadata extension is natively rendered by the official explorer. |
| **Phantom / Solflare / Backpack** | No submission — wallets read on-chain Token-2022 Metadata | Same as above. Jupiter Verified status is also read by some wallets for a checkmark badge. | HIGH. |

**DEX seeding (prerequisite for every listing above):**
- **Recommended:** Raydium CPMM pool (https://raydium.io/liquidity/create/). CPMM explicitly supports Token-2022 and is the best-routed pool type on Jupiter.
- **Pair:** CAYC/USDC — mandatory because the peg is branded against USDC. A CAYC/SOL pool adds noise against the "soft peg" narrative.
- **Initial liquidity:** Out of research scope — business decision. Note that thin initial liquidity means the "soft peg" will float visibly, which PROJECT.md acknowledges as the biggest brand risk.

---

## IDE Setup (VS Code)

### Required extensions

- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **GitLens** (`eamodio.gitlens`)
- **dotenv** (`mikestead.dotenv`) — syntax highlighting for `.env` files

### Recommended extensions

- **Solana** (`solana-foundation.solana-vscode` or community equivalent) — snippets for common Solana instructions. Confidence: MEDIUM — exact extension marketplace ID shifts over time; verify in VS Code marketplace before installing.
- **rust-analyzer** (`rust-lang.rust-analyzer`) — only if reading Token-2022 source code locally.
- **Better TOML** (`tamasfe.even-better-toml`) — for any Cargo.toml if Rust is pulled in.

### Workspace settings (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["typescript"],
  "files.associations": { "*.env.*": "dotenv" }
}
```

---

## Sources

### Live-verified (HIGH confidence — queried 2026-04-19)

- **npm registry** — version queries for `@solana/spl-token@0.4.14`, `@solana/spl-token-metadata@0.1.6`, `@solana/web3.js@1.98.4`, `@solana/kit@6.8.0`, `@solana-program/token-2022@0.9.0`, `@solana-program/token@0.13.0`, `@sqds/multisig@2.1.4`, `@sqds/sdk@2.0.4` (v3 legacy), `helius-sdk@2.2.2`, `solana-bankrun@0.4.0`, `@coral-xyz/anchor@0.32.1`, `vitest@4.1.4`, `tsx@4.21.0`, `pnpm@10.33.0`, `typescript@6.0.3` (but 5.6.x recommended due to Solana ecosystem lag), `@metaplex-foundation/mpl-token-metadata@3.4.0`, `@metaplex-foundation/umi@1.5.1`, `commander@14.0.3`, `dotenv@17.4.2`, `zod@4.3.6`, `pino@10.3.1`, `bs58@6.0.0`, `@triton-one/yellowstone-grpc@5.0.8`.
- **GitHub releases** — Agave CLI stable `v3.1.13` via `api.github.com/repos/anza-xyz/agave/releases/latest`; Token-2022 JS client `v0.9.0` via `api.github.com/repos/solana-program/token-2022/releases/latest`.

### Official documentation (HIGH confidence)

- [Agave CLI install guide](https://docs.anza.xyz/cli/install) — CLI install path and version channels.
- [Solana Token-2022 SPL docs](https://spl.solana.com/token-2022) — extensions overview.
- [Token Extensions guides](https://solana.com/docs/tokens/extensions) and [Permanent Delegate guide](https://solana.com/developers/guides/token-extensions/permanent-delegate).
- [Squads v4 docs](https://docs.squads.so/main) — SDK overview and mainnet/devnet UI distinction.
- [Squads v4 TypeScript SDK TypeDoc](https://v4-sdk-typedoc.vercel.app/) — `@sqds/multisig` API reference.
- [Squads v4 examples repo](https://github.com/Squads-Protocol/v4-examples/blob/main/typescript/main.ts) — canonical TS usage.
- [Jupiter Verify](https://verified.jup.ag/) and [Jupiter verification docs](https://developers.jup.ag/docs/tokens/verification) — VRFD submission process.
- [Solscan token update guideline](https://info.solscan.io/solscan-token-update-guideline/) — Solscan submission path.
- [CoinGecko listing request guide](https://support.coingecko.com/hc/en-us/articles/7291312302617-How-to-list-new-cryptocurrencies-on-CoinGecko) — CG listing requirements.
- [Raydium pool types overview](https://docs.raydium.io/raydium/pool-creation/pool-types-overview) — CPMM/CLMM Token-2022 compatibility.
- [Bankrun docs](https://kevinheavey.github.io/solana-bankrun/) — testing framework guide.
- [Helius pricing](https://www.helius.dev/pricing) — RPC plans.

### Secondary sources (MEDIUM confidence — corroborated but not primary)

- [New @solana/kit overview (Triton blog)](https://blog.triton.one/intro-to-the-new-solana-kit-formerly-web3-js-2/) — Kit migration context, supports the "stay on web3.js v1 for this project" recommendation.
- [Helius Web3.js 2.0 guide](https://www.helius.dev/blog/how-to-start-building-with-the-solana-web3-js-2-0-sdk) — same context.
- [QuickNode Squads v4 guide](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/multisig-with-squads) — multisig setup walkthrough.
- [Helius guide: Testing Solana Programs](https://www.helius.dev/blog/a-guide-to-testing-solana-programs) — bankrun vs test-validator tradeoffs.
- [Sanctum: Complete Guide to Solana RPC Providers 2026](https://sanctum.so/blog/complete-guide-solana-rpc-providers-2026) — RPC provider comparison.
- [Chainstack: Best Solana RPC providers 2026](https://chainstack.com/best-solana-rpc-providers-in-2026/) — RPC provider comparison.

### Confidence assessments per recommendation

| Area | Confidence | Basis |
|------|-----------|-------|
| Version pins on npm packages | HIGH | Pulled live from npm registry 2026-04-19. |
| Agave CLI version | HIGH | Pulled live from GitHub releases 2026-04-19. |
| Token-2022 program ID + extension semantics | HIGH | Official SPL docs + Solana Foundation guides; stable since 2023. |
| Squads v4 as the multisig choice | HIGH | PROJECT.md constraint + dominant ecosystem position. |
| @sqds/multisig 2.1.4 SDK usage | HIGH | Official docs + examples repo + npm. |
| Devnet Squads UI does not allow creation | HIGH | Explicit statement in docs.squads.so and confirmed by multiple guides. |
| web3.js v1 over Kit (for this project) | HIGH | Transitively — Squads SDK and spl-token both target v1; mixing runtimes is documented friction. |
| Helius as primary RPC | MEDIUM | Multiple independent sources rank it top-tier for Solana dApp dev; actual ceremony success depends on plan + priority fee tuning. |
| Raydium CPMM for initial pool | MEDIUM | Raydium docs confirm Token-2022 CPMM support; "best default" is an opinion based on Jupiter routing coverage — the team may legitimately choose Orca. |
| Listing process steps (Jupiter/Solscan/CG/CMC) | MEDIUM-HIGH | Process steps confirmed on official docs; exact current form fields and SLAs shift — re-verify immediately before submission. |
| TypeScript 5.6 pin | MEDIUM | Based on current Solana ecosystem typedef state; may relax when Solana packages bump to TS 6. |
| Avoid Bun for this project | MEDIUM | Based on historical compatibility reports; revisit in 6 months. |

---

*Stack research for: Solana Token-2022 stablecoin launch (CAYC)*
*Researched: 2026-04-19*
