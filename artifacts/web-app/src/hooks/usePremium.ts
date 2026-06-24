import { useAuth, useUser } from "@clerk/react";

export const FREE_LIMITS = {
  notes: 10,
  bookmarks: 25,
  focusModesCustom: 1,
};

export function usePremium() {
  const { has } = useAuth();
  const { user } = useUser();

  const isPremium =
    (typeof has === "function" &&
      (has({ plan: "clyven_plus" } as any) ||
        has({ plan: "plus" } as any))) ||
    user?.publicMetadata?.plan === "premium" ||
    user?.publicMetadata?.clyven_plus === true ||
    user?.publicMetadata?.premium === true;

  function openUpgrade() {
    const clerk = (window as any).Clerk;
    if (clerk?.openCheckout) {
      clerk.openCheckout({ planSlug: "clyven_plus" });
    } else if (clerk?.openBillingPortal) {
      clerk.openBillingPortal();
    } else {
      window.location.href = "/pricing";
    }
  }

  function openManage() {
    const clerk = (window as any).Clerk;
    if (clerk?.openBillingPortal) {
      clerk.openBillingPortal();
    } else {
      window.location.href = "/pricing";
    }
  }

  return { isPremium: !!isPremium, openUpgrade, openManage, limits: FREE_LIMITS };
}
