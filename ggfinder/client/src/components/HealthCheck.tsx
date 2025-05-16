import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle, CheckCircle, Database } from "lucide-react";
import api from "@/api/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface HealthStatus {
  status: string;
  database: {
    supabase: string;
  };
  timestamp: string;
}

export function HealthCheck() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/health');
      setHealth(response.data);
      setError(null);
      
      // Show toast for any DB issues
      if (response.data.database.supabase !== 'connected') {
        toast({
          title: t("databaseIssue"),
          description: t("supabaseDatabaseDisconnected"),
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || t("errorCheckingHealth"));
      toast({
        title: t("healthCheckFailed"),
        description: err.message || t("errorCheckingHealth"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;
  
  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("healthCheckError")}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Only show alert if there's an issue
  if (health && (health.status !== 'ok' || health.database.supabase !== 'connected')) {
    return (
      <Alert variant={health.database.supabase !== 'connected' ? "destructive" : "warning"} className="mt-4">
        <Database className="h-4 w-4" />
        <AlertTitle>{t("systemStatus")}: {health.status}</AlertTitle>
        <AlertDescription>
          {t("database")}: {health.database.supabase === 'connected' 
            ? <span className="text-green-500">{t("connected")}</span> 
            : <span className="text-red-500">{t("disconnected")}</span>}
        </AlertDescription>
      </Alert>
    );
  }

  // Return null when everything is OK to avoid UI clutter
  return null;
}

// At the end of the file, add this log
console.log("HealthCheck export:", { HealthCheck });