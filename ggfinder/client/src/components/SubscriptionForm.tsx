import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ui/theme-provider";
import { useThemeContext } from "@/contexts/ThemeContext";
import { createSubscription } from "@/api/subscriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard } from "lucide-react";

interface SubscriptionFormProps {
  onSuccess?: () => void;
}

export const SubscriptionForm = ({ onSuccess }: SubscriptionFormProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { currentTheme } = useThemeContext();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(10);
  const [autoRenew, setAutoRenew] = useState(true);

  // Determine text colors based on theme
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < 5) {
      toast({
        title: t("error"),
        description: t("minimumSubscriptionAmount"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await createSubscription({
        amount,
        paymentMethod: "creditCard",
        autoRenew
      });

      toast({
        title: t("success"),
        description: t("subscriptionCreated"),
      });

      // Reset form
      setAmount(10);
      setAutoRenew(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Force reload the page to update all components
      window.location.reload();
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <Label className={secondaryTextColor} htmlFor="amount">
            {t("monthlyAmount")}
          </Label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={secondaryTextColor}>$</span>
            </div>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              min={5}
              step={1}
              className="pl-7"
              required
            />
          </div>
          <p className="text-sm mt-1 text-gray-500">
            {t("premiumBenefitsExplanation")}
          </p>
        </div>

        <div>
          <Label className={secondaryTextColor}>
            {t("paymentMethod")}
          </Label>
          <div className="mt-2 flex items-center space-x-2 px-4 py-3 border rounded-md">
            <CreditCard className="h-4 w-4 mr-2" />
            <span>{t("creditCard")}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="autoRenew"
            checked={autoRenew}
            onCheckedChange={(checked) => setAutoRenew(checked as boolean)}
          />
          <Label
            htmlFor="autoRenew"
            className={`${secondaryTextColor} text-sm`}
          >
            {t("autoRenewSubscription")}
          </Label>
        </div>
      </div>
      <Button
        type="submit"
        className="mt-4 w-full"
        disabled={isLoading}
      >
        {isLoading ? t("processing") : t("subscribeNow")}
      </Button>
    </form>
  );
};