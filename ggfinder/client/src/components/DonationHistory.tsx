import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDonationHistory } from "@/api/donations";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface Donation {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  donationType: string;
  createdAt: string;
}

export function DonationHistory() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        console.log('Fetching donation history...');
        const response = await getDonationHistory();
        console.log('Donation history response:', response);
        setDonations(response.donations || []);
      } catch (error: any) {
        console.error('Error fetching donations:', error);
        toast({
          title: t("errorFetchingDonations"),
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, [toast, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("donationHistory")}</CardTitle>
        <CardDescription>
          {t("donationHistoryDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation._id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">
                    {donation.donationType === 'subscription' ? t("subscription") : t("donation")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(donation.createdAt), 'PPP')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {donation.currency} {donation.amount.toFixed(2)}
                  </p>
                  <p className={`text-sm ${donation.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>
                    {donation.status === 'completed' ? t("completed") : t("pending")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">
            {t("noDonationsYet")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}