#!/usr/bin/env -S tsx
/**
 * Metadata hosting uploader — Plan 03-03.
 *
 * PURPOSE: Uploads the two logo derivatives (512 + 1024 PNG) and the off-chain
 * metadata JSON for a given rehearsal to Arweave via @ardrive/turbo-sdk (SOL-paid),
 * then rewrites the JSON's `image` field to reference the Arweave logo URL before
 * uploading the JSON itself. Records every TX ID + URL in
 * artifacts/metadata-hosting.json so Plan 03-04 (Rehearsal 1) and Plan 03-05
 * (Rehearsal 2) can pass the Arweave JSON URL as the on-chain TokenMetadata
 * `uri` field.
 *
 * Two execution modes:
 *
 *   Branch A (default): Arweave primary upload via Turbo SDK with SOL payment.
 *     Permanent, immutable storage. ~0.01 SOL budget for all four uploads on
 *     devnet (two rehearsals × (logo-512 + logo-1024 + json)). Actual cost is
 *     often zero because Turbo's free-tier credit covers small payloads.
 *     Enables Phase 4 mainnet parity (mainnet path uses same script with
 *     mainnet proposer keypair; Arweave TX is identical URL scheme, just paid
 *     from mainnet SOL).
 *
 *   Branch B (--github-only): Zero-cost mirror using raw.githubusercontent.com
 *     URLs exclusively. Acceptable for devnet rehearsal. Phase 4 mainnet SHOULD
 *     revisit and use Arweave for durability — GitHub repos can disappear.
 *
 * USAGE:
 *   pnpm assets:upload-metadata --rehearsal 1
 *   pnpm assets:upload-metadata --rehearsal 2
 *   pnpm assets:upload-metadata --rehearsal 1 --github-only    # no Arweave, GitHub raw mirror only
 *   pnpm assets:upload-metadata --rehearsal 1 --force          # re-upload even if already recorded
 *
 * IDEMPOTENCE: refuses to re-upload if artifacts/metadata-hosting.json already
 *              has a populated rehearsal_<N> entry. Pass --force to override.
 *
 * FALLBACK: if @ardrive/turbo-sdk is ever unavailable, the already-uploaded
 * Arweave TXs remain accessible forever at arweave.net/<tx>; switch to
 * @irys/sdk (also SOL-paid, older infra) for any future re-uploads.
 *
 * PITFALLS.md references:
 *   - Anti-Pattern 3 (metadata JSON in random locations): this script is the
 *     single canonical path for generating on-chain `uri` candidates.
 *   - Pitfall 10 (no secret keys in logs): only TX IDs, URLs, and pubkeys are
 *     ever printed — never the proposer's secret key bytes.
 */
import { Keypair } from '@solana/web3.js';
import { readFileSync, writeFileSync, createReadStream, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Command } from 'commander';
import bs58 from 'bs58';
import { TurboFactory } from '@ardrive/turbo-sdk';
import { loadEnv } from '../../src/env/load.js';

loadEnv('devnet'); // devnet-scoped; safe. Mainnet variant in Phase 4 will loadEnv('mainnet-beta').

const program = new Command();
program
  .name('upload-metadata')
  .description(
    'Upload logo + metadata JSON to Arweave (Branch A) or derive GitHub raw URLs (Branch B)',
  )
  .requiredOption('--rehearsal <n>', 'rehearsal number: 1 or 2')
  .option('--force', 'overwrite existing rehearsal entry in artifacts/metadata-hosting.json')
  .option(
    '--github-only',
    'Branch B: skip Arweave, use GitHub raw URLs only (devnet rehearsal only)',
  )
  .parse(process.argv);

const opts = program.opts<{ rehearsal: string; force?: boolean; githubOnly?: boolean }>();
const rehearsal = Number(opts.rehearsal);
if (rehearsal !== 1 && rehearsal !== 2) {
  console.error('FATAL: --rehearsal must be 1 or 2');
  process.exit(1);
}
const REHEARSAL = rehearsal as 1 | 2;
const KEY = `rehearsal_${REHEARSAL}` as const;

const HOSTING_ARTIFACT = resolve('artifacts/metadata-hosting.json');
const JSON_FILE = resolve(`assets/metadata/rehearsal-${REHEARSAL}.json`);
const LOGO_512 = resolve('assets/logo-512.png');
const LOGO_1024 = resolve('assets/logo-1024.png');

// ---- Guard: required input files exist ----
function requireFile(p: string, label: string): void {
  if (!existsSync(p)) {
    console.error(
      `FATAL: ${label} not found at ${p}. ` +
        `Plan 03-01 must complete before Plan 03-03 can run uploads.`,
    );
    process.exit(1);
  }
}
requireFile(JSON_FILE, `rehearsal-${REHEARSAL}.json`);
requireFile(LOGO_512, 'assets/logo-512.png');
requireFile(LOGO_1024, 'assets/logo-1024.png');

// ---- Idempotence guard ----
let artifact: Record<string, unknown> = {
  generated_at: new Date().toISOString(),
  schema_version: 1,
};
if (existsSync(HOSTING_ARTIFACT)) {
  artifact = JSON.parse(readFileSync(HOSTING_ARTIFACT, 'utf8'));
  if ((artifact as Record<string, unknown>)[KEY] && !opts.force) {
    console.log(
      `${KEY} already uploaded at ${((artifact as Record<string, Record<string, string>>)[KEY] as Record<string, string>)?.uploaded_at ?? '<unknown time>'}.`,
    );
    console.log('Pass --force to re-upload.');
    process.exit(0);
  }
}

// ---- Compute GitHub raw URL (both branches use this as mirror) ----
function computeGithubRawUrl(relPath: string): string | null {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf8',
    }).trim();
    // Match both HTTPS and SSH GitHub remotes: git@github.com:owner/repo.git OR https://github.com/owner/repo(.git)
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/);
    if (!match) return null;
    const [, owner, repo] = match;
    return `https://raw.githubusercontent.com/${owner}/${repo}/main/${relPath}`;
  } catch {
    return null;
  }
}
const githubLogo512Url = computeGithubRawUrl('assets/logo-512.png');
const githubLogo1024Url = computeGithubRawUrl('assets/logo-1024.png');
const githubJsonUrl = computeGithubRawUrl(`assets/metadata/rehearsal-${REHEARSAL}.json`);

// ================= BRANCH B: GitHub raw only =================
if (opts.githubOnly) {
  console.log('[Branch B] GitHub raw mirror mode — skipping Arweave upload.');
  if (!githubJsonUrl || !githubLogo512Url) {
    console.error(
      'FATAL: cannot derive GitHub raw URLs — git remote `origin` must point to github.com/<owner>/<repo>.',
    );
    process.exit(1);
  }

  // Rewrite JSON's image field to point at the GitHub raw logo URL
  const json = JSON.parse(readFileSync(JSON_FILE, 'utf8')) as Record<string, unknown>;
  const prevImage = json.image;
  json.image = githubLogo512Url;
  writeFileSync(JSON_FILE, JSON.stringify(json, null, 2) + '\n');
  console.log(`Rewrote ${JSON_FILE} image: ${String(prevImage)} -> ${githubLogo512Url}`);

  (artifact as Record<string, unknown>)[KEY] = {
    mode: 'github-only',
    logo_512_arweave_tx: null,
    logo_512_arweave_url: null,
    logo_1024_arweave_tx: null,
    logo_1024_arweave_url: null,
    json_arweave_tx: null,
    json_arweave_url: null,
    github_raw_url: githubJsonUrl,
    github_logo_512_url: githubLogo512Url,
    github_logo_1024_url: githubLogo1024Url,
    uploaded_via: 'github-raw-only',
    uploaded_at: new Date().toISOString(),
  };
  writeFileSync(HOSTING_ARTIFACT, JSON.stringify(artifact, null, 2) + '\n');
  console.log(`Wrote ${HOSTING_ARTIFACT} (Branch B: GitHub raw only)`);
  console.log(
    '[reminder] Phase 4 mainnet should revisit this decision — Arweave is strongly preferred for permanent on-chain uri durability.',
  );
  process.exit(0);
}

// ================= BRANCH A: Arweave upload via Turbo =================
console.log('[Branch A] Arweave upload via @ardrive/turbo-sdk (SOL-paid).');

// Load devnet proposer keypair — has ~1.79 SOL residual from Phase 2 smoke test.
const KEYPAIR_PATH = resolve('keys/devnet/proposer.json');
requireFile(KEYPAIR_PATH, 'keys/devnet/proposer.json');
const kpBytes = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8')) as number[];
const keypair = Keypair.fromSecretKey(new Uint8Array(kpBytes));
console.log(`Using proposer: ${keypair.publicKey.toBase58()}`);

// Authenticate Turbo with SOL-denominated payment.
// Turbo accepts base58-encoded SOL secret key (64 bytes; secret|public concatenation).
const turbo = TurboFactory.authenticated({
  privateKey: bs58.encode(keypair.secretKey),
  token: 'solana',
});

// Query current Turbo Credits balance.
// winc = "winston credits" (1 AR = 10^12 winc); free-tier covers payloads under ~100 KiB
// so small rehearsal uploads often cost zero.
const balanceResp = await turbo.getBalance();
console.log(
  `Turbo balance: ${balanceResp.winc} winc (effective ${balanceResp.effectiveBalance ?? '<unknown>'})`,
);

// If zero balance, top up with 0.01 SOL (= 10_000_000 lamports).
// This is an on-chain SOL transfer to Turbo's deposit address.
if (String(balanceResp.winc) === '0') {
  console.log('Topping up Turbo with 0.01 SOL worth of credits...');
  const topUp = await turbo.topUpWithTokens({ tokenAmount: 10_000_000 });
  console.log(`Top-up confirmed: id=${topUp.id}`);
}

// ---- Upload logo-512.png ----
const logo512Size = statSync(LOGO_512).size;
console.log(`Uploading logo-512.png (${logo512Size} bytes)...`);
const logo512Result = await turbo.uploadFile({
  fileStreamFactory: () => createReadStream(LOGO_512),
  fileSizeFactory: () => logo512Size,
  dataItemOpts: {
    tags: [
      { name: 'Content-Type', value: 'image/png' },
      { name: 'App-Name', value: 'CAYC-Metadata' },
      { name: 'Rehearsal', value: String(REHEARSAL) },
      { name: 'Variant', value: 'logo-512' },
    ],
  },
});
const logo512Url = `https://arweave.net/${logo512Result.id}`;
console.log(`logo-512 -> ${logo512Url}`);

// ---- Upload logo-1024.png ----
const logo1024Size = statSync(LOGO_1024).size;
console.log(`Uploading logo-1024.png (${logo1024Size} bytes)...`);
const logo1024Result = await turbo.uploadFile({
  fileStreamFactory: () => createReadStream(LOGO_1024),
  fileSizeFactory: () => logo1024Size,
  dataItemOpts: {
    tags: [
      { name: 'Content-Type', value: 'image/png' },
      { name: 'App-Name', value: 'CAYC-Metadata' },
      { name: 'Rehearsal', value: String(REHEARSAL) },
      { name: 'Variant', value: 'logo-1024' },
    ],
  },
});
const logo1024Url = `https://arweave.net/${logo1024Result.id}`;
console.log(`logo-1024 -> ${logo1024Url}`);

// ---- Rewrite JSON's image field to point at Arweave logo-512 URL ----
// This MUST happen before JSON upload so the on-chain uri resolves to a JSON
// whose image field is already the Arweave logo URL (not the PLACEHOLDER string).
const json = JSON.parse(readFileSync(JSON_FILE, 'utf8')) as Record<string, unknown>;
const prevImage = json.image;
json.image = logo512Url;
writeFileSync(JSON_FILE, JSON.stringify(json, null, 2) + '\n');
console.log(`Rewrote ${JSON_FILE} image: ${String(prevImage)} -> ${logo512Url}`);

// ---- Upload the updated JSON ----
const jsonSize = statSync(JSON_FILE).size;
console.log(`Uploading rehearsal-${REHEARSAL}.json (${jsonSize} bytes)...`);
const jsonResult = await turbo.uploadFile({
  fileStreamFactory: () => createReadStream(JSON_FILE),
  fileSizeFactory: () => jsonSize,
  dataItemOpts: {
    tags: [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'CAYC-Metadata' },
      { name: 'Rehearsal', value: String(REHEARSAL) },
      { name: 'Variant', value: 'metadata-json' },
    ],
  },
});
const jsonUrl = `https://arweave.net/${jsonResult.id}`;
console.log(`rehearsal-${REHEARSAL}.json -> ${jsonUrl}`);

// ---- Record in artifact ----
(artifact as Record<string, unknown>)[KEY] = {
  mode: 'arweave-primary',
  logo_512_arweave_tx: logo512Result.id,
  logo_512_arweave_url: logo512Url,
  logo_1024_arweave_tx: logo1024Result.id,
  logo_1024_arweave_url: logo1024Url,
  json_arweave_tx: jsonResult.id,
  json_arweave_url: jsonUrl,
  github_raw_url: githubJsonUrl,
  github_logo_512_url: githubLogo512Url,
  github_logo_1024_url: githubLogo1024Url,
  uploaded_via: '@ardrive/turbo-sdk',
  uploaded_at: new Date().toISOString(),
  uploader_pubkey: keypair.publicKey.toBase58(),
  file_sizes: {
    logo_512_bytes: logo512Size,
    logo_1024_bytes: logo1024Size,
    json_bytes: jsonSize,
  },
};

writeFileSync(HOSTING_ARTIFACT, JSON.stringify(artifact, null, 2) + '\n');
console.log(`Wrote ${HOSTING_ARTIFACT}`);
console.log(
  `\n[next] Sanity-check retrieval (Arweave propagation may take ~1min):\n  curl -fsS ${jsonUrl}`,
);
