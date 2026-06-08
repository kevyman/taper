#!/usr/bin/env bash
# Regenerate the example output PDF and the README preview PNG from
# medrol-taper.html. The PDF is git-ignored (regenerable); the PNG is tracked.
#
# Usage:  ./scripts/regen-example.sh
#
# Requires: chromium (headless) and ghostscript (gs).
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$repo/medrol-taper.html"
pdf="$repo/medrol-taper-example.pdf"
png="$repo/example-preview.png"

chromium="$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)"
if [[ -z "$chromium" ]]; then echo "error: chromium not found" >&2; exit 1; fi
command -v gs >/dev/null || { echo "error: ghostscript (gs) not found" >&2; exit 1; }

profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT

# Render the print layout (honours @media print + print-color-adjust) to a colour PDF.
"$chromium" --headless=new --no-sandbox --disable-gpu \
  --user-data-dir="$profile" \
  --no-pdf-header-footer \
  --virtual-time-budget=10000 \
  --print-to-pdf="$pdf" \
  "file://$src"

# Rasterize page 1 to a high-res, anti-aliased PNG for the README preview.
gs -dBATCH -dNOPAUSE -sDEVICE=png16m -r220 \
  -dTextAlphaBits=4 -dGraphicsAlphaBits=4 \
  -dFirstPage=1 -dLastPage=1 \
  -sOutputFile="$png" "$pdf" >/dev/null

echo "Wrote $pdf (git-ignored) and $png"
