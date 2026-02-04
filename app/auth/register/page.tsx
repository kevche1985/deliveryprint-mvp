"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Loader2, Check, X } from "lucide-react"

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "customer" as "customer" | "supplier",
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const passwordRequirements = [
    { regex: /.{8,}/, text: t("authRegisterPage.password.atLeast8") },
    { regex: /[A-Z]/, text: t("authRegisterPage.password.uppercase") },
    { regex: /[a-z]/, text: t("authRegisterPage.password.lowercase") },
    { regex: /\d/, text: t("authRegisterPage.password.number") },
    { regex: /[@$!%*?&]/, text: t("authRegisterPage.password.special") },
  ]

  function checkPasswordStrength(password: string) {
    return passwordRequirements.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }))
  }

  // Add better error handling in the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
  
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role as "customer" | "supplier"
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Provide specific error messages
      if (error.message?.includes('Profile creation')) {
        setError('Failed to create user profile. Please try again.')
      } else if (error.message?.includes('already registered')) {
        setError('This email is already registered. Please use a different email or try logging in.')
      } else {
        setError(error.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const passwordChecks = checkPasswordStrength(formData.password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("authRegisterPage.title")}</CardTitle>
          <CardDescription className="text-center">{t("authRegisterPage.subtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("authRegisterPage.firstName")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("authRegisterPage.lastName")}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("authRegisterPage.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("authRegisterPage.emailPlaceholder")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("authRegisterPage.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
              {formData.password && (
                <div className="space-y-1 mt-2">
                  {passwordChecks.map((check, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      {check.met ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={check.met ? "text-green-600" : "text-gray-500"}>{check.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("authRegisterPage.accountType")}</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as "customer" | "supplier" })}
                disabled={loading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="font-normal cursor-pointer">
                    {t("authRegisterPage.customerLabel")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="supplier" id="supplier" />
                  <Label htmlFor="supplier" className="font-normal cursor-pointer">
                    {t("authRegisterPage.supplierLabel")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                {t("authRegisterPage.acceptTermsPrefix")}{" "}
                <Link href="/terms" className="text-[#8B0000] hover:underline">
                  {t("authRegisterPage.termsAndConditions")}
                </Link>
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#8B0000] hover:bg-[#6B0000]" disabled={loading || !acceptTerms}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("authRegisterPage.creatingAccount")}
                </>
              ) : (
                t("authRegisterPage.createAccount")
              )}
            </Button>
            <p className="text-sm text-center text-gray-600">
              {t("authRegisterPage.alreadyHaveAccount")}{" "}
              <Link href="/auth/login" className="text-[#8B0000] hover:underline">
                {t("authRegisterPage.signIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
