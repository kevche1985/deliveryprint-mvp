"use client"

import { useState } from "react"

const TestWompiPage = () => {
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  // Environment variables for testing
  const envVars = {
    WOMPI_CLIENT_ID: process.env.NEXT_PUBLIC_WOMPI_CLIENT_ID || "Not set",
    WOMPI_CLIENT_SECRET: process.env.NEXT_PUBLIC_WOMPI_CLIENT_SECRET || "Not set",
    WOMPI_BASE_URL: process.env.NEXT_PUBLIC_WOMPI_BASE_URL || "Not set",
    WOMPI_BASE_ACCESS_URL: "https://id.wompi.sv/connect/token",
    WOMPI_REDIRECT_URI: process.env.WOMPI_REDIRECT_URI || "Not set",
    WOMPI_WEBHOOK_SECRET: process.env.WOMPI_WEBHOOK_SECRET || "Not set",
  }

  const testOAuth = async () => {
    setLoading(true)
    setResult("")

    try {
      const response = await fetch("/api/payments/wompi/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          useRedirectUri: true, // Use the configured redirect URI
        }),
      })

      const data = await response.text()
      setResult(data)
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Wompi Test Page</h1>
      <p>Client ID: {envVars.WOMPI_CLIENT_ID}</p>
      <p>Client Secret: {envVars.WOMPI_CLIENT_SECRET}</p>
      <p>Base URL: {envVars.WOMPI_BASE_URL}</p>
      <p>Base Access URL: {envVars.WOMPI_BASE_ACCESS_URL}</p>
      <p>Redirect URI: {envVars.WOMPI_REDIRECT_URI}</p>
      <p>Webhook Secret: {envVars.WOMPI_WEBHOOK_SECRET}</p>

      <button onClick={testOAuth} disabled={loading}>
        {loading ? "Loading..." : "Test OAuth"}
      </button>

      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  )
}

export default TestWompiPage
