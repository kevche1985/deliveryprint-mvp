import { NextResponse } from "next/server"
import { getPayPalAccessToken } from "@/lib/paypal-client"

export const runtime = "edge"

export async function POST() {
  try {
    console.log("Testing PayPal credentials...")

    // Check if environment variables are set
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: "PayPal credentials not configured",
        details: "Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET environment variables",
      })
    }

    if (clientId === clientSecret) {
      return NextResponse.json({
        success: false,
        error: "Invalid credentials configuration",
        details: "Client ID and Client Secret cannot be the same value",
      })
    }

    // Test getting access token
    const accessToken = await getPayPalAccessToken()

    return NextResponse.json({
      success: true,
      message: "PayPal credentials are valid",
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      expires_in: 32400, // PayPal tokens typically expire in 9 hours
    })
  } catch (error: any) {
    console.error("PayPal credentials test error:", error)

    return NextResponse.json({
      success: false,
      error: "PayPal authentication failed",
      details: error.message,
    })
  }
}
