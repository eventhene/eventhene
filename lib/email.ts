import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
export const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM || "EventHene <onboarding@resend.dev>";
const REPLY_TO = process.env.EMAIL_REPLY_TO;

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string }[];
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipping email:", input.subject);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: REPLY_TO,
    attachments: input.attachments
  });
}

// ---------------- Templates ----------------

const wrap = (body: string) => `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Inter,system-ui,sans-serif;color:#0F0E13;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-family:'Fraunces',Georgia,serif;font-size:24px;font-weight:700;color:#4B1E78;">
        EventHene <span style="color:#D4A24C;">♛</span>
      </div>
    </div>
    <div style="background:#fff;border:1px solid #E7E3D8;border-radius:18px;padding:32px;">
      ${body}
    </div>
    <p style="text-align:center;font-size:12px;color:#5B5666;margin-top:24px;">
      EventHene • Premium event ticketing<br/>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#5B5666;">eventhene.com</a>
    </p>
  </div>
</body>
</html>`;

export function ticketIssuedEmail(opts: {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  visibleRef: string;
  ticketUrl: string;
}): string {
  return wrap(`
    <h1 style="font-family:'Fraunces',serif;font-size:28px;margin:0 0 8px;">Long live the king. 🎟️</h1>
    <p style="font-size:16px;line-height:1.6;color:#0F0E13;">Hi ${opts.attendeeName}, your ticket for <strong>${opts.eventTitle}</strong> is confirmed.</p>
    <div style="background:#F4F2EC;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#5B5666;text-transform:uppercase;">When</p>
      <p style="margin:0 0 8px;font-weight:600;">${opts.eventDate}</p>
      <p style="margin:0;font-size:12px;color:#5B5666;text-transform:uppercase;">Where</p>
      <p style="margin:0 0 8px;font-weight:600;">${opts.venue}</p>
      <p style="margin:0;font-size:12px;color:#5B5666;text-transform:uppercase;">Ticket Reference</p>
      <p style="margin:0;font-family:monospace;font-size:18px;color:#4B1E78;font-weight:700;">${opts.visibleRef}</p>
    </div>
    <p style="font-size:14px;">Your branded ticket with QR code is attached to this email. Show the QR at the gate — that's your seat.</p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${opts.ticketUrl}" style="display:inline-block;background:#4B1E78;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;">Download my ticket</a>
    </div>
    <p style="font-size:12px;color:#5B5666;margin-top:24px;">Don't share this email or your QR. One ticket = one entry.</p>
  `);
}

export function freeEventApprovedEmail(opts: { eventTitle: string; url: string }): string {
  return wrap(`
    <h1 style="font-family:'Fraunces',serif;font-size:24px;margin:0 0 8px;">🎉 Your event is live</h1>
    <p>Your free event <strong>${opts.eventTitle}</strong> has been approved and is now public on EventHene.</p>
    <p>Share your link to start filling seats:</p>
    <p><a href="${opts.url}" style="color:#4B1E78;font-weight:600;">${opts.url}</a></p>
  `);
}

export function freeEventRejectedEmail(opts: { eventTitle: string; reason: string }): string {
  return wrap(`
    <h1 style="font-family:'Fraunces',serif;font-size:22px;margin:0 0 8px;">About your event</h1>
    <p>We weren't able to publish <strong>${opts.eventTitle}</strong>.</p>
    <p style="background:#F4F2EC;padding:12px;border-radius:8px;"><strong>Reason:</strong> ${opts.reason}</p>
    <p>Reply to this email if you'd like to discuss further. We're happy to help.</p>
  `);
}

export function freeEventEditsRequestedEmail(opts: { eventTitle: string; note: string; dashboardUrl: string }): string {
  return wrap(`
    <h1 style="font-family:'Fraunces',serif;font-size:22px;margin:0 0 8px;">A small request before "${opts.eventTitle}" goes live</h1>
    <p>We loved your event. Before publishing, please update the following:</p>
    <p style="background:#F4F2EC;padding:12px;border-radius:8px;">${opts.note}</p>
    <div style="text-align:center;margin-top:16px;">
      <a href="${opts.dashboardUrl}" style="display:inline-block;background:#4B1E78;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">Edit my event</a>
    </div>
  `);
}

export function organizerWelcomeEmail(opts: { name: string }): string {
  return wrap(`
    <h1 style="font-family:'Fraunces',serif;font-size:26px;margin:0 0 8px;">Welcome to EventHene, ${opts.name} ♛</h1>
    <p>You're set up. Create your first event in under 5 minutes — it's free to publish.</p>
    <div style="text-align:center;margin-top:16px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/events/new" style="display:inline-block;background:#4B1E78;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">Create my event</a>
    </div>
  `);
}
