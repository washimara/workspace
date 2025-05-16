import { Advert } from "@/types"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Badge } from "./ui/badge"
import { MapPin, Calendar } from "lucide-react"
import { Link } from "react-router-dom"
import { formatDistance } from "date-fns"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useTheme } from "@/components/ui/theme-provider"
import { EngagementMetrics } from "./EngagementMetrics"

interface AdvertCardProps {
  advert: Advert
}

export function AdvertCard({ advert }: AdvertCardProps) {
  // Log the advert ID at render
  console.log("AdvertCard: Rendering with advert ID:", advert._id);
  console.log("AdvertCard: Full advert data:", JSON.stringify(advert));
  
  const { currentTheme } = useThemeContext()
  const { theme } = useTheme()

  // Determine text and badge colors based on theme - FIXED FOR DARK MODE
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
      <Link 
        to={`/adverts/${advert._id}`} 
        className="block" 
        onClick={() => console.log("AdvertCard: Clicked link to advert detail with ID:", advert._id)}
      >
        {advert.image && (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={advert.image}
              alt={advert.title}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="p-4">
          <h3 className={`text-lg font-semibold line-clamp-1 ${textColor}`}>{advert.title}</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className={`text-sm ${secondaryTextColor} line-clamp-2 mb-3`}>
            {advert.description}
          </p>

          {advert.location && (
            <div className={`flex items-center text-sm ${secondaryTextColor} mb-2`}>
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span className="line-clamp-1">{advert.location}</span>
            </div>
          )}

          {advert.customFields?.some(field => field.name === "Time") && (
            <div className={`flex items-center text-sm ${secondaryTextColor}`}>
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>
                {advert.customFields.find(field => field.name === "Time")?.value}
              </span>
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {advert.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant={badgeVariant} className="text-xs">
              #{tag}
            </Badge>
          ))}
          {advert.tags && advert.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{advert.tags.length - 3}
            </Badge>
          )}
          <span className={`ml-auto text-xs ${secondaryTextColor}`}>
            {formatDistance(new Date(advert.createdAt), new Date(), { addSuffix: true })}
          </span>
        </div>

        <div className="border-t pt-3 mt-1">
          <EngagementMetrics
            advertId={advert._id}
            upvotes={advert.upvotes || 0}
            views={advert.views || 0}
            upvotedBy={advert.upvotedBy || []}
            compact={true}
          />
        </div>
      </CardFooter>
    </Card>
  )
}