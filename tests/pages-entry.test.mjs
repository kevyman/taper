import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("GitHub Pages root redirects to the self-contained taper calendar", () => {
  assert.match(index, /<meta http-equiv="refresh" content="0; url=medrol-taper\.html">/);
  assert.match(index, /href="medrol-taper\.html"/);
});
