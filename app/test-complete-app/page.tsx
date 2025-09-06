"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { useDigitalCart } from "@/lib/digital-cart-context"
import { CheckCircle, XCircle, Clock, AlertTriangle, Play, FileText } from "lucide-react"

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning'
  message: string
  details?: any
  duration?: number
}

interface TestSuite {
  name: string
  tests: TestResult[]
  status: 'pending' | 'running' | 'completed'
}

export default function CompleteAppTestPage() {
  const { user, profile } = useAuth()
  const { items: digitalCartItems, addItem } = useDigitalCart()
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState<string>('')

  const updateTestResult = (suiteName: string, testName: string, result: Partial<TestResult>) => {
    setTestSuites(prev => prev.map(suite => {
      if (suite.name === suiteName) {
        return {
          ...suite,
          tests: suite.tests.map(test => 
            test.name === testName ? { ...test, ...result } : test
          )
        }
      }
      return suite
    }))
  }

  const runTest = async (suiteName: string, testName: string, testFn: () => Promise<TestResult>) => {
    setCurrentTest(`${suiteName}: ${testName}`)
    updateTestResult(suiteName, testName, { status: 'running' })
    
    const startTime = Date.now()
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      updateTestResult(suiteName, testName, { ...result, duration })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult(suiteName, testName, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      return { name: testName, status: 'failed' as const, message: 'Test execution failed' }
    }
  }

  const testAuthentication = async (): Promise<TestResult> => {
    if (!user) {
      return { name: 'User Authentication', status: 'failed', message: 'No user logged in' }
    }
    if (!profile) {
      return { name: 'User Profile', status: 'warning', message: 'User logged in but no profile loaded' }
    }
    return { 
      name: 'Authentication', 
      status: 'passed', 
      message: `User authenticated: ${user.email} (${profile.role})`,
      details: { userId: user.id, role: profile.role }
    }
  }

  const testDigitalCart = async (): Promise<TestResult> => {
    const testItem = {
      productId: 'test-product-123',
      designId: 'test-design-123',
      type: 'image' as const,
      name: 'Test AI Image',
      basePrice: 4.99,
      previewUrl: '/placeholder.svg',
      generationInputs: { prompt: 'test prompt' },
      selectedFormats: ['basic'],
      selectedLicense: 'personal',
      formatOptions: [{
        id: 'basic',
        name: 'Basic Package',
        description: 'PNG, JPG (1024x1024)',
        price: 0,
        included: true
      }],
      licenseOptions: [{
        id: 'personal',
        name: 'Personal Use',
        description: 'For non-commercial projects',
        price: 0,
        included: true
      }],
      downloadReady: false
    }

    const initialCount = digitalCartItems.length
    
    try {
      // Await the addItem call since it's now async
      await addItem(testItem)
      
      // Wait a bit more for React state to update
      await new Promise(resolve => setTimeout(resolve, 200))
      
      if (digitalCartItems.length > initialCount) {
        return { 
          name: 'Digital Cart', 
          status: 'passed', 
          message: `Successfully added item to cart. Cart now has ${digitalCartItems.length} items`,
          details: { initialCount, finalCount: digitalCartItems.length }
        }
      } else {
        return { 
          name: 'Digital Cart', 
          status: 'failed', 
          message: 'Failed to add item to digital cart - cart count unchanged',
          details: { initialCount, finalCount: digitalCartItems.length }
        }
      }
    } catch (error) {
      return { 
        name: 'Digital Cart', 
        status: 'failed', 
        message: `Cart operation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  const testAPIEndpoint = async (endpoint: string, expectedStatus: number = 200): Promise<TestResult> => {
    try {
      const response = await fetch(endpoint)
      const isSuccess = response.status === expectedStatus
      
      return {
        name: `API: ${endpoint}`,
        status: isSuccess ? 'passed' : 'failed',
        message: `Status: ${response.status} ${response.statusText}`,
        details: { 
          endpoint, 
          status: response.status, 
          statusText: response.statusText,
          contentType: response.headers.get('content-type')
        }
      }
    } catch (error) {
      return {
        name: `API: ${endpoint}`,
        status: 'failed',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  const testPageLoad = async (path: string): Promise<TestResult> => {
    try {
      const startTime = Date.now()
      const response = await fetch(`${window.location.origin}${path}`)
      const loadTime = Date.now() - startTime
      
      const isSuccess = response.ok
      const contentType = response.headers.get('content-type')
      const isHTML = contentType?.includes('text/html')
      
      return {
        name: `Page: ${path}`,
        status: isSuccess && isHTML ? 'passed' : 'warning',
        message: `Load time: ${loadTime}ms, Status: ${response.status}`,
        details: { path, loadTime, status: response.status, contentType }
      }
    } catch (error) {
      return {
        name: `Page: ${path}`,
        status: 'failed',
        message: `Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  const runCompleteTest = async () => {
    setIsRunning(true)
    setProgress(0)
    setReport('')
    
    const suites: TestSuite[] = [
      {
        name: 'Authentication & User Management',
        status: 'pending',
        tests: [
          { name: 'User Authentication', status: 'pending', message: '' },
          { name: 'User Profile Loading', status: 'pending', message: '' },
          { name: 'Role-based Access', status: 'pending', message: '' }
        ]
      },
      {
        name: 'Digital Cart System',
        status: 'pending',
        tests: [
          { name: 'Cart Context Loading', status: 'pending', message: '' },
          { name: 'Add Item to Cart', status: 'pending', message: '' },
          { name: 'Cart Persistence', status: 'pending', message: '' },
          { name: 'Cart State Management', status: 'pending', message: '' }
        ]
      },
      {
        name: 'Core Pages',
        status: 'pending',
        tests: [
          { name: 'Home Page', status: 'pending', message: '' },
          { name: 'Products Page', status: 'pending', message: '' },
          { name: 'AI Studio', status: 'pending', message: '' },
          { name: 'Dashboard', status: 'pending', message: '' },
          { name: 'Digital Cart Page', status: 'pending', message: '' },
          { name: 'Checkout Page', status: 'pending', message: '' }
        ]
      },
      {
        name: 'API Endpoints',
        status: 'pending',
        tests: [
          { name: 'Digital Products API', status: 'pending', message: '' },
          { name: 'Orders API', status: 'pending', message: '' },
          { name: 'AI Generation API', status: 'pending', message: '' },
          { name: 'Debug Endpoints', status: 'pending', message: '' }
        ]
      },
      {
        name: 'AI Studio Features',
        status: 'pending',
        tests: [
          { name: 'Image Generator Page', status: 'pending', message: '' },
          { name: 'Logo Generator Page', status: 'pending', message: '' },
          { name: 'Font Generator Page', status: 'pending', message: '' }
        ]
      }
    ]

    setTestSuites(suites)
    
    let totalTests = 0
    let completedTests = 0
    
    suites.forEach(suite => {
      totalTests += suite.tests.length
    })

    // Run Authentication Tests
    await runTest('Authentication & User Management', 'User Authentication', testAuthentication)
    completedTests++
    setProgress((completedTests / totalTests) * 100)

    // Run Digital Cart Tests
    await runTest('Digital Cart System', 'Add Item to Cart', testDigitalCart)
    completedTests++
    setProgress((completedTests / totalTests) * 100)

    // Test Core Pages
    const corePages = ['/', '/products', '/ai-studio', '/dashboard', '/digital-cart', '/checkout']
    for (const page of corePages) {
      const pageName = page === '/' ? 'Home Page' : page.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Page'
      await runTest('Core Pages', pageName, () => testPageLoad(page))
      completedTests++
      setProgress((completedTests / totalTests) * 100)
    }

    // Test API Endpoints
    const apiEndpoints = [
      '/api/digital-products',
      '/api/orders',
      '/api/ai/generate',
      '/api/debug/order-access'
    ]
    
    for (const endpoint of apiEndpoints) {
      const endpointName = endpoint.split('/').pop()?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' API' || endpoint
      await runTest('API Endpoints', endpointName, () => testAPIEndpoint(endpoint, endpoint.includes('debug') ? 400 : 200))
      completedTests++
      setProgress((completedTests / totalTests) * 100)
    }

    // Test AI Studio Pages
    const aiPages = ['/ai-studio/image', '/ai-studio/logo', '/ai-studio/font']
    for (const page of aiPages) {
      const pageName = page.split('/').pop()?.replace(/\b\w/g, l => l.toUpperCase()) + ' Generator Page' || page
      await runTest('AI Studio Features', pageName, () => testPageLoad(page))
      completedTests++
      setProgress((completedTests / totalTests) * 100)
    }

    // Generate Report
    generateReport()
    setIsRunning(false)
    setCurrentTest('')
  }

  const generateReport = () => {
    let reportText = `# Print-on-Demand Application Test Report\n\n`
    reportText += `**Generated:** ${new Date().toLocaleString()}\n`
    reportText += `**User:** ${user?.email || 'Not logged in'} (${profile?.role || 'No role'})\n\n`

    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    let warningTests = 0

    testSuites.forEach(suite => {
      reportText += `## ${suite.name}\n\n`
      
      suite.tests.forEach(test => {
        totalTests++
        const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : test.status === 'warning' ? '⚠️' : '⏳'
        reportText += `${icon} **${test.name}**: ${test.message}`
        
        if (test.duration) {
          reportText += ` (${test.duration}ms)`
        }
        
        reportText += '\n'
        
        if (test.details) {
          reportText += `   - Details: ${JSON.stringify(test.details, null, 2)}\n`
        }
        
        if (test.status === 'passed') passedTests++
        else if (test.status === 'failed') failedTests++
        else if (test.status === 'warning') warningTests++
      })
      
      reportText += '\n'
    })

    reportText += `## Summary\n\n`
    reportText += `- **Total Tests:** ${totalTests}\n`
    reportText += `- **Passed:** ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`
    reportText += `- **Failed:** ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)\n`
    reportText += `- **Warnings:** ${warningTests} (${((warningTests/totalTests)*100).toFixed(1)}%)\n\n`

    if (failedTests > 0) {
      reportText += `## Critical Issues\n\n`
      testSuites.forEach(suite => {
        suite.tests.forEach(test => {
          if (test.status === 'failed') {
            reportText += `- **${test.name}**: ${test.message}\n`
          }
        })
      })
      reportText += '\n'
    }

    if (warningTests > 0) {
      reportText += `## Warnings\n\n`
      testSuites.forEach(suite => {
        suite.tests.forEach(test => {
          if (test.status === 'warning') {
            reportText += `- **${test.name}**: ${test.message}\n`
          }
        })
      })
      reportText += '\n'
    }

    reportText += `## Recommendations\n\n`
    
    if (failedTests > 0) {
      reportText += `1. **Address Critical Failures**: ${failedTests} tests failed and require immediate attention.\n`
    }
    
    if (!user) {
      reportText += `2. **Authentication Required**: Many tests require user authentication to run properly.\n`
    }
    
    if (digitalCartItems.length === 0) {
      reportText += `3. **Digital Cart Testing**: Cart appears empty - test cart functionality with actual items.\n`
    }
    
    reportText += `4. **Performance**: Monitor page load times and API response times for optimization opportunities.\n`
    reportText += `5. **Error Handling**: Ensure all failed endpoints have proper error handling and user feedback.\n`

    setReport(reportText)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
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
      <Badge variant={variants[status] || 'outline'} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Application Testing</h1>
        <p className="text-gray-600">Comprehensive testing suite for the Print-on-Demand application</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Test Controls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>User:</strong> {user?.email || 'Not logged in'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Role:</strong> {profile?.role || 'No role'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Cart Items:</strong> {digitalCartItems.length}
                </p>
              </div>
              
              <Button 
                onClick={runCompleteTest} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? 'Running Tests...' : 'Start Complete Test'}
              </Button>
              
              {isRunning && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">{currentTest}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {testSuites.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tests run yet. Click "Start Complete Test" to begin.</p>
              ) : (
                <div className="space-y-6">
                  {testSuites.map((suite, suiteIndex) => (
                    <div key={suiteIndex} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">{suite.name}</h3>
                      <div className="space-y-2">
                        {suite.tests.map((test, testIndex) => (
                          <div key={testIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(test.status)}
                              <span className="text-sm">{test.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{test.message}</span>
                              {getStatusBadge(test.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Report */}
      {report && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={report} 
              readOnly 
              className="h-96 font-mono text-sm"
              placeholder="Test report will appear here after running tests..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}