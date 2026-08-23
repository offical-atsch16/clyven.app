import { Courier } from "@trycourier/courier";

export interface SendEmailOptions {
  userName?: string;
  ticketEmail?: string;
  ticketNumber?: string;
  ticketSubject?: string;
  ticketDetails?: string;
  to?: string;
  subject?: string;
  message?: string;
  html?: string;
  name?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const ticket_number = options.ticketNumber || "";
  try {
    const authToken = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;
    const templateId = process.env.COURIER_TEMPLATE_ID;

    if (!authToken) {
      console.error(
        `[EMAIL ERROR] Versand fehlgeschlagen für Ticket #${ticket_number}. Grund: COURIER_AUTH_TOKEN (oder COURIER_API_KEY) ist nicht gesetzt.`
      );
      return false;
    }

    const courier = new Courier({
      apiKey: authToken,
    });

    const user_name = options.userName || options.name || "Kunde";
    const ticket_email = options.ticketEmail || options.to || "";
    const ticket_subject = options.ticketSubject || options.subject || "";
    const ticket_details = options.ticketDetails || options.message || options.html || "";

    await courier.send.message({
      message: {
        to: {
          email: ticket_email,
        },
        template: templateId,
        data: {
          user_name: user_name || "Kunde",
          ticket_email,
          ticket_number,
          ticket_subject,
          ticket_details,
        },
      },
    });

    return true;
  } catch (error: any) {
    const reason = error?.message || String(error);
    console.error(`[EMAIL ERROR] Versand fehlgeschlagen für Ticket #${ticket_number}. Grund:`, reason);
    return false;
  }
}
