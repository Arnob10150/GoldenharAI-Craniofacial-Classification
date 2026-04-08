import { useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/shared/ui/sonner";
import { useAuthStore } from "@/features/auth/store/authStore";
import { subscribeToSessionChanges } from "@/shared/lib/data";

const AuthBootstrapper = () => {
  const { initialize, profile, setSession } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (profile?.language_pref && i18n.language !== profile.language_pref) {
      void i18n.changeLanguage(profile.language_pref);
    }
  }, [i18n, profile?.language_pref, profile]);

  useEffect(() => {
    return subscribeToSessionChanges((bundle) => {
      setSession(bundle);
    });
  }, [setSession]);

  return null;
};

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <AuthBootstrapper />
    {children}
    <Toaster richColors position="top-right" />
  </ThemeProvider>
);
