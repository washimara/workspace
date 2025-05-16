import { Post } from "@/types"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Badge } from "./ui/badge"
import { MapPin, Calendar } from "lucide-react"
import { Link } from "react-router-dom"
import { formatDistance } from "date-fns"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useTheme } from "@/components/ui/theme-provider"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const { currentTheme } = useThemeContext()
  const { theme } = useTheme()

  // Determine text and badge colors based on theme
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

  const badgeVariant = theme === "dark" || currentTheme.value === "green-forest" ? "default" : "secondary"

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${currentTheme.cardBg || ""}`}>
      <Link to={`/posts/${post._id}`} className="block">
        {post.image && (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="p-4">
          <h3 className={`text-lg font-semibold line-clamp-1 ${textColor}`}>{post.title}</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className={`text-sm ${secondaryTextColor} line-clamp-2 mb-3`}>
            {post.description}
          </p>

          {post.location && (
            <div className={`flex items-center text-sm ${secondaryTextColor} mb-2`}>
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span className="line-clamp-1">{post.location}</span>
            </div>
          )}

          {post.customFields?.some(field => field.name === "Time") && (
            <div className={`flex items-center text-sm ${secondaryTextColor}`}>
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>
                {post.customFields.find(field => field.name === "Time")?.value}
              </span>
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {post.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant={badgeVariant} className="text-xs">
              #{tag}
            </Badge>
          ))}
          {post.tags && post.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{post.tags.length - 3}
            </Badge>
          )}
          <span className={`ml-auto text-xs ${secondaryTextColor}`}>
            {formatDistance(new Date(post.createdAt), new Date(), { addSuffix: true })}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}