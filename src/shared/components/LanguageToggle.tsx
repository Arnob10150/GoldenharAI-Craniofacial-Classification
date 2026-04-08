import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export const LanguageToggle = () => {
  const { i18n } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Languages className="size-4" />
          {i18n.language === "bn" ? "বাং" : "EN"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void i18n.changeLanguage("en")}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void i18n.changeLanguage("bn")}>বাংলা</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
