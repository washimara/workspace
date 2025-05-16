import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Advert } from "@/types"
import { getAdvertById, deleteAdvert } from "@/api/adverts"
import { useToast } from "@/hooks/useToast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Calendar, MapPin } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatDistance } from "date-fns"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useTheme } from "@/components/ui/theme-provider"

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [advert, setAdvert] = useState<Advert | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
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

  const bgColor = theme === "dark"
    ? "bg-gray-800"
    : currentTheme.value === "green-forest"
      ? "bg-[#C8E6C9]/50"
      : "bg-muted/50"

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
      } finally {
        setLoading(false)
      }
    }

    fetchAdvert()
  }, [id, toast])

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteAdvert(id)
      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      navigate("/my-posts")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="py-12 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-4/5"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!advert) {
    return (
      <div className="py-12 max-w-4xl mx-auto text-center">
        <h1 className={`text-2xl font-bold mb-4 ${textColor}`}>Post not found</h1>
        <Button asChild className={currentTheme.buttonPrimary}>
          <Link to="/">Go back home</Link>
        </Button>
      </div>
    )
  }

  const isOwner = user && user._id === advert.userId

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${textColor}`}>{advert.title}</h1>
        {isOwner && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/edit-post/${advert._id}`)}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your post.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {advert.image && (
            <div className="rounded-lg overflow-hidden shadow-md">
              <img
                src={advert.image}
                alt={advert.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <div className="prose max-w-none">
            <h2 className={`text-xl font-semibold mb-2 ${textColor}`}>Description</h2>
            <p className={secondaryTextColor}>{advert.description}</p>
          </div>

          {advert.tags && advert.tags.length > 0 && (
            <div>
              <h2 className={`text-xl font-semibold mb-3 ${textColor}`}>Tags</h2>
              <div className="flex flex-wrap gap-2">
                {advert.tags.map((tag) => (
                  <Badge key={tag} variant={badgeVariant}>
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`${bgColor} rounded-lg p-4 space-y-4 backdrop-blur-sm`}>
            {advert.location && (
              <div className="flex items-start gap-2">
                <MapPin className={`h-5 w-5 ${secondaryTextColor} shrink-0 mt-0.5`} />
                <div>
                  <h3 className={`font-medium ${textColor}`}>Location</h3>
                  <p className={`text-sm ${secondaryTextColor}`}>{advert.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className={`h-5 w-5 ${secondaryTextColor} shrink-0 mt-0.5`} />
              <div>
                <h3 className={`font-medium ${textColor}`}>Posted</h3>
                <p className={`text-sm ${secondaryTextColor}`}>
                  {formatDistance(new Date(advert.createdAt), new Date(), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {advert.customFields && advert.customFields.length > 0 && (
            <div className={`${bgColor} rounded-lg p-4 backdrop-blur-sm`}>
              <h2 className={`text-lg font-semibold mb-3 ${textColor}`}>Details</h2>
              <dl className="space-y-2">
                {advert.customFields.map((field, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <dt className={`text-sm font-medium ${secondaryTextColor}`}>{field.name}</dt>
                    <dd className={`text-sm ${textColor}`}>{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <Button className={`w-full ${currentTheme.buttonPrimary}`} asChild>
            {user ? (
              <Link to={`/post/${advert._id}`}>Contact Poster</Link>
            ) : (
              <Link to="/login">Sign in to contact poster</Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}