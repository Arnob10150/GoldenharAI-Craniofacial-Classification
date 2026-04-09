import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/features/auth/store/authStore";
import { normalizeLanguage, persistLanguage } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export const LanguageToggle = () => {
  const { i18n, t } = useTranslation();
  const { profile, updateProfile } = useAuthStore();

  const changeLanguage = async (language: "en" | "bn") => {
    persistLanguage(language);
    await i18n.changeLanguage(language);
    if (profile && normalizeLanguage(profile.language_pref) !== language) {
      await updateProfile({ ...profile, language_pref: language });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Languages className="size-4" />
          {normalizeLanguage(i18n.language) === "bn" ? t("languageToggle.shortBangla") : "EN"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void changeLanguage("en")}>{t("common.english")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void changeLanguage("bn")}>{t("common.bangla")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
