/**
 * Transactional email (server-only). Sends through Resend when RESEND_API_KEY
 * and EMAIL_FROM are set; otherwise logs the message to the server console so
 * local testing still works (e.g. copy a password-reset link from the log).
 */
type Email = { to: string; subject: string; text: string; html: string };

/** Returns true when the message was handed to Resend. */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.info(
      `[email] RESEND_API_KEY/EMAIL_FROM not set — not sent.\n  to: ${email.to}\n  subject: ${email.subject}\n  ${email.text}`,
    );
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!res.ok) {
    console.error(
      `[email] Resend rejected the message (${res.status}): ${await res.text().catch(() => "")}`,
    );
    return false;
  }
  return true;
}

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export function passwordResetEmail(to: string, name: string, url: string): Email {
  const first = name.split(" ")[0] || "there";
  return {
    to,
    subject: "Reset your Tena password",
    text: `Hi ${first},\n\nReset your Tena password here (link works for 1 hour):\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1c1915">
<p>Hi ${escapeHtml(first)},</p>
<p>Tap the button to choose a new Tena password. The link works for 1 hour.</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#0d5c59;color:#fffefb;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Reset password</a></p>
<p style="color:#6b645b;font-size:13px">If you didn't ask for this, you can ignore this email.</p>
</div>`,
  };
}

export function adminInviteEmail(to: string, invitedBy: string, role: string, url: string): Email {
  const roleLabel = role === "owner" ? "an owner" : "a support admin";
  return {
    to,
    subject: "You're invited to Tena HQ",
    text: `${invitedBy} invited you to Tena HQ as ${roleLabel}.\n\nCreate your account (or sign in) with ${to}, then open Tena HQ:\n${url}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1c1915">
<p><strong>${escapeHtml(invitedBy)}</strong> invited you to Tena HQ as ${roleLabel}.</p>
<p>Create your account (or sign in) with <strong>${escapeHtml(to)}</strong>, then open Tena HQ.</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#0d5c59;color:#fffefb;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Accept invite</a></p>
</div>`,
  };
}
