// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatQuantity, parseQuantity, quantityToText } from "../lib/recipes/quantity";

test("parses the ways an amount is written", () => {
  const cases: [string, number | null, number | null][] = [
    ["2", 2, null], ["1.5", 1.5, null], ["1,5", 1.5, null], ["1/2", 0.5, null],
    ["1 1/2", 1.5, null], ["1½", 1.5, null], ["1 ½", 1.5, null], ["½", 0.5, null],
    ["2 1/3", 2.3333, null], ["2⅓", 2.3333, null], [".5", 0.5, null],
    ["2-3", 2, 3], ["2 – 3", 2, 3], ["2-2", 2, null], ["", null, null],
  ];
  for (const [text, q, max] of cases) {
    assert.deepEqual(parseQuantity(text), { quantity: q, quantityMax: max }, text);
  }
});

test("rejects amounts that make no sense", () => {
  for (const text of ["abc", "0", "-2", "3-2", "1/0", "2-", "1-2-3"]) {
    assert.equal(parseQuantity(text), null, text);
  }
});

test("shows amounts nicely and back for editing", () => {
  assert.equal(formatQuantity(2.3333, null), "2⅓");
  assert.equal(formatQuantity(0.5, null), "½");
  assert.equal(formatQuantity(2, 3), "2–3");
  assert.equal(formatQuantity(1.37, null), "1.37");
  assert.equal(quantityToText(2, 3), "2-3");
  assert.equal(formatQuantity(null, null), "");
});
