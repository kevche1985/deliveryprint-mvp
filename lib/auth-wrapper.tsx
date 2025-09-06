"use client"

import { useEffect, useState } from "react"
import { AuthProvider } from "@/lib/auth-context"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render AuthProvider during SSR
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}