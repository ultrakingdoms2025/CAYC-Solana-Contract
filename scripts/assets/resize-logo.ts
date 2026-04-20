#!/usr/bin/env -S tsx
/**
 * scripts/assets/resize-logo.ts
 *
 * Resize assets/logo.png (5863x4529 source) to 512x512 + 1024x1024 PNG
 * derivatives via sharp, producing wallet-friendly files under 100 KB each.
 *
 * Behavior:
 *   1. If assets/logo.png still exists AND assets/logo-source.png does NOT,
 *      rename the original to assets/logo-source.png (preserves git history).
 *   2. Re-reads assets/logo-source.png and produces assets/logo-{512,1024}.png
 *      via sharp's fit:'contain' with transparent padding (preserves aspect).
 *      Uses compressionLevel 9 + palette:true for maximum lossless compression.
 *   3. Fails fast if either derivative exceeds MAX_BYTES (100 KB).
 *
 * Idempotent: re-running against an already-renamed source regenerates the
 * derivatives deterministically; the size gate still enforces the 100 KB cap.
 *
 * No oxipng dependency: sharp's palette + compressionLevel:9 output for this
 * source lands comfortably under 100 KB at both sizes (measured ~25-60 KB).
 * If a future source pushes either derivative over the cap, add an oxipng
 * pass here (oxipng-bin npm pkg or system binary) — but do NOT silently skip
 * the cap.
 *
 * Part of Plan 03-01 (Phase 3 Devnet Full Rehearsal).
 */
import sharp from 'sharp';
import { existsSync, renameSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_ORIGINAL = resolve('assets/logo.png');
const SRC_RENAMED = resolve('assets/logo-source.png');
const OUT_512 = resolve('assets/logo-512.png');
const OUT_1024 = resolve('assets/logo-1024.png');
const MAX_BYTES = 100 * 1024; // 100 KB wallet-display cap

async function main(): Promise<void> {
  // Step 1: preserve original via rename (idempotent — only if target missing)
  if (existsSync(SRC_ORIGINAL) && !existsSync(SRC_RENAMED)) {
    renameSync(SRC_ORIGINAL, SRC_RENAMED);
    console.log(`[resize-logo] Renamed ${SRC_ORIGINAL} -> ${SRC_RENAMED}`);
  } else if (existsSync(SRC_RENAMED)) {
    console.log(`[resize-logo] Using existing ${SRC_RENAMED}`);
  }

  if (!existsSync(SRC_RENAMED)) {
    throw new Error(
      `[resize-logo] Source ${SRC_RENAMED} not found; cannot proceed.`,
    );
  }

  // Log source dims for the transcript record
  const srcMeta = await sharp(SRC_RENAMED).metadata();
  console.log(
    `[resize-logo] Source: ${srcMeta.width}x${srcMeta.height} ${srcMeta.format} ${srcMeta.channels}ch`,
  );

  // Step 2: generate 512 + 1024 derivatives
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  await sharp(SRC_RENAMED)
    .resize(512, 512, { fit: 'contain', background: transparent })
    .png({ compressionLevel: 9, palette: true })
    .toFile(OUT_512);
  await sharp(SRC_RENAMED)
    .resize(1024, 1024, { fit: 'contain', background: transparent })
    .png({ compressionLevel: 9, palette: true })
    .toFile(OUT_1024);

  // Step 3: size gate
  let allPass = true;
  for (const f of [OUT_512, OUT_1024]) {
    const size = statSync(f).size;
    const pct = ((size / MAX_BYTES) * 100).toFixed(1);
    const flag = size > MAX_BYTES ? 'FAIL' : 'OK';
    console.log(`[resize-logo] ${f}: ${size} bytes (${pct}% of cap) ${flag}`);
    if (size > MAX_BYTES) {
      allPass = false;
    }
  }
  if (!allPass) {
    throw new Error(
      `[resize-logo] One or more derivatives exceed ${MAX_BYTES} bytes (100 KB). Add an oxipng pass or reduce source complexity.`,
    );
  }
  console.log('[resize-logo] OK — both derivatives under 100 KB.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
