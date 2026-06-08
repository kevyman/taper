# AGENTS.md

## What this is

A single self-contained HTML file (`medrol-taper.html`) that generates a Medrol
(methylprednisolone) **tapering calendar** for patients. A doctor opens it,
picks a taper schedule and a start date, and **prints it** to hand to the
patient.

**The deliverable is the printed A4 page** — not the screen. The on-screen UI is
just the tool a clinician uses to produce that page. Every change is judged by
how the paper comes out: a doctor in a hospital prints it and gives it to a
patient who often has **poor eyesight**. If a change looks great in the browser
but degrades the print, it is a regression.

Audience for the printout: elderly / low-vision patients in Belgium. UI and
output are trilingual — **Dutch (nl-BE, default), English, French**.

## Non-negotiable design constraints

These are the reason the project exists. Do not weaken them.

1. **Large print & high contrast.** Font is *Atkinson Hyperlegible* (designed by
   the Braille Institute for low-vision readers). Dose numbers are big. Keep
   them big. Don't shrink type to fit more in.
2. **Prints legibly in BOTH colour and black-and-white.** Pill colours are
   chosen to be *luminance-opposite* (32 mg tablet = dark blue, 4 mg = light
   yellow) so they stay distinguishable on a B&W laser printer with no grayscale
   override. Never pick pill/banner colours by hue alone — check they survive
   desaturation.
3. **One sheet must stay readable and self-contained.** Print is A4 portrait,
   **2 months per sheet**, 6-month horizon (→ 3 month-grids, but laid 2/sheet).
   The clinical footer (extra meds + contact) must fit on the **last** page with
   the final month — that's why the print rules are tuned to tight mm values.
4. **No layout that hides the dose.** Each day cell reserves top space so the
   date tab and the "day 1 / day 2" chip never cover the mg number.

## Architecture (all in `medrol-taper.html`)

It's one file by design — a doctor can email it or drop it on a USB stick and it
just works offline (only external dependency is the Google-hosted font; it
degrades to system fonts). Layers, top to bottom in the `<script>`:

- **i18n** (`I18N`, `t()`) — all UI strings in nl/en/fr.
- **Schedule model + presets** (`PRESETS`) — each scheme is a list of `phases`;
  a phase is `{durDays | maintenance:true, doses:[...]}`. `doses` length 1 =
  daily; length 2 = alternating (day 1 / day 2, the every-other-day taper).
- **Pill decomposer** (`decompose`, `UNITS`) — doses are built from **only two
  real tablets: 32 mg and 4 mg**, each splittable into halves/quarters
  (32/16/8 and 4/2/1 mg). This mirrors what the pharmacy actually dispenses;
  don't invent fragment sizes that can't be cut from those two tablets.
- **SVG drawing** (`fragSVG`, `doseDrawing`) — pills are drawn as literal
  cut-disc slices where **area is exactly proportional to mg** (radius ∝ √mg).
  A patient can visually compare "how much" day to day. Preserve that
  proportionality if you touch the geometry.
- **Calendar projector** (`buildDays`) — walks phases day by day onto real
  calendar dates; marks phase starts and the alternate-day transition.
- **Render** — `renderGrid` (calendar view, the one that prints), `renderList`
  (screen list view), `renderBuilder` (the editor), `renderLegend` (footer).
- **Persistence** — `localStorage` for the live session, plus a "save as
  scheme" path (see below).

## The self-saving quirk

A `file://` page can't rewrite its own source. So **"Save as scheme"**
serializes the live DOM, bakes the custom schemes into the
`<script id="customSchemes">` JSON block, and triggers a **download of a new
copy** of `medrol-taper.html`. The user replaces their file with the download to
keep custom schemes. `#customSchemes` is the single source of truth for saved
schemes; keep it on one line and keep `<` escaped so a scheme name can't close
the script tag.

## Working on this

- **No build, no install.** Open `medrol-taper.html` in a browser. There is no
  package.json, bundler, or framework.
- **Always verify the print, not just the screen.** Use the browser print
  preview (the `🖶 Afdrukken` button calls `window.print()`). Check:
  - 2 months land per A4 sheet, nothing clipped at page breaks;
  - the footer shares the last month's page;
  - it's still legible printed in **black-and-white**;
  - the alternate-day transition banner reads clearly (dark banner, white text).
- **Tests** guard the print layout (the fragile part). Run them:
  ```
  node --test tests/print-layout.test.mjs
  ```
  They assert the print CSS keeps its tuned mm/px values (cell padding,
  `grid-auto-rows`, chip corner, footer compactness). If you intentionally
  retune the print layout, update these assertions in the same change.
- **Keep all three languages in sync.** Add a string to every locale in `I18N`;
  a preset `name` needs nl/en/fr.

## House conventions

- Commit messages: no `Co-Authored-By` trailer.
- Dates in discussion: DD/MM (European).
- Medical content (doses, taper schedules) is clinician-authored — don't invent
  or "correct" taper regimens. Treat `PRESETS` as data a doctor owns.
