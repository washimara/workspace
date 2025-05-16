// Create a new ProfileCard component to display user information including Good Karma
import { Award } from "lucide-react";
import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/ui/theme-provider";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const { theme } = useTheme();
  const { currentTheme } = useThemeContext();
  const { t } = useLanguage();

  // Determine text colors based on theme
  const textColor = theme === "dark"
    ? "text-white"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textPrimary;

  const secondaryTextColor = theme === "dark"
    ? "text-gray-300"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textSecondary;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("userProfile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* User Name */}
          <div>
            <h3 className={`font-medium ${textColor}`}>{t("name")}</h3>
            <p className={`text-sm ${secondaryTextColor}`}>{user.name}</p>
          </div>
          
          {/* Email */}
          <div>
            <h3 className={`font-medium ${textColor}`}>{t("email")}</h3>
            <p className={`text-sm ${secondaryTextColor}`}>{user.email}</p>
          </div>
          
          {/* Good Karma - Prominently displayed */}
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg flex items-center space-x-3">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className={`font-medium ${textColor}`}>{t("goodKarma")}</h3>
              <p className={`text-lg font-bold ${textColor}`}>{user.goodKarma || 0}</p>
            </div>
          </div>
          
          {/* Member since */}
          <div>
            <h3 className={`font-medium ${textColor}`}>{t("memberSince")}</h3>
            <p className={`text-sm ${secondaryTextColor}`}>
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}