import { Courier } from "@trycourier/courier";

export interface SendEmailOptions {
  userName?: string;
  ticketEmail?: string;
  ticketNumber?: string;
  ticketSubject?: string;
  ticketDetails?: string;
  ticketPasscode?: string;
  ticket_passcode?: string;
  passcode?: string;
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

export interface SendReplyEmailOptions {
  toEmail: string;
  userName: string;
  ticketNumber: string;
  ticketSubject: string;
  ticketDetails: string;
  replyMessage: string;
  agentName: string;
  agentEmail: string;
  templateId?: string;
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
    const ticketPasscode = options.ticketPasscode || options.ticket_passcode || options.passcode || "";

    const courierData = {
      user_name: userName,
      ticket_email: ticketEmail,
      ticket_number: ticketNumber,
      ticket_subject: ticketSubject,
      ticket_details: ticketDetails,
      ticket_passcode: ticketPasscode,
    };

    console.log("Courier Data Payload:", courierData);

    const courierAny = courier as any;
    if (typeof courierAny.send === "function") {
      await courierAny.send({
        message: {
          to: {
            email: ticketEmail,
          },
          template: templateId,
          data: courierData,
        },
      });
    } else {
      await courierAny.send.message({
        message: {
          to: {
            email: ticketEmail,
          },
          template: templateId,
          data: courierData,
        },
      });
    }

    return true;
  } catch (error: any) {
    const reason = error?.message || String(error);
    console.error(`[EMAIL ERROR] Versand fehlgeschlagen für Ticket #${ticketNumber}. Grund:`, reason);
    return false;
  }
}

export async function sendReplyEmail(options: SendReplyEmailOptions): Promise<boolean> {
  console.log("Incoming Reply Email Request / Options:", options);
  const ticketNumber = options.ticketNumber ? String(options.ticketNumber) : "";

  try {
    const authToken = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;
    const templateId = options.templateId || process.env.COURIER_REPLY_TEMPLATE_ID || process.env.COURIER_TEMPLATE_ID;

    if (!authToken) {
      console.error(
        `[EMAIL ERROR] Antwort-Versand fehlgeschlagen für Ticket #${ticketNumber}. Grund: COURIER_AUTH_TOKEN (oder COURIER_API_KEY) ist nicht gesetzt.`
      );
      return false;
    }

    const courier = new Courier({
      apiKey: authToken,
    });

    const courierData = {
      user_name: options.userName,
      ticket_number: options.ticketNumber,
      ticket_subject: options.ticketSubject,
      ticket_details: options.ticketDetails,
      reply_message: options.replyMessage,
      agent_name: options.agentName,
      agent_email: options.agentEmail,
    };

    console.log("Courier Reply Data Payload:", courierData);

    const courierAny = courier as any;
    if (typeof courierAny.send === "function") {
      await courierAny.send({
        message: {
          to: {
            email: options.toEmail,
          },
          template: templateId,
          data: courierData,
        },
      });
    } else {
      await courierAny.send.message({
        message: {
          to: {
            email: options.toEmail,
          },
          template: templateId,
          data: courierData,
        },
      });
    }

    return true;
  } catch (error: any) {
    const reason = error?.message || String(error);
    console.error(`[EMAIL ERROR] Antwort-Versand fehlgeschlagen für Ticket #${ticketNumber}. Grund:`, reason);
    return false;
  }
}
