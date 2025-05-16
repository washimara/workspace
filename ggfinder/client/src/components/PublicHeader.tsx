import { Button } from "./ui/button"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { LanguageSelector } from "./LanguageSelector"
import { ThemeSelector } from "./ThemeSelector"
import { useThemeContext } from "@/contexts/ThemeContext"
import { Logo } from "./Logo"
import { useLanguage } from "@/contexts/LanguageContext"
import { LogOut, User } from "lucide-react"

export function PublicHeader() {
  const { user, logout } = useAuth()
  const { currentTheme } = useThemeContext()
  const { t } = useLanguage()
  const navigate = useNavigate()

  // Determine text color based on theme
  const textColorClass = currentTheme.value === "green-forest" || currentTheme.value === "dark" ? "text-white" : "";

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full ${currentTheme.headerFooterBg || currentTheme.secondaryColor}`}>
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-16 max-w-full">
        <Link to="/" className="flex items-center">
          <Logo isHeader={false} />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeSelector />
          <LanguageSelector />

          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile">
                  <User className={`h-5 w-5 ${textColorClass || currentTheme.textPrimary}`} />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className={`h-5 w-5 ${textColorClass || currentTheme.textPrimary}`} />
              </Button>
              <Button variant="default" size="sm" asChild className={currentTheme.buttonPrimary}>
                <Link to="/my-posts">{t("myPosts")}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className={textColorClass || currentTheme.textPrimary}>
                <Link to="/login">{t("signIn")}</Link>
              </Button>
              <Button variant="default" size="sm" asChild className={currentTheme.buttonPrimary}>
                <Link to="/create-post">{t("createPost")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}