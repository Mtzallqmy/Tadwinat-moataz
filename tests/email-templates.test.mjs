import assert from "node:assert/strict";
import test from "node:test";
import { campaignEmail, confirmationEmail } from "../src/lib/email/templates.ts";

test("campaign email escapes untrusted body and subject markup", () => {
  const message = campaignEmail({ subject: "<img src=x onerror=alert(1)>", body: "Hello <script>alert(1)</script>", unsubscribeUrl: "https://example.com/unsubscribe?token=abc" });
  assert.doesNotMatch(message.html, /<script>/u);
  assert.doesNotMatch(message.html, /<img src=x/u);
  assert.match(message.html, /&lt;script&gt;/u);
  assert.match(message.html, /إلغاء الاشتراك/u);
});

test("confirmation template has explicit confirmation CTA", () => {
  const message = confirmationEmail({ siteName: "معتز العلقمي", confirmUrl: "https://example.com/newsletter/confirm?token=abc" });
  assert.match(message.html, /تأكيد الاشتراك/u);
  assert.match(message.text, /https:\/\/example.com/u);
});
