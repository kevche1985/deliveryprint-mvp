import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { transactionId, orderId } = await request.json()

    console.log("🔍 Verifying Wompi transaction:", { transactionId, orderId })

    // Get OAuth token
    const WOMPI_CLIENT_ID = process.env.WOMPI_CLIENT_ID
    const WOMPI_CLIENT_SECRET = process.env.WOMPI_CLIENT_SECRET
    const WOMPI_BASE_URL = process.env.WOMPI_BASE_URL || "https://api.wompi.sv"

    if (!WOMPI_CLIENT_ID || !WOMPI_CLIENT_SECRET) {
      throw new Error("Wompi credentials not configured")
    }

    // Get OAuth token
    const tokenResponse = await fetch("https://id.wompi.sv/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        audience: "wompi_api",
        client_id: WOMPI_CLIENT_ID,
        client_secret: WOMPI_CLIENT_SECRET,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to get OAuth token")
    }

    const tokenData = await tokenResponse.json()

    // Query transaction status
    const statusResponse = await fetch(`${WOMPI_BASE_URL}/Transaccion/${transactionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    })

    if (!statusResponse.ok) {
      throw new Error("Failed to query transaction status")
    }

    const statusData = await statusResponse.json()
    console.log("📊 Transaction status:", statusData)

    // Update database with final status
    try {
      const { supabaseServer } = await import("@/lib/supabase-server")

      await supabaseServer
        .from("wompi_transactions")
        .update({
          estado: statusData.estado?.toLowerCase(),
          wompi_response: statusData,
          updated_at: new Date().toISOString(),
        })
        .eq("id_transaccion", transactionId)

      // Update order status if payment successful
      if (statusData.estado === "EXITOSO" || statusData.estado === "APROBADO") {
        await supabaseServer
          .from("orders")
          .update({
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
      }
    } catch (dbError) {
      console.error("Database update error:", dbError)
    }

    return NextResponse.json({
      success: true,
      status: statusData.estado,
      data: statusData,
    })
  } catch (error) {
    console.error("Transaction verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 },
    )
  }
}
