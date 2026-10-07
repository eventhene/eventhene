import { Resend } from "resend";
import nodemailer from "nodemailer";

/**
 * Email delivery, fully driven by environment variables so nothing needs a code
 * change when you hit a limit or buy a domain.
 *
 *  Provider 1 (Resend):  RESEND_API_KEY, EMAIL_FROM
 *  Provider 2 (SMTP):    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (optional)
 *  Shared:               EMAIL_REPLY_TO, EMAIL_PROVIDER = auto | resend | smtp
 *
 * In "auto" mode Resend is tried first and SMTP is used automatically if Resend
 * fails (daily limit hit, domain not verified yet, outage). To switch providers
 * or domains, just change the env vars in Vercel and redeploy.
 */

const SANDBOX_FROM = "EventHene <onboarding@resend.dev>";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string }[];
}

export interface SendEmailResult {
  ok: boolean;
  provider?: "resend" | "smtp";
  error?: string;
  attempts: { provider: string; ok: boolean; error?: string }[];
}

export interface EmailConfigStatus {
  mode: string;
  resend: { configured: boolean; from: string };
  smtp: { configured: boolean; host?: string; user?: string; from?: string };
  replyTo?: string;
  anyConfigured: boolean;
}

function getMode(): string {
  const m = (process.env.EMAIL_PROVIDER || "auto").toLowerCase();
  return ["auto", "resend", "smtp"].includes(m) ? m : "auto";
}

function resendFrom(): string {
  return process.env.EMAIL_FROM?.trim() || SANDBOX_FROM;
}

function smtpFrom(): string {
  return process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || SANDBOX_FROM;
}

function smtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getEmailConfigStatus(): EmailConfigStatus {
  const resendConfigured = !!process.env.RESEND_API_KEY;
  const smtp = smtpConfigured();
  return {
    mode: getMode(),
    resend: { configured: resendConfigured, from: resendFrom() },
    smtp: {
      configured: smtp,
      host: process.env.SMTP_HOST,
      user: process.env.SMTP_USER,
      from: smtp ? smtpFrom() : undefined,
    },
    replyTo: process.env.EMAIL_REPLY_TO,
    anyConfigured: resendConfigured || smtp,
  };
}

async function viaResend(input: SendEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const resend = new Resend(key);

  const send = (from: string) =>
    resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      attachments: input.attachments,
    });

  let { error } = await send(resendFrom());

  // Domain not verified yet: retry once from Resend's sandbox sender.
  if (error && /domain|verify|not verified/i.test(error.message || "") && resendFrom() !== SANDBOX_FROM) {
    ({ error } = await send(SANDBOX_FROM));
  }
  if (error) throw new Error(error.message || "Resend rejected the email");
}

async function viaSmtp(input: SendEmailInput): Promise<void> {
  if (!smtpConfigured()) throw new Error("SMTP is not configured");
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: smtpFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
}

/** Never throws. Check `result.ok` if the outcome matters (e.g. OTP codes). */
export async function sendEmailDetailed(input: SendEmailInput): Promise<SendEmailResult> {
  const mode = getMode();
  const order: Array<"resend" | "smtp"> =
    mode === "resend" ? ["resend"] : mode === "smtp" ? ["smtp"] : ["resend", "smtp"];

  const attempts: SendEmailResult["attempts"] = [];

  for (const provider of order) {
    if (provider === "resend" && !process.env.RESEND_API_KEY) continue;
    if (provider === "smtp" && !smtpConfigured()) continue;
    try {
      if (provider === "resend") await viaResend(input);
      else await viaSmtp(input);
      attempts.push({ provider, ok: true });
      return { ok: true, provider, attempts };
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error(`[email] ${provider} failed:`, msg);
      attempts.push({ provider, ok: false, error: msg });
    }
  }

  if (attempts.length === 0) {
    console.warn("[email] no email provider configured, skipping:", input.subject);
    return { ok: false, error: "No email provider configured", attempts };
  }
  return { ok: false, error: attempts[attempts.length - 1].error, attempts };
}

/** Fire-and-forget friendly wrapper. Never throws. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  await sendEmailDetailed(input);
}

// ---------------- Templates ----------------

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || "https://eventhene.vercel.app";

const wrap = (body: string) => `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:Inter,system-ui,Arial,sans-serif;color:#f4f4f5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${APP_URL()}/logo-full.png" alt="EventHene" height="44" style="height:44px;width:auto;" />
    </div>
    <div style="background:#141418;border:1px solid #26262c;border-radius:18px;padding:32px;">
      ${body}
    </div>
    <p style="text-align:center;font-size:12px;color:#8b8b95;margin-top:24px;">
      EventHene, premium event ticketing<br/>
      <a href="${APP_URL()}" style="color:#D4A853;">${APP_URL().replace(/^https?:\/\//, "")}</a>
    </p>
  </div>
</body>
</html>`;

const BTN = "display:inline-block;background:#D4A853;color:#111;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;";
const PANEL = "background:#1c1c22;border-radius:12px;padding:16px;margin:16px 0;";
const LABEL = "margin:0;font-size:12px;color:#8b8b95;text-transform:uppercase;letter-spacing:0.05em;";

export function otpEmailHtml(code: string): string {
  return wrap(`
    <p style="font-size:15px;color:#a1a1aa;margin:0 0 8px;text-align:center;">Your verification code</p>
    <p style="font-size:40px;font-weight:800;letter-spacing:8px;color:#D4A853;margin:16px 0;text-align:center;">${code}</p>
    <p style="font-size:13px;color:#8b8b95;margin:16px 0 0;text-align:center;">This code expires in 10 minutes. Do not share it with anyone.</p>
  `);
}

export function ticketIssuedEmail(opts: {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  visibleRef: string;
  ticketUrl: string;
}): string {
  return wrap(`
    <h1 style="font-size:26px;margin:0 0 8px;color:#fff;">Your ticket is confirmed</h1>
    <p style="font-size:16px;line-height:1.6;">Hi ${opts.attendeeName}, you are in for <strong>${opts.eventTitle}</strong>.</p>
    <div style="${PANEL}">
      <p style="${LABEL}">When</p>
      <p style="margin:0 0 8px;font-weight:600;">${opts.eventDate}</p>
      <p style="${LABEL}">Where</p>
      <p style="margin:0 0 8px;font-weight:600;">${opts.venue}</p>
      <p style="${LABEL}">Ticket reference</p>
      <p style="margin:0;font-family:monospace;font-size:18px;color:#D4A853;font-weight:700;">${opts.visibleRef}</p>
    </div>
    <p style="font-size:14px;color:#a1a1aa;">Your ticket with QR code is attached. Show the QR at the gate.</p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${opts.ticketUrl}" style="${BTN}">Download my ticket</a>
    </div>
    <p style="font-size:12px;color:#8b8b95;margin-top:24px;">Do not share this email or your QR. One ticket is one entry.</p>
  `);
}

export function freeEventApprovedEmail(opts: { eventTitle: string; url: string }): string {
  return wrap(`
    <h1 style="font-size:24px;margin:0 0 8px;color:#fff;">Your event is live</h1>
    <p>Your free event <strong>${opts.eventTitle}</strong> has been approved and is now public on EventHene.</p>
    <p>Share your link to start filling seats:</p>
    <p><a href="${opts.url}" style="color:#D4A853;font-weight:600;">${opts.url}</a></p>
  `);
}

export function freeEventRejectedEmail(opts: { eventTitle: string; reason: string }): string {
  return wrap(`
    <h1 style="font-size:22px;margin:0 0 8px;color:#fff;">About your event</h1>
    <p>We were not able to publish <strong>${opts.eventTitle}</strong>.</p>
    <p style="${PANEL}"><strong>Reason:</strong> ${opts.reason}</p>
    <p>Reply to this email if you would like to discuss further. We are happy to help.</p>
  `);
}

export function freeEventEditsRequestedEmail(opts: { eventTitle: string; note: string; dashboardUrl: string }): string {
  return wrap(`
    <h1 style="font-size:22px;margin:0 0 8px;color:#fff;">A small request before "${opts.eventTitle}" goes live</h1>
    <p>We loved your event. Before publishing, please update the following:</p>
    <p style="${PANEL}">${opts.note}</p>
    <div style="text-align:center;margin-top:16px;">
      <a href="${opts.dashboardUrl}" style="${BTN}">Edit my event</a>
    </div>
  `);
}

export function organizerWelcomeEmail(opts: { name: string }): string {
  return wrap(`
    <h1 style="font-size:26px;margin:0 0 8px;color:#fff;">Welcome to EventHene, ${opts.name}</h1>
    <p>You are set up. Create your first event in under 5 minutes. It is free to publish.</p>
    <div style="text-align:center;margin-top:16px;">
      <a href="${APP_URL()}/dashboard/events/new" style="${BTN}">Create my event</a>
    </div>
  `);
}

export function testEmailHtml(info: string): string {
  return wrap(`
    <h1 style="font-size:22px;margin:0 0 8px;color:#fff;">Email is working</h1>
    <p>This is a test message from your EventHene admin panel.</p>
    <p style="${PANEL}font-family:monospace;font-size:13px;">${info}</p>
  `);
}
