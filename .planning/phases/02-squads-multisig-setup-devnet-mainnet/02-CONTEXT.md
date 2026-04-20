# Phase 2: Squads Multisig Setup (Devnet + Mainnet) - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up Squads v4 multisigs on both devnet and mainnet with hardware-wallet signers, derive and document vault PDAs, and rehearse signer rotation — all BEFORE any mint instruction is built. This phase produces the authority structure that holds every on-chain power (mint, freeze, metadata update, permanent delegate) from the very first instruction of Phase 4. No EOA ever holds authority on mainnet at any point.

Scope-deferred to other phases:
- Mint creation + extension init (Phase 4)
- Initial 500M supply mint (Phase 4)
- DEX liquidity / pool seeding (Phase 5)
- Multisig governance migration (v2 / DAO)

</domain>

<decisions>
## Implementation Decisions

### Signer Roster & Threshold

- **Total signers (mainnet):** 5
- **Threshold:** 3-of-5 (majority+1) — research Pitfall 5 convention
- **Signer identity model:** Distributed human roster — user + 4 trusted people (co-founders / advisors / family). Every signer holds their own keys; no single person controls multiple voting keys. This is a real multisig, not a redundancy pattern.
- **Devnet signer roster:** Separate from mainnet. Throwaway keys only. Devnet exists to validate the *shape* of the ceremony (vault PDA derivation, instruction ordering, multisig-signed mint smoke test) — not to exercise the mainnet signer roster. Mainnet ceremony is the first time the real signers use their hardware wallets against this codebase.
- **Role assignment:** All 5 mainnet signers act as voting members (proposer + voter + executor roles in Squads v4 terms). Transaction proposing is delegated to a separate hot wallet — see Hot wallet decision below.

### Hardware & Custody

- **Hardware wallet model:** All Ledger (Nano X or Nano S Plus acceptable). User elected vendor concentration over research's vendor-diversity recommendation — rationale: best Solana tooling maturity, simpler signer onboarding, reduced training overhead. Accepted tradeoff: concentrated vendor risk (a Ledger-wide vulnerability would affect all signers simultaneously).
- **Seed phrase backup:** Metal plates (Cryptosteel, Billfodl, or equivalent) stored in a fireproof safe. Each signer is individually responsible for their own seed backup. Photos, cloud storage, and plain paper are all explicitly forbidden by signer policy.
- **Proposer hot wallet:** Yes — dedicated proposer-only key that is **NOT** a voting member. Holds no authority whatsoever. Exists purely to submit multisig proposal transactions. Standard Squads v4 pattern. Voting signers approve from hardware wallets; no hardware-wallet friction for routine proposing. Hot wallet funded with SOL for gas only.
- **Devnet signer keys:** Plain filesystem keypairs (`solana-keygen new --outfile ...`) stored in `.gitignore`d paths per signer. Never reused on mainnet. Never committed.

### Claude's Discretion

The user deferred these decisions to planning / execution:

- **Ceremony logistics** — remote vs in-person for the mainnet ceremony; date/time coordination; attendance logging format. Claude will plan the lowest-friction approach consistent with "all signers present in the same time window" per the roadmap success criterion.
- **Signer SOL funding** — who funds the ≥0.5 SOL per signer (user from own wallet, treasury transfer, or each signer funds own). Default: user funds all from own wallet pre-ceremony; signers are reimbursed post-launch if that's the social contract.
- **Rotation drill scope** — depth of the devnet rotation rehearsal (add+remove signer only vs also change threshold). Default: exercise both add-signer and remove-signer flows; hold threshold-change as a documented runbook procedure not rehearsed live.
- **Transparency / artifact publication** — real names vs pseudonyms in the public signer roster. Default: pseudonyms (role + handle) in `docs/security/signer-roster.md`, real names kept in a separate private artifact not committed. Timing: commit pseudonymous roster and multisig address to the repo now (Phase 2); defer public website publication to Phase 5 Ops Go-Live.
- **Ceremony transcript depth** — whether to capture full simulated-vs-executed state diffs or only proposal addresses + tx signatures. Default: capture the full state diffs under `artifacts/mainnet-sessions/` for CEX-listing evidence.
- **Ledger firmware requirements** — minimum firmware version, Solana app version, device pre-checks. Default: pin to the current stable Ledger Solana app and document pre-ceremony firmware checks in a runbook.
- **Proposer hot wallet SOL funding/refill procedure** — operational; planned as part of the runbook.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Squads v4 mechanics & ceremony patterns
- `.planning/research/ARCHITECTURE.md` §"System Overview" — on-chain vs off-chain components, vault PDA role
- `.planning/research/ARCHITECTURE.md` §"Pattern 2 (Script-Proposes / Multisig-Signs)" — the architectural pattern this phase embodies
- `.planning/research/ARCHITECTURE.md` §"Build Order" items 3-4 — why Squads setup must precede mint init
- `.planning/research/STACK.md` §"Squads v4 Web UI vs SDK" — devnet creation requires SDK (web UI disables devnet)
- `.planning/research/STACK.md` §"Runtime SDK lane" — `@sqds/multisig@^2.1.4` is the only supported SDK

### Pitfalls this phase must avoid
- `.planning/research/PITFALLS.md` Pitfall 4 — authority transfer window (why mainnet multisig precedes mint init)
- `.planning/research/PITFALLS.md` Pitfall 5 — signer-count / threshold / lockout scenarios; informs the 3-of-5 choice
- `.planning/research/PITFALLS.md` Pitfall 11 — vault PDA vs multisig config account confusion; all authorities point to vault PDA

### Project-level constraints
- `.planning/PROJECT.md` §"Constraints" — Authorities: Squads multisig only (no EOA in production)
- `.planning/PROJECT.md` §"Key Decisions" — Squads multisig for all authorities rationale

### Policy documents that bind signer behavior
- `docs/policies/mint-policy.md` §2 Authority model, §4-5 Conditions for minting, §8 Signer accountability, §12 Legal posture
- `docs/policies/clawback-freeze-policy.md` §6 Approval procedure, §11 Relationship to Mint Policy, §15 Copycat mint acknowledgement

### Symbol collision context (Phase 1 inheritance)
- `docs/symbol-availability-check.md` §"Decision trail" — accept-conflict decision; signer roster artifact should use "CAYC (Cyber Ape Yacht Club 8G)" disambiguation on first reference per the Phase 1 style guide

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1 scaffold)
- `package.json` — pinned `@sqds/multisig@^2.1.4` and `@solana/web3.js@^1.98.4` ready for Squads SDK scripts
- `scripts/` — conventional location for deployment / ceremony scripts; TypeScript (`tsx` runner)
- `artifacts/` — conventional location for deployment artifacts; Phase 2 writes `artifacts/devnet.json` and later `artifacts/mainnet.json`
- `.env.devnet.example` + `.env.mainnet.example` — Helius RPC env var placeholders (`HELIUS_DEVNET_RPC_URL`, `HELIUS_MAINNET_RPC_URL`); signer wallets should use same envs pattern
- `.gitignore` — already blocks `*.keypair.json`, `id.json`, `id-*.json`, `keys/`, `signer*.json`, `vault*.json`, and all `.env*` files. Throwaway devnet signer keys written to `keys/` will be correctly excluded.
- `pnpm lang:audit` + `.husky/pre-commit` — any docs added in this phase (runbooks, signer roster) will be audited for "stablecoin" language; policies' legal-posture sections are already allowlisted

### Established Patterns
- TypeScript + pnpm + ESM (NodeNext) per Phase 1 scaffold
- Deployment scripts should emit append-only JSONL logs under `artifacts/` for ceremony evidence
- Helius as primary RPC (paid plan for mainnet ceremony per STACK.md §"Network & RPC Strategy")
- Every commit runs gitleaks (all keypair / seed / private-key patterns blocked)

### Integration Points
- `src/` — Squads helper module (`src/squads/`) for vault PDA derivation, proposal building, signer listing
- `scripts/squads/create-devnet.ts` — devnet multisig creation via `@sqds/multisig` SDK (web UI disabled)
- `scripts/squads/create-mainnet.ts` — mainnet multisig creation ceremony (hardware-signed, all 5 signers)
- `scripts/squads/verify-vault.ts` — read-only verification: multisig config, vault PDA, threshold, members roster
- `scripts/squads/rotate-signer.ts` — rotation drill: add-signer, remove-signer
- `artifacts/devnet.json` / `artifacts/mainnet.json` — pinned addresses and ceremony metadata (append-only source of truth)
- `docs/security/signer-roster.md` — pseudonymous signer roster (role + handle) for repo; private real-names artifact kept outside the repo

</code_context>

<specifics>
## Specific Ideas

- User explicitly chose Ledger-only over vendor-diverse hardware against research recommendation — rationale is Solana tooling maturity and signer onboarding simplicity. Concentrated vendor risk is an accepted tradeoff.
- Devnet ceremony is intentionally a shape-check, not a rehearsal with the real roster. The real roster appears for the first time at the mainnet ceremony. This is a deliberate choice to avoid hardware-wallet friction slowing devnet iteration.
- The proposer-only hot wallet pattern is important for day-to-day operations once the multisig is live — not just a Phase 2 convenience. Plans should provision this wallet properly (SOL funding, refill procedure, monitoring) rather than treating it as an afterthought.
- Phase 2 is the first phase where real hardware-wallet infrastructure is required. The human prerequisites (each of the 5 signers has a Ledger, has created a seed, has metal-plate backup stored, has installed the Solana app) are NOT themselves Phase 2 tasks — they are assumed complete before Phase 2 execution begins. Plans should include a pre-flight checklist that verifies all 5 signers are ready.

</specifics>

<deferred>
## Deferred Ideas

- **Geographic distribution of signers** — not specified by user. Deferred as a "nice to have" per research; mention in signer-roster template as a recommendation but don't block.
- **Signer compensation / signer-agreement contract** — operational / legal document, not Phase 2 code. Deferred; revisit during Phase 5 Ops Go-Live as part of the signer-accountability policy rollout.
- **Squads v4 "spending limits" feature** — allows lower-risk operations without full multisig approval. Not needed for Phase 2 setup; consider for Phase 5 Ops if daily operational volume makes full-multisig-per-tx painful.
- **DAO / on-chain governance migration path** — v2 milestone, explicitly out of v1 scope per PROJECT.md.
- **Break-glass / emergency signer** — not in scope; 3-of-5 with 2-key-loss tolerance is the designed resilience model.
- **Signer rotation automation / scheduled key refreshes** — Phase 6+ operational concern.

</deferred>

---

*Phase: 02-squads-multisig-setup-devnet-mainnet*
*Context gathered: 2026-04-20*
