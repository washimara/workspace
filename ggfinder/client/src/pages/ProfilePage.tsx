import { useState, useCallback } from "react";
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

export function ProfilePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("posts");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">{t("profile")}</h1>

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

                {/* Subscription Form - Added back */}
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
          <Card>
            <CardHeader>
              <CardTitle>{t("userProfile")}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* User profile content here */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{t("memberSince")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">{t("posts")}</h3>
                  <p className="text-sm text-muted-foreground">1 {t("active")}</p>
                </div>
                <div>
                  <h3 className="font-medium">{t("subscriptionStatus")}</h3>
                  <SubscriptionStatus key={`subscription-status-${refreshKey}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}