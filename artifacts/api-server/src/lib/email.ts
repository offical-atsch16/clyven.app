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

export interface SendReminderEmailOptions {
  toEmail: string;
  userName?: string;
  taskTitle: string;
  taskDueDate: string;
  dashboardUrl?: string;
}

export interface SendJournalReminderEmailOptions {
  toEmail: string;
  userName?: string;
  dashboardUrl?: string;
}

export interface SendStreakWarningEmailOptions {
  toEmail: string;
  userName?: string;
  currentStreak: number;
  dashboardUrl?: string;
}

export interface SendMilestoneEmailOptions {
  toEmail: string;
  userName?: string;
  milestoneHours: number;
  totalFocusMinutes: number;
  dashboardUrl?: string;
}

export interface SendNewsletterEmailOptions {
  toEmail: string;
  subject?: string;
  content?: string;
  unsubscribeUrl: string;
}

async function sendCourierNotification(
  toEmail: string,
  eventIdOrTemplateId: string,
  dataPayload: Record<string, any>
): Promise<boolean> {
  try {
    const authToken = process.env.COURIER_AUTH_TOKEN || process.env.COURIER_API_KEY;
    if (!authToken) {
      console.error(`[COURIER ERROR] Send failed for ${eventIdOrTemplateId}. Reason: COURIER_AUTH_TOKEN / COURIER_API_KEY not set.`);
      return false;
    }

    const courier = new Courier({ apiKey: authToken });
    const courierAny = courier as any;

    const messageObj = {
      to: { email: toEmail },
      template: eventIdOrTemplateId,
      data: dataPayload,
    };

    if (typeof courierAny.send === "function") {
      await courierAny.send({ message: messageObj });
    } else {
      await courierAny.send.message({ message: messageObj });
    }

    console.log(`[COURIER SUCCESS] Sent notification ${eventIdOrTemplateId} to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error(`[COURIER ERROR] Failed to send ${eventIdOrTemplateId} to ${toEmail}:`, error?.message || String(error));
    return false;
  }
}

export async function sendReminderEmail(options: SendReminderEmailOptions): Promise<boolean> {
  const templateId = process.env.COURIER_REMINDER_TEMPLATE_ID || "CLYVEN_REMINDER_DUE";
  const dashboardUrl = options.dashboardUrl || process.env.FRONTEND_URL?.split(",")[0] || "https://clyven.app";
  const userName = options.userName || "Clyven User";

  return sendCourierNotification(options.toEmail, templateId, {
    taskTitle: options.taskTitle,
    taskDueDate: options.taskDueDate,
    dashboardUrl,
    user_name: userName,
    task_title: options.taskTitle,
    task_due_date: options.taskDueDate,
    dashboard_url: dashboardUrl,
  });
}

export async function sendJournalReminderEmail(options: SendJournalReminderEmailOptions): Promise<boolean> {
  const templateId = process.env.COURIER_JOURNAL_TEMPLATE_ID || "CLYVEN_JOURNAL_REMINDER";
  const dashboardUrl = options.dashboardUrl || process.env.FRONTEND_URL?.split(",")[0] || "https://clyven.app";
  const userName = options.userName || "Clyven User";

  return sendCourierNotification(options.toEmail, templateId, {
    user_name: userName,
    dashboardUrl,
    dashboard_url: dashboardUrl,
  });
}

export async function sendStreakWarningEmail(options: SendStreakWarningEmailOptions): Promise<boolean> {
  const templateId = process.env.COURIER_STREAK_TEMPLATE_ID || "CLYVEN_STREAK_WARNING";
  const dashboardUrl = options.dashboardUrl || process.env.FRONTEND_URL?.split(",")[0] || "https://clyven.app";
  const userName = options.userName || "Clyven User";

  return sendCourierNotification(options.toEmail, templateId, {
    user_name: userName,
    currentStreak: options.currentStreak,
    current_streak: options.currentStreak,
    dashboardUrl,
    dashboard_url: dashboardUrl,
  });
}

export async function sendMilestoneEmail(options: SendMilestoneEmailOptions): Promise<boolean> {
  const templateId = process.env.COURIER_MILESTONE_TEMPLATE_ID || "CLYVEN_MILESTONE_REACHED";
  const dashboardUrl = options.dashboardUrl || process.env.FRONTEND_URL?.split(",")[0] || "https://clyven.app";
  const userName = options.userName || "Clyven User";

  return sendCourierNotification(options.toEmail, templateId, {
    user_name: userName,
    milestoneHours: options.milestoneHours,
    milestone_hours: options.milestoneHours,
    totalFocusMinutes: options.totalFocusMinutes,
    total_focus_minutes: options.totalFocusMinutes,
    dashboardUrl,
    dashboard_url: dashboardUrl,
  });
}

export async function sendNewsletterEmail(options: SendNewsletterEmailOptions): Promise<boolean> {
  const templateId = process.env.COURIER_NEWSLETTER_TEMPLATE_ID || "CLYVEN_NEWSLETTER";
  const subject = options.subject || "Clyven Newsletter Update";
  const content = options.content || "Welcome to the latest issue of the Clyven Newsletter.";

  const htmlFormatted = `
    <div style="font-family: 'Courier New', Courier, monospace; background-color: #090A0F; color: #FAFAFA; padding: 24px; border-radius: 8px;">
      <h2 style="color: #00F2FE;">${subject}</h2>
      <div style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        ${content}
      </div>
      <hr style="border: none; border-top: 1px solid #333;" />
      <p style="font-size: 12px; color: #888;">
        If you wish to stop receiving these updates, you can <a href="${options.unsubscribeUrl}" style="color: #00F2FE;">unsubscribe here</a>.
      </p>
    </div>
  `;

  return sendCourierNotification(options.toEmail, templateId, {
    subject,
    content,
    html: htmlFormatted,
    unsubscribeUrl: options.unsubscribeUrl,
    unsubscribe_url: options.unsubscribeUrl,
  });
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
