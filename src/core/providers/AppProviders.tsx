import { useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/shared/ui/sonner";
import { useAuthStore } from "@/features/auth/store/authStore";
import { subscribeToSessionChanges } from "@/shared/lib/data";
import { getStoredLanguage, normalizeLanguage } from "@/shared/lib/i18n";

const AuthBootstrapper = () => {
  const { initialize, profile, setSession } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const stored = getStoredLanguage();
    const preferred = stored ?? (profile?.language_pref ? normalizeLanguage(profile.language_pref) : null);
    if (preferred && i18n.language !== preferred) {
      void i18n.changeLanguage(preferred);
    }
  }, [i18n, profile?.language_pref]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = normalizeLanguage(i18n.language);
  }, [i18n.language]);

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
