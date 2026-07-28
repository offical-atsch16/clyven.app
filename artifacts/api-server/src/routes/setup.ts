import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";

const router = Router();

const setupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // limit each IP to 5 requests per window
  message: { error: "Too many setup requests, please try again later." },
});

router.post("/", setupLimiter, async (_req, res) => {
  try {
    // Optional seed from env (never hardcoded)
    const seedEmail = process.env.ADMIN_INITIAL_EMAIL;
    const seedPassword = process.env.ADMIN_INITIAL_PASSWORD;
    let seeded = false;

    if (seedEmail && seedPassword) {
      // Check if admin user already exists using Supabase Client
      const { data: existing, error: checkError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", seedEmail);

      if (checkError) {
        throw new Error(`Failed to check existing admin: ${checkError.message}. Make sure the tables exist in Supabase (you can run migration SQL in your Supabase Dashboard SQL Editor).`);
      }

      if (!existing || existing.length === 0) {
        const hash = await bcrypt.hash(seedPassword, 12);
        const { error: insertError } = await supabase
          .from("admin_users")
          .insert({ email: seedEmail, password_hash: hash });

        if (insertError) {
          throw new Error(`Failed to seed admin user: ${insertError.message}`);
        }
        seeded = true;
      }
    }

    res.json({
      success: true,
      message: "Setup complete. Tables check passed successfully. Admin user seeded: " + seeded,
      migration_instruction: "If you ever need to recreate or update database tables, please use the Supabase Dashboard SQL Editor to execute the migrations SQL."
    });
  } catch (e: any) {
    res.status(500).json({ error: "Setup/Seeding failed", detail: e.message });
  }
});

export default router;
