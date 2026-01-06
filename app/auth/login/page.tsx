"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { testConnection } from "@/lib/supabase"

// Add this import
import { useLanguage } from "@/lib/language-context"

export default function LoginPage() {
  const { t } = useLanguage()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [authReady, setAuthReady] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      const ok = await testConnection()
      setAuthReady(ok)
    }
    check()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    
    // Add explicit validation
    if (!email.trim()) {
      setError(t("auth.emailLabel") + " is required")
      return
    }
    
    if (!password.trim()) {
      setError(t("auth.passwordLabel") + " is required")
      return
    }
    
    setLoading(true)
    
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("auth.welcomeBack")}</CardTitle>
          <CardDescription className="text-center">{t("auth.enterCredentials")}</CardDescription>
          {authReady === false && (
            <div className="text-center text-red-600 text-sm">Auth service not reachable. Check environment keys.</div>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-[#8B0000] hover:underline">
                {t("auth.forgotPassword")}
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#8B0000] hover:bg-[#6B0000]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.signingIn")}
                </>
              ) : (
                t("auth.signIn")
              )}
            </Button>
            <p className="text-sm text-center text-gray-600">
              {t("auth.noAccount")} {" "}
              <Link href="/auth/register" className="text-[#8B0000] hover:underline">
                {t("auth.createAccount")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
