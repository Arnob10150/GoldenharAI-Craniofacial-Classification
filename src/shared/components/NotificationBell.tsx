import { Bell } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useNotifications } from "@/shared/hooks/useNotifications";
import type { Profile } from "@/shared/lib/types";
import { useNotificationStore } from "@/shared/store/notificationStore";

export const NotificationBell = ({ profile }: { profile: Profile | null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead } = useNotificationStore();
  useNotifications(profile);

  useEffect(() => {
    void unreadCount;
  }, [unreadCount]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {Math.min(unreadCount, 9)}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-1rem))]">
        <DropdownMenuLabel>{t("common.notifications")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex cursor-pointer flex-col items-start gap-1 whitespace-normal py-3"
                onClick={() => {
                  void markRead(notification.id);
                  navigate(notification.link);
                }}
              >
                <span className="text-sm font-medium">{notification.message}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-6 text-sm text-muted-foreground">{t("common.noNotifications")}</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
