import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../medrol-taper.html", import.meta.url), "utf8");
const projector = html.match(/\/\* ---------- calendar projector ---------- \*\/([\s\S]*?)\/\* ---------- localized date helpers ---------- \*\//)?.[1];

assert.ok(projector, "calendar projector block should be present");

const context = { Date };
vm.createContext(context);
vm.runInContext(projector, context);

test("consecutive alternating phases keep day 1 and day 2 alternating across phase boundaries", () => {
  const days = context.buildDays(
    [
      { durDays: 7, doses: [24, 16] },
      { durDays: 7, doses: [24, 8] },
    ],
    new Date(2026, 0, 1),
    1,
  );

  assert.deepEqual(Array.from(days.slice(0, 9), (day) => day.cyclePos), [0, 1, 0, 1, 0, 1, 0, 1, 0]);
  assert.deepEqual(Array.from(days.slice(5, 9), (day) => day.mg), [16, 24, 8, 24]);
  assert.equal(days[7].isPhaseStart, true);
});
