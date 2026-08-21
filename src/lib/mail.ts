import "server-only";

/**
 * Optional contact notification.
 *
 * Email is only attempted when SMTP settings are present. When they are not,
 * the submission is still stored and the user still gets a genuine success
 * response — the site never claims a notification was sent when it was not.
 * See README, "Email notifications", for the variables required.
 */

export type MailPayload = {
  subject: string;
  text: string;
};

export type MailResult = { sent: boolean; reason?: string };

function isConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.CONTACT_NOTIFICATION_TO,
  );
}

export async function sendContactNotification(
  payload: MailPayload,
): Promise<MailResult> {
  if (!isConfigured()) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  try {
    // Imported lazily so the dependency is optional and never bundled unless used.
    const nodemailer = await import("nodemailer");

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    });

    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: process.env.CONTACT_NOTIFICATION_TO,
      subject: payload.subject,
      text: payload.text,
    });

    return { sent: true };
  } catch (error) {
    // Never fail the submission because notification failed — the lead is saved.
    console.error("[contact] notification failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return { sent: false, reason: "send_failed" };
  }
}
