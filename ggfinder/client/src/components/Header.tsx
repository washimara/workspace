import { LogOut, User, Menu } from "lucide-react"
import { Button } from "./ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { cn } from "@/lib/utils"
import { LanguageSelector } from "./LanguageSelector"
import { ThemeSelector } from "./ThemeSelector"
import { useThemeContext } from "@/contexts/ThemeContext"
import { Logo } from "./Logo"
import { useLanguage } from "@/contexts/LanguageContext"

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const { currentTheme } = useThemeContext()
  const { t } = useLanguage()

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

  const navItems = [
    { name: t("home"), href: "/" },
    { name: t("myPosts"), href: "/my-posts" },
    { name: t("createPost"), href: "/create-post" },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full border-b ${currentTheme.headerFooterBg || currentTheme.secondaryColor}`}>
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-16 max-w-full">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <Logo isHeader={false} />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium ${textColorClass || currentTheme.textSecondary} transition-colors hover:opacity-80`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSelector />
          <LanguageSelector />

          {user && (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile">
                  <User className={`h-5 w-5 ${textColorClass || currentTheme.textPrimary}`} />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className={`h-5 w-5 ${textColorClass || currentTheme.textPrimary}`} />
              </Button>
            </>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className={`h-5 w-5 ${textColorClass || currentTheme.textPrimary}`} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className={currentTheme.headerFooterBg || currentTheme.secondaryColor}>
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium ${textColorClass || currentTheme.textSecondary} transition-colors hover:opacity-80`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                {user && (
                  <Button variant="ghost" className="justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}