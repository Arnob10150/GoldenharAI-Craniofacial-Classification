import { create } from "zustand";
import { getUnreadNotificationCount, listNotifications, markNotificationRead } from "@/shared/lib/data";
import type { AppNotification, Profile } from "@/shared/lib/types";

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: (profile: Profile) => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: async (profile) => {
    set({ loading: true });
    const notifications = await listNotifications(profile);
    const unreadCount = await getUnreadNotificationCount(profile);
    set({ notifications, unreadCount, loading: false });
  },
  markRead: async (notificationId) => {
    await markNotificationRead(notificationId);
    const notifications = get().notifications.map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    );
    set({ notifications, unreadCount: notifications.filter((notification) => !notification.read).length });
  },
}));
