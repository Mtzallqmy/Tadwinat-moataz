import assert from "node:assert/strict";
import test from "node:test";
import { createOpaqueToken, hashToken, safeTokenInput } from "../src/lib/security/tokens.ts";

test("opaque tokens are high-entropy url-safe values", () => {
  const first = createOpaqueToken();
  const second = createOpaqueToken();
  assert.ok(first.length >= 40);
  assert.match(first, /^[A-Za-z0-9_-]+$/u);
  assert.notEqual(first, second);
});

test("token hashing is deterministic without storing the raw token", () => {
  const token = "a".repeat(48);
  assert.equal(hashToken(token), hashToken(token));
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token).length, 64);
});

test("public token inputs reject short or oversized values", () => {
  assert.equal(safeTokenInput("short"), null);
  assert.equal(safeTokenInput("a".repeat(257)), null);
  assert.equal(safeTokenInput("a".repeat(32)), "a".repeat(32));
});
