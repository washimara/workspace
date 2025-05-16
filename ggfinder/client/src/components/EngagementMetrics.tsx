import { useState, useEffect } from "react";
import { ArrowUp, Share, Eye, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { upvoteAdvert, getShareableLink, getPrivateShareableLink, getAdvertStats } from "@/api/adverts";
import { useThemeContext } from "@/contexts/ThemeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface EngagementMetricsProps {
  advertId: string;
  upvotes: number;
  views: number;
  upvotedBy: string[];
  compact?: boolean;
  isPrivate?: boolean;
  isOwner?: boolean;
}

export function EngagementMetrics({
  advertId,
  upvotes: initialUpvotes,
  views: initialViews,
  upvotedBy = [],
  compact = false,
  isPrivate = false,
  isOwner = false
}: EngagementMetricsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentTheme } = useThemeContext();
  const [isUpvoted, setIsUpvoted] = useState(user ? upvotedBy.includes(user._id) : false);
  const [upvoteCount, setUpvoteCount] = useState(initialUpvotes);
  const [viewCount, setViewCount] = useState(initialViews);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Add new state for the private share dialog
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);
  const [privateShareUrl, setPrivateShareUrl] = useState("");
  const [privateShareKey, setPrivateShareKey] = useState("");

  // Fetch the latest statistics on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const stats = await getAdvertStats(advertId);
        setUpvoteCount(stats.upvotes);
        setViewCount(stats.views);
        setIsUpvoted(stats.upvoted);
      } catch (error: any) {
        console.error("Error fetching advert stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [advertId]);

  const handleUpvote = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upvote posts",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`[ENGAGEMENT] Starting upvote for advert ${advertId}`);
      console.log(`[ENGAGEMENT] Current state - isUpvoted: ${isUpvoted}, upvoteCount: ${upvoteCount}`);

      setIsUpvoting(true);
      const response = await upvoteAdvert(advertId);
      console.log(`[ENGAGEMENT] Upvote response:`, response);

      setIsUpvoted(response.upvoted);
      setUpvoteCount(response.upvotes);
      console.log(`[ENGAGEMENT] After upvote - isUpvoted: ${response.upvoted}, upvoteCount: ${response.upvotes}`);

      // Save post to saved posts when upvoted
      if (response.upvoted) {
        // Store upvoted post in localStorage for saved posts feature
        const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
        if (!savedPosts.includes(advertId)) {
          savedPosts.push(advertId);
          localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
          console.log(`[ENGAGEMENT] Added advert ${advertId} to savedPosts`);
        }

        toast({
          title: "Post saved",
          description: "This post has been added to your saved posts",
        });
      } else {
        // Remove from saved posts when un-upvoted
        const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
        const updatedSavedPosts = savedPosts.filter((id: string) => id !== advertId);
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        console.log(`[ENGAGEMENT] Removed advert ${advertId} from savedPosts`);
      }
    } catch (error: any) {
      console.error(`[ENGAGEMENT] Error in handleUpvote:`, error);

      // Check if this is the special case of trying to upvote own post
      if (error.cannotUpvoteOwn) {
        toast({
          title: "Cannot upvote own post",
          description: "You cannot upvote your own posts. Try upvoting posts from other users!",
          variant: "warning",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleShare = async () => {
    // If it's a private advert and the current user is the owner,
    // show the private share dialog instead of regular sharing
    if (isPrivate && isOwner) {
      handlePrivateShare();
      return;
    }

    try {
      setIsSharing(true);
      const response = await getShareableLink(advertId);

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: "Check out this post on ggFinder",
          url: response.url,
        });
        toast({
          title: "Shared successfully",
          description: "The post has been shared",
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(response.url);
        toast({
          title: "Link copied",
          description: "The link has been copied to your clipboard",
        });
      }
    } catch (error: any) {
      // User cancelled share action or other error
      if (error.name !== "AbortError") {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  // New function to handle private sharing
  const handlePrivateShare = async () => {
    try {
      setIsSharing(true);
      const response = await getPrivateShareableLink(advertId);
      
      setPrivateShareUrl(response.url);
      setPrivateShareKey(response.key);
      setShowPrivateDialog(true);
    } catch (error: any) {
      toast({
        title: "Error generating private link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Function to copy URL to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The text has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const activeColor = currentTheme.buttonPrimary.split(' ')[0]; // Extract the primary color class

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-3 text-xs">
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 h-auto flex items-center gap-1 ${isUpvoted ? activeColor : ''}`}
            onClick={handleUpvote}
            disabled={isUpvoting || loading}
          >
            <ArrowUp className={`h-4 w-4 ${isUpvoted ? 'fill-current' : ''}`} />
            <span>{upvoteCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto flex items-center gap-1"
            onClick={handleShare}
            disabled={isSharing || loading}
          >
            {isPrivate && isOwner ? <Lock className="h-4 w-4" /> : <Share className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{viewCount}</span>
          </div>
        </div>

        {/* Private Share Dialog */}
        <PrivateShareDialog 
          open={showPrivateDialog}
          onOpenChange={setShowPrivateDialog}
          url={privateShareUrl}
          accessKey={privateShareKey}
          onCopyUrl={() => copyToClipboard(privateShareUrl)}
          onCopyKey={() => copyToClipboard(privateShareKey)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 ${isUpvoted ? activeColor : ''}`}
          onClick={handleUpvote}
          disabled={isUpvoting || loading}
        >
          <ArrowUp className={`h-5 w-5 ${isUpvoted ? 'fill-current' : ''}`} />
          <span className="text-xs">{upvoteCount} Upvotes</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1"
          onClick={handleShare}
          disabled={isSharing || loading}
        >
          {isPrivate && isOwner ? <Lock className="h-5 w-5" /> : <Share className="h-5 w-5" />}
          <span className="text-xs">{isPrivate && isOwner ? "Private Share" : "Share"}</span>
        </Button>

        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Eye className="h-5 w-5" />
          <span className="text-xs">{viewCount} Views</span>
        </div>
      </div>

      {/* Private Share Dialog */}
      <PrivateShareDialog 
        open={showPrivateDialog}
        onOpenChange={setShowPrivateDialog}
        url={privateShareUrl}
        accessKey={privateShareKey}
        onCopyUrl={() => copyToClipboard(privateShareUrl)}
        onCopyKey={() => copyToClipboard(privateShareKey)}
      />
    </>
  );
}

// New component for the private share dialog
interface PrivateShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  accessKey: string;
  onCopyUrl: () => void;
  onCopyKey: () => void;
}

function PrivateShareDialog({ 
  open, 
  onOpenChange, 
  url, 
  accessKey, 
  onCopyUrl, 
  onCopyKey 
}: PrivateShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Private Advert</DialogTitle>
          <DialogDescription>
            This advert is private. Share this link and access key with people you want to view your advert.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="share-link">Shareable Link</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="share-link"
                value={url}
                readOnly
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={onCopyUrl}>
                Copy
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="access-key">Access Key</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="access-key"
                value={accessKey}
                readOnly
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={onCopyKey}>
                Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              The access key is required to view this private advert.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}