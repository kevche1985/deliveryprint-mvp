import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthWrapper } from "@/lib/auth-wrapper"
import { CartProvider } from "@/lib/cart-context"
import { DigitalCartProvider } from "@/lib/digital-cart-context"
import { Toaster } from "@/components/ui/toaster"
import Navigation from "@/components/navigation"
import { ErrorBoundary } from "@/components/error-boundary"
import { LanguageProvider } from "@/lib/language-context"
import PerformanceMonitor from "@/components/performance-monitor"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DeliveryPrint - Print on Demand Platform",
  description: "Custom printing solutions for Latin America",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthWrapper>
              <CartProvider>
                <DigitalCartProvider>
                  <Navigation />
                  <main className="min-h-screen">{children}</main>
                  <Toaster />
                  <PerformanceMonitor />
                </DigitalCartProvider>
              </CartProvider>
            </AuthWrapper>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
