// PayPal API client using fetch instead of SDK
export async function getPayPalAccessToken() {
  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
  const PAYPAL_BASE_URL =
    process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

  console.log("PayPal Environment:", process.env.NODE_ENV)
  console.log("PayPal Base URL:", PAYPAL_BASE_URL)
  console.log("PayPal Client ID:", PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : "NOT SET")
  console.log("PayPal Client Secret:", PAYPAL_CLIENT_SECRET ? "SET" : "NOT SET")

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error(
      "PayPal credentials are not configured. Please check NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.",
    )
  }

  // Check if credentials are the same (common mistake)
  if (PAYPAL_CLIENT_ID === PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal Client ID and Client Secret cannot be the same. Please check your PayPal app credentials.")
  }

  // Validate credential format (PayPal credentials have specific patterns)
  if (!PAYPAL_CLIENT_ID.startsWith("A") && !PAYPAL_CLIENT_ID.startsWith("E")) {
    console.warn("PayPal Client ID format might be incorrect. It should start with 'A' or 'E'")
  }

  const credentials = `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  const encodedCredentials = Buffer.from(credentials).toString("base64")

  console.log("Encoded credentials length:", encodedCredentials.length)

  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en_US",
        Authorization: `Basic ${encodedCredentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    console.log("PayPal token response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayPal token error response:", errorText)

      if (response.status === 401) {
        throw new Error(
          `PayPal authentication failed. Please verify your credentials are correct for ${process.env.NODE_ENV === "production" ? "production" : "sandbox"} environment. Error: ${errorText}`,
        )
      }

      throw new Error(`Failed to get PayPal access token: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("PayPal access token obtained successfully")
    return data.access_token
  } catch (error) {
    console.error("PayPal access token error:", error)
    throw error
  }
}

export async function createPayPalOrder(accessToken: string, orderData: any) {
  const PAYPAL_BASE_URL =
    process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

  console.log("Creating PayPal order with access token:", accessToken ? "Present" : "Missing")

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "PayPal-Request-Id": `order-${Date.now()}`, // Unique request ID
    },
    body: JSON.stringify(orderData),
  })

  console.log("PayPal create order response status:", response.status)

  if (!response.ok) {
    const errorData = await response.text()
    console.error("PayPal create order error:", errorData)
    throw new Error(`PayPal API error: ${response.status} - ${errorData}`)
  }

  return await response.json()
}

export async function capturePayPalOrder(accessToken: string, orderId: string) {
  const PAYPAL_BASE_URL =
    process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

  console.log(`Capturing PayPal order ${orderId} with access token: ${accessToken ? "Present" : "Missing"}`)

  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "PayPal-Request-Id": `capture-${Date.now()}`, // Unique request ID to prevent duplicate captures
        Prefer: "return=representation", // Get full details in response
      },
    })

    console.log("PayPal capture response status:", response.status)

    // Get the response text first for logging
    const responseText = await response.text()
    console.log("PayPal capture response body:", responseText)

    if (!response.ok) {
      throw new Error(`PayPal capture error: ${response.status} - ${responseText}`)
    }

    // Parse the response text as JSON
    try {
      return JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse PayPal capture response as JSON:", e)
      throw new Error(`Invalid JSON response from PayPal: ${responseText}`)
    }
  } catch (error) {
    console.error("Error capturing PayPal order:", error)
    throw error
  }
}

export async function refundPayPalCapture(accessToken: string, captureId: string, amount?: { value: string; currency_code: string }) {
  const PAYPAL_BASE_URL = process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
  const body = amount ? { amount } : {}
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`PayPal refund error: ${response.status} - ${text}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export async function getPayPalOrder(accessToken: string, orderId: string) {
  const PAYPAL_BASE_URL =
    process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

  console.log(`Getting PayPal order ${orderId} with access token: ${accessToken ? "Present" : "Missing"}`)

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })

  console.log("PayPal get order response status:", response.status)

  if (!response.ok) {
    const errorData = await response.text()
    console.error("PayPal get order error:", errorData)
    throw new Error(`Failed to get order details: ${response.status} - ${errorData}`)
  }

  return await response.json()
}

// Export paypal object for backward compatibility
export const paypal = {
  getAccessToken: getPayPalAccessToken,
  createOrder: createPayPalOrder,
  captureOrder: capturePayPalOrder,
  getOrder: getPayPalOrder,
  refundCapture: refundPayPalCapture,
  async verifyWebhookEvent(body: string, headers: Headers) {
    const PAYPAL_BASE_URL = process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) {
      console.error("Missing PAYPAL_WEBHOOK_ID")
      return false
    }
    const authAlgo = headers.get("paypal-auth-algo") || headers.get("PayPal-Auth-Algo") || ""
    const certUrl = headers.get("paypal-cert-url") || headers.get("PayPal-Cert-Url") || ""
    const transmissionId = headers.get("paypal-transmission-id") || headers.get("PayPal-Transmission-Id") || ""
    const transmissionSig = headers.get("paypal-transmission-sig") || headers.get("PayPal-Transmission-Sig") || ""
    const transmissionTime = headers.get("paypal-transmission-time") || headers.get("PayPal-Transmission-Time") || ""
    if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
      console.error("Missing PayPal webhook headers")
      return false
    }
    try {
      const accessToken = await getPayPalAccessToken()
      const resp = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: JSON.parse(body),
        }),
      })
      if (!resp.ok) {
        const text = await resp.text()
        console.error("PayPal verify webhook failed:", resp.status, text)
        return false
      }
      const data = await resp.json()
      return data.verification_status === "SUCCESS"
    } catch (e) {
      console.error("Error verifying PayPal webhook:", e)
      return false
    }
  },
}
