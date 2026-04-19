# CAYC Solana Contract

Reference repository for the launch of **CAYC — Cyber Ape Yacht Club 8G**, a Solana **Token-2022 branded payments token, USDC-referenced** (deliberately NOT a stablecoin — see below).

> **Legal-posture note:** Under the US GENIUS Act (signed 18 July 2025) and EU MiCA, "stablecoin" is a regulated term with criminal penalties for false advertising. CAYC has no reserves and is not a regulated stablecoin. All public copy uses "branded payments token, USDC-referenced" or equivalent. See `docs/policies/` and `docs/style-guide.md` (Phase 1 Plan 04) for language rules.

## What's in this repo

- `src/` — TypeScript source (deployment helpers, Squads proposal builders — populated in Phase 3+)
- `scripts/` — Ceremony + ops scripts (populated in Phase 3+)
- `docs/policies/` — Mint Policy + Clawback/Freeze Policy (Phase 1 Plan 03)
- `docs/` — Other project documentation (style guide, symbol availability, runbooks)
- `artifacts/` — On-chain artifact registry (devnet.json, mainnet.json, ceremony transcripts — populated in Phase 3–4)
- `tests/` — Bankrun + Vitest unit tests (populated in Phase 3+)
- `.planning/` — Planning artifacts (research, phase plans, state)

## System-level prerequisites (install once per machine)

- **Agave CLI 3.1.13** (Solana CLI — includes `solana`, `solana-keygen`, `spl-token`, `solana-test-validator`). Install:
  - macOS / Linux: `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"`
  - Windows: download from https://github.com/anza-xyz/agave/releases/tag/v3.1.13
  - Verify: `solana --version` reports `solana-cli 3.1.13` or newer stable.
- **Node.js 20 LTS** (20.18+). Verify: `node --version` reports `v20.18.0+`.
- **pnpm 10+**. Install: `npm install -g pnpm@10`. Verify: `pnpm --version` reports `10.x`.
- **Gitleaks** (for pre-commit secret scanning). Install:
  - macOS: `brew install gitleaks`
  - Linux: `curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz | tar -xz && sudo mv gitleaks /usr/local/bin/`
  - Windows: `scoop install gitleaks` OR download release binary from https://github.com/gitleaks/gitleaks/releases
  - Verify: `gitleaks version` returns a version string.

## Project-level setup

```bash
pnpm install            # installs dependencies + triggers husky pre-commit hook setup
pnpm typecheck          # verifies the TypeScript config compiles (no emit)
pnpm format:check       # verifies formatting
pnpm gitleaks           # scans the repo for secrets

# Set up local env (never committed):
cp .env.example .env
cp .env.devnet.example .env.devnet
cp .env.mainnet.example .env.mainnet
# Fill in the Helius RPC URLs (get from https://dashboard.helius.dev/)
```

## Secret hygiene (hard rules)

- **Never commit keypair files.** `.gitignore` blocks `*.keypair.json`, `id*.json`, `keys/`, `*.env`. Gitleaks pre-commit hook is the safety net.
- **Keypair paths, not keypair contents, go in `.env`.** e.g., `DEPLOYER_KEYPAIR_PATH=~/.config/solana/id-devnet.json`.
- **Mainnet authority is hardware-wallet only.** No JSON keypair ever holds mainnet mint/freeze/update authority.
- **Separate env files per network** (`.env.devnet`, `.env.mainnet`) prevent cross-network misfires.

## Pinned versions (Phase 1 Success Criterion 4)

| Dependency          | Pin     | Source                                                                       |
| ------------------- | ------- | ---------------------------------------------------------------------------- |
| Agave CLI           | 3.1.13  | System-level; verify with `solana --version`                                 |
| `@solana/web3.js`   | ^1.98.4 | `package.json` dependencies                                                  |
| `@solana/spl-token` | ^0.4.14 | `package.json` dependencies                                                  |
| `@sqds/multisig`    | ^2.1.4  | `package.json` dependencies                                                  |
| Node.js             | 20.18.0 | `.nvmrc` + `package.json` engines                                            |
| pnpm                | 10.33.0 | `package.json` packageManager                                                |
| TypeScript          | ~5.6.0  | `package.json` devDependencies (pinned; do NOT adopt TS 6.x — ecosystem lag) |

See `.planning/research/STACK.md` for rationale on each pin.

## Project status

Phase 1 of 7: Foundation — Policy, Legal, Dev Environment. See `.planning/ROADMAP.md`.

## Scaffold verification (Phase 1 Plan 02)

The following commands must all pass on a fresh clone after `pnpm install`. They are the contract the Phase 1 scaffold establishes:

```bash
pnpm typecheck           # TypeScript compiles cleanly (no errors, no emit)
pnpm format:check        # Prettier says formatting is consistent
pnpm gitleaks            # No secrets in committed tree
git config core.hooksPath # Returns .husky/_ under Husky v9 (the shim directory sources .husky/pre-commit)
```

If any of these fails on main, the scaffold has regressed and must be fixed before any on-chain work proceeds.
