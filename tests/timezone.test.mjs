import assert from "node:assert/strict";
import test from "node:test";
import { formatInTimeZone, isValidTimeZone, zonedDateTimeToUtc } from "../src/lib/datetime/timezone.ts";

test("Asia/Aden is accepted and local scheduling converts to UTC", () => {
  assert.equal(isValidTimeZone("Asia/Aden"), true);
  assert.equal(zonedDateTimeToUtc("2026-08-31T12:00", "Asia/Aden"), "2026-08-31T09:00:00.000Z");
});

test("invalid timezone is rejected", () => {
  assert.equal(isValidTimeZone("Mars/Aden"), false);
  assert.throws(() => zonedDateTimeToUtc("2026-08-31T12:00", "Mars/Aden"), /INVALID_TIMEZONE/);
});

test("formatInTimeZone returns a non-empty localized value", () => {
  assert.ok(formatInTimeZone("2026-08-31T09:00:00.000Z", "Asia/Aden").length > 0);
});
