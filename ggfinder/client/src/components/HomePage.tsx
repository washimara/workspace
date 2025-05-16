import { SearchBar } from "@/components/SearchBar"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Plus, List } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useThemeContext } from "@/contexts/ThemeContext"
import { Logo } from "@/components/Logo"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/components/ui/theme-provider"

export function HomePage() {
  const { user } = useAuth()
  const { currentTheme } = useThemeContext()
  const { t } = useLanguage()
  const { theme } = useTheme()

  // Fix the text color to be white for dark themes
  const textColor = theme === "dark" || currentTheme.value === "green-forest"
    ? "text-white"
    : currentTheme.textPrimary

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-12">
      <section className="text-center mb-10 mt-4 max-w-3xl px-4 w-full">
        <div className="mb-12 flex flex-col items-center">
          <Logo className="w-full mb-4" isHeader={true} />
          <p className={`text-xl ${textColor} font-medium mb-8`}>
            {t("findYourGoodStuff")}
          </p>
        </div>

        <div className="mb-16 mx-auto">
          <SearchBar />
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mt-16">
          <Button
            asChild
            size="lg"
            className={`gap-2 ${currentTheme.buttonPrimary} transition-colors`}
          >
            <Link to={user ? "/create-post" : "/login"}>
              <Plus className="h-5 w-5" /> {t("createPost")}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className={`gap-2 border-gray-300 ${currentTheme.buttonSecondary}`}
          >
            <Link to="/search">
              <List className="h-5 w-5" /> {t("showAllPosts")}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}