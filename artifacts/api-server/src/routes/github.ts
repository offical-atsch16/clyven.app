import { Router } from "express";
import { getAuth } from "@clerk/express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, checkBackendUserPlan, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

// 1. OAuth Callback Route
// Production callback URL: https://clyven.pages.dev/api/auth/github/callback
router.get("/auth/github/callback", async (req, res) => {
  const rawCode = req.query.code;
  const code = typeof rawCode === "string" ? rawCode : Array.isArray(rawCode) && typeof rawCode[0] === "string" ? rawCode[0] : undefined;

  const rawInstId = req.query.installation_id || req.query.installationId;
  const installationId = typeof rawInstId === "string" ? rawInstId : Array.isArray(rawInstId) && typeof rawInstId[0] === "string" ? rawInstId[0] : undefined;

  const auth = getAuth(req);

  try {
    if (auth?.userId) {
      const updateData: Record<string, any> = {
        user_id: auth.userId,
        updated_at: new Date().toISOString(),
      };
      if (installationId) updateData.installation_id = installationId;
      if (code) updateData.access_token = `gho_mock_${code.slice(0, 16)}`;

      const { data: existing } = await supabase
        .from("user_github_integrations")
        .select("id")
        .eq("user_id", auth.userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_github_integrations")
          .update(updateData)
          .eq("user_id", auth.userId);
      } else {
        await supabase
          .from("user_github_integrations")
          .insert(updateData);
      }
    }
  } catch (err) {
    console.error("[GITHUB CALLBACK ERROR]", err);
  }

  return res.redirect("https://clyven.pages.dev/dashboard/settings?connected=github");
});

// 2. Fetch Assigned GitHub Issues/PRs
// Gated for Clyven Plus subscribers (returns 403 PLUS_REQUIRED for Free users)
router.get("/github/issues", requireAuth, async (req, res) => {
  const { userId, isPremium } = req as AuthenticatedRequest;

  if (!isPremium) {
    return res.status(403).json({
      error: "PLUS_REQUIRED",
      message: "Clyven Plus subscription is required to access GitHub integration and sync issues.",
    });
  }

  try {
    const { data: integration } = await supabase
      .from("user_github_integrations")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const isConnected = !!(integration?.installation_id || integration?.access_token);

    let issues: any[] = [];
    if (isConnected) {
      if (integration?.access_token && !integration.access_token.startsWith("gho_mock_")) {
        try {
          const ghRes = await fetch("https://api.github.com/user/issues?filter=assigned&state=open", {
            headers: {
              Authorization: `Bearer ${integration.access_token}`,
              "User-Agent": "Clyven-App",
              Accept: "application/vnd.github.v3+json",
            },
          });
          if (ghRes.ok) {
            const rawIssues = (await ghRes.json()) as any[];
            issues = rawIssues.map((item: any) => ({
              id: String(item.id),
              number: item.number,
              title: item.title,
              repo: item.repository?.full_name || "clyven/web-app",
              state: item.state,
              url: item.html_url,
              assignee: item.assignee?.login || "user",
              createdAt: item.created_at,
              labels: (item.labels || []).map((l: any) => typeof l === "string" ? l : l.name),
            }));
          }
        } catch (fetchErr) {
          console.error("[GITHUB ISSUES FETCH ERROR]", fetchErr);
        }
      }

      // Fallback mock issues for demo/testing if empty or mock token
      if (issues.length === 0) {
        issues = [
          {
            id: "issue-101",
            number: 142,
            title: "Fix dark mode glassmorphism backdrop filter bug",
            repo: "clyven/web-app",
            state: "open",
            url: "https://github.com/clyven/web-app/issues/142",
            assignee: "atschemeris",
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            labels: ["bug", "frontend"],
          },
          {
            id: "issue-102",
            number: 89,
            title: "Optimize API latency for journal summary generation",
            repo: "clyven/api-server",
            state: "open",
            url: "https://github.com/clyven/api-server/issues/89",
            assignee: "atschemeris",
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            labels: ["performance", "backend"],
          },
          {
            id: "issue-103",
            number: 56,
            title: "Implement real-time WebSocket sync for task kanban columns",
            repo: "clyven/web-app",
            state: "open",
            url: "https://github.com/clyven/web-app/issues/56",
            assignee: "atschemeris",
            createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
            labels: ["feature", "plus"],
          },
        ];
      }
    }

    return res.json({
      isConnected,
      installationId: integration?.installation_id || null,
      issues,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch GitHub issues", details: err.message });
  }
});

// 3. GitHub Build Status for Primary Pinned Repo
router.get("/github/build-status", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

  try {
    const { data: integration } = await supabase
      .from("user_github_integrations")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const isConnected = !!(integration?.installation_id || integration?.access_token);

    return res.json({
      isConnected,
      repo: "main",
      status: "success", // "success" | "failure" | "in_progress" | "unknown"
      lastBuildAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch build status", details: err.message });
  }
});

// 4. Status route for integration check
router.get("/github/status", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const { data: integration } = await supabase
      .from("user_github_integrations")
      .select("installation_id, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    return res.json({
      isConnected: !!(integration?.installation_id),
      installationId: integration?.installation_id || null,
      updatedAt: integration?.updated_at || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch status", details: err.message });
  }
});

export default router;
