# CAYC Policies

This directory is the canonical source of truth for CAYC's public policies. Every policy here is a **draft** source; policies become binding on the dates they are published to `caycsolana.com` during Phase 5 Ops Go-Live.

## Policies

| Policy                             | Status                 | Version | File                                                              |
| ---------------------------------- | ---------------------- | ------- | ----------------------------------------------------------------- |
| Mint Policy                        | Draft (Phase 1 POL-02) | v1.0    | [Mint Policy](./mint-policy.md)                                   |
| Clawback & Freeze Authority Policy | Draft (Phase 1 POL-03) | v1.0    | [Clawback & Freeze Authority Policy](./clawback-freeze-policy.md) |

## Scope

These policies govern the on-chain behavior of the CAYC Token-2022 mint and the authorities held by the Squads v4 multisig. Together they define:

- **Supply** (when new CAYC may be minted, how much, and with what notice): Mint Policy.
- **Account-level intervention** (when and how a token account may be frozen or its contents clawed back): Clawback & Freeze Authority Policy.

## What these policies do NOT cover

- **Peg mechanics.** CAYC is a branded payments token, USDC-referenced. Its price is determined by market liquidity and arbitrage, not by a reserve. There is no "break-peg" procedure because there is no peg contract to break.
- **Distribution of the initial 500M supply beyond the treasury.** The treasury holds 100% of the initial supply; future distribution decisions will be documented separately when made, not here.
- **Operational runbooks.** The step-by-step procedures signers follow are defined in `docs/runbooks/` (Phase 5 Ops Go-Live deliverable). Runbooks implement these policies; they do not amend them.

## Versioning

- **v1.0** is the initial draft.
- Editorial changes (typo fixes, clarifications that don't change scope) bump the patch version (1.0.x).
- Substantive changes bump the minor version (1.x) with a 14-day public notice.
- Scope-broadening changes bump the major version (2.0) with a 14-day public notice and a distinct rationale memo.

## Where these policies are published

These Markdown files are the **source of truth**. The publication targets are:

- `caycsolana.com/policies/mint-policy` (Phase 5 Ops Go-Live)
- `caycsolana.com/policies/clawback-freeze-policy` (Phase 5 Ops Go-Live)
- Mirrored and permanent in the CAYC repository (this directory).

When Phase 5 publishes the web copies, this README will be updated to link out to them.

## Contact

- General policy questions: `policy@caycsolana.com` (routes to the multisig operator group)
- Freeze / clawback complaints: `compliance@caycsolana.com`
- GitHub Issues: tag `policy` for general, `mint-policy` / `freeze-policy` / `freeze-complaint` for specific.

## Related documents

- `../symbol-availability-check.md` — POL-01 symbol conflict check (Plan 01-01).
- `../style-guide.md` — POL-04 public-copy language rules (Plan 01-04; may not yet exist when reading this).
- `../../README.md` — repository overview.
- `../../.planning/ROADMAP.md` — project roadmap.
