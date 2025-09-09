'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface PerformanceMetrics {
  authLoadTime: number
  pageLoadTime: number
  apiResponseTimes: { [key: string]: number }
  errors: string[]
  warnings: string[]
}

export default function PerformanceMonitor() {
  const { user, profile, loading } = useAuth()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    authLoadTime: 0,
    pageLoadTime: 0,
    apiResponseTimes: {},
    errors: [],
    warnings: []
  })
  const [startTime] = useState(performance.now())
  const [authStartTime] = useState(performance.now())
  const [isVisible, setIsVisible] = useState(true) // Show by default in dev

  useEffect(() => {
    // Monitor auth loading time with high precision
    if (!loading && user !== undefined) {
      const authTime = performance.now() - authStartTime
      const warnings: string[] = []
      
      if (authTime > 3000) {
        warnings.push(`Auth took ${authTime.toFixed(0)}ms (>3s)`)
      }
      
      if (authTime > 10000) {
        warnings.push(`Auth took ${authTime.toFixed(0)}ms (>10s) - Critical`)
      }
      
      setMetrics(prev => ({ 
        ...prev, 
        authLoadTime: authTime,
        warnings: [...prev.warnings, ...warnings]
      }))
    }
  }, [loading, user, authStartTime])

  useEffect(() => {
    // Monitor page load time with high precision
    const pageTime = performance.now() - startTime
    setMetrics(prev => ({ ...prev, pageLoadTime: pageTime }))
    
    if (pageTime > 5000) {
      setMetrics(prev => ({
        ...prev,
        warnings: [...prev.warnings, `Page load took ${pageTime}ms (>5s)`]
      }))
    }
  }, [startTime])

  useEffect(() => {
    // Monitor for stuck loading states
    const checkStuckLoading = () => {
      if (loading && Date.now() - authStartTime > 10000) {
        setMetrics(prev => ({
          ...prev,
          errors: [...prev.errors, 'Auth stuck in loading state for >10s']
        }))
      }
    }

    const interval = setInterval(checkStuckLoading, 1000)
    return () => clearInterval(interval)
  }, [loading, authStartTime])

  const getStatusColor = () => {
    if (metrics.errors.length > 0) return 'destructive'
    if (metrics.warnings.length > 0) return 'secondary'
    return 'default'
  }

  const getStatusIcon = () => {
    if (metrics.errors.length > 0) return <AlertTriangle className="h-4 w-4" />
    if (metrics.warnings.length > 0) return <Clock className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const clearMetrics = () => {
    setMetrics({
      authLoadTime: 0,
      pageLoadTime: 0,
      apiResponseTimes: {},
      errors: [],
      warnings: []
    })
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-white shadow-lg"
        >
          <Clock className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Performance Monitor</CardTitle>
            <div className="flex gap-2">
              <Badge variant={getStatusColor()} className="text-xs">
                {getStatusIcon()}
                {metrics.errors.length > 0 ? 'Issues' : 
                 metrics.warnings.length > 0 ? 'Warnings' : 'Good'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Auth Status */}
          <div className="space-y-1">
            <div className="font-medium">Authentication</div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={loading ? 'text-yellow-600' : user ? 'text-green-600' : 'text-red-600'}>
                {loading ? 'Loading...' : user ? 'Authenticated' : 'Not authenticated'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Load Time:</span>
              <span className={metrics.authLoadTime > 3000 ? 'text-red-600' : 'text-green-600'}>
                {metrics.authLoadTime}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>Profile:</span>
              <span className={profile ? 'text-green-600' : 'text-yellow-600'}>
                {profile ? profile.role : 'Loading...'}
              </span>
            </div>
          </div>

          {/* Page Performance */}
          <div className="space-y-1">
            <div className="font-medium">Page Performance</div>
            <div className="flex justify-between">
              <span>Load Time:</span>
              <span className={metrics.pageLoadTime > 5000 ? 'text-red-600' : 'text-green-600'}>
                {metrics.pageLoadTime}ms
              </span>
            </div>
          </div>

          {/* Errors */}
          {metrics.errors.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium text-red-600">Errors</div>
              {metrics.errors.map((error, index) => (
                <div key={index} className="text-red-600 text-xs">
                  • {error}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {metrics.warnings.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium text-yellow-600">Warnings</div>
              {metrics.warnings.map((warning, index) => (
                <div key={index} className="text-yellow-600 text-xs">
                  • {warning}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearMetrics}
              className="flex-1 h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex-1 h-7 text-xs"
            >
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}