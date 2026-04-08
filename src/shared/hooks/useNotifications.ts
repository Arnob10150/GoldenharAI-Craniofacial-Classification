import { useEffect } from "react";
import { subscribeToRealtimeEvents } from "@/shared/lib/data";
import type { Profile } from "@/shared/lib/types";
import { useNotificationStore } from "@/shared/store/notificationStore";

export const useNotifications = (profile: Profile | null) => {
  const { refresh } = useNotificationStore();

  useEffect(() => {
    if (!profile) return;
    void refresh(profile);
    const unsubscribe = subscribeToRealtimeEvents((event) => {
      if (!event.userId || event.userId === profile.id || event.entity === "notifications") {
        void refresh(profile);
      }
    });
    return unsubscribe;
  }, [profile, refresh]);
};
