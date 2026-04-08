import { useEffect } from "react";
import { subscribeToRealtimeEvents } from "@/shared/lib/data";
import type { Profile } from "@/shared/lib/types";

export const useRealtimeReferrals = (profile: Profile | null, onRefresh: () => void) => {
  useEffect(() => {
    if (!profile) return;
    const unsubscribe = subscribeToRealtimeEvents((event) => {
      if (event.entity === "referrals") {
        onRefresh();
      }
    });
    return unsubscribe;
  }, [profile, onRefresh]);
};
