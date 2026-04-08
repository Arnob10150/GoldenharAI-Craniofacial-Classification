import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/shared/components/Navbar";
import { PortalSidebar } from "@/shared/components/PortalSidebar";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { useAuthStore } from "@/features/auth/store/authStore";

export const PortalLayout = () => {
  const { profile } = useAuthStore();

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex w-full">
        <PortalSidebar profile={profile} className="hidden lg:block" />
        <div className="min-w-0 flex-1">
          <header className="sticky top-[73px] z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu className="size-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0">
                    <SheetHeader className="border-b border-border/60 p-4">
                      <SheetTitle>Navigation</SheetTitle>
                      <SheetDescription>Move across patient records, scans, referrals, and analytics.</SheetDescription>
                    </SheetHeader>
                    <div className="p-4">
                      <PortalSidebar profile={profile} className="block w-full border-none bg-transparent px-0 py-0" />
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">GoldenScope AI</div>
                  <div className="truncate text-sm font-medium text-foreground/80">
                    {profile.role === "parent" ? "Parent portal" : profile.role === "chw" ? "Community health workflow" : "Clinical workspace"}
                  </div>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="truncate text-sm font-semibold">{profile.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">{profile.institution || profile.district}</div>
              </div>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
