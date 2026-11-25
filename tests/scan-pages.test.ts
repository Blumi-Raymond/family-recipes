// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { inOrder, pageIdsParam, parsePageIds, scanPagesSchema } from "../lib/scan/pages";

const G = "b9dea35a-2f94-4e22-8fd9-1a772b9a3216";
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const D = "44444444-4444-4444-8444-444444444444";
const E = "55555555-5555-4555-8555-555555555555";
const page = (id: string, ext = "webp") => `${G}/pages/${id}.${ext}`;

test("page ids: round trip through the address keeps the order", () => {
  assert.deepEqual(parsePageIds(pageIdsParam([C, A, B])), [C, A, B]);
});

test("page ids: bad addresses are rejected (shown as 'not found')", () => {
  assert.equal(parsePageIds(undefined), null);
  assert.equal(parsePageIds(""), null);
  assert.equal(parsePageIds([A, B]), null); // ?pages=a&pages=b
  assert.equal(parsePageIds(`${A},nope`), null);
  assert.equal(parsePageIds(`${A},${A}`), null); // repeated
  assert.equal(parsePageIds(`${A},`), null); // empty part
  assert.equal(parsePageIds([A, B, C, D, E].join(",")), null); // more than 4
  assert.equal(parsePageIds(`${A}';drop table x`), null);
});

test("page ids: upper case is accepted and normalised", () => {
  assert.deepEqual(parsePageIds(A.toUpperCase()), [A]);
});

test("rows come back in the chosen order; a missing row = null", () => {
  const rows = [{ id: B }, { id: C }, { id: A }];
  assert.deepEqual(inOrder(rows, (r) => r.id, [A, B, C]), [{ id: A }, { id: B }, { id: C }]);
  assert.equal(inOrder(rows, (r) => r.id, [A, D]), null);
  assert.deepEqual(inOrder([], (r: { id: string }) => r.id, []), []);
});

test("scan pages: 1-4 photos in the pages folder, no repeats", () => {
  const ok = (paths: string[], cookbook_id: string | null = null) =>
    scanPagesSchema.safeParse({ cookbook_id, paths }).success;
  assert.equal(ok([page(A)]), true);
  assert.equal(ok([page(A), page(B, "jpg")], C), true);
  assert.equal(ok([]), false);
  assert.equal(ok([page(A), page(B), page(C), page(D), page(E)]), false);
  assert.equal(ok([page(A), page(A)]), false);
  assert.equal(ok([`${G}/dishes/${A}.webp`]), false); // wrong folder
  assert.equal(ok([`${G}/pages/${A}.png`]), false);
  assert.equal(ok([`../${G}/pages/${A}.webp`]), false);
  assert.equal(ok([page(A)], "not-a-book-id"), false);
});
