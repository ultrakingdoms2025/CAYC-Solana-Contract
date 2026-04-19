# Architecture Research

**Domain:** Solana Token-2022 stablecoin launch (Squads-governed, no custom program)
**Researched:** 2026-04-19
**Confidence:** HIGH for on-chain components and Squads flow. MEDIUM for listing submission paths (some endpoints changed in 2025). HIGH for repo structure conventions.

## Standard Architecture

### System Overview

```
+-------------------------------------------------------------------+
|                         HUMAN LAYER                                |
|   +----------------+  +----------------+  +----------------+       |
|   | Multisig       |  | Operator       |  | Listing        |       |
|   | Signers        |  | (proposer)     |  | Submitter      |       |
|   | (Ledger x N)   |  | (hot wallet)   |  | (docs/forms)   |       |
|   +-------+--------+  +-------+--------+  +-------+--------+       |
|           |                   |                   |                 |
+-----------|-------------------|-------------------|-----------------+
            |                   |                   |
+-----------|-------------------|-------------------|-----------------+
|           v                   v                   v                 |
|                    OFF-CHAIN TOOLING LAYER                          |
|   +-----------------+  +-----------------+  +-----------------+     |
|   | Squads Web UI / |  | Repo Scripts    |  | Listing         |     |
|   | Squads CLI      |  | (TypeScript)    |  | Submission      |     |
|   | (signs)         |  | (proposes)      |  | Artifacts       |     |
|   +--------+--------+  +--------+--------+  +--------+--------+     |
|            |                    |                    |              |
|            |                    |                    v              |
|            |                    |          +--------------------+   |
|            |                    |          | External Portals   |   |
|            |                    |          | Jupiter/Solscan/   |   |
|            |                    |          | CoinGecko/CMC      |   |
|            |                    |          | (web forms, PRs)   |   |
|            |                    |          +--------------------+   |
+------------|--------------------|-----------------------------------+
             |                    |
+------------|--------------------|-----------------------------------+
|            v                    v                                    |
|                       SOLANA RPC LAYER                               |
|   +-------------------------------------------------------------+   |
|   |    Helius / Triton / QuickNode / public RPC                  |   |
|   |    (devnet endpoint + mainnet endpoint)                      |   |
|   +------------------------------+------------------------------+   |
+----------------------------------|-----------------------------------+
                                   |
+----------------------------------|-----------------------------------+
|                                  v                                    |
|                       ON-CHAIN PROGRAM LAYER                          |
|                                                                       |
|   +----------------------+        +------------------------------+   |
|   | Squads V4 Program    | -----> | Token-2022 Program           |   |
|   | (msq... / SMPL...)   | CPI    | (TokenzQd...)                |   |
|   +----------+-----------+        +--------------+---------------+   |
|              |                                   |                   |
|              owns / derives                      operates on         |
|              v                                   v                   |
|   +----------------------+        +------------------------------+   |
|   | Multisig State PDA   |        | CAYC Mint Account            |   |
|   | + Vault PDA          |        | - decimals: 6                |   |
|   | + Transaction PDAs   |        | - mint auth = Vault PDA      |   |
|   | + Proposal PDAs      |        | - freeze auth = Vault PDA    |   |
|   +----------+-----------+        | - metadata auth = Vault PDA  |   |
|              |                    | - PermanentDelegate = Vault  |   |
|              | owns               | - Metadata ext (inline TLV)  |   |
|              v                    +--------------+---------------+   |
|   +----------------------+                       |                   |
|   | Treasury ATA (CAYC)  | <---------------------+                   |
|   | authority=Vault PDA  |   holds 500M CAYC after initial mint     |
|   +----------------------+                                           |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CAYC Mint Account** | Canonical on-chain identity of the token; stores supply, decimals, authorities, inline metadata (TLV), permanent delegate | Token-2022 program-owned account; created once, pinned forever |
| **Squads Multisig State PDA** | Config: members, threshold, time lock, vault index | Owned by Squads V4 program; derived from `createKey` |
| **Squads Vault PDA** | The "signer" for all production operations; holds mint/freeze/metadata authorities | Derived from (multisig PDA, vault index=0) |
| **Squads Transaction + Proposal PDAs** | Per-action state: pending instruction + vote tally | Created per operation, executed after threshold approvals |
| **Treasury ATA** | Associated Token Account owned by Vault PDA; holds the 500M supply | Standard ATA under Token-2022; derived from (vault PDA, mint PDA) |
| **Deployment Scripts** | Build instructions (mint init, mintTo, setAuthority, burn) and wrap them in Squads proposals; never sign as authority themselves on mainnet | TypeScript + `@solana/web3.js`, `@solana/spl-token`, `@sqds/multisig` |
| **Artifacts Directory** | Mirrors post-deployment on-chain state for humans: mint address, tx hashes, signer set, authority proofs | Checked-in JSON per network (`artifacts/devnet.json`, `artifacts/mainnet.json`) |
| **Listing Assets Directory** | Logo variants, metadata JSON, description copy, off-chain token list entry | Checked-in under `assets/`; immutable after mainnet |
| **Runbooks** | Step-by-step ceremonies (initial mint, additional mint, burn, authority rotation, key recovery) | Markdown in `docs/runbooks/` |

## Recommended Project Structure

```
cayc-solana-contract/
├── .env.example                   # Template; real .env never committed
├── package.json                   # pnpm workspace root
├── tsconfig.json
├── scripts/                       # Executable entrypoints (one concern per file)
│   ├── deploy/
│   │   ├── create-mint.ts         # Builds Token-2022 init tx (dry-run + devnet + mainnet-proposal modes)
│   │   ├── init-metadata.ts       # Inline TokenMetadata extension init (post-mint-init step)
│   │   ├── mint-initial-supply.ts # Mint 500M to treasury ATA via Squads proposal
│   │   └── verify-mint.ts         # Read on-chain state; diff against expected config
│   ├── ops/
│   │   ├── propose-mint.ts        # Additional mint (multisig proposal)
│   │   ├── propose-burn.ts
│   │   ├── propose-rotate-authority.ts
│   │   ├── propose-freeze.ts
│   │   └── propose-metadata-update.ts
│   ├── multisig/
│   │   ├── create-squad.ts        # Bootstrap Squads multisig (devnet + mainnet ceremony)
│   │   ├── inspect-squad.ts       # Read members, threshold, pending proposals
│   │   └── approve.ts             # Helper for signer approving a pending proposal (for hot-wallet members only)
│   └── listing/
│       ├── generate-submission-pack.ts  # Bundles artifacts + assets for each portal
│       └── post-launch-checks.ts        # Verifies explorer indexing, Jupiter presence
├── src/                           # Reusable library code imported by scripts
│   ├── chain/
│   │   ├── connection.ts          # RPC factory keyed by network
│   │   ├── token22.ts             # Instruction builders for Token-2022 (mint init w/ extensions, mintTo, burn, setAuthority)
│   │   ├── metadata.ts            # Inline TokenMetadata init + update instruction builders
│   │   └── ata.ts                 # ATA resolution for Token-2022 (note: different program ID than legacy SPL)
│   ├── squads/
│   │   ├── client.ts              # @sqds/multisig wrapper; vault PDA derivation
│   │   ├── propose.ts             # Generic "wrap instructions in a vault transaction + proposal" helper
│   │   └── addresses.ts           # Pinned multisig + vault addresses per network
│   ├── signers/
│   │   ├── loader.ts              # Env-driven keypair / Ledger loader (no hardcoded paths)
│   │   └── ledger.ts              # Ledger-specific signer adapter
│   ├── config/
│   │   ├── networks.ts            # RPC endpoint + commitment per network
│   │   ├── token-config.ts        # CAYC-level constants (decimals=6, supply=500M, symbol, name)
│   │   └── authorities.ts         # Post-deploy: references artifacts/*.json for authority addresses
│   └── util/
│       ├── tx.ts                  # simulate + sendAndConfirm helpers with explicit error surfacing
│       ├── log.ts                 # structured logging for ceremony transcripts
│       └── assert.ts              # runtime invariants (e.g. "this address must equal vault PDA")
├── artifacts/                     # Source of truth mirror (human-readable)
│   ├── devnet.json                # { mintAddress, multisigAddress, vaultAddress, treasuryAta, createdTx, createdSlot, signers[] }
│   ├── devnet-sessions/           # One file per ceremony session: transcript + tx signatures
│   ├── mainnet.json               # Pinned after mainnet launch; becomes immutable
│   └── mainnet-sessions/
├── assets/                        # Listing submission materials
│   ├── logo/
│   │   ├── cayc-512.png
│   │   ├── cayc-256.png
│   │   ├── cayc-vector.svg
│   │   └── cayc-favicon-32.png
│   ├── metadata/
│   │   └── token-metadata.json    # Off-chain JSON (name, symbol, description, image URL, website, X, tags)
│   ├── copy/
│   │   ├── description-short.md   # 160-char blurb
│   │   ├── description-long.md    # 500-word project description
│   │   └── legal-disclosures.md   # For CEX packages
│   └── listings/
│       ├── coingecko-submission.md  # Pre-filled answer key for CoinGecko form
│       ├── coinmarketcap-submission.md
│       ├── solscan-update.md
│       └── jupiter-strategy.md      # Organic-score playbook (no direct PR anymore)
├── docs/
│   ├── ARCHITECTURE.md            # Project-level architecture (subset of this research)
│   ├── runbooks/
│   │   ├── 01-devnet-dry-run.md
│   │   ├── 02-mainnet-multisig-ceremony.md
│   │   ├── 03-mainnet-mint-ceremony.md
│   │   ├── 04-additional-mint.md
│   │   ├── 05-burn.md
│   │   ├── 06-authority-rotation.md
│   │   ├── 07-signer-compromise-recovery.md
│   │   └── 08-listing-submissions.md
│   └── security/
│       ├── threat-model.md
│       └── signer-roster.md       # Role + pseudonym + contact channel only (no raw keys or addresses)
├── tests/
│   └── devnet/                    # Integration tests that run against a real devnet mint
│       ├── mint-init.test.ts
│       ├── mint-to.test.ts
│       ├── burn.test.ts
│       ├── set-authority.test.ts
│       └── metadata-roundtrip.test.ts
└── .planning/                     # GSD project planning (already present)
```

### Structure Rationale

- **`scripts/` vs `src/`:** Executable ceremony scripts live in `scripts/` and are deliberately thin; all reusable logic lives in `src/`. This makes the ceremony transcripts reviewable — a human reading `scripts/deploy/create-mint.ts` should see intent, not implementation detail.
- **`scripts/deploy/` vs `scripts/ops/` vs `scripts/multisig/` vs `scripts/listing/`:** The four scripts directories mirror the four distinct flows. Deploy runs once, ops runs repeatedly, multisig is setup-only, listing runs after mainnet. Separating them prevents accidentally running a production mint script in a devnet test.
- **`src/squads/addresses.ts`:** The multisig + vault addresses are code-referenced (not magic strings in scripts). Makes network split explicit and forces an import, which is easy to audit.
- **`artifacts/{network}.json` as source-of-truth mirror:** On-chain is the source of truth, but humans need a diffable file. Post-deploy scripts write this file; ops scripts read from it; mismatches trigger a runtime assert. Mainnet artifact is committed and then never edited (only appended to for additional mint records).
- **`assets/` outside `src/`:** Listing assets are a distinct concern, managed by a non-developer stakeholder, and subject to marketing review. Keeping them outside code prevents accidental bundling and makes diff reviews clear.
- **`docs/runbooks/` numbered:** Ceremony ordering is a hard dependency. Numbering forces sequence.
- **`tests/devnet/`:** Tests run against real devnet, not mocks. Token-2022 + Squads behavior is too idiosyncratic to mock meaningfully, and devnet is free.

## Architectural Patterns

### Pattern 1: The Network Split (Devnet / Mainnet as a Config Axis, Not a Branch)

**What:** All scripts take a `--network devnet|mainnet` flag (or `SOLANA_NETWORK` env). A single `src/config/networks.ts` resolves RPC URL, Squads multisig address, mint address, and commitment level from that flag. No network-specific branches elsewhere.

**When to use:** Any project that will run identical logic against two networks. Alternative (separate codebases or branches) guarantees drift.

**Trade-offs:**
- **Pro:** Devnet rehearsal tests the exact mainnet code path.
- **Pro:** Ledger / Squads ceremony scripts exercise the real SDK, not a devnet-only stub.
- **Con:** One misplaced `.env` variable can target mainnet when devnet was intended. Mitigate with: (1) explicit `--network` required (no default), (2) a "are you sure?" prompt on mainnet with multisig address echoed back, (3) a "dry run" mode that simulates but never sends.

**Example:**
```typescript
// src/config/networks.ts
export type Network = 'devnet' | 'mainnet';

export function loadNetworkConfig(net: Network) {
  if (net === 'mainnet') {
    return {
      rpcUrl: requireEnv('MAINNET_RPC_URL'),
      multisigPda: new PublicKey(artifacts.mainnet.multisigAddress),
      vaultPda:    new PublicKey(artifacts.mainnet.vaultAddress),
      mintAddress: new PublicKey(artifacts.mainnet.mintAddress),
      commitment: 'finalized',
    };
  }
  return {
    rpcUrl: process.env.DEVNET_RPC_URL ?? 'https://api.devnet.solana.com',
    multisigPda: new PublicKey(artifacts.devnet.multisigAddress),
    vaultPda:    new PublicKey(artifacts.devnet.vaultAddress),
    mintAddress: new PublicKey(artifacts.devnet.mintAddress),
    commitment: 'confirmed',
  };
}
```

### Pattern 2: Script-Proposes, Multisig-Signs (No Direct Authority on Mainnet)

**What:** On mainnet, scripts never hold mint/freeze/metadata authority. They build instructions, wrap them in `vaultTransactionCreate` + `proposalCreate`, and stop. Signers use Squads Web UI + Ledger to approve, and anyone can trigger `vaultTransactionExecute`.

**When to use:** Any production authority flow governed by a multisig.

**Trade-offs:**
- **Pro:** No private key with authority ever lives in CI, scripts, or a developer's machine.
- **Pro:** Proposal history on Squads is a complete audit trail.
- **Con:** Higher friction — every change is a human ceremony. Acceptable because stablecoin operations are infrequent and high-stakes.

**Example:**
```typescript
// src/squads/propose.ts
export async function proposeInstructions(args: {
  connection: Connection;
  multisig: PublicKey;
  vault: PublicKey;
  proposer: Keypair;          // Hot wallet, member of Squad, "proposer" role only
  instructions: TransactionInstruction[];
  memo: string;
}) {
  const newTxIndex = await nextTransactionIndex(args.connection, args.multisig);
  const message = new TransactionMessage({
    payerKey: args.vault,
    recentBlockhash: (await args.connection.getLatestBlockhash()).blockhash,
    instructions: args.instructions,
  }).compileToV0Message();

  // 1. Create the vault transaction (the "what")
  await multisig.rpc.vaultTransactionCreate({
    connection: args.connection, multisig: args.multisig,
    transactionIndex: newTxIndex, creator: args.proposer.publicKey,
    vaultIndex: 0, ephemeralSigners: 0, transactionMessage: message,
    memo: args.memo, feePayer: args.proposer,
  });

  // 2. Create the proposal (the "can be voted on")
  await multisig.rpc.proposalCreate({
    connection: args.connection, multisig: args.multisig,
    transactionIndex: newTxIndex, creator: args.proposer, feePayer: args.proposer,
  });

  return newTxIndex; // Hand this to signers
}
```

### Pattern 3: Mint Initialization Instruction Ordering

**What:** Token-2022 extensions have a strict initialization order dictated by the program. For CAYC's combination (MetadataPointer + PermanentDelegate + TokenMetadata):

1. `SystemProgram.createAccount` — allocate enough lamports/space for mint + *fixed-length* extensions (NOT metadata; metadata goes in a second resize later).
2. `createInitializeMetadataPointerInstruction` — pointer extension; must precede `initializeMint`. Points to the mint itself (self-referential) so metadata lives inline.
3. `createInitializePermanentDelegateInstruction` — delegate extension; must precede `initializeMint`.
4. `createInitializeMintInstruction` — initializes the mint with decimals + mint/freeze authorities.
5. (After mint init) fund mint account for metadata length growth.
6. `createInitializeInstruction` (from `@solana/spl-token-metadata`) — initializes TokenMetadata extension inline. This MUST come after `initializeMint` because TokenMetadata is variable-length and written into remaining space.

**When to use:** Any Token-2022 mint that combines metadata with other extensions.

**Trade-offs:**
- **Pro:** A single atomic transaction creates the mint in final form.
- **Con:** Order is unforgiving. Getting it wrong produces obscure "account not initialized" or "extension already initialized" errors. Confidence: **HIGH** on the principle (PermanentDelegate before initializeMint), **MEDIUM** on the exact post-mint metadata funding sequence — confirm with a devnet dry run and Context7-resolved docs before mainnet.

**Critical:** Because TokenMetadata is variable-length, it's typical to split into two transactions: (tx1) createAccount + extension inits + initializeMint; (tx2) realloc + TokenMetadata init. For a multisig, this means **two separate Squads proposals** for the initial deploy unless handled in one atomic v0 transaction. Validate on devnet.

### Pattern 4: Artifacts as Post-Deploy Truth Mirror

**What:** Every deploy script that produces on-chain state writes a JSON record to `artifacts/{network}.json`. Subsequent ops scripts load addresses from this file. Mainnet artifact is committed to git and treated as append-only.

**When to use:** Any project where multiple scripts need to reference the same deployed addresses.

**Trade-offs:**
- **Pro:** Single reference for mint/multisig/vault/treasury addresses. Easy code review: "does this script target the right addresses?"
- **Pro:** Git history of `artifacts/mainnet.json` is a paper trail of every mint/burn/rotation.
- **Con:** File can drift from on-chain state if edited manually. Mitigate with a `scripts/deploy/verify-mint.ts` that reads on-chain and diffs against the file; run it as part of every ops script prelude.

### Pattern 5: Ceremony Transcript Logging

**What:** Every mainnet ceremony script writes a timestamped transcript to `artifacts/mainnet-sessions/YYYY-MM-DD-<op>.md`, capturing: network, operator, proposer address, instruction summary, simulated result, resulting proposal address, signatures observed, execution tx hash.

**When to use:** Any ceremony where you may need to prove later what happened.

**Trade-offs:**
- **Pro:** Supports CEX listing packages ("show us proof of the initial mint"), post-incident review, and legal discovery.
- **Con:** None meaningful; cheap to implement.

## Data Flow

### Flow A: Devnet Deploy (end-to-end dry run)

```
Developer CLI (local keypair)
    -> scripts/deploy/create-mint.ts --network devnet
       -> src/chain/token22.ts builds v0 TransactionMessage
       -> Local keypair signs directly (no multisig on first dry run)
       -> RPC sendAndConfirm -> devnet
       -> src/chain/token22.ts reads back mint state
       -> writes artifacts/devnet.json
    -> scripts/deploy/verify-mint.ts --network devnet
       -> asserts on-chain state matches config/token-config.ts
```

### Flow B: Devnet with Multisig (full ceremony rehearsal)

```
Operator (proposer, hot wallet, Squad member)
    -> scripts/multisig/create-squad.ts --network devnet
       -> creates devnet Squad with test signer wallets
       -> writes multisig + vault address to artifacts/devnet.json
    -> scripts/deploy/create-mint.ts --network devnet --via-multisig
       -> builds Token-2022 init instructions
       -> src/squads/propose.ts wraps them -> proposal created on Squads
    -> Signers (test wallets) approve via @sqds/multisig SDK or Squads Web UI (devnet)
    -> Any party -> proposalExecute -> on-chain state updated
    -> verify-mint.ts confirms
```

### Flow C: Mainnet Mint Ceremony (production)

```
Ceremony day:
    1. Signers gather (remote OK, but synchronous approval window).
    2. Operator (hot wallet) runs scripts/deploy/create-mint.ts --network mainnet --via-multisig
       - Script prints multisig address + mint address + instruction summary.
       - Script simulates tx; shows simulated mint state.
       - Prompt: "Type 'CONFIRM CAYC MAINNET' to submit proposal." Operator confirms.
       - Proposal created on mainnet Squads.
    3. Signers open Squads Web UI, connect Ledger, review proposal details
       (inspect the encoded instruction data, not just the memo).
    4. Signers approve one by one; UI shows approval tally progressing.
    5. Threshold reached; any member (or operator) triggers execute.
    6. scripts/deploy/verify-mint.ts --network mainnet confirms.
    7. Transcript written to artifacts/mainnet-sessions/.
    8. Initial mint proposal (500M to treasury ATA) is a SEPARATE ceremony —
       do not combine with mint creation in case of any issue.
```

### Flow D: Listing Submissions (post-mainnet, manual, parallelizable)

```
After mainnet mint + initial supply confirmed:

(1) Solscan (auto-indexed, BUT reputation system since Feb 2025):
    - Token page exists automatically once first tx lands.
    - Logo + branding will NOT show until Solscan's internal reputation system
      classifies the token. Submit an update request via solscan.io/token-update
      with logo, description, website, socials.
    - Requires Update Authority signature OR manual review (Squads-held authority
      means manual review via the form).

(2) Jupiter Verify (WARNING: process changed in 2025):
    - Old validated-tokens.csv PR to jup-ag/token-list: DEPRECATED.
      That repo was archived April 2025.
    - Current: Jupiter Verify v3/v4 uses "organic score" + "smart likes" from the
      community. Verification is algorithmic, not form-based.
    - Express Review path exists (burn 1,000 JUP), "guaranteed review in 24h"
      but not guaranteed verification.
    - Practical flow: get liquidity live, drive community activity, submit for
      Express Review if organic verification lags.

(3) CoinGecko:
    - Web form at coingecko.com/en/coins/new. Requires: mint address, logo,
      description, website, socials, explorer link, whitepaper, initial liquidity
      pool address, market data source.
    - Review window: 1-2 weeks typically.

(4) CoinMarketCap:
    - Separate form, stricter review. Requires all of the above plus
      a self-reporting dashboard commitment and often paid priority review.
    - Review window: 2-6 weeks, sometimes longer.

(5) DEX pool seeding (Raydium / Orca / Meteora):
    - Independent of the above. Required before Jupiter organic verification
      can realistically complete (Jupiter indexes from DEX routes).
    - Pool creation is itself a multisig operation since treasury funds come
      from the vault.

(6) CEX listing package:
    - Human-assembled artifact bundle from assets/ + artifacts/mainnet.json.
    - Not automated; each CEX has its own form.
```

### Flow E: Post-Launch Operations (ongoing)

```
Operator proposes
    -> scripts/ops/propose-{mint,burn,rotate,freeze}.ts --network mainnet
    -> src/squads/propose.ts creates proposal
Signers review + approve via Squads Web UI
Any member executes
verify-mint.ts asserts new state
artifacts/mainnet.json appended with new ceremony record
```

### Key Data Flow Invariants

1. **No private key with authority ever in a repo file.** Scripts load from env (`SOLANA_PROPOSER_KEYPAIR_PATH`) or Ledger adapter. `.gitignore` includes `*.json.key`, `*-keypair.json`, `.env`.
2. **On-chain is source of truth; artifacts/*.json is a mirror.** Any script that mutates state must re-read after confirmation.
3. **Devnet state is disposable; mainnet state is append-only.** `artifacts/devnet.json` can be regenerated by re-running deploys. `artifacts/mainnet.json` is committed and only modified by successful ceremonies.
4. **All mainnet state changes flow through Squads program.** There is no mainnet code path where a raw keypair signs a Token-2022 instruction that mutates the mint.
5. **Listing submissions are one-way.** No attempt to reconcile "did Jupiter accept us?" programmatically — track status in a simple checklist doc.

## Scaling Considerations

"Scale" here is not user count; it is **operation frequency** and **signer count**.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Launch + <1 op/month | Manual Squads Web UI for approvals; scripts only for proposal creation; single proposer is fine. |
| 1-10 ops/month | Introduce a second proposer (role: "backup operator"); add `scripts/ops/approve.ts` for signers who prefer CLI over web UI; consider Squads "roles" feature to gate which members can propose vs approve vs execute. |
| 10+ ops/month | Consider Squads "spending limits" (V4 feature) for small recurring operations below a threshold; introduce monitoring (RPC subscription to mint state changes with alerting); archive ceremony transcripts to a separate artifacts store. |
| Signer roster changes | Already first-class: `scripts/ops/propose-rotate-authority.ts` + a Squads "configTransaction" for member changes. Rehearse both quarterly. |

### Scaling Priorities

1. **First bottleneck: ceremony coordination.** Getting N signers to synchronously approve becomes painful fast. Mitigate with Squads time locks (give signers 48h to approve before execute) rather than demanding same-day action.
2. **Second bottleneck: proposer key security.** The proposer (hot wallet) doesn't hold authority, but it pays fees and its compromise means denial-of-service (spam proposals). Mitigate by making the proposer a Squad member with "proposer" role only (no approval rights) and rotating quarterly.
3. **Third bottleneck: artifact file drift.** As ops volume grows, `artifacts/mainnet.json` grows. Split into `artifacts/mainnet/state.json` (current) + `artifacts/mainnet/history.jsonl` (append-only log) at ~50 entries.

## Anti-Patterns

### Anti-Pattern 1: Storing the Mint Address Only in Config

**What people do:** Put `CAYC_MINT = "Abc123..."` in `config.ts` and rely on that string alone.
**Why it's wrong:** No audit trail of when/how the address came to be. A typo or a copy-paste error silently redirects operations to the wrong mint. Recovery is hard because you lose the chain of custody for the address.
**Do this instead:** Pin the mint address in `artifacts/{network}.json` at deploy time with full context: `{ mintAddress, createdAtSlot, createdByTx, createdByProposer, multisigAtCreation }`. Config loaders read from the artifact and assert invariants (decimals == 6, mint auth == vault PDA) on every script startup.

### Anti-Pattern 2: Legacy SPL-Token Instruction Builders Against Token-2022

**What people do:** Use `@solana/spl-token` default helpers (which target the legacy SPL Token program ID) against a Token-2022 mint, or forget to pass `TOKEN_2022_PROGRAM_ID` to `getAssociatedTokenAddressSync`.
**Why it's wrong:** Silently computes the wrong ATA address, or builds an instruction targeting the wrong program. Fails with unhelpful errors like "account not owned by program" at runtime.
**Do this instead:** Every `@solana/spl-token` call that accepts a `programId` argument **must** receive `TOKEN_2022_PROGRAM_ID` explicitly. Centralize in `src/chain/token22.ts` so there's one place to audit. Add a lint rule or grep check in CI: any use of `ASSOCIATED_TOKEN_PROGRAM_ID` or `getAssociatedTokenAddress` outside `src/chain/` must pass the program ID.

### Anti-Pattern 3: Metadata Off-Chain JSON in Random Locations

**What people do:** Host the off-chain metadata JSON (the one the `uri` field in Token-2022 metadata points to) on Arweave with a v1 txid, then later re-upload and have two competing URIs. Or host on IPFS without pinning. Or host on a personal domain that expires.
**Why it's wrong:** Wallets and explorers cache the URI indefinitely; if it breaks or changes, logos disappear across the ecosystem and re-indexing is outside your control.
**Do this instead:** Host the off-chain metadata JSON on a durable, pinned service (Arweave via Bundlr with a long-term provider, or a permanent immutable CDN path controlled by the CAYC team). Treat the URI as immutable post-launch — if you need to update image, update the JSON in place (same URI). Commit the JSON content to `assets/metadata/` so a re-upload to the same URL is trivial.

### Anti-Pattern 4: Combining Mint Creation and Initial Supply Mint in One Proposal

**What people do:** Stuff all of (createAccount, initExtensions, initMint, initMetadata, createATA, mintTo 500M) into a single v0 transaction wrapped in one Squads proposal.
**Why it's wrong:** (a) Transaction size limit (1232 bytes) is tight; (b) if any part fails, the whole proposal is nullified and the mint state is undefined; (c) it conflates two independently verifiable milestones (mint exists correctly ≠ supply is correct).
**Do this instead:** Two ceremonies. **Ceremony 1:** create mint + init extensions + init metadata. Verify all authority fields, metadata fields, extension list. **Ceremony 2:** create treasury ATA + mintTo 500M. Verify balance. Each ceremony has its own artifact entry, transcript, and "stop and look" checkpoint.

### Anti-Pattern 5: Automating Listing Submissions

**What people do:** Try to scrape or API-submit CoinGecko / CoinMarketCap / Solscan via undocumented endpoints.
**Why it's wrong:** These portals have anti-automation controls; submissions are flagged for review or rejected. Also: most listing reviewers contact the team via the email/socials submitted, so an unmonitored submission address means slow/missed reviews.
**Do this instead:** Treat listings as a human workflow. Repo provides `scripts/listing/generate-submission-pack.ts` which outputs a per-portal markdown file with all the answers pre-filled from artifacts + assets. Human copy-pastes into each portal's form. Checklist tracked in `docs/runbooks/08-listing-submissions.md`.

### Anti-Pattern 6: Single Ledger Device for Multiple Signer Slots

**What people do:** Use one Ledger with multiple derivation paths to represent multiple "members" of the multisig.
**Why it's wrong:** Defeats the purpose of a multisig. Device compromise = all signers compromised simultaneously. Also a red flag for CEX listing reviewers.
**Do this instead:** Each signer slot in the Squad is a physically distinct hardware wallet held by a distinct human. Document this in `docs/security/signer-roster.md` (by role/pseudonym only — never names or addresses in a public repo). Minimum: 3 signers with 2-of-3 threshold; recommended: 5-of-8 or similar for larger projects.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Solana RPC (Helius/Triton/QuickNode)** | `@solana/web3.js` Connection per network | Use a dedicated provider for mainnet (free public RPC will rate-limit ceremony scripts). Keep devnet on free endpoint. |
| **Squads V4 Program** | `@sqds/multisig` SDK + Squads Web UI for signers | SDK for script-side proposal creation; Web UI for signer approval (Ledger integration is native in the UI and more reliable than scripting Ledger signatures ourselves). |
| **Ledger (signers)** | Squads Web UI handles Ledger natively | Do not build a custom Ledger signing path for signers; use the UI. Scripts only sign with hot proposer keypair. |
| **Solscan** | Web form submission (`solscan.io/token-update`) | Token page auto-appears; logo/branding requires manual update request. Reputation system (Feb 2025+) may delay logo display. |
| **Jupiter Verify v3/v4** | No direct submission; organic score driven | Old `jup-ag/token-list` repo archived April 2025. Express Review (burn 1,000 JUP) is the fastest path if organic verification lags. |
| **CoinGecko / CoinMarketCap** | Web form submissions | Human workflow. 1-2 weeks (CG) / 2-6 weeks (CMC) review windows. |
| **Raydium / Orca / Meteora** | Pool creation via vault (multisig proposal) | Each DEX has its own SDK; pool creation is a one-time ceremony per venue. |
| **Arweave / IPFS (metadata host)** | One-time upload for off-chain metadata JSON + image | Treat URI as permanent; use pinned service. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| scripts/ -> src/ | Direct imports | Scripts thin; logic reusable. |
| src/chain/ -> src/squads/ | src/squads/propose.ts accepts `TransactionInstruction[]` | Squads layer doesn't know what a Token-2022 instruction is; it just wraps instructions. Clean separation. |
| src/config/ -> artifacts/ | Read-only at script startup | Artifacts are the authoritative address source. Config only provides static data (decimals, name, symbol). |
| scripts/ -> runtime env | `.env` + keypair files + Ledger | All secret loading isolated in `src/signers/loader.ts`. |
| tests/devnet/ -> live devnet RPC | Real integration | No mocking of Token-2022 or Squads. |

## Build Order (Dependency-Ordered)

This is the dependency-driven build order. Each item's "depends on" is the minimum prerequisite; parallelization within a row is fine.

| # | Milestone | Depends on | Rationale |
|---|-----------|-----------|-----------|
| 1 | Repo scaffold + `src/chain/token22.ts` instruction builders | — | Foundation. No scripts run without this. |
| 2 | Devnet deploy of a throwaway mint (local keypair, no multisig) | 1 | Validate Token-2022 + Metadata + PermanentDelegate init ordering on real RPC before introducing multisig complexity. |
| 3 | `src/squads/` module + `scripts/multisig/create-squad.ts` | 1 | Build multisig primitives independently of Token-2022. |
| 4 | Devnet Squads creation | 3 | Rehearse signer flow with test wallets. |
| 5 | Devnet deploy via multisig (full rehearsal) | 2, 4 | First time the two subsystems integrate. Expect bugs; this is where you find them. |
| 6 | `scripts/ops/` full set + devnet ceremonies for each op | 5 | mint, burn, setAuthority, metadata update all rehearsed against devnet mint. |
| 7 | Listing asset preparation (logo, metadata JSON, copy) | — (parallel) | Non-code work; can run alongside 1-6. |
| 8 | Runbooks for every ceremony | 6 | Written after rehearsal, not before; captures actual command sequences and gotchas observed. |
| 9 | Mainnet Squads creation (hardware-wallet signers, physical ceremony) | 8 | First mainnet action. Irreversible; signer roster must be final. |
| 10 | Mainnet mint creation ceremony (empty mint, no supply yet) | 9 | Verify on-chain state separately before any supply exists. |
| 11 | Mainnet initial supply ceremony (500M to treasury ATA) | 10 | Second ceremony; treasury balance now matches spec. |
| 12 | `artifacts/mainnet.json` committed; `docs/security/signer-roster.md` finalized | 11 | Paper trail complete. |
| 13 | Solscan update request + on-chain metadata URI verification | 11 | Can start same day; review lag is external. |
| 14 | CoinGecko submission | 11, 13 | Needs a stable explorer view. Start day of launch. |
| 15 | CoinMarketCap submission | 11, 13 | Similar; can run parallel to CoinGecko. |
| 16 | DEX pool seeding ceremony (Raydium / Orca / Meteora, treasury-funded) | 11 | Multisig proposal. Unlocks Jupiter organic verification path. |
| 17 | Jupiter Verify: organic activity + (optional) Express Review | 16 | Needs active DEX liquidity to score organically. |
| 18 | CEX listing package assembly + submission(s) | 12, 14, 15, 16 | Requires full artifact trail + initial market signals. |

**Ceremony separation principle:** Items 9, 10, 11, 16 are each standalone mainnet ceremonies. Never combine. Each has its own rehearsal, its own transcript, its own "stop and verify" checkpoint.

## Security Boundaries (Explicit)

1. **No private keys in repo.** `.gitignore` blocks `*.json` (except `package.json`, `tsconfig.json`, `artifacts/*.json`), `.env`, `*-keypair.*`. CI scans for accidentally-committed keypairs on every push.
2. **Mainnet authorities = Squads Vault PDA only.** Verified at script startup: any ops script that sees a mismatch (e.g., mint authority != configured vault PDA) aborts before building any instruction.
3. **Proposer key is not an authority.** The hot wallet that runs scripts is a Squad member with "proposer" role only. Even if stolen, the most an attacker can do is spam proposals (which get denied by signers).
4. **Signers use hardware wallets only on mainnet.** Enforced by signer roster doc + rehearsed devnet ceremony. No software wallets as signers on mainnet.
5. **Signer roster doc has no sensitive data.** `docs/security/signer-roster.md` contains: role, pseudonym, contact channel, device model. It does NOT contain: signer addresses, device serial numbers, real names. Signer addresses are derivable from the on-chain Squads state anyway.
6. **Listing submissions do not reveal signer identities.** Submission docs reference "Squads multisig at address X" with on-chain proof; they do not name individual signers.
7. **Metadata update authority rotation is a first-class ceremony.** If a signer leaves, rotate. Runbook exists; rehearsed quarterly.

## Confidence Assessment (This Document)

| Claim | Confidence | Basis |
|-------|-----------|-------|
| Token-2022 extension init ordering (PermanentDelegate before initializeMint) | HIGH | Solana official docs + multiple independent sources agree |
| TokenMetadata is variable-length and initialized after initializeMint | HIGH | Solana official docs + Chainstack analysis |
| Squads V4 SDK flow (vaultTransactionCreate -> proposalCreate -> approvals -> execute) | HIGH | Official Squads docs + SDK README |
| Multisig PDA / Vault PDA derivation | HIGH | Official Squads docs |
| Jupiter token-list PR process is deprecated (archived April 2025) | HIGH | GitHub repo state verified + Jupiter Verify v3 launch confirmed |
| Jupiter Verify v3/v4 uses organic score + optional Express Review (burn 1000 JUP) | MEDIUM-HIGH | Multiple 2025 sources; exact Express Review pricing may shift |
| Solscan reputation system (Feb 2025+) delays logo display for new tokens | HIGH | Official Solscan info center |
| CoinGecko 1-2 week / CMC 2-6 week review timelines | MEDIUM | Typical community-reported ranges; varies |
| Two-ceremony split for mint creation vs initial supply is best practice | MEDIUM | Inferred from transaction-size and atomicity first principles; not a hard external rule |
| Specific @sqds/multisig method names (vaultTransactionCreate, proposalCreate) | HIGH | Squads SDK npm README + docs |

## Sources

- [Solana Token Extensions: Permanent Delegate](https://solana.com/developers/guides/token-extensions/permanent-delegate) — init ordering for PermanentDelegate before initializeMint
- [Solana Metadata & Metadata Pointer Extensions](https://solana.com/developers/guides/token-extensions/metadata-pointer) — TokenMetadata inline pattern
- [Solana Token Extensions](https://solana.com/docs/tokens/extensions) — official extension reference
- [Chainstack: Solana Token-2022 Metadata Explained](https://chainstack.com/solana-token-2022-metadata-from-conventions-to-explicit-state/) — TokenMetadata variable-length behavior
- [Squads V4 GitHub](https://github.com/Squads-Protocol/v4) — SDK + program source
- [Squads Docs: Quickstart](https://docs.squads.so/main/development/introduction/quickstart) — SDK flow
- [Squads Docs: Create Vault Transaction](https://docs.squads.so/main/development/typescript/instructions/create-vault-transaction) — vaultTransactionCreate + proposalCreate pattern
- [Squads Docs: Execute Vault Transaction](https://docs.squads.so/main/development/typescript/instructions/execute-vault-transaction) — execution pattern
- [Squads Blog: Create and Manage Solana SPL Tokens](https://squads.xyz/blog/create-manage-solana-spl-token) — Token Manager workflow (SPL + Token-2022 detection)
- [Squads Docs: Token Manager](https://docs.squads.so/main/navigating-your-squad/developers-assets/token-manager) — transfer authority workflow
- [@sqds/multisig npm](https://www.npmjs.com/package/@sqds/multisig) — SDK entrypoint
- [Jupiter Verify](https://verified.jup.ag/) — current verification portal (V3)
- [Jupiter Verify FAQ (Research forum)](https://discuss.jup.ag/t/faq-token-list-v3-verification/23074) — V3 verification mechanism
- [Jupiter Organic Score docs](https://dev.jup.ag/docs/token-api/organic-score) — scoring methodology
- [jup-ag/token-list GitHub](https://github.com/jup-ag/token-list) — archived April 2025 (confirms old PR path is dead)
- [Solscan Token Update Form](https://solscan.io/token-update) — branding update submission
- [Solscan Token Update Guideline](https://info.solscan.io/solscan-token-update-guideline/) — reputation system + update requirements
- [Orca: Getting on Jupiter's Strict List](https://docs.orca.so/solana-documentation/orca-on-solana/orca-for-new-token-creators-on-solana/how-to-guides/how-to-get-your-token-onto-jupiters-strict-list) — updated for V3
- [Chainlink CCIP: LockRelease Pool with Squads Governance](https://docs.chain.link/ccip/tutorials/svm/cross-chain-tokens/lock-release-multisig) — production Squads multisig pattern reference
- [RareSkills: Token-2022 Specification](https://rareskills.io/post/token-2022) — extension-composition reference

---
*Architecture research for: Solana Token-2022 stablecoin, Squads-governed, no custom program*
*Researched: 2026-04-19*
