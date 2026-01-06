"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { track } from "@/lib/analytics"
import {
  User,
  Search,
  Sparkles,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Printer,
  Truck,
  Download,
} from "lucide-react"

type Step = {
  id: string
  titleKey: string
  descKey: string
  icon: React.ReactNode
}

export default function UserRoadmap() {
  const { t } = useLanguage()
  const steps: Step[] = [
    { id: "account", titleKey: "home.roadmap.steps.account", descKey: "home.roadmap.desc.account", icon: <User className="h-4 w-4" /> },
    { id: "browse", titleKey: "home.roadmap.steps.browse", descKey: "home.roadmap.desc.browse", icon: <Search className="h-4 w-4" /> },
    { id: "design", titleKey: "home.roadmap.steps.design", descKey: "home.roadmap.desc.design", icon: <Sparkles className="h-4 w-4" /> },
    { id: "cart", titleKey: "home.roadmap.steps.cart", descKey: "home.roadmap.desc.cart", icon: <ShoppingCart className="h-4 w-4" /> },
    { id: "checkout", titleKey: "home.roadmap.steps.checkout", descKey: "home.roadmap.desc.checkout", icon: <CreditCard className="h-4 w-4" /> },
    { id: "confirm", titleKey: "home.roadmap.steps.confirm", descKey: "home.roadmap.desc.confirm", icon: <CheckCircle className="h-4 w-4" /> },
    { id: "production", titleKey: "home.roadmap.steps.production", descKey: "home.roadmap.desc.production", icon: <Printer className="h-4 w-4" /> },
    { id: "shipping", titleKey: "home.roadmap.steps.shipping", descKey: "home.roadmap.desc.shipping", icon: <Truck className="h-4 w-4" /> },
    { id: "delivery", titleKey: "home.roadmap.steps.delivery", descKey: "home.roadmap.desc.delivery", icon: <Download className="h-4 w-4" /> },
  ]

  const [active, setActive] = useState<string>(steps[0].id)
  const currentIndex = steps.findIndex((s) => s.id === active)
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("home.roadmap.title")}</CardTitle>
          <Badge variant="secondary">{t("home.roadmap.progress").replace("{percent}", String(progress))}</Badge>
        </div>
        <p className="text-sm text-gray-600 mt-2">{t("home.roadmap.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 h-2 w-full bg-gray-200 rounded">
          <div className="h-2 bg-red-700 rounded" style={{ width: `${progress}%` }} />
        </div>

        <Tabs value={active} onValueChange={(v) => { setActive(v); track("roadmap_step", { step: v }) }} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {steps.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="text-xs">
                <span className="inline-flex items-center gap-1">
                  {s.icon}
                  {t(s.titleKey)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {steps.map((s) => (
            <TabsContent key={s.id} value={s.id} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    {s.icon}
                    {t(s.titleKey)}
                  </h3>
                  <p className="text-gray-700 mb-4">{t(s.descKey)}</p>
                  <div className="flex gap-2 flex-wrap">
                    {s.id === "account" && (
                      <>
                        <Button asChild variant="outline" onClick={() => track("roadmap_cta", { action: "login" })}><a href="/auth/login">{t("home.roadmap.cta.login")}</a></Button>
                        <Button asChild onClick={() => track("roadmap_cta", { action: "register" })}><a href="/auth/register">{t("home.roadmap.cta.register")}</a></Button>
                      </>
                    )}
                    {s.id === "browse" && (
                      <Button asChild onClick={() => track("roadmap_cta", { action: "browse_products" })}><a href="/products">{t("home.roadmap.cta.browseProducts")}</a></Button>
                    )}
                    {s.id === "design" && (
                      <Button asChild onClick={() => track("roadmap_cta", { action: "design_studio" })}><a href="/ai-studio">{t("home.roadmap.cta.designStudio")}</a></Button>
                    )}
                    {s.id === "cart" && (
                      <Button asChild variant="outline" onClick={() => track("roadmap_cta", { action: "checkout" })}><a href="/checkout">{t("home.roadmap.cta.checkout")}</a></Button>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600 mb-2">{t("home.roadmap.tips.title")}</p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>{t("home.roadmap.tips.secure")}</li>
                    <li>{t("home.roadmap.tips.support")}</li>
                    <li>{t("home.roadmap.tips.progressSaved")}</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
