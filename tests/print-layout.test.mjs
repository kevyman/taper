import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../medrol-taper.html", import.meta.url), "utf8");
const printCss = html.match(/@media print\{([\s\S]*?)\n  \}/)?.[1] ?? "";

function ruleFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = printCss.match(new RegExp(`${escaped}\\{([^}]*)\\}`));
  assert.ok(match, `missing print rule for ${selector}`);
  return match[1].replace(/\s+/g, " ");
}

function declarationValue(rule, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return rule.match(new RegExp(`${escaped}:([^;]+)`))?.[1].trim();
}

test("print calendar cells reserve top space for corner labels", () => {
  const cell = ruleFor(".cell");
  const padding = declarationValue(cell, "padding");

  assert.match(padding, /^5mm /);
});

test("print month rows stay compact enough for the final-page footer", () => {
  const grid = ruleFor(".grid");

  assert.equal(declarationValue(grid, "grid-auto-rows"), "18.6mm");
});

test("print alternate-day chip is flush with the top-right cell corner", () => {
  const chip = ruleFor(".chip");

  assert.equal(declarationValue(chip, "top"), "0");
  assert.equal(declarationValue(chip, "right"), "0");
  assert.equal(declarationValue(chip, "border-radius"), "0 6px 0 8px");
});

test("print alternate-day chip only draws the inner left-bottom outline", () => {
  const chip = ruleFor(".chip");

  assert.equal(declarationValue(chip, "border"), "0");
  assert.equal(declarationValue(chip, "border-top"), "0");
  assert.equal(declarationValue(chip, "border-right"), "0");
  assert.equal(declarationValue(chip, "border-left"), ".5px solid #aeaeae");
  assert.equal(declarationValue(chip, "border-bottom"), ".5px solid #aeaeae");
});

test("print dose starts below reserved label space", () => {
  const dose = ruleFor(".dose");

  assert.equal(declarationValue(dose, "margin"), "0 0 .4mm");
});

test("print footer is compact enough to share the last month page", () => {
  const footer = ruleFor(".footer");

  assert.match(declarationValue(footer, "margin-top"), /^1mm/);
  assert.match(declarationValue(footer, "padding"), /^1\.5mm /);
  assert.equal(declarationValue(footer, "font-size"), "10.5px");
});

test("custom schedule persistence no longer depends on embedded HTML JSON", () => {
  assert.ok(!html.includes('id="customSchemes"'));
  assert.match(html, /const CUSTOM_SCHEMES_KEY = "medrol-taper-custom-schemes"/);
  assert.match(html, /localStorage\.getItem\(CUSTOM_SCHEMES_KEY\)/);
  assert.match(html, /localStorage\.setItem\(CUSTOM_SCHEMES_KEY,/);
  assert.ok(!html.includes("downloadSelf"));
});
