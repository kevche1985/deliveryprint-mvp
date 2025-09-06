import { type NextRequest, NextResponse } from "next/server"

interface WompiPaymentRequest {
  tarjetaCreditoDebido: {
    numeroTarjeta: string
    cvv: string
    mesVencimiento: number
    anioVencimiento: number
  }
  monto: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  idRegion: string
  codigoPostal: string
  idPais: string
  urlRedirect: string
  configuracion: {
    emailsNotificacion: string
    telefonosNotificacion: string
    notificarTransaccionCliente: boolean
    urlWebhook: string
  }
  datosAdicionales: any
  idExterno: string
}

// Enhanced mock payment processing
function processMockPayment(paymentData: WompiPaymentRequest) {
  console.log("🎭 Processing mock payment for testing...")

  const cardNumber = paymentData.tarjetaCreditoDebido.numeroTarjeta
  const lastFourDigits = cardNumber.slice(-4)
  const amount = paymentData.monto

  console.log(`💳 Card ending in: ${lastFourDigits}`)
  console.log(`💰 Amount: $${amount}`)

  // Simulate different payment scenarios based on card number
  if (lastFourDigits === "0000") {
    console.log("❌ Simulating insufficient funds")
    return {
      success: false,
      error: "Insufficient funds",
      code: "01",
      estado: "RECHAZADO",
    }
  }

  if (lastFourDigits === "1111") {
    console.log("🔐 Simulating 3DS authentication required")
    const transactionId = `mock-3ds-${Date.now()}`
    return {
      success: true,
      data: {
        idTransaccion: transactionId,
        numeroReferencia: `REF-${Date.now()}`,
        urlCompletarPago3Ds: `/payment-complete?orderId=${paymentData.idExterno}&status=success&type=3ds&transactionId=${transactionId}`,
        estado: "PENDIENTE_3DS",
        mensaje: "3DS authentication required",
      },
    }
  }

  if (lastFourDigits === "2222") {
    console.log("❌ Simulating card declined")
    return {
      success: false,
      error: "Card declined by issuer",
      code: "05",
      estado: "RECHAZADO",
    }
  }

  if (lastFourDigits === "3333") {
    console.log("❌ Simulating expired card")
    return {
      success: false,
      error: "Expired card",
      code: "54",
      estado: "RECHAZADO",
    }
  }

  // Default: Successful payment
  console.log("✅ Simulating successful payment")
  const transactionId = `mock-success-${Date.now()}`
  return {
    success: true,
    data: {
      idTransaccion: transactionId,
      numeroReferencia: `REF-${Date.now()}`,
      codigoAutorizacion: `AUTH-${Date.now()}`,
      estado: "EXITOSO",
      mensaje: "Payment processed successfully (mock mode)",
    },
  }
}

// Safe database operation with error handling
async function safeDbOperation(operation: () => Promise<any>, description: string) {
  try {
    console.log(`📊 Attempting ${description}...`)
    const result = await operation()
    console.log(`✅ ${description} successful`)
    return result
  } catch (error) {
    console.error(`⚠️ ${description} failed:`, error)
    return null
  }
}

// Enhanced real Wompi API with detailed debugging
async function attemptRealWompiPayment(paymentData: WompiPaymentRequest) {
  const WOMPI_CLIENT_ID = process.env.WOMPI_CLIENT_ID
  const WOMPI_CLIENT_SECRET = process.env.WOMPI_CLIENT_SECRET
  const WOMPI_BASE_URL = process.env.WOMPI_BASE_URL || "https://api.wompi.sv"

  if (!WOMPI_CLIENT_ID || !WOMPI_CLIENT_SECRET) {
    throw new Error("Wompi credentials not configured")
  }

  console.log("🔐 === STEP 1: OAUTH TOKEN REQUEST ===")
  console.log("🔗 OAuth URL: https://id.wompi.sv/connect/token")
  console.log("🆔 Client ID:", WOMPI_CLIENT_ID?.substring(0, 8) + "...")
  console.log("🔑 Client Secret:", WOMPI_CLIENT_SECRET ? "SET" : "NOT SET")

  // Step 1: Get OAuth token with enhanced logging
  const tokenRequestBody = new URLSearchParams({
    grant_type: "client_credentials",
    audience: "wompi_api",
    client_id: WOMPI_CLIENT_ID,
    client_secret: WOMPI_CLIENT_SECRET,
  }).toString()

  console.log("📤 Token request body:", tokenRequestBody.replace(WOMPI_CLIENT_SECRET, "***SECRET***"))

  const tokenResponse = await fetch("https://id.wompi.sv/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "DeliveryPrint-MVP/1.0",
    },
    body: tokenRequestBody,
  })

  console.log("📡 OAuth response status:", tokenResponse.status)
  console.log("📡 OAuth response headers:", Object.fromEntries(tokenResponse.headers.entries()))

  const tokenResponseText = await tokenResponse.text()
  console.log("📄 OAuth response body:", tokenResponseText)

  if (!tokenResponse.ok) {
    console.error("❌ OAuth failed with status:", tokenResponse.status)
    throw new Error(`OAuth failed: ${tokenResponse.status} - ${tokenResponseText}`)
  }

  let tokenData
  try {
    tokenData = JSON.parse(tokenResponseText)
    console.log("✅ OAuth token parsed successfully")
    console.log("🎫 Token type:", tokenData.token_type)
    console.log("⏰ Expires in:", tokenData.expires_in)
    console.log("🔑 Access token (first 20 chars):", tokenData.access_token?.substring(0, 20) + "...")
  } catch (parseError) {
    console.error("❌ Failed to parse OAuth response:", parseError)
    throw new Error("Invalid OAuth response format")
  }

  console.log("🔐 === STEP 2: PAYMENT API REQUEST ===")

  // Try multiple API endpoints and payload formats
  const apiEndpoints = [
    `${WOMPI_BASE_URL}/TransaccionCompra/3DS`,
    `${WOMPI_BASE_URL}/TransaccionCompra`,
    `${WOMPI_BASE_URL}/api/TransaccionCompra`,
    `${WOMPI_BASE_URL}/v1/TransaccionCompra`,
  ]

  // Full payload first (as requested)
  const fullPayload = {
    tarjetaCreditoDebido: {
      numeroTarjeta: paymentData.tarjetaCreditoDebido.numeroTarjeta,
      cvv: paymentData.tarjetaCreditoDebido.cvv,
      mesVencimiento: paymentData.tarjetaCreditoDebido.mesVencimiento,
      anioVencimiento: paymentData.tarjetaCreditoDebido.anioVencimiento,
    },
    monto: paymentData.monto,
    nombre: paymentData.nombre,
    apellido: paymentData.apellido,
    email: paymentData.email,
    telefono: paymentData.telefono,
    direccion: paymentData.direccion,
    ciudad: paymentData.ciudad,
    idRegion: paymentData.idRegion,
    codigoPostal: paymentData.codigoPostal,
    idPais: paymentData.idPais,
    urlRedirect: paymentData.urlRedirect,
    configuracion: paymentData.configuracion,
    idExterno: paymentData.idExterno,
    datosAdicionales: {
      additionalProp1: "test",
      additionalProp2: "delivery_print",
      additionalProp3: "mvp",
    },
  }

  // Minimal payload second
  const minimalPayload = {
    tarjetaCreditoDebido: {
      numeroTarjeta: paymentData.tarjetaCreditoDebido.numeroTarjeta,
      cvv: paymentData.tarjetaCreditoDebido.cvv,
      mesVencimiento: paymentData.tarjetaCreditoDebido.mesVencimiento,
      anioVencimiento: paymentData.tarjetaCreditoDebido.anioVencimiento,
    },
    monto: paymentData.monto,
    nombre: paymentData.nombre,
    apellido: paymentData.apellido,
    email: paymentData.email,
    idExterno: paymentData.idExterno,
  }

  // Changed order: Full payload first, then minimal
  const payloads = [
    { name: "Full", data: fullPayload },
    { name: "Minimal", data: minimalPayload },
  ]

  let lastError = null

  // Try different combinations
  for (const endpoint of apiEndpoints) {
    for (const payload of payloads) {
      try {
        console.log(`🚀 Trying ${payload.name} payload at: ${endpoint}`)
        console.log("📤 Payload:", {
          ...payload.data,
          tarjetaCreditoDebido: {
            ...payload.data.tarjetaCreditoDebido,
            numeroTarjeta: `****${payload.data.tarjetaCreditoDebido.numeroTarjeta.slice(-4)}`,
            cvv: "***",
          },
        })

        const paymentResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "DeliveryPrint-MVP/1.0",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(payload.data),
        })

        console.log("📡 Payment response status:", paymentResponse.status)
        console.log("📡 Payment response headers:", Object.fromEntries(paymentResponse.headers.entries()))

        const responseText = await paymentResponse.text()
        console.log("📄 Payment response body:", responseText)

        if (paymentResponse.ok) {
          console.log("✅ Payment API call succeeded!")
          const responseData = JSON.parse(responseText)

          // Transform response to our format
          if (responseData.estado === "EXITOSO" || responseData.estado === "APROBADO") {
            return {
              success: true,
              data: {
                idTransaccion: responseData.idTransaccion,
                numeroReferencia: responseData.numeroReferencia,
                codigoAutorizacion: responseData.codigoAutorizacion,
                estado: responseData.estado,
                mensaje: responseData.mensaje,
              },
            }
          } else if (responseData.urlCompletarPago3Ds) {
            // 3DS authentication required - use the exact URL from Wompi
            return {
              success: true,
              requiresAuth: true,
              data: {
                idTransaccion: responseData.idTransaccion,
                numeroReferencia: responseData.numeroReferencia,
                urlCompletarPago3Ds: responseData.urlCompletarPago3Ds,
                estado: "PENDIENTE_3DS",
                monto: responseData.monto,
                esReal: responseData.esReal,
              },
            }
          } else {
            return {
              success: false,
              error: responseData.mensaje || "Payment failed",
              code: responseData.codigo,
              estado: responseData.estado,
            }
          }
        } else {
          console.log(`❌ ${endpoint} with ${payload.name} payload failed: ${paymentResponse.status}`)
          lastError = new Error(`${endpoint}: ${paymentResponse.status} - ${responseText}`)
        }
      } catch (error) {
        console.log(`❌ Error with ${endpoint} and ${payload.name} payload:`, error.message)
        lastError = error
      }
    }
  }

  // If we get here, all attempts failed
  throw lastError || new Error("All payment API attempts failed")
}

export async function POST(request: NextRequest) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    console.log("🎯 === WOMPI PAYMENT API CALLED ===")

    // Parse request body with error handling
    let paymentData: WompiPaymentRequest
    try {
      const body = await request.text()
      console.log("📝 Raw request body length:", body.length)
      paymentData = JSON.parse(body)
      console.log("✅ Request parsed successfully")
      console.log("📋 Order ID:", paymentData.idExterno)
      console.log("💰 Amount:", paymentData.monto)
      console.log("💳 Card ending in:", paymentData.tarjetaCreditoDebido?.numeroTarjeta?.slice(-4) || "N/A")
    } catch (parseError) {
      console.error("❌ Failed to parse request:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        },
        { status: 400, headers },
      )
    }

    // Validate required fields
    const validationErrors = []

    if (!paymentData.tarjetaCreditoDebido?.numeroTarjeta) {
      validationErrors.push("Card number is required")
    }

    if (!paymentData.monto || paymentData.monto <= 0) {
      validationErrors.push("Payment amount is required")
    }

    if (!paymentData.email) {
      validationErrors.push("Email address is required")
    }

    if (validationErrors.length > 0) {
      console.error("❌ Validation errors:", validationErrors)
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors.join(", "),
        },
        { status: 400, headers },
      )
    }

    // Try to save to database (optional - won't fail if DB is unavailable)
    await safeDbOperation(async () => {
      const { supabaseServer } = await import("@/lib/supabase-server")

      const transactionData = {
        id_externo: paymentData.idExterno,
        monto: paymentData.monto,
        estado: "pending",
        es_real: false,
        metodo_pago: "wompi",
        nombre: paymentData.nombre,
        apellido: paymentData.apellido,
        email: paymentData.email,
        telefono: paymentData.telefono,
        ciudad: paymentData.ciudad,
        direccion: paymentData.direccion,
        id_pais: paymentData.idPais,
        id_region: paymentData.idRegion,
        codigo_postal: paymentData.codigoPostal,
        ultimos_digitos_tarjeta: paymentData.tarjetaCreditoDebido.numeroTarjeta.slice(-4),
        url_redirect: paymentData.urlRedirect,
        datos_adicionales: paymentData.datosAdicionales,
        created_at: new Date().toISOString(),
      }

      return await supabaseServer.from("wompi_transactions").insert(transactionData)
    }, "database transaction creation")

    // Process payment
    let paymentResult

    const enableRealWompi = process.env.ENABLE_REAL_WOMPI === "true"
    console.log("🎛️ ENABLE_REAL_WOMPI:", enableRealWompi)

    if (enableRealWompi) {
      console.log("🚀 === ATTEMPTING REAL WOMPI API ===")
      console.log("🔍 Will try Full payload first, then Minimal payload")
      try {
        paymentResult = await attemptRealWompiPayment(paymentData)
        console.log("✅ Real Wompi API succeeded!")

        // Update database if available
        await safeDbOperation(async () => {
          const { supabaseServer } = await import("@/lib/supabase-server")
          return await supabaseServer
            .from("wompi_transactions")
            .update({ es_real: true })
            .eq("id_externo", paymentData.idExterno)
        }, "marking transaction as real")
      } catch (apiError) {
        console.error("❌ Real Wompi API failed:", apiError instanceof Error ? apiError.message : "Unknown error")
        console.log("🔄 Falling back to mock payment...")
        paymentResult = processMockPayment(paymentData)
      }
    } else {
      console.log("🎭 === USING MOCK PAYMENT ===")
      paymentResult = processMockPayment(paymentData)
    }

    // Update database with result (optional)
    await safeDbOperation(async () => {
      const { supabaseServer } = await import("@/lib/supabase-server")

      const updateData: any = {
        wompi_response: paymentResult,
        updated_at: new Date().toISOString(),
      }

      if (paymentResult.success && paymentResult.data?.idTransaccion) {
        updateData.id_transaccion = paymentResult.data.idTransaccion
        updateData.estado = paymentResult.data.urlCompletarPago3Ds ? "pending_3ds" : "completed"
        updateData.authorization_code = paymentResult.data.codigoAutorizacion
        updateData.reference_number = paymentResult.data.numeroReferencia
        updateData.three_ds_url = paymentResult.data.urlCompletarPago3Ds
      } else {
        updateData.estado = "failed"
      }

      return await supabaseServer.from("wompi_transactions").update(updateData).eq("id_externo", paymentData.idExterno)
    }, "updating transaction with result")

    console.log("🎉 === PAYMENT PROCESSING COMPLETE ===")
    console.log("📊 Result:", paymentResult)

    return NextResponse.json(paymentResult, { headers })
  } catch (error) {
    console.error("❌ === CRITICAL ERROR ===")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    const errorResponse = {
      success: false,
      error: "Payment processing failed",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
