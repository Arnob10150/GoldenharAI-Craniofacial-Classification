import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrainCircuit, LogOut, Menu, ShieldCheck, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { LanguageToggle } from "@/shared/components/LanguageToggle";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { NotificationBell } from "@/shared/components/NotificationBell";
import { translateRoleLabel } from "@/shared/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { useAuthStore } from "@/features/auth/store/authStore";
import { homeByRole } from "@/shared/lib/navigation";

const guestLinks = [
  { labelKey: "common.patientPortal", to: "/patient/dashboard" },
  { labelKey: "common.clinicalDashboard", to: "/doctor/dashboard" },
];

export const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, logout } = useAuthStore();

  const dashboardLink = profile ? homeByRole[profile.role] : "/auth/login";
  const profileRecordsLink = profile?.role === "parent" ? "/patient/children" : "/doctor/patients";
  const careWorkflowLink = profile?.role === "parent" ? "/patient/history" : "/doctor/referrals";

  const handleLogout = async () => {
    await logout();
    toast.success(t("toast.signedOut"));
    navigate("/", { replace: true });
  };

  const navLinks = profile
    ? [
        { label: t("common.home"), to: "/" },
        { label: t("common.dashboard"), to: dashboardLink },
        { label: profile.role === "parent" ? t("common.children") : t("common.patients"), to: profileRecordsLink },
        { label: profile.role === "parent" ? t("common.scanHistory") : t("common.referrals"), to: careWorkflowLink },
      ]
    : guestLinks.map((item) => ({ label: t(item.labelKey), to: item.to }));

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="border-b border-border/60 p-4 text-left">
                <SheetTitle>{t("common.appName")}</SheetTitle>
                <SheetDescription>
                  {profile ? t("nav.authenticatedDescription") : t("nav.guestDescription")}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4">
                <Link to="/" className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <BrainCircuit className="size-5" />
                  </span>
                  <div>
                    <div className="font-semibold tracking-tight">{t("common.appName")}</div>
                    <div className="text-xs text-muted-foreground">{t("common.tagline")}</div>
                  </div>
                </Link>
                <div className="grid gap-2">
                  {navLinks.map((item) => (
                    <Button key={item.to} variant="ghost" asChild className="justify-start">
                      <Link to={item.to}>{item.label}</Link>
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                  {profile ? <NotificationBell profile={profile} /> : null}
                </div>
                {profile ? (
                  <Button variant="destructive" className="w-full gap-2" onClick={() => void handleLogout()}>
                    <LogOut className="size-4" />
                    {t("common.logout")}
                  </Button>
                ) : (
                  <div className="grid gap-2">
                    <Button variant="outline" asChild>
                      <Link to="/auth/login">{t("common.login")}</Link>
                    </Button>
                    <Button asChild className="gap-2">
                      <Link to="/auth/register">
                        <ShieldCheck className="size-4" />
                        {t("common.signup")}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link to={profile ? dashboardLink : "/"} className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <BrainCircuit className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-semibold tracking-tight">{t("common.appName")}</div>
              <div className="truncate text-xs text-muted-foreground">
                {profile
                  ? t("nav.workspace", { role: translateRoleLabel(profile.role) })
                  : t("common.tagline")}
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2">
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((item) => (
              <Button key={item.to} variant="ghost" asChild>
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
          </nav>

          <LanguageToggle />
          <ThemeToggle />

          {profile ? (
            <>
              <NotificationBell profile={profile} />
              <Button
                variant="outline"
                className="hidden gap-2 rounded-full md:inline-flex"
                onClick={() => void handleLogout()}
              >
                <LogOut className="size-4" />
                {t("common.logout")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded-full pl-3">
                    <UserCircle2 className="size-4" />
                    <span className="hidden max-w-32 truncate sm:inline">{profile.full_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="text-sm font-semibold">{profile.full_name}</div>
                    <div className="text-xs font-normal text-muted-foreground">{profile.institution || profile.district}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashboardLink}>{t("common.dashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={profileRecordsLink}>{t("nav.profileRecords")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={careWorkflowLink}>{t("nav.careWorkflows")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => void handleLogout()}>
                    <LogOut className="size-4" />
                    {t("common.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/auth/login">{t("common.login")}</Link>
              </Button>
              <Button asChild className="gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
                <Link to="/auth/register">
                  <ShieldCheck className="size-4" />
                  {t("common.signup")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
