import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useThemeContext } from "@/contexts/ThemeContext"
import { Logo } from "@/components/Logo"
import { useLanguage } from "@/contexts/LanguageContext"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { currentTheme } = useThemeContext()
  const { t } = useLanguage()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      await login(values.email, values.password)
      navigate("/")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${currentTheme.secondaryColor}`}>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="mx-auto w-full" />
            <p className={`${currentTheme.textSecondary} mt-2`}>
              {t("findYourGoodStuff")}
            </p>
          </div>

          <div className={`${currentTheme.cardBg} p-8 rounded-lg shadow-sm border`}>
            <h2 className={`text-2xl font-semibold mb-6 text-center ${currentTheme.textPrimary}`}>{t("logIn")}</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={currentTheme.textPrimary}>{t("email")}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("email")} 
                          {...field} 
                          className={`${currentTheme.textPrimary} bg-transparent border-gray-400`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={currentTheme.textPrimary}>{t("password")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t("password")}
                          className={`${currentTheme.textPrimary} bg-transparent border-gray-400`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className={`w-full ${currentTheme.buttonPrimary}`} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("pleaseWait")}
                    </>
                  ) : (
                    t("logIn")
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <p className={currentTheme.textSecondary}>
                {t("dontHaveAccount")}{" "}
                <Link
                  to="/register"
                  className={`font-medium ${currentTheme.buttonPrimary.split(' ')[0]} hover:underline bg-clip-text text-transparent`}
                >
                  {t("register")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}