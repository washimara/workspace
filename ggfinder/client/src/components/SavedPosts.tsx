import { useState, useEffect } from "react"
import { getAdvertById } from "@/api/adverts"
import { Advert } from "@/types"
import { useToast } from "@/hooks/useToast"
import { AdvertCard } from "@/components/AdvertCard"
import { Loader2 } from "lucide-react"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useTheme } from "@/components/ui/theme-provider"
import { useLanguage } from "@/contexts/LanguageContext"

export function SavedPosts() {
  const [savedPosts, setSavedPosts] = useState<Advert[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { currentTheme } = useThemeContext()
  const { theme } = useTheme()
  const { t } = useLanguage()

  // Determine text colors based on theme
  const textColor = theme === "dark"
    ? "text-white"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textPrimary

  const secondaryTextColor = theme === "dark"
    ? "text-white"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textSecondary

  const bgColor = theme === "dark"
    ? "bg-gray-800"
    : currentTheme.value === "green-forest"
      ? "bg-[#C8E6C9]/50"
      : "bg-muted/30"

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setLoading(true)
        const savedPostIds = JSON.parse(localStorage.getItem('savedPosts') || '[]')

        console.log("SavedPosts: Fetching saved posts with IDs:", savedPostIds);

        if (savedPostIds.length === 0) {
          setSavedPosts([])
          setLoading(false)
          return
        }

        const postsPromises = savedPostIds.map(async (id: string) => {
          try {
            console.log(`SavedPosts: Fetching advert with ID: ${id}`);
            const response = await getAdvertById(id)
            console.log(`SavedPosts: Received advert for ID ${id}:`, response.advert);
            return response.advert
          } catch (error) {
            console.error(`Failed to fetch post ${id}:`, error)
            return null
          }
        })

        const posts = await Promise.all(postsPromises)
        console.log("SavedPosts: All fetched adverts:", posts);
        setSavedPosts(posts.filter(Boolean) as Advert[])
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSavedPosts()
  }, [toast])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className={`h-8 w-8 animate-spin ${secondaryTextColor}`} />
      </div>
    )
  }

  if (savedPosts.length === 0) {
    return (
      <div className={`text-center py-12 ${bgColor} rounded-lg backdrop-blur-sm`}>
        <h2 className={`text-xl font-medium mb-2 ${textColor}`}>{t("noSavedPosts")}</h2>
        <p className={`${secondaryTextColor}`}>
          {t("upvotePosts")}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedPosts.map((post) => (
          <AdvertCard key={post._id} advert={post} />
        ))}
      </div>
    </div>
  )
}