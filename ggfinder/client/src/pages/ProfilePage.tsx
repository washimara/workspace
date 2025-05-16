import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MyPostsPage } from "./MyPostsPage";
import { SavedPosts } from "@/components/SavedPosts";
import { DonationForm } from "@/components/DonationForm";
import { DonationHistory } from "@/components/DonationHistory";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { SubscriptionList } from "@/components/SubscriptionList";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { Award } from "lucide-react"; // Import Award icon for karma
import { useAuth } from "@/contexts/AuthContext";
import { ProfileCard } from "@/components/ui/profile-card";

export function ProfilePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("posts");
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Early return if user is not loaded
  if (!user) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold">{t("profile")}</h1>
        
        {/* Display Good Karma prominently in the header */}
        <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-lg">
          <Award className="h-6 w-6 text-amber-500" />
          <div>
            <span className="text-xs text-muted-foreground block">{t("goodKarma")}</span>
            <span className="font-bold text-xl">{user.goodKarma || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="posts">{t("myPosts")}</TabsTrigger>
              <TabsTrigger value="saved">{t("savedPosts")}</TabsTrigger>
              <TabsTrigger value="support">{t("support")}</TabsTrigger>
              <TabsTrigger value="account">{t("account")}</TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
              <MyPostsPage />
            </TabsContent>
            <TabsContent value="saved">
              <SavedPosts />
            </TabsContent>
            <TabsContent value="support">
              <div className="space-y-8">
                {/* One-time Donation */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t("supportGGFinder")}</CardTitle>
                    <CardDescription>
                      {t("supportViaOneTimeDonation")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DonationForm />
                  </CardContent>
                </Card>

                {/* Subscription Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t("premiumSubscription")}</CardTitle>
                    <CardDescription>
                      {t("supportProjectWithSubscription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SubscriptionForm onSuccess={handleRefresh} />
                  </CardContent>
                </Card>

                {/* Subscription History */}
                <SubscriptionList key={`subscription-list-${refreshKey}`} />

                {/* Donation History */}
                <DonationHistory key={`donation-history-${refreshKey}`} />
              </div>
            </TabsContent>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>{t("accountSettings")}</CardTitle>
                  <CardDescription>
                    {t("accountSettingsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Account settings content here */}
                  <p>{t("accountSettingsComingSoon")}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          {/* Use the new ProfileCard component to display user info including Good Karma */}
          <ProfileCard user={user} />
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("subscriptionStatus")}</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionStatus key={`subscription-status-${refreshKey}`} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}