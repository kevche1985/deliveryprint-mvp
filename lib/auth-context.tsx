"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type UserProfile = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: "admin" | "operator" | "customer" | "supplier"
  status: "active" | "suspended" | "pending"
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  role: string
  canManageStatus: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
}

type SignUpData = {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "customer" | "supplier"
}

// Create default context value to prevent null errors
const defaultContextValue: AuthContextType = {
  user: null,
  profile: null,
  loading: true,
  role: "customer",
  canManageStatus: false,
  signIn: async () => { throw new Error('Auth not initialized') },
  signUp: async () => { throw new Error('Auth not initialized') },
  signOut: async () => { throw new Error('Auth not initialized') },
  refreshRole: async () => { throw new Error('Auth not initialized') },
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ALL HOOKS FIRST
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string>("customer")
  const [canManageStatus, setCanManageStatus] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const router = useRouter()

  // ALL FUNCTION DEFINITIONS NEXT (BEFORE ANY RETURNS)
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in:", email)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw error
      }

      console.log("Sign in successful")

      // Redirect based on role
      setTimeout(() => {
        if (email === "admin@example.com") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }, 1000)
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (data: SignUpData) => {
    // ... your existing signUp implementation
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setRole("customer")
      setCanManageStatus(false)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleUserProfile = async (user: User) => {
    try {
      const startTime = performance.now()
      console.log('🔍 Fetching user profile for:', user.id)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      )
      
      // Fetch user profile from the database with timeout
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      const { data: profileData, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any

      const endTime = performance.now()
      const duration = endTime - startTime
      console.log(`⏱️ Profile fetch completed in ${duration.toFixed(2)}ms`)
      
      if (error) {
        console.error('❌ Error fetching profile:', error)
        // Set default profile if none exists
        const defaultProfile: UserProfile = {
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          role: 'customer',
          status: 'active'
        }
        setProfile(defaultProfile)
        setRole('customer')
        setCanManageStatus(false)
        console.log('✅ Using default profile for user')
      } else {
        setProfile(profileData)
        setRole(profileData.role)
        setCanManageStatus(profileData.role === 'admin' || profileData.role === 'operator')
        console.log(`✅ Profile loaded: ${profileData.role} user`)
      }
    } catch (error) {
      console.error('❌ Error in handleUserProfile:', error)
      if (error instanceof Error && error.message === 'Profile fetch timeout') {
        console.error('🚨 Profile fetch timed out after 10 seconds')
      }
      
      // Don't set initError for profile failures - use default profile instead
      console.log('⚠️ Profile fetch failed, using default profile')
      const defaultProfile: UserProfile = {
        id: user.id,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        email: user.email || '',
        role: 'customer',
        status: 'active'
      }
      setProfile(defaultProfile)
      setRole('customer')
      setCanManageStatus(false)
    }
  }

  const initializeAuth = async () => {
    try {
      const initStartTime = performance.now()
      console.log('🚀 Initializing authentication...')
      setLoading(true)
      
      // Get current session with timeout
      console.log('📡 Getting current session...')
      const sessionStartTime = performance.now()
      const { data: { session }, error } = await supabase.auth.getSession()
      const sessionEndTime = performance.now()
      console.log(`⏱️ Session fetch completed in ${(sessionEndTime - sessionStartTime).toFixed(2)}ms`)
      
      if (error) {
        console.error('❌ Error getting session:', error)
        console.log('⚠️ Session fetch failed, continuing with logged-out state')
        // Don't set initError - just continue with no session
        setUser(null)
        setProfile(null)
        setRole('customer')
        setCanManageStatus(false)
        setLoading(false)
        return
      }

      if (session?.user) {
        console.log('✅ User session found:', session.user.id)
        setUser(session.user)
        console.log('👤 Loading user profile...')
        await handleUserProfile(session.user)
      } else {
        console.log('ℹ️ No active session found')
        setUser(null)
        setProfile(null)
        setRole('customer')
        setCanManageStatus(false)
      }

      // Set up auth state change listener
      console.log('🔄 Setting up auth state listener...')
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.id)
          
          if (session?.user) {
            setUser(session.user)
            await handleUserProfile(session.user)
          } else {
            setUser(null)
            setProfile(null)
            setRole('customer')
            setCanManageStatus(false)
          }
        }
      )
      
      const initEndTime = performance.now()
      console.log(`🎉 Auth initialization completed in ${(initEndTime - initStartTime).toFixed(2)}ms`)

      // Cleanup function will be handled by the component unmount
      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error)
      console.log('⚠️ Auth initialization failed, continuing with logged-out state')
      // Don't set initError - just ensure clean logged-out state
      setUser(null)
      setProfile(null)
      setRole('customer')
      setCanManageStatus(false)
    } finally {
      setLoading(false)
    }
  }

  const refreshRole = async () => {
    if (user) {
      await handleUserProfile(user)
    }
  }

  // ALL useEffect HOOKS
  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    // Reduce frequency and add error handling for session checks
    const interval = setInterval(async () => {
      try {
        const startTime = performance.now()
        const { data: { session }, error } = await supabase.auth.getSession()
        const endTime = performance.now()
        
        if (error) {
          console.error('❌ Session check error:', error)
          return
        }
        
        console.log(`⏱️ Session check completed in ${(endTime - startTime).toFixed(2)}ms`)
        
        if (!session && user) {
          console.log('🔄 Session expired, redirecting to login')
          setUser(null)
          setProfile(null)
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('❌ Session check failed:', error)
      }
    }, 300000) // Increased to 5 minutes instead of 1 minute
    
    return () => clearInterval(interval)
  }, [user, router])

  // CONDITIONAL LOGIC LAST (AFTER ALL HOOKS)
  const contextValue = {
    user: initError ? null : user,
    profile: initError ? null : profile,
    loading: initError ? false : loading,
    role: initError ? "customer" : role,
    canManageStatus: initError ? false : canManageStatus,
    signIn: initError ? async () => { throw new Error('Auth not available') } : signIn,
    signUp: initError ? async () => { throw new Error('Auth not available') } : signUp,
    signOut: initError ? async () => { throw new Error('Auth not available') } : signOut,
    refreshRole: initError ? async () => { throw new Error('Auth not available') } : refreshRole,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    console.error('useAuth called outside AuthProvider')
    return defaultContextValue
  }
  return context
}
