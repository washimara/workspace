import { useState, useEffect } from "react"
import { AdvertForm } from "@/components/AdvertForm"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useToast } from "@/hooks/useToast"
import { useNavigate } from "react-router-dom"
import { getUserAdverts } from "@/api/adverts"
import { checkPremiumAccess } from "@/api/subscriptions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"

export function CreateAdvertPage() {
  const { currentTheme } = useThemeContext()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [canCreate, setCanCreate] = useState(true)
  const [advertCount, setAdvertCount] = useState(0)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const checkLimits = async () => {
      try {
        setLoading(true)
        
        // Check premium status
        const premiumResponse = await checkPremiumAccess()
        setIsPremium(premiumResponse.hasPremiumAccess)
        
        // If premium, no need to check counts
        if (premiumResponse.hasPremiumAccess) {
          setCanCreate(true)
          setLoading(false)
          return
        }
        
        // Check advert count for free users
        const advertsResponse = await getUserAdverts()
        const count = advertsResponse.adverts.length
        setAdvertCount(count)
        setCanCreate(count < 3)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        navigate("/my-adverts")
      } finally {
        setLoading(false)
      }
    }

    checkLimits()
  }, [toast, navigate])

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${currentTheme.textSecondary}`} />
      </div>
    )
  }

  if (!canCreate) {
    return (
      <div className="py-8 max-w-3xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 ${currentTheme.textPrimary}`}>Create Advert</h1>
        <Card className="border-amber-500/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Free Tier Limit Reached</h2>
            <p className="mb-6">
              You've created {advertCount} adverts, which is the maximum allowed on the free tier.
              To create more adverts, please upgrade to our premium subscription.
            </p>
            <div className="flex justify-center">
              <Button asChild className={currentTheme.buttonPrimary}>
                <Link to="/profile?tab=support">
                  <Crown className="mr-2 h-4 w-4" /> Upgrade to Premium
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <h1 className={`text-3xl font-bold mb-8 ${currentTheme.textPrimary}`}>Create Advert</h1>
      {!isPremium && (
        <Card className="mb-6 border-amber-500/50">
          <CardContent className="p-4">
            <p className="text-sm">
              Free tier: {advertCount}/3 adverts used. 
              <Link to="/profile?tab=support" className="ml-1 text-blue-500 hover:underline">
                Upgrade to premium
              </Link> for unlimited adverts.
            </p>
          </CardContent>
        </Card>
      )}
      <AdvertForm />
    </div>
  )
}