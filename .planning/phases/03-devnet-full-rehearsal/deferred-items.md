# Phase 3 — Deferred / Out-of-Scope Items

Items discovered during plan execution that are outside the current plan's scope. Owner plans noted.

## From Plan 03-03 Task 1 (2026-04-20)

### Typecheck failure in `scripts/deploy/verify-mint.ts` (owned by Plan 03-02)

**Observed:** During Plan 03-03 Task 1 verification gate (`pnpm typecheck`), the following error surfaced:

```
scripts/deploy/verify-mint.test.ts(43,10): error TS2724: '"@solana/spl-token-metadata"' has no exported member named 'getTokenMetadata'. Did you mean 'TokenMetadata'?
scripts/deploy/verify-mint.ts(37,10): error TS2724: '"@solana/spl-token-metadata"' has no exported member named 'getTokenMetadata'. Did you mean 'TokenMetadata'?
```

**Analysis:** `@solana/spl-token-metadata@0.1.6` does not export `getTokenMetadata` — the helper lives in a different package (likely `@solana/spl-token` or exported differently). Plan 03-02 (verify-mint) is the owner; its interface block assumed the wrong export location.

**Pre-existing RED state:** Plan 03-02's RED commit (`0e1c8ee`) intentionally committed failing tests. Plan 03-02's GREEN phase (`scripts/deploy/verify-mint.ts`) has since been added (untracked at the time of this entry, visible via `git status`) but inherits the same bad import.

**Scope boundary:** Not fixing from Plan 03-03 — this is Plan 03-02's GREEN-phase responsibility. Plan 03-02's executor should resolve before its final commit.

**Impact on Plan 03-03:** Pre-commit hook's Step 4 (`pnpm typecheck`) will fail on any commit while Plan 03-02 is mid-flight. Plan 03-03's own file (`scripts/assets/upload-metadata.ts`) typechecks cleanly in isolation.

**Resolution path:** Plan 03-02 executor will import `getTokenMetadata` from the correct source (likely `@solana/spl-token`'s metadata extension helpers, e.g., `getTokenMetadata` from `@solana/spl-token-metadata` exists in newer versions, or the correct v0.1.6 API is `unpack`/`pack` of the bytes). Once 03-02 commits the fix, Plan 03-03's remaining work (Task 3 post-checkpoint) will pass typecheck cleanly.
