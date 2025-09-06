import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing request size...")

    // Check headers first
    const contentLength = request.headers.get("content-length")
    const contentType = request.headers.get("content-type")

    console.log("📊 Request headers:", {
      contentLength,
      contentType,
      userAgent: request.headers.get("user-agent"),
    })

    // Try to read the body
    const body = await request.text()
    const bodySize = body.length

    console.log("📏 Request body size:", {
      characters: bodySize,
      kilobytes: Math.round(bodySize / 1024),
      megabytes: Math.round((bodySize / (1024 * 1024)) * 100) / 100,
    })

    // Try to parse as JSON
    let parsedData = null
    let parseError = null

    try {
      parsedData = JSON.parse(body)
      console.log("✅ JSON parsed successfully")
    } catch (error) {
      parseError = error instanceof Error ? error.message : "Unknown parse error"
      console.error("❌ JSON parse failed:", parseError)
    }

    return NextResponse.json({
      success: true,
      requestInfo: {
        contentLength,
        contentType,
        bodySize: {
          characters: bodySize,
          kilobytes: Math.round(bodySize / 1024),
          megabytes: Math.round((bodySize / (1024 * 1024)) * 100) / 100,
        },
        jsonParseable: !parseError,
        parseError,
        dataKeys: parsedData ? Object.keys(parsedData) : null,
      },
    })
  } catch (error: any) {
    console.error("💥 Error in test-size endpoint:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
