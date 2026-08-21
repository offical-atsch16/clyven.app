import nodemailer from "nodemailer";

export function escapeHTML(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
  const safeTicketNum = String(ticketNumber || "").replace(/[^a-zA-Z0-9-]/g, "");

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("[EMAIL ERROR] Versand fehlgeschlagen für Ticket #" + safeTicketNum + ". Grund: GMAIL_USER or GMAIL_APP_PASSWORD missing");
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
      subject: escapeHTML(subject),
      html,
    });
    return true;
  } catch (error: any) {
    const safeReason = String(error?.message || error || "").replace(/[\r\n]/g, " ");
    console.error("[EMAIL ERROR] Versand fehlgeschlagen für Ticket #" + safeTicketNum + ". Grund: " + safeReason);
    return false;
  }
}
