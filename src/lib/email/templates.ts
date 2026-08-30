function escapeHtml(value: string) {
  return value.replace(/[&<>"']/gu, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function paragraphize(value: string) {
  return value.split(/\n{2,}/u).map((part) => `<p style="margin:0 0 16px;line-height:1.9">${escapeHtml(part).replace(/\n/gu, "<br>")}</p>`).join("");
}

function shell(content: string, footer: string) {
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#f6f6f3;color:#181816;font-family:Arial,Tahoma,sans-serif"><div style="max-width:620px;margin:0 auto;padding:28px 18px"><div style="background:#fff;border:1px solid #e8e8e2;border-radius:18px;padding:28px">${content}<hr style="border:0;border-top:1px solid #ecece6;margin:28px 0"><p style="font-size:12px;line-height:1.8;color:#666">${escapeHtml(footer)}</p></div></div></body></html>`;
}

export function confirmationEmail(input: { siteName: string; confirmUrl: string; footer?: string }) {
  const subject = `تأكيد الاشتراك في ${input.siteName}`;
  const text = `أكد اشتراكك في ${input.siteName}: ${input.confirmUrl}`;
  const html = shell(`<h1 style="font-size:24px;margin:0 0 18px">تأكيد الاشتراك</h1><p style="line-height:1.9">وصلنا طلب اشتراك بهذا البريد. اضغط الزر لتأكيد رغبتك في استلام النشرة.</p><p style="margin:24px 0"><a href="${escapeHtml(input.confirmUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#181816;color:#fff;text-decoration:none;font-weight:700">تأكيد الاشتراك</a></p><p style="font-size:12px;color:#666">إذا لم تطلب الاشتراك فتجاهل الرسالة.</p>`, input.footer ?? "لن نرسل لك رسائل دون اشتراكك.");
  return { subject, text, html };
}

export function campaignEmail(input: { subject: string; preheader?: string; body: string; ctaUrl?: string | null; ctaLabel?: string; unsubscribeUrl: string; footer?: string }) {
  const cta = input.ctaUrl ? `<p style="margin:26px 0"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#181816;color:#fff;text-decoration:none;font-weight:700">${escapeHtml(input.ctaLabel ?? "اقرأ المزيد")}</a></p>` : "";
  const unsubscribe = `<p style="font-size:12px;color:#666"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#666">إلغاء الاشتراك</a></p>`;
  const html = shell(`${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(input.preheader)}</div>` : ""}<h1 style="font-size:26px;margin:0 0 20px">${escapeHtml(input.subject)}</h1>${paragraphize(input.body)}${cta}${unsubscribe}`, input.footer ?? "معتز العلقمي");
  const text = `${input.subject}\n\n${input.body}${input.ctaUrl ? `\n\n${input.ctaLabel ?? "اقرأ المزيد"}: ${input.ctaUrl}` : ""}\n\nإلغاء الاشتراك: ${input.unsubscribeUrl}`;
  return { html, text };
}
