import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../medrol-taper.html", import.meta.url), "utf8");

function functionBody(name) {
  const match = html.match(new RegExp(`function ${name}\\(\\)\\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `missing ${name}()`);
  return match[1];
}

test("the bundled page has an empty contact address by default", () => {
  assert.match(html, /footerContact:""/);
  assert.doesNotMatch(html, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
});

test("localStorage omits footerContact until a clinician enters one", () => {
  const saveBody = functionBody("save");

  assert.doesNotMatch(saveBody, /footerLines\s*:\s*state\.footerLines,\s*footerContact\s*:\s*state\.footerContact/);
  assert.match(saveBody, /state\.footerContact\s*\?/);
  assert.match(saveBody, /footerContact\s*:\s*state\.footerContact/);
});
