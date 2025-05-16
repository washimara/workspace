import { useState, useEffect } from "react"
import { getUserPosts } from "@/api/posts"
import { Post } from "@/types"
import { useToast } from "@/hooks/useToast"
import { Link } from "react-router-dom"
import { PostCard } from "@/components/PostCard"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2 } from "lucide-react"
import { useThemeContext } from "@/contexts/ThemeContext"
import { useTheme } from "@/components/ui/theme-provider"

export function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { currentTheme } = useThemeContext()
  const { theme } = useTheme()

  // Determine text colors based on theme
  const textColor = theme === "dark"
    ? "text-white"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textPrimary;

  const secondaryTextColor = theme === "dark"
    ? "text-gray-300"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textSecondary;

  const bgColor = theme === "dark"
    ? "bg-gray-800"
    : currentTheme.value === "green-forest"
      ? "bg-[#C8E6C9]/50"
      : "bg-muted/30";

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log("Fetching posts for MyPostsPage");
        setLoading(true);
        const response = await getUserPosts();
        console.log("Received posts:", response.posts);
        
        // Add validation to ensure posts have IDs
        const validPosts = response.posts.filter(post => {
          if (!post._id && !post.id) {
            console.error("Found post without ID:", post);
            return false;
          }
          return true;
        });
        
        console.log("Valid posts to display:", validPosts.length);
        setPosts(validPosts);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [toast]);

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-3xl font-bold ${textColor}`}>My Posts</h1>
        <Button asChild className={currentTheme.buttonPrimary}>
          <Link to="/posts/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className={`h-8 w-8 animate-spin ${secondaryTextColor}`} />
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            // Add a null/undefined check for post._id before rendering
            post && post._id ? (
              <PostCard key={post._id} post={post} />
            ) : null
          ))}
        </div>
      ) : (
        <div className={`text-center py-12 ${bgColor} rounded-lg backdrop-blur-sm`}>
          <h2 className={`text-xl font-medium mb-2 ${textColor}`}>You haven't created any posts yet</h2>
          <p className={`${secondaryTextColor} mb-6`}>
            Start by creating your first post to share with others
          </p>
          <Button asChild className={currentTheme.buttonPrimary}>
            <Link to="/posts/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Post
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}