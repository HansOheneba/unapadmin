#!/usr/bin/env bash
# Copy static assets into the standalone output after `npm run build`.
# Optional lean artifact; primary cPanel layout still uses project-root server.js.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE="$ROOT/.next/standalone"

if [[ ! -d "$STANDALONE" ]]; then
  echo "Missing .next/standalone — run npm run build first (output: \"standalone\")." >&2
  exit 1
fi

mkdir -p "$STANDALONE/.next"
rm -rf "$STANDALONE/.next/static"
cp -R "$ROOT/.next/static" "$STANDALONE/.next/static"

rm -rf "$STANDALONE/public"
cp -R "$ROOT/public" "$STANDALONE/public"

cp "$ROOT/server.js" "$STANDALONE/server.js"

echo "Standalone package ready at .next/standalone (includes server.js, .next/static, public)."
