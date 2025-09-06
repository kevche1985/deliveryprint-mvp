import { NextResponse } from "next/server"

export async function GET() {
  const config = {
    WOMPI_BASE_URL: process.env.WOMPI_BASE_URL || "Not set",
    WOMPI_CLIENT_ID: process.env.WOMPI_CLIENT_ID ? "Set" : "Not set",
    WOMPI_CLIENT_SECRET: process.env.WOMPI_CLIENT_SECRET ? "Set" : "Not set",
    WOMPI_WEBHOOK_SECRET: process.env.WOMPI_WEBHOOK_SECRET ? "Set" : "Not set",
  }

  // Test connectivity to Wompi base URL
  let connectivityTest = "Unknown"
  try {
    if (process.env.WOMPI_BASE_URL) {
      const response = await fetch(process.env.WOMPI_BASE_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      connectivityTest = `${response.status} - ${response.statusText}`
    }
  } catch (error) {
    connectivityTest = `Error: ${error instanceof Error ? error.message : "Unknown error"}`
  }

  return NextResponse.json({
    environment: config,
    connectivity: connectivityTest,
    timestamp: new Date().toISOString(),
  })
}
