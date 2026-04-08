import { Home, LayoutDashboard, ListChecks, MessageSquare, ScanSearch, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { Profile } from "@/shared/lib/types";
import { cn } from "@/shared/lib/utils";

const itemClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
    isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

interface PortalSidebarProps {
  profile: Profile;
  className?: string;
}

export const PortalSidebar = ({ profile, className }: PortalSidebarProps) => {
  const shared = [
    { to: profile.role === "parent" ? "/patient/dashboard" : "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];
  const links =
    profile.role === "parent"
      ? [
          ...shared,
          { to: "/patient/new-scan", label: "New scan", icon: ScanSearch },
          { to: "/patient/history", label: "Scan history", icon: ListChecks },
          { to: "/patient/children", label: "Child profiles", icon: Users },
        ]
      : [
          ...shared,
          { to: "/doctor/new-scan", label: profile.role === "chw" ? "Submit scan" : "New scan", icon: ScanSearch },
          { to: "/doctor/patients", label: "Patients", icon: Users },
          { to: "/doctor/referrals", label: "Referrals", icon: MessageSquare },
          { to: "/doctor/analytics", label: "Analytics", icon: Home },
        ];

  return (
    <aside className={cn("w-72 shrink-0 border-r border-border/60 bg-card/70 px-4 py-6 lg:block", className)}>
      <div className="rounded-3xl bg-linear-to-br from-primary/10 via-card to-card p-5">
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{profile.role}</div>
        <div className="mt-2 text-xl font-semibold">{profile.full_name}</div>
        <div className="mt-1 text-sm text-muted-foreground">{profile.institution || profile.district}</div>
      </div>
      <nav className="mt-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} className={itemClassName}>
              <Icon className="size-4" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
