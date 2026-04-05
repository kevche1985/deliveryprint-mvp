"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { User } from "@supabase/supabase-js"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Mail,
  Printer,
  Tag,
  Layers,
  Folder,
  Sliders,
  Puzzle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

// Local profile type to ensure correct state typing
type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: "admin" | "operator" | "customer" | string
  status: "active" | "inactive" | string
}

const adminNavItems = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Overview of your system",
  },
  {
    href: "/admin/products",
    icon: Package,
    title: "Products",
    description: "Manage your products",
  },
  {
    href: "/admin/orders",
    icon: ShoppingCart,
    title: "Orders",
    description: "View and manage orders",
  },
  {
    href: "/admin/payments",
    icon: CreditCard,
    title: "Payments",
    description: "Payment processors & transactions",
  },
  {
    href: "/admin/transactions",
    icon: CreditCard,
    title: "Payment Transactions",
    description: "View all payment transactions",
  },
  {
    href: "/admin/users",
    icon: Users,
    title: "Users",
    description: "Manage customers",
  },
  {
    href: "/admin/quotes",
    icon: FileText,
    title: "Quotes",
    description: "Manage quote requests",
  },
  {
    href: "/admin/messages",
    icon: MessageSquare,
    title: "Messages",
    description: "Customer support tickets",
  },
  {
    href: "/admin/translations",
    icon: MessageSquare,
    title: "Translations",
    description: "Review and manage UI translations",
  },
  {
    href: "/admin/settings",
    icon: Settings,
    title: "Settings",
    description: "Configure system settings",
  },
  {
    href: "/admin/email-settings",
    icon: Mail,
    title: "Email Settings",
    description: "Configure email providers & templates",
  },
]

// Create a client component for admin content
function AdminContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    // Simple auth check without useAuth hook
    const checkAuth = async () => {
      try {
        // Import supabase here to avoid SSR issues
        const { supabase } = await import("@/lib/supabase")

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push("/auth/login?redirect=/admin")
          return
        }

        setUser(session.user)

        // For admin@example.com, set admin profile directly
        if (session.user.email === "admin@example.com") {
          setProfile({
            id: session.user.id,
            first_name: "Admin",
            last_name: "User",
            email: session.user.email ?? "",
            role: "admin",
            status: "active",
          })
        } else {
          // For other users, create fallback profile
          setProfile({
            id: session.user.id,
            first_name: "User",
            last_name: "",
            email: session.user.email ?? "",
            role: "customer",
            status: "active",
          })
        }

        setLoading(false)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/auth/login?redirect=/admin")
      }
    }

    checkAuth()
  }, [router])

  const signOut = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
      </div>
    )
  }

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "operator")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">{t("admin.layout.accessDeniedTitle")}</h1>
            <p className="text-gray-600 mb-6">{t("admin.layout.accessDeniedDesc")}</p>
            <Button asChild className="bg-[#8B0000] hover:bg-[#6B0000]">
              <Link href="/dashboard">{t("admin.layout.goToDashboard")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <Link href="/admin" className="text-xl font-bold text-[#8B0000]">
            {t("admin.layout.panelTitle")}
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-[#8B0000] rounded-full flex items-center justify-center text-white font-semibold">
                  {profile.first_name?.charAt(0) || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            <nav className="space-y-6">
              {/* Accesos Directos */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Accesos directos</div>
                <div className="space-y-1">
                  <Link href="/admin" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <LayoutDashboard className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>{t("admin.nav.dashboard")}</div>
                      <div className="text-xs text-gray-500">{t("admin.navDescriptions.dashboard")}</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Catálogo */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catálogo</div>
                <div className="space-y-1">
                  <Link href="/admin/products" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Package className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>{t("admin.nav.products")}</div>
                      <div className="text-xs text-gray-500">{t("admin.navDescriptions.products")}</div>
                    </div>
                  </Link>
                  <Link href="/admin/services" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Printer className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>Services</div>
                      <div className="text-xs text-gray-500">Manage your services</div>
                    </div>
                  </Link>
                  <Link href="/admin/categories" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Folder className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>Categorías</div>
                      <div className="text-xs text-gray-500">Manage categories</div>
                    </div>
                  </Link>
                  <Link href="/admin/attributes" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Sliders className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>Atributos</div>
                      <div className="text-xs text-gray-500">Product attributes</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Ventas */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ventas</div>
                <div className="space-y-1">
                  <Link href="/admin/orders" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <ShoppingCart className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>{t("admin.nav.orders")}</div>
                      <div className="text-xs text-gray-500">{t("admin.navDescriptions.orders")}</div>
                    </div>
                  </Link>
                  <Link href="/admin/transactions" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <CreditCard className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>{t("admin.nav.transactions")}</div>
                      <div className="text-xs text-gray-500">{t("admin.navDescriptions.transactions")}</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Clientes */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clientes</div>
                <div className="space-y-1">
                  <Link href="/admin/users" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Users className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>{t("admin.nav.users")}</div>
                      <div className="text-xs text-gray-500">{t("admin.navDescriptions.users")}</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Promociones */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Promociones</div>
                <div className="space-y-1">
                  <Link href="/admin/coupons" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Tag className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>Cupones</div>
                      <div className="text-xs text-gray-500">Manage coupons</div>
                    </div>
                  </Link>
                  <Link href="/admin/promo-banners" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Layers className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>Banners promocionales</div>
                      <div className="text-xs text-gray-500">Manage promotional banners</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* CMS */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">CMS</div>
                <div className="space-y-1">
                  <Link href="/admin/translations" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <MessageSquare className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>Traducciones</div>
                      <div className="text-xs text-gray-500">{t("admin.navDescriptions.translations")}</div>
                    </div>
                  </Link>
                  <Link href="/admin/widgets" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Puzzle className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>Widgets</div>
                      <div className="text-xs text-gray-500">Manage widgets</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* System Settings */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System Settings</div>
                <div className="space-y-1">
                  <Link href="/admin/settings" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>{t("admin.nav.settings")}</div>
                      <div className="text-xs text-gray-500">{t("admin.navDescriptions.settings")}</div>
                    </div>
                  </Link>
                  <Link href="/admin/email-settings" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Mail className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>{t("admin.nav.emailSettings")}</div>
                      <div className="text-xs text-gray-500">{t("admin.navDescriptions.emailSettings")}</div>
                    </div>
                  </Link>
                  <Link href="/admin/modules" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 group" onClick={() => setSidebarOpen(false)}>
                    <Sliders className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div>Modules</div>
                      <div className="text-xs text-gray-500">Show/hide modules</div>
                    </div>
                  </Link>
                </div>
              </div>
            </nav>
          </div>

          <div className="p-4 border-t flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>{t("admin.layout.account")}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("admin.layout.myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">{t("navigation.dashboard")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">{t("navigation.settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("admin.layout.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← {t("admin.layout.backToSite")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminContent>{children}</AdminContent>
}
