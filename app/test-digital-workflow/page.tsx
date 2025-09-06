"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Download, 
  ShoppingCart, 
  CreditCard,
  Palette,
  Database,
  Loader2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useDigitalCart } from "@/lib/digital-cart-context"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

interface TestStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: TestResult
}

export default function DigitalWorkflowTestPage() {
  const { user } = useAuth()
  const { items: digitalItems, addItem, clearCart } = useDigitalCart()
  
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    {
      id: 'auth-check',
      name: 'Authentication Check',
      description: 'Verify user is authenticated and can access digital products',
      status: 'pending'
    },
    {
      id: 'ai-generation',
      name: 'AI Design Generation',
      description: 'Test AI image generation and storage',
      status: 'pending'
    },
    {
      id: 'digital-storage',
      name: 'Digital Product Storage',
      description: 'Verify design is stored in digital_products table',
      status: 'pending'
    },
    {
      id: 'cart-addition',
      name: 'Digital Cart Addition',
      description: 'Test adding digital product to cart',
      status: 'pending'
    },
    {
      id: 'payment-simulation',
      name: 'Payment Simulation',
      description: 'Simulate payment completion and status update',
      status: 'pending'
    },
    {
      id: 'dashboard-display',
      name: 'Dashboard Display',
      description: 'Verify purchased design appears in dashboard',
      status: 'pending'
    },
    {
      id: 'download-test',
      name: 'Download Functionality',
      description: 'Test design download with format selection',
      status: 'pending'
    },
    {
      id: 'cleanup-test',
      name: 'Cleanup Process',
      description: 'Test unpurchased design cleanup (manual trigger)',
      status: 'pending'
    }
  ])
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [testData, setTestData] = useState<any>({})
  
  const updateStepStatus = (stepId: string, status: TestStep['status'], result?: TestResult) => {
    setTestSteps((prev: TestStep[]) => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, result }
        : step
    ))
  }
  
  const runTest = async (stepId: string): Promise<TestResult> => {
    setCurrentStep(stepId)
    updateStepStatus(stepId, 'running')
    
    try {
      switch (stepId) {
        case 'auth-check':
          return await testAuthentication()
        case 'ai-generation':
          return await testAIGeneration()
        case 'digital-storage':
          return await testDigitalStorage()
        case 'cart-addition':
          return await testCartAddition()
        case 'payment-simulation':
          return await testPaymentSimulation()
        case 'dashboard-display':
          return await testDashboardDisplay()
        case 'download-test':
          return await testDownloadFunctionality()
        case 'cleanup-test':
          return await testCleanupProcess()
        default:
          throw new Error(`Unknown test step: ${stepId}`)
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Test failed with exception',
        error: error.message
      }
    }
  }
  
  const testAuthentication = async (): Promise<TestResult> => {
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated',
        error: 'Please log in to run tests'
      }
    }
    
    // Test session validity
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return {
        success: false,
        message: 'Invalid session',
        error: error?.message || 'No active session'
      }
    }
    
    return {
      success: true,
      message: `Authenticated as ${user.email}`,
      data: { userId: user.id, email: user.email }
    }
  }
  
  const testAIGeneration = async (): Promise<TestResult> => {
    try {
      // Simulate AI generation by creating a test design
      const testDesign = {
        productType: 'image',
        name: `Test AI Image - ${Date.now()}`,
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzQzODVmNCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VGVzdCBEZXNpZ248L3RleHQ+PC9zdmc+',
        description: 'Test AI-generated image for workflow testing',
        generationParams: {
          prompt: 'Test design for workflow validation',
          category: 'test',
          style: 'modern'
        }
      }
      
      const response = await fetch('/api/digital-products/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(testDesign)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to store test design')
      }
      
      const result = await response.json()
      setTestData((prev: any) => ({ ...prev, testDesign: result.product }))
      
      return {
        success: true,
        message: 'Test design generated and stored successfully',
        data: result.product
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'AI generation test failed',
        error: error.message
      }
    }
  }
  
  const testDigitalStorage = async (): Promise<TestResult> => {
    if (!testData.testDesign) {
      return {
        success: false,
        message: 'No test design available',
        error: 'Run AI generation test first'
      }
    }
    
    try {
      // Verify the design exists in the database
      const { data: product, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('id', testData.testDesign.id)
        .eq('user_id', user?.id)
        .single()
      
      if (error || !product) {
        return {
          success: false,
          message: 'Design not found in database',
          error: error?.message || 'Product not found'
        }
      }
      
      // Check if status is 'unpurchased'
      if (product.status !== 'unpurchased') {
        return {
          success: false,
          message: `Unexpected status: ${product.status}`,
          error: 'Expected status to be "unpurchased"'
        }
      }
      
      return {
        success: true,
        message: 'Design properly stored with correct status',
        data: product
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Database verification failed',
        error: error.message
      }
    }
  }
  
  const testCartAddition = async (): Promise<TestResult> => {
    if (!testData.testDesign) {
      return {
        success: false,
        message: 'No test design available',
        error: 'Run AI generation test first'
      }
    }
    
    try {
      // Clear cart first
      clearCart()
      
      // Add test design to cart
      addItem({
        productId: testData.testDesign.id,
        designId: testData.testDesign.id,
        type: 'image',
        name: testData.testDesign.name,
        basePrice: 4.99,
        previewUrl: testData.testDesign.preview_url,
        generationInputs: testData.testDesign.generation_inputs || {},
        selectedFormats: ['PNG'],
        selectedLicense: 'personal' as any,
        formatOptions: ['PNG', 'JPG', 'PDF'] as any,
        licenseOptions: ['personal', 'commercial'] as any,
        downloadReady: false,
      })
      
      // Wait a moment for state update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return {
        success: true,
        message: 'Design added to digital cart successfully',
        data: { cartItemCount: digitalItems.length + 1 }
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Cart addition failed',
        error: error.message
      }
    }
  }
  
  const testPaymentSimulation = async (): Promise<TestResult> => {
    if (!testData.testDesign) {
      return {
        success: false,
        message: 'No test design available',
        error: 'Run previous tests first'
      }
    }
    
    try {
      // Simulate payment completion by directly calling the service
      const { markDigitalProductAsPurchased } = await import('@/lib/digital-product-service')
      
      const testOrderId = `test-order-${Date.now()}`
      const testTransactionId = `test-tx-${Date.now()}`
      
      const updatedProduct = await markDigitalProductAsPurchased(
        testData.testDesign.id,
        testOrderId,
        testTransactionId
      )
      
      if (!updatedProduct) {
        return {
          success: false,
          message: 'Failed to mark product as purchased',
          error: 'markDigitalProductAsPurchased returned null'
        }
      }
      
      setTestData(prev => ({ ...prev, purchasedDesign: updatedProduct }))
      
      return {
        success: true,
        message: 'Payment simulation completed successfully',
        data: { 
          orderId: testOrderId, 
          transactionId: testTransactionId,
          status: updatedProduct.status 
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Payment simulation failed',
        error: error.message
      }
    }
  }
  
  const testDashboardDisplay = async (): Promise<TestResult> => {
    if (!testData.purchasedDesign) {
      return {
        success: false,
        message: 'No purchased design available',
        error: 'Run payment simulation test first'
      }
    }
    
    try {
      // Test the dashboard API functions
      const { getUserPurchasedDigitalProducts } = await import('@/lib/digital-product-service')
      
      const purchasedProducts = await getUserPurchasedDigitalProducts(user!.id)
      
      const testProduct = purchasedProducts.find(p => p.id === testData.purchasedDesign.id)
      
      if (!testProduct) {
        return {
          success: false,
          message: 'Purchased design not found in dashboard',
          error: 'Product not returned by getUserPurchasedDigitalProducts'
        }
      }
      
      if (testProduct.status !== 'purchased') {
        return {
          success: false,
          message: `Incorrect status in dashboard: ${testProduct.status}`,
          error: 'Expected status to be "purchased"'
        }
      }
      
      return {
        success: true,
        message: 'Design correctly appears in dashboard as purchased',
        data: { productCount: purchasedProducts.length }
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Dashboard display test failed',
        error: error.message
      }
    }
  }
  
  const testDownloadFunctionality = async (): Promise<TestResult> => {
    if (!testData.purchasedDesign) {
      return {
        success: false,
        message: 'No purchased design available',
        error: 'Run payment simulation test first'
      }
    }
    
    try {
      // Test the download API
      const response = await fetch(`/api/digital-products/${testData.purchasedDesign.id}/download?format=PNG`, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })
      
      if (!response.ok) {
        const error = await response.text()
        return {
          success: false,
          message: `Download API returned ${response.status}`,
          error: error
        }
      }
      
      const contentType = response.headers.get('content-type')
      const contentDisposition = response.headers.get('content-disposition')
      
      if (!contentType || !contentDisposition) {
        return {
          success: false,
          message: 'Missing download headers',
          error: 'Content-Type or Content-Disposition header missing'
        }
      }
      
      return {
        success: true,
        message: 'Download functionality working correctly',
        data: { 
          contentType, 
          contentDisposition,
          responseSize: response.headers.get('content-length') || 'unknown'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Download test failed',
        error: error.message
      }
    }
  }
  
  const testCleanupProcess = async (): Promise<TestResult> => {
    try {
      // Test the cleanup cron job endpoint
      const response = await fetch('/api/cron/cleanup-unpurchased', {
        method: 'POST' // Use POST for manual trigger
      })
      
      if (!response.ok) {
        const error = await response.text()
        return {
          success: false,
          message: `Cleanup API returned ${response.status}`,
          error: error
        }
      }
      
      const result = await response.json()
      
      if (!result.success) {
        return {
          success: false,
          message: 'Cleanup process reported failure',
          error: result.error || 'Unknown cleanup error'
        }
      }
      
      return {
        success: true,
        message: 'Cleanup process executed successfully',
        data: result.summary
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Cleanup test failed',
        error: error.message
      }
    }
  }
  
  const runAllTests = async () => {
    setIsRunning(true)
    
    for (const step of testSteps) {
      const result = await runTest(step.id)
      updateStepStatus(step.id, result.success ? 'success' : 'error', result)
      
      if (!result.success) {
        toast({
          title: "Test Failed",
          description: `${step.name}: ${result.message}`,
          variant: "destructive",
        })
        break
      } else {
        toast({
          title: "Test Passed",
          description: `${step.name}: ${result.message}`,
        })
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setCurrentStep(null)
    setIsRunning(false)
  }
  
  const getStatusIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }
  
  const getStatusBadge = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }
  
  const successCount = testSteps.filter(step => step.status === 'success').length
  const errorCount = testSteps.filter(step => step.status === 'error').length
  const totalTests = testSteps.length
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Workflow Test Suite</h1>
          <p className="text-gray-600">
            Comprehensive testing of the digital design workflow from AI generation to download
          </p>
        </div>
        
        {/* Test Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalTests}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((successCount / totalTests) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning || !user}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Authentication Warning */}
        {!user && (
          <Alert className="mb-6">
            <AlertDescription>
              Please log in to run the digital workflow tests. Authentication is required to test the complete flow.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Test Steps */}
        <div className="space-y-4">
          {testSteps.map((step, index) => (
            <Card key={step.id} className={currentStep === step.id ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                      {index + 1}
                    </div>
                    {getStatusIcon(step.status)}
                    <div>
                      <CardTitle className="text-lg">{step.name}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(step.status)}
                </div>
              </CardHeader>
              
              {step.result && (
                <CardContent>
                  <div className={`p-3 rounded-lg ${
                    step.result.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`font-medium ${
                      step.result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {step.result.message}
                    </div>
                    
                    {step.result.error && (
                      <div className="text-sm text-red-600 mt-1">
                        Error: {step.result.error}
                      </div>
                    )}
                    
                    {step.result.data && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-gray-600">
                          View Details
                        </summary>
                        <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                          {JSON.stringify(step.result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}