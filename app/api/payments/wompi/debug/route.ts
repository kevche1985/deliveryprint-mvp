export async function POST(request: Request) {
  try {
    const body = await request.json()
    const testType = body.testType || "default"
    const useRedirectUri = body.useRedirectUri || false

    console.log(`🔧 Wompi Debug - ${testType} test`)
    console.log("WOMPI_CLIENT_ID:", process.env.WOMPI_CLIENT_ID ? "Set" : "Missing")
    console.log("WOMPI_CLIENT_SECRET:", process.env.WOMPI_CLIENT_SECRET ? "Set" : "Missing")
    console.log("WOMPI_BASE_URL:", process.env.WOMPI_BASE_URL)
    console.log("WOMPI_REDIRECT_URI:", process.env.WOMPI_REDIRECT_URI)
    console.log("WOMPI_WEBHOOK_SECRET:", process.env.WOMPI_WEBHOOK_SECRET ? "Set" : "Missing")

    // Check if we have the required credentials
    if (!process.env.WOMPI_CLIENT_ID || !process.env.WOMPI_CLIENT_SECRET) {
      return Response.json({
        success: false,
        error: "Missing required Wompi credentials",
        environment: {
          WOMPI_CLIENT_ID: process.env.WOMPI_CLIENT_ID ? "Set" : "Missing",
          WOMPI_CLIENT_SECRET: process.env.WOMPI_CLIENT_SECRET ? "Set" : "Missing",
          WOMPI_BASE_URL: process.env.WOMPI_BASE_URL || "Missing",
          WOMPI_REDIRECT_URI: process.env.WOMPI_REDIRECT_URI || "Missing",
          WOMPI_WEBHOOK_SECRET: process.env.WOMPI_WEBHOOK_SECRET ? "Set" : "Missing",
        },
      })
    }

    const tokenUrl = "https://id.wompi.sv/connect/token"

    // Prepare OAuth request body
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.WOMPI_CLIENT_ID,
      client_secret: process.env.WOMPI_CLIENT_SECRET,
      scope: "payments",
    })

    // Add redirect_uri if requested
    if (useRedirectUri && process.env.WOMPI_REDIRECT_URI) {
      params.append("redirect_uri", process.env.WOMPI_REDIRECT_URI)
    }

    console.log("🚀 Making OAuth request to:", tokenUrl)
    console.log("📝 Request body:", params.toString().replace(process.env.WOMPI_CLIENT_SECRET, "***"))

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "DeliveryPrint-MVP/1.0",
      },
      body: params.toString(),
    })

    console.log("📡 Response status:", response.status)
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("📄 Response body (first 500 chars):", responseText.substring(0, 500))

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      environment: {
        WOMPI_CLIENT_ID: process.env.WOMPI_CLIENT_ID ? "Set" : "Missing",
        WOMPI_CLIENT_SECRET: process.env.WOMPI_CLIENT_SECRET ? "Set" : "Missing",
        WOMPI_BASE_URL: process.env.WOMPI_BASE_URL || "Missing",
        WOMPI_REDIRECT_URI: process.env.WOMPI_REDIRECT_URI || "Missing",
        WOMPI_WEBHOOK_SECRET: process.env.WOMPI_WEBHOOK_SECRET ? "Set" : "Missing",
      },
    }

    // Try to parse as JSON if possible
    try {
      const jsonData = JSON.parse(responseText)
      result.parsedBody = jsonData
      console.log("✅ Successfully parsed JSON response")
    } catch (e) {
      result.parseError = "Response is not valid JSON - likely HTML error page"
      console.log("❌ Failed to parse as JSON, likely HTML response")
    }

    return Response.json(result)
  } catch (error: any) {
    console.error("❌ Wompi Debug Error:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
