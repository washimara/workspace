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

const formSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { currentTheme } = useThemeContext()
  const { t } = useLanguage()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      await register(values.email, values.password, values.name)
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
              {t("findNextActivity")}
            </p>
          </div>

          <div className={`${currentTheme.cardBg} p-8 rounded-lg shadow-sm border`}>
            <h2 className={`text-2xl font-semibold mb-6 text-center ${currentTheme.textPrimary}`}>{t("createAccount")}</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={currentTheme.textPrimary}>{t("name")}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("name")} 
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={currentTheme.textPrimary}>{t("confirmPassword")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t("confirmPassword")}
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
                    t("register")
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <p className={`${currentTheme.textSecondary}`}>
                {t("alreadyHaveAccount")}{" "}
                <Link
                  to="/login"
                  className={`font-medium ${currentTheme.buttonPrimary.split(' ')[0]} hover:underline bg-clip-text text-transparent`}
                >
                  {t("logIn")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}