import { useLanguage } from "@/contexts/LanguageContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const { currentTheme } = useThemeContext();

  // Add a safe check to prevent mapping over undefined
  if (!languages || !Array.isArray(languages)) {
    return null; // Return nothing if languages is undefined or not an array
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className={`h-[1.2rem] w-[1.2rem] ${currentTheme.textPrimary}`} />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang)}
            className={
              currentLanguage.code === lang.code
                ? "bg-muted font-medium"
                : ""
            }
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}