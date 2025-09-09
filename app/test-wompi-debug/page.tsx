"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react"

interface TestResult {
  success: boolean
  data?: any
  error?: string
  testType: string
  cvv: string
}

export default function TestWompiDebugPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [cardNumber, setCardNumber] = useState("4111111111111111")
  const [testCvv, setTestCvv] = useState("123")

  const runSingleTest = async (cvv: string, testType: string) => {
    setLoading(true)
    try {
      const testPaymentData = {
        tarjetaCreditoDebido: {
          numeroTarjeta: cardNumber,
          cvv: cvv,
          mesVencimiento: 12,
          anioVencimiento: 2025,
        },
        monto: 1.00,
        nombre: "Test",
        apellido: "User",
        email: "test@example.com",
        telefono: "70000000",
        direccion: "Test Address",
        ciudad: "San Salvador",
        idRegion: "SV-SS",
        codigoPostal: "01101",
        idPais: "SV",
        urlRedirect: `${window.location.origin}/payment-complete`,
        configuracion: {
          emailsNotificacion: "test@example.com",
          telefonosNotificacion: "70000000",
          notificarTransaccionCliente: true,
          urlWebhook: `${window.location.origin}/api/payments/wompi/webhook`,
        },
        idExterno: `test-${Date.now()}-${cvv}`,
        datosAdicionales: {
          testType: testType,
          timestamp: new Date().toISOString()
        },
      }

      console.log(`🧪 Testing Wompi with CVV: ${cvv} (${testType})`)
      
      const response = await fetch("/api/payments/wompi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPaymentData),
      })

      const responseData = await response.json()
      
      const result: TestResult = {
        success: responseData.success,
        data: responseData.data,
        error: responseData.error,
        testType,
        cvv
      }

      setResults(prev => [result, ...prev])
      
    } catch (error) {
      const result: TestResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        testType,
        cvv
      }
      setResults(prev => [result, ...prev])
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setResults([])
    
    // Test successful payment (any CVV except 111)
    await runSingleTest("123", "Successful Payment")
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test rejected payment (CVV 111)
    await runSingleTest("111", "Rejected Payment")
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test another successful payment
    await runSingleTest("456", "Another Successful Payment")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wompi Test Mode Debug</h1>
        <p className="text-gray-600">Test the new Wompi implementation based on official documentation</p>
      </div>

      {/* Test Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4111111111111111"
            />
          </div>
          
          <div>
            <Label htmlFor="testCvv">Custom CVV Test</Label>
            <Input
              id="testCvv"
              value={testCvv}
              onChange={(e) => setTestCvv(e.target.value)}
              placeholder="123"
              maxLength={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run All Tests
            </Button>
            
            <Button 
              onClick={() => runSingleTest(testCvv, "Custom CVV Test")} 
              disabled={loading}
              variant="outline"
            >
              Test Custom CVV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Documentation */}
      <Alert className="mb-6">
        <AlertDescription>
          <strong>Wompi Test Mode (Official Documentation):</strong>
          <br />• CVV "111" = Payment will be rejected
          <br />• Any other CVV = Payment will be successful
          <br />• Use any valid card number for testing
          <br />• Application must be in development mode for test transactions
        </AlertDescription>
      </Alert>

      {/* Test Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{result.testType}</span>
                      <span className="text-sm text-gray-500">CVV: {result.cvv}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="text-sm text-red-600 mb-2">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="text-sm text-gray-600">
                      <strong>Response:</strong>
                      <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}