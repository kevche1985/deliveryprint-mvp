import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Credential test

    const WOMPI_CLIENT_ID = process.env.WOMPI_CLIENT_ID
    const WOMPI_CLIENT_SECRET = process.env.WOMPI_CLIENT_SECRET

    if (!WOMPI_CLIENT_ID || !WOMPI_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        error: "Wompi credentials not configured",
        details: {
          hasClientId: !!WOMPI_CLIENT_ID,
          hasClientSecret: !!WOMPI_CLIENT_SECRET,
        },
      })
    }

    // OAuth token request

    const tokenResponse = await fetch("https://id.wompi.sv/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "DeliveryPrint-MVP/1.0",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        audience: "wompi_api",
        client_id: WOMPI_CLIENT_ID,
        client_secret: WOMPI_CLIENT_SECRET,
      }).toString(),
    })

    const responseText = await tokenResponse.text()

    if (!tokenResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "OAuth authentication failed",
        status: tokenResponse.status,
        // response omitted
        details: {
          endpoint: "https://id.wompi.sv/connect/token",
          clientId: WOMPI_CLIENT_ID?.substring(0, 8) + "...",
          hasClientSecret: !!WOMPI_CLIENT_SECRET,
        },
      })
    }

    let tokenData
    try {
      tokenData = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: "Invalid token response format",
        response: responseText,
      })
    }

    if (!tokenData.access_token) {
      return NextResponse.json({
        success: false,
        error: "No access token received",
        tokenData,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Wompi credentials are valid",
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      hasAccessToken: !!tokenData.access_token,
    })
  } catch (error) {
    console.error("❌ Credential test error:", error)
    return NextResponse.json({
      success: false,
      error: "Network error during credential test",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
