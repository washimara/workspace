import { useThemeContext } from "@/contexts/ThemeContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Moon, Sun, Palette } from "lucide-react";
import { themeOptions } from "@/contexts/ThemeContext";

export function ThemeSelector() {
  const { currentTheme, setTheme } = useThemeContext();

  const getIcon = () => {
    switch (currentTheme.value) {
      case "dark":
        return <Moon className={`h-[1.2rem] w-[1.2rem] ${currentTheme.textPrimary}`} />;
      case "green-forest":
      case "cool":
        return <Palette className={`h-[1.2rem] w-[1.2rem] ${currentTheme.textPrimary}`} />;
      default:
        return <Sun className={`h-[1.2rem] w-[1.2rem] ${currentTheme.textPrimary}`} />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setTheme(theme)}
            className={
              currentTheme.value === theme.value
                ? "bg-muted font-medium"
                : ""
            }
          >
            {theme.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}