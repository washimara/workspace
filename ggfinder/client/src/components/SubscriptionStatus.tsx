import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubscriptionStatus } from "@/api/donations";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface SubscriptionStatus {
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export function SubscriptionStatus() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await getSubscriptionStatus();
        setSubscription(response.subscription);
      } catch (error: any) {
        toast({
          title: t("errorFetchingSubscription"),
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [toast, t]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'premium':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'free':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("subscriptionStatus")}</CardTitle>
        <CardDescription>
          {t("subscriptionStatusDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("currentPlan")}:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(subscription.status)}`}>
                {subscription.status === 'premium' ? t("premium") : t("free")}
              </span>
            </div>
            
            {subscription.status === 'premium' && subscription.startDate && subscription.endDate && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("startDate")}:</span>
                  <span className="text-sm">{format(new Date(subscription.startDate), 'PPP')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("endDate")}:</span>
                  <span className="text-sm">{format(new Date(subscription.endDate), 'PPP')}</span>
                </div>
                <div className="mt-4 text-sm">
                  {new Date(subscription.endDate) > new Date() ? (
                    <p>{t("subscriptionActiveMessage")}</p>
                  ) : (
                    <p className="text-amber-500">{t("subscriptionExpiredMessage")}</p>
                  )}
                </div>
              </>
            )}
            
            {subscription.status === 'free' && (
              <div className="mt-4 text-sm">
                <p>{t("freePlanMessage")}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">
            {t("noSubscriptionData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}