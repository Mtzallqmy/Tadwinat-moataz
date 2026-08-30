import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("environment example never contains committed values", async () => {
  const env = await read(".env.example");
  for (const line of env.split(/\r?\n/u).filter(Boolean)) assert.match(line, /^[A-Z0-9_]+=$/u);
});

test("service worker excludes private application surfaces", async () => {
  const sw = await read("public/sw.js");
  for (const prefix of ["/admin", "/auth", "/api", "/newsletter"]) assert.ok(sw.includes(`\"${prefix}\"`));
  assert.ok(sw.includes("request.method !== \"GET\""));
});

test("production CSP only enables unsafe-eval in development", async () => {
  const config = await read("next.config.ts");
  assert.ok(config.includes("isDevelopment ? \" 'unsafe-eval'\" : \"\""));
  assert.ok(config.includes("object-src 'none'"));
  assert.ok(config.includes("frame-ancestors 'none'"));
});

test("maintenance does not delete audit logs or user content", async () => {
  const migration = await read("supabase/migrations/20260831023000_blog_phase5_operations_retention.sql");
  assert.ok(migration.includes("delete from blog.telegram_sessions"));
  assert.ok(migration.includes("delete from blog_private.rate_limits"));
  assert.equal(/delete\s+from\s+blog\.audit_logs/iu.test(migration), false);
  assert.equal(/delete\s+from\s+blog\.posts/iu.test(migration), false);
});
