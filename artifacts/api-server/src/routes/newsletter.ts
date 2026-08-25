import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { sendNewsletterEmail } from "../lib/email.js";

const router = Router();

// Subscribe
router.post("/subscribe", async (req, res) => {
  const { email } = req.body || {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_subscribed")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existing) {
      if (existing.is_subscribed) {
        return res.json({ success: true, message: "Already subscribed to newsletter", email: cleanEmail });
      }

      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .update({
          is_subscribed: true,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, message: "Subscription re-activated", email: cleanEmail, subscriber: data });
    }

    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: cleanEmail,
        is_subscribed: true,
        subscribed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: "Successfully subscribed to newsletter", email: cleanEmail, subscriber: data });
  } catch (e: any) {
    console.error("[NEWSLETTER SUBSCRIBE ERROR]", e);
    res.status(500).json({ error: "Failed to subscribe to newsletter", detail: e.message });
  }
});

// Unsubscribe
const handleUnsubscribe = async (req: any, res: any) => {
  const email = (req.body?.email || req.query?.email || "").toString().trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid or missing email parameter" });
  }

  try {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .update({
        is_subscribed: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", email)
      .select();

    if (error) throw error;

    res.json({ success: true, message: "Successfully unsubscribed from newsletter", email });
  } catch (e: any) {
    console.error("[NEWSLETTER UNSUBSCRIBE ERROR]", e);
    res.status(500).json({ error: "Failed to unsubscribe from newsletter", detail: e.message });
  }
};

router.post("/unsubscribe", handleUnsubscribe);
router.get("/unsubscribe", handleUnsubscribe);

// Manual Broadcast endpoint
router.post("/broadcast", async (req, res) => {
  const { subject, content } = req.body || {};
  const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "https://clyven.app";

  try {
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_subscribed", true);

    if (error) throw error;

    const activeSubscribers = subscribers || [];
    let sentCount = 0;

    for (const sub of activeSubscribers) {
      if (!sub.email) continue;
      const unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`;
      const success = await sendNewsletterEmail({
        toEmail: sub.email,
        subject,
        content,
        unsubscribeUrl,
      });
      if (success) sentCount++;
    }

    res.json({ success: true, total: activeSubscribers.length, sentCount });
  } catch (e: any) {
    console.error("[NEWSLETTER BROADCAST ERROR]", e);
    res.status(500).json({ error: "Failed to broadcast newsletter", detail: e.message });
  }
});

export default router;
