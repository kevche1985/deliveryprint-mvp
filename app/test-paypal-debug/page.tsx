"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, AlertTriangle, CreditCard } from "lucide-react"

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning'
  message: string
  details?: any
  duration?: number
}

export default function PayPalDebugPage() {
  const { toast } = useToast()
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [debugLog, setDebugLog] = useState<string>('')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => `${prev}[${timestamp}] ${message}\n`)
  }

  const updateTest = (name: string, result: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, ...result } : test
    ))
  }

  const runTest = async (testName: string, testFn: () => Promise<TestResult>) => {
    updateTest(testName, { status: 'running' })
    addLog(`Starting test: ${testName}`)
    
    const startTime = Date.now()
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      updateTest(testName, { ...result, duration })
      addLog(`Test completed: ${testName} - ${result.status} (${duration}ms)`)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const result = {
        name: testName,
        status: 'failed' as const,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      }
      updateTest(testName, result)
      addLog(`Test failed: ${testName} - ${error} (${duration}ms)`)
      return result
    }
  }

  const testPayPalCredentials = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/payments/paypal/test-credentials')
      const result = await response.json()
      
      if (response.ok && result.success) {
        return {
          name: 'PayPal Credentials',
          status: 'passed',
          message: 'PayPal credentials are valid and working',
          details: result
        }
      } else {
        return {
          name: 'PayPal Credentials',
          status: 'failed',
          message: result.error || 'PayPal credentials test failed',
          details: result
        }
      }
    } catch (error) {
      return {
        name: 'PayPal Credentials',
        status: 'failed',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  const testOrderCreation = async (): Promise<TestResult> => {
    try {
      const testOrderData = {
        total: 10.00,
        orderId: `TEST-${Date.now()}`,
        items: [{
          name: 'Test Product',
          quantity: 1,
          price: 10.00
        }],
        billingInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          address: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          country: 'US'
        },
        subtotal: 10.00,
        tax: 0,
        shipping: 0
      }

      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testOrderData)
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        return {
          name: 'Order Creation',
          status: 'passed',
          message: `PayPal order created successfully: ${result.orderId}`,
          details: result
        }
      } else {
        return {
          name: 'Order Creation',
          status: 'failed',
          message: result.error || 'Order creation failed',
          details: result
        }
      }
    } catch (error) {
      return {
        name: 'Order Creation',
        status: 'failed',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  const testEnvironmentVariables = async (): Promise<TestResult> => {
    try {
      // Check if PayPal client ID is available in the browser
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      
      if (!clientId) {
        return {
          name: 'Environment Variables',
          status: 'failed',
          message: 'NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set or not accessible',
          details: { clientId: 'Not found' }
        }
      }

      return {
        name: 'Environment Variables',
        status: 'passed',
        message: 'PayPal Client ID is available',
        details: { 
          clientId: `${clientId.substring(0, 10)}...`,
          environment: process.env.NODE_ENV
        }
      }
    } catch (error) {
      return {
        name: 'Environment Variables',
        status: 'failed',
        message: `Error checking environment: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  const testPayPalSDK = async (): Promise<TestResult> => {
    try {
      // Check if PayPal SDK is loaded
      if (typeof window !== 'undefined' && (window as any).paypal) {
        return {
          name: 'PayPal SDK',
          status: 'passed',
          message: 'PayPal SDK is loaded and available',
          details: { sdkVersion: (window as any).paypal.version || 'Unknown' }
        }
      } else {
        return {
          name: 'PayPal SDK',
          status: 'warning',
          message: 'PayPal SDK is not loaded (this is normal if not on checkout page)',
          details: { available: false }
        }
      }
    } catch (error) {
      return {
        name: 'PayPal SDK',
        status: 'failed',
        message: `Error checking PayPal SDK: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setDebugLog('')
    
    const testSuite = [
      { name: 'Environment Variables', fn: testEnvironmentVariables },
      { name: 'PayPal Credentials', fn: testPayPalCredentials },
      { name: 'PayPal SDK', fn: testPayPalSDK },
      { name: 'Order Creation', fn: testOrderCreation }
    ]

    // Initialize tests
    setTests(testSuite.map(test => ({
      name: test.name,
      status: 'pending',
      message: 'Waiting to run...'
    })))

    addLog('Starting PayPal diagnostic tests...')

    // Run tests sequentially
    for (const test of testSuite) {
      await runTest(test.name, test.fn)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    addLog('All tests completed!')
    setIsRunning(false)

    // Show summary toast
    const passedTests = tests.filter(t => t.status === 'passed').length
    const totalTests = tests.length
    
    toast({
      title: "PayPal Diagnostic Complete",
      description: `${passedTests}/${totalTests} tests passed`,
      variant: passedTests === totalTests ? "default" : "destructive"
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      passed: 'default',
      failed: 'destructive',
      warning: 'secondary',
      running: 'outline',
      pending: 'outline'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PayPal Payment Diagnostic</h1>
        <p className="text-gray-600">Debug PayPal payment integration issues</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              PayPal Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run PayPal Diagnostic'
              )}
            </Button>

            {tests.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Test Results</h3>
                {tests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-gray-600">{test.message}</div>
                        {test.duration && (
                          <div className="text-xs text-gray-400">{test.duration}ms</div>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(test.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Log */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={debugLog} 
              readOnly 
              className="h-96 font-mono text-sm"
              placeholder="Debug information will appear here..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Common Issues */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Common PayPal Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Spinning/Loading Issues:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Check PayPal credentials are correctly set in environment variables</li>
                  <li>• Verify network connectivity to PayPal APIs</li>
                  <li>• Check order data is valid (amount &gt; 0, items present)</li>
                  <li>• Check browser console for JavaScript errors</li>
                  <li>• Verify PayPal SDK is loading correctly</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Environment Setup:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• NEXT_PUBLIC_PAYPAL_CLIENT_ID must be set and start with 'A' or 'E'</li>
                  <li>• PAYPAL_CLIENT_SECRET must be different from Client ID</li>
                  <li>• Use sandbox credentials for development</li>
                  <li>• Ensure .env.local file is properly configured</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Quick Fixes:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Refresh the page and try again</li>
                  <li>• Clear browser cache and cookies</li>
                  <li>• Try a different browser or incognito mode</li>
                  <li>• Check if PayPal services are operational</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}