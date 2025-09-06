"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function PaymentDebug() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testAPI = async () => {
    setTesting(true)
    setResults(null)

    try {
      console.log("Testing Wompi API endpoint...")

      const testPayload = {
        tarjetaCreditoDebido: {
          numeroTarjeta: "4111111111111111",
          cvv: "123",
          mesVencimiento: 12,
          anioVencimiento: 2025,
        },
        monto: 10.0,
        nombre: "Test",
        apellido: "User",
        email: "test@example.com",
        telefono: "12345678",
        direccion: "Test Address",
        ciudad: "San Salvador",
        idRegion: "SV-SS",
        codigoPostal: "1101",
        idPais: "SV",
        urlRedirect: `${window.location.origin}/payment-complete?orderId=test`,
        configuracion: {
          emailsNotificacion: "test@example.com",
          telefonosNotificacion: "12345678",
          notificarTransaccionCliente: true,
          urlWebhook: `${window.location.origin}/api/payments/wompi/webhook`,
        },
        idExterno: "test-order-123",
        datosAdicionales: {
          cardholderName: "Test User",
        },
      }

      console.log("Sending test payload:", testPayload)

      const response = await fetch("/api/payments/wompi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log("Raw response:", responseText)

      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseText)
      } catch (parseError) {
        parsedResponse = {
          error: "Failed to parse JSON",
          rawResponse: responseText,
          parseError: parseError.message,
        }
      }

      setResults({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedResponse,
        rawResponse: responseText,
      })
    } catch (error) {
      console.error("Test error:", error)
      setResults({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
    } finally {
      setTesting(false)
    }
  }

  const testEnvironmentVariables = async () => {
    try {
      const response = await fetch("/api/payments/wompi/test-env")
      const result = await response.json()
      console.log("Environment test result:", result)
    } catch (error) {
      console.error("Environment test error:", error)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Wompi Payment API Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testAPI} disabled={testing}>
            {testing ? "Testing..." : "Test API Endpoint"}
          </Button>
          <Button variant="outline" onClick={testEnvironmentVariables}>
            Test Environment Variables
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={results.ok ? "default" : "destructive"}>Status: {results.status}</Badge>
              <Badge variant={results.ok ? "default" : "secondary"}>{results.ok ? "Success" : "Error"}</Badge>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Response Headers:</h4>
              <Textarea value={JSON.stringify(results.headers, null, 2)} readOnly className="h-32" />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Response Body:</h4>
              <Textarea value={JSON.stringify(results.body, null, 2)} readOnly className="h-64" />
            </div>

            {results.rawResponse && (
              <div>
                <h4 className="font-semibold mb-2">Raw Response:</h4>
                <Textarea value={results.rawResponse} readOnly className="h-32 font-mono text-sm" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
