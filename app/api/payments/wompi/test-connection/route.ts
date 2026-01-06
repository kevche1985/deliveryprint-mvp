import { NextResponse } from "next/server"

const WOMPI_BASE_URL = process.env.WOMPI_BASE_URL || "https://api.wompi.sv"
const WOMPI_BASE_ACCESS_URL = process.env.WOMPI_BASE_ACCESS_URL || "https://id.wompi.sv/connect/token"
const WOMPI_CLIENT_ID = process.env.WOMPI_CLIENT_ID
const WOMPI_CLIENT_SECRET = process.env.WOMPI_CLIENT_SECRET

export async function GET() {
  try {
    // Connection test

    // Check if credentials are configured
    if (!WOMPI_CLIENT_ID || !WOMPI_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        error: "Wompi credentials not configured",
        details: {
          hasClientId: !!WOMPI_CLIENT_ID,
          hasClientSecret: !!WOMPI_CLIENT_SECRET,
          baseUrl: WOMPI_BASE_URL,
          accessUrl: WOMPI_BASE_ACCESS_URL,
        },
      })
    }

    // Test getting access token
    // Token endpoint test
    const tokenResponse = await fetch(`${WOMPI_BASE_ACCESS_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: WOMPI_CLIENT_ID,
        client_secret: WOMPI_CLIENT_SECRET,
      }),
    })

    const tokenResponseText = await tokenResponse.text()

    if (!tokenResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "Failed to authenticate with Wompi",
        details: {
          status: tokenResponse.status,
          // response body omitted
          endpoint: `${WOMPI_BASE_ACCESS_URL}`,
        },
      })
    }

    let tokenData
    try {
      tokenData = JSON.parse(tokenResponseText)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: "Invalid token response format",
        details: {
          response: tokenResponseText,
          parseError: parseError.message,
        },
      })
    }

    if (!tokenData.access_token) {
      return NextResponse.json({
        success: false,
        error: "No access token in response",
        details: tokenData,
      })
    }

    // Test API connectivity with the token
    console.log("Testing Wompi API connectivity...")
    const apiTestResponse = await fetch(`${WOMPI_BASE_URL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Wompi connection successful",
      details: {
        tokenObtained: true,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        apiConnectivity: apiTestResponse.ok,
        apiStatus: apiTestResponse.status,
        endpoints: {
          auth: WOMPI_BASE_ACCESS_URL,
          api: WOMPI_BASE_URL,
        },
      },
    })
  } catch (error) {
    console.error("Wompi connection test error:", error)
    return NextResponse.json({
      success: false,
      error: "Connection test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
