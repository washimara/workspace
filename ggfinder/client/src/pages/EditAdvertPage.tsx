import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getAdvertById } from "@/api/adverts"
import { Advert } from "@/types"
import { useToast } from "@/hooks/useToast"
import { AdvertForm } from "@/components/AdvertForm"
import { Loader2 } from "lucide-react"
import { useThemeContext } from "@/contexts/ThemeContext"

export function EditAdvertPage() {
  const { id } = useParams<{ id: string }>()
  const [advert, setAdvert] = useState<Advert | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { currentTheme } = useThemeContext()

  useEffect(() => {
    const fetchAdvert = async () => {
      if (!id) return
      try {
        setLoading(true)
        const response = await getAdvertById(id)
        setAdvert(response.advert)
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

    fetchAdvert()
  }, [id, toast, navigate])

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${currentTheme.textSecondary}`} />
      </div>
    )
  }

  if (!advert) {
    return (
      <div className="py-12 text-center">
        <h1 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>Advert not found</h1>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <h1 className={`text-3xl font-bold mb-8 ${currentTheme.textPrimary}`}>Edit Advert</h1>
      <AdvertForm advert={advert} isEditing />
    </div>
  )
}