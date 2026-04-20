#!/usr/bin/env bash
# POL-04 Language audit — enforces docs/style-guide.md on public-facing copy.
# Usage:
#   bash scripts/check-language.sh              # scan all configured paths
#   bash scripts/check-language.sh --staged     # scan only staged files (used by pre-commit)
#
# Exits 0 on clean pass; exits 1 on any violation.

set -uo pipefail
# Note: -e is deliberately not set. The scan loop uses grep/read exit codes as
# control flow (non-match returns 1), and subshells in pipelines would abort
# the whole script if -e were enabled. Real errors are surfaced explicitly.

CONFIG_FILE=".langauditrc.json"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: $CONFIG_FILE not found. Language audit cannot run."
  exit 2
fi

MODE="all"
if [ "${1:-}" = "--staged" ]; then
  MODE="staged"
fi

# --- Parse config (banned terms + allowlisted paths) via node ---
# We use node because it's available (pnpm/node are required for the repo) and avoids a jq dependency.

BANNED_PATTERNS=$(node -e "
  const cfg = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
  const out = cfg.banned_terms.map(t => {
    const flag = t.case_insensitive === false ? '' : 'i';
    return [t.id, t.pattern, flag, t.message].join('\t');
  }).join('\n');
  console.log(out);
")

SCAN_PATHS=$(node -e "
  const cfg = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
  console.log(cfg.scan_paths.join(' '));
")

EXCLUDE_PATHS=$(node -e "
  const cfg = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
  console.log(cfg.exclude_paths.join(' '));
")

# --- Build file list ---
if [ "$MODE" = "staged" ]; then
  # Only staged files within scan_paths
  FILE_LIST=$(git diff --cached --name-only --diff-filter=ACM | while read -r f; do
    for p in $SCAN_PATHS; do
      case "$f" in
        "$p"|"$p"/*) echo "$f" ;;
      esac
    done
  done | sort -u)
else
  # All tracked files within scan_paths
  FILE_LIST=$(git ls-files -- $SCAN_PATHS 2>/dev/null | sort -u || true)
fi

# Apply exclude_paths filter
if [ -n "$EXCLUDE_PATHS" ]; then
  for ex in $EXCLUDE_PATHS; do
    FILE_LIST=$(echo "$FILE_LIST" | grep -Ev "^${ex}(/|$)" || true)
  done
fi

if [ -z "${FILE_LIST// }" ]; then
  echo "[lang:audit] No files in scope to scan (mode=$MODE). OK."
  exit 0
fi

# --- Build allowlist regexes (line-level) ---
ALLOWLIST_PATTERNS=$(node -e "
  const cfg = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
  console.log((cfg.allowlisted_lines || []).map(l => l.pattern).join('\n'));
")

# --- Build context allowlist (section-level) ---
# Context allowlist: file_path + section_anchor. We implement this as: "while scanning file X, the
# moment we see section_anchor as a line, suspend banned-term checking for that file until a new
# H2 or H1 appears." This is a simple, grep-assisted implementation in awk.
CONTEXT_ALLOWLIST=$(node -e "
  const cfg = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
  console.log((cfg.allowlisted_contexts || []).map(c => c.file + '\t' + c.section_anchor).join('\n'));
")

# --- Run the scan ---
VIOLATIONS_FILE="/tmp/cayc-lang-audit-violations-$$"
rm -f "$VIOLATIONS_FILE"
echo "[lang:audit] Scanning $(echo "$FILE_LIST" | grep -c . || echo 0) file(s) for banned terms..."

# We iterate banned terms x files. For each match, we check:
#   1. Is the line allowlisted by a literal allowlist pattern?  (continue past it)
#   2. Is the file + section currently in a context allowlist?  (continue past it)
#   3. Otherwise — record a violation.

for f in $FILE_LIST; do
  [ -f "$f" ] || continue

  # Pre-compute: for this file, which sections are allowlisted?
  FILE_CONTEXTS=$(echo "$CONTEXT_ALLOWLIST" | awk -F'\t' -v file="$f" '$1 == file { print $2 }')

  echo "$BANNED_PATTERNS" | while IFS=$'\t' read -r TERM_ID PATTERN FLAG MESSAGE; do
    [ -z "$TERM_ID" ] && continue
    # Search for the pattern (case-insensitive by default).
    GREP_FLAGS="-n"
    if [ "$FLAG" = "i" ]; then GREP_FLAGS="$GREP_FLAGS -iE"; else GREP_FLAGS="$GREP_FLAGS -E"; fi

    # Get matching lines
    MATCHES=$(grep $GREP_FLAGS -- "$PATTERN" "$f" 2>/dev/null || true)
    [ -z "$MATCHES" ] && continue

    echo "$MATCHES" | while IFS=: read -r LN LINETEXT; do
      [ -z "$LN" ] && continue

      # Check line-level allowlist
      SKIP=0
      if [ -n "$ALLOWLIST_PATTERNS" ]; then
        while IFS= read -r ALPAT; do
          [ -z "$ALPAT" ] && continue
          if echo "$LINETEXT" | grep -qiE "$ALPAT"; then SKIP=1; break; fi
        done <<< "$ALLOWLIST_PATTERNS"
      fi
      [ "$SKIP" = "1" ] && continue

      # Check context allowlist: is LN after a section_anchor in FILE_CONTEXTS
      # but before the next H2 or H1?
      if [ -n "$FILE_CONTEXTS" ]; then
        while IFS= read -r ANCHOR; do
          [ -z "$ANCHOR" ] && continue
          ANCHOR_LINE=$(grep -nF -- "$ANCHOR" "$f" | head -1 | cut -d: -f1)
          [ -z "$ANCHOR_LINE" ] && continue
          # Find the next ^## or ^# line after ANCHOR_LINE
          NEXT_SECTION=$(tail -n +$((ANCHOR_LINE + 1)) "$f" | grep -nE "^#{1,2} " | head -1 | cut -d: -f1)
          if [ -z "$NEXT_SECTION" ]; then
            # No further sections; allowlist runs to EOF
            END_LINE=$(wc -l < "$f")
          else
            END_LINE=$((ANCHOR_LINE + NEXT_SECTION - 1))
          fi
          if [ "$LN" -ge "$ANCHOR_LINE" ] && [ "$LN" -le "$END_LINE" ]; then
            SKIP=1; break
          fi
        done <<< "$FILE_CONTEXTS"
      fi
      [ "$SKIP" = "1" ] && continue

      # Record violation
      echo "  VIOLATION: $f:$LN [$TERM_ID]" >&2
      echo "    $LINETEXT" >&2
      echo "    -> $MESSAGE" >&2
      # Mark violation by writing to a temp file (subshells can't modify parent var)
      echo "1" >> "$VIOLATIONS_FILE"
    done
  done
done

# Count violations
if [ -f "$VIOLATIONS_FILE" ]; then
  COUNT=$(wc -l < "$VIOLATIONS_FILE")
  rm -f "$VIOLATIONS_FILE"
  echo ""
  echo "[lang:audit] FAILED — $COUNT violation(s) found. See above." >&2
  echo "[lang:audit] See docs/style-guide.md for the rules and approved replacement terms." >&2
  exit 1
fi

echo "[lang:audit] OK — no violations found."
exit 0
