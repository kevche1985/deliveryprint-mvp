"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function TestPaymentsI18nPage() {
  const { toast } = useToast()
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    // On first load, show a small info toast to indicate current language
    toast({
      title: t("common.status"),
      description: `${t("profile.language")}: ${language.toUpperCase()}`,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const triggerWompiSuccessToast = () => {
    // Mirrors components/wompi-payment-modal.tsx success toast
    const fakeTxnId = "TEST-123456"
    toast({
      title: t("payment.success.title"),
      description: `${t("payment.success.transactionId")}: ${fakeTxnId}`,
    })
  }

  const triggerWompiErrorToast = () => {
    toast({
      title: t("payment.error.title"),
      description: t("payment.error.processingFailed"),
      variant: "destructive",
    })
  }

  const triggerPayPalProcessingToast = () => {
    // Mirrors components/paypal-button.tsx processing toast
    toast({
      title: t("payment.3ds.processing.title"),
      description: t("payment.3ds.processing.description"),
    })
  }

  const triggerPayPalSuccessToast = () => {
    // Mirrors components/paypal-button.tsx / paypal-payment-modal.tsx success toast
    toast({
      title: t("payment.success.title"),
      description: t("payment.3ds.success.message"),
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("checkout.title")} — I18N Payment Toasts</CardTitle>
          <CardDescription>
            {t("checkout.subtitle")} · {t("common.actions")}: {t("common.cancel")}, {t("common.confirm")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={language === "es" ? "default" : "outline"} onClick={() => setLanguage("es")}>ES</Button>
            <Button variant={language === "en" ? "default" : "outline"} onClick={() => setLanguage("en")}>EN</Button>
            <Button variant="secondary" onClick={() => window.location.href = "/checkout"}>
              {t("checkout.backToCheckout")}
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Wompi</CardTitle>
                <CardDescription>{t("payment.modal.title")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={triggerWompiSuccessToast} className="bg-green-600 hover:bg-green-700">
                    {t("payment.success.title")}
                  </Button>
                  <Button onClick={triggerWompiErrorToast} variant="destructive">
                    {t("payment.error.title")}
                  </Button>
                </div>

                {/* Mimic the green test scenario hint from the Wompi modal */}
                <Alert className="border-green-600">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{t("payment.testCard.othersSuccess")}</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{t("payment.testCard.declined")}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PayPal</CardTitle>
                <CardDescription>SDK &amp; Modal Toasts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={triggerPayPalProcessingToast}>
                    {t("payment.3ds.processing.title")}
                  </Button>
                  <Button onClick={triggerPayPalSuccessToast} className="bg-blue-600 hover:bg-blue-700">
                    {t("payment.success.title")}
                  </Button>
                </div>

                <Alert>
                  <AlertDescription>{t("payment.3ds.info.message")}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}