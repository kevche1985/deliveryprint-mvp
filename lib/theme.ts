export type ThemeConfig = {
  brandName: string
  slogan: string
  primaryColor: string
  accentColor: string
  logoUrl: string
  bannerImageUrl?: string
}

export function getTheme(): ThemeConfig {
  return {
    brandName: process.env.NEXT_PUBLIC_BRAND_NAME || "DeliveryPrint",
    slogan: process.env.NEXT_PUBLIC_BRAND_SLOGAN || "Your Vision, Printed",
    primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || "#8B0000",
    accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR || "#6B0000",
    logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || "/logo-print.png",
    bannerImageUrl: process.env.NEXT_PUBLIC_BANNER_IMAGE_URL || "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/banner_main.png",
  }
}
