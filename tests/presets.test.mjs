import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../medrol-taper.html", import.meta.url), "utf8");
const presetBlock = html.match(/\/\* ---------- presets[\s\S]*?const PRESETS = \[([\s\S]*?)\n\];/)?.[0];

assert.ok(presetBlock, "preset block should be present");

const presets = JSON.parse(JSON.stringify(vm.runInNewContext(`${presetBlock}; PRESETS;`, {})));
const byId = new Map(presets.map((preset) => [preset.id, preset]));

function phaseShape(preset) {
  return preset.phases.map((phase) => ({
    durDays: phase.durDays,
    maintenance: phase.maintenance || false,
    doses: phase.doses,
  }));
}

test("removed 48 mg schedules are not offered as built-in presets", () => {
  assert.equal(byId.has("48-24-alt"), false);
  assert.equal(byId.has("48-12-daily"), false);
});

test("48 mg to 8 mg daily schedule starts with four weeks at 48 mg", () => {
  assert.deepEqual(phaseShape(byId.get("48-8-daily")), [
    { durDays: 28, maintenance: false, doses: [48] },
    { durDays: 7, maintenance: false, doses: [40] },
    { durDays: 7, maintenance: false, doses: [32] },
    { durDays: 7, maintenance: false, doses: [24] },
    { durDays: 7, maintenance: false, doses: [16] },
    { durDays: 7, maintenance: false, doses: [16] },
    { durDays: 7, maintenance: false, doses: [12] },
    { durDays: 7, maintenance: false, doses: [12] },
    { durDays: undefined, maintenance: true, doses: [8] },
  ]);
});

test("32 mg alternate-day schedule is renamed and tapers to 8 mg every other day", () => {
  const preset = byId.get("32-16-alt");

  assert.equal(preset.name.nl, "Medrol 32 mg → 8 mg om de 2 dagen");
  assert.equal(preset.name.en, "Medrol 32 mg → 8 mg every other day");
  assert.equal(preset.name.fr, "Medrol 32 mg → 8 mg un jour sur deux");
  assert.deepEqual(phaseShape(preset), [
    { durDays: 28, maintenance: false, doses: [32] },
    { durDays: 7, maintenance: false, doses: [24] },
    { durDays: 7, maintenance: false, doses: [24, 16] },
    { durDays: 7, maintenance: false, doses: [24, 8] },
    { durDays: 7, maintenance: false, doses: [24, 0] },
    { durDays: 7, maintenance: false, doses: [20, 0] },
    { durDays: 7, maintenance: false, doses: [16, 0] },
    { durDays: 7, maintenance: false, doses: [12, 0] },
    { durDays: undefined, maintenance: true, doses: [8, 0] },
  ]);
});

test("new 48 mg daily taper to 4 mg until consultation is available", () => {
  const preset = byId.get("48-4-daily");

  assert.equal(preset.name.nl, "Medrol 48 mg/dag → 4 mg/dag");
  assert.equal(preset.name.en, "Medrol 48 mg/day → 4 mg/day");
  assert.equal(preset.name.fr, "Medrol 48 mg/j → 4 mg/j");
  assert.deepEqual(phaseShape(preset), [
    { durDays: 28, maintenance: false, doses: [48] },
    { durDays: 7, maintenance: false, doses: [40] },
    { durDays: 7, maintenance: false, doses: [32] },
    { durDays: 7, maintenance: false, doses: [24] },
    { durDays: 7, maintenance: false, doses: [20] },
    { durDays: 14, maintenance: false, doses: [16] },
    { durDays: 14, maintenance: false, doses: [12] },
    { durDays: 14, maintenance: false, doses: [8] },
    { durDays: undefined, maintenance: true, doses: [4] },
  ]);
});
