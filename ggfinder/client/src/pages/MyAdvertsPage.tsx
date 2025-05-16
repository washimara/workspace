import { useState, useEffect } from "react"
import { getUserAdverts } from "@/api/adverts"
import { checkPremiumAccess } from "@/api/subscriptions"
import { Advert } from "@/types"
import { useToast } from "@/hooks/useToast"
import { Link } from "react-router-dom"
import { AdvertCard } from "@/components/AdvertCard"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, Crown } from "lucide-react"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useTheme } from "@/components/ui/theme-provider"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/contexts/LanguageContext"

export function MyAdvertsPage() {
  const [adverts, setAdverts] = useState<Advert[]>([])
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
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
    ? "text-gray-300"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textSecondary

  const bgColor = theme === "dark"
    ? "bg-gray-800"
    : currentTheme.value === "green-forest"
      ? "bg-[#C8E6C9]/50"
      : "bg-muted/30"

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch adverts
        console.log("MyAdvertsPage: About to fetch user adverts");
        const advertsResponse = await getUserAdverts();
        console.log("MyAdvertsPage: Received adverts response:", JSON.stringify(advertsResponse));
        
        // Log each advert's ID and structure to verify it's correct
        if (advertsResponse.adverts && advertsResponse.adverts.length > 0) {
          advertsResponse.adverts.forEach((advert, index) => {
            console.log(`MyAdvertsPage: Advert #${index} ID:`, advert._id);
            console.log(`MyAdvertsPage: Advert #${index} structure:`, JSON.stringify(advert));
          });
        }
        
        setAdverts(advertsResponse.adverts);

        // Check premium status
        const premiumResponse = await checkPremiumAccess();
        console.log("MyAdvertsPage: Premium status:", premiumResponse);
        setIsPremium(premiumResponse.hasPremiumAccess);
      } catch (error: any) {
        console.error("MyAdvertsPage: Error fetching data:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Check if user has reached the free tier limit
  const hasReachedLimit = !isPremium && adverts.length >= 3;

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-3xl font-bold ${textColor}`}>My Adverts</h1>
        <Button 
          asChild={!hasReachedLimit} 
          className={`${currentTheme.buttonPrimary} ${hasReachedLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={hasReachedLimit ? (e) => {
            e.preventDefault();
            toast({
              title: "Limit Reached",
              description: "You've reached the maximum of 3 adverts for free tier. Please upgrade to premium to create more.",
              variant: "destructive",
            });
          } : undefined}
        >
          {!hasReachedLimit ? (
            <Link to="/create-advert">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New
            </Link>
          ) : (
            <span>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New
            </span>
          )}
        </Button>
      </div>

      {!loading && !isPremium && (
        <Card className="mb-6 border-amber-500/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className={`font-medium ${textColor}`}>
                {adverts.length >= 3 
                  ? "You've reached the free tier limit of 3 adverts" 
                  : `Free tier: ${adverts.length}/3 adverts used`}
              </h3>
              <p className={`text-sm ${secondaryTextColor}`}>
                Upgrade to premium for unlimited adverts
              </p>
            </div>
            <Button asChild variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-500/10">
              <Link to="/profile?tab=support">
                <Crown className="mr-2 h-4 w-4" /> Upgrade Now
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className={`h-8 w-8 animate-spin ${secondaryTextColor}`} />
        </div>
      ) : adverts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adverts.map((advert) => (
            <AdvertCard key={advert._id} advert={advert} />
          ))}
        </div>
      ) : (
        <div className={`text-center py-12 ${bgColor} rounded-lg backdrop-blur-sm`}>
          <h2 className={`text-xl font-medium mb-2 ${textColor}`}>You haven't created any adverts yet</h2>
          <p className={`${secondaryTextColor} mb-6`}>
            Start by creating your first advert to find people for your activities
          </p>
          <Button asChild className={currentTheme.buttonPrimary}>
            <Link to="/create-advert">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Advert
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}