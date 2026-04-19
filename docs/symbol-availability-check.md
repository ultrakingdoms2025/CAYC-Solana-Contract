# CAYC Symbol Availability Check

**Requirement:** POL-01
**Check date (UTC):** 2026-04-19 20:32
**Checked by:** automated query via execute-plan (CAYC Foundation Phase 1, Plan 01-01)

## Summary

**Verdict:** CONFLICT

**One-line conclusion:** CAYC symbol conflict detected on Jupiter and (by on-chain inference) Solscan; naming decision required before any on-chain work.

## Platform Results

### 1. Jupiter (verified.jup.ag + tokens.jup.ag)

- **Query URL(s):**
  - `https://lite-api.jup.ag/tokens/v1/tagged/verified` (legacy verified list endpoint — **returned HTTP 404 "Route not found"**; endpoint deprecated in Jupiter's API migration)
  - `https://lite-api.jup.ag/ultra/v1/search?query=CAYC` (current authoritative search — **returned HTTP 200**)
  - `https://tokens.jup.ag/tokens?tags=community` (legacy community list — failed to connect, HTTP 000, endpoint deprecated; superseded by the Ultra search API which aggregates verified + unverified tradable mints)
- **Query timestamp (UTC):** 2026-04-19 20:28
- **Raw result (Jupiter Ultra V1 search, filtered for CAYC exact symbol match):**
  ```json
  {
    "id": "9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump",
    "name": "Clawed Ape Yacht Club",
    "symbol": "CAYC",
    "decimals": 6,
    "tokenProgram": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    "createdAt": "2026-02-27T02:49:41Z",
    "tags": ["unknown", "token-2022"],
    "organicScoreLabel": "low",
    "holderCount": 47,
    "mcap": 1650.0709351443222,
    "launchpad": "pump.fun",
    "dev": "8WQWdJ91Fj1XN89gHXYWpB8suBatMWu5EyyZDos4qqqC",
    "audit": {
      "mintAuthorityDisabled": true,
      "freezeAuthorityDisabled": true,
      "topHoldersPercentage": 1.13,
      "devMigrations": 1,
      "devMints": 1,
      "highSingleOwnership": true
    }
  }
  ```
- **Raw result (full Ultra search result list, 20 tokens returned; only 1 exact CAYC symbol match):**
  ```
  CAYC       | Clawed Ape Yacht Club      | 9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump | Token-2022
  CAYCOIN    | Cayman Islands             | DuCHmuQzBUiqwY4LjfAHhqgJyynUxDb9bXkPE4T9pump | SPL Token
  caycee     | caycee antunee             | X9wJi5nJQ67YTem5txHNwezi3Q92nS6S5By4KkNpump  | Token-2022
  CAYCOIN    | Cayman Islands Official    | EQgHUEvcYBpUGjBdUtamf4HV1vk6paoUubzErEaBpump | SPL Token
  CAYCISOL   | caycisol                   | CML7V78gZ4HYHhFedPMMwVi2gGv1a1Ppo3AFZE1AbXz  | SPL Token
  CAY        | CAY COIN                   | 7B8yWtkJcrLmsapopiPtbUHVyw1s4qgTKCQckZD7mHs8 | SPL Token
  (14 additional "Capy*" / "capycha*" results omitted — none match CAYC symbol)
  ```
- **Matches found:** 1 token with exact symbol `CAYC` — mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` (Token-2022 program, pump.fun launchpad, 47 holders, $1.65k market cap, not Jupiter-verified, organic score "low"). Zero tokens with name containing "cyber ape yacht".
- **Verdict for Jupiter:** CONFLICT
- **Notes:** The conflicting mint is a pump.fun Token-2022 launch (Feb 27, 2026) named "Clawed Ape Yacht Club" — a deliberate name collision pattern. It is not currently in Jupiter's verified-tag set (organic score "low", tagged only "unknown"/"token-2022"), but listing submissions on Jupiter Verify V3 reject duplicate symbols regardless of the squatter's verified status. This conflict will block Jupiter Verify acceptance unless the squatter loses visibility (unlikely) or CAYC applies disambiguation ("Cyber Ape Yacht Club" full-name form). `mintAuthorityDisabled: true` on the squatter means its supply is fixed; `highSingleOwnership: true` is typical of dead pump.fun tokens, but the mint record itself persists indefinitely.

### 2. Solscan

- **Query URL(s):**
  - `https://api-v2.solscan.io/v2/search?keyword=CAYC` — **HTTP 403 Cloudflare challenge** (Solscan's internal API enforces a managed JS challenge; cannot be programmatically queried without a browser-resident cookie, and the public `public-api.solscan.io/token/list?symbol=CAYC&limit=10` returned HTTP 404, confirming that endpoint is deprecated).
  - `https://solscan.io/search?keyword=CAYC` — **HTTP 404** for direct fetch; the page is client-side rendered and the result set is not available in server-rendered HTML.
  - `https://solscan.io/token/9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump` — HTTP 200 but SPA shell (no server-rendered token metadata); confirms the URL exists but rendering happens in the browser.
  - **Authoritative fallback: Solana mainnet RPC** — `https://api.mainnet-beta.solana.com` `getAccountInfo` for the conflicting mint, returning the raw Token-2022 account data. Solscan indexes every mainnet mint, so on-chain state is the ground truth Solscan displays.
- **Query timestamp (UTC):** 2026-04-19 20:29
- **Raw result (Solana mainnet RPC `getAccountInfo`, base64-decoded relevant bytes):**
  ```json
  {
    "jsonrpc": "2.0",
    "result": {
      "context": { "apiVersion": "3.1.13", "slot": 414329332 },
      "value": {
        "owner": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        "lamports": 3834960,
        "executable": false,
        "space": 423
      }
    }
  }
  ```
  Base64 data decodes to include the Token-2022 metadata extension with the ASCII strings `Clawed Ape Yacht Club` (name) and `CAYC` (symbol), at mint `9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump`. Owner = Token-2022 program, confirmed on-chain at slot 414329332.
- **Matches found:** 1 — the same mint that appears in Jupiter Ultra (`9JqkhuAU5P7Kyg3WxaTcuYT85AahyvXHr1duxakXpump`) is a live mainnet mint owned by the Token-2022 program with on-chain metadata declaring symbol `CAYC`. Because Solscan mirrors on-chain state, this mint's Solscan page will display symbol `CAYC`. No Solscan "verified" badge information is available without browser access, but any CAYC mint we launch would be the second mainnet mint claiming that symbol, and Solscan's token-update submission process treats symbol collision as a visibility/branding conflict (users searching "CAYC" on Solscan will see both mints).
- **Verdict for Solscan:** CONFLICT
- **Notes:** Inferred-with-high-confidence from authoritative Solana RPC data. Solscan's direct API returns HTTP 403 due to Cloudflare bot protection; manual re-verification through a human browser session is advised before the mainnet ceremony (Phase 4) to capture Solscan's specific UI state (dual-listing presentation, any "verified" labelling) but the underlying conflict — two mainnet mints declaring `symbol=CAYC` — is fact, not inference.

### 3. CoinGecko

- **Query URL:** `https://api.coingecko.com/api/v3/search?query=CAYC`
- **Query timestamp (UTC):** 2026-04-19 20:29
- **Raw result:**
  ```json
  {
    "coins": [],
    "exchanges": [],
    "icos": [],
    "categories": [],
    "nfts": []
  }
  ```
- **Matches found:** 0. Zero coins with symbol `CAYC` (case-insensitive), zero names containing "cyber ape yacht", zero platform entries on Solana or any other chain.
- **Verdict for CoinGecko:** AVAILABLE
- **Notes:** CoinGecko's public search API returned a completely empty result set. The Jupiter-squatting pump.fun mint has not been listed on CoinGecko (expected — it has ~$1.65k mcap, ~47 holders, and CoinGecko requires sustained trading volume before listing). A CAYC submission to CoinGecko under "Payments" or "Ecosystem Token" category is not blocked at the search layer.

### 4. CoinMarketCap

- **Query URL:**
  - `https://api.coinmarketcap.com/data-api/v3/map/all?symbol=CAYC&listingStatus=active` (CMC's own data-api; authoritative active-listings map)
  - `https://coinmarketcap.com/currencies/?q=CAYC` (public search UI — page loaded but is a browse page, not a query-filtered search results page; the data-api map above is the canonical check)
  - `https://api.coinmarketcap.com/dexer/v3/dexer/search/main-site?keyword=CAYC&all=false` (CMC dexer search — **HTTP 503 "no healthy upstream"** during test window, retried with same result; data-api map is the authoritative substitute)
- **Query timestamp (UTC):** 2026-04-19 20:31
- **Raw result (filtered from the CMC active cryptoCurrencyMap — 8,415 active listings scanned):**
  ```json
  {
    "filter_criteria": "symbol == 'CAYC' (case-insensitive) OR name contains 'cayc' / 'cyber ape yacht'",
    "cryptoCurrencyMap_scanned_count": 8415,
    "exact_CAYC_symbol_matches": [],
    "name_substring_matches": []
  }
  ```
- **Matches found:** 0. Scanning 8,415 CMC active-status cryptocurrency listings produced zero exact-symbol matches for `CAYC` and zero name-substring matches for "cayc" or "cyber ape yacht".
- **Verdict for CoinMarketCap:** AVAILABLE
- **Notes:** The CMC map endpoint returns the authoritative list of active cryptocurrency listings CMC tracks. Zero results confirm no existing CMC listing uses the CAYC symbol. The dexer search microservice was degraded ("no healthy upstream") during the query window, but the cryptoCurrencyMap endpoint is the canonical source for listing conflict checks and is unaffected. The Jupiter squatter mint (pump.fun, $1.65k mcap) is not listed on CMC for the same reason as CoinGecko — CMC requires sustained exchange/DEX volume thresholds that squatter mints don't meet.

## Methodology notes

- "Match" = any token with `symbol == "CAYC"` (case-insensitive) regardless of chain or verification status, OR any token whose `name` contains "cyber ape yacht" or similar brand collision phrases.
- A match on any single platform is treated as a CONFLICT that blocks mainnet metadata finalization until a naming decision is made, because listing submissions on each platform will reject duplicate symbols.
- Jupiter's Ultra V1 search API supersedes the deprecated `/tokens/v1/tagged/verified` endpoint and aggregates every Jupiter-tradable mint (verified + community + unknown) — verified status is surfaced via the `tags` array and `organicScoreLabel`. Using Ultra V1 gives a strict-superset check compared to the verified-list-only approach.
- Solscan's internal API is behind a Cloudflare managed challenge that cannot be bypassed without a browser session. The authoritative substitute for a symbol-conflict check on Solscan is the Solana mainnet RPC itself, because Solscan indexes all mainnet mints mechanically — if a mint exists on-chain with `symbol=CAYC`, Solscan will render it.
- CoinMarketCap's public `data-api/v3/map/all` is authoritative for active-listing conflicts; the dexer/search microservice was degraded during the query window but is not the canonical source.
- This check must be re-run immediately before the mainnet ceremony (Phase 4) to catch new squatters launched between now and then. This document establishes the Phase 1 baseline.

## Re-check cadence

- This check SHOULD be re-run within 7 days before the mainnet ceremony (Phase 4) and within 7 days before each listing submission (Phase 5/6).
- Replace this file's date/time and verdict each time the check is re-run; never delete prior runs — append a new "Check date" section above the previous one so the history is preserved.
- Query timestamp (UTC): 2026-04-19 20:32 (overall verdict compiled)

## Decision trail

{Task 2 of this plan populates this section with the final decision.}
