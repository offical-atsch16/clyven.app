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
  email?: string;
  userEmail?: string;
  title?: string;
  details?: string;
  description?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  console.log("Incoming Email Request / Options:", options);
  const ticketNumber = options.ticketNumber ? String(options.ticketNumber) : "";

  try {
    const authToken = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;
    const templateId = process.env.COURIER_TEMPLATE_ID;

    if (!authToken) {
      console.error(
        `[EMAIL ERROR] Versand fehlgeschlagen für Ticket #${ticketNumber}. Grund: COURIER_AUTH_TOKEN (oder COURIER_API_KEY) ist nicht gesetzt.`
      );
      return false;
    }

    const courier = new Courier({
      apiKey: authToken,
    });

    const userName = options.name || options.userName || "Kunde";
    const ticketEmail = options.email || options.userEmail || options.ticketEmail || options.to || "";
    const ticketSubject = options.subject || options.title || options.ticketSubject || "Support-Anfrage";
    const ticketDetails = options.details || options.description || options.message || options.ticketDetails || options.html || "Keine Details angegeben";

    const courierData = {
      user_name: userName,
      ticket_email: ticketEmail,
      ticket_number: ticketNumber,
      ticket_subject: ticketSubject,
      ticket_details: ticketDetails,
    };

    console.log("Courier Data Payload:", courierData);

    await courier.send.message({
      message: {
        to: {
          email: ticketEmail,
        },
        template: templateId,
        data: courierData,
      },
    });

    return true;
  } catch (error: any) {
    const reason = error?.message || String(error);
    console.error(`[EMAIL ERROR] Versand fehlgeschlagen für Ticket #${ticketNumber}. Grund:`, reason);
    return false;
  }
}
