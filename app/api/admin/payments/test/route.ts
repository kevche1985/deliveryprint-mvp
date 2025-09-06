import { type NextRequest, NextResponse } from "next/server"

type PaymentProvider = {
  provider_name: string
  api_key: string
  api_secret: string
  is_test_mode: boolean
  endpoints: Record<string, any>
  additional_settings: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const { provider }: { provider: PaymentProvider } = await request.json()

    const startTime = Date.now()
    let testResult

    switch (provider.provider_name) {
      case "wompi":
        testResult = await testWompiConnection(provider)
        break
      case "paypal":
        testResult = await testPayPalConnection(provider)
        break
      case "stripe":
        testResult = await testStripeConnection(provider)
        break
      case "cash_on_delivery":
        testResult = {
          success: true,
          message: "Cash on Delivery is always available - no API connection required",
          response_time: Date.now() - startTime,
        }
        break
      default:
        testResult = {
          success: false,
          message: "Unknown payment provider",
          error_details: `Provider ${provider.provider_name} is not supported`,
        }
    }

    testResult.response_time = Date.now() - startTime
    return NextResponse.json(testResult)
  } catch (error) {
    console.error("Error in payment test:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Test failed with unexpected error",
        error_details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function testWompiConnection(provider: PaymentProvider) {
  try {
    if (!provider.api_key) {
      return {
        success: false,
        message: "API key is required for Wompi",
        error_details: "Missing public key",
      }
    }

    const baseUrl = provider.is_test_mode ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1"

    // Test getting merchant info
    const response = await fetch(`${baseUrl}/merchants/${provider.api_key}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: "Wompi connection successful",
        status_code: response.status,
        response_data: {
          merchant_name: data.data?.name || "Unknown",
          environment: provider.is_test_mode ? "sandbox" : "production",
        },
      }
    } else {
      return {
        success: false,
        message: "Wompi connection failed",
        status_code: response.status,
        error_details: data.error?.reason || "Unknown error",
      }
    }
  } catch (error) {
    return {
      success: false,
      message: "Wompi connection test failed",
      error_details: error instanceof Error ? error.message : "Network error",
    }
  }
}

async function testPayPalConnection(provider: PaymentProvider) {
  try {
    if (!provider.api_key || !provider.api_secret) {
      return {
        success: false,
        message: "Client ID and Client Secret are required for PayPal",
        error_details: "Missing credentials",
      }
    }

    const baseUrl = provider.is_test_mode ? "https://api.sandbox.paypal.com" : "https://api.paypal.com"

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en_US",
        Authorization: `Basic ${Buffer.from(`${provider.api_key}:${provider.api_secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    const authData = await authResponse.json()

    if (authResponse.ok && authData.access_token) {
      return {
        success: true,
        message: "PayPal connection successful",
        status_code: authResponse.status,
        response_data: {
          token_type: authData.token_type,
          expires_in: authData.expires_in,
          environment: provider.is_test_mode ? "sandbox" : "live",
        },
      }
    } else {
      return {
        success: false,
        message: "PayPal authentication failed",
        status_code: authResponse.status,
        error_details: authData.error_description || "Authentication failed",
      }
    }
  } catch (error) {
    return {
      success: false,
      message: "PayPal connection test failed",
      error_details: error instanceof Error ? error.message : "Network error",
    }
  }
}

async function testStripeConnection(provider: PaymentProvider) {
  try {
    if (!provider.api_secret) {
      return {
        success: false,
        message: "Secret key is required for Stripe",
        error_details: "Missing secret key",
      }
    }

    // Test by retrieving account information
    const response = await fetch("https://api.stripe.com/v1/account", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${provider.api_secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: "Stripe connection successful",
        status_code: response.status,
        response_data: {
          account_id: data.id,
          business_name: data.business_profile?.name || "Unknown",
          country: data.country,
          environment: provider.api_secret.startsWith("sk_test_") ? "test" : "live",
        },
      }
    } else {
      return {
        success: false,
        message: "Stripe connection failed",
        status_code: response.status,
        error_details: data.error?.message || "Unknown error",
      }
    }
  } catch (error) {
    return {
      success: false,
      message: "Stripe connection test failed",
      error_details: error instanceof Error ? error.message : "Network error",
    }
  }
}
