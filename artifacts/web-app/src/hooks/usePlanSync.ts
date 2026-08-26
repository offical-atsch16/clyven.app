import { useEffect, useCallback } from "react";
import { useSession, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function usePlanSync() {
  const { session } = useSession();
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();

  const syncPlanSession = useCallback(async () => {
    if (!session || !user) return;

    try {
      // 1. Force Clerk session reload to fetch updated JWT token and publicMetadata
      if (typeof session.reload === "function") {
        await session.reload();
      }

      // 2. Call backend sync-plan route
      await api.syncPlan();

      // 3. Invalidate user-me React Query cache
      await queryClient.invalidateQueries({ queryKey: ["user-me"] });
      console.log("[PLAN SYNC SUCCESS] Refreshed Clerk session and updated plan state.");
    } catch (err) {
      console.error("[PLAN SYNC ERROR] Failed to reload session and sync plan:", err);
    }
  }, [session, user, queryClient]);

  // Check URL query string for post-checkout parameters
  useEffect(() => {
    if (!isLoaded || !session || !user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasCheckoutTrigger =
      urlParams.get("checkout") === "success" ||
      urlParams.get("upgraded") === "true" ||
      urlParams.has("session_id") ||
      urlParams.get("plan") === "business" ||
      urlParams.get("plan") === "plus";

    if (hasCheckoutTrigger) {
      syncPlanSession().then(() => {
        // Clean up URL parameters after sync
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("checkout");
        newUrl.searchParams.delete("upgraded");
        newUrl.searchParams.delete("session_id");
        newUrl.searchParams.delete("plan");
        window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
      });
    }
  }, [isLoaded, session, user, syncPlanSession]);

  return { syncPlanSession };
}
