import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ui/theme-provider";
import { useThemeContext } from "@/contexts/ThemeContext";
import {
  getSubscriptionHistory,
  cancelSubscription,
  renewSubscription
} from "@/api/subscriptions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RefreshCcw, X } from "lucide-react";

interface Subscription {
  _id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amount: number;
  currency: string;
  createdAt: string;
}

export const SubscriptionList = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { currentTheme } = useThemeContext();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);

  // Text colors based on theme
  const textColor = theme === "dark"
    ? "text-white"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textPrimary;

  const secondaryTextColor = theme === "dark"
    ? "text-white"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textSecondary;

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      console.log("Fetching subscription history...");
      const response = await getSubscriptionHistory();
      console.log("Subscription history response:", response);

      // If user has premium access but no subscriptions in the response,
      // Create a mock subscription from the user data
      if (response.hasPremiumAccess && (!response.subscriptions || response.subscriptions.length === 0)) {
        console.log("User has premium access, creating mock subscription");
        const mockSubscription = {
          _id: `mock-sub-${Date.now()}`,
          plan: 'premium',
          status: 'active',
          startDate: response.premiumUser?.startDate || new Date().toISOString(),
          endDate: response.premiumUser?.endDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          autoRenew: true,
          amount: 10,
          currency: 'USD',
          createdAt: response.premiumUser?.startDate || new Date().toISOString()
        };
        console.log("Created mock subscription:", mockSubscription);
        setSubscriptions([mockSubscription]);
      } else if (response.subscriptions && response.subscriptions.length > 0) {
        console.log("Using subscriptions from response:", response.subscriptions);
        setSubscriptions(response.subscriptions);
      } else {
        console.log("No subscriptions found");
        setSubscriptions([]);
      }
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCancel = async (subscriptionId: string) => {
    setCancelling(subscriptionId);
    try {
      console.log(`Cancelling subscription: ${subscriptionId}`);
      await cancelSubscription(subscriptionId);
      toast({
        title: t("success"),
        description: t("subscriptionCancelled"),
      });
      fetchSubscriptions();
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  const handleRenew = async (subscriptionId: string) => {
    setRenewing(subscriptionId);
    try {
      console.log(`Renewing subscription: ${subscriptionId}`);
      await renewSubscription(subscriptionId);
      toast({
        title: t("success"),
        description: t("subscriptionRenewed"),
      });
      fetchSubscriptions();
    } catch (error: any) {
      console.error("Error renewing subscription:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRenewing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-yellow-500 text-black';
      case 'expired':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("subscriptionHistory")}</CardTitle>
          <CardDescription>{t("yourSubscriptions")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("subscriptionHistory")}</CardTitle>
        <CardDescription>{t("yourSubscriptions")}</CardDescription>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-6">
            <p className={secondaryTextColor}>{t("noSubscriptionsFound")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription._id}
                className="border rounded-lg p-4 relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium ${textColor}`}>
                        {t("premiumPlan")}
                      </h3>
                      <Badge
                        className={getStatusColor(subscription.status)}
                      >
                        {t(subscription.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className={secondaryTextColor}>
                        <span className="font-medium">{t("amount")}:</span> ${subscription.amount}/{t("month")}
                      </p>
                      <p className={secondaryTextColor}>
                        <span className="font-medium">{t("period")}:</span> {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                      </p>
                      <p className={secondaryTextColor}>
                        <span className="font-medium">{t("autoRenew")}:</span> {subscription.autoRenew ? t("yes") : t("no")}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {subscription.status === 'active' && subscription.autoRenew && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancelling === subscription._id}
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          >
                            {cancelling === subscription._id ? t("cancelling") : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                {t("cancelAutoRenewal")}
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("confirmCancellation")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("cancelAutoRenewalWarning")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("keepSubscription")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(subscription._id)}
                              className="bg-red-600"
                            >
                              {t("confirmCancel")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {(subscription.status === 'cancelled' || subscription.status === 'expired') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRenew(subscription._id)}
                        disabled={renewing === subscription._id}
                        className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      >
                        {renewing === subscription._id ? t("renewing") : (
                          <>
                            <RefreshCcw className="h-4 w-4 mr-1" />
                            {t("renew")}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};