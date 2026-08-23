import { useState, useEffect } from "react";
import { api } from "../lib/api";

export function useFeatureFlag(flagKey: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    async function checkFlag() {
      try {
        const res = await api.getFeatureFlags();
        if (res && res.flags) {
          setIsEnabled(Boolean(res.flags[flagKey]));
        }
      } catch (err) {
        console.error("Failed to fetch feature flag:", err);
      }
    }
    checkFlag();
  }, [flagKey]);

  return isEnabled;
}
