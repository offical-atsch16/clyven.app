import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
  ticketNumber,
}: {
  to: string;
  subject: string;
  html: string;
  ticketNumber: string;
}): Promise<boolean> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error(`[EMAIL ERROR] Versand fehlgeschlagen für Ticket #${ticketNumber}. Grund: GMAIL_USER or GMAIL_APP_PASSWORD missing`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"CLYVEN Support" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error: any) {
    const reason = error?.message || String(error);
    console.error(`[EMAIL ERROR] Versand fehlgeschlagen für Ticket #${ticketNumber}. Grund:`, reason);
    return false;
  }
}
