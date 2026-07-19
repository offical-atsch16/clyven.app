import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing env vars");

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = fs.readFileSync("artifacts/api-server/migrations/001_tickets.sql", "utf8");

async function run() {
  const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
      if (error) {
        // Fallback: try direct REST query
        const res = await fetch(`${url}/rest/v1/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ query: stmt + ";" }),
        });
        if (!res.ok) {
          const text = await res.text();
          if (text.includes("already exists") || text.includes("duplicate")) {
            console.log("SKIP (exists):", stmt.substring(0, 50));
            continue;
          }
          console.error("FAIL:", stmt.substring(0, 60), "->", text.substring(0, 200));
          continue;
        }
      }
      console.log("OK:", stmt.substring(0, 50));
    } catch (e) {
      console.error("ERR:", stmt.substring(0, 50), e.message);
    }
  }
  console.log("Migration done.");
}

run();
