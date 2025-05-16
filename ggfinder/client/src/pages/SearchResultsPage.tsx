import { useState, useEffect } from "react"
import { useLocation, Link } from "react-router-dom"
import { getAdverts } from "@/api/adverts"
import { Advert } from "@/types"
import { useToast } from "@/hooks/useToast"
import { AdvertCard } from "@/components/AdvertCard"
import { SearchBar } from "@/components/SearchBar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { X, Loader2, MapPin, Navigation } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useTheme } from "@/components/ui/theme-provider"
import { useLanguage } from "@/contexts/LanguageContext"

export function SearchResultsPage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const query = searchParams.get("q") || ""

  const [adverts, setAdverts] = useState<Advert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [locationSearch, setLocationSearch] = useState<string>(searchParams.get("location") || "")
  const [radius, setRadius] = useState<number>(parseInt(searchParams.get("radius") || "50"))
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null)
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false)

  const { toast } = useToast()
  const { user } = useAuth()
  const { currentTheme } = useThemeContext()
  const { theme } = useTheme()
  const { t } = useLanguage()

  // Get all unique tags from adverts
  const allTags = Array.from(
    new Set(adverts.flatMap((advert) => advert.tags || []))
  )

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

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          setUseCurrentLocation(true);
          setLocationSearch(""); // Clear the location search when using current location
          toast({
            title: t("locationFound"),
            description: t("usingCurrentLocation"),
          });
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: t("locationError"),
            description: t("couldNotGetLocation"),
            variant: "destructive",
          });
          setUseCurrentLocation(false);
          setLoading(false);
        }
      );
    } else {
      toast({
        title: t("locationNotSupported"),
        description: t("browserDoesNotSupport"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchAdverts = async () => {
      try {
        setLoading(true)
        const params: {
          query?: string;
          tags?: string[];
          location?: string;
          radius?: number;
          lat?: number;
          lng?: number;
        } = {
          query,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          radius
        }

        // Add location parameters
        if (useCurrentLocation && userCoords) {
          params.lat = userCoords.lat;
          params.lng = userCoords.lng;
        } else if (locationSearch) {
          params.location = locationSearch;
        }

        const response = await getAdverts(params)
        setAdverts(response.adverts)
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

    fetchAdverts()
  }, [query, selectedTags, locationSearch, radius, userCoords, useCurrentLocation, toast])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUseCurrentLocation(false); // Disable current location when searching by address
  };

  const clearLocationFilter = () => {
    setLocationSearch("");
    setUseCurrentLocation(false);
    setUserCoords(null);
  };

  return (
    <div className="py-8">
      <div className="mb-12 mx-auto max-w-[600px]">
        <SearchBar />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${textColor}`}>
          {query ? `${t("resultsFor")} "${query}"` : t("allPosts")}
        </h1>
        <p className={`text-sm ${secondaryTextColor}`}>
          {adverts.length} {adverts.length === 1 ? t("resultFound") : t("resultsFound")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className={`${bgColor} p-4 rounded-lg backdrop-blur-sm mb-4`}>
            <h2 className={`text-lg font-semibold mb-3 ${textColor}`}>{t("filterByTags")}</h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : theme === "dark" ? "outline" : "secondary"}
                  className={`cursor-pointer ${theme === "dark" ? "hover:bg-gray-700" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>

            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className={`mt-4 ${textColor}`}
                onClick={() => setSelectedTags([])}
              >
                <X className="h-4 w-4 mr-2" /> {t("clearFilters")}
              </Button>
            )}
          </div>

          <div className={`${bgColor} p-4 rounded-lg backdrop-blur-sm`}>
            <h2 className={`text-lg font-semibold mb-3 ${textColor}`}>{t("filterByLocation")}</h2>
            
            <form onSubmit={handleLocationSearch} className="mb-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder={t("enterLocation")}
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="flex-1"
                  disabled={useCurrentLocation}
                />
                <Button type="submit" disabled={useCurrentLocation || !locationSearch}>
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={getCurrentLocation}
                disabled={useCurrentLocation}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {t("useCurrentLocation")}
              </Button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${secondaryTextColor}`}>{t("distance")}:</span>
                <span className={`text-sm font-medium ${textColor}`}>{radius} km</span>
              </div>
              <Slider
                value={[radius]}
                onValueChange={(value) => setRadius(value[0])}
                min={1}
                max={500}
                step={1}
                disabled={!locationSearch && !useCurrentLocation}
              />
            </div>

            {(locationSearch || useCurrentLocation) && (
              <Button
                variant="ghost"
                size="sm"
                className={`mt-2 ${textColor}`}
                onClick={clearLocationFilter}
              >
                <X className="h-4 w-4 mr-2" /> {t("clearLocation")}
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className={`h-8 w-8 animate-spin ${secondaryTextColor}`} />
            </div>
          ) : adverts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adverts.map((advert) => (
                <AdvertCard key={advert._id} advert={advert} />
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${bgColor} rounded-lg backdrop-blur-sm`}>
              <h2 className={`text-xl font-medium mb-2 ${textColor}`}>{t("noResults")}</h2>
              <p className={secondaryTextColor}>
                {t("tryAdjusting")}
              </p>
              <Button asChild className={`mt-4 ${currentTheme.buttonPrimary}`}>
                <Link to={user ? "/create-post" : "/login"}>
                  {user ? t("createPost") : t("signInToCreate")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}