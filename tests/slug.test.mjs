import assert from "node:assert/strict";
import test from "node:test";
import { slugCandidate, slugify } from "../src/lib/content/slug.ts";

test("slugify normalizes Arabic diacritics and spaces", () => {
  assert.equal(slugify("  مُعْتَز العَلْقَمِي  "), "معتز-العلقمي");
});

test("slugify rejects punctuation-only input to a safe fallback", () => {
  assert.equal(slugify("!!!"), "untitled");
});

test("slugCandidate keeps first slug and suffixes retries", () => {
  assert.equal(slugCandidate("article", 1), "article");
  assert.equal(slugCandidate("article", 2), "article-2");
});
