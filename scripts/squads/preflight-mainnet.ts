#!/usr/bin/env -S tsx
/**
 * Mainnet ceremony preflight - Plan 02-04 Task 2.
 *
 * Runs the automated portion of docs/runbooks/mainnet-squads-ceremony-preflight.md
 * Stage E. Writes artifacts/mainnet-preflight.json with per-item pass/fail.
 * Plan 02-05 (ceremony) reads this file and refuses to proceed unless overall=pass.
 *
 * IMPORTANT: this script is READ-ONLY on mainnet. It sends no transactions.
 * The only requirement is that CONFIRM_MAINNET=yes-mainnet-ceremony is set,
 * because loadEnv asserts it - the guard prevents accidental runs from a
 * developer laptop before the operator is ready.
 *
 * API-KEY HYGIENE: The Helius RPC URL typically has the API key in the query
 * string (e.g., https://mainnet.helius-rpc.com/?api-key=...). The preflight
 * artifact MUST NOT leak that key. We strip the query string entirely when
 * recording the endpoint in detail strings - only hostname+path are recorded.
 * A defense-in-depth check at finalize-time refuses to write the artifact if
 * any "api-key=" substring is detected anywhere in the serialized JSON.
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadEnv, expandHome } from '../../src/env/load.js';
import { buildConnection } from '../../src/squads/index.js';

type Check = {
  id: string;
  description: string;
  pass: boolean;
  detail: string;
};
const checks: Check[] = [];

/** Strip query string (and anything resembling "api-key=…") from a URL for safe recording. */
function safeEndpoint(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    // Fallback: strip everything after first '?'
    return url.split('?')[0] ?? '';
  }
}

function check(id: string, description: string, pass: boolean, detail: string): void {
  checks.push({ id, description, pass, detail });
  const marker = pass ? 'PASS' : 'FAIL';
  console.log(`[${marker}] ${id} - ${description}`);
  if (!pass) console.log(`       ${detail}`);
}

function readGitSha(): string | null {
  try {
    const out = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
    return out.trim();
  } catch {
    return null;
  }
}

async function finalize(): Promise<never> {
  const overall = checks.every((c) => c.pass) ? 'pass' : 'fail';
  const artifact = {
    generated_at: new Date().toISOString(),
    commit_sha: readGitSha(),
    overall,
    check_count: checks.length,
    pass_count: checks.filter((c) => c.pass).length,
    checks,
  };
  const json = JSON.stringify(artifact, null, 2) + '\n';
  // Defense-in-depth: if somehow "api-key=" ended up in the artifact text, refuse to write it.
  if (/api[-_]?key\s*=/i.test(json)) {
    console.error(
      "FATAL: refusing to write preflight artifact — 'api-key=' substring detected. Check safeEndpoint() usage.",
    );
    process.exit(2);
  }
  writeFileSync(resolve('artifacts/mainnet-preflight.json'), json);
  console.log('\n---');
  console.log(
    `Overall: ${overall.toUpperCase()} (${artifact.pass_count}/${artifact.check_count} passed)`,
  );
  console.log('Wrote artifacts/mainnet-preflight.json');
  process.exit(overall === 'pass' ? 0 : 1);
}

// ---- E0: .env.mainnet exists ----
const envExists = existsSync(resolve('.env.mainnet'));
check(
  'E0',
  '.env.mainnet exists',
  envExists,
  envExists ? 'ok' : 'copy .env.mainnet.example to .env.mainnet and fill values',
);

if (!envExists) {
  await finalize();
}

// ---- E1: CONFIRM_MAINNET guard + env loaded ----
try {
  loadEnv('mainnet-beta');
  check('E1', 'CONFIRM_MAINNET=yes-mainnet-ceremony and env loaded', true, 'ok');
} catch (err) {
  check('E1', 'CONFIRM_MAINNET=yes-mainnet-ceremony and env loaded', false, (err as Error).message);
  await finalize();
}

// ---- E2: HELIUS_MAINNET_RPC_URL set and not placeholder ----
const rpcUrl = process.env.HELIUS_MAINNET_RPC_URL ?? '';
const rpcOk = rpcUrl.length > 0 && !rpcUrl.includes('REPLACE_WITH_');
check(
  'E2',
  'HELIUS_MAINNET_RPC_URL set (not placeholder)',
  rpcOk,
  rpcOk ? `endpoint: ${safeEndpoint(rpcUrl)}` : 'set to a real Helius mainnet URL',
);

// ---- E3: Connection reachable (getLatestBlockhash + slot) ----
let connectionOk = false;
if (rpcOk) {
  try {
    const connection = buildConnection('mainnet-beta', 'confirmed');
    const blockhash = await connection.getLatestBlockhash();
    const slot = await connection.getSlot('confirmed');
    connectionOk = blockhash.blockhash.length > 0 && slot > 0;
    check('E3', 'Mainnet RPC reachable', connectionOk, `slot=${slot}`);
  } catch (err) {
    check('E3', 'Mainnet RPC reachable', false, (err as Error).message);
  }
} else {
  check('E3', 'Mainnet RPC reachable', false, 'skipped - E2 failed');
}

// ---- E4: Proposer keypair path configured + file exists + pubkey loadable ----
const proposerPath = expandHome(process.env.MAINNET_PROPOSER_KEYPAIR_PATH ?? '');
let proposerPubkey: PublicKey | null = null;
if (proposerPath && existsSync(proposerPath)) {
  try {
    const arr = JSON.parse(readFileSync(proposerPath, 'utf8')) as number[];
    proposerPubkey = Keypair.fromSecretKey(new Uint8Array(arr)).publicKey;
    check('E4', 'Proposer keypair loadable', true, `pubkey=${proposerPubkey.toBase58()}`);
  } catch (err) {
    check('E4', 'Proposer keypair loadable', false, (err as Error).message);
  }
} else {
  check(
    'E4',
    'Proposer keypair loadable',
    false,
    `MAINNET_PROPOSER_KEYPAIR_PATH not set or file missing: ${proposerPath}`,
  );
}

// ---- E5: Proposer balance >= 2 SOL ----
if (connectionOk && proposerPubkey) {
  try {
    const connection = buildConnection('mainnet-beta', 'confirmed');
    const bal = await connection.getBalance(proposerPubkey, 'confirmed');
    const sol = bal / 1_000_000_000;
    check('E5', 'Proposer balance >= 2 SOL', sol >= 2, `${sol.toFixed(4)} SOL`);
  } catch (err) {
    check('E5', 'Proposer balance >= 2 SOL', false, (err as Error).message);
  }
} else {
  check('E5', 'Proposer balance >= 2 SOL', false, 'skipped - prerequisites failed');
}

// ---- E6-E10: Candidate voting signer pubkeys each have >= 0.5 SOL ----
if (connectionOk) {
  const connection = buildConnection('mainnet-beta', 'confirmed');
  for (let i = 1; i <= 5; i++) {
    const envKey = `MAINNET_SIGNER_${i}_PUBKEY`;
    const pkStr = process.env[envKey];
    if (!pkStr) {
      check(
        `E${5 + i}`,
        `${envKey} set`,
        false,
        `${envKey} not set in .env.mainnet - coordinator must populate Stage B before ceremony`,
      );
      continue;
    }
    try {
      const pk = new PublicKey(pkStr);
      const bal = await connection.getBalance(pk, 'confirmed');
      const sol = bal / 1_000_000_000;
      check(
        `E${5 + i}`,
        `Signer ${i} balance >= 0.5 SOL (${pk.toBase58()})`,
        sol >= 0.5,
        `${sol.toFixed(4)} SOL`,
      );
    } catch (err) {
      check(`E${5 + i}`, `Signer ${i} balance check`, false, (err as Error).message);
    }
  }
} else {
  for (let i = 1; i <= 5; i++) {
    check(`E${5 + i}`, `Signer ${i} balance check`, false, 'skipped - RPC unreachable');
  }
}

// ---- E11: Devnet smoke test still in place ----
const smokePath = resolve('artifacts/devnet-sessions/smoke-test-mint.md');
const devnetArtifactPath = resolve('artifacts/devnet.json');
let smokeOk = false;
let smokeDetail = '';
if (existsSync(smokePath) && existsSync(devnetArtifactPath)) {
  const content = readFileSync(smokePath, 'utf8');
  const dev = JSON.parse(readFileSync(devnetArtifactPath, 'utf8'));
  smokeOk = content.includes('PROOF OK') && dev.devnet_smoke_test?.execute_tx != null;
  smokeDetail = smokeOk
    ? `execute_tx=${dev.devnet_smoke_test.execute_tx}`
    : "smoke-test-mint.md lacks 'PROOF OK' marker OR artifact lacks devnet_smoke_test.execute_tx";
} else {
  smokeDetail = 'smoke-test-mint.md or devnet.json missing - Plan 02-03 must be re-run';
}
check(
  'E11',
  'Devnet smoke test (Plan 02-03) intact - PROOF OK + artifact execute_tx present',
  smokeOk,
  smokeDetail,
);

// ---- Finalize ----
await finalize();
