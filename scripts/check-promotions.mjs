// Behaviour checks for scheduled prices and customer-facing discount labels.
import ts from "typescript";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const compiled = ts.transpileModule(
  await readFile("src/promotions.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
await mkdir("work", { recursive: true });
await writeFile("work/promotions-check-runtime.mjs", compiled);
const { saleState, displayProduct, savings } =
  await import("../work/promotions-check-runtime.mjs");
const p = {
  flash_price: 590000,
  flash_start: "2026-11-13 10:00:00",
  flash_end: "2026-11-13 12:00:00",
  variants: [{ id: 1, price: 790000, compare_price: 790000 }],
};
const at = (s) => Date.parse("2026-11-13T" + s + "+07:00");
assert.equal(saleState(p, at("09:59:59")), "scheduled");
assert.equal(saleState(p, at("10:00:00")), "active");
assert.equal(saleState(p, at("12:00:00")), "ended");
assert.equal(displayProduct(p, at("11:00:00")).price, 590000);
assert.equal(displayProduct(p, at("12:00:00")).price, 790000);
assert.equal(savings(displayProduct(p, at("11:00:00"))), 25);
assert.equal(
  savings({ price: 1, variants: [{ compare_price: 1290000 }] }),
  99,
  "A nonzero price must never be advertised as 100% off",
);
assert.equal(
  savings({ price: 0, variants: [{ compare_price: 1290000 }] }),
  100,
);
assert.equal(savings({ price: 1000, variants: [{ compare_price: 0 }] }), 0);
console.log(
  "Promotion checks passed: time boundaries, regular price restoration and honest discount labels.",
);
