import { PostForm } from "@/components/PostForm"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"

export function CreatePostPage() {
  const { currentTheme } = useThemeContext()
  const { t } = useLanguage()

  // Use the theme's text color directly
  const textColor = currentTheme.textPrimary

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <h1 className={`text-3xl font-bold mb-8 ${textColor}`}>{t("createPost")}</h1>
      <PostForm />
    </div>
  )
}