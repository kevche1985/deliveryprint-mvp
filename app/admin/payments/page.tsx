"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertCircle,
  CheckCircle,
  Settings,
  TestTube,
  CreditCard,
  Loader2,
  Eye,
  EyeOff,
  Play,
  Save,
  RefreshCw,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type PaymentProvider = {
  id: string
  provider_name: string
  display_name: string
  is_active: boolean
  is_test_mode: boolean
  api_key: string
  api_secret: string
  webhook_url: string
  webhook_secret: string
  endpoints: Record<string, any>
  additional_settings: Record<string, any>
  created_at: string
  updated_at: string
}

type TestResult = {
  success: boolean
  message: string
  response_time?: number
  status_code?: number
  response_data?: any
  error_details?: string
}

type APITestRequest = {
  method: "GET" | "POST"
  endpoint: string
  headers: Record<string, string>
  body?: string
  auth_type: "none" | "bearer" | "basic" | "api_key"
  auth_value?: string
}

export default function PaymentsPage() {
  const [providers, setProviders] = useState<PaymentProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [showSecrets, setShowSecrets] = useState(false)
  const [activeTab, setActiveTab] = useState("configuration")

  // API Testing State
  const [apiTest, setApiTest] = useState<APITestRequest>({
    method: "GET",
    endpoint: "",
    headers: {},
    body: "",
    auth_type: "none",
    auth_value: "",
  })
  const [apiTestResult, setApiTestResult] = useState<TestResult | null>(null)
  const [customHeaders, setCustomHeaders] = useState("")
  const [testingApi, setTestingApi] = useState(false)

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      const response = await fetch("/api/admin/payments")
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
        if (data.length > 0 && !selectedProvider) {
          setSelectedProvider(data[0])
        }
      }
    } catch (error) {
      console.error("Error loading providers:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveProvider = async () => {
    if (!selectedProvider) return

    setSaving(true)
    try {
      const response = await fetch("/api/admin/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedProvider),
      })

      if (response.ok) {
        await loadProviders()
        setTestResults({ success: true, message: "Provider configuration saved successfully!" })
      } else {
        throw new Error("Failed to save provider")
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: "Failed to save provider configuration",
        error_details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    if (!selectedProvider) return

    setTesting(true)
    try {
      const response = await fetch("/api/admin/payments/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider }),
      })

      const result = await response.json()
      setTestResults(result)
    } catch (error) {
      setTestResults({
        success: false,
        message: "Connection test failed",
        error_details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setTesting(false)
    }
  }

  const testCustomAPI = async () => {
    // Validate required fields
    if (!apiTest.endpoint.trim()) {
      setApiTestResult({
        success: false,
        message: "API endpoint is required",
        error_details: "Please enter a valid API endpoint URL",
      })
      return
    }

    setTestingApi(true)
    setApiTestResult(null) // Clear previous results

    try {
      // Parse custom headers
      let headers = { "Content-Type": "application/json" }
      if (customHeaders.trim()) {
        try {
          const customHeadersObj = JSON.parse(customHeaders)
          headers = { ...headers, ...customHeadersObj }
        } catch (e) {
          throw new Error("Invalid JSON in custom headers")
        }
      }

      // Add authentication based on selected type
      if (apiTest.auth_type === "bearer" && apiTest.auth_value) {
        headers["Authorization"] = `Bearer ${apiTest.auth_value}`
      } else if (apiTest.auth_type === "basic" && apiTest.auth_value) {
        headers["Authorization"] = `Basic ${btoa(apiTest.auth_value)}`
      } else if (apiTest.auth_type === "api_key" && apiTest.auth_value) {
        headers["X-API-Key"] = apiTest.auth_value
      }

      const startTime = Date.now()

      const requestOptions: RequestInit = {
        method: apiTest.method,
        headers,
      }

      // Add request body for POST requests
      if (apiTest.method === "POST" && apiTest.body.trim()) {
        try {
          // Validate JSON if body is provided
          JSON.parse(apiTest.body)
          requestOptions.body = apiTest.body
        } catch (e) {
          throw new Error("Invalid JSON in request body")
        }
      }

      console.log("Executing API call with parameters:", {
        method: apiTest.method,
        endpoint: apiTest.endpoint,
        headers: Object.keys(headers),
        hasBody: !!requestOptions.body,
        authType: apiTest.auth_type,
      })

      const response = await fetch(apiTest.endpoint, requestOptions)
      const responseTime = Date.now() - startTime
      const responseData = await response.text()

      let parsedData
      try {
        parsedData = JSON.parse(responseData)
      } catch {
        parsedData = responseData
      }

      setApiTestResult({
        success: response.ok,
        message: response.ok ? "API call successful" : `API call failed with status ${response.status}`,
        response_time: responseTime,
        status_code: response.status,
        response_data: parsedData,
      })
    } catch (error) {
      setApiTestResult({
        success: false,
        message: "API call failed",
        error_details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setTestingApi(false)
    }
  }

  const updateProviderField = (field: string, value: any) => {
    if (!selectedProvider) return
    setSelectedProvider({ ...selectedProvider, [field]: value })
  }

  const updateEndpoint = (key: string, value: string) => {
    if (!selectedProvider) return
    setSelectedProvider({
      ...selectedProvider,
      endpoints: { ...selectedProvider.endpoints, [key]: value },
    })
  }

  const updateAdditionalSetting = (key: string, value: any) => {
    if (!selectedProvider) return
    setSelectedProvider({
      ...selectedProvider,
      additional_settings: { ...selectedProvider.additional_settings, [key]: value },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Processors</h1>
        <p className="text-gray-600">Configure and manage payment provider integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Provider Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Payment Providers</CardTitle>
            <CardDescription>Select a provider to configure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedProvider?.id === provider.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{provider.display_name}</h3>
                    <p className="text-sm text-gray-500">{provider.provider_name}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={provider.is_active ? "default" : "secondary"}>
                      {provider.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {provider.is_test_mode && (
                      <Badge variant="outline" className="text-xs">
                        Test
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <div className="lg:col-span-3">
          {selectedProvider ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="configuration">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="testing">
                  <TestTube className="h-4 w-4 mr-2" />
                  Connection Test
                </TabsTrigger>
                <TabsTrigger value="api-testing">
                  <Play className="h-4 w-4 mr-2" />
                  API Testing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="configuration" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      {selectedProvider.display_name} Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure API credentials and settings for {selectedProvider.display_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedProvider.is_active}
                          onCheckedChange={(checked) => updateProviderField("is_active", checked)}
                        />
                        <div>
                          <Label>Enable Provider</Label>
                          <p className="text-xs text-gray-500">
                            When disabled, this payment method won't appear in checkout
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedProvider.is_test_mode}
                          onCheckedChange={(checked) => updateProviderField("is_test_mode", checked)}
                        />
                        <Label>Test Mode</Label>
                      </div>
                    </div>

                    {/* API Credentials */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">API Credentials</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="api_key">API Key / Client ID</Label>
                          <div className="relative">
                            <Input
                              id="api_key"
                              type={showSecrets ? "text" : "password"}
                              value={selectedProvider.api_key || ""}
                              onChange={(e) => updateProviderField("api_key", e.target.value)}
                              placeholder="Enter API key or client ID"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowSecrets(!showSecrets)}
                            >
                              {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="api_secret">API Secret / Client Secret</Label>
                          <Input
                            id="api_secret"
                            type={showSecrets ? "text" : "password"}
                            value={selectedProvider.api_secret || ""}
                            onChange={(e) => updateProviderField("api_secret", e.target.value)}
                            placeholder="Enter API secret or client secret"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Webhook Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Webhook Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="webhook_url">Webhook URL</Label>
                          <Input
                            id="webhook_url"
                            value={selectedProvider.webhook_url || ""}
                            onChange={(e) => updateProviderField("webhook_url", e.target.value)}
                            placeholder="https://yoursite.com/webhooks/payments"
                          />
                        </div>
                        <div>
                          <Label htmlFor="webhook_secret">Webhook Secret</Label>
                          <Input
                            id="webhook_secret"
                            type={showSecrets ? "text" : "password"}
                            value={selectedProvider.webhook_secret || ""}
                            onChange={(e) => updateProviderField("webhook_secret", e.target.value)}
                            placeholder="Enter webhook secret"
                          />
                        </div>
                      </div>
                    </div>

                    {/* API Endpoints */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">API Endpoints</h3>
                      <div className="space-y-3">
                        {Object.entries(selectedProvider.endpoints || {}).map(([key, value]) => (
                          <div key={key}>
                            <Label htmlFor={`endpoint_${key}`}>{key.replace(/_/g, " ").toUpperCase()}</Label>
                            <Input
                              id={`endpoint_${key}`}
                              value={value as string}
                              onChange={(e) => updateEndpoint(key, e.target.value)}
                              placeholder={`Enter ${key} endpoint`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Additional Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedProvider.additional_settings || {}).map(([key, value]) => (
                          <div key={key}>
                            <Label htmlFor={`setting_${key}`}>{key.replace(/_/g, " ").toUpperCase()}</Label>
                            {typeof value === "boolean" ? (
                              <div className="flex items-center space-x-2 mt-2">
                                <Switch
                                  checked={value}
                                  onCheckedChange={(checked) => updateAdditionalSetting(key, checked)}
                                />
                                <Label>{value ? "Enabled" : "Disabled"}</Label>
                              </div>
                            ) : Array.isArray(value) ? (
                              <Input
                                id={`setting_${key}`}
                                value={value.join(", ")}
                                onChange={(e) => updateAdditionalSetting(key, e.target.value.split(", "))}
                                placeholder="Enter comma-separated values"
                              />
                            ) : (
                              <Input
                                id={`setting_${key}`}
                                value={value as string}
                                onChange={(e) => updateAdditionalSetting(key, e.target.value)}
                                placeholder={`Enter ${key}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={loadProviders}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button onClick={saveProvider} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Configuration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="testing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Connection Testing</CardTitle>
                    <CardDescription>
                      Test the connection and authentication with {selectedProvider.display_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={testConnection} disabled={testing} className="w-full">
                      {testing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Test Connection
                    </Button>

                    {testResults && (
                      <Alert className={testResults.success ? "border-green-500" : "border-red-500"}>
                        {testResults.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">{testResults.message}</p>
                            {testResults.response_time && (
                              <p className="text-sm">Response time: {testResults.response_time}ms</p>
                            )}
                            {testResults.status_code && (
                              <p className="text-sm">Status code: {testResults.status_code}</p>
                            )}
                            {testResults.error_details && (
                              <p className="text-sm text-red-600">Error: {testResults.error_details}</p>
                            )}
                            {testResults.response_data && (
                              <details className="text-sm">
                                <summary className="cursor-pointer">Response Data</summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                  {JSON.stringify(testResults.response_data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api-testing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Testing Framework</CardTitle>
                    <CardDescription>
                      Test custom API calls with different methods, headers, and authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Request Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="method">HTTP Method</Label>
                        <Select
                          value={apiTest.method}
                          onValueChange={(value: "GET" | "POST") => setApiTest({ ...apiTest, method: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="endpoint">API Endpoint</Label>
                        <Input
                          id="endpoint"
                          value={apiTest.endpoint}
                          onChange={(e) => setApiTest({ ...apiTest, endpoint: e.target.value })}
                          placeholder="https://api.example.com/endpoint"
                        />
                      </div>
                    </div>

                    {/* Authentication */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Authentication</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="auth_type">Authentication Type</Label>
                          <Select
                            value={apiTest.auth_type}
                            onValueChange={(value: any) => setApiTest({ ...apiTest, auth_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="bearer">Bearer Token</SelectItem>
                              <SelectItem value="basic">Basic Auth</SelectItem>
                              <SelectItem value="api_key">API Key</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {apiTest.auth_type !== "none" && (
                          <div>
                            <Label htmlFor="auth_value">
                              {apiTest.auth_type === "bearer" && "Bearer Token"}
                              {apiTest.auth_type === "basic" && "Username:Password"}
                              {apiTest.auth_type === "api_key" && "API Key"}
                            </Label>
                            <Input
                              id="auth_value"
                              type="password"
                              value={apiTest.auth_value || ""}
                              onChange={(e) => setApiTest({ ...apiTest, auth_value: e.target.value })}
                              placeholder="Enter authentication value"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Headers */}
                    <div>
                      <Label htmlFor="headers">Custom Headers (JSON)</Label>
                      <Textarea
                        id="headers"
                        value={customHeaders}
                        onChange={(e) => setCustomHeaders(e.target.value)}
                        placeholder='{"X-Custom-Header": "value", "Accept": "application/json"}'
                        rows={3}
                      />
                    </div>

                    {/* Request Body */}
                    {apiTest.method === "POST" && (
                      <div>
                        <Label htmlFor="body">Request Body (JSON)</Label>
                        <Textarea
                          id="body"
                          value={apiTest.body}
                          onChange={(e) => setApiTest({ ...apiTest, body: e.target.value })}
                          placeholder='{"key": "value"}'
                          rows={4}
                        />
                      </div>
                    )}

                    <Button onClick={testCustomAPI} disabled={testingApi} className="w-full">
                      {testingApi ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Execute API Call
                    </Button>

                    {/* API Test Results */}
                    {apiTestResult && (
                      <Alert className={apiTestResult.success ? "border-green-500" : "border-red-500"}>
                        {apiTestResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">{apiTestResult.message}</p>
                            {apiTestResult.response_time && (
                              <p className="text-sm">Response time: {apiTestResult.response_time}ms</p>
                            )}
                            {apiTestResult.status_code && (
                              <p className="text-sm">Status code: {apiTestResult.status_code}</p>
                            )}
                            {apiTestResult.error_details && (
                              <p className="text-sm text-red-600">Error: {apiTestResult.error_details}</p>
                            )}
                            {apiTestResult.response_data && (
                              <details className="text-sm">
                                <summary className="cursor-pointer">Response Data</summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                                  {JSON.stringify(apiTestResult.response_data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-gray-500">Select a payment provider to configure</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
