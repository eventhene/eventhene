import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";

function wrap(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0c;font-family:Inter,system-ui,Arial,sans-serif;color:#f4f4f5;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:20px;"><img src="${getAppUrl()}/logo-full.png" alt="EventHene" height="40" style="height:40px;width:auto;" /></div>
    <div style="background:#141418;border:1px solid #26262c;border-radius:18px;padding:28px;">
      <h1 style="font-size:20px;margin:0 0 10px;color:#fff;">${title}</h1>
      ${body}
    </div>
  </div></body></html>`;
}

const IF_NOT_YOU = `<p style="font-size:13px;color:#a1a1aa;margin-top:16px;">If this was not you, reset your password straight away at <a href="${"{URL}"}" style="color:#D4A853;">${"{URL}"}</a> and contact support.</p>`;

export async function passwordChangedNotice(to: string) {
  const url = `${getAppUrl()}/forgot-password`;
  await sendEmail({
    to,
    subject: "Your EventHene password was changed",
    html: wrap("Your password was changed", `<p style="font-size:14px;line-height:1.6;">The password for your EventHene account was just changed, and you were signed out of other devices.</p>${IF_NOT_YOU.replace(/\{URL\}/g, url)}`),
  });
}

export async function emailChangedNotice(oldEmail: string, newEmail: string) {
  const url = `${getAppUrl()}/forgot-password`;
  await sendEmail({
    to: oldEmail,
    subject: "Your EventHene email address was changed",
    html: wrap("Your email address was changed", `<p style="font-size:14px;line-height:1.6;">The sign-in email on your EventHene account was changed from this address to <strong>${newEmail}</strong>.</p>${IF_NOT_YOU.replace(/\{URL\}/g, url)}`),
  });
}
