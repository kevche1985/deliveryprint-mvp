"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useDigitalCart } from "@/lib/digital-cart-context"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, X, ShoppingCart, User, Sparkles, Trash2, ChevronDown, Printer } from "lucide-react"

export default function Navigation() {
  const { user, profile, signOut } = useAuth()
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart()
  const { items: digitalItems, itemCount: digitalItemCount } = useDigitalCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useLanguage()

  // Combine regular cart and digital cart counts
  const totalCartItems = itemCount + digitalItemCount

  // Check if the path is active
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "operator"

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/images/logo-print.png" alt="DeliveryPrint Logo" className="h-10 w-10 rounded-lg" />
              <span className="text-2xl font-bold text-[#8B0000]">DeliveryPrint</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/products"
              className={`${
                isActive("/products") ? "text-[#8B0000] font-medium" : "text-gray-700"
              } hover:text-[#8B0000]`}
            >
              {t("navigation.products")}
            </Link>

            {/* Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`${
                    isActive("/services") ? "text-[#8B0000] font-medium" : "text-gray-700"
                  } hover:text-[#8B0000]`}
                >
                  <Printer className="mr-1 h-4 w-4" />
                  {t("navigation.services")}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/services">{t("services.all")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/services/digital-printing">{t("services.digitalPrinting")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/services/large-format">{t("services.largeFormat")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/services/event-stands">{t("services.eventStands")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/services/illuminated-signs">{t("services.illuminatedSigns")}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/ai-studio"
              className={`${
                isActive("/ai-studio") ? "text-[#8B0000] font-medium" : "text-gray-700"
              } hover:text-[#8B0000] flex items-center`}
            >
              <Sparkles className="mr-1 h-4 w-4" />
              {t("navigation.aiStudio")}
            </Link>

            {profile?.role === "supplier" && (
              <Link
                href="/supplier/dashboard"
                className={`${
                  isActive("/supplier") ? "text-[#8B0000] font-medium" : "text-gray-700"
                } hover:text-[#8B0000]`}
              >
                {t("navigation.supplierPortal")}
              </Link>
            )}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-[#8B0000]">
                    {t("navigation.admin")}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/admin">{t("navigation.dashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/orders">{t("orders.title")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/products">{t("products.title")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/services">Services</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users">{t("users.title")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/quotes">{t("quotes.title")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/transactions">{t("admin.nav.transactions")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/disputes">{t("admin.nav.disputes")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/email-settings">{t("admin.nav.emailSettings")}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Combined Shopping Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {totalCartItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-[#8B0000] px-1.5 py-0.5 text-xs">
                      {totalCartItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[350px] sm:w-[450px] flex flex-col">
                <SheetHeader>
                  <SheetTitle>
                    {t("cart.title")} ({totalCartItems} {t("cart.items")})
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  {items.length === 0 && digitalItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">{t("cart.empty")}</p>
                      <SheetClose asChild>
                        <Button asChild className="bg-[#8B0000] hover:bg-[#6B0000]">
                          <Link href="/products">{t("cart.browseProducts")}</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Digital Items */}
                      {digitalItems.map((item) => (
                        <div key={item.id} className="flex border-b pb-4">
                          <div className="w-20 h-20 rounded overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 mr-4 flex-shrink-0 flex items-center justify-center">
                            <img
                              src={item.previewUrl || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                AI {item.type}
                              </Badge>
                              <Sparkles className="h-3 w-3 text-purple-500" />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <p className="font-medium">${item.finalPrice.toFixed(2)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={() => {
                                  // Remove from digital cart
                                  console.log("Remove digital item:", item.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Regular Items */}
                      {items.map((item) => (
                        <div key={item.id} className="flex border-b pb-4">
                          <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 mr-4 flex-shrink-0">
                            <img
                              src={
                                item.customizations?.customizedProductImage ||
                                item.customizations?.designPreview ||
                                item.image ||
                                "/placeholder.svg?height=80&width=80&query=product+image" ||
                                "/placeholder.svg"
                              }
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex justify-between mt-1 text-sm text-gray-500">
                              <p>${item.price.toFixed(2)}</p>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </Button>
                                <span>{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {(items.length > 0 || digitalItems.length > 0) && (
                  <SheetFooter className="border-t pt-4">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between font-medium">
                        <span>{t("cart.subtotal")}</span>
                        <span>
                          ${(subtotal + digitalItems.reduce((sum, item) => sum + item.finalPrice, 0)).toFixed(2)}
                        </span>
                      </div>
                      <SheetClose asChild>
                        <Button asChild className="w-full bg-[#8B0000] hover:bg-[#6B0000]">
                          <Link href="/checkout">{t("cart.proceedToCheckout")}</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <LanguageSwitcher />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {profile?.first_name} {profile?.last_name}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">{t("navigation.dashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">{t("orders.myOrders")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/digital-downloads">{t("navigation.digitalDownloads")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">{t("navigation.settings")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>{t("navigation.signOut")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost">{t("navigation.signIn")}</Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-[#8B0000] hover:bg-[#6B0000]">{t("navigation.getStarted")}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {totalCartItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-[#8B0000] px-1.5 py-0.5 text-xs">
                      {totalCartItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[350px] sm:w-[450px] flex flex-col">
                <SheetHeader>
                  <SheetTitle>
                    {t("cart.title")} ({totalCartItems} {t("cart.items")})
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  {items.length === 0 && digitalItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">{t("cart.empty")}</p>
                      <SheetClose asChild>
                        <Button asChild className="bg-[#8B0000] hover:bg-[#6B0000]">
                          <Link href="/products">{t("cart.browseProducts")}</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Show both digital and regular items */}
                      {digitalItems.map((item) => (
                        <div key={item.id} className="flex border-b pb-4">
                          <div className="w-20 h-20 rounded overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 mr-4 flex-shrink-0 flex items-center justify-center">
                            <img
                              src={item.previewUrl || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                AI {item.type}
                              </Badge>
                              <Sparkles className="h-3 w-3 text-purple-500" />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <p className="font-medium">${item.finalPrice.toFixed(2)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={() => {
                                  // Remove from digital cart
                                  console.log("Remove digital item:", item.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {items.map((item) => (
                        <div key={item.id} className="flex border-b pb-4">
                          <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 mr-4 flex-shrink-0">
                            <img
                              src={
                                item.customizations?.customizedProductImage ||
                                item.customizations?.designPreview ||
                                item.image ||
                                "/placeholder.svg?height=80&width=80&query=product+image" ||
                                "/placeholder.svg"
                              }
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex justify-between mt-1 text-sm text-gray-500">
                              <p>${item.price.toFixed(2)}</p>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </Button>
                                <span>{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {(items.length > 0 || digitalItems.length > 0) && (
                  <SheetFooter className="border-t pt-4">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span>
                          ${(subtotal + digitalItems.reduce((sum, item) => sum + item.finalPrice, 0)).toFixed(2)}
                        </span>
                      </div>
                      <SheetClose asChild>
                        <Button asChild className="w-full bg-[#8B0000] hover:bg-[#6B0000]">
                          <Link href="/checkout">{t("cart.proceedToCheckout")}</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <LanguageSwitcher />

            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link
              href="/products"
              className={`block px-4 py-2 hover:bg-gray-100 rounded ${
                isActive("/products") ? "text-[#8B0000] font-medium" : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("navigation.products")}
            </Link>
            <Link
              href="/services"
              className={`block px-4 py-2 hover:bg-gray-100 rounded ${
                isActive("/services") ? "text-[#8B0000] font-medium" : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("navigation.services")}
            </Link>
            <Link
              href="/ai-studio"
              className={`block px-4 py-2 hover:bg-gray-100 rounded ${
                isActive("/ai-studio") ? "text-[#8B0000] font-medium" : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("navigation.aiStudio")}
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block px-4 py-2 hover:bg-gray-100 rounded ${
                    isActive("/dashboard") ? "text-[#8B0000] font-medium" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("navigation.dashboard")}
                </Link>
                <Link
                  href="/orders"
                  className={`block px-4 py-2 hover:bg-gray-100 rounded ${
                    isActive("/orders") ? "text-[#8B0000] font-medium" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("orders.myOrders")}
                </Link>
                <Link
                  href="/digital-downloads"
                  className={`block px-4 py-2 hover:bg-gray-100 rounded ${
                    isActive("/digital-downloads") ? "text-[#8B0000] font-medium" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("navigation.digitalDownloads")}
                </Link>
                {profile?.role === "supplier" && (
                  <Link
                    href="/supplier/dashboard"
                    className={`block px-4 py-2 hover:bg-gray-100 rounded ${
                      isActive("/supplier") ? "text-[#8B0000] font-medium" : ""
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("navigation.supplierPortal")}
                  </Link>
                )}
                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      className={`block px-4 py-2 hover:bg-gray-100 rounded ${
                        isActive("/admin") ? "text-[#8B0000] font-medium" : ""
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("navigation.admin")}
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("orders.title")}
                    </Link>
                    <Link
                      href="/admin/products"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("products.title")}
                    </Link>
                    <Link
                      href="/admin/users"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("users.title")}
                    </Link>
                    <Link
                      href="/admin/quotes"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("quotes.title")}
                    </Link>
                    <Link
                      href="/admin/transactions"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("admin.nav.transactions")}
                    </Link>
                    <Link
                      href="/admin/email-settings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("admin.nav.emailSettings")}
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  {t("navigation.signOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("navigation.signIn")}
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("navigation.getStarted")}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
